// cleanup-spandau.js — Entfernt die Berlin-Spandau-Seiten (6 Gewerke) komplett,
// damit sie mit dem gefixten Engine (kein Witten-Residue) neu generiert werden.
// Idempotent + Zähl-Assertions.
const fs = require('fs')
const path = require('path')
const ROOT = '/root/.openclaw/workspace/fachschmiede'
const CITY = { slug: 'berlin-spandau', name: 'Spandau (Berlin)', name_short: 'Spandau' }
const TRADE_KEYS = {
  'garten-und-landschaftsbau': 'garten', 'zimmerer': 'zimm', 'maler': 'maler',
  'dachdecker': 'dach', 'elektriker': 'elek', 'klempner': 'klempner',
}
const stats = {}

// 1) stadt-*.html
for (const key of Object.values(TRADE_KEYS)) {
  const fp = path.join(ROOT, 'public', `stadt-${key}-${CITY.slug}.html`)
  if (fs.existsSync(fp)) { fs.unlinkSync(fp); stats['stadt'] = (stats['stadt'] || 0) + 1 }
}
// 2) blog-Dateien
const BLOG_DIRS = { dach: 'dachdecker', elek: 'elektriker', klempner: 'klempner', maler: 'maler', zimm: 'zimmerer', garten: 'garten-und-landschaftsbau' }
stats['blog'] = 0
for (const dir of Object.values(BLOG_DIRS)) {
  const d = path.join(ROOT, 'public', 'blog', dir, CITY.slug)
  if (fs.existsSync(d)) {
    for (const f of fs.readdirSync(d)) { fs.unlinkSync(path.join(d, f)); stats['blog']++ }
    fs.rmdirSync(d)
  }
}
// 3) salespages: CITY_SLUGS + Karten + Zähler
const SALES = ['sales-dachdecker.html', 'sales-elektriker.html', 'sales-klempner.html', 'sales-maler.html', 'sales-zimmerer.html', 'sales-garten-und-landschaftsbau.html']
stats['salesEntries'] = 0; stats['cards'] = 0
for (const file of SALES) {
  const fp = path.join(ROOT, 'public', file)
  let t = fs.readFileSync(fp, 'utf-8')
  for (const v of [CITY.name, CITY.name_short]) {
    const slugEntry = `'${v}':'${CITY.slug}',`
    if (t.split(slugEntry).length - 1 === 1) { t = t.split(slugEntry).join(''); stats['salesEntries']++ }
  }
  // Karte entfernen (data-city="slug …" … bis schließendes </div> per Balance)
  // Format: data-city="{slug} {keywords}" — Needle endet NACH dem slug, ohne Anführungszeichen!
  let idx = t.indexOf(`data-city="${CITY.slug} `)
  while (idx !== -1) {
    const cardStart = t.lastIndexOf('<div', idx)
    let depth = 0, pos = cardStart
    while (pos < t.length) {
      const no = t.indexOf('<div', pos), nc = t.indexOf('</div>', pos)
      if (nc === -1) throw new Error('div-Balance fehlgeschlagen')
      if (no !== -1 && no < nc) { depth++; pos = no + 4 } else { depth--; pos = nc + 6; if (depth === 0) break }
    }
    t = t.slice(0, cardStart) + t.slice(pos)
    stats['cards']++
    idx = t.indexOf(`data-city="${CITY.slug} `)
  }
  fs.writeFileSync(fp, t)
}
// 4) system-config.js
{
  const fp = path.join(ROOT, 'config', 'system-config.js')
  let t = fs.readFileSync(fp, 'utf-8')
  for (const v of [CITY.name, CITY.name_short]) {
    const re = new RegExp(`'[^']*':\\s*\\{[^}]*name:\\s*'${v.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}'[^}]*\\},?\\n?`, 'g') // ganzer Eintrag inkl. Key
    const before = t
    t = t.replace(re, '')
    if (t !== before) { stats['config'] = 1; break }
  }
  fs.writeFileSync(fp, t)
}
// 5) article-index.json
{
  const fp = path.join(ROOT, 'lib', 'article-index.json')
  const ix = JSON.parse(fs.readFileSync(fp, 'utf-8'))
  let changed = false
  for (const dir of Object.values(BLOG_DIRS)) {
    if (ix[dir] && ix[dir][CITY.slug]) { delete ix[dir][CITY.slug]; changed = true }
  }
  if (changed) { fs.writeFileSync(fp, JSON.stringify(ix, null, 2) + '\n'); stats['articles'] = 1 }
}
// 6) sitemap.xml
{
  const fp = path.join(ROOT, 'public', 'sitemap.xml')
  let lines = fs.readFileSync(fp, 'utf-8').split('\n')
  const before = lines.length
  lines = lines.filter(l => !l.includes(`/${CITY.slug}/`) && !l.includes(`-${CITY.slug}.html`) && !l.includes(`/${CITY.slug}"`))
  fs.writeFileSync(fp, lines.join('\n'))
  stats['sitemap'] = before - lines.length
}
console.log(JSON.stringify(stats))
// Assertions
const salesCheck = fs.readFileSync(path.join(ROOT, 'public', 'sales-maler.html'), 'utf-8')
console.log('sales-maler berlin-spandau Reste:', (salesCheck.match(/berlin-spandau/g) || []).length)
