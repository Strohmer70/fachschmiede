// app/api/admin/gsc/connect/route.ts — Redirect zu Google OAuth
// Auth: ?token=<adminToken aus localStorage> (Browser-Redirect kann keinen Header setzen;
// der Token wird NUR hier geprüft, der Google-callback-URI bleibt exakt matchbar)
import { NextRequest, NextResponse } from 'next/server'
import { VALID_PASSWORDS } from '@/lib/admin-auth'
import { getGscConfig } from '@/lib/gsc'

export const dynamic = 'force-dynamic'

function checkToken(token: string): boolean {
  try {
    const decoded = atob(token)
    return VALID_PASSWORDS.some((pw) => decoded.startsWith(pw))
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
  if (!checkToken(token)) {
    return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 401 })
  }
  try {
    const cfg = await getGscConfig()
    if (!cfg?.client_id) return NextResponse.json({ error: 'Client-ID fehlt – bitte erst in den Admin-Einstellungen speichern.' }, { status: 400 })
    const base = req.nextUrl.origin // https://www.fachschmiede.de
    const redirectUri = `${base}/api/admin/gsc/callback`
    const params = new URLSearchParams({
      client_id: cfg.client_id,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      access_type: 'offline',
      prompt: 'consent', // erzwingt refresh_token
    })
    return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
