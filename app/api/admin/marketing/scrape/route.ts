import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/admin-auth'

export const maxDuration = 60

// ─── GET /api/admin/marketing/scrape/ ───────────────────────────
// ECHTER Server-Scraper, zwei Modi:
//  1) OSM (OpenStreetMap Overpass): Betriebe mit craft=*-Tag in der Stadt —
//     liefert oft Name + Telefon + E-Mail + LADUNGSFÄHIGE ADRESSE (ideal für Print).
//  2) enrich=1: Bestehende Kontakte ohne Adresse → Website + Impressum crawlen
//     und Adresse/E-Mail/Telefon nachpflegen.
// Nur öffentliche Geschäftsdaten (B2B). Daten: © OpenStreetMap-Mitwirkende (ODbL).
// Query: ?gewerk=dachdecker&stadt=Hattingen&enrich=1

const TRADE_LABELS: Record<string, string> = {
  dachdecker: 'Dachdecker',
  elektriker: 'Elektriker',
  klempner: 'Klempner',
  maler: 'Maler',
  zimmerer: 'Zimmerer',
  'garten-und-landschaftsbau': 'Garten- und Landschaftsbau',
}

// craft-Tags je Gewerk (OSM-Tagging)
const CRAFT_TAGS: Record<string, string> = {
  dachdecker: 'roofer',
  elektriker: 'electrician',
  klempner: 'plumber',
  maler: 'painter',
  zimmerer: 'carpenter',
  'garten-und-landschaftsbau': 'gardener',
}

// Verzeichnisse/Portale — beim Enrich-Crawl ignoreren
const BLOCKLIST = [
  'werkenntdenbesten', 'trustlocal', 'yelp', 'gelbeseiten', 'dasoertliche',
  'suchehandwerker', 'ziegelruf', '11880', 'golocal', 'kennstdueinen',
  'provenexpert', 'facebook', 'instagram', 'wikipedia', 'youtube',
  'google.', 'bing.', 'amazon', 'ebay', 'northdata', 'firmenwissen',
  'webwiki', 'dastelefonbuch', 'goyellow',
]

const UA = 'fachschmiede-admin-scraper/1.0 (contact: hello@fachschmiede.de)'
const FETCH_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

async function overpassQuery(query: string): Promise<any[] | null> {
  for (const ep of OVERPASS_ENDPOINTS) {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 14000)
      const res = await fetch(ep, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
      })
      clearTimeout(t)
      if (!res.ok) continue
      const data = await res.json()
      return data.elements || []
    } catch {
      continue // nächster Mirror
    }
  }
  return null
}

function osmAddr(t: Record<string, string>): string | null {
  const street = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ')
  const city = t['addr:city'] || t['addr:suburb'] || t['addr:place'] || ''
  const plz = t['addr:postcode'] || ''
  const parts = [street, [plz, city].filter(Boolean).join(' ')].filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

async function osmScrape(gewerk: string, stadt: string): Promise<{ rows: any[]; error?: string }> {
  const craft = CRAFT_TAGS[gewerk]
  if (!craft) return { rows: [], error: 'Unbekanntes Gewerk' }

  const query = `[out:json][timeout:35];area["name"="${stadt.replace(/"/g, '')}"]->.a;(node["craft"="${craft}"](area.a);way["craft"="${craft}"](area.a););out center 25;`
  const elements = await overpassQuery(query)
  if (!elements) {
    return { rows: [], error: 'Overpass (OSM) nicht erreichbar — bitte in 1–2 Minuten erneut versuchen.' }
  }

  const rows = elements
    .map((e: any) => {
      const t = e.tags || {}
      if (!t.name) return null
      return {
        company_name: String(t.name).slice(0, 120),
        trade: gewerk,
        city: stadt,
        email: t.email || t['contact:email'] || null,
        phone: t.phone || t['contact:phone'] || null,
        website: t.website || t['contact:website'] || t.url || null,
        address: osmAddr(t),
        source: 'OpenStreetMap (ODbL)',
      }
    })
    .filter(Boolean)
  return { rows }
}

// ── Enrich: Website + Impressum von bestehenden Kontakten crawlen ──
async function fetchWithTimeout(url: string, ms = 6000): Promise<string | null> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), ms)
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': FETCH_UA, 'Accept-Language': 'de-DE,de;q=0.9' },
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
  const streetRe = /((?:[A-ZÄÖÜ][\wÄÖÜäöüß.-]+\s+){1,3}(?:Straße|Strasse|Str\.|weg|Weg|gasse|Gasse|platz|Platz|ring|Ring|allee|Allee|damm|Damm|pfad|Pfad|steig|Steig|chaussee|Chaussee|markt|Markt)\s*\d+\s*(?:[-/]\s*\d+)?)/m
  const plzRe = /\b(\d{5})\s+([A-ZÄÖÜ][\wÄÖÜäöüß-]+(?:\s+[A-ZÄÖÜ][\wÄÖÜäöüß-]+)?)/
  const s = html.match(streetRe)
  const z = html.match(plzRe)
  if (s && z) return `${s[1].trim()}, ${z[1]} ${z[2]}`
  if (z) return `${z[1]} ${z[2]}`
  return null
}

