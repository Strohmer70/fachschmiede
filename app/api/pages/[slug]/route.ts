// app/api/pages/[slug]/route.ts — Öffentlicher Miet-Status einer Stadtseite
// GET /api/pages/dachdecker-herne/ → { rented:false } | { rented:true, ... ALLE öffentlichen Felder }
// 2026-09-30: Gibt jetzt ALLE Mieter-Felder aus (Adresse, Öffnungszeiten, Über-uns,
// Einsatzgebiete, WhatsApp, Maps, Kennzahlen, Badges, Akzentfarbe) — vorher nur 7 Felder.
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
        .select('*')
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
      // ── 2026-09-30: Vollständige Felder ──
      address: cust.custom_address || null,
      opening_hours: cust.opening_hours || null,
      about_text: cust.about_text || null,
      service_areas: cust.service_areas || [],
      whatsapp_number: cust.whatsapp_number || null,
      whatsapp_enabled: cust.whatsapp_enabled !== false,
      google_maps_place_id: cust.google_maps_place_id || null,
      google_maps_enabled: cust.google_maps_enabled !== false,
      founding_year: cust.founding_year || null,
      show_founding_year: cust.show_founding_year === true,
      project_count: cust.project_count || null,
      show_project_count: cust.show_project_count === true,
      team_size: cust.team_size || null,
      show_team_size: cust.show_team_size === true,
      is_master_company: cust.is_master_company === true,
      is_guild_member: cust.is_guild_member === true,
      guild_name: cust.guild_name || null,
      accent_color: cust.accent_color || null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
