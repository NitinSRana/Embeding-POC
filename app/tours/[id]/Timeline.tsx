'use client'
import { useEffect, useState } from 'react'

// Bucket boundaries are computed on the server (absolute instants, so they're correct
// anywhere) but the *labels* must be formatted in the viewer's timezone — see LocalTime.
export default function Timeline({ buckets, daily, max }: {
  buckets: { start: number; count: number }[]
  daily: boolean
  max: number
}) {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => setIsClient(true), [])

  const label = (t: number) => {
    const d = new Date(t)
    const opts: Intl.DateTimeFormatOptions = daily
      ? { day: 'numeric', month: 'short' }
      : { hour: '2-digit', minute: '2-digit' }
    return isClient ? d.toLocaleString(undefined, opts) : d.toLocaleString('en-GB', { ...opts, timeZone: 'UTC' })
  }

  return (
    <>
      <div className="cols" role="img" aria-label={`Views over time, peak ${max} per interval`}>
        <span className="ymax">{max}</span>
        {buckets.map((b) => (
          <div key={b.start} className="col" suppressHydrationWarning data-tip={`${label(b.start)} · ${b.count} ${b.count === 1 ? 'view' : 'views'}`}>
            <span style={{ height: `${(b.count / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="xlabels" suppressHydrationWarning>
        <span>{label(buckets[0].start)}</span>
        <span>{label(buckets[Math.floor(buckets.length / 2)].start)}</span>
        <span>{label(buckets.at(-1)!.start)}</span>
      </div>
    </>
  )
}
