// app/api/tenant/cancel/route.ts — Vertrag/Trial kündigen (Mieter-Selbstservice)
// POST (Bearer-Token, body: { reason? }) → sofortige Kündigung bei PayPal oder Stripe
// Danach: Seite zurück in den Pool, Customization deaktiviert, Bestätigungs-E-Mail
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function getSecret(): string {
  return process.env.SESSION_SECRET || process.env.STRIPE_SECRET_KEY || 'dev-secret-nur-lokal'
}

async function sendCancelMail(email: string, company: string, slug: string): Promise<void> {
  try {
    const { sendMail } = await import('@/lib/mailer')
    const plan = company || 'dein Betrieb'
    await sendMail({
      to: email,
      subject: `Kündigung bestätigt – ${slug}`,
      html: `<p>Hallo,</p>
<p>deine Miete <strong>${slug}</strong> (${plan}) wurde soeben gekündigt. Die Seite ist ab sofort offline und zurück im freien Pool.</p>
<p>Danke für die Zeit bei fachschmiede.de – falls du später wieder eine Mietseite starten möchtest, buche einfach neu.</p>
<p>Fragen? hallo@fachschmiede.de</p>`,
    })
  } catch (e) { console.error('[cancel] Mail-Fehler (nicht kritisch):', (e as any)?.message) }
}

export async function POST(request: Request) {
  try {
    const auth = request.headers.get('authorization') || ''
    const token = auth.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 })
    const payload = verifyToken<{ tid: string }>(token, getSecret())
    if (!payload?.tid) return NextResponse.json({ error: 'Session ungültig – bitte erneut einloggen.' }, { status: 401 })

    let reason = ''
    try { reason = (await request.json())?.reason || '' } catch { /* body optional */ }
    reason = String(reason).slice(0, 300)

    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id, email, company_name, subscription_status, payment_provider, paypal_subscription_id, stripe_subscription_id')
      .eq('id', payload.tid)
      .maybeSingle()
    if (!tenant) return NextResponse.json({ error: 'Konto nicht gefunden.' }, { status: 404 })

    const st = tenant.subscription_status || ''
    if (!(st === 'trialing' || st === 'active' || st === 'past_due')) {
      return NextResponse.json({ error: 'Es gibt keinen aktiven Vertrag zum Kündigen.' }, { status: 409 })
    }

    const provider = tenant.payment_provider
    const cancelReason = reason || 'Gekündigt vom Mieter über das Dashboard'

    // ── Beim Zahlungsanbieter wirklich kündigen ──
    if (provider === 'paypal' && tenant.paypal_subscription_id) {
      try {
        const { getPayPalConfig, ppApi } = await import('@/lib/paypal')
        const cfg = await getPayPalConfig()
        if (cfg) {
          await ppApi(cfg, '/v1/billing/subscriptions/' + encodeURIComponent(tenant.paypal_subscription_id) + '/cancel', { reason: cancelReason }, 'POST')
        }
      } catch (e: any) {
        const msg = String(e?.message || e)
        // Bereits gekündigte Subscription = kein Fehler
        if (!msg.includes('SUBSCRIPTION_CANCELLED') && !msg.includes('RESOURCE_NOT_FOUND') && !msg.includes('SUBSCRIPTION_INACTIVE')) {
          return NextResponse.json({ error: 'Kündigung bei PayPal fehlgeschlagen: ' + msg.slice(0, 200) }, { status: 502 })
        }
      }
    } else if (provider === 'stripe' && tenant.stripe_subscription_id) {
      try {
        const key = process.env.STRIPE_SECRET_KEY || ''
        if (key && !key.includes('PLACEHOLDER')) {
          const Stripe = require('stripe')
          const stripe = new Stripe(key, { apiVersion: '2024-06-20' })
          await stripe.subscriptions.cancel(tenant.stripe_subscription_id)
        }
      } catch (e: any) {
        const msg = String(e?.message || e)
        if (!msg.includes('No such subscription') && !msg.includes('canceled')) {
          return NextResponse.json({ error: 'Kündigung bei Stripe fehlgeschlagen: ' + msg.slice(0, 200) }, { status: 502 })
        }
      }
    } else {
      // Kein Anbieter verbunden (z.B. manueller Vertrag) — lokal kündigen
    }

    // ── Lokale Aufräumarbeiten (gleiche Regel wie webhook subscription.deleted) ──
    const { data: pages } = await supabaseAdmin
      .from('landing_pages').select('id, slug').eq('rented_by', tenant.id)
    for (const p of pages || []) {
      await supabaseAdmin.from('landing_pages')
        .update({ status: 'available', rented_by: null, rented_at: null }).eq('id', p.id)
      await supabaseAdmin.from('page_customizations').update({ is_active: false }).eq('landing_page_id', p.id)
    }
    await supabaseAdmin.from('tenants')
      .update({ subscription_status: 'cancelled', paypal_subscription_id: null, stripe_subscription_id: null })
      .eq('id', tenant.id)

    await sendCancelMail(tenant.email, tenant.company_name || '', (pages?.[0]?.slug) || 'deine-seite')

    return NextResponse.json({ success: true, cancelled: true })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e).slice(0, 300) }, { status: 500 })
  }
}
