import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMail, leadMailToTenant } from '@/lib/mailer'

// API-Routen dürfen NIEMALS statisch generiert werden
export const dynamic = 'force-dynamic'

/**
 * POST /api/leads/
 * Echtzeit-Lead-Capture für alle 126 Stadtseiten.
 *
 * Body: { trade, city, name, phone, message }
 *  - trade/city kommen aus der URL der aufrufenden Seite (/{trade}/{city}/)
 *  - Lookup-Kette: cities.slug + trades.slug → landing_pages(trade_id, city_id)
 *  - Fallback: direkter Slug-Match `${trade}-${city}`
 *
 * Speichert in leads (landing_page_id, tenant_id, name, phone, message, status='new').
 * Offen: E-Mail-Benachrichtigung an Mieter (benötigt SMTP-Service).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 })
    }

    const trade = String(body.trade || '').trim().toLowerCase()
    const city = String(body.city || '').trim().toLowerCase()
    const name = String(body.name || '').trim()
    const phone = String(body.phone || '').trim()
    const message = String(body.message || '').trim()

    // ── Validierung ──
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Bitte geben Sie Ihren Namen an.' }, { status: 400 })
    }
    if (!phone || phone.length < 5) {
      return NextResponse.json({ error: 'Bitte geben Sie eine gültige Telefonnummer an.' }, { status: 400 })
    }
    if (!trade || !city) {
      return NextResponse.json({ error: 'Ungültiger Seitenkontext (trade/city fehlt).' }, { status: 400 })
    }

    // ── Seite auflösen: Kette 1 (cities + trades → landing_pages) ──
    let page: { id: string; rented_by: string | null } | null = null

    const [{ data: cityRow }, { data: tradeRow }] = await Promise.all([
      supabaseAdmin.from('cities').select('id').eq('slug', city).maybeSingle(),
      supabaseAdmin.from('trades').select('id').eq('slug', trade).maybeSingle(),
    ])

    if (cityRow && tradeRow) {
      const { data } = await supabaseAdmin
        .from('landing_pages')
        .select('id, rented_by')
        .eq('trade_id', tradeRow.id)
        .eq('city_id', cityRow.id)
        .maybeSingle()
      page = data
    }

    // ── Kette 2: direkter Slug-Match ──
    if (!page) {
      const candidates = [`${trade}-${city}`]
      // gartenbau-URL → DB-Slug garten-und-landschaftsbau-{city}
      if (trade === 'gartenbau') candidates.unshift(`garten-und-landschaftsbau-${city}`)

      for (const slug of candidates) {
        const { data } = await supabaseAdmin
          .from('landing_pages')
          .select('id, rented_by')
          .eq('slug', slug)
          .maybeSingle()
        if (data) {
          page = data
          break
        }
      }
    }

    if (!page) {
      console.error(`[leads] Seite nicht gefunden: trade=${trade} city=${city}`)
      return NextResponse.json(
        { error: 'Seite konnte nicht zugeordnet werden. Bitte rufen Sie uns direkt an.' },
        { status: 404 }
      )
    }

    // ── Lead speichern ──
    const { data: lead, error: insertError } = await supabaseAdmin
      .from('leads')
      .insert({
        landing_page_id: page.id,
        tenant_id: page.rented_by || null,
        name: name.slice(0, 200),
        phone: phone.slice(0, 50),
        message: message.slice(0, 2000),
        status: 'new',
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[leads] Insert-Fehler:', insertError)
      throw new Error('Speicherfehler: ' + insertError.message)
    }

    // Mieter per E-Mail benachrichtigen (wenn Seite vermietet + SMTP konfiguriert)
    if (page.rented_by) {
      try {
        const [{ data: tenant }, { data: cityRow }, { data: tradeRow }] = await Promise.all([
          supabaseAdmin.from('tenants').select('email, company_name, contact_name, subscription_status').eq('id', page.rented_by).maybeSingle(),
          supabaseAdmin.from('cities').select('name').eq('slug', city).maybeSingle(),
          supabaseAdmin.from('trades').select('label, name').eq('slug', trade).maybeSingle(),
        ])
        if (tenant?.email && tenant.subscription_status === 'active') {
          await sendMail({
            to: tenant.email,
            ...leadMailToTenant({
              tenantName: tenant.contact_name || tenant.company_name || 'Handwerksbetrieb',
              company: tenant.company_name || '',
              city: cityRow?.name || city,
              trade: tradeRow?.label || tradeRow?.name || trade,
              leadName: name.trim(),
              leadPhone: phone.trim(),
              leadMessage: message || '(keine Nachricht)',
              pageUrl: 'https://www.fachschmiede.de/' + trade + '/' + city + '/',
            }),
          })
        }
      } catch (mailErr) {
        console.error('[leads] mail notification failed:', mailErr)
        // Lead ist gespeichert – Mail-Fehler soll den Lead nicht killen
      }
    }

    return NextResponse.json({ ok: true, id: lead.id })
  } catch (err: any) {
    console.error('[leads] Fehler:', err)
    return NextResponse.json(
      { error: err.message || 'Interner Fehler. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    )
  }
}
