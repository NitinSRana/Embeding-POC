// End-to-end smoke test over HTTP. Works against local or deployed:
//   node scripts/smoke.mjs [baseUrl] [--keep]          (default http://localhost:3000)
//   ACCESS_CODE=... node scripts/smoke.mjs https://your-app.vercel.app
// Creates "Smoke test" tours and deletes them at the end unless --keep is passed.
import zlib from 'node:zlib'

const args = process.argv.slice(2)
const BASE = (args.find((a) => !a.startsWith('--')) ?? 'http://localhost:3000').replace(/\/$/, '')
const KEEP = args.includes('--keep')
const CODE = process.env.ACCESS_CODE
const AUTH = CODE ? { Authorization: 'Basic ' + Buffer.from(`smoke:${CODE}`).toString('base64') } : {}
const results = []
const created = []
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

const get = (path, init = {}) => fetch(path.startsWith('http') ? path : `${BASE}${path}`, init)
const admin = (path, init = {}) => get(path, { ...init, headers: { ...AUTH, ...init.headers } })
const beacon = (body) => get('/api/e', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) })
const tile = (html, label) => Number(html.match(new RegExp(`${label}</div><div class="value">([\\d,]+)`))?.[1]?.replace(/,/g, ''))
const track = (id) => { if (id) created.push(id); return id }

// Multipart form upload (local flow; also used for validation checks everywhere).
async function uploadForm(title, files, description = 'Smoke test description') {
  const fd = new FormData()
  if (title !== null) fd.append('title', title)
  fd.append('description', description)
  for (const [name, type, bytes] of files) fd.append('photos', new Blob([bytes], { type }), name)
  const r = await admin('/api/tours', { method: 'POST', body: fd, redirect: 'manual' })
  return { status: r.status, id: track(r.headers.get('location')?.match(/\/tours\/([0-9a-f-]{36})/)?.[1]), text: r.status >= 400 ? await r.text() : '' }
}

// Deployed flow: token from /api/uploads, file straight to Vercel Blob, then JSON to /api/tours.
async function blobPut(pathname, bytes, contentType) {
  const { put } = await import('@vercel/blob')
  const r = await admin('/api/uploads', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'blob.generate-client-token', payload: { pathname, clientPayload: null, multipart: false } }) })
  const { clientToken } = await r.json()
  return (await put(pathname, bytes, { access: 'public', token: clientToken, contentType, multipart: bytes.length > 8e6 })).url
}
async function uploadBlob(title, files) {
  const folder = crypto.randomUUID()
  const photos = await Promise.all(files.map(([name, type, bytes], i) => blobPut(`tours/${folder}/${i}-${name}`, bytes, type)))
  return createJson(title, photos)
}
async function createJson(title, photos) {
  const r = await admin('/api/tours', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title, description: 'Smoke test description', photos }) })
  return { status: r.status, id: track(r.ok ? (await r.json()).id : null), text: r.ok ? '' : await r.text() }
}

const small = png(64, 48)
const XSS = 'Smoke test <img src=x onerror=alert(1)>'

