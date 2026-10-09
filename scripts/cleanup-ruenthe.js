// cleanup-ruenthe.js — E2E-Test-Ordnung: Custom-Ort 'ruenthe' (1 Gewerk) entfernen.
// Stellt Stand 120 Seiten (20 Städte × 6 Gewerke) wieder her. Idempotent + Assertions.
const fs = require('fs')
const path = require('path')

const ROOT = '/root/.openclaw/workspace/fachschmiede'
const C = { slug: 'ruenthe', name: 'Rünthe', name_short: 'Rünthe' }
const removed = { stadt: 0, blog: 0, salesEntries: 0, cards: 0, config: 0, articles: 0, sitemap: 0 }

// ── 1) Dateien ──
const stadtF = path.join(ROOT, 'public', `stadt-dach-${C.slug}.html`)
if (fs.existsSync(stadtF)) { fs.unlinkSync(stadtF); removed.stadt++ }
const blogDir = path.join(ROOT, 'public', 'blog', 'dachdecker', C.slug)
if (fs.existsSync(blogDir)) {
  const n = fs.readdirSync(blogDir).filter(x => x.endsWith('.html')).length
  fs.rmSync(blogDir, { recursive: true, force: true })
  removed.blog += n
}

// ── 2) sales-dachdecker.html ──
function extractBalancedDiv(html, startIdx) {
  let depth = 0, pos = startIdx
  while (pos < html.length) {
    const no = html.indexOf('<div', pos), nc = html.indexOf('</div>', pos)
    if (nc === -1) throw new Error('div nicht geschlossen')
    if (no !== -1 && no < nc) { depth++; pos = no + 4 } else { depth--; pos = nc + 6; if (depth === 0) return pos } }
  throw new Error('div-Balance fehlgeschlagen')
}
{
  const fp = path.join(ROOT, 'public', 'sales-dachdecker.html')
  let t = fs.readFileSync(fp, 'utf-8')
  const slugEntry = `'${C.name}':'${C.slug}',`
  const n1 = t.split(slugEntry).length - 1
  if (n1 === 1) { t = t.split(slugEntry).join(''); removed.salesEntries++ }
  else if (n1 > 1) throw new Error(`sales: CITY_SLUGS ${n1}×!`)
  const marker = `data-city="${C.slug} `
  let mi = t.indexOf(marker)
  while (mi !== -1) {
    const divStart = t.lastIndexOf('<div', mi)
    const end = extractBalancedDiv(t, divStart)
    t = t.slice(0, divStart) + t.slice(end).replace(/^\s*\n/, '\n      ')
    removed.cards++
    mi = t.indexOf(marker)
  }
  const cardCount = (t.match(/class="city-card /g) || []).length
  t = t.replace(/(\d+) von (\d+) Städten frei/, `${cardCount} von ${cardCount} Städten frei`)
  fs.writeFileSync(fp, t)
  console.log(`sales-dachdecker: ${cardCount} Karten, Zähler "${cardCount} von ${cardCount}"`)
}

// ── 3) system-config.js ──
{
  const fp = path.join(ROOT, 'config', 'system-config.js')
  let t = fs.readFileSync(fp, 'utf-8')
  const re = new RegExp(`^.*'${C.slug}': \\{ name:.*\\},\\n`, 'm')
  if (re.test(t)) { t = t.replace(re, ''); removed.config++ }
  fs.writeFileSync(fp, t)
}

// ── 4) article-index.json ──
{
  const fp = path.join(ROOT, 'lib', 'article-index.json')
  const d = JSON.parse(fs.readFileSync(fp, 'utf-8'))
  if (d['dachdecker'] && d['dachdecker'][C.slug]) { delete d['dachdecker'][C.slug]; removed.articles++ }
  fs.writeFileSync(fp, JSON.stringify(d, null, 1))
}

// ── 5) Sitemap ──
{
  const fp = path.join(ROOT, 'public', 'sitemap.xml')
  const lines = fs.readFileSync(fp, 'utf-8').split('\n')
  const kept = lines.filter(l => { if (!l.includes('</url>')) return true; const hit = l.includes(C.slug); if (hit) removed.sitemap++; return !hit })
  fs.writeFileSync(fp, kept.join('\n'))
}

console.log(JSON.stringify(removed))
