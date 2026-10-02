// app/api/tenant/customization/route.ts — Mieter-Dashboard Daten (Token-Auth)
// GET   → eigene Daten + VOLLSTÄNDIGE Customization (alle Felder) + Default-Texte
// PATCH → Customization aktualisieren — ALLE Dashboard-Felder (2026-09-30 voll verdrahtet)
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'
import { getPageServices } from '@/config/system-config.js'
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

  // ALLE Customization-Zeilen des Tenants
  const { data: custs } = await supabaseAdmin
    .from('page_customizations')
    .select(`*, landing_page:landing_pages(slug, title, status, rented_by)`)
    .eq('tenant_id', auth.tenantId)
    .order('updated_at', { ascending: false })

  // 2026-10-02: KONTEXT = aktuell VERMIETETE Seite. Früher = custs[0] → bei mehreren
  // Zeilen (z.B. Testhinterlassenschaften) zeigte das Dashboard die falsche Seite
  // (Bug-Report: Miete dachdecker-castrop-rauxel, Dashboard zeigte elektriker-bochum).
  const list = custs || []
  const first: any =
    list.find((c: any) => c.landing_page?.status === 'rented' && c.landing_page?.rented_by === auth.tenantId)
    || list.find((c: any) => c.landing_page?.status === 'rented')
    || list.find((c: any) => c.is_active === true)
    || list[0]
    || null
  let defaultAbout = ''
  if (first?.landing_page?.slug) {
    const key = findDefaultsKey(String(first.landing_page.slug))
    if (key) defaultAbout = [DEFAULTS[key]?.about, DEFAULTS[key]?.aboutP2].filter(Boolean).join('\n\n')
  }

  // 2026-10-01: Leistungskarten-Labels für den Module-Tab (SSOT, pro Gewerk)
  const firstSlug = first?.landing_page?.slug || null
  const availableServices = firstSlug ? getPageServices(String(firstSlug)) : []

  return json({
    ok: true,
    tenant,
    customization: first,
    customizations: custs || [],
    default_about: defaultAbout,
    available_services: availableServices,
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
  // 2026-10-01: Mieter-Bilder (Upload liefert URL, hier persistiert)
  logo_url: 'custom_logo_url', hero_url: 'custom_hero_url', team_url: 'custom_team_url',
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
  // 2026-10-01: Referenzfotos (max 6 URLs — Uploads einzeln, Dashboard sendet gesamtes Array)
  if (body.gallery_urls !== undefined) {
    // 2026-10-02: Items = {url, text?} — der Kurztext wird unter dem Bild auf der
    // Mietseite angezeigt. Legacy-Strings werden zu {url, text:''} normalisiert.
    // Leeres Ergebnis = „Zurück zur Vorlage" → NULL (Vorlagen-Galerie greift wieder).
    const raw = Array.isArray(body.gallery_urls) ? body.gallery_urls : []
    const items = raw
      .map((g: any) => {
        if (typeof g === 'string') return /^https:\/\//.test(g) ? { url: String(g).slice(0, 500), text: '' } : null
        if (g && typeof g === 'object' && /^https:\/\//.test(String(g.url || ''))) {
          return { url: String(g.url).slice(0, 500), text: String(g.text || '').trim().slice(0, 140) }
        }
        return null
      })
      .filter(Boolean)
      .slice(0, 6)
    update.custom_gallery_urls = items.length ? items : null
  }
  // 2026-10-01: Modul-Toggles — {key:bool}, nur bekannte Keys, max 20 Einträge
  if (body.modules_enabled !== undefined && body.modules_enabled !== null && typeof body.modules_enabled === 'object' && !Array.isArray(body.modules_enabled)) {
    const clean: Record<string, boolean> = {}
    for (const [k, v] of Object.entries(body.modules_enabled).slice(0, 20)) {
      if (/^[a-z_][a-z0-9_]{0,29}$/.test(k)) clean[k] = v === true
    }
    update.modules_enabled = clean
  }
  // Leistungskarten-Toggles — {label:bool}, Label = exakter Karten-Text
  if (body.services_active !== undefined && body.services_active !== null && typeof body.services_active === 'object' && !Array.isArray(body.services_active)) {
    const clean: Record<string, boolean> = {}
    for (const [k, v] of Object.entries(body.services_active).slice(0, 30)) {
      const label = String(k).slice(0, 60)
      if (label) clean[label] = v === true
    }
    update.services_active = clean
  }
  // 2026-10-03: Eigene Leistungen = [{name, desc}] — kurzer Beschreibungstext optional.
  // Legacy-Strings werden automatisch zu {name, desc:''} normalisiert.
  if (body.custom_services !== undefined) {
    const raw = Array.isArray(body.custom_services) ? body.custom_services : []
    const items = Array.from(new Set(raw.map((s: unknown) => {
      if (typeof s === 'string') return JSON.stringify({ name: s.trim().slice(0, 60), desc: '' })
      if (s && typeof s === 'object') {
        const o = s as Record<string, unknown>
        return JSON.stringify({
          name: String(o.name || o.n || '').trim().slice(0, 60),
          desc: String(o.desc || o.d || '').trim().slice(0, 140),
        })
      }
      return ''
    }).filter((x: string) => {
      if (!x) return false
      try { return !!JSON.parse(x).name } catch { return false }
    }))).map((j: unknown) => JSON.parse(j as string) as { name: string; desc: string }).slice(0, 8)
    update.custom_services = items.length ? items : null
  }
  if (Object.keys(update).length === 0) {
    return json({ error: 'Nichts zu ändern.' }, 400)
  }
  update.updated_at = new Date().toISOString()

  // 2026-10-02: NUR Zeilen auf aktuell VERMIETETEN Seiten. Früher: ALLE Zeilen des
  // Tenants → gespeicherte Werte kaskadierten auch auf frühere Testseiten.
  const { data: rentedPages } = await supabaseAdmin
    .from('landing_pages')
    .select('id')
    .eq('rented_by', auth.tenantId)
    .eq('status', 'rented')
  if (!rentedPages || rentedPages.length === 0) return json({ error: 'Keine Mietseite gefunden.' }, 404)

  const pageIds = (rentedPages as { id: string }[]).map((p) => p.id)
  const { data: custs, error: findErr } = await supabaseAdmin
    .from('page_customizations')
    .select('id, landing_page_id')
    .eq('tenant_id', auth.tenantId)
    .in('landing_page_id', pageIds)
  if (findErr) return json({ error: 'DB-Fehler: ' + findErr.message }, 500)

  const ids = ((custs || []) as { id: string; landing_page_id: string }[]).map((c) => c.id)
  const existing = new Set(((custs || []) as { landing_page_id: string }[]).map((c) => c.landing_page_id))
  const missing = pageIds.filter((pid) => !existing.has(pid))

  // Fehlende Zeilen anlegen (Mieter hat auf dieser Seite noch nie gespeichert)
  let created = 0
  if (missing.length > 0) {
    const rows = missing.map((pid) => ({ landing_page_id: pid, tenant_id: auth.tenantId, is_active: true, ...update }))
    const { error: insErr } = await supabaseAdmin.from('page_customizations').insert(rows)
    if (insErr) return json({ error: 'Anlegen fehlgeschlagen: ' + insErr.message }, 500)
    created = rows.length
  }
  if (ids.length > 0) {
    const { error } = await supabaseAdmin.from('page_customizations').update(update).in('id', ids)
    if (error) return json({ error: 'Speichern fehlgeschlagen: ' + error.message }, 500)
  }

  return json({ ok: true, updated: ids.length + created })
}
