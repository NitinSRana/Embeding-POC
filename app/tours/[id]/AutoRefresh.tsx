'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Re-renders the server page every few seconds so new views appear during a demo.
export default function AutoRefresh({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter()
  useEffect(() => {
    const t = setInterval(() => !document.hidden && router.refresh(), seconds * 1000)
    return () => clearInterval(t)
  }, [router, seconds])
  return <span className="live"><i /> Live · updates every {seconds}s</span>
}
