// app/api/admin/legal/route.ts — Rechtsangaben lesen/speichern (Admin-Dashboard)
// 2026-10-05: GET liefert zusätzlich tenants (Legal-Status pro Mieter) + pricing.
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALLOWED: Record<string, number> = {
  betreiber: 120, rechtsform: 40, vertretung: 120, anschrift: 200,
  telefon: 40, email: 120, ust_id: 30, handelsregister: 120,
  verantwortlich: 250, ds_verantwortlicher: 250, ds_mail: 120, dsbeauftragter: 200,
}
const TOGGLES = ['kleinunternehmer', 'eu_streit', 'svc_kontakt', 'svc_maps', 'svc_whatsapp', 'svc_hosting', 'svc_tracking']

export async function GET() {
  try {
    const { data: legalRow } = await supabaseAdmin
      .from('platform_settings').select('value').eq('key', 'legal').maybeSingle()
    const { data: pricingRow } = await supabaseAdmin
      .from('platform_settings').select('value').eq('key', 'pricing').maybeSingle()

    // Mieter-Legal-Status: tenants + landing_pages (rented_by = TEXT, kein FK → JS-Join)
    // + page_customizations (tenant_id = UUID, FK existiert → DB-Embed)
    const { data: tenants } = await supabaseAdmin
      .from('tenants')
      .select('id, company_name, email, subscription_status, page_customizations!page_customizations_tenant_id_fkey(custom_address, custom_phone, custom_email, rechtsform, vertretung, ust_id)')
      .order('created_at', { ascending: false })

    const tenantList = tenants || []
    const tenantIds = tenantList.map((t: any) => String(t.id))
    const pageMap: Record<string, any> = {}
    if (tenantIds.length) {
      const { data: pages } = await supabaseAdmin
        .from('landing_pages')
        .select('rented_by, slug, title')
        .in('rented_by', tenantIds)
      for (const pg of pages || []) pageMap[String(pg.rented_by)] = pg
    }

    const tenantRows = tenantList.map((t: any) => {
      const page = pageMap[String(t.id)] || null
      const cust = t.page_customizations?.[0] || {}
      const impressumMissing: string[] = []
      if (!cust.custom_address) impressumMissing.push('Anschrift')
      if (!cust.custom_phone && !cust.custom_email) impressumMissing.push('Kontakt')
      if (!cust.rechtsform) impressumMissing.push('Rechtsform')
      if (!cust.vertretung) impressumMissing.push('Vertretung')
      const impressumOk = impressumMissing.length === 0
      const dsOk = !!(cust.custom_email && cust.custom_address)
      return {
        id: t.id, company: t.company_name || '—', email: t.email || '',
        pageSlug: page?.slug || null, pageTitle: page?.title || null,
        status: t.subscription_status || 'unknown',
        impressumOk, dsOk, missing: impressumMissing,
      }
    })

    return NextResponse.json({
      success: true,
      legal: legalRow?.value || {},
      pricing: pricingRow?.value || { monthly: 189 },
      tenants: tenantRows,
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()

    // Preis-Update (separater Key)
    if (body?.pricing && typeof body.pricing.monthly === 'number') {
      const monthly = Math.max(9, Math.min(9999, Math.round(body.pricing.monthly)))
      await supabaseAdmin
        .from('platform_settings')
        .upsert({ key: 'pricing', value: { monthly }, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      return NextResponse.json({ success: true, pricing: { monthly } })
    }

    const inLegal = body?.legal || {}
    const clean: Record<string, any> = {}
    for (const [k, maxLen] of Object.entries(ALLOWED)) {
      const v = inLegal[k]
      clean[k] = typeof v === 'string' ? v.trim().slice(0, maxLen) : ''
    }
    for (const k of TOGGLES) clean[k] = !!inLegal[k]
    if (clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean.email)) {
      return NextResponse.json({ success: false, error: 'Ungültige Betreiber-E-Mail.' }, { status: 400 })
    }
    if (clean.ds_mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean.ds_mail)) {
      return NextResponse.json({ success: false, error: 'Ungültige DS-E-Mail.' }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin
      .from('platform_settings')
      .upsert({ key: 'legal', value: clean, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select('value').single()
    if (error) throw error
    return NextResponse.json({ success: true, legal: data.value })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
