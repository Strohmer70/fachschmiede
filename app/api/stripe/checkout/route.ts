import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'


// Lazy-load stripe only when needed
let stripe: any = null

function getStripe() {
  if (!stripe) {
    const Stripe = require('stripe')
    const key = process.env.STRIPE_SECRET_KEY
    if (!key || key.includes('PLACEHOLDER')) {
      return null
    }
    stripe = new Stripe(key, { apiVersion: '2024-06-20' })
  }
  return stripe
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { landing_page_id, slug, price_cents = 18900, success_url, cancel_url } = body

    const stripeClient = getStripe()
    
    // If Stripe is not configured, return error with instructions
    if (!stripeClient) {
      return NextResponse.json({ 
        error: 'Stripe not configured',
        message: 'Add STRIPE_SECRET_KEY to environment variables',
        checkout_url: null
      }, { status: 503 })
    }

    // Create Stripe Checkout Session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card', 'sepa_debit'],
      billing_address_collection: 'required',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `fachschmiede.de — Landing Page Miete`,
              description: `Monatliche Miete für ${slug || landing_page_id}`,
            },
            unit_amount: price_cents, // cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: success_url || `${request.headers.get('origin') || 'https://fachschmiede.de'}/mieten/erfolg?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${request.headers.get('origin') || 'https://fachschmiede.de'}/mieten/${slug || landing_page_id}`,
      metadata: {
        landing_page_id: landing_page_id || '',
        slug: slug || '',
      },
      subscription_data: {
        metadata: {
          landing_page_id: landing_page_id || '',
          slug: slug || '',
        },
      },
    })

    return NextResponse.json({ 
      checkout_url: session.url,
      session_id: session.id 
    })

  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ 
      error: 'Checkout failed',
      message: error.message 
    }, { status: 500 })
  }
}
