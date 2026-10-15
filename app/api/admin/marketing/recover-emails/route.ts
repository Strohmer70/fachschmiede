import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/admin-auth'

export const maxDuration = 300

// ═══════════════════════════════════════════════════════════════
// POST /api/admin/marketing/recover-emails/
// Findet fehlende E-Mails: crawlt Homepage + /impressum + /kontakt
// von Kontakten MIT Website aber OHNE E-Mail, extrahiert Adressen.
// BULK-MODUS (Dieter 2026-10-15): 300 s Runtime, 10 parallele Worker,
// bis zu ~400 Kontakte pro Lauf. Frontend ruft automatisch nach bis alle durch.
// ═══════════════════════════════════════════════════════════════

const JUNK = /(\.png|\.jpe?g|\.gif|\.webp|\.svg|@2x|@3x|example\.com|sentry|wixpress|@wix|fonts\.|unsplash|placeholder|no-?reply@|noreply@)/i

function extractEmails(html: string): string[] {
  const found = new Set<string>()
  // mailto: Links (%40-codiert)
  Array.from(html.matchAll(/mailto:([^"' >\s?&]+)/gi)).forEach(m => {
    const decoded = decodeURIComponent(m[1]).replace(/^(mailto:)/i, '')
    if (decoded.includes('@')) found.add(decoded.toLowerCase().trim())
  })
  // Klartext-E-Mails im HTML
  Array.from(html.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)).forEach(m => {
    found.add(m[0].toLowerCase().trim())
  })
  return Array.from(found).filter(e => !JUNK.test(e) && e.length < 80 && /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(e))
}

async function fetchPage(url: string): Promise<string> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 7000)
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
    })
    clearTimeout(t)
    if (!res.ok) return ''
    return await res.text()
  } catch {
    return ''
  }
}

async function crawlEmails(url: string): Promise<string[]> {
  const base = url.replace(/\/$/, '')
  const paths = ['', '/impressum', '/impressum.html', '/kontakt', '/kontakt.html']
  // ALLE Pfade PARALLEL — langsame Seite kostet max 7 s, nicht 5×7 s
  const htmls = await Promise.all(paths.map(p => fetchPage(base + p)))
  // Priorität: Homepage > Impressum > Kontakt
  for (const html of htmls) {
    if (!html) continue
    const emails = extractEmails(html)
    if (emails.length) return emails
  }
  return []
}

export async function POST(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }
  try {
    const body = await request.json().catch(() => ({}))
    const limit = Math.min(Number(body?.limit) || 400, 500)

    const { data: contacts, error } = await supabaseAdmin
      .from('marketing_contacts')
      .select('id, company_name, website')
      .is('email', null)
      .not('website', 'is', null)
      .limit(limit)
    if (error) throw error
    // Wie viele sind GESAMT noch offen (für Frontend-Fortschritt)
    const { count: remaining } = await supabaseAdmin
      .from('marketing_contacts')
      .select('*', { count: 'exact', head: true })
      .is('email', null)
      .not('website', 'is', null)
    if (!contacts?.length) {
      return NextResponse.json({ success: true, scanned: 0, recovered: 0, remaining: remaining || 0, message: 'Nichts zu prüfen — alle Kontakte mit Website haben eine E-Mail.' })
    }

    let recovered = 0
    const start = Date.now()
    // 10 parallele Worker — jeder nimmt aus der Queue, bis leer oder 280 s erreicht
    const queue = [...contacts]
    const worker = async (): Promise<void> => {
      while (queue.length && Date.now() - start < 280000) {
        const c = queue.shift()!
        const emails = await crawlEmails(c.website)
        const best = emails[0] || null
        if (best) {
          await supabaseAdmin.from('marketing_contacts').update({ email: best }).eq('id', c.id)
          recovered++
        }
      }
    }
    await Promise.all(Array.from({ length: 10 }, () => worker()))

    const done = recovered
    const abortedEarly = queue.length > 0
    return NextResponse.json({
      success: true,
      scanned: contacts.length - queue.length,
      recovered: done,
      remaining: Math.max((remaining || 0) - (contacts.length - queue.length), 0),
      abortedEarly,
      results: [], // kompakt — UI nutzt nur Zähler
    })
  } catch (error: any) {
    console.error('Recover emails error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
