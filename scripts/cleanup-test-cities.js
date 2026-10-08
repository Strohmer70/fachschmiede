// cleanup-test-cities.js — Entfernt die 3 E2E-Test-Städte (Halver, Herdecke, Hörde)
// und stellt den Produktionsstand 120 Seiten (20 Städte × 6 Gewerke) wieder her.
// Idempotent + mit Zähl-Assertions (Hausregel).
const fs = require('fs')
const path = require('path')

const ROOT = '/root/.openclaw/workspace/fachschmiede'
const TEST_CITIES = [
  { slug: 'halver', name: 'Halver', name_short: 'Halver' },
  { slug: 'herdecke', name: 'Herdecke', name_short: 'Herdecke' },
  { slug: 'dortmund-hoerde', name: 'Hörde (Dortmund)', name_short: 'Hörde' },
]
const TRADE_KEYS = { dachdecker: 'dach', elektriker: 'elek', klempner: 'klempner', maler: 'maler', zimmerer: 'zimm', 'garten-und-landschaftsbau': 'garten' }
const SALES = ['sales-dachdecker.html', 'sales-elektriker.html', 'sales-klempner.html', 'sales-maler.html', 'sales-zimmerer.html', 'sales-garten-und-landschaftsbau.html']

let removed = { stadt: 0, blog: 0, salesEntries: 0, cards: 0, config: 0, articles: 0 }

// ── 1) Stadt-Dateien + Blog-Verzeichnisse ──
for (const c of TEST_CITIES) {
  for (const [trade, key] of Object.entries(TRADE_KEYS)) {
    const f = path.join(ROOT, 'public', `stadt-${key}-${c.slug}.html`)
    if (fs.existsSync(f)) { fs.unlinkSync(f); removed.stadt++ }
    const dir = path.join(ROOT, 'public', 'blog', trade, c.slug)
    if (fs.existsSync(dir)) {
      const n = fs.readdirSync(dir).filter(x => x.endsWith('.html')).length
      fs.rmSync(dir, { recursive: true, force: true })
      removed.blog += n
    }
  }
}

// ── 2) Salespages: CITY_SLUGS-Eintrag + City-Card + Zähler ──
function extractBalancedDiv(html, startIdx) {
  // startIdx = Index des öffnenden <div — liefert Index NACH dem schließenden </div>
  let depth = 0, pos = startIdx
  while (pos < html.length) {
    const no = html.indexOf('<div', pos), nc = html.indexOf('</div>', pos)
    if (nc === -1) throw new Error('div nicht geschlossen')
    if (no !== -1 && no < nc) { depth++; pos = no + 4 } else { depth--; pos = nc + 6; if (depth === 0) return pos } }
  throw new Error('div-Balance fehlgeschlagen')
}

for (const file of SALES) {
  const fp = path.join(ROOT, 'public', file)
  let t = fs.readFileSync(fp, 'utf-8')
  for (const c of TEST_CITIES) {
    // CITY_SLUGS-Eintrag — zwei Varianten: voller Anzeigename (Städte) oder name_short (Stadtteile)
    const variants = [c.name, c.name_short].filter(Boolean)
    let found = false
    for (const v of variants) {
      const esc = v.replace(/'/g, "\\'")
      const slugEntry = `'${esc}':'${c.slug}',`
      const n1 = t.split(slugEntry).length - 1
      if (n1 === 1) { t = t.split(slugEntry).join(''); removed.salesEntries++; found = true; break }
      if (n1 > 1) throw new Error(`${file}: CITY_SLUGS-Eintrag ${c.slug} ${n1}× gefunden!`)
    }
    // City-Card (div mit data-city="slug ")
    const marker = `data-city="${c.slug} `
    let mi = t.indexOf(marker)
    while (mi !== -1) {
      const divStart = t.lastIndexOf('<div', mi)
      const end = extractBalancedDiv(t, divStart)
      t = t.slice(0, divStart) + t.slice(end).replace(/^\s*\n/, '\n      ')
      removed.cards++
      mi = t.indexOf(marker)
    }
  }
  // Zähler neu setzen
  const cardCount = (t.match(/class="city-card /g) || []).length
  t = t.replace(/(\d+) von (\d+) Städten frei/, `${cardCount} von ${cardCount} Städten frei`)
  fs.writeFileSync(fp, t)
}

// ── 3) system-config.js: CITIES-Einträge ──
{
  const fp = path.join(ROOT, 'config', 'system-config.js')
  let t = fs.readFileSync(fp, 'utf-8')
  for (const c of TEST_CITIES) {
    const re = new RegExp(`^.*'${c.slug}': \\{ name:.*\\},\\n`, 'm')
    if (re.test(t)) { t = t.replace(re, ''); removed.config++ }
  }
  fs.writeFileSync(fp, t)
}

// ── 4) article-index.json: Stadt-Einträge je Gewerk ──
{
  const fp = path.join(ROOT, 'lib', 'article-index.json')
  const d = JSON.parse(fs.readFileSync(fp, 'utf-8'))
  for (const trade of Object.keys(d)) {
    for (const c of TEST_CITIES) {
      if (d[trade] && d[trade][c.slug]) { delete d[trade][c.slug]; removed.articles++ }
    }
  }
  fs.writeFileSync(fp, JSON.stringify(d, null, 1))
}

// ── 5) Sitemap: komplette Zeilen (mit <priority>/<changefreq>) der Test-Städte ──
let smRemoved = 0
{
  const fp = path.join(ROOT, 'public', 'sitemap.xml')
  const lines = fs.readFileSync(fp, 'utf-8').split('\n')
  const kept = lines.filter(l => {
    if (!l.includes('</url>')) return true
    const isTest = TEST_CITIES.some(c => l.includes(c.slug))
    if (isTest) smRemoved++
    return !isTest
  })
  fs.writeFileSync(fp, kept.join('\n'))
}

console.log(JSON.stringify({ ...removed, sitemapStadtGetroffen: smRemoved }, null, 1))
