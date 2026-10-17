#!/usr/bin/env node
/**
 * fix-sitemap-slashes.js — Trailing-Slash-Desaster in der Sitemap reparieren
 * Alle <loc>-Einträge ohne Slash (außer Root) bekommen Slash (direkte 200 statt 308-Kette).
 * + 5 neue Ratgeber-URLs einfügen (3 Garten-Artikel + 2 Trade-Hubs)
 * Idempotent.
 */
const fs = require('fs')
const path = require('path')
const ROOT = path.join(__dirname, '..')
const WRITE = process.argv.includes('--write')

const S = 'https://www.fachschmiede.de'
const NEW_URLS = [
  { loc: `${S}/artikel-gartenplanung-ideen/`, priority: '0.6' },
  { loc: `${S}/artikel-rasen-neuanlage/`, priority: '0.6' },
  { loc: `${S}/artikel-terrasse-bauen/`, priority: '0.6' },
  { loc: `${S}/ratgeber-dachdecker/`, priority: '0.7' },
  { loc: `${S}/ratgeber-garten-und-landschaftsbau/`, priority: '0.7' },
]

let sm = fs.readFileSync(path.join(ROOT, 'public/sitemap.xml'), 'utf8')

// 1. Slash nachrüsten: </loc> direkt nach Nicht-Slash-URL → Slash einfügen
let fixedSlashes = 0
sm = sm.replace(/<loc>(https:\/\/www\.fachschmiede\.de\/[^<]*?[^\/])<\/loc>/g, (m, url) => {
  fixedSlashes++
  return `<loc>${url}/</loc>`
})

// 2. Neue URLs einfügen (vor </urlset>, aufsteigend sortiert bleibt der Generator-Task später)
let added = 0
const newEntries = []
for (const n of NEW_URLS) {
  if (sm.includes(`<loc>${n.loc}</loc>`)) continue
  newEntries.push(`  <url><loc>${n.loc}</loc><priority>${n.priority}</priority><changefreq>weekly</changefreq></url>`)
  added++
}
if (newEntries.length) {
  sm = sm.replace('</urlset>', newEntries.join('\n') + '\n</urlset>')
}

// 3. Portal-Link fixen: /ratgeber.html (308-Kette) → /ratgeber/
const fdlPath = path.join(ROOT, 'public/fuer-dienstleister.html')
let fdl = fs.readFileSync(fdlPath, 'utf8')
let fdlFixed = 0
if (fdl.includes('href="/ratgeber.html"')) {
  fdl = fdl.replace(/href="\/ratgeber\.html"/g, 'href="/ratgeber/"')
  fdlFixed++
}

if (WRITE) {
  fs.writeFileSync(path.join(ROOT, 'public/sitemap.xml'), sm)
  fs.writeFileSync(fdlPath, fdl)
}
console.log(`${fixedSlashes} Slashes nachgerüstet, ${added} neue URLs, ${fdlFixed} Portal-Link-Fixes ${WRITE ? '(GESCHRIEBEN)' : '(Dry-Run)'}`)

// Sanity: keine Nicht-Slash-URLs mehr (außer Root)
const bad = (sm.match(/<loc>https:\/\/www\.fachschmiede\.de\/[^<]*?[^\/]<\/loc>/g) || [])
const rootOnly = bad.filter(u => u !== `<loc>${S}/</loc>`)
const newOnes = NEW_URLS.filter(n => !sm.includes(`<loc>${n.loc}</loc>`))
if (rootOnly.length) { console.log('⚠️ RESTE:', rootOnly.slice(0, 5)); process.exit(1) }
if (newOnes.length) { console.log('⚠️ NEUE FEHlen:', newOnes.map(n => n.loc)); process.exit(1) }
console.log('✅ Sanity: alle Sitemap-URLs mit Slash, alle 5 neuen drin')
