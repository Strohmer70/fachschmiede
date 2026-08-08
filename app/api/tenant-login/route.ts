import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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
      .eq('landing_page_id', tenant.landing_page_id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        company_name: tenant.company_name,
        email: tenant.email,
        phone: tenant.phone,
      },
      landing_page: tenant.landing_page,
      customization: tenant.page_customizations?.[0] || null,
      leads: leads || [],
    })

  } catch (error: any) {
    console.error('Tenant login error:', error)
    return NextResponse.json({ error: 'Login fehlgeschlagen' }, { status: 500 })
  }
}
