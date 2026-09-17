import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Deployment check: which required settings this deployment can see (yes/no only, never values)
// and whether the database answers. Public so it works before the access code is set up.
export async function GET() {
  const names = ['ACCESS_CODE', 'PUBLIC_BASE_URL', 'JWT_PRIVATE_KEY', 'JWT_PUBLIC_KEY', 'DATABASE_URL', 'BLOB_READ_WRITE_TOKEN']
  const env = Object.fromEntries(names.map((n) => [n, !!process.env[n]?.trim()]))
  let database = 'not configured'
  if (process.env.DATABASE_URL) {
    try { await query('select 1'); database = 'ok' } catch { database = 'error' }
  }
  return Response.json({ env, database, publicBaseUrlMatches: process.env.PUBLIC_BASE_URL === `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` }, { headers: { 'cache-control': 'no-store' } })
}
