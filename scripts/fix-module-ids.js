#!/usr/bin/env node
// scripts/fix-module-ids.js — 2026-10-01
// Fügt allen stadt-*.html stabile IDs hinzu (Modul-System applyRental v4):
//   <section class="bg-brand-600">                → id="notdienst-banner"
//   KUNDENSTIMME-Sektion (py-12 bg-ink-50, ★★★★★) → id="kundenstimme"
// IDEMPOTENT: ID-Check VOR Pattern-Gate (gepatchte Dateien haben das
// id-Attribut hinter der class → Pattern würde sonst nie mehr matchen).
// Pattern exakt x1 pro Datei sonst Abbruch.
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

const pub = join(process.cwd(), 'public')
const files = readdirSync(pub).filter(f => /^stadt-.*\.html$/.test(f))
let patched = 0, skipped = 0
const problems = []
const warnings = []

for (const f of files) {
  const path = join(pub, f)
  let html = readFileSync(path, 'utf8')
  const orig = html

  // 1) Notdienst-Banner
  if (!html.includes('id="notdienst-banner"')) {
    const ndCount = (html.match(/<section class="bg-brand-600">/g) || []).length
    if (ndCount !== 1) { problems.push(`${f}: bg-brand-600 Section x${ndCount}`); continue }
    html = html.replace('<section class="bg-brand-600">', '<section class="bg-brand-600" id="notdienst-banner">')
  }

  // 2) Kundenstimme — fehlt nur auf Ennepetal (pre-Upgrade-Generation): Warnung, kein Fehler
  if (!html.includes('id="kundenstimme"')) {
    const ksMarker = html.match(/<!--[^>]*KUNDENSTIMME[^>]*-->\s*<section class="py-12 bg-ink-50">/)
    if (ksMarker) {
      html = html.replace(ksMarker[0], ksMarker[0].replace('<section class="py-12 bg-ink-50">', '<section class="py-12 bg-ink-50" id="kundenstimme">'))
    } else {
      warnings.push(`${f}: KUNDENSTIMME-Sektion fehlt (ApplyRental no-op)`)
    }
  }

  if (html === orig) { skipped++; continue }
  writeFileSync(path, html)
  patched++
}
console.log(`Gepatcht: ${patched} | Bereits OK: ${skipped} | Dateien: ${files.length}`)
if (warnings.length) { console.log(`WARNUNGEN (${warnings.length}):`); warnings.forEach(w => console.log(' -', w)) }
if (problems.length) { console.log('PROBLEME:'); problems.forEach(p => console.log(' -', p)); process.exit(1) }
