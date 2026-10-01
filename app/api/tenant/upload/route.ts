// app/api/tenant/upload/route.ts — Bild-Upload für Mieter (Logo/Hero/Team/Referenzen)
// POST multipart: field=logo|hero|team|ref, file=<Bild>
// → Supabase Storage (tenant-assets, public), liefert { ok, url, path }
// Das Speichern der URL ins Profil macht das Dashboard via PATCH /api/tenant/customization.
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const json = (data: any, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'X-Canary': new Date().toISOString() },
  })

function getSecret(): string {
  return process.env.SESSION_SECRET || process.env.STRIPE_SECRET_KEY || 'dev-secret-nur-lokal'
}

const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB (Bucket-Limit deckungsgleich)

export async function POST(request: Request) {
  try {
    const auth = request.headers.get('authorization') || ''
    const token = auth.replace(/^Bearer\s+/i, '')
    if (!token) return json({ error: 'Nicht eingeloggt.' }, 401)
    const payload = verifyToken<{ tid: string }>(token, getSecret())
    if (!payload?.tid) return json({ error: 'Session ungültig oder abgelaufen.' }, 401)
    const tenantId: string = payload.tid

    const form = await request.formData().catch(() => null)
    if (!form) return json({ error: 'FormData erwartet.' }, 400)
    const field = String(form.get('field') || '')
    if (!['logo', 'hero', 'team', 'ref'].includes(field)) return json({ error: 'field muss logo|hero|team|ref sein.' }, 400)
    const file = form.get('file')
    if (!file || typeof file === 'string') return json({ error: 'Datei fehlt.' }, 400)
    const buf = Buffer.from(await (file as Blob).arrayBuffer())
    if (!buf.length) return json({ error: 'Leere Datei.' }, 400)
    if (buf.length > MAX_BYTES) return json({ error: 'Maximale Dateigröße: 5 MB.' }, 400)
    const ext = ALLOWED[(file as File).type]
    if (!ext) return json({ error: 'Nur JPG, PNG oder WEBP erlaubt.' }, 400)

    // magische Bytes prüfen (Spoofing-Schutz)
    const sig = buf.subarray(0, 4).toString('hex')
    const isJpg = sig.startsWith('ffd8ff')
    const isPng = sig.startsWith('89504e47')
    const isWebp = buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP'
    if (!isJpg && !isPng && !isWebp) return json({ error: 'Dateiinhalt ist kein Bild.' }, 400)

    const path = `${tenantId}/${field}-${Date.now()}.${ext}`
    const { error: upErr } = await supabaseAdmin.storage
      .from('tenant-assets')
      .upload(path, buf, { contentType: (file as File).type, upsert: false, cacheControl: '31536000' })
    if (upErr) return json({ error: 'Upload fehlgeschlagen: ' + upErr.message }, 500)

    const pub = supabaseAdmin.storage.from('tenant-assets').getPublicUrl(path)
    const url = pub?.data?.publicUrl
    if (!url) return json({ error: 'Öffentliche URL konnte nicht erzeugt werden.' }, 500)
    return json({ ok: true, url, path })
  } catch (err: any) {
    return json({ error: err?.message || 'Upload-Fehler' }, 500)
  }
}
