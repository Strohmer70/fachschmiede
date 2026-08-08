import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

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

    // 1. Check if page exists — try ID first, then slug
    let pageQuery = supabase
      .from('landing_pages')
      .select('id, status, monthly_price, slug')
    
    // If it looks like a UUID, search by id
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(landingPageId)
    
    if (isUUID) {
      pageQuery = pageQuery.eq('id', landingPageId)
    } else {
      // Fallback: search by slug
      pageQuery = pageQuery.eq('slug', slug || landingPageId)
    }
    
    const { data: page, error: pageError } = await pageQuery.single()

    // 2. If not found in DB but we have slug, create it on-the-fly
    if ((pageError || !page) && slug) {
      // Try to create the landing page from fallback data
      const { data: newPage, error: createError } = await supabaseAdmin
        .from('landing_pages')
        .insert({
          slug: slug,
          title: `${companyName} — Professionelle Dienstleistungen`,
          status: 'available',
          monthly_price: 14900, // €149 default
          trade_id: slug.split('-')[0],
          city_id: slug.split('-').slice(1).join('-'),
        })
        .select()
        .single()
      
      if (createError || !newPage) {
        console.error('Failed to create landing page:', createError)
        return NextResponse.json({ error: 'Page is no longer available' }, { status: 400 })
      }
      
      // Use the newly created page
      return processRental(newPage, formData, request)
    }

    if (pageError || !page || page.status !== 'available') {
      return NextResponse.json({ error: 'Page is no longer available' }, { status: 400 })
    }

    return processRental(page, formData, request)

  } catch (error) {
    console.error('Rent API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function processRental(page: any, formData: FormData, request: Request) {
  const landingPageId = page.id
  const companyName = formData.get('company_name') as string
  const contactName = formData.get('contact_name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const whatsapp = formData.get('whatsapp') as string
  const placeId = formData.get('place_id') as string

  // 2. Create tenant (simple password for now — we'll send it via email later)
  const tempPassword = Math.random().toString(36).slice(-8)
  
  const { data: tenant, error: tenantError } = await supabaseAdmin
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

  // 3. Update landing page to rented (use admin to bypass RLS)
  const { error: updateError } = await supabaseAdmin
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

  // 4. Create default customization (use admin to bypass RLS)
  const { error: custError } = await supabaseAdmin
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
}
