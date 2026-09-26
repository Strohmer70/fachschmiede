// app/api/tenant/reset-request/route.ts — Passwort-Reset anfordern
// POST {email} → sendet Reset-Link (1h gültig). Antwort IMMER ok:true (Anti-Enumeration).
// Token: stateless HMAC {tid, purpose:'reset'} — kein DB-Migration nötig.
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { signToken } from '@/lib/auth'
import { sendMail, resetMailTenant } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

function getSecret(): string {
  return process.env.SESSION_SECRET || process.env.STRIPE_SECRET_KEY || 'dev-secret-nur-lokal'
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const emailNorm = String(email || '').trim().toLowerCase()
    if (!emailNorm || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailNorm)) {
      return NextResponse.json({ ok: true }) // nicht verraten, dass Format falsch
    }

    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id, email, contact_name, company_name')
      .eq('email', emailNorm)
      .maybeSingle()

    if (tenant) {
      const token = signToken({ tid: tenant.id, purpose: 'reset' }, getSecret(), 60 * 60)
      const link = `https://www.fachschmiede.de/mieter/reset.html?token=${encodeURIComponent(token)}`
      const name = tenant.contact_name || tenant.company_name || 'Handwerker:in'
      const sent = await sendMail({ to: tenant.email, ...resetMailTenant({ name, link }) })
      if (!sent) console.log('[reset-request] SMTP nicht konfiguriert – Reset-Link für', tenant.email, ':', link)
      else console.log('[reset-request] Reset-Mail gesendet an', tenant.email)
    } else {
      console.log('[reset-request] Unbekannte E-Mail – keine Mail (Absicht):', emailNorm)
    }

    // Immer gleiche Antwort: gibt nicht preis, ob die E-Mail existiert
    return NextResponse.json({ ok: true, message: 'Falls ein Konto existiert, ist der Link unterwegs.' })
  } catch (err: any) {
    console.error('[reset-request]', err)
    return NextResponse.json({ ok: true }) // auch bei Fehlern nichts verraten
  }
}
