// app/api/tenant/reset-confirm/route.ts — Neues Passwort setzen
// POST {token, password} → Token prüfen (purpose 'reset', 1h), Passwort hashen, speichern.
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken, hashPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function getSecret(): string {
  return process.env.SESSION_SECRET || process.env.STRIPE_SECRET_KEY || 'dev-secret-nur-lokal'
}

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Reset-Link ungültig – bitte neu anfordern.' }, { status: 400 })
    }
    const pw = String(password || '')
    if (pw.length < 8) {
      return NextResponse.json({ error: 'Passwort braucht mindestens 8 Zeichen.' }, { status: 400 })
    }

    const payload = verifyToken<{ tid: string; purpose?: string }>(token, getSecret())
    if (!payload?.tid || payload.purpose !== 'reset') {
      return NextResponse.json({ error: 'Reset-Link ungültig oder abgelaufen – bitte neu anfordern.' }, { status: 401 })
    }

    const { error } = await supabaseAdmin
      .from('tenants')
      .update({ password_hash: hashPassword(pw) })
      .eq('id', payload.tid)

    if (error) {
      console.error('[reset-confirm] DB-Update fehlgeschlagen:', error.message)
      return NextResponse.json({ error: 'Speichern fehlgeschlagen – bitte erneut versuchen.' }, { status: 500 })
    }

    console.log('[reset-confirm] Passwort zurückgesetzt für Tenant', payload.tid)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[reset-confirm]', err)
    return NextResponse.json({ error: 'Reset fehlgeschlagen – bitte erneut versuchen.' }, { status: 500 })
  }
}
