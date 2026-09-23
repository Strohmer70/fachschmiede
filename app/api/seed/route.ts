// app/api/seed/route.ts — DB-Backfill aus system-config.js (SSOT)
// GET/POST ?key=<SEED_SECRET>          → trades + cities + fehlende landing_pages anlegen
// GET/POST ?key=<SEED_SECRET>&cleanup=1 → Test-Tenants (probe-*/e2e-*) löschen
// Idempotent: existierende Slugs werden NICHT überschrieben (rented Seiten sicher!)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { SYSTEM_CONFIG } from '@/config/system-config.js'

export const dynamic = 'force-dynamic'

const PRICE_DEFAULT = 18900 // €189/Monat

function authorized(req: NextRequest): boolean {
  const key = req.nextUrl.searchParams.get('key') || req.headers.get('x-seed-key') || ''
  const secret = process.env.SEED_SECRET || ''
  return Boolean(secret) && key === secret
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stats: any = { trades: { upserted: 0, errors: [] }, cities: { upserted: 0, errors: [] }, landing_pages: { inserted: 0, skipped_existing: 0, errors: [] }, cleanup: null }

  // ── 1) Gewerke upserten ──
  const tradeList = Object.values((SYSTEM_CONFIG as any).trades || {}) as any[]
  for (const t of tradeList) {
    const { error } = await supabaseAdmin
      .from('trades')
      .upsert({ slug: t.id || t.slug, name: t.name }, { onConflict: 'slug' })
    if (error) stats.trades.errors.push({ slug: t.id || t.slug, msg: error.message })
    else stats.trades.upserted++
  }

  // ── 2) Städte upserten ──
  const cityList = Object.values((SYSTEM_CONFIG as any).cities || {}) as any[]
  for (const c of cityList) {
    const { error } = await supabaseAdmin
      .from('cities')
      .upsert({ slug: c.slug, name: c.name, region: c.region || 'Nordrhein-Westfalen' }, { onConflict: 'slug' })
    if (error) stats.cities.errors.push({ slug: c.slug, msg: error.message })
    else stats.cities.upserted++
  }

  // ── 3) IDs laden ──
  const { data: tradeRows } = await supabaseAdmin.from('trades').select('id, slug')
  const { data: cityRows } = await supabaseAdmin.from('cities').select('id, slug')
  const tradeIdBySlug = Object.fromEntries((tradeRows || []).map((r: any) => [r.slug, r.id]))
  const cityIdBySlug = Object.fromEntries((cityRows || []).map((r: any) => [r.slug, r.id]))

  // ── 4) Bestehende landing_pages-Slugs (nicht überschreiben!) ──
  const { data: existing } = await supabaseAdmin.from('landing_pages').select('slug, status')
  const existingSlugs = new Set((existing || []).map((r: any) => r.slug))
  stats.landing_pages.skipped_existing = existingSlugs.size

  // ── 5) Fehlende Kombos anlegen ──
  for (const t of tradeList) {
    const tSlug = t.id || t.slug
    const tradeId = tradeIdBySlug[tSlug]
    if (!tradeId) { stats.landing_pages.errors.push({ slug: tSlug, msg: 'trade-id fehlt' }); continue }
    for (const c of cityList) {
      const cityId = cityIdBySlug[c.slug]
      if (!cityId) { stats.landing_pages.errors.push({ slug: c.slug, msg: 'city-id fehlt' }); continue }
      const slug = `${tSlug}-${c.slug}`
      if (existingSlugs.has(slug)) continue
      const { error } = await supabaseAdmin.from('landing_pages').insert({
        city_id: cityId,
        trade_id: tradeId,
        slug,
        title: `${t.name} ${c.name}`,
        h1: `${t.name} ${c.name}`,
        monthly_price: PRICE_DEFAULT,
        status: 'available',
      })
      if (error) stats.landing_pages.errors.push({ slug, msg: error.message })
      else { stats.landing_pages.inserted++; existingSlugs.add(slug) }
    }
  }

  // ── 6) Optional: Test-Tenants aufräumen ──
  if (req.nextUrl.searchParams.get('cleanup') === '1') {
    const testEmails = ['probe-a@fachschmiede.de', 'probe-b@fachschmiede.de', 'e2e-test@fachschmiede.de', 'e2e-test2@fachschmiede.de']
    const { data: tenants } = await supabaseAdmin.from('tenants').select('id, email').in('email', testEmails)
    const ids = (tenants || []).map((t: any) => t.id)
    let deletedCust = 0
    if (ids.length) {
      const { count } = await supabaseAdmin.from('page_customizations').delete({ count: 'exact' }).in('tenant_id', ids)
      deletedCust = count || 0
      await supabaseAdmin.from('tenants').delete().in('id', ids)
    }
    stats.cleanup = { tenants_deleted: ids.length, customizations_deleted: deletedCust }
  }

  return NextResponse.json({ ok: stats.trades.errors.length === 0 && stats.cities.errors.length === 0, ...stats })
}

export const POST = GET
