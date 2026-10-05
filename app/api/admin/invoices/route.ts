import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Aktive Mieter als "Rechnungen" interpretieren
    // HINWEIS: tenants → landing_pages hat KEINE FK-Constraint (rented_by ist TEXT)
    // → PostgREST kann nicht embedden (PGRST200). Zwei Queries + JS-Join statt !inner.
    const { data: tenants, error } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('subscription_status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error

    const tenantIds = (tenants || []).map((t: any) => String(t.id))
    const { data: pages } = tenantIds.length
      ? await supabaseAdmin
          .from('landing_pages')
          .select('id, slug, title, monthly_price, status, rented_by, trade:trades(name, slug), city:cities(name, slug)')
          .in('rented_by', tenantIds)
      : { data: [] as any[] }
    const pageByTenant: Record<string, any> = {}
    ;(pages || []).forEach((p: any) => { pageByTenant[String(p.rented_by)] = p })

    // Generiere "Rechnungen" aus den Mietverträgen
    const invoices = (tenants || []).map((t: any, idx: number) => {
      const page = pageByTenant[String(t.id)] || {}
      const trade = page.trade || {}
      const city = page.city || {}
      const price = (page.monthly_price || 0) / 100
      const startDate = t.created_at ? new Date(t.created_at) : new Date()
      const now = new Date()
      
      // Berechne wie viele Monate seit Mietbeginn
      const monthsDiff = Math.max(1, 
        (now.getFullYear() - startDate.getFullYear()) * 12 + 
        (now.getMonth() - startDate.getMonth()) + 1
      )
      
      const monthName = now.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
      const invoiceNum = `RE-2026-${String(720 + idx).padStart(4, '0')}`
      
      return {
        id: invoiceNum,
        number: invoiceNum,
        tenant_name: t.company_name || t.contact_name || 'Unbekannt',
        tenant_email: t.email,
        website: page.slug ? `fachschmiede.de/${trade.slug}/${city.slug}` : '-',
        trade_name: trade.name || '-',
        city_name: city.name || '-',
        amount: price,
        month: monthName,
        status: 'paid', // Stripe-Subscription ist aktiv = bezahlt
        created_at: t.created_at,
        payment_method: 'Stripe (SEPA / Karte)',
      }
    })

    // Statistik
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0)

    return NextResponse.json({
      success: true,
      invoices,
      stats: {
        total: invoices.length,
        totalAmount: Math.round(totalAmount * 100) / 100,
        autoSent: invoices.length, // Alle automatisch
      }
    })

  } catch (error: any) {
    console.error('Invoices API error:', error)
    return NextResponse.json({
      error: 'Failed to load invoice data',
      message: error.message,
      invoices: [],
      stats: { total: 0, totalAmount: 0, autoSent: 0 }
    }, { status: 500 })
  }
}
