// app/api/admin/db/route.ts — Geschützter DDL-Runner für Schema-Migrationen
// NUR mit SEED_SECRET aufrufbar. DB-Passwort kommt per Header (x-db-password)
// oder Env (SUPABASE_DB_PASSWORD) — NIEMALS im Source hinterlegt.
//
// Aufruf (einmalig nach Deploy):
//   curl "https://www.fachschmiede.de/api/admin/db/?key=<SEED_SECRET>&step=page_views" \
//        -H "x-db-password: <DB-PASSWORT>"
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const STEPS: Record<string, string[]> = {
  page_views: [
    `CREATE TABLE IF NOT EXISTS public.page_views (
      id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      slug       text NOT NULL,
      d          date NOT NULL,
      vh         text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_page_views_slug_d ON public.page_views (slug, d)`,
    `ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY`,
    `COMMENT ON TABLE public.page_views IS 'DSGVO-schlanke Besucherzählung: Tages-Hash, keine IPs, keine Cookies'`,
    // ⚠️ Falle: Bei Erstellung via pg-Pooler greifen NICHT die supabase_admin-Default-ACLs!
    // service_role braucht explizite Grants, sonst 'permission denied for table' (BYPASSRLS ≠ GRANT).
    `GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_views TO service_role`,
  ],
}

async function run(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key') || req.headers.get('x-seed-key') || ''
  const secret = process.env.SEED_SECRET || ''
  if (!secret || key !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const step = req.nextUrl.searchParams.get('step') || 'page_views'
  const ddl = STEPS[step]
  if (!ddl) {
    return NextResponse.json({ error: `Unbekannter step. Verfügbar: ${Object.keys(STEPS).join(', ')}` }, { status: 400 })
  }

  const dbPassword = req.headers.get('x-db-password') || process.env.SUPABASE_DB_PASSWORD || ''
  if (!dbPassword) {
    return NextResponse.json({ error: 'x-db-password header fehlt' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const ref = supabaseUrl.replace(/^https?:\/\//, '').split('.')[0]
  if (!ref) {
    return NextResponse.json({ error: 'Supabase-Ref nicht ermittelbar' }, { status: 500 })
  }

  // WICHTIG: db.<ref>.supabase.co ist IPv6-only → Vercel-DNS kann ihn nicht auflösen.
  // Der Pooler (Port 6543, User postgres.<ref>) ist IPv4-tauglich und funktioniert überall.
  const region = process.env.SUPABASE_POOLER_HOST || 'aws-0-eu-central-1.pooler.supabase.com'

  let client: any = null
  try {
    const { Client } = await import('pg')
    client = new Client({
      host: region,
      port: 6543,
      user: `postgres.${ref}`,
      password: dbPassword,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    })
    await client.connect()
    for (const stmt of ddl) {
      await client.query(stmt)
    }
    return NextResponse.json({ ok: true, step, statements: ddl.length })
  } catch (e: any) {
    console.error('[admin/db] DDL failed:', e?.message)
    return NextResponse.json({ error: 'DDL fehlgeschlagen: ' + (e?.message || String(e)) }, { status: 500 })
  } finally {
    try { if (client) await client.end() } catch {}
  }
}

export async function GET(req: NextRequest) {
  return run(req)
}
export async function POST(req: NextRequest) {
  return run(req)
}
