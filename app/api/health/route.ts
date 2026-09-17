import { list } from '@vercel/blob'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Deployment check: which required settings this deployment can see (yes/no only, never values),
// whether the database answers and whether the Blob read-write token works. Public so it works before
// the access code is set up.
export async function GET() {
  const names = ['ACCESS_CODE', 'PUBLIC_BASE_URL', 'JWT_PRIVATE_KEY', 'JWT_PUBLIC_KEY', 'DATABASE_URL', 'BLOB_READ_WRITE_TOKEN']
  const env = Object.fromEntries(names.map((n) => [n, !!process.env[n]?.trim()]))

  let database = 'not configured'
  if (process.env.DATABASE_URL) {
    try { await query('select 1'); database = 'ok' } catch { database = 'error' }
  }

  const rw = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  let blob = 'not configured'
  if (rw) {
    try { await list({ limit: 1, token: rw }); blob = 'ok' } catch (e) { blob = `error: ${(e as Error).name}: ${(e as Error).message}`.slice(0, 200) }
  }
  const rwStore = rw?.split('_')[3]?.toLowerCase()
  const connectedStore = process.env.BLOB_STORE_ID?.replace(/^store_/, '').toLowerCase()

  return Response.json({
    env,
    database,
    blob,
    blobTokenLooksValid: !!rw && rw.startsWith('vercel_blob_rw_') && !/["'\s]/.test(rw),
    blobTokenMatchesConnectedStore: connectedStore ? rwStore === connectedStore : null,
    publicBaseUrlMatches: process.env.PUBLIC_BASE_URL === `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
  }, { headers: { 'cache-control': 'no-store' } })
}
