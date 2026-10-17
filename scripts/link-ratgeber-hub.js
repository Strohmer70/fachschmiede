#!/usr/bin/env node
/**
 * link-ratgeber-hub.js — Footer-Link zum allgemeinen Ratgeber auf allen Landpages
 * Idempotent: überspringt Dateien, die den Link bereits haben.
 *
 * node scripts/link-ratgeber-hub.js         (Dry-Run)
 * node scripts/link-ratgeber-hub.js --write
 */
const fs = require('fs')
const path = require('path')
const ROOT = path.join(__dirname, '..')
const WRITE = process.argv.includes('--write')

const NEW_LI = '\n        <li><a href="/ratgeber/" class="hover:text-brand-400 transition">Allgemeiner Ratgeber</a></li>'

const files = fs.readdirSync(path.join(ROOT, 'public'))
  .filter(f => f.startsWith('stadt-') && f.endsWith('.html'))

let changed = 0, already = 0, failed = 0
for (const f of files) {
  const abs = path.join(ROOT, 'public', f)
  let html = fs.readFileSync(abs, 'utf8')
  if (html.includes('href="/ratgeber/" class="hover:text-brand-400 transition"')) { already++; continue }
  // Footer-LI: einzigartig durch text-brand-400 + city-blog href davor
  const m = html.match(/(<li><a href="\/[a-z-]+\/[a-z-]+\/blog\/" class="hover:text-brand-400 transition">Ratgeber<\/a><\/li>)/)
  if (!m) { console.log('⚠️ Anchor nicht gefunden:', f); failed++; continue }
  html = html.replace(m[1], m[1] + NEW_LI)
  if (WRITE) fs.writeFileSync(abs, html)
  changed++
}
console.log(`${changed} ergänzt, ${already} hatten den Link bereits, ${failed} fehlgeschlagen ${WRITE ? '(GESCHRIEBEN)' : '(Dry-Run)'} von ${files.length} Landpages`)

// Sanity: jede Landpage hat jetzt genau 1 Link zum /ratgeber/-Hub
if (WRITE) {
  const problems = []
  for (const f of files) {
    const html = fs.readFileSync(path.join(ROOT, 'public', f), 'utf8')
    const n = (html.match(/href="\/ratgeber\/"/g) || []).length
    if (n !== 1) problems.push(`${f}: ${n} Links`)
  }
  if (problems.length) { console.log('⚠️ PROBLEME:'); problems.slice(0, 10).forEach(p => console.log('  -', p)); process.exit(1) }
  else console.log('✅ Sanity: alle Landpages verlinken genau 1× auf /ratgeber/')
}
