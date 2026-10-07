import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
// Data-Cache aus (vgl. stats route — 2026-10-02)
export const revalidate = 0

// 2026-10-01: Komplett-Rewrite.
// - Vorher: MRR zählte ALLE 'rented' Seiten (Testmieten ohne Stripe = Phantom-Umsatz)
// - Vorher: tenants-Join über nicht-existente FK → Tabelle IMMER leer
// - Jetzt: Zwei-Query-Ansatz via rented_by, Split live (Stripe-Sub vorhanden) / test
export async function GET() {
  try {
    // ── 1) Alle Mieter ──
    const { data: tenants, error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .select('id, email, company_name, contact_name, phone, stripe_customer_id, stripe_subscription_id, paypal_subscription_id, payment_provider, subscription_status, created_at')
      .order('created_at', { ascending: false })

    if (tenantsError) throw new Error('Tenants: ' + tenantsError.message)

    // ── 2) Vermietete Seiten mit den Mieter-IDs ──
    const tenantIds = (tenants || []).map(t => t.id)
    let pages: any[] = []
    if (tenantIds.length > 0) {
      const { data: p, error: pagesError } = await supabaseAdmin
        .from('landing_pages')
        .select('id, slug, title, monthly_price, status, rented_by, trade:trades(name, slug), city:cities(name, slug)')
        .in('rented_by', tenantIds)
      if (pagesError) throw new Error('Pages: ' + pagesError.message)
      pages = p || []
    }

    // ── 3) Seiten → Mieter zuordnen, live/test markieren ──
    const pagesByTenant: Record<string, any[]> = {}
    pages.forEach(p => {
      if (!p.rented_by) return
      if (!pagesByTenant[p.rented_by]) pagesByTenant[p.rented_by] = []
      pagesByTenant[p.rented_by].push(p)
    })

    // 2026-10-03: LIVE = Abo vorhanden UND Status aktiv (gekündigte Subs mit
    // gespeicherter ID waren vorher ewig "live" → Phantom-Umsatz)
    // 2026-10-07: PayPal-Mieter zählen genauso (stripe_subscription_id ODER paypal_subscription_id)
    const hasLiveSub = (t: any) =>
      (t.stripe_subscription_id || t.paypal_subscription_id) && t.subscription_status === 'active'
    const tenantsWithPages = (tenants || []).map(t => ({
      ...t,
      is_test: !hasLiveSub(t),
      landing_page: (pagesByTenant[t.id] || [])[0] || null,
      rented_pages: pagesByTenant[t.id] || [],
    }))

    // ── 4) MRR: NUR Live-Mieten (aktive Subscription, Stripe oder PayPal) ──
    const livePages = pages.filter(p => {
      const t = (tenants || []).find(x => x.id === p.rented_by)
      return t ? hasLiveSub(t) : false
    })
    const testPages = pages.filter(p => {
      const t = (tenants || []).find(x => x.id === p.rented_by)
      return t && !hasLiveSub(t)
    })

    const mrrCents = livePages.reduce((sum, r) => sum + (r.monthly_price || 0), 0)
    const mrr = Math.round(mrrCents / 100)
    const arr = mrr * 12
    const testMrr = Math.round(testPages.reduce((sum, r) => sum + (r.monthly_price || 0), 0) / 100)

    // ── 5) Umsatz nach Gewerk (nur LIVE — Test nicht als Umsatz zählen) ──
    const revenueByTrade: Record<string, { name: string, slug: string, revenue: number, count: number }> = {}
    livePages.forEach((r: any) => {
      const tradeSlug = r.trade?.slug || 'unknown'
      const tradeName = r.trade?.name || 'Unbekannt'
      if (!revenueByTrade[tradeSlug]) {
        revenueByTrade[tradeSlug] = { name: tradeName, slug: tradeSlug, revenue: 0, count: 0 }
      }
      revenueByTrade[tradeSlug].revenue += (r.monthly_price || 0) / 100
      revenueByTrade[tradeSlug].count += 1
    })

    // ── 6) Überfällige (past_due) ──
    const overdueTenants = tenantsWithPages.filter(t => t.subscription_status === 'past_due')
    const openInvoicesTotal = overdueTenants.reduce((sum, t) => {
      return sum + (t.rented_pages || []).reduce((s: number, p: any) => s + (p.monthly_price || 0) / 100, 0)
    }, 0)

    return NextResponse.json({
      success: true,
      stats: {
        mrr,
        arr,
        testMrr,
        liveCount: livePages.length,
        testCount: testPages.length,
        liveMrr: mrr,
        openInvoicesTotal: Math.round(openInvoicesTotal * 100) / 100,
        openInvoicesCount: overdueTenants.length,
        totalCount: pages.length,
        standardPrice: 189,
      },
      revenueByTrade: Object.values(revenueByTrade).map((t: any) => ({
        ...t,
        revenue: Math.round(t.revenue * 100) / 100
      })),
      tenants: tenantsWithPages,
      overdue: overdueTenants,
    }, { headers: { 'Cache-Control': 'no-store' } })

  } catch (error: any) {
    console.error('Billing API error:', error)
    return NextResponse.json({
      error: 'Failed to load billing data',
      message: error.message,
      stats: { mrr: 0, arr: 0, testMrr: 0, liveCount: 0, testCount: 0, openInvoicesTotal: 0, openInvoicesCount: 0 },
      revenueByTrade: [],
      tenants: [],
      overdue: [],
    }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
