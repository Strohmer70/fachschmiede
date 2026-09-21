#!/usr/bin/env node
/**
 * FAQ-STRUKTUR-REPARATUR
 *
 * Problem: Extra-FAQs wurden außerhalb des space-y-4/max-w-3xl Containers
 * eingefügt → unterschiedliche Größen, fehlender Abstand, kaputte Divs.
 *
 * Fix: Extrahiert ALLE faq-items + Header aus der Section und baut
 * die komplette FAQ-Section mit korrekter Verschachtelung neu.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const files = fs.readdirSync(PUBLIC_DIR).filter(f => f.startsWith('stadt-') && f.endsWith('.html'));
console.log(`📂 ${files.length} Stadt-Dateien\n`);

// Extrahiert einen kompletten <div>...</div> Block ab startIdx (mit Tiefenzählung)
function extractDivBlock(html, startIdx) {
  let depth = 0;
  let i = startIdx;
  while (i < html.length) {
    if (html.startsWith('<div', i)) { depth++; i += 4; }
    else if (html.startsWith('</div>', i)) { depth--; i += 6; if (depth === 0) return html.slice(startIdx, i); }
    else i++;
  }
  return null;
}

let fixed = 0, skipped = 0, errors = [];

for (const file of files) {
  try {
    const filePath = path.join(PUBLIC_DIR, file);
    let html = fs.readFileSync(filePath, 'utf8');

    // Finde FAQ-Section
    const sectionStart = html.indexOf('<section id="faq"');
    if (sectionStart < 0) { skipped++; continue; }
    const sectionEnd = html.indexOf('</section>', sectionStart);
    if (sectionEnd < 0) { errors.push(`${file}: kein </section>`); continue; }

    const sectionHtml = html.slice(sectionStart, sectionEnd + 10);

    // Prüfe ob die Struktur bereits korrekt ist:
    // Korrekt = nach dem space-y-4 open kommen NUR faq-items, dann space-y-4 close, dann max-w close
    const spaceYMatch = sectionHtml.match(/<div class="mt-10 space-y-4">/);
    if (!spaceYMatch) { errors.push(`${file}: kein space-y-4`); continue; }

    const spaceYIdx = sectionHtml.indexOf(spaceYMatch[0]);
    const spaceYOpenEnd = spaceYIdx + spaceYMatch[0].length;

    // Extrahiere alle faq-items in dieser Section
    const faqItems = [];
    let searchIdx = 0;
    while (true) {
      const itemIdx = sectionHtml.indexOf('<div class="faq-item reveal', searchIdx);
      if (itemIdx < 0) break;
      const block = extractDivBlock(sectionHtml, itemIdx);
      if (!block) break;
      faqItems.push(block);
      searchIdx = itemIdx + block.length;
    }

    if (faqItems.length === 0) { skipped++; continue; }

    // Prüfe: Steht das letzte faq-item NACH dem space-y-4 close?
    // D.h. suche ob nach dem letzten faq-item noch "</div>" mit 4-space Indent kommt
    // Einfacher Check: Sind alle faq-items zwischen space-y-4 open und space-y-4 close?
    // Wenn die Section mehr faq-items hat als im space-y-4 Container, ist sie kaputt.

    // Finde den space-y-4 Container via Div-Counter ab spaceYIdx
    const spaceYBlock = extractDivBlock(sectionHtml, spaceYIdx);
    if (!spaceYBlock) { errors.push(`${file}: space-y-4 nicht geschlossen`); continue; }

    // Zähle faq-items innerhalb des space-y-4 Containers
    const itemsInContainer = (spaceYBlock.match(/<div class="faq-item reveal/g) || []).length;

    if (itemsInContainer === faqItems.length) {
      skipped++; // Bereits korrekt
      continue;
    }

    // KAPUTT → Rebuild
    // 1. Header: alles zwischen max-w-3xl open und space-y-4 open
    const maxWMatch = sectionHtml.match(/<div class="max-w-3xl mx-auto[^"]*">/);
    const headerStart = sectionHtml.indexOf(maxWMatch[0]) + maxWMatch[0].length;
    const headerHtml = sectionHtml.slice(headerStart, spaceYIdx).trim();

    // 2. Sektions-Attribute
    const sectionOpenMatch = sectionHtml.match(/<section id="faq"[^>]*>/);
    const sectionOpen = sectionOpenMatch[0];

    // 3. max-w-3xl Klasse
    const maxWOpen = maxWMatch[0];

    // Rebuild
    const faqBlock = faqItems.map(item => {
      // Normalisiere Einrückung: Erste Zeile 6 spaces, Rest wie gehabt
      return '      ' + item;
    }).join('\n');

    const newSection = `${sectionOpen}
${maxWOpen}
${headerHtml}
    <div class="mt-10 space-y-4">
${faqBlock}
    </div>
  </div>
</section>`;

    html = html.slice(0, sectionStart) + newSection + html.slice(sectionEnd + 10);
    fs.writeFileSync(filePath, html);
    fixed++;
    console.log(`  🔧 ${file}: ${itemsInContainer}→${faqItems.length} Items in Container`);
  } catch (e) {
    errors.push(`${file}: ${e.message}`);
  }
}

console.log(`\n════════════════════════════════════`);
console.log(`✅ Repariert: ${fixed} | ⏭️ OK: ${skipped} | ❌ Fehler: ${errors.length}`);
if (errors.length) console.log(errors.join('\n'));
