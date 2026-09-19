// Stand-in third-party property portal on a different origin.
// Usage: node host-test/serve.mjs [viewer link] [port], or paste the iframe code / link into the demo bar.
// Listing title and description come from the tour itself (DeepVue /t/TOKEN/info), so nothing is invented.
import http from 'node:http'

let link = process.argv[2] ?? ''
const port = Number(process.argv[3] ?? 4000)
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const valid = (s) => { try { return /^https?:$/.test(new URL(s).protocol) && s.includes('/t/') } catch { return false } }

const VARIANTS = [
  ['/listing', 'Standard page', 'No special headers', () => ({})],
  // Host blocks everything of its own except inline styles, and only allows framing our origin.
  ['/strict-csp', 'Strict CSP', 'Content-Security-Policy locks the page down', () => ({ 'Content-Security-Policy': `default-src 'none'; style-src 'unsafe-inline'; frame-src ${link ? new URL(link).origin : "'none'"}` })],
  ['/no-referrer', 'No referrer', 'Referrer-Policy: no-referrer', () => ({ 'Referrer-Policy': 'no-referrer' })],
  ['/widget', 'JS widget', 'Option C — lazy-mounts below the fold', () => ({})],
]

const tourIcon = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="m10 9 5 3-5 3Z"/></svg>`

// Fetched server-side, so the host page's own CSP doesn't affect it.
async function tourInfo() {
  if (!link) return null
  try {
    const u = new URL(link)
    const r = await fetch(`${u.origin}${u.pathname.replace(/\/$/, '')}/info`)
    return r.ok ? await r.json() : { error: 'This tour link is not valid.' }
  } catch {
    return { error: 'Could not reach DeepVue to load the tour details.' }
  }
}

const page = (path, info) => {
  const [, name, note] = VARIANTS.find((v) => v[0] === path)
  const title = info?.title ?? 'Property listing'
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Sample Portal</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:"Segoe UI",system-ui,-apple-system,Arial,sans-serif;color:#1f2933;background:#f4f5f7;font-size:15px;line-height:1.55}
a{color:#0f766e;text-decoration:none}a:hover{text-decoration:underline}
.demo{background:#111827;color:#e5e7eb;font-size:13px}
.demo-in{max-width:1160px;margin:0 auto;padding:10px 16px;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center}
.demo b{color:#fbbf24;letter-spacing:.06em;text-transform:uppercase;font-size:11px}
.tabs{display:flex;gap:4px;flex-wrap:wrap}.tabs a{color:#d1d5db;padding:4px 10px;border-radius:6px;border:1px solid #374151}
.tabs a.on{background:#fbbf24;color:#111827;border-color:#fbbf24;font-weight:600}.tabs a:hover{text-decoration:none;border-color:#6b7280}
.demo form{display:flex;gap:8px;align-items:center;flex:1 1 100%}.demo label{color:#fbbf24;font-weight:600;white-space:nowrap}.demo input{flex:1;min-width:0;padding:7px 10px;border-radius:6px;border:1.5px dashed #fbbf24;background:#fff;color:#111827;font:inherit}.demo input::placeholder{color:#6b7280}
.demo button{padding:7px 16px;border-radius:6px;border:0;background:#fbbf24;color:#111827;font-weight:600;font:inherit;cursor:pointer}
.nav{background:#fff;border-bottom:1px solid #e5e7eb}
.nav-in{max-width:1160px;margin:0 auto;padding:0 16px;height:64px;display:flex;align-items:center;gap:28px}
.brand{display:flex;align-items:center;gap:8px;font-weight:700;font-size:20px;color:#0f766e;letter-spacing:-.02em}
.brand i{width:30px;height:30px;border-radius:8px;background:#0f766e;display:grid;place-items:center;color:#fff;font-style:normal}
.wrap{max-width:1160px;margin:0 auto;padding:18px 16px 60px}
.crumbs{font-size:13px;color:#6b7280;margin-bottom:12px}
h1{font-size:26px;margin:0 0 6px;letter-spacing:-.01em;line-height:1.25}
.sub{color:#6b7280;font-size:14px;margin:0 0 18px}
.grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:24px;align-items:start}
.box{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px}
.box h2{font-size:18px;margin:0 0 12px}
.tourhead{display:flex;align-items:center;gap:8px;margin-bottom:12px}.tourhead h2{margin:0}.tourhead svg{color:#0f766e}
.badge{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#0f766e;background:#ccfbf1;padding:2px 8px;border-radius:99px}
.frame{border-radius:10px;overflow:hidden;background:#e5e7eb}.frame iframe{display:block}
.empty{padding:60px 20px;text-align:center;color:#6b7280;background:#f9fafb;border:1.5px dashed #d1d5db;border-radius:10px}
.warn{padding:12px 14px;border-radius:8px;background:#fef3f2;color:#b42318;font-size:14px;margin-bottom:18px}
.desc p{margin:0 0 10px;color:#374151;white-space:pre-line}.desc .url{overflow-wrap:anywhere}.desc .none{color:#9ca3af;font-style:italic}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:11px;border-radius:8px;font-weight:600;font-size:15px;margin-top:12px;border:1px solid #0f766e;background:#fff;color:#0f766e}
.btn:hover{text-decoration:none;background:#f0fdfa}
.tourlink{display:flex;gap:10px;align-items:center}.tourlink svg{color:#0f766e;flex:none}.tourlink div{min-width:0}
.tourlink small{display:block;color:#6b7280;font-size:12px}
.meta{font-size:13px;color:#6b7280;display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:0}.meta dd{margin:0;text-align:right;color:#111827}
.foot{text-align:center;color:#9ca3af;font-size:12px;padding:20px}
@media(max-width:900px){.grid{grid-template-columns:1fr}h1{font-size:21px}}
</style></head>
<body>
<div class="demo"><div class="demo-in">
  <b>Demo</b><span>This page stands in for a third-party portal. DeepVue does not control it.</span>
  <nav class="tabs">${VARIANTS.map(([p, n]) => `<a href="${p}"${p === path ? ' class="on"' : ''}>${n}</a>`).join('')}</nav>
  <form method="get"><label for="link">${link ? 'Change tour:' : 'Add tour:'}</label><input id="link" name="link" placeholder="Paste iframe code or direct link here" autocomplete="off" required><button>Load tour</button></form>
</div></div>

<header class="nav"><div class="nav-in"><span class="brand"><i>⌂</i>Sample Portal</span></div></header>

<main class="wrap">
  <div class="crumbs">Home › Listings${info?.title ? ` › ${esc(info.title)}` : ''}</div>
  <h1>${esc(title)}</h1>
  <p class="sub">${esc(name)} · ${esc(note)}</p>
  ${info?.error ? `<div class="warn">${esc(info.error)}</div>` : ''}

  <div class="grid">
    <div>
      ${path === '/widget' && link ? `<section class="box"><p class="none">↓ Scroll down — the widget only mounts once it scrolls near the viewport.</p></section><div style="height:140vh"></div>` : ''}
      <section class="box">
        <div class="tourhead">${tourIcon(20)}<h2>Virtual tour</h2><span class="badge">${path === '/widget' ? 'JS widget' : 'Embedded'}</span></div>
        ${link
          ? (path === '/widget'
              ? `<div class="deepvue-tour" data-src="${esc(link)}" style="width:100%;height:480px;background:#e5e7eb;border-radius:10px;overflow:hidden"><p style="padding:16px;color:#6b7280">Fallback link (shown until the widget script mounts the tour, or if JS is blocked): <a href="${esc(link)}" target="_blank" rel="noopener">View virtual tour</a></p></div><script src="${esc(new URL(link).origin)}/widget.js" async></script>`
              : `<div class="frame"><iframe src="${esc(link)}" width="100%" height="480" frameborder="0" allowfullscreen loading="lazy" title="Virtual tour"></iframe></div>`)
          : '<div class="empty"><b>No tour embedded yet</b><br>Paste the iframe code or direct link into the demo bar above.</div>'}
      </section>

      ${link ? `<section class="box desc">
        <h2>About this property</h2>
        ${info?.description ? `<p>${esc(info.description)}</p>` : '<p class="none">No description was added to this tour.</p>'}
        <p>Take the virtual tour: <a class="url" href="${esc(link)}" target="_blank">${esc(link)}</a></p>
      </section>` : ''}
    </div>

    ${link ? `<aside>
      <div class="box">
        <div class="tourlink">${tourIcon(28)}<div><b>Virtual tour link</b><small>Posted in the tour URL field</small></div></div>
        <a class="btn" href="${esc(link)}" target="_blank">Open virtual tour ↗</a>
      </div>
      ${info?.title ? `<div class="box">
        <dl class="meta"><dt>Photos in tour</dt><dd>${esc(info.photos)}</dd><dt>Tour status</dt><dd>${info.active ? 'Live' : 'Unavailable'}</dd><dt>Hosted by</dt><dd>DeepVue</dd></dl>
      </div>` : ''}
    </aside>` : ''}
  </div>
</main>
<div class="foot">Sample Portal is a fictional listing site used to demonstrate DeepVue embeds.</div>
</body></html>`
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`)
  const path = url.pathname === '/' ? '/listing' : url.pathname
  const variant = VARIANTS.find((v) => v[0] === path)
  if (!variant) return res.writeHead(404).end('not found')
  // Accept the direct link or the whole iframe snippet (pull out its src).
  const raw = url.searchParams.get('link')?.trim()
  const pasted = raw?.match(/src\s*=\s*["']([^"']+)["']/i)?.[1] ?? raw
  if (pasted !== undefined) {
    if (pasted && !valid(pasted)) return res.writeHead(400).end('Not a viewer link (expected http(s)://.../t/TOKEN)')
    if (pasted) link = pasted // blank submit keeps the current tour
    return res.writeHead(303, { Location: path }).end() // clean URL so the iframe referrer is just the page
  }
  const info = await tourInfo()
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...variant[3]() })
  res.end(page(path, info))
}).listen(port, () => console.log(`Sample portal on http://localhost:${port}/listing  /strict-csp  /no-referrer  /widget`))
