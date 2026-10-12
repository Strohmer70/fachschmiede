#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 * FACHSCHMIEDE OUTREACH LEAD-SCRAPER
 * Findet Handwerksbetriebe (Zielgruppe: zukünftige Mieter unserer
 * Landingpages) via DuckDuckGo + Impressum-Crawler.
 *
 * OUTPUT: scripts/outreach/leads-<gewerk>-<stadt>.json + gesamt-CSV
 *
 * VERWENDUNG:
 *   node scripts/outreach/scrape-leads.js "dachdecker" "bochum"
 *   node scripts/outreach/scrape-leads.js --batch              # alle Kombis
 *   node scripts/outreach/scrape-leads.js --batch --limit 3    # erst 3 je Kombi
 *
 * RECHTLICH: Nur öffentliche Firmendaten (Impressumspflicht DE).
 * Keine Personendaten. B2B-Kontakt.
 * ═══════════════════════════════════════════════════════════════
 */
const fs = require('fs')
const path = require('path')

// ── KONFIG ────────────────────────────────────────────────────
const DELAY_MIN_MS = 2500          // Rate-Limit-Schutz DDG
const DELAY_MAX_MS = 4500
const IMPRESSUM_TIMEOUT_MS = 8000
const MAX_SITES_PER_SEARCH = 6     // Nur echte Firmen, nicht Verzeichnisse
const OUTPUT_DIR = path.join(__dirname)

const VERZEICHNISSE = [
  'werkenntdenbesten', 'trustlocal', 'yelp', 'gelbeseiten', 'dasoertliche',
  'google.', 'facebook', 'instagram', 'linkedin', 'youtube', 'wikipedia',
  '11880', 'goyellow', 'branchenbuch', 'herold', 'misterwhat', 'cylex',
  'localsearch', 'moneyhouse', 'firmenwissen', 'northdata', 'indeed',
  'kununu', 'glassdoor', 'hwk', 'ihk', 'handwerkskammer', 'bochum.de',
  'stadt-', '.gov', '118.com', 'gellert', 'web.de', 'gmx.', 'wordpress.com',
  'wixsite', 'jimdo', 'jimdosite', 'googleapis', 'bing.com', 'duckduckgo'
]

const GEWERKE = {
  dachdecker: 'Dachdecker',
  elektriker: 'Elektriker',
  klempner: 'Klempner|SHK|Heizung Sanitär',
  maler: 'Maler|Malermeister',
  zimmerer: 'Zimmermann|Zimmerer|Holzbau',
  'garten-und-landschaftsbau': 'Gartenbau|Garten und Landschaftsbau|Galabau'
}

// ── UTILS ─────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms))
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
]
const ua = () => UA_POOL[rand(0, UA_POOL.length - 1)]

function decodeDuckUrl(duckUrl) {
  // //duckduckgo.com/l/?uddg=<urlencoded>&rut=...
  const m = duckUrl.match(/uddg=([^&]+)/)
  if (!m) return null
  try { return decodeURIComponent(m[1]) } catch { return null }
}

function isVerzeichnis(url) {
  const u = url.toLowerCase()
  return VERZEICHNISSE.some(v => u.includes(v))
}

