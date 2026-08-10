import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Get counts from Supabase using admin client (bypasses RLS)
    const { count: totalPages, error: pagesError } = await supabaseAdmin
      .from('landing_pages')
      .select('*', { count: 'exact', head: true })

    const { count: rentedPages, error: rentedError } = await supabaseAdmin
      .from('landing_pages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rented')

    const { count: availablePages, error: availError } = await supabaseAdmin
      .from('landing_pages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available')

    const { count: totalLeads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })

    const { count: totalTenants, error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .select('*', { count: 'exact', head: true })

    // Get MRR from active rentals
    const { data: rentals, error: mrrError } = await supabaseAdmin
      .from('landing_pages')
      .select('monthly_price')
      .eq('status', 'rented')

    const mrr = rentals?.reduce((sum, r) => sum + (r.monthly_price || 0), 0) || 0
    const arr = mrr * 12

    // Get recent leads (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentLeads, error: recentLeadsError } = await supabaseAdmin
      .from('leads')
      .select('*, landing_page:landing_pages(slug, title)')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(50)

    // Get pages with trade and city info
    const { data: pages, error: pagesListError } = await supabaseAdmin
      .from('landing_pages')
      .select(`
        *,
        trade:trades(name, slug),
        city:cities(name, slug),
        page_customizations(*, tenant:tenants(*))
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    // Get all tenants
    const { data: tenants, error: tenantsListError } = await supabaseAdmin
      .from('tenants')
      .select('*, landing_page:landing_pages!inner(id, slug, title)')
      .order('created_at', { ascending: false })
      .limit(50)

    // Get tenant status breakdown
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
        mrr: Math.round(mrr / 100), // cents to euros
        arr: Math.round(arr * 100) / 100,
        tenantStats: {
          active: activeTenants || 0,
          setup: setupTenants || 0,
          overdue: overdueTenants || 0,
          cancelled: cancelledTenants || 0,
        }
      },
      recentLeads: recentLeads || [],
      pages: pages || [],
      tenants: tenants || [],
    })

  } catch (error: any) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ 
      error: 'Failed to load admin data',
      message: error.message,
      stats: { total: 0, rented: 0, available: 0, leads: 0, tenants: 0, mrr: 0, arr: 0 },
      recentLeads: [],
      pages: [],
      tenants: [],
    }, { status: 500 })
  }
}
