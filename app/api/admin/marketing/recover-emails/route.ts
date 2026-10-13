import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/admin-auth'

export const maxDuration = 60

// ═══════════════════════════════════════════════════════════════
// POST /api/admin/marketing/recover-emails/
// Findet fehlende E-Mails: crawlt Homepage + /impressum + /kontakt
// von Kontakten MIT Website aber OHNE E-Mail, extrahiert Adressen.
// Batched (max 25/Call) wegen 60 s Serverless-Limit.
// ═══════════════════════════════════════════════════════════════

const JUNK = /(\.png|\.jpe?g|\.gif|\.webp|\.svg|@2x|@3x|example\.com|sentry|wixpress|@wix|fonts\.|unsplash|placeholder|no-?reply@|noreply@)/i

function extractEmails(html: string): string[] {
  const found = new Set<string>()
  // mailto: Links (%40-codiert)
  Array.from(html.matchAll(/mailto:([^"'>\s?&]+)/gi)).forEach(m => {
    const decoded = decodeURIComponent(m[1]).replace(/^(mailto:)/i, '')
    if (decoded.includes('@')) found.add(decoded.toLowerCase().trim())
  })
  // Klartext-E-Mails im HTML
  Array.from(html.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)).forEach(m => {
    found.add(m[0].toLowerCase().trim())
  })
  return Array.from(found).filter(e => !JUNK.test(e) && e.length < 80 && /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(e))
}

async function crawlEmails(url: string): Promise<string[]> {
  const base = url.replace(/\/$/, '')
  const paths = ['', '/impressum', '/impressum.html', '/kontakt', '/kontakt.html']
  for (const p of paths) {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 7000)
      const res = await fetch(base + p, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        redirect: 'follow',
      })
      clearTimeout(t)
      if (!res.ok) continue
      const html = await res.text()
      const emails = extractEmails(html)
      if (emails.length) return emails
    } catch {
      continue
    }
  }
  return []
}

export async function POST(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }
  try {
    const body = await request.json().catch(() => ({}))
    const limit = Math.min(Number(body?.limit) || 25, 40)

    // Kontakte mit Website aber ohne E-Mail
    const { data: contacts, error } = await supabaseAdmin
      .from('marketing_contacts')
      .select('id, company_name, website')
      .is('email', null)
      .not('website', 'is', null)
      .limit(limit)
    if (error) throw error
    if (!contacts?.length) {
      return NextResponse.json({ success: true, scanned: 0, recovered: 0, message: 'Nichts zu prüfen — alle Kontakte mit Website haben eine E-Mail.' })
    }

    let recovered = 0
    const results: { company: string; email: string | null }[] = []
    for (const c of contacts) {
      const emails = await crawlEmails(c.website)
      const best = emails[0] || null
      if (best) {
        await supabaseAdmin.from('marketing_contacts').update({ email: best }).eq('id', c.id)
        recovered++
      }
      results.push({ company: c.company_name, email: best })
    }

    return NextResponse.json({
      success: true,
      scanned: contacts.length,
      recovered,
      results,
    })
  } catch (error: any) {
    console.error('Recover emails error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
