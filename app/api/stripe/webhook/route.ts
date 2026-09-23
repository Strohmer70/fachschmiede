// app/api/stripe/webhook/route.ts — Stripe-Events → Mieter aktivieren/deaktivieren
// In Stripe-Dashboard: Webhook → https://www.fachschmiede.de/api/stripe/webhook/
// Registriert: we_1UIohKRtRWcgWLNljoXNYdS1 (LIVE, 2026-09-23, API 2024-06-20)
// Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.includes('PLACEHOLDER')) return null
  const Stripe = require('stripe')
  return new Stripe(key, { apiVersion: '2024-06-20' })
}

export async function POST(request: Request) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const payload = await request.text()
  const sig = request.headers.get('stripe-signature') || ''

  let event: any
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (webhookSecret) {
    try {
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret)
    } catch (err: any) {
      console.error('[webhook] Signatur ungültig:', err.message)
      return NextResponse.json({ error: 'Invalid signature: ' + err.message }, { status: 400 })
    }
  } else {
    // Ohne Secret (nur zum lokalen Testen!) — im Produktivbetrieb IMMER STRIPE_WEBHOOK_SECRET setzen
    try {
      event = JSON.parse(payload)
    } catch {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
  }

  const meta = event?.data?.object?.metadata || event?.data?.object?.subscription_details?.metadata || {}
  const { landing_page_id, tenant_id } = meta

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // Zahlung/Trial gestartet → Seite zuweisen + Customization aktivieren
        if (tenant_id) {
          await supabaseAdmin.from('tenants').update({ subscription_status: 'active' }).eq('id', tenant_id)
        }
        if (landing_page_id && tenant_id) {
          await supabaseAdmin
            .from('landing_pages')
            .update({ status: 'rented', rented_by: tenant_id, rented_at: new Date().toISOString() })
            .eq('id', landing_page_id)
          await supabaseAdmin
            .from('page_customizations')
            .update({ is_active: true })
            .eq('landing_page_id', landing_page_id)
            .eq('tenant_id', tenant_id)
        }
        console.log('[webhook] Aktiviert:', { landing_page_id, tenant_id })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        const statusMap: Record<string, string> = {
          active: 'active', trialing: 'active', past_due: 'past_due',
          canceled: 'cancelled', incomplete_expired: 'cancelled', unpaid: 'cancelled',
        }
        const newStatus = statusMap[sub.status] || 'inactive'
        if (tenant_id) {
          await supabaseAdmin.from('tenants').update({ subscription_status: newStatus, stripe_subscription_id: sub.id }).eq('id', tenant_id)
        }
        // AKTIVIEREN: active/trialing → Seite vermietet (robust per meta.landing_page_id → meta.slug → tenant-customization)
        if (newStatus === 'active') {
          let pid = landing_page_id || ''
          if (!pid && meta.slug) {
            const { data: lp } = await supabaseAdmin.from('landing_pages').select('id').eq('slug', meta.slug).maybeSingle()
            pid = lp?.id || ''
          }
          if (!pid && tenant_id) {
            const { data: cust } = await supabaseAdmin.from('page_customizations').select('landing_page_id').eq('tenant_id', tenant_id).limit(1).maybeSingle()
            pid = cust?.landing_page_id || ''
          }
          if (pid) {
            await supabaseAdmin.from('landing_pages').update({ status: 'rented', rented_by: tenant_id || null, rented_at: new Date().toISOString() }).eq('id', pid)
            await supabaseAdmin.from('page_customizations').update({ is_active: true }).eq('landing_page_id', pid)
            console.log('[webhook] Seite aktiviert:', pid)
          }
          console.log('[webhook] WARNUNG: pid nicht auflösbar slug=', meta.slug)
        }
        // past_due/cancelled → Seite ggf. wieder freigeben
        if ((newStatus === 'cancelled' || newStatus === 'inactive') && landing_page_id) {
          await supabaseAdmin
            .from('landing_pages')
            .update({ status: 'available', rented_by: null, rented_at: null })
            .eq('id', landing_page_id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        if (tenant_id) {
          await supabaseAdmin.from('tenants').update({ subscription_status: 'cancelled' }).eq('id', tenant_id)
        }
        if (landing_page_id) {
          await supabaseAdmin
            .from('landing_pages')
            .update({ status: 'available', rented_by: null, rented_at: null })
            .eq('id', landing_page_id)
          await supabaseAdmin
            .from('page_customizations')
            .update({ is_active: false })
            .eq('landing_page_id', landing_page_id)
        }
        console.log('[webhook] Kündigung verarbeitet:', { landing_page_id, tenant_id })
        break
      }

      case 'invoice.payment_failed': {
        if (tenant_id) {
          await supabaseAdmin.from('tenants').update({ subscription_status: 'past_due' }).eq('id', tenant_id)
        }
        break
      }

      default:
        // Unbehandelte Events ignorieren (OK)
        break
    }
  } catch (err: any) {
    console.error('[webhook] Verarbeitungsfehler:', err)
    // 500 → Stripe retries (sicher bei DB-Fehlern)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
