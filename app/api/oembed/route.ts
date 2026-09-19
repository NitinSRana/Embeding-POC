import { query } from '@/lib/db'
import { verify } from '@/lib/token'

// oEmbed endpoint (oembed.com spec) — lets platforms that don't accept raw <iframe> HTML
// (WordPress and anything using its embed pipeline: Discourse, some classifieds themes, etc.)
// auto-embed a tour from a bare pasted link. The platform fetches this itself, server-side,
// so it never sees user-typed <iframe> markup — that's what gets past the WAF/sanitizer that
// blocks a manually pasted iframe. Discovered via the <link rel="alternate" type="application/
// json+oembed"> tag on each tour page (see generateMetadata in app/t/[token]/page.tsx).
// Spec: https://oembed.com — only the JSON format is implemented (near-universal in practice).
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const format = params.get('format') ?? 'json'
  if (format !== 'json') return Response.json({ error: 'only json is supported' }, { status: 501 })

  const token = params.get('url')?.match(/\/t\/([^/?#]+)/)?.[1]
  const tid = token ? await verify(token) : null
  const [tour] = tid ? await query('select title from tours where id = $1', [tid]) : []
  if (!tour) return Response.json({ error: 'invalid tour link' }, { status: 404 })
  // Not gated on expiry: platforms cache this response, so the iframe's src must stay the same
  // whether the tour is live or not — /t/[token] itself renders the renewal panel once expired.
  // 404-ing here would risk the platform dropping the embed instead of showing that panel.

  // oEmbed requires fixed pixel dimensions (for the consumer to reserve layout space), clamped
  // to what the consumer asked for; the iframe itself is still responsive at max-width: 100%.
  const width = Math.min(640, Number(params.get('maxwidth')) || 640)
  const height = Math.min(480, Number(params.get('maxheight')) || 480)
  const src = `${process.env.PUBLIC_BASE_URL}/t/${token}`

  return Response.json({
    version: '1.0',
    type: 'rich',
    provider_name: 'DeepVue',
    provider_url: process.env.PUBLIC_BASE_URL,
    title: `${tour.title} · Virtual tour`,
    width,
    height,
    html: `<iframe src="${src}" width="${width}" height="${height}" frameborder="0" allowfullscreen loading="lazy"></iframe>`,
  }, { headers: { 'Access-Control-Allow-Origin': '*', 'cache-control': 'public, max-age=300' } })
}
