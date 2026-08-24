import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // ── MRR & ARR ──
    const { data: rentals, error: rentalsError } = await supabaseAdmin
      .from('landing_pages')
      .select('monthly_price, trade:trades(name, slug)')
      .eq('status', 'rented')

    const mrrCents = rentals?.reduce((sum, r) => sum + (r.monthly_price || 0), 0) || 0
    const mrr = Math.round(mrrCents / 100)
    const arr = Math.round(mrr * 12)

    // ── Revenue by trade ──
    const revenueByTrade: Record<string, { name: string, slug: string, revenue: number, count: number }> = {}
    rentals?.forEach((r: any) => {
      const tradeSlug = r.trade?.slug || 'unknown'
      const tradeName = r.trade?.name || 'Unbekannt'
      if (!revenueByTrade[tradeSlug]) {
        revenueByTrade[tradeSlug] = { name: tradeName, slug: tradeSlug, revenue: 0, count: 0 }
      }
      revenueByTrade[tradeSlug].revenue += (r.monthly_price || 0) / 100
      revenueByTrade[tradeSlug].count += 1
    })

    // ── Active tenants with page info ──
    const { data: tenants, error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .select(`
        *,
        landing_page:landing_pages!inner(id, slug, title, monthly_price, status, trade:trades(name, slug), city:cities(name, slug))
      `)
      .eq('subscription_status', 'active')
      .order('created_at', { ascending: false })

    // ── Overdue / past_due ──
    const { data: overdueTenants } = await supabaseAdmin
      .from('tenants')
      .select(`
        *,
        landing_page:landing_pages!inner(id, slug, title, monthly_price, trade:trades(name, slug), city:cities(name, slug))
      `)
      .eq('subscription_status', 'past_due')
      .order('created_at', { ascending: false })

    // ── Tarif breakdown ──
    const { data: basisPages } = await supabaseAdmin
      .from('landing_pages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rented')
      .lte('monthly_price', 18900)

    const { data: proPages } = await supabaseAdmin
      .from('landing_pages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rented')
      .gt('monthly_price', 18900)

    const openInvoicesTotal = overdueTenants?.reduce((sum, t) => {
      const price = t.landing_page?.monthly_price || 0
      return sum + price / 100
    }, 0) || 0

    return NextResponse.json({
      success: true,
      stats: {
        mrr,
        arr,
        openInvoicesTotal: Math.round(openInvoicesTotal * 100) / 100,
        openInvoicesCount: overdueTenants?.length || 0,
        basisCount: basisPages?.length || 0,
        basisPrice: 189,
        proCount: proPages?.length || 0,
        proPrice: 289,
      },
      revenueByTrade: Object.values(revenueByTrade).map((t: any) => ({
        ...t,
        revenue: Math.round(t.revenue * 100) / 100
      })),
      tenants: tenants || [],
      overdue: overdueTenants || [],
    })

  } catch (error: any) {
    console.error('Billing API error:', error)
    return NextResponse.json({
      error: 'Failed to load billing data',
      message: error.message,
      stats: { mrr: 0, arr: 0, openInvoicesTotal: 0, openInvoicesCount: 0, basisCount: 0, proCount: 0 },
      revenueByTrade: [],
      tenants: [],
      overdue: [],
    }, { status: 500 })
  }
}
