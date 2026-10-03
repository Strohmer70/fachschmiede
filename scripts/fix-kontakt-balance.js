#!/usr/bin/env node
/**
 * fix-kontakt-balance.js (2026-10-03)
 * Kontaktbereichs-Reform fuer alle 120 stadt-*.html:
 *  A) WhatsApp-/Website-/Google-Buttons: gleiche Groesse (flex-1, justify-center, min-w)
 *  B) Kontaktformular: h-full → streckt sich auf linke Spalten-Hoehe (kein Freiraum mehr)
 *  C) Firmenkarte: Akzent-Topborder in Mieter-Farbe (Eleganz + Personalisierung)
 * Idempotent: Markervorabfrage pro Datei.
 */
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');

const OLD_BTNS = [
  `        +(waNum&&waOn?'<p class="mt-3"><a href="https://wa.me/'+waNum+'" target="_blank" rel="noopener" class="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition">💬 WhatsApp schreiben</a></p>':'')`,
  `        +(web&&webOn?'<p class="mt-3"><a href="'+esc(web)+'" target="_blank" rel="noopener" class="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition">🌐 Zur Website</a></p>':'')`,
  `        +(gbp&&gbpOn?'<p class="mt-3"><a href="'+esc(gbp)+'" target="_blank" rel="noopener" class="inline-flex items-center gap-2 bg-ink-900 hover:bg-ink-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition">⭐ Google-Bewertungen</a></p>':'')`,
].join('\n');

const NEW_BTNS = [
  `        +((waNum&&waOn)||(web&&webOn)||(gbp&&gbpOn)?'<div class="mt-4 flex flex-wrap gap-3">'`,
  `        +(waNum&&waOn?'<a href="https://wa.me/'+waNum+'" target="_blank" rel="noopener" class="flex-1 min-w-[9.5rem] inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-3 rounded-lg transition">💬 WhatsApp schreiben</a>':'')`,
  `        +(web&&webOn?'<a href="'+esc(web)+'" target="_blank" rel="noopener" class="flex-1 min-w-[9.5rem] inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-4 py-3 rounded-lg transition">🌐 Zur Website</a>':'')`,
  `        +(gbp&&gbpOn?'<a href="'+esc(gbp)+'" target="_blank" rel="noopener" class="flex-1 min-w-[9.5rem] inline-flex items-center justify-center gap-2 bg-ink-900 hover:bg-ink-700 text-white text-sm font-bold px-4 py-3 rounded-lg transition">⭐ Google-Bewertungen</a>':'')`,
  `        +'</div>':'')`,
].join('\n');

const OLD_FORM = `<form id="kontaktForm" class="bg-white rounded-2xl shadow-lg border border-ink-100 p-7 sm:p-10" onsubmit="event.preventDefault(); submitLead(this);">`;
const NEW_FORM = `<form id="kontaktForm" class="bg-white rounded-2xl shadow-lg border border-ink-100 p-7 sm:p-10 h-full" onsubmit="event.preventDefault(); submitLead(this);">`;

const OLD_CARD_CLS = `fb.className='mt-8 bg-white border border-ink-200 rounded-2xl p-6 shadow-sm';`;
const NEW_CARD_CLS = `fb.className='mt-8 bg-white border border-ink-200 rounded-2xl p-6 shadow-sm'; if(ac){fb.style.borderTop='4px solid '+ac;} /* Kontakt-Balance 2026-10-03 */`;

const files = fs.readdirSync(PUBLIC).filter(f => /^stadt-.*\.html$/.test(f)).sort();
let ok = 0, skipped = 0, failed = 0;
const failures = [];

for (const f of files) {
  const p = path.join(PUBLIC, f);
  let html = fs.readFileSync(p, 'utf8');
  const orig = html;
  try {
    // Idempotenz: neuer Button-Container schon vorhanden?
    if (html.includes("mt-4 flex flex-wrap gap-3") && html.includes('kontaktForm" class="bg-white rounded-2xl shadow-lg border border-ink-100 p-7 sm:p-10 h-full')) {
      skipped++; continue;
    }
    const nBtn = html.split(OLD_BTNS).length - 1;
    const nForm = html.split(OLD_FORM).length - 1;
    const nCard = html.split(OLD_CARD_CLS).length - 1;
    if (nBtn !== 1) throw new Error(`Button-Block gefunden: ${nBtn}x (erwartet 1x)`);
    if (nForm !== 1) throw new Error(`kontaktForm gefunden: ${nForm}x (erwartet 1x)`);
    if (nCard !== 1) throw new Error(`fb.className gefunden: ${nCard}x (erwartet 1x)`);
    html = html.replace(OLD_BTNS, NEW_BTNS).replace(OLD_FORM, NEW_FORM).replace(OLD_CARD_CLS, NEW_CARD_CLS);
    if (html === orig) throw new Error('keine Änderung trotz Match');
    // Sanity: Marker müssen jetzt drin sein, alte Struktur raus
    if (!html.includes('flex-1 min-w-[9.5rem]')) throw new Error('Marker fehlt nach Replace');
    if (html.includes('+<p class="mt-3"><a href="https://wa.me/')) throw new Error('alter Button-Code Rest');
    fs.writeFileSync(p, html);
    ok++;
  } catch (e) {
    failed++; failures.push(`${f}: ${e.message}`);
  }
}
console.log(`OK: ${ok} | skipped: ${skipped} | FAILED: ${failed} | total: ${files.length}`);
if (failures.length) { console.log('FEHLER:'); failures.forEach(x => console.log(' - ' + x)); process.exit(1); }
