// app/api/tenant/customization/route.ts — Mieter-Dashboard Daten (Token-Auth)
// GET  → eigene Daten + Customization
// PATCH → Customization aktualisieren (Name, Telefon, E-Mail, Begrüßungstext)
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function getSecret(): string {
  return process.env.SESSION_SECRET || process.env.STRIPE_SECRET_KEY || 'dev-secret-nur-lokal'
}

async function authTenant(request: Request): Promise<{ tenantId: string } | { error: string; status: number }> {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token) return { error: 'Nicht eingeloggt.', status: 401 }
  const payload = verifyToken<{ tid: string }>(token, getSecret())
  if (!payload?.tid) return { error: 'Session ungültig oder abgelaufen – bitte erneut einloggen.', status: 401 }
  return { tenantId: payload.tid }
}

export async function GET(request: Request) {
  const auth = await authTenant(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('id, email, company_name, contact_name, phone, subscription_status, created_at')
    .eq('id', auth.tenantId)
    .maybeSingle()
  if (!tenant) return NextResponse.json({ error: 'Konto nicht gefunden.' }, { status: 404 })

  const { data: cust } = await supabaseAdmin
    .from('page_customizations')
    .select('id, landing_page_id, custom_company_name, custom_phone, custom_email, custom_welcome_text, custom_address, is_active, landing_page:landing_pages(slug, title, status)')
    .eq('tenant_id', auth.tenantId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ ok: true, tenant, customization: cust })
}

export async function PATCH(request: Request) {
  const auth = await authTenant(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json().catch(() => ({}))
  const allowed: Record<string, string> = {
    firma: 'custom_company_name',
    phone: 'custom_phone',
    email: 'custom_email',
    welcome: 'custom_welcome_text',
    address: 'custom_address',
  }
  const update: Record<string, string | null> = {}
  for (const [key, col] of Object.entries(allowed)) {
    if (body[key] !== undefined) update[col] = String(body[key]).slice(0, 500) || null
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nichts zu ändern.' }, { status: 400 })
  }

  // Customization des Tenants finden
  const { data: cust } = await supabaseAdmin
    .from('page_customizations')
    .select('id')
    .eq('tenant_id', auth.tenantId)
    .limit(1)
    .maybeSingle()
  if (!cust) return NextResponse.json({ error: 'Keine Mietseite gefunden.' }, { status: 404 })

  const { error } = await supabaseAdmin.from('page_customizations').update(update).eq('id', cust.id)
  if (error) return NextResponse.json({ error: 'Speichern fehlgeschlagen: ' + error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
