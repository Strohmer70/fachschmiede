import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/admin-auth'

export const maxDuration = 60

// ─── GET /api/admin/marketing/scrape/ ───────────────────────────
// Scraping-Engine mit QUALITÄTS-Garantie:
//  1) Google Places API (NEW) — wenn GOOGLE_PLACES_API_KEY gesetzt. ECHTE
//     Gewerbedaten: Firmenname, Adresse, Telefon, Website, Bewertung.
//  2) OSM Overpass — kostenloser Fallback mit HARTEN Validatoren:
//     nur Einträge mit Straßenadresse UND (Telefon ODER Website),
//     SEO-/Portal-Namen werden verworfen.
// Beide Engines: Dedupe (E-Mail/Firma+Stadt), Portal-Blocklist, Insert status='neu'.
// ?enrich=1 = zusätzlich Websites bestehender Kontakte crawlen (Adressen nachpflegen).
// Query: ?gewerk=dachdecker&stadt=Hattingen&enrich=1

const TRADE_LABELS: Record<string, string> = {
  dachdecker: 'Dachdecker',
  elektriker: 'Elektriker',
  klempner: 'Klempner',
  maler: 'Maler',
  zimmerer: 'Zimmerer',
  'garten-und-landschaftsbau': 'Garten- und Landschaftsbau',
}

const CRAFT_TAGS: Record<string, string> = {
  dachdecker: 'roofer',
  elektriker: 'electrician',
  klempner: 'plumber',
  maler: 'painter',
  zimmerer: 'carpenter',
  'garten-und-landschaftsbau': 'gardener',
}

// Eindeutige Portale/Verzeichnisse/Agenturen — NIEMALS als Lead speichern
const PORTAL_DOMAINS = [
  'suchehandwerker', '123media', 'dachdecker-betriebe', 'elektriker.org',
  'gartenbau.org', 'galabau-gruppe', 'wmf-goe', 'promonexus', 'dasoertliche',
  'gelbeseiten', 'werkenntdenbesten', '11880', 'provenexpert', 'yelp',
  'golocal', 'kennstdueinen', 'dastelefonbuch', 'goyellow', 'trustlocal',
  'my-hammer', 'instapro', 'aroundhome', 'blauarbeit', 'houzz', 'homify',
  'bing.com', 'google.', 'facebook', 'instagram', 'wikipedia', 'youtube',
  'amazon', 'ebay', 'northdata', 'firmenwissen', 'webwiki',
]

// SEO-/Verzeichnis-Namen — verworfen egal was die Engine sagt
const BAD_NAME_PATTERNS = [
  /über\s+\d+\s+top/i,
  /»/,
  /^top\s+/i,
  /^(dachdecker|elektriker|klempner|maler|zimmerer|gartenbau|galabau|shk|hausmeisterservice)\s+(in|für|bei|near)\b/i,
  /^my site\b/i,
  /demo/i,
  /fachbetrieb/i,
  /24\s*\/\s*7/i,          // '24/7 Notdienst' = SEO-Spam-Signatur
  /einkauf/i,                       // Einkaufsverbände (keine Endkunden-Betriebe)
  /fachmarkt/i,                     // Baumarkt-/Fachmarkt-Ketten
  /verbund|genossenschaft|einkaufsverband/i,
]

const BAD_EMAIL_PATTERNS = [/^ihre@email/i, /example\.(com|de)/i, /@(wixpress|wordpress)\./i, /^test@/i]

// ── Qualitäts-Validator (gilt für BEIDE Engines) ──
function looksLikeJunk(row: { company_name: string; email?: string | null; website?: string | null }): string | null {
  const name = (row.company_name || '').trim()
  if (!name || name.length < 3) return 'Name zu kurz/leer'
  if (BAD_NAME_PATTERNS.some((r) => r.test(name))) return 'SEO-/Verzeichnis-Name'
  const dom = ((row.email || '') + ' ' + (row.website || '')).toLowerCase()
  if (PORTAL_DOMAINS.some((d) => dom.includes(d))) return 'Portal-/Agentur-Domain'
  if (row.email && BAD_EMAIL_PATTERNS.some((r) => r.test(row.email!))) return 'Platzhalter-E-Mail'
  return null
}

