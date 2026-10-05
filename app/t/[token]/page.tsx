import { cache } from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { query } from '@/lib/db'
import { verify } from '@/lib/token'
import { slugSource } from '@/lib/source'
import Beacon from './Beacon'
import Gallery from './Gallery'
import Standalone from './Standalone'

export const dynamic = 'force-dynamic'

// Shared by generateMetadata and the page within one request.
const getTour = cache(async (token: string) => {
  const tid = await verify(token)
  const [tour] = tid ? await query('select title, description, photos, expires_at, address, price, beds, baths, area, amenities from tours where id = $1', [tid]) : []
  return tour ?? null
})

// Link-preview card for LinkedIn, WhatsApp, Slack etc. Invalid or expired tours get a generic card
// (deliberately: no reason to keep advertising photos of a tour that's currently paused).
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params
  const tour = await getTour(token)
  const generic: Metadata = { title: 'Virtual tour', robots: 'noindex', openGraph: { title: 'Virtual tour', siteName: 'DeepVue' } }
  if (!tour) return generic // no such tour at all — nothing to discover or embed

  // oEmbed discovery, present whether the tour is live or expired: platforms cache oEmbed
  // responses, so the discovered <iframe> must keep pointing at this same URL either way —
  // /t/[token] itself renders the live gallery or the renewal panel depending on current state.
  // Must be absolute: consumers fetch this href directly, with no page context to resolve a
  // relative one against (Next.js does not auto-absolutize `alternates.types`).
  const pageUrl = new URL(`/t/${token}`, process.env.PUBLIC_BASE_URL).toString()
  const oembed = { alternates: { types: { 'application/json+oembed': new URL(`/api/oembed?url=${encodeURIComponent(pageUrl)}&format=json`, process.env.PUBLIC_BASE_URL).toString() } } }

  if (new Date(tour.expires_at) <= new Date()) return { ...generic, ...oembed }

  const title = `${tour.title} · Virtual tour`
  const description = (tour.description || `${tour.photos.length}-photo virtual tour hosted by DeepVue`).slice(0, 200)
  const image = new URL(tour.photos[0], process.env.PUBLIC_BASE_URL).toString()
  return {
    title,
    description,
    robots: 'noindex',
    openGraph: { type: 'website', siteName: 'DeepVue', title, description, images: [{ url: image }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    ...oembed,
  }
}

const Lock = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
)
const Brand = () => <div className="brand">Virtual tour by <b>DeepVue</b></div>

export default async function Viewer({ params, searchParams }: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ preview?: string; s?: string; e?: string }>
}) {
  const { token } = await params
  const sp = await searchParams
  const preview = sp.preview === '1' // admin preview: don't count it
  const source = slugSource(sp.s) || null // which portal this embed was posted on
  const tour = await getTour(token)

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

  const h = await headers()
  const refererHeader = h.get('referer')
  // How this was opened decides the layout. Browsers send Sec-Fetch-Dest: iframe for a framed
  // load and 'document' for a top-level navigation. Our own embed codes also carry ?e=1, so
  // framing is still detected on browsers that don't send the header (Safari before 16.4).
  const embedded = sp.e === '1' || ['iframe', 'frame', 'embed', 'object'].includes(h.get('sec-fetch-dest') ?? '')

  if (new Date(tour.expires_at) <= new Date()) {
    return (
      <div className="v-panel">
        {!preview && <Beacon token={token} type="expired_load" refererHeader={refererHeader} source={source} />}
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
      {!preview && <Beacon token={token} type="load" refererHeader={refererHeader} source={source} />}
      {embedded
        ? <Gallery token={token} title={tour.title} photos={tour.photos} track={!preview} source={source} />
        : <Standalone token={token} tour={tour} track={!preview} source={source} />}
    </>
  )
}
