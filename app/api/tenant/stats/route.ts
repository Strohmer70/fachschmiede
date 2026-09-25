// app/api/tenant/stats/route.ts — Echte Dashboard-Statistik für Mieter
// GET /api/tenant/stats/ (Bearer-Token) →
//   { leads_30d, visitors_30d, recent_leads }
// Datenquellen:
//   leads_30d     → leads-Tabelle (tenant_id, created_at)
//   visitors_30d  → page_views (daily-unique Hash, DSGVO-sauber)
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function getSecret(): string {
  return process.env.SESSION_SECRET || process.env.STRIPE_SECRET_KEY || 'dev-secret-nur-lokal'
}

async function authTenant(request: Request): Promise<{ tenantId: string } | { error: string; status: number }> {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token) return { error: 'Nicht eingeloggt.', status: 401 }
  const payload = verifyToken<{ tid: string }>(token, getSecret())
  if (!payload?.tid) return { error: 'Session ungültig oder abgelaufen – bitte erneut einloggen.', status: 401 }
  return { tenantId: payload.tid }
}

export async function GET(request: Request) {
  const auth = await authTenant(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  // ── Mietseite des Tenants (für Besucher-Zuordnung) ──
  const { data: cust } = await supabaseAdmin
    .from('page_customizations')
    .select('landing_page:landing_pages(slug)')
    .eq('tenant_id', auth.tenantId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const slug = (cust as any)?.landing_page?.slug || null

  const sinceIso = new Date(Date.now() - THIRTY_DAYS_MS).toISOString()
  const sinceDay = sinceIso.slice(0, 10)

  // ── Anfragen letzte 30 Tage ──
  let leads30 = 0
  try {
    const { count } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId)
      .gte('created_at', sinceIso)
    leads30 = count ?? 0
  } catch (e) {
    console.error('[tenant/stats] leads count failed:', e)
  }

  // ── Besucher letzte 30 Tage (Daily-Uniques: distinct (d, vh)) ──
  let visitors30: number | null = null
  if (slug) {
    try {
      const { data: rows } = await supabaseAdmin
        .from('page_views')
        .select('d, vh')
        .eq('slug', slug)
        .gte('d', sinceDay)
      const uniq = new Set((rows || []).map((r: any) => `${r.d}|${r.vh}`))
      visitors30 = uniq.size
    } catch (e) {
      console.error('[tenant/stats] visitors count failed:', e)
    }
  }

  // ── Letzte Anfragen (max. 20, für Leads-Tab) ──
  let recent: any[] = []
  try {
    const { data } = await supabaseAdmin
      .from('leads')
      .select('id, name, phone, message, status, created_at')
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })
      .limit(20)
    recent = data || []
  } catch (e) {
    console.error('[tenant/stats] recent leads failed:', e)
  }

  return NextResponse.json({ ok: true, leads_30d: leads30, visitors_30d: visitors30, recent_leads: recent })
}
