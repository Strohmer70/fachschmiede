import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/admin-auth'

export const maxDuration = 60

// ─── GET /api/admin/marketing/scrape/ ───────────────────────────
// ECHTER Server-Scraper: DuckDuckGo-Suche → Website → Impressum →
// E-Mail, Telefon, Adresse extrahieren → in marketing_contacts speichern.
// Nur öffentliche Geschäftsdaten (Impressum/Verzeichnisse), B2B.
// Query: ?gewerk=dachdecker&stadt=Hattingen&limit=8

const TRADE_LABELS: Record<string, string> = {
  dachdecker: 'Dachdecker',
  elektriker: 'Elektriker',
  klempner: 'Klempner',
  maler: 'Maler',
  zimmerer: 'Zimmerer',
  'garten-und-landschaftsbau': 'Gartenbau',
}

// Verzeichnisse/Portale — keine echten Betriebe
const BLOCKLIST = [
  'werkenntdenbesten', 'trustlocal', 'yelp', 'gelbeseiten', 'dasoertliche',
  'suchehandwerker', 'ziegelruf', '11880', 'golocal', 'kennstdueinen',
  'anwalt.de', 'branchenbuch', 'wlw', 'provenexpert', 'facebook', 'instagram',
  'wikipedia', 'youtube', 'google.', 'bing.', 'amazon', 'ebay',
  'immobilienscout', 'gelbeseiten.de', 'companybook', 'northdata',
  'webwiki', 'dastelefonbuch', 'goyellow', 'mein-prospekt', 'focus.de',
  'handelsregister', 'firmenwissen', 'kompass', 'aboutyou',
]

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

function isBlocked(url: string): boolean {
  const u = url.toLowerCase()
  return BLOCKLIST.some(b => u.includes(b))
}

async function fetchWithTimeout(url: string, ms = 8000): Promise<string | null> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), ms)
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': UA, 'Accept-Language': 'de-DE,de;q=0.9' },
    })
    clearTimeout(t)
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('text/html')) return null
    return await res.text()
  } catch {
    return null
  }
}

