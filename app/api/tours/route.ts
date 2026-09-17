import { query } from '@/lib/db'
import { save } from '@/lib/storage'
import { sign } from '@/lib/token'

// Raster formats only: SVG can carry script and would run on our origin.
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' }
const MAX_BYTES = 50 * 1024 * 1024 // keep in sync with proxyClientMaxBodySize in next.config.ts

export async function POST(req: Request) {
  if (Number(req.headers.get('content-length')) > MAX_BYTES) return new Response('Upload is larger than 50 MB', { status: 413 })
  let form: FormData
  try { form = await req.formData() } catch { return new Response('Upload could not be read', { status: 400 }) }

  const title = String(form.get('title') ?? '').trim().slice(0, 200)
  const description = String(form.get('description') ?? '').trim().slice(0, 2000)
  const files = form.getAll('photos').filter((f): f is File => f instanceof File && f.type in EXT)
  if (!title || files.length === 0) return new Response('Title and at least one JPG, PNG, WebP, GIF or AVIF photo are required', { status: 400 })

  const id = crypto.randomUUID()
  const photos = await Promise.all(files.map(async (f, i) => save(`${id}/${i}.${EXT[f.type]}`, Buffer.from(await f.arrayBuffer()))))
  // Store the token so embed codes stay identical on every page load (ES256 signatures are randomised).
  await query('insert into tours (id, title, description, photos, token) values ($1, $2, $3, $4, $5)', [
    id, title, description, JSON.stringify(photos), await sign(id),
  ])
  return Response.redirect(new URL(`/tours/${id}`, req.url), 303)
}
