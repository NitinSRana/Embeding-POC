'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// Re-renders the server page every few seconds so new views appear during a demo.
export default function AutoRefresh({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter()
  const [at, setAt] = useState<Date | null>(null)

  useEffect(() => {
    const tick = () => {
      if (document.hidden) return
      router.refresh()
      setAt(new Date())
    }
    setAt(new Date()) // this render's data is current as of now
    const timer = setInterval(tick, seconds * 1000)
    // Browsers freeze timers in a backgrounded tab (and skip them entirely on a bfcache
    // restore), so the interval alone can leave the page silently hours stale while still
    // claiming to be live. Refresh the moment the tab is looked at again.
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('pageshow', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('pageshow', tick)
    }
  }, [router, seconds])

  // Show when the data was actually fetched rather than promising freshness we can't guarantee.
  return <span className="live"><i /> Live · updated {at ? at.toLocaleTimeString() : 'just now'}</span>
}
