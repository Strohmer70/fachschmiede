#!/usr/bin/env node
/**
 * ENNEPETAL + MÜNCHEN FAQ-KOMPLETTIERUNG
 *
 * Diese 10 Seiten (5 Gewerke × 2 Städte) haben 6 statt 8 FAQs,
 * weil das Upgrade-Skript sie übersprungen hat (kein CITY_DATA).
 * Hier werden die fehlenden Index 0+1 FAQ-Dropdowns nachgefügt.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const TARGETS = [];
for (const trade of ['dach', 'elek', 'klempner', 'zimm', 'maler']) {
  for (const city of ['ennepetal', 'muenchen']) {
    TARGETS.push(`stadt-${trade}-${city}.html`);
  }
}

// Index 0+1 FAQ-Templates (die ursprünglichen Extra-FAQs)
const MISSING_FAQS = {
  dach: (c) => [
    { q: `Wie oft sollte ich mein Dach in ${c} kontrollieren lassen?`, a: `Wir empfehlen eine jährliche Dachkontrolle — idealerweise im Frühjahr nach der Winterbelastung. In ${c} mit seiner Wetterlage ist das besonders wichtig. Viele Schäden sind von außen nicht sichtbar, werden aber mit der Zeit teuer.` },
    { q: `Lohnen sich Dachfenster in älteren Häusern in ${c}?`, a: `In vielen ${c}er Altbauten bringen Dachfenster enormen Mehrwert — mehr Licht, bessere Belüftung, mehr Wohnqualität. Wir beraten Sie gerne, ob Ihre Dachkonstruktion dafür geeignet ist.` },
  ],
  elek: (c) => [
    { q: `Ist meine alte Elektroinstallation in ${c} noch sicher?`, a: `Elektroinstallationen, die älter als 30 Jahre sind, sollten überprüft werden — besonders in den älteren Wohngebieten von ${c}. Ein E-Check gibt Ihnen Klarheit über den Zustand und eventuelle Mängel.` },
    { q: `Kann ich eine Wallbox an einem Reihenhaus in ${c} installieren lassen?`, a: `In den meisten Fällen ja! Die Nachkriegs-Reihenhäuser in ${c} lassen sich oft gut mit Wallboxen ausstatten. Wir prüfen Ihre Zuleitung und klären die Anmeldung beim Netzbetreiber für Sie.` },
  ],
  klempner: (c) => [
    { q: `Mein Haus in ${c} hat noch das Original-Bad — lohnt sich eine Sanierung?`, a: `Ein Badezimmer, das älter als 25 Jahre ist, lohnt fast immer eine Sanierung — nicht nur optisch, sondern auch energetisch und hygienisch. Gerade in den älteren Häusern in ${c} sind oft noch Bleirohre oder veraltete Abwassersysteme verbaut.` },
    { q: `Gibt es in ${c} Förderungen für eine neue Heizung?`, a: `Ja! Die Heizungsförderung 2026 deckt je nach Effizienzklasse bis zu 70% der Kosten ab. Wir beraten Sie gerne, welche Förderprogramme für Ihr Haus in ${c} geeignet sind und erstellen einen förderkonformen Kostenvoranschlag.` },
  ],
  zimm: (c) => [
    { q: `Wie lange hält ein Dachstuhl in ${c}?`, a: `Ein gut gebauter Dachstuhl kann 80 bis 100 Jahre halten — wenn er gepflegt wird. In ${c} mit seiner Wetterlage empfehlen wir alle 10 Jahre eine fachkundige Kontrolle, besonders nach Sturmschäden.` },
    { q: `Bauen Sie auch Carports in ${c}?`, a: `Ja! Ein Holz-Carport passt wunderbar zu den Einfamilienhäusern und Reihenhäusern in ${c}. Wir planen individuell — vom einfachen Doppelcarport bis zur Überdachung mit Solarpotenzial.` },
  ],
  maler: (c) => [
    { q: `Wie oft muss eine Fassade in ${c} gestrichen werden?`, a: `Je nach Material und Witterung alle 10 bis 15 Jahre. In ${c} mit seiner Wetterlage kann es auch früher nötig werden — besonders bei Süd- und Westfassaden. Wir überprüfen Ihre Fassade gerne kostenlos vor Ort.` },
    { q: `Welche Farben passen zu einem Altbau in ${c}?`, a: `Das hängt vom Baustil ab! Gründerzeit-Häuser in ${c} tragen oft kräftigere Töne, während Nachkriegsarchitektur mit helleren, sachlichen Farben harmoniert. Wir bringen Musterkarten mit und beraten Sie vor Ort.` },
  ],
};

const CITY_NAMES = { 'ennepetal': 'Ennepetal', 'muenchen': 'München' };

const CHEV = '<svg class="chev w-5 h-5 text-brand-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>';

function faqToDropdown(f) {
  return `<div class="faq-item reveal bg-white rounded-xl border border-ink-200">
        <button class="faq-q w-full flex items-center justify-between gap-4 px-6 py-5 text-left">
          <span class="font-bold text-ink-900">${f.q}</span>
          ${CHEV}
        </button>
        <div class="faq-answer"><p class="px-6 pb-5 text-ink-600 text-sm leading-relaxed">${f.a}</p></div>
      </div>`;
}

let added = 0, skipped = 0;

for (const file of TARGETS) {
  const match = file.match(/^stadt-([a-z]+)-(.+)\.html$/);
  const tradeKey = match[1];
  const citySlug = match[2];
  const cityName = CITY_NAMES[citySlug];
  const filePath = path.join(PUBLIC_DIR, file);

  if (!fs.existsSync(filePath)) { console.log(`  ⚠️ ${file} nicht gefunden`); continue; }

  let html = fs.readFileSync(filePath, 'utf8');

  const faqs = MISSING_FAQS[tradeKey](cityName);
  const firstQ = faqs[0].q;
  if (html.includes(firstQ)) { skipped++; continue; }

  // Füge VOR den neuen FAQs (Index 2+3) ein — suche die erste neue FAQ
  const existingNewFaq = MISSING_FAQS[tradeKey](cityName).length > 0
    ? `Wie schnell ist der Sanitär-Notdienst in ${cityName}` // klempner marker
    : null;

  // Einfacher: Füge am Ende des space-y-4 Containers ein (nach allen bisherigen)
  const faqSection = html.indexOf('id="faq"');
  const sectionClose = html.indexOf('</section>', faqSection);
  const insertPoint = html.lastIndexOf('    </div>\n  </div>\n</section>', sectionClose + 20);

  const block = '\n      ' + faqs.map(faqToDropdown).join('\n      ');
  if (insertPoint > faqSection) {
    html = html.slice(0, insertPoint) + block + html.slice(insertPoint);
  } else {
    const fallback = html.indexOf('</section>', faqSection);
    html = html.slice(0, fallback) + block + '\n' + html.slice(fallback);
  }

  fs.writeFileSync(filePath, html);
  added++;
  console.log(`  ✅ ${file}: +${faqs.length} FAQs`);
}

console.log(`\n✅ Hinzugefügt: ${added} | ⏭️ Bereits da: ${skipped}`);
