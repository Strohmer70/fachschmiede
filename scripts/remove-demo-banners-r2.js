#!/usr/bin/env node
/**
 * remove-demo-banners-r2.js — Content-basierte Bereinigung
 * ========================================================
 * Round 1 hat comment-markierte Blöcke entfernt. Diese Dateien
 * (63 stadt klempner/maler/zimm + 20 artikel) haben die Banner
 * OHNE Kommentare. Hier: Content-Match via Div-Counter.
 *
 *  - bg-amber-400-Block mit "MUSTERSEITE" → entfernen
 *  - bg-ink-900-Block mit "Demo-Portal:"  → entfernen (nested)
 */

const fs = require('fs')
const path = require('path')
const PUBLIC = path.join(__dirname, '..', 'public')

function extractDivBlock(html, startIdx) {
  let depth = 0
  let i = startIdx
  const openRe = /<div[\s>]/g
  const closeRe = /<\/div>/g
  openRe.lastIndex = startIdx
  const first = openRe.exec(html)
  if (!first) return null
  i = first.index
  while (i < html.length) {
    openRe.lastIndex = i
    closeRe.lastIndex = i
    const o = openRe.exec(html)
    const c = closeRe.exec(html)
    if (c && (!o || c.index < o.index)) {
      depth--
      i = c.index + 6
      if (depth === 0) return { block: html.slice(startIdx, i), end: i }
    } else if (o) {
      depth++
      i = o.index + 4
    } else break
  }
  return null
}

// Entfernt alle div-Blöcke mit gegebenem Start-Match und Inhalt-Prädikat
function removeBlocks(html, startRegex, predicate) {
  let changed = false
  let idx = 0
  while (true) {
    startRegex.lastIndex = idx
    const m = startRegex.exec(html)
    if (!m) break
    const extracted = extractDivBlock(html, m.index)
    if (!extracted) {
      idx = m.index + 4
      continue
    }
    if (predicate(extracted.block)) {
      // Block + umgebende Leerzeilen entfernen
      let start = m.index
      let end = extracted.end
      // Vorherige Leerzeile mitentfernen wenn vorhanden
      const before = html.slice(Math.max(0, start - 2), start)
      if (before === '\n\n') start -= 1
      if (html[end] === '\r') end++
      if (html[end] === '\n') end++
      if (html[end] === '\n') end++
      html = html.slice(0, start) + html.slice(end)
      changed = true
      idx = start
    } else {
      idx = extracted.end
    }
  }
  return { html, changed }
}

const files = fs.readdirSync(PUBLIC).filter((f) => f.endsWith('.html'))
const changed = []
let amberCount = 0
let demoCount = 0

for (const file of files) {
  const fp = path.join(PUBLIC, file)
  let html = fs.readFileSync(fp, 'utf8')
  const before = html

  // 1. Amber-MUSTERSEITE-Banner
  let r = removeBlocks(html, /<div class="bg-amber-400/g, (b) => b.includes('MUSTERSEITE'))
  html = r.html
  if (r.changed) amberCount++

  // 2. Demo-Portal-Nav (bg-ink-900 mit "Demo-Portal:")
  r = removeBlocks(html, /<div class="bg-ink-900 text-ink-300 text-xs/g, (b) => b.includes('Demo-Portal:'))
  html = r.html
  if (r.changed) demoCount++

  if (html !== before) {
    fs.writeFileSync(fp, html)
    changed.push(file)
  }
}

console.log(`\n══ ROUND 2 REPORT ══`)
console.log(`Geändert: ${changed.length} Dateien`)
console.log(`Amber-Banner entfernt: ${amberCount}`)
console.log(`Demo-Nav entfernt: ${demoCount}`)

// ══ GLOBAL-VERIFIKATION ══
let amberLeft = 0, demoLeft = 0, musterLeft = [], formFake = []
for (const file of files) {
  const html = fs.readFileSync(path.join(PUBLIC, file), 'utf8')
  if (html.includes('bg-amber-400') && html.includes('MUSTERSEITE')) amberLeft++
  if (html.includes('Demo-Portal:')) demoLeft++
  if (html.includes('-muster.de') || html.includes('MUSTERSEITE. Alle Inhalte')) musterLeft.push(file)
  if (html.includes("getElementById('formSuccess').classList.remove('hidden')")) formFake.push(file)
}
console.log(`\n── Verifikation (alle ${files.length} HTML) ──`)
console.log(amberLeft === 0 ? '✅ Amber-Banner: 0' : `❌ Amber-Banner rest: ${amberLeft}`)
console.log(demoLeft === 0 ? '✅ Demo-Nav: 0' : `❌ Demo-Nav rest: ${demoLeft}`)
console.log(musterLeft.length === 0 ? '✅ Muster-Footer: 0' : `❌ Muster-Footer: ${musterLeft.length} → ${musterLeft.slice(0,5).join(',')}`)
console.log(formFake.length === 0 ? '✅ Fake-Forms: 0' : `❌ Fake-Forms: ${formFake.length} → ${formFake.slice(0,5).join(',')}`)

// Div-Balance-Stichprobe
for (const f of changed.slice(0, 4)) {
  const html = fs.readFileSync(path.join(PUBLIC, f), 'utf8')
  const o = (html.match(/<div[\s>]/g) || []).length
  const c = (html.match(/<\/div>/g) || []).length
  console.log(`  Div ${f}: ${o}/${c} ${o === c ? '✅' : '⚠️ ' + (o - c)}`)
}
