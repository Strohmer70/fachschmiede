// app/api/admin/support-tickets/route.ts — Admin: Support-Tickets lesen/aktualisieren/löschen
// 2026-10-03: Ersetzt die hartkodierten Demo-Tickets im Admin. DELETE = Dieters Wunsch
// ("ich sollte in der Lage sein diese Einträge direkt im dashboard zu löschen").
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const VALID_STATUS = ['Offen', 'In Bearbeitung', 'Erledigt']

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw new Error('DB: ' + error.message)
    return NextResponse.json({ success: true, tickets: data || [] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, resolution } = body
    if (!id) return NextResponse.json({ success: false, error: 'ID erforderlich.' }, { status: 400 })

    const update: any = {}
    if (status !== undefined) {
      if (!VALID_STATUS.includes(status)) {
        return NextResponse.json({ success: false, error: 'Ungültiger Status.' }, { status: 400 })
      }
      update.status = status
      update.resolved_at = status === 'Erledigt' ? new Date().toISOString() : null
    }
    if (resolution !== undefined) update.resolution = String(resolution || '').slice(0, 300)

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .update(update)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error('DB: ' + error.message)
    return NextResponse.json({ success: true, ticket: data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'ID erforderlich.' }, { status: 400 })

    const { error } = await supabaseAdmin.from('support_tickets').delete().eq('id', id)
    if (error) throw new Error('DB: ' + error.message)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
