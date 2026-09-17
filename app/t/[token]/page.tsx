import { headers } from 'next/headers'
import { query } from '@/lib/db'
import { verify } from '@/lib/token'
import Beacon from './Beacon'
import Gallery from './Gallery'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Virtual tour', robots: 'noindex' }

const Lock = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
)
const Brand = () => <div className="brand">Virtual tour by <b>DeepVue</b></div>

export default async function Viewer({ params, searchParams }: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { token } = await params
  const preview = (await searchParams).preview === '1' // admin preview: don't count it
  const tid = await verify(token)
  const [tour] = tid ? await query('select title, photos, expires_at from tours where id = $1', [tid]) : []

  if (!tour) {
    return (
      <div className="v-panel">
        <div className="v-card">
          <div className="lock neutral">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
          </div>
          <h1>This tour link isn&apos;t valid</h1>
          <p>The link may have been copied incorrectly. Please contact the listing owner.</p>
          <Brand />
        </div>
      </div>
    )
  }

  const refererHeader = (await headers()).get('referer')

  if (new Date(tour.expires_at) <= new Date()) {
    return (
      <div className="v-panel">
        {!preview && <Beacon token={token} type="expired_load" refererHeader={refererHeader} />}
        <div className="bg" style={{ backgroundImage: `url(${JSON.stringify(tour.photos[0])})` }} />
        <div className="v-card">
          <div className="lock"><Lock /></div>
          <h1>Virtual tour unavailable</h1>
          <p>The tour for <strong>{tour.title}</strong> is paused because its hosting subscription has expired.</p>
          <div className="owner">Listing owner? Renew your DeepVue subscription and the tour comes back here automatically.</div>
          <Brand />
        </div>
      </div>
    )
  }

  return (
    <>
      {!preview && <Beacon token={token} type="load" refererHeader={refererHeader} />}
      <Gallery token={token} title={tour.title} photos={tour.photos} track={!preview} />
    </>
  )
}
