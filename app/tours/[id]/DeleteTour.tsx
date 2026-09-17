'use client'
import { useState } from 'react'

export default function DeleteTour({ id, title }: { id: string; title: string }) {
  const [busy, setBusy] = useState(false)
  async function onClick() {
    if (!confirm(`Delete "${title}"? Its photos and analytics are removed and every embed of it stops working.`)) return
    setBusy(true)
    const r = await fetch(`/api/tours/${id}`, { method: 'DELETE' })
    if (r.ok) window.location.href = '/'
    else { setBusy(false); alert('Could not delete the tour.') }
  }
  return <button type="button" className="btn btn-danger" onClick={onClick} disabled={busy}>{busy ? 'Deleting…' : 'Delete tour'}</button>
}
