// app/api/pages/[slug]/route.ts — Öffentlicher Miet-Status einer Stadtseite
// GET /api/pages/dachdecker-herne/ → { rented:false } | { rented:true, company, phone, email, whatsapp, welcome, color }
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: 'Ungültiger Slug' }, { status: 400 })
    }

    const { data: page } = await supabaseAdmin
      .from('landing_pages')
      .select('id, status, rented_by')
      .eq('slug', slug)
      .maybeSingle()

    if (!page || page.status !== 'rented' || !page.rented_by) {
      return NextResponse.json({ rented: false })
    }

    const [{ data: tenant }, { data: cust }] = await Promise.all([
      supabaseAdmin
        .from('tenants')
        .select('company_name, contact_name, phone, email, subscription_status')
        .eq('id', page.rented_by)
        .maybeSingle(),
      supabaseAdmin
        .from('page_customizations')
        .select('custom_company_name, custom_phone, custom_email, custom_welcome_text, is_active')
        .eq('landing_page_id', page.id)
        .eq('tenant_id', page.rented_by)
        .maybeSingle(),
    ])

    if (!tenant || tenant.subscription_status !== 'active' || !cust || !cust.is_active) {
      return NextResponse.json({ rented: false })
    }

    // Nur öffentliche Daten zurückgeben (kein Passwort-Hash o.ä.!)
    return NextResponse.json({
      rented: true,
      company: cust.custom_company_name || tenant.company_name,
      contactName: tenant.contact_name || null,
      phone: cust.custom_phone || tenant.phone || null,
      email: cust.custom_email || tenant.email,
      whatsapp: (cust.custom_phone || tenant.phone || '').replace(/[^0-9]/g, ''),
      welcome: cust.custom_welcome_text || null,
    })
  } catch (err: any) {
    console.error('[pages/slug]', err)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
