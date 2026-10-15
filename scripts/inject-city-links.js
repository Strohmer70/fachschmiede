#!/usr/bin/env node
// inject-city-links.js — Baut in ALLE generischen Artikel (public/artikel-*.html)
// die Stadt-Link-Box ein: Keyword-Ankertext-Links auf jede Landpage des Gewerks.
// Idempotent (Marker-Check) — jederzeit erneut aufrufbar.
// → Dieter 2026-10-15: "interne verlinkung für stadtseiten"
'use strict'
const fs = require('fs')
const path = require('path')
const { GENERIC_ARTICLE_TRADE, injectCityLinks, hasCityLinks } = require('./lib/city-links')

const PUBLIC = path.join(__dirname, '..', 'public')
let changed = 0
let skipped = 0
let failed = 0

for (const [file, trade] of Object.entries(GENERIC_ARTICLE_TRADE)) {
  const fp = path.join(PUBLIC, file)
  if (!fs.existsSync(fp)) {
    console.log(`⚠️  ${file} — Datei fehlt`)
    failed++
    continue
  }
  const html = fs.readFileSync(fp, 'utf8')
  if (hasCityLinks(html, trade)) {
    skipped++
    continue
  }
  const res = injectCityLinks(html, trade)
  if (!res.changed) {
    console.log(`❌ ${file} — ${res.error || 'unbekannt'}`)
    failed++
    continue
  }
  fs.writeFileSync(fp, res.html)
  const count = (res.html.match(/<li><a href="\/[^/]+\/[^/]+\//g) || []).length
  console.log(`✅ ${file} → ${trade} (${count} Stadt-Links)`)
  changed++
}

console.log(`\n${changed} Artikel aktualisiert · ${skipped} schon vorhanden · ${failed} Fehler`)
