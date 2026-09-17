import Link from 'next/link'
import { query } from '@/lib/db'
import { blobEnabled } from '@/lib/storage'
import Shell from './Shell'
import UploadForm from './UploadForm'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const tours = await query(`
    select t.id, t.title, t.photos, t.expires_at, t.created_at,
      (select count(*) from events e where e.tour_id = t.id and e.type = 'load')::int as views
    from tours t order by t.created_at desc`)
  return (
    <Shell>
      <div className="home">
        <section>
          <div className="hero">
            <h1>Create a virtual tour</h1>
            <p className="sub">Upload property photos and get an embed code for any listing portal in under two minutes.</p>
          </div>
          <ol className="steps">
            <li><span className="step-n">1</span><span><b>Upload</b>Title, description and photos</span></li>
            <li><span className="step-n">2</span><span><b>Embed</b>Copy the iframe or direct link</span></li>
            <li><span className="step-n">3</span><span><b>Measure</b>Views and source portal, live</span></li>
          </ol>
          <div className="card">
            <UploadForm blob={blobEnabled} />
          </div>
        </section>

        <aside className="card" id="tours">
          <div className="card-head">
            <div>
              <h2>Tours</h2>
              <p>{tours.length} {tours.length === 1 ? 'tour' : 'tours'} hosted</p>
            </div>
          </div>
          {tours.length === 0 ? (
            <div className="empty">No tours yet. Your first tour will appear here.</div>
          ) : (
            <div className="tour-list">
              {tours.map((t) => {
                const active = new Date(t.expires_at) > new Date()
                return (
                  <Link key={t.id} href={`/tours/${t.id}`} className="tour-item">
                    <img src={t.photos[0]} alt="" />
                    <div className="grow">
                      <div className="t">{t.title}</div>
                      <div className="meta">
                        {t.photos.length} {t.photos.length === 1 ? 'photo' : 'photos'} · {t.views} {t.views === 1 ? 'view' : 'views'} · {new Date(t.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <span className={`pill ${active ? 'pill-good' : 'pill-bad'}`}>{active ? 'Active' : 'Expired'}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </aside>
      </div>
    </Shell>
  )
}
