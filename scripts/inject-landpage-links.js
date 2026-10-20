#!/usr/bin/env node
// inject-landpage-links.js — Stadt-Link-Boxen in ALLE 144 Landpages (stadt-*.html)
// Zweck: Landpages sind Link-Sackgassen → Box "Dachdecker in weiteren Städten"
// verlinkt jede Landpage auf ihre 19 Geschwister-Städte (Keyword-Ankertext).
// Idempotent via Marker <!--landlinks:v1:{trade}:{city}--> — mehrfach aufrufbar.
'use strict'
const fs = require('fs')
const path = require('path')

const REPO = path.join(__dirname, '..')
const PUBLIC = path.join(REPO, 'public')
const MARKER = (t, c) => `<!--landlinks:v1:${t}:${c}-->`

const TRADE_MAP = {
  dach: 'dachdecker',
  elek: 'elektriker',
  zimm: 'zimmerer',
  maler: 'maler',
  shk: 'klempner',
  klempner: 'klempner',
  garten: 'garten-und-landschaftsbau',
}

const cfg = require(path.join(REPO, 'config', 'system-config.js'))
const cities = cfg.getAllCities()

const TRADE_PLURAL_DATIVE = {
  dachdecker: 'Dachdeckern',
  elektriker: 'Elektrikern',
  klempner: 'Klempnern',
  zimmerer: 'Zimmerern',
  maler: 'Malern',
  'garten-und-landschaftsbau': 'Garten- und Landschaftsbauern',
}

function boxHTML(tradeSlug, ownCitySlug) {
  const name = cfg.getTradeName(tradeSlug)
  const short = name.split(' / ')[0]
  const pluralDat = TRADE_PLURAL_DATIVE[tradeSlug] || `${short}n`
  const others = cities.filter((c) => c.slug !== ownCitySlug)
  const lis = others
    .map(
      (c) =>
        `    <li><a href="/${tradeSlug}/${c.slug}/" style="color:#2563eb;font-weight:600;font-size:14px;text-decoration:none">${short} ${c.name}</a></li>`
    )
    .join('\n')
  return `${MARKER(tradeSlug, ownCitySlug)}
<section class="py-12 bg-ink-50" aria-label="${name} in weiteren Städten">
  <div class="max-w-6xl mx-auto px-4">
    <nav style="margin:0;padding:28px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px">
      <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0f172a">${name} in weiteren Städten</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#475569">Kostenlose Erstberatung &amp; Angebote von geprüften ${pluralDat} – direkt in Ihrer Region:</p>
      <ul style="list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px 16px">
${lis}
      </ul>
    </nav>
  </div>
</section>
`
}

// Dateiname stadt-{kürzel}-{city}.html → { tradeSlug, citySlug }
function parseFile(file) {
  const m = file.match(/^stadt-([a-z]+)-(.+)\.html$/)
  if (!m) return null
  const tradeSlug = TRADE_MAP[m[1]]
  if (!tradeSlug) return null
  return { tradeSlug, citySlug: m[2] }
}

// Selbstaktualisierend: Marker vorhanden → Box komplett neu bauen (SSOT-Update,
// z.B. neue Stadt). Kein Marker → vor <footer> einfügen.
// Marker-Ende = das erste '</section>' NACH dem Marker (Box = genau 1 Section).
let changed = 0
let updated = 0
let errors = []

for (const file of fs.readdirSync(PUBLIC).filter((f) => f.startsWith('stadt-') && f.endsWith('.html'))) {
  const parsed = parseFile(file)
  if (!parsed) { errors.push(`${file}: Kürzel unbekannt`); continue }
  const { tradeSlug, citySlug } = parsed
  const fp = path.join(PUBLIC, file)
  const html = fs.readFileSync(fp, 'utf-8')
  const marker = MARKER(tradeSlug, citySlug)
  const box = boxHTML(tradeSlug, citySlug)
  const mIdx = html.indexOf(marker)
  if (mIdx !== -1) {
    const sEnd = html.indexOf('</section>', mIdx)
    if (sEnd === -1) { errors.push(`${file}: Marker ohne </section>`); continue }
    const fresh = html.slice(0, mIdx) + box + html.slice(sEnd + '</section>'.length)
    if (fresh === html) { continue } // bereits aktuell
    fs.writeFileSync(fp, fresh, 'utf-8')
    updated++
    continue
  }
  let idx = html.lastIndexOf('<footer')
  if (idx === -1) idx = html.lastIndexOf('</body>')
  if (idx === -1) { errors.push(`${file}: kein Anker`); continue }
  fs.writeFileSync(fp, html.slice(0, idx) + box + html.slice(idx), 'utf-8')
  changed++
}

console.log(`✅ ${changed} neue Boxen · ${updated} aktualisiert (SSOT-Refresh)`)
if (errors.length) console.log('⚠️  Fehler:', errors.join(' | '))
process.exit(errors.length && !changed && !updated ? 1 : 0)
