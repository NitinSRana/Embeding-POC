import { Pool } from 'pg'
import { PGlite } from '@electric-sql/pglite'

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
);`

type Q = (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>

// Survive dev hot reloads: one connection per process.
const g = globalThis as unknown as { db?: Promise<Q> }

async function connect(): Promise<Q> {
  if (process.env.DATABASE_URL) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    await pool.query(SCHEMA)
    return (sql, params) => pool.query(sql, params)
  }
  // ponytail: embedded single-process Postgres for local dev; set DATABASE_URL for anything shared
  const lite = new PGlite('.pglite')
  await lite.exec(SCHEMA)
  return (sql, params) => lite.query(sql, params)
}

export async function query(sql: string, params?: unknown[]) {
  g.db ??= connect()
  return (await g.db)(sql, params).then((r) => r.rows)
}
