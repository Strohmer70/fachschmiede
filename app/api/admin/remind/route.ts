// app/api/admin/remind/route.ts — Mieter-Rechtstext-Erinnerung per E-Mail
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMail } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { tenant_id, all } = await req.json()
    let tenants: any[] = []
    if (all) {
      const { data } = await supabaseAdmin
        .from('tenants').select('id, company_name, email').not('email', 'is', null)
        .in('subscription_status', ['active', 'trialing'])
      tenants = data || []
    } else if (tenant_id) {
      const { data } = await supabaseAdmin
        .from('tenants').select('id, company_name, email').eq('id', tenant_id).maybeSingle()
      if (data) tenants = [data]
    }
    if (!tenants.length) {
      return NextResponse.json({ success: false, error: 'Kein Mieter mit E-Mail-Adresse gefunden.' }, { status: 404 })
    }

    const results = []
    for (const t of tenants) {
      const r = await sendMail({
        to: t.email,
        subject: '⚖️ Rechtstexte vervollständigen – fachschmiede.de',
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
  <h2 style="color:#1a1a2e">Hallo ${t.company_name || ''},</h2>
  <p>in deinem Mieter-Dashboard fehlen noch rechtliche Angaben für deine Miet-Website (Impressum / Datenschutz).</p>
  <p>Bitte öffne dein Dashboard → <strong>Rechtliches</strong> und ergänze:</p>
  <ul>
    <li>Rechtsform &amp; Vertretungsberechtigte:r</li>
    <li>Vollständige Anschrift</li>
    <li>Telefon oder E-Mail (mindestens eines)</li>
    <li>USt-IdNr. (falls vorhanden)</li>
  </ul>
  <p>Danke! Deine Website bleibt bis dahin mit dem Betreiber-Impressum online.</p>
  <p style="color:#666;font-size:12px">fachschmiede.de · hello@fachschmiede.de</p>
</div>`,
      })
      results.push({ tenant: t.company_name, ok: true })
    }
    return NextResponse.json({ success: true, sent: results.length, results })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