async function enrichContacts(gewerk: string, stadt: string): Promise<{ enriched: number; failed: number }> {
  const { data: targets } = await supabaseAdmin
    .from('marketing_contacts')
    .select('id, website, email')
    .eq('trade', gewerk)
    .eq('city', stadt)
    .is('address', null)
    .not('website', 'is', null)
    .limit(6)

  const list = (targets || []).filter((c: any) => !BLOCKLIST.some(b => (c.website || '').includes(b)))
  if (!list.length) return { enriched: 0, failed: 0 }

  let enriched = 0
  let failed = 0
  const queue = [...list]
  const worker = async (): Promise<void> => {
    while (queue.length) {
      const c = queue.shift()!
      try {
        const home = await fetchWithTimeout(c.website, 5000)
        if (!home) { failed++; continue }
        let imp: string | null = null
        const lm = home.match(/href="([^"]*impressum[^"]*)"/i)
        if (lm) {
          try { imp = await fetchWithTimeout(new URL(lm[1], c.website).href) } catch { imp = null }
        }
        if (!imp) imp = await fetchWithTimeout(new URL('/impressum', c.website).href)
        const text = ((imp || '') + '\n' + home).slice(0, 300000)

        const patch: any = {}
        const addr = extractAddress(text)
        if (addr) patch.address = addr
        if (!c.email) {
          const em = extractEmails(text)
          if (em[0]) patch.email = em[0]
        }
        if (!patch.address && !patch.email) { failed++; continue }
        if (!patch.email) {
          const ph = extractPhone(text)
          if (ph) patch.phone = ph
        }
        const { error } = await supabaseAdmin.from('marketing_contacts').update(patch).eq('id', c.id)
        if (!error) enriched++
        else failed++
      } catch {
        failed++
      }
    }
  }
  await Promise.all([worker(), worker(), worker()])
  return { enriched, failed }
}

export async function GET(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const gewerk = searchParams.get('gewerk') || 'dachdecker'
    const stadt = searchParams.get('stadt') || 'Hattingen'
    const doEnrich = searchParams.get('enrich') === '1'

    if (!TRADE_LABELS[gewerk]) {
      return NextResponse.json({ error: 'Unbekanntes Gewerk' }, { status: 400 })
    }

    // ── 1) OSM-Scrape ──
    const osm = await osmScrape(gewerk, stadt)
    let inserted = 0
    let skipped = 0
    const contacts: any[] = []
    for (const row of osm.rows) {
      // Dedupe: gleiche E-Mail ODER gleiche Firma+Stadt schon vorhanden?
      if (row.email) {
        const { data: dupe } = await supabaseAdmin
          .from('marketing_contacts')
          .select('id')
          .eq('email', row.email)
          .eq('trade', gewerk)
          .limit(1)
        if (dupe?.length) { skipped++; continue }
      }
      const { data: dupe2 } = await supabaseAdmin
        .from('marketing_contacts')
        .select('id')
        .eq('company_name', row.company_name)
        .eq('city', stadt)
        .eq('trade', gewerk)
        .limit(1)
      if (dupe2?.length) { skipped++; continue }

      const { data: newRow, error } = await supabaseAdmin
        .from('marketing_contacts')
        .insert({ ...row, status: 'neu' })
        .select()
        .single()
      if (error) { skipped++; continue }
      inserted++
      contacts.push(newRow)
    }

    // ── 2) Enrich (Adressen nachpflegen) — nur wenn Budget übrig (Vercel 60s) ──
    let enrichResult = { enriched: 0, failed: 0 }
    if (doEnrich) {
      enrichResult = await enrichContacts(gewerk, stadt)
    }

    return NextResponse.json({
      success: true,
      source: 'OpenStreetMap (© OSM-Mitwirkende, ODbL)',
      found: osm.rows.length,
      inserted,
      skipped,
      enrich: doEnrich ? enrichResult : undefined,
      warning: osm.error || (osm.rows.length === 0
        ? 'OSM hat für diese Kombination nichts geliefert (Abdeckung ist lückenhaft). Mit "Adressen nachpflegen" bestehende Kontakte anreichern.'
        : undefined),
      contacts,
    })
  } catch (error: any) {
    console.error('Marketing scrape error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
