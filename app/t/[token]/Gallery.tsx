'use client'
import { useRef } from 'react'
import { track as send } from './Beacon'

const Chevron = ({ dir }: { dir: 'l' | 'r' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === 'l' ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'} />
  </svg>
)

// Navigation here is deliberately JavaScript-free.
//
// WordPress embeds an unknown oEmbed provider as <iframe sandbox="allow-scripts"
// security="restricted">, which gives the frame an opaque origin and in practice leaves our
// React un-hydrated. That's most of the listing-portal market, so anything that only works
// once hydrated is dead on arrival there: measured on a live DubaiSel listing, the arrows did
// nothing and the counter sat at "1 / 4" while the photos scrolled underneath it.
//
// So the controls are per-slide anchors into a scroll-snap strip: each slide carries its own
// prev/next links, its own "n / total" counter and its own dot row, all correct for that slide
// without anyone needing to know the scroll position. The browser does the work. Hydration is
// then a pure enhancement — keyboard arrows, fullscreen and click analytics — and its absence
// costs nothing a visitor can see.
export default function Gallery({ token, title, photos, track, source, inline = false }: { token: string; title: string; photos: string[]; track: boolean; source: string | null; inline?: boolean }) {
  const strip = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const clicked = useRef(0)
  const last = photos.length - 1

  const onInteract = () => {
    // One click event per interaction burst, not per scroll frame.
    if (track && Date.now() - clicked.current > 1000) send(token, 'click', null, source)
    clicked.current = Date.now()
  }
  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else root.current?.requestFullscreen?.().catch(() => {})
  }
  const nudge = (dir: 1 | -1) => {
    const el = strip.current
    if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div
      className={`v-root${inline ? ' v-inline' : ''}`}
      ref={root}
      tabIndex={0}
      aria-label={`${title} virtual tour`}
      onPointerDown={onInteract}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') { onInteract(); nudge(1) }
        if (e.key === 'ArrowLeft') { onInteract(); nudge(-1) }
      }}
    >
      <div className="v-strip" ref={strip}>
        {photos.map((src, i) => (
          <div className="v-slide" id={`p${i}`} key={src}>
            <div className="bg" style={{ backgroundImage: `url(${JSON.stringify(src)})` }} />
            <img src={src} alt={`${title}, photo ${i + 1} of ${photos.length}`} draggable={false} loading={i < 2 ? 'eager' : 'lazy'} />

            <div className="v-top">
              <span className="v-chip">{i + 1} / {photos.length}</span>
              <button className="v-icon-btn" aria-label="Toggle fullscreen" onClick={fullscreen}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
              </button>
            </div>

            {i > 0 && <a className="v-nav v-prev" href={`#p${i - 1}`} aria-label="Previous photo" onClick={onInteract}><Chevron dir="l" /></a>}
            {i < last && <a className="v-nav v-next" href={`#p${i + 1}`} aria-label="Next photo" onClick={onInteract}><Chevron dir="r" /></a>}

            <div className="v-bottom">
              <div className="v-title">{title}</div>
              <div className="v-meta">
                <span className="v-powered">Virtual tour by <b>DeepVue</b></span>
                {photos.length > 1 && photos.length <= 12 && (
                  <span className="v-dots" aria-hidden="true">
                    {photos.map((p, j) => <i key={p} className={j === i ? 'on' : ''} />)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
