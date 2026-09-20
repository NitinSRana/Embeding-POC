import { query } from '@/lib/db'
import { verify } from '@/lib/token'
import { slugSource } from '@/lib/source'

const TYPES = new Set(['load', 'click', 'expired_load'])
const clip = (v: unknown, n = 1000) => (typeof v === 'string' ? v.slice(0, n) : null)

export async function POST(req: Request) {
  let body: any
  try { body = JSON.parse(await req.text()) } catch { return new Response(null, { status: 400 }) }
  const tid = await verify(String(body?.token ?? ''))
  if (!tid || !TYPES.has(body.type)) return new Response(null, { status: 400 })

  const ua = req.headers.get('user-agent') ?? ''
  // ponytail: regex device sniffing; swap for a UA parser if tablet/bot splits matter
  const device = /Mobi|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop'
  // Source tag from the embed link — the attribution that survives rel="noreferrer",
  // link shorteners and interstitials, all of which strip the referrer. See lib/source.ts.
  const source = slugSource(body.source) || null
  await query(
    'insert into events (tour_id, type, session_id, referrer, referer_header, user_agent, device, source) values ($1,$2,$3,$4,$5,$6,$7,$8)',
    [tid, body.type, clip(body.sid, 64), clip(body.referrer), clip(body.refererHeader), clip(ua, 500), device, source],
  )
  return new Response(null, { status: 204 })
}
