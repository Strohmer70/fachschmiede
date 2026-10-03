// app/api/support/route.ts — Öffentlicher Support-Endpunkt (Salespages → Admin-Dashboard)
// 2026-10-03: Ersetzt das Demo-Formular ("es wird nichts versendet") durch echtes Ticket-System.
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMail } from '@/lib/mailer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Whitelist der erlaubten Kategorien (Mapping aus den Salespage-Selects)
const VALID_CATEGORIES: Record<string, string> = {
  'Gewerk fehlt': 'Gewerk fehlt',
  'Stadt fehlt': 'Stadt fehlt',
  'Technisches Problem': 'Technisches Problem',
  'Verbesserungsvorschlag': 'Verbesserungsvorschlag',
  'Sonstiges': 'Sonstiges',
  // Rohnwerte direkt aus den <option>-Texten der Salespages:
  '🧩 Vorschlag: Mein Gewerk fehlt': 'Gewerk fehlt',
  '🏙️ Vorschlag: Meine Stadt fehlt': 'Stadt fehlt',
  '⚠️ Problem: Onboarding hakt': 'Technisches Problem',
  '⚠️ Problem: Technischer Fehler': 'Technisches Problem',
  '💬 Sonstiges Anliegen': 'Sonstiges',
  '💡 Verbesserungsvorschlag': 'Verbesserungsvorschlag',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawKat = String(body.category || '').trim()
    const category = VALID_CATEGORIES[rawKat]
    const message = String(body.message || '').trim()
    const requester = String(body.requester || '').trim() || null
    const source = String(body.source || '').trim() || null

    if (!category) {
      return NextResponse.json({ success: false, error: 'Unbekannte Kategorie.' }, { status: 400 })
    }
    if (message.length < 5 || message.length > 1000) {
      return NextResponse.json({ success: false, error: 'Nachricht muss 5–1000 Zeichen haben.' }, { status: 400 })
    }
    if (requester && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(requester)) {
      return NextResponse.json({ success: false, error: 'Ungültige E-Mail-Adresse.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .insert({ category, message, requester, source })
      .select()
      .single()

    if (error) throw new Error('DB: ' + error.message)

    // Benachrichtigung an Dieter (darf nicht scheitern, wenn Mail hängt)
    try {
      await sendMail({
        to: 'hello@fachschmiede.de',
        subject: `🎫 Neues Support-Ticket [${category}]`,
        html: `
          <h2>Neues Support-Ticket</h2>
          <p><b>Kategorie:</b> ${category}</p>
          <p><b>Absender:</b> ${requester || 'anonym'}</p>
          <p><b>Quelle:</b> ${source || 'unbekannt'}</p>
          <p><b>Nachricht:</b></p>
          <blockquote style="border-left:3px solid #f97316;padding-left:12px;color:#333">${message.replace(/</g, '&lt;')}</blockquote>
          <p><a href="https://www.fachschmiede.de/admin.html">→ Admin-Dashboard öffnen</a></p>`,
      })
    } catch (e) {
      console.error('[support] Benachrichtigungs-Mail fehlgeschlagen (Ticket ist gespeichert):', e)
    }

    return NextResponse.json({ success: true, ticket: data })
  } catch (err: any) {
    console.error('[support] POST Fehler:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
