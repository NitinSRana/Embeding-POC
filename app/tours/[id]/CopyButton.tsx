'use client'
import { useState } from 'react'

export default function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className={`btn copy${done ? ' done' : ''}`}
      onClick={() => navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1800) })}
    >
      {done ? 'Copied ✓' : label}
    </button>
  )
}
