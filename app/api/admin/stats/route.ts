import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// API-Routen dürfen NIEMALS statisch generiert werden
export const dynamic = 'force-dynamic'
// Data-Cache komplett aus — sonst zeigt die Übersicht wochenalte Daten (Bug 2026-10-02)
export const revalidate = 0

export async function GET() {
  try {
    // ═══════════════════════════════════════════
    // COUNT QUERIES — Skalieren BELIEBIG!
    // Kein Limit nötig, da { count: 'exact', head: true }
    // ═══════════════════════════════════════════
    
    const { count: totalPages } = await supabaseAdmin
      .from('landing_pages')
      .select('*', { count: 'exact', head: true })

    const { count: rentedPages } = await supabaseAdmin
      .from('landing_pages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rented')

    const { count: availablePages } = await supabaseAdmin
      .from('landing_pages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available')

    const { count: totalLeads } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })

    const { count: totalTenants } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true })

    // Get MRR from active rentals — NUR Live (Stripe-Sub), Testmieten zählen nicht (2026-10-01)
    const { data: rentals } = await supabaseAdmin
      .from('landing_pages')
      .select('monthly_price, rented_by')
      .eq('status', 'rented')

    let liveMrr = 0
    const rentedByRaw: string[] = []
    ;(rentals || []).forEach((r: any) => { if (r.rented_by && rentedByRaw.indexOf(r.rented_by) < 0) rentedByRaw.push(r.rented_by) })
    const rentedByIds = rentedByRaw
    if (rentedByIds.length > 0) {
      const { data: tenantRows } = await supabaseAdmin
        .from('tenants')
        .select('id, stripe_subscription_id')
        .in('id', rentedByIds)
      const liveIdMap: Record<string, boolean> = {}
      ;(tenantRows || []).forEach((t: any) => { if (t.stripe_subscription_id) liveIdMap[t.id] = true })
      liveMrr = (rentals || [])
        .filter(r => r.rented_by && liveIdMap[r.rented_by])
        .reduce((sum, r) => sum + (r.monthly_price || 0), 0)
    }

    const mrr = liveMrr
    const arr = mrr * 12

    // Get recent leads (last 30 days) — immer nur 50, unabhängig von Gesamtzahl
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentLeads } = await supabaseAdmin
      .from('leads')
      .select('*, landing_page:landing_pages(slug, title)')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(50)

    // Get tenants — nur 50, da es nie viele Mieter gibt
    const { data: tenants } = await supabaseAdmin
      .from('tenants')
      .select('*, landing_page:landing_pages!inner(id, slug, title)')
      .order('created_at', { ascending: false })
      .limit(50)

    // Tenant status breakdown — Count Queries, keine Limits nötig
    const { count: activeTenants } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active')
    
    const { count: setupTenants } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'inactive')
    
    const { count: overdueTenants } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'past_due')
    
    const { count: cancelledTenants } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'cancelled')

    return NextResponse.json({
      stats: {
        total: totalPages || 0,
        rented: rentedPages || 0,
        available: availablePages || 0,
        leads: totalLeads || 0,
        tenants: totalTenants || 0,
        mrr: Math.round(mrr / 100),
        arr: Math.round(arr * 100) / 100,
        tenantStats: {
          active: activeTenants || 0,
          setup: setupTenants || 0,
          overdue: overdueTenants || 0,
          cancelled: cancelledTenants || 0,
        }
      },
      recentLeads: recentLeads || [],
      tenants: tenants || [],
      // WICHTIG: Keine 'pages' mehr hier!
      // Pages werden über /api/admin/pages?page=1&limit=50 geladen
    }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } })

  } catch (error: any) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ 
      error: 'Failed to load admin data',
      message: error.message,
      stats: { total: 0, rented: 0, available: 0, leads: 0, tenants: 0, mrr: 0, arr: 0 },
      recentLeads: [],
      tenants: [],
    }, { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } })
  }
}
