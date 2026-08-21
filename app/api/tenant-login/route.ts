import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'


export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'E-Mail und Passwort erforderlich' }, { status: 400 })
    }

    // Find tenant by email
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('*, landing_page:landing_pages(*), page_customizations(*)')
      .eq('email', email)
      .single()

    if (error || !tenant) {
      return NextResponse.json({ error: 'Ungültige Zugangsdaten' }, { status: 401 })
    }

    // Simple password check (plain text for MVP — hash in production!)
    if (tenant.password !== password) {
      return NextResponse.json({ error: 'Ungültige Zugangsdaten' }, { status: 401 })
    }

    // Get leads for this tenant's landing page
    const { data: leads } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })

    // Get reviews for this tenant
    const { data: reviews } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })

    // Get landing pages for this tenant
    const { data: landingPages } = await supabaseAdmin
      .from('landing_pages')
      .select(`
        *,
        trade:trades(*),
        city:cities(*)
      `)
      .eq('rented_by', tenant.id)

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        company_name: tenant.company_name,
        email: tenant.email,
        phone: tenant.phone,
        address: tenant.address,
        contact_name: tenant.contact_name,
        logo_url: tenant.logo_url,
        stripe_customer_id: tenant.stripe_customer_id,
        subscription_status: tenant.subscription_status,
      },
      landing_pages: landingPages || [],
      customization: tenant.page_customizations?.[0] || null,
      leads: leads || [],
      reviews: reviews || [],
    })

  } catch (error: any) {
    console.error('Tenant login error:', error)
    return NextResponse.json({ error: 'Login fehlgeschlagen' }, { status: 500 })
  }
}
