// app/api/rent/route.ts — ECHTES Onboarding: Tenant anlegen + Stripe Checkout
// POST { slug, trade, city, firma, name, email, tel, password, farbe, modus }
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'
import { sendMail, welcomeMailTenant } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

const STRIPE_KEY = () => process.env.STRIPE_SECRET_KEY || ''
const PRICE_DEFAULT = 18900 // €189/Monat in Cent (Fallback)
const TRIAL_DAYS = 14

function getStripe(): any | null {
  const key = STRIPE_KEY()
  if (!key || key.includes('PLACEHOLDER')) return null
  const Stripe = require('stripe')
  return new Stripe(key, { apiVersion: '2024-06-20' })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { slug, trade, city, firma, name, email, tel, password, farbe, modus } = body || {}

    // ── Validierung ──
    if (!slug || !email || !password) {
      return NextResponse.json({ error: 'Fehlende Pflichtfelder (Seite, E-Mail, Passwort).' }, { status: 400 })
    }
    const emailNorm = String(email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      return NextResponse.json({ error: 'Ungültige E-Mail-Adresse.' }, { status: 400 })
    }
    if (String(password).length < 8) {
      return NextResponse.json({ error: 'Passwort muss mindestens 8 Zeichen haben.' }, { status: 400 })
    }

    // ── Landing Page finden (Slug = z.B. "dachdecker-herne") ──
    let { data: page } = await supabaseAdmin
      .from('landing_pages')
      .select('id, slug, title, monthly_price, status, rented_by')
      .eq('slug', slug)
      .maybeSingle()

    if (!page) {
      // Fallback: über cities+trades auflösen und Slug-Zeile anlegen
      const citySlug = slug.split('-').pop() || ''
      const [{ data: cityRow }, { data: tradeRow }] = await Promise.all([
        supabaseAdmin.from('cities').select('id').eq('slug', citySlug).maybeSingle(),
        supabaseAdmin.from('trades').select('id').eq('slug', trade).maybeSingle(),
      ])
      if (!cityRow || !tradeRow) {
        return NextResponse.json({ error: 'Diese Seite existiert nicht (Stadt/Gewerk unbekannt).' }, { status: 404 })
      }
      const { data: created, error: insErr } = await supabaseAdmin
        .from('landing_pages')
        .insert({
          city_id: cityRow.id,
          trade_id: tradeRow.id,
          slug,
          title: `${trade} ${city}`,
          h1: `${trade} ${city}`,
          monthly_price: PRICE_DEFAULT,
          status: 'available',
        })
        .select('id, slug, title, monthly_price, status, rented_by')
        .single()
      if (insErr || !created) {
        return NextResponse.json({ error: 'Seite konnte nicht angelegt werden: ' + insErr?.message }, { status: 500 })
      }
      page = created
    }

    if (page.status === 'rented' && page.rented_by) {
      return NextResponse.json({ error: 'Diese Seite ist bereits vergeben.' }, { status: 409 })
    }

    // ── Tenant anlegen (oder 409 wenn E-Mail schon registriert) ──
    const { data: existingTenant } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('email', emailNorm)
      .maybeSingle()
    if (existingTenant) {
      return NextResponse.json({ error: 'Diese E-Mail ist bereits registriert – bitte im Dashboard einloggen.', code: 'EMAIL_EXISTS' }, { status: 409 })
    }

    const passwordHash = hashPassword(String(password))
    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from('tenants')
      .insert({
        email: emailNorm,
        password_hash: passwordHash,
        company_name: (firma || name || 'Handwerksbetrieb').trim(),
        contact_name: (name || '').trim() || null,
        phone: (tel || '').trim() || null,
        subscription_status: 'inactive',
      })
      .select('id')
      .single()
    if (tenantErr || !tenant) {
      return NextResponse.json({ error: 'Konto konnte nicht angelegt werden: ' + tenantErr?.message }, { status: 500 })
    }

    // ── Customization (inaktiv bis Zahlung/Ende Testphase) ──
    const { error: custErr } = await supabaseAdmin
      .from('page_customizations')
      .upsert({
        landing_page_id: page.id,
        tenant_id: tenant.id,
        custom_company_name: (firma || '').trim() || null,
        custom_phone: (tel || '').trim() || null,
        custom_email: emailNorm,
        is_active: false,
      }, { onConflict: 'landing_page_id,tenant_id' })
    if (custErr) console.error('[rent] customizations:', custErr.message)

    const priceCents = page.monthly_price || PRICE_DEFAULT
    const publicUrl = `https://www.fachschmiede.de/${tradePath(trade)}/${slug.split('-').pop()}/`

    // ── Willkommens-E-Mail (auch ohne Stripe schon senden) ──
    const isTrial = modus === 'test'
    const trialEnd = isTrial ? new Date(Date.now() + TRIAL_DAYS * 86400000).toLocaleDateString('de-DE') : undefined
    await sendMail({
      to: emailNorm,
      ...welcomeMailTenant({
        name: (name || firma || '').trim(),
        email: emailNorm,
        password: String(password),
        pageUrl: publicUrl,
        trade: String(trade || '').replace(/^./, c => c.toUpperCase()),
        city: String(city || ''),
        trialEnds: trialEnd,
      }),
    })

    // ── Stripe Checkout ──
    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json({
        error: 'Stripe ist noch nicht konfiguriert (STRIPE_SECRET_KEY fehlt). Konto wurde angelegt – wir melden uns.',
        provisioned: true,
      }, { status: 503 })
    }

    const session = await stripe.checkout.sessions.create({
      // payment_method_types weglassen → Stripe zeigt automatisch alle im Dashboard aktivierten Methoden
      // (card immer aktiv; SEPA erscheint automatisch sobald Dieter es aktiviert — kein Code-Change nötig)
      billing_address_collection: 'required',
      customer_email: emailNorm,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `fachschmiede.de – Mietseite ${city || slug}`,
            description: `Monatliche Miete: ${trade} in ${city} (${publicUrl})`,
          },
          unit_amount: priceCents,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      // Trial: Karte erst nach Testphase erheben – wandelt deutlich besser
      ...(isTrial ? { payment_method_collection: 'if_required' as const } : {}),
      subscription_data: isTrial
        ? { trial_period_days: TRIAL_DAYS, metadata: { landing_page_id: page.id, slug, tenant_id: tenant.id } }
        : { metadata: { landing_page_id: page.id, slug, tenant_id: tenant.id } },
      metadata: { landing_page_id: page.id, slug, tenant_id: tenant.id },
      success_url: `https://www.fachschmiede.de/mieten/erfolg/?slug=${encodeURIComponent(slug)}`,
      cancel_url: `https://www.fachschmiede.de/${tradePath(trade)}/`,
    })

    return NextResponse.json({ ok: true, checkout_url: session.url, tenant_id: tenant.id })
  } catch (err: any) {
    console.error('[rent]', err)
    return NextResponse.json({ error: 'Onboarding fehlgeschlagen: ' + (err?.message || err) }, { status: 500 })
  }
}

// Gewerk-DB-slug → URL-Pfad (zimmerei → zimmerer, garten-… bleibt)
function tradePath(trade: string): string {
  const t = String(trade || '').toLowerCase()
  if (t === 'zimmerei' || t === 'zimmerer') return 'zimmerer'
  if (t === 'garten' || t.startsWith('garten')) return 'garten-und-landschaftsbau'
  return t
}