// ── Settings: API-Keys serverseitig aus Supabase (privat, service_role only) ──
async function getSetting(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single()
    if (error || !data) return null
    return String(data.value)
  } catch {
    return null
  }
}

// ── Google Places (New) ──
async function placesScrape(gewerk: string, stadt: string, apiKey: string): Promise<{ rows: any[]; error?: string }> {
  const label = TRADE_LABELS[gewerk] || gewerk
  const query = `${label} in ${stadt}`
  const fieldMask =
    'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.businessStatus'
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify({ textQuery: query, languageCode: 'de', regionCode: 'DE', pageSize: 20 }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return { rows: [], error: `Google Places HTTP ${res.status}: ${errText.slice(0, 160)}` }
    }
    const data = await res.json()
    const rows = ((data.places || []) as any[])
      .filter((p) => p.businessStatus !== 'CLOSED_PERMANENTLY' && p.businessStatus !== 'CLOSED_TEMPORARILY')
      .map((p) => ({
        company_name: String(p.displayName?.text || '').slice(0, 120),
        trade: gewerk,
        city: stadt,
        email: null, // Places liefert keine E-Mails — Enrich-Modus pflegt sie nach
        phone: p.nationalPhoneNumber || null,
        website: p.websiteUri || null,
        address: p.formattedAddress || null,
        source: 'Google Places',
      }))
      .filter(Boolean)
    return { rows }
  } catch (e: any) {
    return { rows: [], error: 'Google Places Fehler: ' + e.message }
  }
}

// ── OSM Overpass (Fallback) ──
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
      continue
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
    // HARTE OSM-Regel: nur mit Straßenadresse UND (Telefon ODER Website)
    .filter((r: any) => r && r.address && (r.phone || r.website))
  return { rows }
}

// ── Enrich: Website + Impressum bestehender Kontakte crawlen ──
async function fetchWithTimeout(url: string, ms = 5000): Promise<string | null> {
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
    if (PORTAL_DOMAINS.some((b) => e.includes(b))) continue
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
  const list = (targets || []).filter((c: any) => !PORTAL_DOMAINS.some((b) => (c.website || '').includes(b)))
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

    // ── Engine wählen ──
    const placesKey = process.env.GOOGLE_PLACES_API_KEY || (await getSetting('GOOGLE_PLACES_API_KEY'))
    let engineResult: { rows: any[]; error?: string }
    let engineName: string
    if (placesKey) {
      engineResult = await placesScrape(gewerk, stadt, placesKey)
      engineName = 'Google Places'
    } else {
      engineResult = await osmScrape(gewerk, stadt)
      engineName = 'OpenStreetMap'
    }

    // ── Validieren + Insert mit Dedupe ──
    let inserted = 0
    let skipped = 0
    let rejected = 0
    const contacts: any[] = []
    for (const row of engineResult.rows) {
      const junkReason = looksLikeJunk(row)
      if (junkReason) { rejected++; continue }
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
      if (error) { console.error('INSERT-Fehler:', error.message, JSON.stringify(row).slice(0, 120)); skipped++; continue }
      inserted++
      contacts.push(newRow)
    }

    // ── Enrich ──
    let enrichResult = { enriched: 0, failed: 0 }
    if (doEnrich) {
      enrichResult = await enrichContacts(gewerk, stadt)
    }

    return NextResponse.json({
      success: true,
      engine: engineName,
      source: engineName === 'Google Places' ? 'Google Places API' : 'OpenStreetMap (© OSM-Mitwirkende, ODbL)',
      needsGoogleKey: !placesKey,
      found: engineResult.rows.length,
      inserted,
      skipped,
      rejected, // vom Qualitäts-Validator verworfen
      enrich: doEnrich ? enrichResult : undefined,
      warning: engineResult.error || (inserted === 0 && rejected === 0
        ? engineName === 'OpenStreetMap'
          ? 'OSM lieferte nichts. Für echte Gewerbedaten: GOOGLE_PLACES_API_KEY in Vercel-Env hinterlegen.'
          : 'Keine Treffer.'
        : undefined),
      contacts,
    })
  } catch (error: any) {
    console.error('Marketing scrape error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
