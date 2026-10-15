// lib/city-links.js — Stadt-Link-Boxen für Artikel (SSOT: config/system-config.js)
// Zweck: Jeder Artikel verlinkt mit Keyword-Ankertext ("Dachdecker Bochum") auf
// ALLE Landpages seines Gewerks → interner Linkjuice für die Ziel-Keywords.
// Idempotent via Marker <!--citylinks:v1:{trade}--> — mehrfach aufrufbar.
// Wird genutzt von: scripts/inject-city-links.js (Bestand) + scripts/monthly-generator.js (neue Artikel)
'use strict'
const fs = require('fs')
const path = require('path')

const REPO = path.join(__dirname, '..', '..')
const MARKER = (trade) => `<!--citylinks:v1:${trade}-->`

// Generischer Artikel (public/artikel-*.html) → Gewerk-Slug
const GENERIC_ARTICLE_TRADE = {
  'artikel-5-anzeichen-dachsanierung.html': 'dachdecker',
  'artikel-carport-bauen.html': 'zimmerer',
  'artikel-dachdaemmung-foerderung.html': 'dachdecker',
  'artikel-dachstuhl-sanieren.html': 'zimmerer',
  'artikel-e-check-sicherheitspruefung.html': 'elektriker',
  'artikel-farben-raumwirkung.html': 'maler',
  'artikel-fassade-streichen-kosten.html': 'maler',
  'artikel-heizungs-check-winter.html': 'klempner',
  'artikel-heizungstausch-foerderung.html': 'klempner',
  'artikel-holzterrasse-pflegen.html': 'zimmerer',
  'artikel-rohrbruch-sofortmassnahmen.html': 'klempner',
  'artikel-schimmel-wohnung.html': 'maler',
  'artikel-smart-home-nachruesten.html': 'elektriker',
  'artikel-sturmschaden-sofortmassnahmen.html': 'dachdecker',
  'artikel-wallbox-zuhause.html': 'elektriker',
}

let _cfg = null
function loadConfig() {
  if (_cfg) return _cfg
  const src = fs.readFileSync(path.join(REPO, 'config', 'system-config.js'), 'utf8')
  const mod = { exports: {} }
  new Function('module', 'exports', 'require', src)(mod, mod.exports, require)
  _cfg = mod.exports
  return _cfg
}

function getCities() {
  return loadConfig().getAllCities()
}
function getTradeName(slug) {
  return loadConfig().getTradeName(slug)
}

// Baut die Stadt-Link-Box (ohne Marker — Marker von außen drum herum)
function cityLinksHTML(tradeSlug) {
  const name = getTradeName(tradeSlug) // "Dachdecker" / "Klempner / SHK"
  const short = name.split(' / ')[0]   // Ankertext: "Klempner" statt "Klempner / SHK"
  const cities = getCities()
  const lis = cities
    .map(
      (c) =>
        `    <li><a href="/${tradeSlug}/${c.slug}/" style="color:#2563eb;font-weight:600;font-size:14px;text-decoration:none">${short} ${c.name}</a></li>`
    )
    .join('\n')
  return `<nav aria-label="${name} in Ihrer Stadt" style="margin:40px 0 0;padding:28px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px">
  <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0f172a">${name} in Ihrer Stadt</h2>
  <p style="margin:0 0 16px;font-size:14px;color:#475569">Kostenlose Erstberatung &amp; Angebote von geprüften ${short.toLowerCase()}n – direkt in Ihrer Region:</p>
  <ul style="list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px 16px">
${lis}
  </ul>
</nav>`
}

// Voller Block inkl. Marker (für Regex-Erkennung / idempotente Prüfung)
function cityLinksBlock(tradeSlug) {
  return `${MARKER(tradeSlug)}\n${cityLinksHTML(tradeSlug)}\n`
}

function hasCityLinks(html, tradeSlug) {
  return html.includes(MARKER(tradeSlug))
}

// Fügt die Box in Artikel-HTML ein (idempotent).
// Position: vor der Abschluss-CTA (letztes bg-ink-900) — inhaltlich sinnvoll + prominent.
function injectCityLinks(html, tradeSlug) {
  if (hasCityLinks(html, tradeSlug)) return { html, changed: false }
  const block = cityLinksBlock(tradeSlug)
  let idx = html.lastIndexOf('<div class="mt-10 bg-ink-900')
  if (idx === -1) idx = html.indexOf('</main>')
  if (idx === -1) return { html, changed: false, error: 'Kein Anker (CTA/</main>) gefunden' }
  return { html: html.slice(0, idx) + block + html.slice(idx), changed: true }
}

module.exports = {
  GENERIC_ARTICLE_TRADE,
  MARKER,
  getCities,
  getTradeName,
  cityLinksHTML,
  cityLinksBlock,
  hasCityLinks,
  injectCityLinks,
}
