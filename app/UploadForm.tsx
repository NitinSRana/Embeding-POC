'use client'
import { useRef, useState, type FormEvent } from 'react'
import { upload } from '@vercel/blob/client'
import { EXT, MAX_PHOTO_BYTES, MAX_PHOTOS } from '@/lib/images'

// blob=true (deployed): photos go browser → Vercel Blob, then the tour is created from their URLs.
// blob=false (local): plain multipart form post.
export default function UploadForm({ blob }: { blob: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [urls, setUrls] = useState<string[]>([])
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  // ponytail: object URLs aren't revoked; fine for a single upload page
  const sync = (list: FileList) => {
    setFiles([...list])
    setUrls([...list].map((f) => URL.createObjectURL(f)))
    setError('')
  }
  const remove = (i: number) => {
    const dt = new DataTransfer()
    files.forEach((f, j) => j !== i && dt.items.add(f))
    input.current!.files = dt.files
    sync(dt.files)
  }
  const bytes = files.reduce((n, f) => n + f.size, 0)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    const bad = files.find((f) => !(f.type in EXT)) ?? files.find((f) => f.size > MAX_PHOTO_BYTES)
    if (bad || files.length > MAX_PHOTOS) {
      e.preventDefault()
      setError(files.length > MAX_PHOTOS ? `Up to ${MAX_PHOTOS} photos per tour.` : `${bad!.name}: use JPG, PNG, WebP, GIF or AVIF under ${MAX_PHOTO_BYTES / 1048576} MB.`)
      return
    }
    setBusy(true)
    if (!blob) return // native multipart post

    e.preventDefault()
    setError('')
    const form = new FormData(e.currentTarget)
    const loaded = files.map(() => 0)
    try {
      const folder = crypto.randomUUID()
      const photos = await Promise.all(files.map(async (f, i) => (await upload(`tours/${folder}/${i}.${EXT[f.type]}`, f, {
        access: 'public',
        handleUploadUrl: '/api/uploads',
        contentType: f.type,
        multipart: f.size > 8 * 1048576,
        onUploadProgress: ({ loaded: n }) => { loaded[i] = n; setProgress(Math.round((loaded.reduce((a, b) => a + b, 0) / bytes) * 100)) },
      })).url))
      const r = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: form.get('title'), description: form.get('description'), photos }),
      })
      if (!r.ok) throw new Error(`saving the tour (HTTP ${r.status}) ${await r.text()}`.trim())
      window.location.href = `/tours/${(await r.json()).id}`
    } catch (err) {
      const e = err as Error
      setError(`Upload failed: ${e.message || e.name || 'unknown error'}`)
      setBusy(false)
      setProgress(0)
    }
  }

  return (
    <form action="/api/tours" method="post" encType="multipart/form-data" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="title">Property title</label>
        <input className="input" id="title" name="title" type="text" required maxLength={200} placeholder="e.g. 3-bed apartment, Marina Residences" />
      </div>
      <div className="field">
        <label htmlFor="description">Short description <span className="hint">(optional)</span></label>
        <textarea className="input" id="description" name="description" rows={3} maxLength={2000} placeholder="Sea views, open-plan living, two parking spaces…" />
      </div>
      <div className="field">
        <label htmlFor="photos">Photos</label>
        <div className={`drop${over ? ' over' : ''}`}>
          <input
            ref={input}
            id="photos"
            name="photos"
            type="file"
            accept={Object.keys(EXT).join(',')}
            multiple
            required
            onDragEnter={() => setOver(true)}
            onDragLeave={() => setOver(false)}
            onDrop={() => setOver(false)}
            onChange={(e) => sync(e.target.files!)}
          />
          <div className="drop-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4m0 0-4 4m4-4 4 4" /><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
          </div>
          <div><strong>Click to upload</strong> or drag and drop</div>
          <div className="muted small">JPG, PNG, WebP, GIF or AVIF, up to {MAX_PHOTO_BYTES / 1048576} MB each. The first photo is the cover.</div>
        </div>
        {urls.length > 0 && (
          <div className="thumbs">
            {urls.map((src, i) => (
              <div className="thumb" key={src}>
                <img src={src} alt={files[i]?.name ?? ''} />
                {i === 0 && <span className="cover">Cover</span>}
                <button type="button" aria-label={`Remove ${files[i]?.name}`} onClick={() => remove(i)} disabled={busy}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-foot">
        <span className="muted small">{files.length ? `${files.length} ${files.length === 1 ? 'photo' : 'photos'} · ${(bytes / 1048576).toFixed(1)} MB` : 'No photos selected'}</span>
        <button className="btn btn-primary btn-lg" disabled={busy}>
          {busy && <span className="spinner" />} {busy ? (blob && progress < 100 ? `Uploading ${progress}%…` : 'Creating tour…') : 'Create tour & get embed code'}
        </button>
      </div>
    </form>
  )
}