function extractEmails(html) {
  const found = new Set()
  // mailto: Links (häufigste Impressum-Form)
  for (const m of html.matchAll(/mailto:([^"'\s>?]+)/gi)) {
    const e = decodeURIComponent(m[1]).split('?')[0].toLowerCase().trim()
    if (/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(e) && !e.includes('sentry') && !e.includes('example.com')) found.add(e)
  }
  // Plain-Text E-Mails
  for (const m of html.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g)) {
    const e = m[0].toLowerCase()
    if (!e.includes('sentry') && !e.includes('example.com') && !e.includes('wixpress') && e.length < 60) found.add(e)
  }
  return [...found]
}

function extractPhones(html) {
  const found = new Set()
  for (const m of html.matchAll(/tel:([^"'\s>]+)/gi)) {
    const p = decodeURIComponent(m[1]).replace(/[^+\d]/g, '')
    if (p.length >= 6 && p.length <= 16) found.add(p)
  }
  for (const m of html.matchAll(/(\+49[\s\d]{8,}|0[1-9][\d\s\-/]{7,})/g)) {
    const p = m[1].replace(/[^\d+]/g, '')
    if (p.length >= 10 && p.length <= 16) found.add(p)
  }
  return [...found]
}

function extractFirmenname(html, url) {
  // 1. og:site_name
  const og = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i)
  if (og) return og[1].trim()
  // 2. Schema.org LocalBusiness
  const ld = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/i)
  if (ld) {
    try {
      const data = JSON.parse(ld[1])
      const biz = Array.isArray(data) ? data[0] : data
      if (biz && biz.name && /business|company|organization/i.test(JSON.stringify(biz['@type'] || ''))) return biz.name.trim()
    } catch { /* ignore */ }
  }
  // 3. <title> bis zum ersten Trenner
  const t = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (t) {
    return t[1].split(/[|\-–·»]/)[0].trim().slice(0, 80)
  }
  // 4. Domain-Fallback
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

// ── SCRAPER ───────────────────────────────────────────────────
async function ddgSearch(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: {
      'User-Agent': ua(),
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'de-DE,de;q=0.9'
    },
    signal: AbortSignal.timeout(15000)
  })
  if (!res.ok) throw new Error(`DDG HTTP ${res.status}`)
  const html = await res.text()

  const urls = []
  for (const m of html.matchAll(/class="result__a"[^>]*href="([^"]+)"/g)) {
    const real = decodeDuckUrl(m[1])
    if (real && !isVerzeichnis(real) && !urls.includes(real)) urls.push(real)
  }
  return urls.slice(0, MAX_SITES_PER_SEARCH + 6) // Puffer für Verzeichnis-Treffer
}

async function crawlImpressum(siteUrl) {
  const base = new URL(siteUrl).origin
  const paths = ['/impressum', '/impressum.html', '/Impressum', '/kontakt', '/kontakt.html', '/contact']
  let homepage = ''
  try {
    const homeRes = await fetch(siteUrl, { headers: { 'User-Agent': ua() }, signal: AbortSignal.timeout(IMPRESSUM_TIMEOUT_MS) })
    if (homeRes.ok) homepage = await homeRes.text()
  } catch { return null }

  // E-Mail/Telefon schon auf der Startseite? (Header/Footer)
  let emails = extractEmails(homepage)
  let phones = extractPhones(homepage)
  let impressumHtml = ''

  if (emails.length === 0 || phones.length === 0) {
    for (const p of paths) {
      try {
        const r = await fetch(base + p, { headers: { 'User-Agent': ua() }, signal: AbortSignal.timeout(IMPRESSUM_TIMEOUT_MS) })
        if (!r.ok) continue
        const html = await r.text()
        if (html.length < 300) continue
        impressumHtml = html
        const e = extractEmails(html)
        const t = extractPhones(html)
        if (e.length > emails.length) emails = e
        if (t.length > phones.length) phones = t
        if (emails.length > 0 && phones.length > 0) break
      } catch { continue }
    }
  }

  if (emails.length === 0) return null // Kein Kontakt gefunden → Skip

  const firma = extractFirmenname(homepage || impressumHtml, siteUrl)
  return {
    firma,
    website: siteUrl,
    emails,
    phones: phones.slice(0, 3),
    scraped_at: new Date().toISOString()
  }
}

// ── HAUPT-FLOW ────────────────────────────────────────────────
async function scrapeKombi(tradeSlug, cityName, limit) {
  const queryTerms = GEWERKE[tradeSlug] || tradeSlug
  console.log(`\n🔍 ${tradeSlug.toUpperCase()} × ${cityName}`)
  console.log(`   Query: "${queryTerms} ${cityName}"`)

  let urls
  try {
    urls = await ddgSearch(`${queryTerms} ${cityName}`)
  } catch (e) {
    console.log(`   ⚠️ Suche fehlgeschlagen: ${e.message}`)
    return []
  }
  const firmen = urls.filter(u => !isVerzeichnis(u)).slice(0, limit || MAX_SITES_PER_SEARCH)
  console.log(`   ${firmen.length} Firmen-Websites gefunden`)

  const leads = []
  for (const url of firmen) {
    await sleep(rand(DELAY_MIN_MS, DELAY_MAX_MS))
    try {
      const lead = await crawlImpressum(url)
      if (lead) {
        leads.push({ ...lead, gewerk: tradeSlug, stadt: cityName })
        console.log(`   ✅ ${lead.firma} → ${lead.emails[0]}`)
      } else {
        console.log(`   ⏭️  ${new URL(url).hostname} — keine E-Mail gefunden`)
      }
    } catch (e) {
      console.log(`   ⏭️  ${new URL(url).hostname} — ${e.message.slice(0, 50)}`)
    }
  }
  return leads
}

async function main() {
  const args = process.argv.slice(2)
  const batchMode = args.includes('--batch')
  const limitIdx = args.indexOf('--limit')
  const limit = limitIdx > -1 ? parseInt(args[limitIdx + 1]) : null

  let kombis = []
  if (batchMode) {
    const cfg = require('../../config/system-config.js')
    const cities = cfg.getCitySlugs().filter(c => c !== 'berlin-spandau') // Fokus Ruhrgebiet erstmal
    const trades = Object.keys(GEWERKE)
    for (const t of trades) for (const c of cities) kombis.push([t, cfg.getCity(c)?.name || c])
    console.log(`📋 Batch-Modus: ${kombis.length} Kombis`)
  } else {
    const [trade, city] = args
    if (!trade || !city) {
      console.log('Usage: node scrape-leads.js <gewerk> <stadt> [--limit N] | --batch')
      process.exit(1)
    }
    kombis = [[trade, city]]
  }

  const allLeads = []
  const seen = new Set()

  for (const [trade, city] of kombis) {
    const leads = await scrapeKombi(trade, city, limit)
    for (const l of leads) {
      const key = l.emails[0]
      if (!seen.has(key)) {
        seen.add(key)
        allLeads.push(l)
      }
    }
    // Zwischen-Speichern je Kombi (Resume-fähig)
    if (leads.length > 0) {
      const file = path.join(OUTPUT_DIR, `leads-${trade}-${city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`)
      fs.writeFileSync(file, JSON.stringify(leads, null, 2))
    }
    await sleep(rand(1500, 3000)) // zwischen Kombis
  }

  // Gesamt-CSV
  const csv = ['firma;gewerk;stadt;email;website;telefon;scraped_at']
  for (const l of allLeads) {
    csv.push(`"${l.firma.replace(/"/g, '""')}";${l.gewerk};${l.stadt};${l.emails[0]};${l.website};"${(l.phones[0] || '').replace(/"/g, '""')}";${l.scraped_at}`)
  }
  const csvFile = path.join(OUTPUT_DIR, `leads-gesamt-${Date.now()}.csv`)
  fs.writeFileSync(csvFile, csv.join('\n'), 'latin1')

  console.log(`\n🏁 FERTIG: ${allLeads.length} Leads`)
  console.log(`📄 CSV: ${csvFile}`)
}

main().catch(e => { console.error('💥 Fatal:', e.message); process.exit(1) })
