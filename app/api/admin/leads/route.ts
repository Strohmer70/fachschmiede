import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// API-Routen dürfen NIEMALS statisch generiert werden
export const dynamic = 'force-dynamic'

const ALLOWED_STATUS = ['new', 'contacted', 'won', 'lost']

/**
 * GET /api/admin/leads/
 * Liste aller Leads (neueste zuerst), inkl. Website-Slug und Mieter.
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('id, name, phone, email, message, status, created_at, landing_page:landing_pages(slug, title), tenant:tenants(name, email)')
      .order('created_at', { ascending: false })
      .limit(300)

    if (error) throw error

    return NextResponse.json({ leads: data || [] })
  } catch (err: any) {
    console.error('[admin/leads] GET-Fehler:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/leads/
 * Body: { id, status } — Status-Update (new/contacted/won/lost)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || !body.id || !ALLOWED_STATUS.includes(body.status)) {
      return NextResponse.json({ error: 'id + gültiger Status (new|contacted|won|lost) erforderlich' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('leads')
      .update({ status: body.status })
      .eq('id', body.id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[admin/leads] PATCH-Fehler:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
