// app/api/admin/payment/route.ts — Zahlungsanbieter-Status (Stripe + PayPal ECHT geprüft)
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
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
