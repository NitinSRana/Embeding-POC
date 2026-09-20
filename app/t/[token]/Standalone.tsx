import Gallery from './Gallery'

// The same /t/TOKEN URL is opened two ways, and they need different framing:
//
//   In an iframe — the listing page around it already supplies the title, price and blurb, so
//   the tour should be nothing but the tour. That's the bare full-bleed Gallery.
//
//   Directly (the direct link, which is the method that actually survives most portals) — there
//   is no surrounding page, so a bare photo carries no context at all. A one-photo tour just
//   looks like someone sent you a picture. This wraps it in an actual page: the property's
//   title, the description typed at upload (which a visitor could otherwise never see anywhere),
//   the photo count, and DeepVue branding.
export default function Standalone({ token, title, description, photos, track, source }: {
  token: string
  title: string
  description: string
  photos: string[]
  track: boolean
  source: string | null
}) {
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
          <Gallery token={token} title={title} photos={photos} track={track} source={source} inline />
        </div>

        <div className="sa-info">
          <h1>{title}</h1>
          <p className="sa-meta">{photos.length} {photos.length === 1 ? 'photo' : 'photos'} · swipe or use the arrows to look around</p>
          {description && <p className="sa-desc">{description}</p>}
        </div>
      </main>

      <footer className="sa-foot">
        Virtual tour hosted by <b>DeepVue</b>
      </footer>
    </div>
  )
}
