// app/api/paypal/webhook/route.ts — PayPal-Subscription-Events → Mieter aktivieren/deaktivieren
// Registriert (LIVE): webhook 11K97809MF935382V → https://www.fachschmiede.de/api/paypal/webhook/
// Registriert (SANDBOX): webhook 2MY03574RV222201Y
// Events: BILLING.SUBSCRIPTION.ACTIVATED/CANCELLED/SUSPENDED/EXPIRED, BILLING.SUBSCRIPTION.PAYMENT.FAILED, PAYMENT.CAPTURE.COMPLETED
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getPayPalConfig, ppBase, ppToken, ppWebhookId } from '@/lib/paypal'

export const dynamic = 'force-dynamic'

// custom_id → { s: slug, p: landing_page_id, t: tenant_id }
function parseCustomId(raw: string): { slug?: string; landingPageId?: string; tenantId?: string } {
  try {
    const d = JSON.parse(raw || '{}')
    return { slug: d.s, landingPageId: d.p, tenantId: d.t }
  } catch {
    // Legacy: roher Slug
    return raw ? { slug: raw } : {}
  }
}

export async function POST(request: Request) {
  const cfg = await getPayPalConfig().catch(() => null)
  if (!cfg) return NextResponse.json({ error: 'PayPal not configured' }, { status: 503 })

  const payload = await request.text()
  const headers = {
    'paypal-transmission-id': request.headers.get('paypal-transmission-id') || '',
    'paypal-transmission-time': request.headers.get('paypal-transmission-time') || '',
    'paypal-transmission-sig': request.headers.get('paypal-transmission-sig') || '',
    'paypal-auth-version': request.headers.get('paypal-auth-version') || '',
    'paypal-cert-url': request.headers.get('paypal-cert-url') || '',
  }

  const event = JSON.parse(payload || '{}')
  const eventType = event?.event_type || ''

  // ── Signatur verifizieren (PayPal verify-webhook-signature API) ──
  const webhookId = ppWebhookId(cfg)
  if (webhookId && headers['paypal-transmission-sig']) {
    const verifyBody = {
      auth_algo: headers['paypal-auth-version'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: event,
    }
    try {
      const t = await ppToken(cfg)
      const vr = await fetch(ppBase(cfg) + '/v1/notifications/verify-webhook-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
        body: JSON.stringify(verifyBody),
      })
      const vd: any = await vr.json().catch(() => ({}))
      if (vd.verification_status !== 'SUCCESS') {
        console.error('[paypal-webhook] Signatur ungültig:', vd.verification_status)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    } catch (e: any) {
      console.error('[paypal-webhook] Verify-Fehler:', e?.message)
      return NextResponse.json({ error: 'Verify failed' }, { status: 500 })
    }
  } else {
    console.warn('[paypal-webhook] OHNE Signaturprüfung akzeptiert (webhook_id oder sig fehlt) — nur für lokale Tests!')
  }

  const res = event?.resource || {}
  const ids = parseCustomId(res.custom_id || '')
  const paypalSubId = res.id || ''
  const { landingPageId, tenantId, slug } = ids

  try {
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        // Seite zuweisen + Customization aktivieren (gleiche Logik wie Stripe checkout.session.completed)
        if (tenantId) {
          await supabaseAdmin.from('tenants').update({ subscription_status: 'active' }).eq('id', tenantId)
        }
        let pid = landingPageId || ''
        if (!pid && slug) {
          const { data: lp } = await supabaseAdmin.from('landing_pages').select('id').eq('slug', slug).maybeSingle()
          pid = lp?.id || ''
        }
        if (!pid && tenantId) {
          const { data: cust } = await supabaseAdmin.from('page_customizations').select('landing_page_id').eq('tenant_id', tenantId).limit(1).maybeSingle()
          pid = cust?.landing_page_id || ''
        }
        if (pid) {
          await supabaseAdmin.from('landing_pages')
            .update({ status: 'rented', rented_by: tenantId || null, rented_at: new Date().toISOString() })
            .eq('id', pid)
          await supabaseAdmin.from('page_customizations').update({ is_active: true }).eq('landing_page_id', pid)
        }
        console.log('[paypal-webhook] AKTIVIERT:', { pid, tenantId, paypalSubId })
        break
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        // Gleiche Regel wie Stripe subscription.deleted: Mieter weg = Daten weg
        if (tenantId) {
          await supabaseAdmin.from('tenants')
            .update({ subscription_status: eventType.endsWith('SUSPENDED') ? 'past_due' : 'cancelled', paypal_subscription_id: null })
            .eq('id', tenantId)
        }
        let pid = landingPageId || ''
        if (!pid && slug) {
          const { data: lp } = await supabaseAdmin.from('landing_pages').select('id').eq('slug', slug).maybeSingle()
          pid = lp?.id || ''
        }
        if (pid) {
          await supabaseAdmin.from('landing_pages')
            .update({ status: 'available', rented_by: null, rented_at: null })
            .eq('id', pid)
          await supabaseAdmin.from('page_customizations').delete().eq('landing_page_id', pid)
          await supabaseAdmin.from('leads').delete().eq('landing_page_id', pid)
        }
        console.log('[paypal-webhook] BEENDET (' + eventType + '):', { pid, tenantId, paypalSubId })
        break
      }

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        if (tenantId) {
          await supabaseAdmin.from('tenants').update({ subscription_status: 'past_due' }).eq('id', tenantId)
        }
        console.log('[paypal-webhook] ZAHLUNG FEHLGESCHLAGEN:', { tenantId, paypalSubId })
        break
      }

      default:
        // PAYMENT.CAPTURE.COMPLETED etc. — ignorieren (Aktivierung läuft über SUBSCRIPTION.ACTIVATED)
        break
    }
  } catch (err: any) {
    console.error('[paypal-webhook] Verarbeitungsfehler:', err)
    return NextResponse.json({ error: err?.message }, { status: 500 }) // 500 → PayPal retries
  }

  return NextResponse.json({ received: true, event: eventType })
}
