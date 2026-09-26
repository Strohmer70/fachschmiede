// app/api/tenant/portal/route.ts — Stripe-Kundenportal für Mieter
// POST (Bearer-Token) → { url } — Stripe-hosted Portal (Zahlungsmethode, Rechnungen, Abo)
// Kunden-Resolve: tenant.stripe_customer_id → Fallback Lookup per E-Mail + Backfill
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const STRIPE_KEY = () => process.env.STRIPE_SECRET_KEY || ''

function getStripe(): any | null {
  const key = STRIPE_KEY()
  if (!key || key.includes('PLACEHOLDER')) return null
  const Stripe = require('stripe')
  return new Stripe(key, { apiVersion: '2024-06-20' })
}

function getSecret(): string {
  return process.env.SESSION_SECRET || process.env.STRIPE_SECRET_KEY || 'dev-secret-nur-lokal'
}

export async function POST(request: Request) {
  try {
    const auth = request.headers.get('authorization') || ''
    const token = auth.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 })
    const payload = verifyToken<{ tid: string }>(token, getSecret())
    if (!payload?.tid) return NextResponse.json({ error: 'Session ungültig oder abgelaufen – bitte erneut einloggen.' }, { status: 401 })

    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id, email, stripe_customer_id')
      .eq('id', payload.tid)
      .maybeSingle()
    if (!tenant) return NextResponse.json({ error: 'Konto nicht gefunden.' }, { status: 404 })

    const stripe = getStripe()
    if (!stripe) return NextResponse.json({ error: 'Abrechnung ist noch nicht verfügbar – wir kümmern uns um dich. (hallo@fachschmiede.de)' }, { status: 503 })

    // ── Stripe-Kunde auflösen: gespeicherte ID validieren, sonst per E-Mail + Backfill ──
    let customerId: string | null = tenant.stripe_customer_id || null
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId)
      } catch {
        customerId = null // gespeicherte ID ungültig → neu auflösen
      }
    }
    if (!customerId) {
      const found = await stripe.customers.list({ email: tenant.email, limit: 1 })
      customerId = found.data[0]?.id || null
      if (customerId) {
        await supabaseAdmin.from('tenants').update({ stripe_customer_id: customerId }).eq('id', tenant.id)
      }
    }
    if (!customerId) {
      return NextResponse.json({ error: 'Noch kein Abrechnungskonto vorhanden – es erscheint nach der ersten Zahlung. Fragen? hallo@fachschmiede.de' }, { status: 404 })
    }

    // ── Portal-Session (Default-Portal: Zahlungsmethoden + Rechnungen;
    //    Kündigungs-Aktivierung im Stripe-Dashboard → Einstellungen → Kundenportal) ──
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'https://www.fachschmiede.de/mieter/',
    })

    return NextResponse.json({ ok: true, url: session.url })
  } catch (err: any) {
    console.error('[tenant/portal]', err)
    return NextResponse.json({ error: 'Abrechnungsportal vorübergehend nicht erreichbar – bitte später erneut versuchen.' }, { status: 500 })
  }
}
