'use client'
import { useRef, useState } from 'react'

export default function UploadForm() {
  const input = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [urls, setUrls] = useState<string[]>([])
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)

  // ponytail: object URLs aren't revoked; fine for a single upload page
  const sync = (list: FileList) => {
    setFiles([...list])
    setUrls([...list].map((f) => URL.createObjectURL(f)))
  }
  const remove = (i: number) => {
    const dt = new DataTransfer()
    files.forEach((f, j) => j !== i && dt.items.add(f))
    input.current!.files = dt.files
    sync(dt.files)
  }
  const mb = files.reduce((n, f) => n + f.size, 0) / 1048576

  return (
    <form action="/api/tours" method="post" encType="multipart/form-data" onSubmit={() => setBusy(true)}>
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
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
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
          <div className="muted small">JPG, PNG or WebP. The first photo is the cover.</div>
        </div>
        {urls.length > 0 && (
          <div className="thumbs">
            {urls.map((src, i) => (
              <div className="thumb" key={src}>
                <img src={src} alt={files[i]?.name ?? ''} />
                {i === 0 && <span className="cover">Cover</span>}
                <button type="button" aria-label={`Remove ${files[i]?.name}`} onClick={() => remove(i)}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="form-foot">
        <span className="muted small">{files.length ? `${files.length} ${files.length === 1 ? 'photo' : 'photos'} · ${mb.toFixed(1)} MB` : 'No photos selected'}</span>
        <button className="btn btn-primary btn-lg" disabled={busy}>
          {busy && <span className="spinner" />} {busy ? 'Creating tour…' : 'Create tour & get embed code'}
        </button>
      </div>
    </form>
  )
}
