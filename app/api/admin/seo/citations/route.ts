// app/api/admin/seo/citations/route.ts — SEO-Hub: Citation-Checkliste (lokale Zitate)
// GET: Liste nach Priorität | PATCH: Status/Profil-URL/Notiz aktualisieren
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const ALLOWED_STATUS = ['not_started', 'in_progress', 'live']

function authed(req: NextRequest): boolean {
  return checkAdminAuth(req as unknown as Request)
}

export async function GET(req: NextRequest) {
  try {
    if (!authed(req)) return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 401 })
    const { data, error } = await supabaseAdmin
      .from('citations')
      .select('*')
      .order('priority', { ascending: false })
    if (error) throw error
    return NextResponse.json({ citations: data || [] })
  } catch (err: any) {
    console.error('[admin/seo/citations] GET:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!authed(req)) return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 401 })
    const b = await req.json().catch(() => null)
    if (!b || !b.id) return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })
    const patch: Record<string, any> = { updated_at: new Date().toISOString() }
    if (b.status !== undefined) {
      if (!ALLOWED_STATUS.includes(b.status)) return NextResponse.json({ error: `status: ${ALLOWED_STATUS.join('|')}` }, { status: 400 })
      patch.status = b.status
    }
    if (b.profile_url !== undefined) patch.profile_url = String(b.profile_url).trim()
    if (b.notes !== undefined) patch.notes = String(b.notes).trim()
    const { data, error } = await supabaseAdmin.from('citations').update(patch).eq('id', b.id).select().single()
    if (error) throw error
    return NextResponse.json({ ok: true, citation: data })
  } catch (err: any) {
    console.error('[admin/seo/citations] PATCH:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
