// app/api/admin/payment/route.ts — Zahlungsanbieter-Status (Stripe + PayPal ECHT geprüft)
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  // Optional: ?whoami=1 → PayPal-Konto-Identität des verbundenen Händlerkontos (read-only)
  const url = new URL(req.url)
  if (url.searchParams.get('whoami')) {
    try {
      const { getPayPalConfig, ppApi, ppClientId } = await import('@/lib/paypal')
      const cfg = await getPayPalConfig()
      if (!cfg) return NextResponse.json({ error: 'paypal not configured' }, { status: 503 })
      const info = await ppApi(cfg, '/v1/identity/oauth2/userinfo?schema=paypalv1.1')
      const cid = ppClientId(cfg)
      return NextResponse.json({
        success: true,
        mode: cfg.mode,
        account: info,
        client_id_fingerprint: cid ? cid.slice(0, 10) + '…(' + cid.length + ' Zeichen)' : 'FEHLT',
      })
    } catch (e: any) {
      return NextResponse.json({ success: false, error: String(e?.message || e).slice(0, 400) }, { status: 500 })
    }
  }
  // Optional: ?subId=I-xxx → echten PayPal-Subscription-Status abfragen (Diagnose)
  const subId = url.searchParams.get('subId') || ''
  if (subId) {
    try {
      const { getPayPalConfig, ppApi } = await import('@/lib/paypal')
      const cfg = await getPayPalConfig()
      if (!cfg) return NextResponse.json({ error: 'paypal not configured' }, { status: 503 })
      const sub = await ppApi(cfg, '/v1/billing/subscriptions/' + encodeURIComponent(subId))
      return NextResponse.json({
        success: true,
        id: sub.id,
        status: sub.status,
        plan_id: sub.plan_id,
        custom_id: sub.custom_id,
        subscriber: sub.subscriber?.email_address || null,
        start_time: sub.start_time,
        status_update_time: sub.status_update_time,
        billing_info: sub.billing_info ? {
          outstanding_balance: sub.billing_info.outstanding_balance,
          last_payment: sub.billing_info.last_payment,
          next_billing_time: sub.billing_info.next_billing_time,
          failed_payments_count: sub.billing_info.failed_payments_count,
        } : null,
      })
    } catch (e: any) {
      return NextResponse.json({ success: false, error: String(e?.message || e).slice(0, 400) }, { status: 500 })
    }
  }
  // ── Stripe: Env-Check ──
  const hasStripeSecret = !!process.env.STRIPE_SECRET_KEY
  const keyPrefix = (process.env.STRIPE_SECRET_KEY || '').slice(0, 7) // sk_live / sk_test
  const stripeLive = keyPrefix === 'sk_live'

  // ── PayPal: Config aus platform_settings + ECHTER Token-Handshake ──
  // Beweist, dass die hinterlegten Live/Sandbox-Creds wirklich funktionieren
  // (nicht nur "irgendwas in den Env-Variablen steht").
  const paypal: {
    configured: boolean
    mode: 'live' | 'sandbox' | null
    api: boolean
    webhook_id: string | null
    plans: { trial: string | null; immediate: string | null }
    detail: string | null
  } = { configured: false, mode: null, api: false, webhook_id: null, plans: { trial: null, immediate: null }, detail: null }

  try {
    const { getPayPalConfig, ppClientId, ppSecret, ppWebhookId, ppToken } = await import('@/lib/paypal')
    const cfg = await getPayPalConfig()
    if (cfg) {
      paypal.mode = cfg.mode
      paypal.webhook_id = ppWebhookId(cfg) || null
      paypal.plans = {
        trial: cfg.modes?.[cfg.mode]?.plans?.trial || null,
        immediate: cfg.modes?.[cfg.mode]?.plans?.immediate || null,
      }
      const hasCreds = !!(ppClientId(cfg) && ppSecret(cfg))
      paypal.configured = hasCreds && !!(paypal.plans.trial && paypal.plans.immediate)
      if (hasCreds) {
        try {
          await ppToken(cfg) // echter API-Handshake gegen api-m.paypal.com / sandbox
          paypal.api = true
        } catch (e: any) {
          paypal.detail = 'PayPal-Token fehlgeschlagen: ' + (e?.message || e)
        }
      }
    } else {
      paypal.detail = 'Keine PayPal-Setup-Daten in platform_settings (paypal).'
    }
  } catch (e: any) {
    paypal.detail = 'PayPal-Config-Fehler: ' + (e?.message || e)
  }

  return NextResponse.json({
    success: true,
    stripe: {
      configured: hasStripeSecret,
      mode: hasStripeSecret ? (stripeLive ? 'live' : 'test') : null,
    },
    paypal,
  })
}
