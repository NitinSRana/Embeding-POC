'use client'
import { useEffect, useState } from 'react'

// Timestamps are formatted on the server by default, which on Vercel means UTC — so a viewer
// in another timezone reads times that don't match their own clock (this caused a real
// debugging wild-goose chase: IST readers saw events 5:30 behind and assumed they were stale).
// Render the instant on the client instead, in whatever timezone the viewer is actually in.
const FORMATS = {
  full: { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  log: { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' },
  date: { day: 'numeric', month: 'short' },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>

export default function LocalTime({ iso, format = 'full' }: { iso: string; format?: keyof typeof FORMATS }) {
  const [local, setLocal] = useState('')
  useEffect(() => setLocal(new Date(iso).toLocaleString(undefined, FORMATS[format])), [iso, format])
  // Before hydration, show UTC explicitly labelled rather than an unmarked time that looks local.
  const utc = `${new Date(iso).toLocaleString('en-GB', { ...FORMATS[format], timeZone: 'UTC' })} UTC`
  return <time dateTime={iso} suppressHydrationWarning>{local || utc}</time>
}