async function ddgSearch(query: string, limit: number): Promise<string[]> {
  const html = await fetchWithTimeout(
    'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query),
    10000
  )
  if (!html) return []
  const urls: string[] = []
  // DDG wrapped links: //duckduckgo.com/l/?uddg=<encoded>
  const re = /uddg=([^&"']+)/g
  let m
  while ((m = re.exec(html)) && urls.length < limit + 4) {
    try {
      const u = decodeURIComponent(m[1])
      if (u.startsWith('http') && !isBlocked(u)) urls.push(u)
    } catch { /* skip */ }
  }
  return urls
}

function extractEmails(html: string): string[] {
  const found = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []
  const seen = new Set<string>()
  const out: string[] = []
  for (let e of found) {
    e = e.toLowerCase().replace(/[.,;:)]+$/, '')
    if (seen.has(e)) continue
    if (/^(noreply|no-reply|mailer|daemon|abuse|postmaster)@/.test(e)) continue
    if (BLOCKLIST.some(b => e.includes(b))) continue
    if (/\.(png|jpg|jpeg|gif|webp|svg|css|js)$/.test(e)) continue
    seen.add(e)
    out.push(e)
  }
  return out
}

function extractPhone(html: string): string | null {
  const m = html.match(/(\+49[\d\s/()-]{7,17}\d|0\d{2,4}[\s/()-]?\d{3,}[\s/()-]?\d{2,}[\s/()-]?\d{0,})/)
  if (!m) return null
  const p = m[0].replace(/\s+/g, ' ').trim()
  return p.length >= 8 ? p.slice(0, 25) : null
}

function extractAddress(html: string): string | null {
  // Straße + Hausnr.
  const streetRe = /((?:[A-ZÄÖÜ][\wÄÖÜäöüß.-]+\s+){1,3}(?:Straße|Strasse|Str\.|weg|Weg|gasse|Gasse|platz|Platz|ring|Ring|allee|Allee|damm|Damm|pfad|Pfad|steig|Steig|chaussee|Chaussee|markt|Markt)\s*\d+\s*(?:[-/]\s*\d+)?)/m
  const plzRe = /\b(\d{5})\s+([A-ZÄÖÜ][\wÄÖÜäöüß-]+(?:\s+[A-ZÄÖÜ][\wÄÖÜäöüß-]+)?)/
  const s = html.match(streetRe)
  const z = html.match(plzRe)
  if (s && z) return `${s[1].trim()}, ${z[1]} ${z[2]}`
  if (z) return `${z[1]} ${z[2]}`
  return null
}

function extractCompany(html: string, fallback: string): string {
  const og = html.match(/og:site_name" content="([^"]+)"/i) || html.match(/<title[^>]*>([^<]+)</i)
  if (og) {
    let name = og[1].replace(/[|–—-].*$/, '').replace(/\s+(GmbH|e\.?\s?K\.?|KG|OHG|GbR)\.?\s*$/i, '$1').trim()
    if (name.length >= 3 && name.length <= 60) return name
  }
  return fallback
}

async function crawlSite(url: string): Promise<{
  email: string | null; phone: string | null; address: string | null; company: string
} | null> {
  const home = await fetchWithTimeout(url)
  if (!home) return null

  // Impressum-Link finden
  let impUrl: string | null = null
  const linkRe = /href="([^"]*impressum[^"]*)"/i
  const lm = home.match(linkRe)
  if (lm) {
    try { impUrl = new URL(lm[1], url).href } catch { impUrl = null }
  }
  const imp = (impUrl && (await fetchWithTimeout(impUrl))) || (await fetchWithTimeout(new URL('/impressum', url).href))

  const text = ((imp || '') + '\n' + home).slice(0, 400000)
  const emails = extractEmails(text)
  return {
    email: emails[0] || null,
    phone: extractPhone(text),
    address: extractAddress(text),
    company: extractCompany(home, new URL(url).hostname.replace(/^www\./, '')),
  }
}

export async function GET(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const gewerk = searchParams.get('gewerk') || 'dachdecker'
    const stadt = searchParams.get('stadt') || 'Hattingen'
    const limit = Math.min(parseInt(searchParams.get('limit') || '8', 10) || 8, 12)

    if (!TRADE_LABELS[gewerk]) {
      return NextResponse.json({ error: 'Unbekanntes Gewerk' }, { status: 400 })
    }

    const tradeLabel = TRADE_LABELS[gewerk]
    const urls = await ddgSearch(`${tradeLabel} ${stadt}`, limit)
    if (!urls.length) {
      return NextResponse.json({
        success: true, found: 0, inserted: 0, skipped: 0, contacts: [],
        warning: 'Suchmaschine hat nichts geliefert (Rate-Limit?). Bitte in 1–2 Minuten erneut versuchen.',
      })
    }

    // bereits bekannte Websites überspringen
    const { data: known } = await supabaseAdmin
      .from('marketing_contacts')
      .select('website')
      .eq('trade', gewerk)
      .eq('city', stadt)
    const knownSites = new Set((known || []).map((k: any) => (k.website || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')))

    const results: any[] = []
    let inserted = 0, skipped = 0

    // mit Konkurrenz 3 crawlen
    const queue = [...urls]
    const worker = async (): Promise<void> => {
      while (queue.length) {
        const url = queue.shift()!
        const norm = url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
        if (knownSites.has(norm)) { skipped++; continue }
        const data = await crawlSite(url)
        if (!data || (!data.email && !data.address)) { skipped++; continue }
        // Doppel-Schutz: gleiche E-Mail schon vorhanden?
        if (data.email) {
          const { data: dupe } = await supabaseAdmin
            .from('marketing_contacts')
            .select('id')
            .eq('email', data.email)
            .eq('trade', gewerk)
            .limit(1)
          if (dupe?.length) { skipped++; continue }
        }
        const { data: row, error } = await supabaseAdmin
          .from('marketing_contacts')
          .insert({
            company_name: data.company,
            trade: gewerk,
            city: stadt,
            email: data.email,
            website: url,
            phone: data.phone,
            address: data.address,
            source: 'Admin-Scraper',
            status: 'neu',
          })
          .select()
          .single()
        if (error) { skipped++; continue }
        inserted++
        knownSites.add(norm)
        results.push(row)
      }
    }
    await Promise.all([worker(), worker(), worker()])

    return NextResponse.json({ success: true, found: results.length + skipped, inserted, skipped, contacts: results })
  } catch (error: any) {
    console.error('Marketing scrape error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
