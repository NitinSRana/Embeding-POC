// End-to-end smoke test over HTTP. Works against local or deployed:
//   node scripts/smoke.mjs [baseUrl]        (default http://localhost:3000)
// Creates tours titled "Smoke test ..." (delete them afterwards if the database is shared).
import zlib from 'node:zlib'

const BASE = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '')
const results = []
const check = (name, ok, detail = '') => results.push({ ok: !!ok, name, detail })

// Minimal valid PNG of any size (noise pixels so it doesn't compress away).
function png(w, h, noise = false) {
  const raw = Buffer.alloc((w * 3 + 1) * h)
  for (let i = 0; i < raw.length; i++) raw[i] = noise ? (Math.random() * 256) | 0 : (i * 7) & 255
  for (let y = 0; y < h; y++) raw[y * (w * 3 + 1)] = 0
  const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = table[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td))
    return Buffer.concat([len, td, c])
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: noise ? 0 : 6 })), chunk('IEND', Buffer.alloc(0))])
}

async function upload(title, files, description = 'Smoke test description') {
  const fd = new FormData()
  if (title !== null) fd.append('title', title)
  fd.append('description', description)
  for (const [name, type, bytes] of files) fd.append('photos', new Blob([bytes], { type }), name)
  const r = await fetch(`${BASE}/api/tours`, { method: 'POST', body: fd, redirect: 'manual' })
  return { status: r.status, id: r.headers.get('location')?.match(/\/tours\/([0-9a-f-]{36})/)?.[1], text: r.status >= 400 ? await r.text() : '' }
}
const get = (path, init) => fetch(path.startsWith('http') ? path : `${BASE}${path}`, init)
const beacon = (body) => get('/api/e', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) })
const tile = (html, label) => Number(html.match(new RegExp(`${label}</div><div class="value">([\\d,]+)`))?.[1]?.replace(/,/g, ''))

const small = png(64, 48)
const XSS = 'Smoke test <img src=x onerror=alert(1)>'

// ---- Upload validation
check('Home page loads', (await get('/')).status === 200)
check('Upload without title is rejected', (await upload(null, [['a.png', 'image/png', small]])).status === 400)
check('Upload without photos is rejected', (await upload('Smoke test no photos', [])).status === 400)
check('Upload of a non-image is rejected', (await upload('Smoke test text file', [['a.txt', 'text/plain', Buffer.from('hi')]])).status === 400)
const svg = await upload('Smoke test svg', [['x.svg', 'image/svg+xml', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')]])
check('SVG upload is rejected (script-capable image type)', svg.status === 400, `got ${svg.status}`)

const big = await upload('Smoke test 12MB upload', [['big1.png', 'image/png', png(2000, 1000, true)], ['big2.png', 'image/png', png(2000, 1000, true)]])
check('12 MB upload (two phone-size photos) succeeds', big.status === 303 && big.id, `got ${big.status} ${big.text.slice(0, 80)}`)

const up = await upload(XSS, [['one.png', 'image/png', small], ['two.jpg', 'image/jpeg', small]])
check('Valid upload redirects to the tour page', up.status === 303 && up.id, `got ${up.status}`)
if (!up.id) { report(); process.exit(1) }

// ---- Tour page
const tourHtml = await (await get(`/tours/${up.id}`)).text()
const link = tourHtml.match(/https?:\/\/[^"<\s]+\/t\/[A-Za-z0-9._-]+/)?.[0]
check('Tour page shows a viewer link', link)
const again = await (await get(`/tours/${up.id}`)).text()
check('Embed link is identical on reload', link && again.includes(link))
check('Unknown tour id returns 404', (await get('/tours/00000000-0000-0000-0000-000000000000')).status === 404)
check('Malformed tour id returns 404', (await get('/tours/not-a-uuid')).status === 404)
check('Tour page escapes HTML in the title', !tourHtml.includes('<img src=x onerror') && tourHtml.includes('&lt;img src=x onerror'))
const adminHeaders = (await get(`/tours/${up.id}`)).headers
check('Admin pages cannot be framed by other sites', /frame-ancestors 'self'|frame-ancestors 'none'/.test(adminHeaders.get('content-security-policy') ?? '') || /deny|sameorigin/i.test(adminHeaders.get('x-frame-options') ?? ''), adminHeaders.get('content-security-policy') ?? 'no CSP header')

// ---- Viewer & token states
const token = link.split('/t/')[1]
const viewer = await get(`/t/${token}`)
const viewerHtml = await viewer.text()
check('Viewer renders the gallery for a valid token', viewer.status === 200 && viewerHtml.includes('v-root'))
check('Viewer can be framed by any site', viewer.headers.get('content-security-policy') === 'frame-ancestors *', viewer.headers.get('content-security-policy'))
check('Viewer escapes HTML in the title', !viewerHtml.includes('<img src=x onerror'))
const sig = token.split('.')[2]
const tampered = `${token.slice(0, -sig.length)}${sig[0] === 'A' ? 'B' : 'A'}${sig.slice(1)}`
check('Tampered token shows "not valid"', (await (await get(`/t/${tampered}`)).text()).includes('link isn'))
check('Garbage token shows "not valid"', (await (await get('/t/garbage')).text()).includes('link isn'))
const photo = viewerHtml.match(/src="(\/uploads\/[^"]+)"/)?.[1]
const photoRes = photo && (await get(photo))
check('Uploaded photo is served with nosniff', photoRes?.status === 200 && photoRes.headers.get('x-content-type-options') === 'nosniff', photo)

// ---- Info endpoint (used by the demo portal)
const info = await (await get(`/t/${token}/info`)).json()
check('Info endpoint returns tour details', info.title === XSS && info.photos === 2 && info.active === true, JSON.stringify(info))
check('Info endpoint rejects tampered token', (await get(`/t/${tampered}/info`)).status === 404)

// ---- Analytics beacon
const sid = 'smoke-' + Date.now()
check('Beacon accepts a load event', (await beacon({ token, type: 'load', sid, referrer: 'https://portal.example/listing/1', refererHeader: null })).status === 204)
check('Beacon accepts a click event', (await beacon({ token, type: 'click', sid, referrer: 'https://portal.example/listing/1' })).status === 204)
check('Beacon rejects a tampered token', (await beacon({ token: tampered, type: 'load', sid })).status === 400)
check('Beacon rejects an unknown event type', (await beacon({ token, type: 'purchase', sid })).status === 400)
check('Beacon rejects malformed JSON', (await beacon('{not json')).status === 400)
check('Beacon clips oversized fields', (await beacon({ token, type: 'click', sid: 'x'.repeat(5000), referrer: 'y'.repeat(50000) })).status === 204)
const stats = await (await get(`/tours/${up.id}`)).text()
check('Analytics counts the load', tile(stats, 'Total views') === 1, `views=${tile(stats, 'Total views')}`)
check('Analytics counts the clicks', tile(stats, 'Interactions') === 2, `clicks=${tile(stats, 'Interactions')}`)
check('Analytics attributes the referring site', stats.includes('portal.example'))

report()

function report() {
  const w = Math.max(...results.map((r) => r.name.length))
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name.padEnd(w)}  ${r.ok ? '' : r.detail}`)
  const failed = results.filter((r) => !r.ok).length
  console.log(`\n${results.length - failed}/${results.length} passed against ${BASE}`)
  if (failed) process.exitCode = 1
}
