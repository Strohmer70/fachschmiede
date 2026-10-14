// app/api/tenant/contract/route.ts — Echte Vertragsdaten für das Mieter-Dashboard
// GET (Bearer-Token) → { price_monthly, provider, status, trial_ends_at, next_billing_at, cancel_url }
// Preis: immer aus platform_settings.pricing (Single Source of Truth — gleiche Quelle wie Checkout)
// Trial/Next-Billing: PayPal → Live-Subscription-API, Stripe → Subscription-API
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function getSecret(): string {
  return process.env.SESSION_SECRET || process.env.STRIPE_SECRET_KEY || 'dev-secret-nur-lokal'
}

async function getSystemPriceEur(): Promise<number> {
  try {
    const { data } = await supabaseAdmin
      .from('platform_settings').select('value').eq('key', 'pricing').maybeSingle()
    const m = data?.value?.monthly
    if (typeof m === 'number' && m >= 9 && m <= 9999) return m
  } catch { /* Fallback */ }
  return 99
}

export async function GET(request: Request) {
  try {
    const auth = request.headers.get('authorization') || ''
    const token = auth.replace(/^Bearer\s+/i, '')
    if (!token) return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 })
    const payload = verifyToken<{ tid: string }>(token, getSecret())
    if (!payload?.tid) return NextResponse.json({ error: 'Session ungültig – bitte erneut einloggen.' }, { status: 401 })

    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id, email, subscription_status, payment_provider, paypal_subscription_id, stripe_subscription_id')
      .eq('id', payload.tid)
      .maybeSingle()
    if (!tenant) return NextResponse.json({ error: 'Konto nicht gefunden.' }, { status: 404 })

    const priceEur = await getSystemPriceEur()
    const provider = tenant.payment_provider === 'paypal' ? 'paypal' : (tenant.payment_provider === 'stripe' ? 'stripe' : null)
    const status = tenant.subscription_status || 'pending'

    let trialEndsAt: string | null = null
    let nextBillingAt: string | null = null
    let liveStatus: string | null = null

    // ── PayPal: echte Subscription abfragen ──
    if (provider === 'paypal' && tenant.paypal_subscription_id) {
      try {
        const { getPayPalConfig, ppApi } = await import('@/lib/paypal')
        const cfg = await getPayPalConfig()
        if (cfg) {
          const sub = await ppApi(cfg, '/v1/billing/subscriptions/' + encodeURIComponent(tenant.paypal_subscription_id))
          liveStatus = sub.status || null
          const nb = sub.billing_info?.next_billing_time
          if (nb) {
            if (status === 'trialing') trialEndsAt = nb
            else nextBillingAt = nb
          }
          // PayPal Status-Mapping (fallback, falls DB hinterherhängt)
          if (sub.status === 'ACTIVE' && !trialEndsAt && !nextBillingAt) nextBillingAt = nb || null
        }
      } catch { /* Live-Check best-effort — DB-Werte gelten */ }
    }

    // ── Stripe: echte Subscription abfragen ──
    if (provider === 'stripe' && tenant.stripe_subscription_id) {
      try {
        const key = process.env.STRIPE_SECRET_KEY || ''
        if (key && !key.includes('PLACEHOLDER')) {
          const Stripe = require('stripe')
          const stripe = new Stripe(key, { apiVersion: '2024-06-20' })
          const sub = await stripe.subscriptions.retrieve(tenant.stripe_subscription_id)
          liveStatus = sub.status || null
          if (sub.trial_end && sub.status === 'trialing') trialEndsAt = new Date(sub.trial_end * 1000).toISOString()
          if (sub.current_period_end && sub.status !== 'trialing') {
            nextBillingAt = new Date(sub.current_period_end * 1000).toISOString()
          }
        }
      } catch { /* Live-Check best-effort — DB-Werte gelten */ }
    }

    return NextResponse.json({
      success: true,
      price_monthly: priceEur,
      provider,
      status,
      live_status: liveStatus,
      trial_ends_at: trialEndsAt,
      next_billing_at: nextBillingAt,
      cancelable: status === 'trialing' || status === 'active' || status === 'past_due',
    })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e).slice(0, 300) }, { status: 500 })
  }
}
