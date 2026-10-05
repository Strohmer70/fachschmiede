// app/api/admin/payment/route.ts — Zahlungsanbieter-Status (Stripe echt geprüft)
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const hasStripeSecret = !!process.env.STRIPE_SECRET_KEY
  const keyPrefix = (process.env.STRIPE_SECRET_KEY || '').slice(0, 7) // sk_live / sk_test
  const live = keyPrefix === 'sk_live'
  return NextResponse.json({
    success: true,
    stripe: {
      configured: hasStripeSecret,
      mode: hasStripeSecret ? (live ? 'live' : 'test') : null,
    },
    paypal: { configured: false }, // Roadmap (Braintree)
  })
}
