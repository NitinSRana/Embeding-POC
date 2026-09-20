import { query } from '@/lib/db'
import { save, isOwnBlobImage } from '@/lib/storage'
import { sign } from '@/lib/token'
import { EXT, MAX_PHOTOS } from '@/lib/images'

const MAX_BYTES = 50 * 1024 * 1024 // local multipart only; keep in sync with proxyClientMaxBodySize in next.config.ts
const MAX_AMENITIES = 30

const clean = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n)

// Amenities arrive as one-per-line text from the form, or already as an array over JSON.
const amenityList = (v: unknown) =>
  (Array.isArray(v) ? v : String(v ?? '').split('\n'))
    .map((a) => clean(a, 60))
    .filter(Boolean)
    .slice(0, MAX_AMENITIES)

// The property details shown on the standalone tour page. All optional — a tour is still just
// a title and photos; these only fill out the page a visitor lands on from a portal link.
type Details = { address: string; price: string; beds: string; baths: string; area: string; amenities: string[] }
const details = (get: (k: string) => unknown): Details => ({
  address: clean(get('address'), 200),
  price: clean(get('price'), 60),
  beds: clean(get('beds'), 20),
  baths: clean(get('baths'), 20),
  area: clean(get('area'), 40),
  amenities: amenityList(get('amenities')),
})

async function createTour(title: string, description: string, photos: string[], d: Details) {
  const id = crypto.randomUUID()
  // Store the token so embed codes stay identical on every page load (ES256 signatures are randomised).
  await query(
    `insert into tours (id, title, description, photos, token, address, price, beds, baths, area, amenities)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [id, title, description, JSON.stringify(photos), await sign(id),
      d.address || null, d.price || null, d.beds || null, d.baths || null, d.area || null,
      d.amenities.length ? JSON.stringify(d.amenities) : null],
  )
  return id
}

export async function POST(req: Request) {
  try {
    return await handle(req)
  } catch (e) {
    console.error('create tour failed', e)
    return new Response(`Could not create the tour: ${(e as Error).message}`, { status: 500 })
  }
}

async function handle(req: Request) {
  // Deployed flow: photos already uploaded to Vercel Blob by the browser; we receive their URLs.
  if (req.headers.get('content-type')?.includes('application/json')) {
    let body: any
    try { body = await req.json() } catch { return new Response('Bad request', { status: 400 }) }
    const title = clean(body?.title, 200)
    const photos: unknown[] = Array.isArray(body?.photos) ? body.photos : []
    if (!title || photos.length === 0 || photos.length > MAX_PHOTOS) return new Response(`Title and 1-${MAX_PHOTOS} photos are required`, { status: 400 })
    const checks = await Promise.all(photos.map(isOwnBlobImage))
    if (checks.includes(false)) return new Response('One or more photos were not uploaded to this site', { status: 400 })
    const id = await createTour(title, clean(body.description, 2000), photos as string[], details((k) => body?.[k]))
    return Response.json({ id }, { status: 201 })
  }

  // Local / no-JS flow: multipart form with the files themselves.
  if (Number(req.headers.get('content-length')) > MAX_BYTES) return new Response('Upload is larger than 50 MB', { status: 413 })
  let form: FormData
  try { form = await req.formData() } catch { return new Response('Upload could not be read', { status: 400 }) }
  const title = clean(form.get('title'), 200)
  const files = form.getAll('photos').filter((f): f is File => f instanceof File && f.type in EXT).slice(0, MAX_PHOTOS)
  if (!title || files.length === 0) return new Response('Title and at least one JPG, PNG, WebP, GIF or AVIF photo are required', { status: 400 })

  const folder = crypto.randomUUID()
  const photos = await Promise.all(files.map(async (f, i) => save(`${folder}/${i}.${EXT[f.type]}`, Buffer.from(await f.arrayBuffer()), f.type)))
  const id = await createTour(title, clean(form.get('description'), 2000), photos, details((k) => form.get(k)))
  return Response.redirect(new URL(`/tours/${id}`, req.url), 303)
}
