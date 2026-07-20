import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    
    const landingPageId = formData.get('landing_page_id') as string
    const slug = formData.get('slug') as string
    const companyName = formData.get('company_name') as string
    const contactName = formData.get('contact_name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const address = formData.get('address') as string
    const whatsapp = formData.get('whatsapp') as string
    const placeId = formData.get('place_id') as string

    if (!landingPageId || !email || !companyName || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Check if page is still available
    const { data: page, error: pageError } = await supabase
      .from('landing_pages')
      .select('status, monthly_price')
      .eq('id', landingPageId)
      .single()

    if (pageError || !page || page.status !== 'available') {
      return NextResponse.json({ error: 'Page is no longer available' }, { status: 400 })
    }

    // 2. Create tenant (simple password for now — we'll send it via email later)
    const tempPassword = Math.random().toString(36).slice(-8)
    
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        email,
        password_hash: tempPassword, // In production: bcrypt hash
        company_name: companyName,
        contact_name: contactName,
        phone,
        address,
        subscription_status: 'active',
      })
      .select()
      .single()

    if (tenantError) {
      console.error('Tenant creation error:', tenantError)
      return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
    }

    // 3. Update landing page to rented
    const { error: updateError } = await supabase
      .from('landing_pages')
      .update({
        status: 'rented',
        rented_by: tenant.id,
        rented_at: new Date().toISOString(),
      })
      .eq('id', landingPageId)

    if (updateError) {
      console.error('Page update error:', updateError)
      return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
    }

    // 4. Create default customization
    const { error: custError } = await supabase
      .from('page_customizations')
      .insert({
        landing_page_id: landingPageId,
        tenant_id: tenant.id,
        custom_company_name: companyName,
        custom_address: address,
        custom_phone: phone,
        custom_email: email,
        custom_whatsapp: whatsapp || null,
        custom_place_id: placeId || null,
        custom_welcome_text: `Willkommen bei ${companyName} — Ihr zuverlässiger Partner in der Region.`,
      })

    if (custError) {
      console.error('Customization error:', custError)
    }

    // 5. Redirect to dashboard (simple token in URL for now — later: JWT or session)
    // In a real app, we'd send an email with login link + set up Stripe
    return NextResponse.redirect(new URL(`/dashboard?tenant=${tenant.id}`, request.url))

  } catch (error) {
    console.error('Rent API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
