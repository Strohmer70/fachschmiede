// app/api/pages/[slug]/route.ts — Öffentlicher Miet-Status einer Stadtseite
// GET /api/pages/dachdecker-herne/ → { rented:false } | { rented:true, company, phone, email, whatsapp, welcome }
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: 'Ungültiger Slug' }, { status: 400 })
    }

    const { data: rows } = await supabaseAdmin
      .from('landing_pages')
      .select('id, slug, status, rented_by, created_at, updated_at')
      .eq('slug', slug)

    const page = rows && rows.length > 0 ? rows[0] : null
    if (!page || page.status !== 'rented' || !page.rented_by) {
      return NextResponse.json({ rented: false, page })
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
      return NextResponse.json({ rented: false, reason: 'tenant/cust' })
    }

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
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
