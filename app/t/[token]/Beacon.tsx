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

export function track(token: string, type: string, refererHeader: string | null = null) {
  const body = JSON.stringify({ token, type, sid: sessionId(), referrer: document.referrer || null, refererHeader })
  if (!navigator.sendBeacon?.('/api/e', body)) fetch('/api/e', { method: 'POST', body, keepalive: true }).catch(() => {})
}

export default function Beacon({ token, type, refererHeader }: { token: string; type: string; refererHeader: string | null }) {
  const sent = useRef(false) // dev StrictMode runs effects twice
  useEffect(() => {
    if (!sent.current) track(token, type, refererHeader)
    sent.current = true
  }, [token, type, refererHeader])
  return null
}
