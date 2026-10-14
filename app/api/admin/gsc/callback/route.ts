// app/api/admin/gsc/callback/route.ts — Google ruft nach Consent hier auf
// Code → Tokens → Property auto-wählen → speichern → zurück zu admin.html#google
import { NextRequest, NextResponse } from 'next/server'
import { getGscConfig, saveGscConfig, gscListSites, gscAccessToken } from '@/lib/gsc'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const err = req.nextUrl.searchParams.get('error')
  const base = req.nextUrl.origin
  const fail = (msg: string) => NextResponse.redirect(`${base}/admin.html?gsc=error&msg=${encodeURIComponent(msg)}#google`)

  if (err) return fail('Google-Autorisierung abgebrochen: ' + err)
  if (!code) return fail('Kein Code von Google erhalten.')

  try {
    const cfg = await getGscConfig()
    if (!cfg) return fail('GSC-Konfiguration fehlt.')
    const redirectUri = `${base}/api/admin/gsc/callback`

    const tokRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: cfg.client_id,
        client_secret: cfg.client_secret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    const tok = await tokRes.json().catch(() => ({}))
    if (!tokRes.ok || !tok.access_token) {
      return fail('Token-Austausch fehlgeschlagen: ' + (tok.error_description || tok.error || tokRes.status))
    }

    // Property automatisch wählen: Domain-Property bevorzugt, sonst www-URL-Prefix
    const probe = { ...cfg, refresh_token: tok.refresh_token || cfg.refresh_token }
    let sites: { siteUrl: string; permissionLevel: string }[] = []
    try {
      sites = await gscListSites(probe as any)
    } catch (e: any) {
      return fail('Sites nicht lesbar (Property in GSC verifiziert?): ' + e.message)
    }
    const domain = sites.find((s) => s.siteUrl === 'sc-domain:fachschmiede.de')
    const prefix = sites.find((s) => s.siteUrl === 'https://www.fachschmiede.de/')
    const fallback = sites.find((s) => s.siteUrl.includes('fachschmiede.de'))
    const property = domain?.siteUrl || prefix?.siteUrl || fallback?.siteUrl || ''
    if (!property) return fail('Keine fachschmiede.de-Property in diesem GSC-Konto gefunden. Bitte Seite erst in Search Console verifizieren.')

    await saveGscConfig({
      refresh_token: tok.refresh_token || cfg.refresh_token,
      property,
    })
    return NextResponse.redirect(`${base}/admin.html?gsc=connected&property=${encodeURIComponent(property)}#google`)
  } catch (e: any) {
    return fail(e.message)
  }
}
