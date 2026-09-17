import { query } from '@/lib/db'
import { verify } from '@/lib/token'

// Public listing details for a tour link, so the demo portal shows real data instead of dummy text.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const tid = await verify((await params).token)
  const [tour] = tid ? await query('select title, description, photos, expires_at from tours where id = $1', [tid]) : []
  if (!tour) return Response.json({ error: 'invalid link' }, { status: 404 })
  return Response.json({
    title: tour.title,
    description: tour.description,
    photos: tour.photos.length,
    active: new Date(tour.expires_at) > new Date(),
  })
}
