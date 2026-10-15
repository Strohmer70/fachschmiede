#!/usr/bin/env node
/**
 * inject-branding.js — 2026-10-14
 * Brand-Amboss + Favicon in ALLE statischen HTML-Seiten injizieren.
 * IDEMPOTENT — jederzeit re-laufbar (Skip wenn Marker vorhanden).
 *
 * - Favicon-Links nach </title> (Fallback: vor </head>)
 * - Header-Tile (span.bg-brand-600, w-10 h-10): Inhalt → Amboss-SVG
 *   (Mieter-Logo-Override greift weiterhin: JS ersetzt den ganzen span!)
 *
 * Lauf: node scripts/inject-branding.js
 */
const fs = require('fs')
const path = require('path')

const PUBLIC = path.join(__dirname, '..', 'public')

// ── Amboss-Logo (Richtung A „Der Amboss", von Dieter 2026-10-14 gewählt) ──
// currentColor = weiß (text-white auf Tile), Funke amber #f59e0b
const AMBOSS_SVG = '<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.2l.72 1.75 1.75.72-1.75.72L12 7.14l-.72-1.75-1.75-.72 1.75-.72L12 2.2z" fill="#f59e0b"/><path d="M4.2 6.5h15.6c.5 0 .9.4.9.9v.7c0 .5-.4.9-.9.9h-1c-.3 2.3-1.9 3.6-4 3.9v2.4h1.3c.8 0 1.5.7 1.5 1.5v3h.6c.5 0 .9.4.9.9v.8H5.6v-.8c0-.5.4-.9.9-.9h.6v-3c0-.8.7-1.5 1.5-1.5h1.3v-2.4c-2.1-.3-3.7-1.6-4-3.9h-1c-.5 0-.9-.4-.9-.9v-.7c0-.5.4-.9.9-.9z" fill="currentColor"/></svg>'
const AMBOSS_MARKER = 'M4.2 6.5h15.6' // Idempotenz-Marker

const FAVICON_LINKS = [
  '<link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any">',
  '<link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48">',
  '<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">',
  '<link rel="icon" href="/favicon-16.png" type="image/png" sizes="16x16">',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
].join('\n  ')

// V2-Upgrade: alten 4-Zeilen-Block (ohne 48er) → neuer 5-Zeilen-Block
const OLD_FAVICON_BLOCK = /\s*<link rel="icon" href="\/favicon\.svg"[^>]*>\s*\n\s*<link rel="icon" href="\/favicon-32\.png"[^>]*>\s*\n\s*<link rel="icon" href="\/favicon-16\.png"[^>]*>\s*\n\s*<link rel="apple-touch-icon"[^>]*>/

// Header-Tile: span mit bg-brand-600 + w-10 h-10 (Inhalt: Icon-SVG oder Text)
const TILE_RE = /<span class="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center text-white[^"]*">([\s\S]*?)<\/span>/

let favDone = 0, favSkip = 0, logoDone = 0, logoSkip = 0, fileSkip = 0

const files = fs.readdirSync(PUBLIC).filter(f => f.endsWith('.html'))
for (const f of files) {
  const fp = path.join(PUBLIC, f)
  let html = fs.readFileSync(fp, 'utf8')
  let changed = false

  // ── 1) Favicon-Links ──
  if (html.includes('favicon-48.png')) {
    favSkip++
  } else if (html.includes('favicon.svg')) {
    // V1→V2-Upgrade: alten Block durch 48er-Version ersetzen
    if (OLD_FAVICON_BLOCK.test(html)) {
      html = html.replace(OLD_FAVICON_BLOCK, '\n  ' + FAVICON_LINKS)
      changed = true; favDone++
    } else {
      console.warn('  ⚠️  favicon.svg da, aber Block nicht erkannt:', f)
      favSkip++
    }
  } else if (html.includes('</title>')) {
    html = html.replace('</title>', '</title>\n  ' + FAVICON_LINKS)
    changed = true; favDone++
  } else if (html.includes('</head>')) {
    html = html.replace('</head>', '  ' + FAVICON_LINKS + '\n</head>')
    changed = true; favDone++
  } else {
    console.warn('  ⚠️  Kein </title>/</head> gefunden:', f)
  }

  // ── 2) Header-Tile → Amboss ──
  if (html.includes('bg-brand-600') && TILE_RE.test(html)) {
    if (html.includes(AMBOSS_MARKER)) {
      logoSkip++
    } else {
      html = html.replace(TILE_RE, (m) => {
        const spanOpen = m.slice(0, m.indexOf('>') + 1)
        return spanOpen + AMBOSS_SVG + '</span>'
      })
      changed = true; logoDone++
    }
  }

  if (changed) fs.writeFileSync(fp, html)
}
console.log(`\n✅ Favicon injiziert: ${favDone} | schon vorhanden: ${favSkip}`)
console.log(`✅ Amboss-Logo gesetzt: ${logoDone} | schon vorhanden: ${logoSkip}`)
console.log(`   Dateien gesamt: ${files.length}`)
