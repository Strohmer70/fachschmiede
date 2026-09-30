// app/api/tenant/customization/route.ts — Mieter-Dashboard Daten (Token-Auth)
// GET   → eigene Daten + VOLLSTÄNDIGE Customization (alle Felder) + Default-Texte
// PATCH → Customization aktualisieren — ALLE Dashboard-Felder (2026-09-30 voll verdrahtet)
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'
import defaultsJson from '../../_lib/default-content.json'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// 2026-09-30: no-store — sonst cached Vercel/Next GET-Responses (eingefrorene Daten).
const json = (data: any, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Canary': new Date().toISOString(),
    },
  })

// Typ-Hilfe für das generierte JSON (120 Slugs)
const DEFAULTS: Record<string, { about?: string; aboutP2?: string }> = defaultsJson as any

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

/** DB-Slug (z.B. "dachdecker-castrop-rauxel") → Default-Content-Key (z.B. "dach-castrop-rauxel") */
function findDefaultsKey(dbSlug: string): string | null {
  if (DEFAULTS[dbSlug]) return dbSlug
  let best: string | null = null
  for (const key of Object.keys(DEFAULTS)) {
    const suffix = '-' + key.split('-').slice(1).join('-')
    if (dbSlug.endsWith(suffix) && (!best || key.length > best.length)) best = key
  }
  return best
}

const CUST_SELECT = '*'

export async function GET(request: Request) {
  const auth = await authTenant(request)
  if ('error' in auth) return json({ error: auth.error }, auth.status)

  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('id, email, company_name, contact_name, phone, subscription_status, created_at')
    .eq('id', auth.tenantId)
    .maybeSingle()
  if (!tenant) return json({ error: 'Konto nicht gefunden.' }, 404)

  // ALLE Mietseiten des Tenants
  const { data: custs } = await supabaseAdmin
    .from('page_customizations')
    .select(`*, landing_page:landing_pages(slug, title, status)`)
    .eq('tenant_id', auth.tenantId)
    .order('updated_at', { ascending: false })

  const first: any = custs?.[0] || null
  let defaultAbout = ''
  if (first?.landing_page?.slug) {
    const key = findDefaultsKey(String(first.landing_page.slug))
    if (key) defaultAbout = [DEFAULTS[key]?.about, DEFAULTS[key]?.aboutP2].filter(Boolean).join('\n\n')
  }

  return json({
    ok: true,
    tenant,
    customization: first,
    customizations: custs || [],
    default_about: defaultAbout,
  })
}

// Vollständige Feldliste (Dashboard ↓ DB-Spalte). 2026-09-30: ALLE Felder live.
const STRING_FIELDS: Record<string, string> = {
  // Basis
  firma: 'custom_company_name', company: 'custom_company_name',
  phone: 'custom_phone', email: 'custom_email',
  welcome: 'custom_welcome_text', about_text: 'about_text',
  address: 'custom_address', opening_hours: 'opening_hours',
  whatsapp_number: 'whatsapp_number', google_maps_place_id: 'google_maps_place_id',
  project_count: 'project_count', team_size: 'team_size', guild_name: 'guild_name',
  accent_color: 'accent_color',
  // Rechtliches
  rechtsform: 'rechtsform', vertretung: 'vertretung', ust_id: 'ust_id',
  hwk_name: 'hwk_name', hwk_number: 'hwk_number',
  berufsbezeichnung: 'berufsbezeichnung', verantwortlicher: 'verantwortlicher',
  datenschutz_beauftragter: 'datenschutz_beauftragter',
  // Auch DB-Spaltennamen direkt akzeptieren
  custom_company_name: 'custom_company_name', custom_phone: 'custom_phone',
  custom_email: 'custom_email', custom_welcome_text: 'custom_welcome_text',
  custom_address: 'custom_address',
}
const BOOL_FIELDS: Record<string, string> = {
  whatsapp_enabled: 'whatsapp_enabled', google_maps_enabled: 'google_maps_enabled',
  show_founding_year: 'show_founding_year', show_project_count: 'show_project_count',
  show_team_size: 'show_team_size',
  is_master_company: 'is_master_company', is_guild_member: 'is_guild_member',
  eu_streitschlichtung: 'eu_streitschlichtung',
}

export async function PATCH(request: Request) {
  const auth = await authTenant(request)
  if ('error' in auth) return json({ error: auth.error }, auth.status)

  const body = await request.json().catch(() => ({}))
  const update: Record<string, unknown> = {}
  for (const [key, col] of Object.entries(STRING_FIELDS)) {
    if (body[key] !== undefined) update[col] = String(body[key]).slice(0, 2000) || null
  }
  for (const [key, col] of Object.entries(BOOL_FIELDS)) {
    if (body[key] !== undefined) update[col] = body[key] === true || body[key] === 'true' || body[key] === 1
  }
  if (body.founding_year !== undefined) update.founding_year = parseInt(String(body.founding_year), 10) || null
  if (body.service_areas !== undefined) {
    update.service_areas = Array.isArray(body.service_areas)
      ? body.service_areas.map(String).filter(Boolean).slice(0, 30)
      : String(body.service_areas || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 30)
  }
  if (Object.keys(update).length === 0) {
    return json({ error: 'Nichts zu ändern.' }, 400)
  }
  update.updated_at = new Date().toISOString()

  // ALLE Customization-Zeilen des Tenants aktualisieren (gleiche Firmendaten auf jeder Mietseite)
  const { data: custs, error: findErr } = await supabaseAdmin
    .from('page_customizations')
    .select('id')
    .eq('tenant_id', auth.tenantId)
  if (findErr) return json({ error: 'DB-Fehler: ' + findErr.message }, 500)
  if (!custs || custs.length === 0) return json({ error: 'Keine Mietseite gefunden.' }, 404)

  const ids = custs.map((c: { id: string }) => c.id)
  const { error } = await supabaseAdmin.from('page_customizations').update(update).in('id', ids)
  if (error) return json({ error: 'Speichern fehlgeschlagen: ' + error.message }, 500)

  return json({ ok: true, updated: ids.length })
}
