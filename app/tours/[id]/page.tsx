import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { query } from '@/lib/db'
import { sign } from '@/lib/token'
import Shell from '../../Shell'
import CopyButton from './CopyButton'
import AutoRefresh from './AutoRefresh'
import DeleteTour from './DeleteTour'

export const dynamic = 'force-dynamic'

const host = (url: string | null) => {
  try { return url ? new URL(url).host : null } catch { return null }
}
const fmtDate = (d: Date) => d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const UNKNOWN = 'Direct / unknown'

// Platforms' own branded short-link domains, so e.g. "lnkd.in" reads as "LinkedIn (lnkd.in)"
// rather than an unrecognisable string. Not exhaustive — extend as new referrers show up.
const KNOWN_PLATFORMS: Record<string, string> = {
  'lnkd.in': 'LinkedIn', 'linkedin.com': 'LinkedIn',
  'l.instagram.com': 'Instagram', 'instagram.com': 'Instagram',
  'fb.me': 'Facebook', 'facebook.com': 'Facebook', 'm.facebook.com': 'Facebook',
  't.co': 'X / Twitter', 'x.com': 'X / Twitter', 'twitter.com': 'X / Twitter',
  'wa.me': 'WhatsApp', 'whatsapp.com': 'WhatsApp',
  'bit.ly': 'Bitly link', 'tinyurl.com': 'TinyURL link',
}
const platformLabel = (domain: string) => KNOWN_PLATFORMS[domain] ? `${KNOWN_PLATFORMS[domain]} (${domain})` : domain

function tally(values: (string | null)[]) {
  const m = new Map<string, number>()
  for (const v of values) m.set(v ?? UNKNOWN, (m.get(v ?? UNKNOWN) ?? 0) + 1)
  return [...m].sort((a, b) => b[1] - a[1])
}

// Views per time bucket: the smallest bucket size that fits the span in <= 24 columns.
function timeline(times: number[]) {
  const min = 60_000
  const now = Date.now()
  const sizes = [min, 5 * min, 15 * min, 60 * min, 360 * min, 1440 * min]
  const span = times.length ? now - Math.min(...times) : 0
  const size = sizes.find((s) => span / s <= 23) ?? sizes.at(-1)!
  const n = Math.min(24, Math.max(12, Math.ceil(span / size) + 1))
  const end = Math.ceil(now / size) * size
  const buckets = Array.from({ length: n }, (_, i) => ({ start: end - (n - i) * size, count: 0 }))
  for (const t of times) {
    const i = Math.floor((t - buckets[0].start) / size)
    if (i >= 0 && i < n) buckets[i].count++
  }
  const label = (t: number) => size < 1440 * min
    ? new Date(t).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  const name = size < 60 * min ? `${size / min}-minute` : size < 1440 * min ? `${size / (60 * min)}-hour` : 'Daily'
  return { buckets, label, name }
}

const TYPE: Record<string, [string, string]> = {
  load: ['View', 'pill-accent'],
  click: ['Interaction', 'pill-neutral'],
  expired_load: ['Renewal prompt', 'pill-warn'],
}

