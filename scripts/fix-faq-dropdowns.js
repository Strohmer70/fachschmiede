#!/usr/bin/env node
/**
 * FAQ-DROPDOWN-KONVERTIERER
 *
 * Problem: Extra-FAQs vom Content-Upgrade sind statische Cards
 * (<div class="bg-white rounded-xl p-6 shadow-sm">), während die
 * Original-FAQs Dropdowns sind (faq-item/faq-q/faq-answer).
 *
 * Fix: Wandelt alle statischen Extra-FAQ-Cards in das Dropdown-Format
 * um und löst den Wrapper in den Haupt-FAQ-Container auf.
 * → Einheitliche Dropdown-FAQs auf allen Seiten.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const files = fs.readdirSync(PUBLIC_DIR).filter(f => f.startsWith('stadt-') && f.endsWith('.html'));
console.log(`📂 ${files.length} Stadt-Dateien\n`);

const CHEV_SVG = '<svg class="chev w-5 h-5 text-brand-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>';

// Statische Card → Dropdown-Item
function cardToDropdown(q, a) {
  return `<div class="faq-item reveal bg-white rounded-xl border border-ink-200">
        <button class="faq-q w-full flex items-center justify-between gap-4 px-6 py-5 text-left">
          <span class="font-bold text-ink-900">${q}</span>
          ${CHEV_SVG}
        </button>
        <div class="faq-answer"><p class="px-6 pb-5 text-ink-600 text-sm leading-relaxed">${a}</p></div>
      </div>`;
}

let fixed = 0;
let totalConverted = 0;

for (const file of files) {
  const filePath = path.join(PUBLIC_DIR, file);
  let html = fs.readFileSync(filePath, 'utf8');
  let fileConverted = 0;

  // 1. Finde den Extra-FAQ-Wrapper: <div class="mt-6 grid gap-4">...</div>
  //    (endet vor "  </div>\n</section>" — dem max-w-3xl/Section-Ende)
  const wrapperMatch = html.match(/<div class="mt-6 grid gap-4">\n([\s\S]*?)\n\s*<\/div>\s*\n\s*<\/div>\s*\n<\/section>/);

  if (!wrapperMatch) continue; // Keine Extra-FAQs auf dieser Seite

  const wrapperContent = wrapperMatch[1];

  // 2. Extrahiere alle statischen Cards im Wrapper
  const cardRegex = /<div class="bg-white rounded-xl p-6 shadow-sm">\s*<h3 class="font-bold text-ink-900 mb-2">([\s\S]*?)<\/h3>\s*<p class="text-ink-600 leading-relaxed">([\s\S]*?)<\/p>\s*<\/div>/g;
  let cardMatch;
  const dropdowns = [];
  while ((cardMatch = cardRegex.exec(wrapperContent)) !== null) {
    dropdowns.push(cardToDropdown(cardMatch[1].trim(), cardMatch[2].trim()));
    fileConverted++;
  }

  if (dropdowns.length === 0) continue;

  // 3. Ersetze den kompletten Block (Wrapper + Section-Ende):
  //    Die neuen Dropdowns kommen in den space-y-4 Container (vor dessen </div>),
  //    dann das normale Section-Ende.
  const dropdownBlock = dropdowns.join('\n      ');

  html = html.replace(
    /<div class="mt-6 grid gap-4">\n[\s\S]*?\n\s*<\/div>\s*\n(\s*)<\/div>\s*\n<\/section>/,
    (match, indent) => {
      // indent = Einrückung des max-w-3xl schließenden </div>
      return dropdownBlock + '\n    ' + indent + '</div>\n</section>';
    }
  );

  fs.writeFileSync(filePath, html);
  fixed++;
  totalConverted += fileConverted;
  console.log(`  🔧 ${file}: ${fileConverted} Cards → Dropdowns`);
}

console.log(`\n════════════════════════════════════`);
console.log(`✅ FERTIG! ${fixed} Dateien, ${totalConverted} FAQs konvertiert`);
console.log(`════════════════════════════════════`);
