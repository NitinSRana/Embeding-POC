'use client'
import { useRef, useState } from 'react'
import { track as send } from './Beacon'

const Chevron = ({ dir }: { dir: 'l' | 'r' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === 'l' ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'} />
  </svg>
)

export default function Gallery({ token, title, photos, track, source, inline = false }: { token: string; title: string; photos: string[]; track: boolean; source: string | null; inline?: boolean }) {
  const strip = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const clicked = useRef(0)
  const [index, setIndex] = useState(0)
  const last = photos.length - 1

  const go = (i: number) => {
    const el = strip.current
    if (el) el.scrollTo({ left: Math.max(0, Math.min(last, i)) * el.clientWidth, behavior: 'smooth' })
  }
  const onInteract = () => {
    // One click event per interaction burst, not per scroll frame.
    if (track && Date.now() - clicked.current > 1000) send(token, 'click', null, source)
    clicked.current = Date.now()
  }
  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else root.current?.requestFullscreen?.().catch(() => {})
  }

  return (
    <div
      className={`v-root${inline ? ' v-inline' : ''}`}
      ref={root}
      tabIndex={0}
      aria-label={`${title} virtual tour`}
      onPointerDown={onInteract}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') { onInteract(); go(index + 1) }
        if (e.key === 'ArrowLeft') { onInteract(); go(index - 1) }
      }}
    >
      <div
        className="v-strip"
        ref={strip}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
      >
        {photos.map((src, i) => (
          <div className="v-slide" key={src}>
            <div className="bg" style={{ backgroundImage: `url(${JSON.stringify(src)})` }} />
            <img src={src} alt={`${title}, photo ${i + 1} of ${photos.length}`} draggable={false} loading={i < 2 ? 'eager' : 'lazy'} />
          </div>
        ))}
      </div>

      <div className="v-top">
        <span className="v-chip">{index + 1} / {photos.length}</span>
        <button className="v-icon-btn" aria-label="Toggle fullscreen" onClick={fullscreen}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
        </button>
      </div>

      {photos.length > 1 && (
        <>
          <button className="v-nav v-prev" aria-label="Previous photo" disabled={index === 0} onClick={() => go(index - 1)}><Chevron dir="l" /></button>
          <button className="v-nav v-next" aria-label="Next photo" disabled={index === last} onClick={() => go(index + 1)}><Chevron dir="r" /></button>
        </>
      )}

      <div className="v-bottom">
        <div className="v-title">{title}</div>
        <div className="v-meta">
          <span className="v-powered">Virtual tour by <b>DeepVue</b></span>
          {photos.length > 1 && photos.length <= 12 && (
            <span className="v-dots" aria-hidden="true">
              {photos.map((src, i) => <i key={src} className={i === index ? 'on' : ''} />)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
