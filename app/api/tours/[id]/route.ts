import { query } from '@/lib/db'
import { removeFiles } from '@/lib/storage'

// Deletes a tour, its analytics and its photos. Behind the access code via proxy.ts.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404 })
  const [tour] = await query('select photos from tours where id = $1', [id])
  if (!tour) return new Response(null, { status: 404 })
  await query('delete from events where tour_id = $1', [id])
  await query('delete from tours where id = $1', [id])
  await removeFiles(tour.photos)
  return new Response(null, { status: 204 })
}