function BarList({ rows, total }: { rows: [string, number][]; total: number }) {
  if (rows.length === 0) return <div className="empty">No views yet</div>
  return (
    <div className="bars">
      {rows.map(([name, n]) => (
        <div className="bar-row" key={name} title={`${name}: ${n}`}>
          <span className="name">{name}</span>
          <span className="val">{n} <span className="muted small">· {Math.round((n / total) * 100)}%</span></span>
          <div className="bar-track"><span style={{ width: `${(n / rows[0][1]) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  )
}

export default async function TourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const [tour] = await query('select * from tours where id = $1', [id])
  if (!tour) notFound()
  if (!tour.token) {
    tour.token = await sign(id)
    await query('update tours set token = $1 where id = $2', [tour.token, id])
  }
  // ponytail: all events loaded for stats; move to SQL aggregates past ~100k events
  const events = await query('select * from events where tour_id = $1 order by created_at desc', [id])

  const link = `${process.env.PUBLIC_BASE_URL}/t/${tour.token}`
  const iframe = `<iframe src="${link}"\n  width="100%" height="480" frameborder="0"\n  allowfullscreen loading="lazy"></iframe>`
  const expires = new Date(tour.expires_at)
  const active = expires > new Date()

  async function setExpiry(formData: FormData) {
    'use server'
    const sql = formData.get('op') === 'renew' ? "now() + interval '1 year'" : 'now()'
    await query(`update tours set expires_at = ${sql} where id = $1`, [id])
    revalidatePath(`/tours/${id}`)
  }

  const views = events.filter((e) => e.type === 'load')
  const clicks = events.filter((e) => e.type === 'click')
  const prompts = events.filter((e) => e.type === 'expired_load')
  const unique = new Set(views.map((e) => e.session_id)).size
  // Referrer as the viewer saw it (document.referrer), falling back to the Referer header on the viewer request.
  const refDomain = (e: any) => host(e.referrer) ?? host(e.referer_header)
  const refLabel = (e: any) => { const d = refDomain(e); return d ? platformLabel(d) : null }
  const tl = timeline(views.map((e) => new Date(e.created_at).getTime()))
  const tlMax = Math.max(1, ...tl.buckets.map((b) => b.count))

  return (
    <Shell>
      <div className="crumbs"><Link href="/#tours">Tours</Link> / {tour.title}</div>
      <div className="page-head">
        <div>
          <div className="title-row">
            <h1>{tour.title}</h1>
            <span className={`pill ${active ? 'pill-good' : 'pill-bad'}`}>{active ? 'Active' : 'Expired'}</span>
          </div>
          <p className="sub">{tour.photos.length} {tour.photos.length === 1 ? 'photo' : 'photos'} · created {fmtDate(new Date(tour.created_at))}</p>
        </div>
        <div className="btn-row">
        <DeleteTour id={id} title={tour.title} />
        <a className="btn btn-secondary" href={link} target="_blank">
          Open tour
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
        </a>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <h2>Live preview</h2>
              <p>Exactly what a portal visitor sees. Preview loads are not counted.</p>
            </div>
          </div>
          <div className="preview">
            <iframe src={`/t/${tour.token}?preview=1`} title={`${tour.title} preview`} allowFullScreen />
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h2>Hosting subscription</h2></div>
          <div className={`sub-status ${active ? 'ok' : 'off'}`}>
            <span className="ico">
              {active
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>}
            </span>
            <div>
              <b>{active ? 'Tour is live' : 'Subscription expired'}</b>
              <span className="small muted">{active ? 'Every embed is serving the tour' : 'Every embed shows the renewal prompt'}</span>
            </div>
          </div>
          <dl className="kv">
            <dt>{active ? 'Expires' : 'Expired'}</dt><dd>{fmtDate(expires)}</dd>
            <dt>Access token</dt><dd>ES256 signed</dd>
            <dt>Embeds affected</dt><dd>All, instantly</dd>
          </dl>
          <form action={setExpiry} className="btn-row">
            <button className="btn btn-danger" name="op" value="expire" disabled={!active}>Expire now</button>
            <button className="btn btn-primary" name="op" value="renew">{active ? 'Extend 1 year' : 'Renew 1 year'}</button>
          </form>
          <p className="note">The embed code on the portal never changes. DeepVue checks the subscription every time the tour loads.</p>
        </div>
      </div>

      <div className="section-title">
        <h2>Embed on a listing</h2>
        <span className="muted small">Both methods use the same signed link, so expiry and analytics work either way.</span>
      </div>
      <div className="grid-half">
        <div className="card method">
          <div className="method-head"><h3>Option A · iframe</h3><span className="pill pill-accent">Recommended</span></div>
          <p>Shows the tour inline in the listing. Paste into any editor that accepts HTML.</p>
          <pre className="code">{iframe}<CopyButton text={iframe} label="Copy code" /></pre>
        </div>
        <div className="card method">
          <div className="method-head"><h3>Option B · Direct link</h3><span className="pill pill-neutral">Fallback</span></div>
          <p>For portals that block embeds. Paste into a virtual-tour field or the description. Still tracked and billable.</p>
          <pre className="code">{link}<CopyButton text={link} label="Copy link" /></pre>
        </div>
      </div>

      <div className="section-title">
        <h2>Analytics</h2>
        <AutoRefresh />
      </div>
      <div className="tiles">
        <div className="card tile"><div className="label">Total views</div><div className="value">{views.length.toLocaleString()}</div><div className="foot">Tour loads on host pages</div></div>
        <div className="card tile"><div className="label">Unique viewers</div><div className="value">{unique.toLocaleString()}</div><div className="foot">Distinct browser sessions</div></div>
        <div className="card tile"><div className="label">Interactions</div><div className="value">{clicks.length.toLocaleString()}</div><div className="foot">Swipes, taps and clicks</div></div>
        <div className="card tile"><div className="label">Renewal prompts shown</div><div className="value">{prompts.length.toLocaleString()}</div><div className="foot">Views while expired</div></div>
      </div>

      <div className="stack">
        <div className="card">
          <div className="card-head"><div><h2>Views over time</h2><p>{tl.name} intervals</p></div></div>
          <div className="cols" role="img" aria-label={`Views over time, peak ${tlMax} per interval`}>
            <span className="ymax">{tlMax}</span>
            {tl.buckets.map((b) => (
              <div key={b.start} className="col" data-tip={`${tl.label(b.start)} · ${b.count} ${b.count === 1 ? 'view' : 'views'}`}>
                <span style={{ height: `${(b.count / tlMax) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="xlabels">
            <span>{tl.label(tl.buckets[0].start)}</span>
            <span>{tl.label(tl.buckets[Math.floor(tl.buckets.length / 2)].start)}</span>
            <span>{tl.label(tl.buckets.at(-1)!.start)}</span>
          </div>
        </div>

        <div className="grid-half">
          <div className="card">
            <div className="card-head"><div><h2>Views by referring site</h2><p>Which portal each view came from</p></div></div>
            <BarList rows={tally(views.map(refLabel))} total={views.length} />
          </div>
          <div className="card">
            <div className="card-head"><div><h2>Views by device</h2><p>Mobile and desktop share</p></div></div>
            <BarList rows={tally(views.map((e) => (e.device === 'mobile' ? 'Mobile' : 'Desktop')))} total={views.length} />
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h2>Event log</h2><p>Latest {Math.min(100, events.length)} of {events.length} events</p></div></div>
          {events.length === 0 ? <div className="empty">No events yet. Embed the tour on a page and load it.</div> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Time</th><th>Event</th><th>Referring site</th><th>Device</th><th>Session</th><th>Referrer URL</th></tr>
                </thead>
                <tbody>
                  {events.slice(0, 100).map((e) => {
                    const [label, cls] = TYPE[e.type] ?? [e.type, 'pill-neutral']
                    const ref = e.referrer || e.referer_header
                    return (
                      <tr key={e.id}>
                        <td className="nowrap">{new Date(e.created_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                        <td><span className={`pill ${cls}`}>{label}</span></td>
                        <td className="nowrap">{refLabel(e) ?? <span className="muted">{UNKNOWN}</span>}</td>
                        <td>{e.device === 'mobile' ? 'Mobile' : 'Desktop'}</td>
                        <td className="nowrap muted">{e.session_id?.slice(0, 8)}</td>
                        <td className="clip muted" title={ref ?? ''}>{ref ?? '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Shell>
  )
}
