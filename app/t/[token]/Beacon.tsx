'use client'
import { useEffect, useRef } from 'react'

function sessionId() {
  try {
    let s = sessionStorage.getItem('dv_sid')
    if (!s) sessionStorage.setItem('dv_sid', (s = crypto.randomUUID()))
    return s
  } catch {
    return crypto.randomUUID() // storage blocked in some third-party iframes; counts as unique
  }
}

// `source` comes from the embed link's ?s= tag and is the attribution that actually survives
// real portals — document.referrer is empty whenever the host uses rel="noreferrer".
export function track(token: string, type: string, refererHeader: string | null = null, source: string | null = null) {
  const body = JSON.stringify({ token, type, sid: sessionId(), referrer: document.referrer || null, refererHeader, source })
  if (!navigator.sendBeacon?.('/api/e', body)) fetch('/api/e', { method: 'POST', body, keepalive: true }).catch(() => {})
}

export default function Beacon({ token, type, refererHeader, source }: {
  token: string
  type: string
  refererHeader: string | null
  source: string | null
}) {
  const sent = useRef(false) // dev StrictMode runs effects twice
  useEffect(() => {
    if (!sent.current) track(token, type, refererHeader, source)
    sent.current = true
  }, [token, type, refererHeader, source])
  return null
}
