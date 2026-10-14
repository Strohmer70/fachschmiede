// app/api/admin/gsc/route.ts — GSC-Status / Client-Credentials speichern / trennen
import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getGscConfig, saveGscConfig } from '@/lib/gsc'

export const dynamic = 'force-dynamic'

function isAdmin(req: NextRequest): boolean {
  return checkAdminAuth(req as unknown as Request)
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 401 })
  try {
    const cfg = await getGscConfig()
    return NextResponse.json({
      ok: true,
      has_client: !!(cfg?.client_id && cfg?.client_secret),
      has_client_secret: !!cfg?.client_secret,
      connected: !!(cfg?.refresh_token && cfg?.property),
      property: cfg?.property || null,
      client_id_preview: cfg?.client_id ? cfg.client_id.slice(0, 12) + '…' : null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 401 })
  try {
    const body = await req.json().catch(() => ({}))
    const action = body.action || 'save-client'
    if (action === 'disconnect') {
      await saveGscConfig({ refresh_token: '', property: '', connected_email: '' })
      return NextResponse.json({ ok: true, disconnected: true })
    }
    // save-client: { client_id, client_secret }
    if (!body.client_id || !body.client_secret) {
      return NextResponse.json({ error: 'client_id und client_secret erforderlich' }, { status: 400 })
    }
    await saveGscConfig({ client_id: String(body.client_id).trim(), client_secret: String(body.client_secret).trim() })
    return NextResponse.json({ ok: true, saved: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
