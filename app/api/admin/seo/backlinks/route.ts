// app/api/admin/seo/backlinks/route.ts — SEO-Hub: Backlink-Tracker
// GET: Liste (mit Page-Zuordnung) | POST: anlegen | PATCH: ändern | DELETE: löschen
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPE = ['backlink', 'citation', 'press', 'guestpost', 'directory', 'social', 'forum', 'other']
const ALLOWED_STATUS = ['planned', 'submitted', 'live', 'indexed', 'lost', 'rejected']

function authed(req: NextRequest): boolean {
  return checkAdminAuth(req as unknown as Request)
}

export async function GET(req: NextRequest) {
  try {
    if (!authed(req)) return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 401 })
    const { data, error } = await supabaseAdmin
      .from('backlinks')
      .select('id, landing_page_id, target_url, source_url, anchor, type, status, dr, cost, notes, created_at, updated_at, page:landing_pages(slug, title, trade:trades(slug), city:cities(slug))')
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) throw error
    return NextResponse.json({ backlinks: data || [] })
  } catch (err: any) {
    console.error('[admin/seo/backlinks] GET:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!authed(req)) return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 401 })
    const b = await req.json().catch(() => null)
    if (!b || !b.source_url || !b.source_url.trim()) {
      return NextResponse.json({ error: 'source_url erforderlich' }, { status: 400 })
    }
    if (b.type && !ALLOWED_TYPE.includes(b.type)) {
      return NextResponse.json({ error: `type muss sein: ${ALLOWED_TYPE.join('|')}` }, { status: 400 })
    }
    if (b.status && !ALLOWED_STATUS.includes(b.status)) {
      return NextResponse.json({ error: `status muss sein: ${ALLOWED_STATUS.join('|')}` }, { status: 400 })
    }
    const row = {
      landing_page_id: b.landing_page_id || null,
      target_url: (b.target_url || '').trim(),
      source_url: b.source_url.trim(),
      anchor: (b.anchor || '').trim(),
      type: b.type || 'backlink',
      status: b.status || 'submitted',
      dr: b.dr != null && b.dr !== '' ? Math.max(0, Math.min(100, parseInt(b.dr))) : null,
      cost: b.cost != null && b.cost !== '' ? parseFloat(b.cost) : 0,
      notes: (b.notes || '').trim(),
    }
    const { data, error } = await supabaseAdmin.from('backlinks').insert(row).select().single()
    if (error) throw error
    return NextResponse.json({ ok: true, backlink: data })
  } catch (err: any) {
    console.error('[admin/seo/backlinks] POST:', err)
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
    if (b.type !== undefined) {
      if (!ALLOWED_TYPE.includes(b.type)) return NextResponse.json({ error: `type: ${ALLOWED_TYPE.join('|')}` }, { status: 400 })
      patch.type = b.type
    }
    if (b.source_url !== undefined) patch.source_url = String(b.source_url).trim()
    if (b.target_url !== undefined) patch.target_url = String(b.target_url).trim()
    if (b.anchor !== undefined) patch.anchor = String(b.anchor).trim()
    if (b.dr !== undefined) patch.dr = b.dr === '' ? null : Math.max(0, Math.min(100, parseInt(b.dr)))
    if (b.cost !== undefined) patch.cost = parseFloat(b.cost) || 0
    if (b.notes !== undefined) patch.notes = String(b.notes).trim()
    if (b.landing_page_id !== undefined) patch.landing_page_id = b.landing_page_id || null
    const { data, error } = await supabaseAdmin.from('backlinks').update(patch).eq('id', b.id).select().single()
    if (error) throw error
    return NextResponse.json({ ok: true, backlink: data })
  } catch (err: any) {
    console.error('[admin/seo/backlinks] PATCH:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!authed(req)) return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id erforderlich (?id=)' }, { status: 400 })
    const { error } = await supabaseAdmin.from('backlinks').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[admin/seo/backlinks] DELETE:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
