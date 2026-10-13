import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/admin-auth'
import { sendMail } from '@/lib/mailer'

export const maxDuration = 60

// ─── POST /api/admin/marketing/send ─────────────────────────────
// Versendet Entwürfe 1:1 via Brevo. HARTES TAGESLIMIT (Domain-Schutz):
// max 20 versendete Outreach-Mails pro Tag. EINE Mail pro Betrieb — kein Follow-up.
// Body: { drafts: [{ id, subject, body }] }

const DAILY_LIMIT = 20

function textToHtml(text: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1a2b3c;white-space:pre-wrap;max-width:600px">${esc(text)}</div>`
}

export async function POST(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const drafts: { id: string; subject: string; body: string }[] = Array.isArray(body.drafts)
      ? body.drafts.slice(0, DAILY_LIMIT)
      : []
    if (!drafts.length) {
      return NextResponse.json({ error: 'drafts (Array) fehlt' }, { status: 400 })
    }

    // Tageslimit prüfen (sent_at ist timestamptz → Datum in Europe/Berlin)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { count: sentToday, error: cntErr } = await supabaseAdmin
      .from('marketing_contacts')
      .select('id', { count: 'exact', head: true })
      .gte('sent_at', todayStart.toISOString())
    if (cntErr) throw cntErr

    const remaining = DAILY_LIMIT - (sentToday || 0)
    if (remaining <= 0) {
      return NextResponse.json(
        { error: `Tageslimit erreicht: ${DAILY_LIMIT} Mails/Tag bereits versendet. Morgen weiter!`, sentToday, limit: DAILY_LIMIT },
        { status: 429 }
      )
    }
    const queue = drafts.slice(0, remaining)
    const skipped = drafts.length - queue.length

    const results: { id: string; to?: string; ok: boolean; error?: string }[] = []
    let firstTrade = ''
    let firstCity = ''
    const sentIds: string[] = []

    for (const d of queue) {
      // Kontakt laden + Doppelschutz (bereits versendet?)
      const { data: c } = await supabaseAdmin
        .from('marketing_contacts')
        .select('id, email, company_name, trade, city, sent_at, status')
        .eq('id', d.id)
        .single()
      // UWG: nur echte Entwürfe versenden; Stopp/Antwort/Sonstiges wird hart blockiert
      if (!c || c.sent_at || c.status !== 'draft') {
        results.push({ id: d.id, ok: false, error: !c ? 'Kontakt nicht gefunden' : c.sent_at ? 'Bereits versendet' : 'Kein Entwurf (Status: ' + c.status + ')' })
        continue
      }
      firstTrade = firstTrade || c.trade
      firstCity = firstCity || c.city

      const ok = await sendMail({
        to: c.email,
        subject: d.subject,
        html: textToHtml(d.body),
        text: d.body,
      })

      if (ok) {
        const { error: upErr } = await supabaseAdmin
          .from('marketing_contacts')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', c.id)
        if (upErr) throw upErr
        sentIds.push(c.id)
        results.push({ id: c.id, to: c.email, ok: true })
      } else {
        results.push({ id: c.id, to: c.email, ok: false, error: 'Brevo-Versand fehlgeschlagen' })
      }
    }

    // Kampagne protokollieren
    const okCount = results.filter(r => r.ok).length
    if (sentIds.length) {
      await supabaseAdmin.from('marketing_campaigns').insert({
        name: `${firstTrade} ${firstCity} · ${new Date().toLocaleDateString('de-DE')}`,
        trade: firstTrade,
        city: firstCity,
        channel: 'email',
        contact_ids: sentIds,
        sent_count: okCount,
        results: { ok: okCount, failed: results.length - okCount },
      })
    }

    const { count: sentNow } = await supabaseAdmin
      .from('marketing_contacts')
      .select('id', { count: 'exact', head: true })
      .gte('sent_at', todayStart.toISOString())

    return NextResponse.json({
      success: true,
      results,
      skippedByLimit: skipped,
      sentToday: sentNow || 0,
      limit: DAILY_LIMIT,
    })
  } catch (error: any) {
    console.error('Marketing send error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
