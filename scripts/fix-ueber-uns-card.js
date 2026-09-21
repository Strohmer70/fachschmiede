#!/usr/bin/env node
/**
 * ÜBER-UNS STADT-KARTE REPARATUR
 *
 * Problem: Dunkle Karte unter dem Team-Bild hat:
 *   1. Text 3x identisch dupliziert (nebeneinander)
 *   2. Dunkle Schrift (text-ink-600) auf dunklem Grund (bg-ink-900)
 *   3. Zu groß — zieht den ganzen Abschnitt
 *   4. Overflow bei manchen Gewerken (Text läuft raus)
 *
 * Fix: Kompakte 2-Spalten-Karte:
 *   Links: Stadtname (groß, brand-Farbe)
 *   Rechts: Text (1x, weiß) + Label
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const files = fs.readdirSync(PUBLIC_DIR).filter(f => f.startsWith('stadt-') && f.endsWith('.html'));
console.log(`📂 ${files.length} Stadt-Dateien\n`);

// Extrahiert einen kompletten <div>...</div> Block ab startIdx
function extractDivBlock(html, startIdx) {
  let depth = 0, i = startIdx;
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

    // Finde die dunkle Karte: bg-ink-900 direkt nach dem team-Bild
    const cardIdx = html.indexOf('bg-ink-900 text-white rounded-2xl p-5');
    if (cardIdx < 0) { skipped++; continue; }

    // Finde den Anfang des umgebenden divs
    const divStart = html.lastIndexOf('<div', cardIdx);
    if (divStart < 0) { errors.push(`${file}: div-Start nicht gefunden`); continue; }

    const oldBlock = extractDivBlock(html, divStart);
    if (!oldBlock) { errors.push(`${file}: Block nicht extrahierbar`); continue; }

    // Prüfe ob es die richtige Karte ist (hat "unser Standort")
    if (!oldBlock.includes('unser Standort')) { skipped++; continue; }

    // Prüfe ob bereits gefixt (nur 1 Text-Absatz)
    const textMatches = oldBlock.match(/text-ink-600 leading-relaxed/g);
    if (textMatches && textMatches.length <= 1) { skipped++; continue; }

    // Extrahiere Stadtname
    const cityMatch = oldBlock.match(/<p class="text-4xl font-black text-brand-400">([^<]+)<\/p>/);
    if (!cityMatch) { errors.push(`${file}: Stadtname nicht gefunden`); continue; }
    const cityName = cityMatch[1].trim();

    // Extrahiere den Text (erste text-ink-600 Instanz) — oder generiere einen
    let textMatch = oldBlock.match(/<p class="mt-4 text-ink-600 leading-relaxed">([^<]+)<\/p>/);
    let text;
    if (textMatch) {
      text = textMatch[1].trim();
    } else {
      // Seite ohne Text (Ennepetal/München) — generiere aus Stadtnamen + Gewerk
      const tradeName = { dach: 'dachdecker', elek: 'elektriker', klempner: 'klempner', zimm: 'zimmerer', maler: 'maler', garten: 'gärtner' }[file.match(/^stadt-([a-z]+)-/)?.[1]] || 'handwerker';
      text = `${cityName} ist unser Zuhause. Wir wohnen hier, arbeiten hier, kennen die Menschen und die Häuser — wenn Sie einen ${tradeName} suchen, der die Region wirklich kennt, sind Sie bei uns richtig.`;
      console.log(`  ℹ️ ${file}: Text generiert (kein Original)`);
    }

    // Neuer kompakter Block
    const newBlock = `<div class="mt-4 bg-ink-900 text-white rounded-2xl p-6">
      <div class="flex items-start gap-5">
        <p class="text-3xl font-black text-brand-400 shrink-0 leading-tight pt-0.5">${cityName}</p>
        <div class="min-w-0">
          <p class="text-sm text-ink-200 leading-relaxed">${text}</p>
          <p class="mt-3 text-xs text-brand-400 font-bold uppercase tracking-wider">unser Standort – kurze Wege in der gesamten Region</p>
        </div>
      </div>
    </div>`;

    html = html.slice(0, divStart) + newBlock + html.slice(divStart + oldBlock.length);
    fs.writeFileSync(filePath, html);
    fixed++;
    console.log(`  🔧 ${file}: "${cityName}"-Karte kompakt`);
  } catch (e) {
    errors.push(`${file}: ${e.message}`);
  }
}

console.log(`\n════════════════════════════════════`);
console.log(`✅ Repariert: ${fixed} | ⏭️ OK: ${skipped} | ❌ Fehler: ${errors.length}`);
if (errors.length) console.log(errors.join('\n'));