try {
  // ---- Access and mode
  const probe = await admin('/api/uploads', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
  const blob = probe.status !== 501
  console.log(`Mode: ${blob ? 'Vercel Blob uploads' : 'local disk uploads'}${CODE ? ', access code on' : ''}\n`)
  check('Home page loads', (await admin('/')).status === 200)
  if (CODE) {
    check('Admin page without access code is refused', (await get('/')).status === 401)
    check('Upload API without access code is refused', (await get('/api/tours', { method: 'POST' })).status === 401)
  }

  // ---- Upload validation
  check('Upload without title is rejected', (await uploadForm(null, [['a.png', 'image/png', small]])).status === 400)
  check('Upload without photos is rejected', (await uploadForm('Smoke test no photos', [])).status === 400)
  check('Upload of a non-image is rejected', (await uploadForm('Smoke test text file', [['a.txt', 'text/plain', Buffer.from('hi')]])).status === 400)
  const svgFile = ['x.svg', 'image/svg+xml', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')]
  check('SVG upload is rejected (script-capable image type)', (await uploadForm('Smoke test svg', [svgFile])).status === 400)
  check('Tour from photo URLs not in our storage is rejected', (await createJson('Smoke test foreign', ['https://example.com/x.png'])).status === 400)

  let up
  if (blob) {
    let svgBlocked = false
    try { await blobPut(`tours/${crypto.randomUUID()}/x.svg`, svgFile[2], svgFile[1]) } catch { svgBlocked = true }
    check('SVG direct-to-Blob upload is blocked', svgBlocked)
    const big = await uploadBlob('Smoke test 12MB upload', [['big1.png', 'image/png', png(2000, 1000, true)], ['big2.png', 'image/png', png(2000, 1000, true)]])
    check('12 MB tour uploads straight to Blob', big.status === 201 && big.id, `got ${big.status} ${big.text.slice(0, 80)}`)
    up = await uploadBlob(XSS, [['one.png', 'image/png', small], ['two.png', 'image/png', small]])
    check('Valid Blob upload creates the tour', up.status === 201 && up.id, `got ${up.status} ${up.text.slice(0, 80)}`)
  } else {
    const big = await uploadForm('Smoke test 12MB upload', [['big1.png', 'image/png', png(2000, 1000, true)], ['big2.png', 'image/png', png(2000, 1000, true)]])
    check('12 MB upload (two phone-size photos) succeeds', big.status === 303 && big.id, `got ${big.status} ${big.text.slice(0, 80)}`)
    up = await uploadForm(XSS, [['one.png', 'image/png', small], ['two.jpg', 'image/jpeg', small]])
    check('Valid upload redirects to the tour page', up.status === 303 && up.id, `got ${up.status}`)
  }
  if (!up.id) throw new Error('No tour created; stopping')

  // ---- Tour page
  const tourHtml = await (await admin(`/tours/${up.id}`)).text()
  const link = tourHtml.match(/https?:\/\/[^"<\s]+\/t\/[A-Za-z0-9._-]+/)?.[0]
  check('Tour page shows a viewer link', link)
  check('Viewer link points at this site', link?.startsWith(BASE), `link=${link?.slice(0, 60)} (check PUBLIC_BASE_URL)`)
  check('Embed link is identical on reload', link && (await (await admin(`/tours/${up.id}`)).text()).includes(link))
  check('Unknown tour id returns 404', (await admin('/tours/00000000-0000-0000-0000-000000000000')).status === 404)
  check('Malformed tour id returns 404', (await admin('/tours/not-a-uuid')).status === 404)
  check('Tour page escapes HTML in the title', !tourHtml.includes('<img src=x onerror') && tourHtml.includes('&lt;img src=x onerror'))
  const adminCsp = (await admin(`/tours/${up.id}`)).headers.get('content-security-policy') ?? ''
  check('Admin pages cannot be framed by other sites', adminCsp.includes("frame-ancestors 'self'"), adminCsp || 'no CSP header')
  check('Tour page shows the JS widget snippet with the right token and script src', tourHtml.includes('deepvue-tour') && tourHtml.includes(link) && tourHtml.includes(`${BASE}/widget.js`))

  // ---- Widget script (public: no access code, correct for a <script src> load)
  const widgetJs = await get('/widget.js')
  const widgetJsBody = await widgetJs.text()
  check('Widget script is public and served as JS', widgetJs.status === 200 && (widgetJs.headers.get('content-type') ?? '').includes('javascript'), widgetJs.headers.get('content-type'))
  check('Widget script mounts .deepvue-tour elements via data-src', widgetJsBody.includes('deepvue-tour') && widgetJsBody.includes('data-src'))

  // ---- Viewer & token states (public: no access code)
  const token = link.split('/t/')[1]
  const viewer = await get(`/t/${token}`)
  const viewerHtml = await viewer.text()
  check('Viewer is public and renders the gallery', viewer.status === 200 && viewerHtml.includes('v-root'))

  // ---- Direct link opens a full page; iframe/widget get the bare gallery
  check('Direct link opens the standalone page with title and description', viewerHtml.includes('class="sa"') && viewerHtml.includes('sa-desc'))
  const framedByHeader = await (await get(`/t/${token}`, { headers: { 'Sec-Fetch-Dest': 'iframe' } })).text()
  check('Sec-Fetch-Dest: iframe renders the bare gallery', !framedByHeader.includes('class="sa"') && framedByHeader.includes('v-root'))
  const framedByParam = await (await get(`/t/${token}?e=1`)).text()
  check('?e=1 renders the bare gallery (fallback for browsers without the header)', !framedByParam.includes('class="sa"') && framedByParam.includes('v-root'))
  check('Viewer can be framed by any site', viewer.headers.get('content-security-policy') === 'frame-ancestors *', viewer.headers.get('content-security-policy'))
  check('Viewer escapes HTML in the title', !viewerHtml.includes('<img src=x onerror'))
  const ogImage = viewerHtml.match(/<meta property="og:image" content="([^"]+)"/)?.[1]
  check('Link preview tags present (og:title, og:image)', viewerHtml.includes('property="og:title"') && /^https?:\/\//.test(ogImage ?? ''), ogImage)

  // ---- oEmbed (lets WordPress-style platforms auto-embed a bare link past their iframe filter)
  const oembedHref = viewerHtml.match(/<link rel="alternate" type="application\/json\+oembed" href="([^"]+)"/)?.[1]?.replace(/&amp;/g, '&')
  check('oEmbed discovery tag present and absolute', /^https?:\/\//.test(oembedHref ?? ''), oembedHref)
  const oembed = oembedHref && (await get(oembedHref))
  const oembedBody = oembed && (await oembed.json())
  check('oEmbed responds with a valid rich embed', oembed?.status === 200 && oembedBody?.type === 'rich' && oembedBody?.html?.includes(`/t/${token}`), JSON.stringify(oembedBody))
  check('oEmbed rejects an unsupported format', (await get(oembedHref.replace('format=json', 'format=xml'))).status === 501)
  const sig = token.split('.')[2]
  const tampered = `${token.slice(0, -sig.length)}${sig[0] === 'A' ? 'B' : 'A'}${sig.slice(1)}`
  check('Tampered token shows "not valid"', (await (await get(`/t/${tampered}`)).text()).includes('link isn'))
  check('Garbage token shows "not valid"', (await (await get('/t/garbage')).text()).includes('link isn'))
  check('oEmbed rejects a tampered token', (await get(oembedHref.replace(encodeURIComponent(token), encodeURIComponent(tampered)))).status === 404)
  const photo = viewerHtml.match(/<img src="([^"]+)"/)?.[1]?.replace(/&amp;/g, '&')
  const photoRes = photo && (await get(photo))
  check('Uploaded photo is served as an image', photoRes?.status === 200 && photoRes.headers.get('content-type')?.startsWith('image/'), `${photo} → ${photoRes?.status} ${photoRes?.headers.get('content-type')}`)

  // ---- Info endpoint (used by the demo portal)
  const info = await (await get(`/t/${token}/info`)).json()
  check('Info endpoint returns tour details', info.title === XSS && info.photos === 2 && info.active === true, JSON.stringify(info))
  check('Info endpoint rejects tampered token', (await get(`/t/${tampered}/info`)).status === 404)

  // ---- Analytics beacon (public)
  const sid = 'smoke-' + Date.now()
  check('Beacon accepts a load event', (await beacon({ token, type: 'load', sid, referrer: 'https://portal.example/listing/1', refererHeader: null })).status === 204)
  check('Beacon accepts a click event', (await beacon({ token, type: 'click', sid, referrer: 'https://portal.example/listing/1' })).status === 204)
  check('Beacon rejects a tampered token', (await beacon({ token: tampered, type: 'load', sid })).status === 400)
  check('Beacon rejects an unknown event type', (await beacon({ token, type: 'purchase', sid })).status === 400)
  check('Beacon rejects malformed JSON', (await beacon('{not json')).status === 400)
  check('Beacon clips oversized fields', (await beacon({ token, type: 'click', sid: 'x'.repeat(5000), referrer: 'y'.repeat(50000) })).status === 204)
  const stats = await (await admin(`/tours/${up.id}`)).text()
  check('Analytics counts the load', tile(stats, 'Total views') === 1, `views=${tile(stats, 'Total views')}`)
  check('Analytics counts the clicks', tile(stats, 'Interactions') === 2, `clicks=${tile(stats, 'Interactions')}`)
  check('Analytics attributes the referring site', stats.includes('portal.example'))

  // ---- Source tagging: the attribution that survives rel="noreferrer" and link shorteners
  check('Beacon accepts a tagged event with no referrer at all', (await beacon({ token, type: 'load', sid: 'smoke-tagged', referrer: null, source: 'vivauae' })).status === 204)
  check('Beacon sanitises a junk source tag', (await beacon({ token, type: 'load', sid: 'smoke-junk', source: ' Property Finder!! <script>x</script> ' })).status === 204)
  check('Viewer accepts a ?s= tagged link', (await get(`/t/${token}?s=dubaisel`)).status === 200)
  const tagged = await (await admin(`/tours/${up.id}`)).text()
  check('Tagged views are attributed by tag, not referrer', tagged.includes('vivauae (tagged)'))
  check('Junk source tag is slugified before display', tagged.includes('property-finder') && !tagged.includes('<script>x</script>'))
  check('Embed screen offers the source picker', tagged.includes('Where are you posting this?'))

  // ---- Delete
  const del = await admin(`/api/tours/${up.id}`, { method: 'DELETE' })
  created.splice(created.indexOf(up.id), 1)
  check('Delete tour succeeds', del.status === 204, `got ${del.status}`)
  check('Deleted tour page returns 404', (await admin(`/tours/${up.id}`)).status === 404)
  check('Deleted tour embeds show "not valid"', (await (await get(`/t/${token}`)).text()).includes('link isn'))
  check('Deleted tour has no oEmbed discovery tag', !(await (await get(`/t/${token}`)).text()).includes('oembed'))
  check('oEmbed rejects a deleted tour', (await get(oembedHref)).status === 404)
  if (photo) {
    const gone = (await get(photo, { cache: 'no-store' })).status
    check('Deleted tour photos are removed', [403, 404].includes(gone), `${photo} → ${gone} (Blob CDN cache can lag up to a minute)`)
  }
} catch (e) {
  check('Smoke run completed', false, e.message)
} finally {
  if (!KEEP) for (const id of created) await admin(`/api/tours/${id}`, { method: 'DELETE' })
  if (created.length) console.log(KEEP ? `Kept test tours: ${created.join(', ')}` : `Cleaned up ${created.length} test tour(s)`)
  report()
}

function report() {
  const w = Math.max(...results.map((r) => r.name.length))
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name.padEnd(w)}  ${r.ok ? '' : r.detail}`)
  const failed = results.filter((r) => !r.ok).length
  console.log(`\n${results.length - failed}/${results.length} passed against ${BASE}`)
  if (failed) process.exitCode = 1
}
