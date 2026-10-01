import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// 2026-10-01: Admin kann Testmieten beenden + Seite zurücksetzen.
// SICHERHEIT: Weigert sich bei Live-Mieten (Stripe-Subscription vorhanden) —
// die laufen über Stripe-Kündigung, nicht über diesen Endpunkt!
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const slug = body.slug
    if (!slug) {
      return NextResponse.json({ error: 'slug erforderlich' }, { status: 400 })
    }

    // ── 1) Seite laden ──
    const { data: page, error: pageErr } = await supabaseAdmin
      .from('landing_pages')
      .select('id, slug, status, rented_by')
      .eq('slug', slug)
      .single()

    if (pageErr || !page) {
      return NextResponse.json({ error: 'Seite nicht gefunden: ' + slug }, { status: 404 })
    }
    if (page.status !== 'rented' || !page.rented_by) {
      return NextResponse.json({ error: 'Seite ist nicht vermietet — nichts zurückzusetzen' }, { status: 409 })
    }

    // ── 2) Mieter laden + Live-Schutz ──
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id, email, company_name, stripe_subscription_id')
      .eq('id', page.rented_by)
      .single()

    if (tenant?.stripe_subscription_id) {
      return NextResponse.json({
        error: 'LIVE-Miete (Stripe-Subscription vorhanden) — bitte über Stripe kündigen, nicht hier zurücksetzen!'
      }, { status: 403 })
    }

    const tenantId = page.rented_by

    // ── 3) Seite freigeben ──
    const { error: freeErr } = await supabaseAdmin
      .from('landing_pages')
      .update({ status: 'available', rented_by: null, rented_at: null })
      .eq('id', page.id)
    if (freeErr) throw new Error('Freigabe fehlgeschlagen: ' + freeErr.message)

    // ── 4) Mieter-Daten der Seite löschen (Customizations + Reviews) ──
    await supabaseAdmin.from('page_customizations').delete().eq('tenant_id', tenantId).eq('page_id', page.id)
    await supabaseAdmin.from('reviews').delete().eq('tenant_id', tenantId).eq('page_id', page.id)

    // ── 5) Mieter-Account: canceled wenn keine weiteren Seiten ──
    const { data: remaining } = await supabaseAdmin
      .from('landing_pages')
      .select('id', { count: 'exact', head: true })
      .eq('rented_by', tenantId)
    if ((remaining ?? 0) === 0) {
      await supabaseAdmin
        .from('tenants')
        .update({ subscription_status: 'canceled' })
        .eq('id', tenantId)
    }

    return NextResponse.json({
      success: true,
      slug,
      message: 'Testmiete beendet — Seite zurückgesetzt auf „frei". Mieter: ' + (tenant?.email || tenantId),
    }, { headers: { 'Cache-Control': 'no-store' } })

  } catch (error: any) {
    console.error('Test-reset error:', error)
    return NextResponse.json({ error: error.message || 'Reset fehlgeschlagen' }, { status: 500 })
  }
}
