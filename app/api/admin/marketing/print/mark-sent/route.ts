import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/admin-auth'

export const maxDuration = 30

// ─── POST /api/admin/marketing/print/mark-sent/ ─────────────────
// Markiert Kontakte als print-versendet. Body: { ids: string[] }

export async function POST(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const ids: string[] = Array.isArray(body.ids) ? body.ids.slice(0, 100) : []
    if (!ids.length) return NextResponse.json({ error: 'ids (Array) fehlt' }, { status: 400 })

    const now = new Date().toISOString()
    const { error } = await supabaseAdmin
      .from('marketing_contacts')
      .update({ status: 'print_sent', print_sent_at: now })
      .in('id', ids)

    if (error) throw error
    return NextResponse.json({ success: true, marked: ids.length })
  } catch (error: any) {
    console.error('Print mark-sent error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
