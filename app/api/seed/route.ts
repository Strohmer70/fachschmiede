// app/api/seed/route.ts — DB-Backfill aus system-config.js (SSOT), SCHEMA-ADAPTIV
// Liest die echten Spalten aus Bestandszeilen und baut Payloads nur mit vorhandenen Spalten.
// GET/POST ?key=<SEED_SECRET>            → trades + cities + fehlende landing_pages anlegen
// GET/POST ?key=<SEED_SECRET>&cleanup=1  → Test-Tenants (probe-*/e2e-*) löschen
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

async function tableColumns(table: string): Promise<Set<string>> {
  const { data } = await supabaseAdmin.from(table).select('*').limit(1)
  const row = (data || [])[0] || {}
  return new Set(Object.keys(row))
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stats: any = { schema: {}, trades: { upserted: 0, errors: [] }, cities: { upserted: 0, errors: [] }, landing_pages: { inserted: 0, skipped_existing: 0, errors: [] }, cleanup: null }

  // ── 0) Echte Spalten erfassen ──
  const [tradeCols, cityCols, pageCols] = await Promise.all([
    tableColumns('trades'), tableColumns('cities'), tableColumns('landing_pages'),
  ])
  stats.schema = {
    trades: Array.from(tradeCols), cities: Array.from(cityCols),
    landing_pages_sample: Array.from(pageCols).slice(0, 12),
  }

  const pick = (cols: Set<string>, obj: Record<string, any>) => {
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(obj)) if (cols.has(k)) out[k] = v
    return out
  }

  // ── 1) Gewerke upserten (t.slug — NICHT t.id: garten id='gartenbau', slug='garten-und-landschaftsbau') ──
  const tradeList = Object.values((SYSTEM_CONFIG as any).trades || {}) as any[]
  for (const t of tradeList) {
    const payload = pick(tradeCols, {
      slug: t.slug || t.id,
      name: t.name,
      plural_name: t.plural || t.name,
      emoji: t.emoji || t.icon,
      color: t.color ? JSON.stringify(t.color) : undefined,
    })
    if (!('slug' in payload)) { stats.trades.errors.push({ slug: t.slug, msg: 'trades hat keine slug-Spalte?!' }); continue }
    const { error } = await supabaseAdmin.from('trades').upsert(payload, { onConflict: 'slug' })
    if (error) stats.trades.errors.push({ slug: t.slug, msg: error.message })
    else stats.trades.upserted++
  }

  // ── 2) Städte upserten ──
  const cityList = Object.values((SYSTEM_CONFIG as any).cities || {}) as any[]
  for (const c of cityList) {
    const payload = pick(cityCols, { slug: c.slug, name: c.name, state: c.region, region: c.region })
    const { error } = await supabaseAdmin.from('cities').upsert(payload, { onConflict: 'slug' })
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
    const tSlug = t.slug || t.id
    const tradeId = tradeIdBySlug[tSlug]
    if (!tradeId) { stats.landing_pages.errors.push({ slug: tSlug, msg: 'trade-id fehlt (upsert fehlgeschlagen?)' }); continue }
    for (const c of cityList) {
      const cityId = cityIdBySlug[c.slug]
      if (!cityId) { stats.landing_pages.errors.push({ slug: c.slug, msg: 'city-id fehlt' }); continue }
      const slug = `${tSlug}-${c.slug}`
      if (existingSlugs.has(slug)) continue
      const payload = pick(pageCols, {
        city_id: cityId,
        trade_id: tradeId,
        slug,
        title: `${t.name} ${c.name}`,
        h1: `${t.name} ${c.name}`,
        monthly_price: PRICE_DEFAULT,
        status: 'available',
      })
      const { error } = await supabaseAdmin.from('landing_pages').insert(payload)
      if (error) stats.landing_pages.errors.push({ slug, msg: error.message })
      else { stats.landing_pages.inserted++; existingSlugs.add(slug) }
    }
  }

  // ── 6) Optional: Test-Tenants aufräumen ──
  if (req.nextUrl.searchParams.get('cleanup') === '1') {
    const testEmails = ['probe-a@fachschmiede.de', 'probe-b@fachschmiede.de', 'e2e-test@fachschmiede.de', 'e2e-test2@fachschmiede.de', 'probe-final@fachschmiede.de', 'probe-check@fachschmiede.de']
    const { data: tenantsAll } = await supabaseAdmin.from('tenants').select('id, email, subscription_status').limit(30)
    stats.tenants_sample = tenantsAll || []
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

  // ── 7) Reconcile: Bezahlung manuell einlösen (z.B. wenn Webhook-Secret mismatch war) ──
  const reconcileSlug = req.nextUrl.searchParams.get('reconcile')
  if (reconcileSlug) {
    const email = (req.nextUrl.searchParams.get('tenant_email') || '').toLowerCase().trim()
    const { data: page } = await supabaseAdmin.from('landing_pages').select('id, slug, status, rented_by').eq('slug', reconcileSlug).maybeSingle()
    const { data: tenant } = await supabaseAdmin.from('tenants').select('id, email').eq('email', email).maybeSingle()
    let subId = ''
    try {
      const Stripe = require('stripe')
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' })
      const sess = await stripe.checkout.sessions.list({ customer_email: email, limit: 5 })
      const done = (sess.data || []).find((s: any) => s.payment_status === 'paid' && s.status === 'complete')
      subId = done?.subscription || ''
    } catch (e: any) { console.error('[reconcile] stripe lookup:', e?.message) }
    if (page && tenant) {
      await supabaseAdmin.from('landing_pages').update({ status: 'rented', rented_by: tenant.id, rented_at: new Date().toISOString() }).eq('id', page.id)
      await supabaseAdmin.from('page_customizations').update({ is_active: true }).eq('landing_page_id', page.id).eq('tenant_id', tenant.id)
      await supabaseAdmin.from('tenants').update({ subscription_status: 'active', ...(subId ? { stripe_subscription_id: subId } : {}) }).eq('id', tenant.id)
      stats.reconcile = { slug: reconcileSlug, email, ok: true, subscription: subId, page_was: page.status }
    } else {
      stats.reconcile = { slug: reconcileSlug, email, ok: false, page_found: Boolean(page), tenant_found: Boolean(tenant) }
    }
  }

  return NextResponse.json({
    ok: stats.trades.errors.length === 0 && stats.cities.errors.length === 0 && stats.landing_pages.errors.length === 0,
    ...stats,
  })
}

export const POST = GET
