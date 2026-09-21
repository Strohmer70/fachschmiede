#!/usr/bin/env node
/**
 * DEDUP-SKRIPT: Entfernt 3x-duplizierte Upgrade-Sections aus stadt-*.html
 *
 * Bug: upgrade-old-pages-content.js wurde 3x ausgeführt und hat
 * LOKAL/STADT-GUIDE/KUNDENSTIMME/FAQs/Leistungen-Intro/Über-uns
 * jeweils 3x identisch eingefügt.
 *
 * Fix: Behalte pro Section-Typ nur die ERSTE Instanz, entferne Rest.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const BACKUP_DIR = path.join(__dirname, '..', '.backup-dedup-' + Date.now());

const files = fs.readdirSync(PUBLIC_DIR).filter(f => f.startsWith('stadt-') && f.endsWith('.html'));
console.log(`📂 ${files.length} Stadt-Dateien gefunden\n`);

// Backup erstellen
fs.mkdirSync(BACKUP_DIR, { recursive: true });
for (const f of files) {
  fs.copyFileSync(path.join(PUBLIC_DIR, f), path.join(BACKUP_DIR, f));
}
console.log(`💾 Backup: ${BACKUP_DIR}\n`);

// ─────────────────────────────────────────────
// 1. Markierte Sections: Marker + <section>...</section>
// ─────────────────────────────────────────────
const MARKER_SECTIONS = [
  { name: 'LOKAL', regex: /<!-- ═+ LOKAL IN [A-ZÄÖÜa-zäöüß\-() ]+ \(Unique Content\) ═+ -->\s*<section[\s\S]*?<\/section>/g },
  { name: 'STADT-GUIDE', regex: /<!-- ═+ STADT-GUIDE [A-ZÄÖÜa-zäöüß\-() ]+ \(Unique\) ═+ -->\s*<section[\s\S]*?<\/section>/g },
  { name: 'KUNDENSTIMME', regex: /<!-- ═+ KUNDENSTIMME [A-ZÄÖÜa-zäöüß\-() ]+ \(Unique\) ═+ -->\s*<section[\s\S]*?<\/section>/g },
  { name: 'SAISON-KALENDER', regex: /<!-- ═+ SAISON-KALENDER [A-ZÄÖÜa-zäöüß\-() ]+ \(Unique\) ═+ -->\s*<section[\s\S]*?<\/section>/g },
];

// ─────────────────────────────────────────────
// 2. Unmarkierte Upgrade-Insertions (identische Blöcke)
// ─────────────────────────────────────────────
// Extra-FAQs: <div class="bg-white rounded-xl p-6 shadow-sm"><h3...>Q</h3><p...>A</p></div>
const FAQ_CARD_REGEX = /<div class="bg-white rounded-xl p-6 shadow-sm">\s*<h3 class="font-bold text-ink-900 mb-2">[\s\S]*?<\/p>\s*<\/div>/g;

// Leistungen-Intro: <p class="text-lg text-ink-600 leading-relaxed mb-8 max-w-3xl">...</p>
const LEISTUNGEN_INTRO_REGEX = /<p class="text-lg text-ink-600 leading-relaxed mb-8 max-w-3xl">[\s\S]*?<\/p>/g;

// Über-uns-Zusatz: <p class="text-ink-600 leading-relaxed">Von X über Y bis Z:...</p>
const UEBER_UNS_REGEX = /<p[^>]*>Von [A-ZÄÖÜa-zäöüß\- ]+ über [A-ZÄÖÜa-zäöüß\- ]+ bis [A-ZÄÖÜa-zäöüß\- ]+: Jeder Stadtteil[\s\S]*?<\/p>/g;

function dedupByContent(html, regex, label, file) {
  const matches = html.match(regex);
  if (!matches || matches.length <= 1) return { html, removed: 0 };

  const seen = new Set();
  let removed = 0;
  html = html.replace(regex, (m) => {
    const key = m.replace(/\s+/g, ' ').trim();
    if (seen.has(key)) {
      removed++;
      return '';
    }
    seen.add(key);
    return m;
  });
  if (removed > 0) {
    console.log(`  🔧 ${file}: ${label} — ${matches.length} → ${matches.length - removed} (entfernt: ${removed})`);
  }
  return { html, removed };
}

function dedupMarkerSections(html, marker, file) {
  const matches = html.match(marker.regex);
  if (!matches || matches.length <= 1) return { html, removed: 0 };

  let removed = 0;
  let count = 0;
  html = html.replace(marker.regex, (m) => {
    count++;
    if (count === 1) return m; // erste behalten
    removed++;
    return '';
  });
  console.log(`  🔧 ${file}: ${marker.name}-Section — ${matches.length} → 1 (entfernt: ${removed})`);
  return { html, removed };
}

let totalFilesFixed = 0;
let totalRemoved = 0;
const affectedTrades = new Set();

for (const file of files) {
  const filePath = path.join(PUBLIC_DIR, file);
  let html = fs.readFileSync(filePath, 'utf8');
  const origLen = html.length;
  let fileRemoved = 0;

  // 1. Markierte Sections
  for (const marker of MARKER_SECTIONS) {
    const r = dedupMarkerSections(html, marker, file);
    html = r.html;
    fileRemoved += r.removed;
  }

  // 2. Extra-FAQs (nur dedup, nie alle entfernen — unique bleibt)
  const faqR = dedupByContent(html, FAQ_CARD_REGEX, 'Extra-FAQs', file);
  html = faqR.html;
  fileRemoved += faqR.removed;

  // 3. Leistungen-Intro
  const leiR = dedupByContent(html, LEISTUNGEN_INTRO_REGEX, 'Leistungen-Intro', file);
  html = leiR.html;
  fileRemoved += leiR.removed;

  // 4. Über-uns-Zusatz
  const ubR = dedupByContent(html, UEBER_UNS_REGEX, 'Über-uns-Zusatz', file);
  html = ubR.html;
  fileRemoved += ubR.removed;

  if (fileRemoved > 0) {
    // Leere Zeilen-Reste aufräumen (mehr als 2 Leerzeilen → 1)
    html = html.replace(/\n{3,}/g, '\n\n');
    fs.writeFileSync(filePath, html);
    totalFilesFixed++;
    totalRemoved += fileRemoved;
    const trade = file.replace('stadt-', '').replace(/-.*/, '');
    affectedTrades.add(trade);
  }
}

console.log(`\n════════════════════════════════════`);
console.log(`✅ FERTIG!`);
console.log(`   Dateien gefixt: ${totalFilesFixed}`);
console.log(`   Duplikate entfernt: ${totalRemoved}`);
console.log(`   Gewerke betroffen: ${[...affectedTrades].join(', ')}`);
console.log(`════════════════════════════════════`);
