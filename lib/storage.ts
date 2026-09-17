import { mkdir, writeFile, rm } from 'fs/promises'
import path from 'path'
import { put, del, head } from '@vercel/blob'
import { EXT } from './images'

// Vercel Blob when the store is connected, local disk (public/uploads) otherwise.
export const blobEnabled = !!process.env.BLOB_READ_WRITE_TOKEN
const BLOB_HOST = '.public.blob.vercel-storage.com'

// Returns the public URL of the stored file.
export async function save(key: string, bytes: Buffer, contentType: string) {
  if (blobEnabled) return (await put(key, bytes, { access: 'public', contentType, addRandomSuffix: true })).url
  const file = path.join(process.cwd(), 'public', 'uploads', key)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, bytes)
  return `/uploads/${key}`
}

// True only for an image uploaded by the browser into *this* Blob store under tours/.
export async function isOwnBlobImage(url: unknown) {
  if (!blobEnabled || typeof url !== 'string') return false
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:' || !u.hostname.endsWith(BLOB_HOST) || !u.pathname.startsWith('/tours/')) return false
    return (await head(url)).contentType in EXT // head() is scoped to our token, so other stores' URLs fail
  } catch {
    return false
  }
}

export async function removeFiles(urls: string[]) {
  const blobs = urls.filter((u) => u.includes(BLOB_HOST))
  if (blobEnabled && blobs.length) await del(blobs)
  // Local uploads live in public/uploads/<folder>/...
  const folders = new Set(urls.map((u) => u.match(/^\/uploads\/([0-9a-f-]{36})\//)?.[1]).filter(Boolean) as string[])
  for (const f of folders) await rm(path.join(process.cwd(), 'public', 'uploads', f), { recursive: true, force: true })
}
