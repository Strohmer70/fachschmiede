// app/api/payment-status/route.ts — Erfolgsseite fragt hier den echten Miet-Status
// GET ?slug=maler-schwerte → { status: 'available'|'rented', rented: boolean }
// Kein PII — nur öffentlicher Seitenstatus (für die Erfolgs-Poll-Logik)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') || ''
  if (!slug) return NextResponse.json({ error: 'slug fehlt' }, { status: 400 })
  const { data: page } = await supabaseAdmin
    .from('landing_pages')
    .select('status, rented_by')
    .eq('slug', slug)
    .maybeSingle()
  if (!page) return NextResponse.json({ status: 'unknown', rented: false }, { status: 404 })
  // Trial-Infos für die Erfolgs-Seite (Text: Testphase vs. Zahlung)
  let trialing = false
  let trialEndsAt: string | null = null
  if (page.status === 'rented' && page.rented_by) {
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('subscription_status')
      .eq('id', page.rented_by)
      .maybeSingle()
    if (tenant?.subscription_status === 'trialing') {
      trialing = true
      // Echtes Trial-Ende via PayPal-Subscription (billing_info.next_billing_time)
      const { data: t2 } = await supabaseAdmin
        .from('tenants').select('paypal_subscription_id').eq('id', page.rented_by).maybeSingle()
      if (t2?.paypal_subscription_id) {
        try {
          const { getPayPalConfig, ppApi } = await import('@/lib/paypal')
          const cfg = await getPayPalConfig()
          if (cfg) {
            const sub = await ppApi(cfg, '/v1/billing/subscriptions/' + encodeURIComponent(t2.paypal_subscription_id))
            if (sub.billing_info?.next_billing_time) trialEndsAt = sub.billing_info.next_billing_time
          }
        } catch { /* best-effort */ }
      }
    }
  }
  return NextResponse.json({ status: page.status, rented: page.status === 'rented', trialing, trial_ends_at: trialEndsAt })
}
