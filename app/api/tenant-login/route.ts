// app/api/tenant-login/route.ts — Mieter-Login (E-Mail + Passwort) → Token
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyPassword, signToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'E-Mail und Passwort erforderlich.' }, { status: 400 })
    }
    const emailNorm = String(email).trim().toLowerCase()

    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('id, email, password_hash, company_name, contact_name, phone, subscription_status')
      .eq('email', emailNorm)
      .maybeSingle()

    if (!tenant || !tenant.password_hash || !verifyPassword(String(password), tenant.password_hash)) {
      return NextResponse.json({ error: 'Login fehlgeschlagen – E-Mail oder Passwort falsch.' }, { status: 401 })
    }

    const secret = process.env.SESSION_SECRET || process.env.STRIPE_SECRET_KEY || 'dev-secret-nur-lokal'
    const token = signToken({ tid: tenant.id, email: tenant.email }, secret)

    return NextResponse.json({
      ok: true,
      token,
      tenant: {
        id: tenant.id,
        email: tenant.email,
        company: tenant.company_name,
        contactName: tenant.contact_name,
        phone: tenant.phone,
        subscriptionStatus: tenant.subscription_status,
      },
    })
  } catch (err: any) {
    console.error('[tenant-login]', err)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
