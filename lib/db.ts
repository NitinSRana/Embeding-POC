import { Pool } from 'pg'

const SCHEMA = `
create table if not exists tours (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  photos jsonb not null,
  expires_at timestamptz not null default now() + interval '1 year',
  created_at timestamptz not null default now()
);
alter table tours add column if not exists token text;
create table if not exists events (
  id bigserial primary key,
  tour_id uuid not null references tours(id),
  type text not null,
  session_id text,
  referrer text,
  referer_header text,
  user_agent text,
  device text,
  created_at timestamptz not null default now()
);
alter table events add column if not exists source text;`

type Q = (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>

// Survive dev hot reloads: one connection per process.
const g = globalThis as unknown as { db?: Promise<Q> }

async function connect(): Promise<Q> {
  if (process.env.DATABASE_URL) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
    try {
      await pool.query(SCHEMA)
    } catch (e: any) {
      // Two cold starts creating the schema at once can collide; the other one already made it.
      if (!['23505', '42P07', '42701'].includes(e?.code)) throw e
    }
    return (sql, params) => pool.query(sql, params)
  }
  // ponytail: embedded single-process Postgres for local dev; set DATABASE_URL for anything shared
  const { PGlite } = await import('@electric-sql/pglite') // loaded only locally, never on Vercel
  const lite = new PGlite('.pglite')
  await lite.exec(SCHEMA)
  return (sql, params) => lite.query(sql, params)
}

export async function query(sql: string, params?: unknown[]) {
  g.db ??= connect().catch((e) => { g.db = undefined; throw e }) // retry on next request if the DB was unreachable
  return (await g.db)(sql, params).then((r) => r.rows)
}
