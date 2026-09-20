import Gallery from './Gallery'

// The same /t/TOKEN URL is opened two ways, and they need different framing:
//
//   In an iframe — the listing page around it already supplies the title, price and blurb, so
//   the tour should be nothing but the tour. That's the bare full-bleed Gallery.
//
//   Directly (the direct link, which is the method that actually survives most portals) — there
//   is no surrounding page, so a bare photo carries no context at all. This is the page a buyer
//   lands on when they click through from a listing, so it shows what the listing would: the
//   address, price, key facts, the write-up and the amenities.
//
// Every detail is optional — a tour is still just a title and photos — so each block only
// renders when there's something to show.
export default function Standalone({ tour, token, track, source }: {
  tour: {
    title: string
    description?: string | null
    photos: string[]
    address?: string | null
    price?: string | null
    beds?: string | null
    baths?: string | null
    area?: string | null
    amenities?: string[] | null
  }
  token: string
  track: boolean
  source: string | null
}) {
  const facts = [
    tour.beds && `${tour.beds} ${Number(tour.beds) === 1 ? 'Bed' : 'Beds'}`,
    tour.baths && `${tour.baths} ${Number(tour.baths) === 1 ? 'Bath' : 'Baths'}`,
    tour.area,
    `${tour.photos.length} ${tour.photos.length === 1 ? 'photo' : 'photos'}`,
  ].filter(Boolean) as string[]

  const amenities = tour.amenities ?? []

  return (
    <div className="sa">
      <header className="sa-top">
        <span className="sa-brand">
          <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#2a78d6" />
            <path d="M7 17.5 16 9l9 8.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="16" cy="19.5" r="3.6" fill="none" stroke="#fff" strokeWidth="2.2" />
            <circle cx="16" cy="19.5" r="1.2" fill="#fff" />
          </svg>
          DeepVue
        </span>
        <span className="sa-tag">Virtual tour</span>
      </header>

      <main className="sa-main">
        <div className="sa-stage">
          <Gallery token={token} title={tour.title} photos={tour.photos} track={track} source={source} inline />
        </div>

        <div className="sa-info">
          <div className="sa-head">
            <div>
              <h1>{tour.title}</h1>
              {tour.address && (
                <p className="sa-addr">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" />
                  </svg>
                  {tour.address}
                </p>
              )}
            </div>
            {tour.price && <div className="sa-price">{tour.price}</div>}
          </div>

          <div className="sa-facts">
            {facts.map((f) => <span key={f} className="sa-fact">{f}</span>)}
          </div>

          {tour.description && (
            <section className="sa-block">
              <h2>About this property</h2>
              <p className="sa-desc">{tour.description}</p>
            </section>
          )}

          {amenities.length > 0 && (
            <section className="sa-block">
              <h2>Amenities</h2>
              <ul className="sa-amen">
                {amenities.map((a) => <li key={a}>{a}</li>)}
              </ul>
            </section>
          )}
        </div>
      </main>

      <footer className="sa-foot">
        Virtual tour hosted by <b>DeepVue</b>
      </footer>
    </div>
  )
}
