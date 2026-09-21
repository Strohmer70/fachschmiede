#!/usr/bin/env node
/**
 * FAQ-ERWEITERUNG: 2 → 4 stadtspezifische FAQs pro Gewerk
 *
 * Problem: Bestehende Seiten haben 4 Original + 2 Extra = 6 FAQs.
 * Ziel (wie Gartenbau): 4 allgemeine + 4 stadtspezifische = 8 FAQs.
 *
 * Dieses Skript fügt die fehlenden 2 FAQ-Dropdowns (Index 2+3) ein.
 * Idempotent: Prüft ob Frage schon existiert, überspringt dann.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const files = fs.readdirSync(PUBLIC_DIR).filter(f => f.startsWith('stadt-') && f.endsWith('.html'));
console.log(`📂 ${files.length} Stadt-Dateien\n`);

// Stadt-Mapping: slug → Display-Name
const CITIES = {
  'bochum': 'Bochum', 'dortmund': 'Dortmund', 'hagen': 'Hagen', 'herne': 'Herne',
  'iserlohn': 'Iserlohn', 'witten': 'Witten', 'kamen': 'Kamen', 'luenen': 'Lünen',
  'schwerte': 'Schwerte', 'schwelm': 'Schwelm', 'hattingen': 'Hattingen',
  'gevelsberg': 'Gevelsberg', 'ennepetal': 'Ennepetal', 'bergkamen': 'Bergkamen',
  'castrop-rauxel': 'Castrop-Rauxel', 'holzwickede': 'Holzwickede',
  'froendenberg': 'Fröndenberg', 'sprockhoevel': 'Sprockhövel',
  'unna': 'Unna', 'muenchen': 'München', 'wetter-ruhr': 'Wetter (Ruhr)'
};

// NEUE FAQ-Templates (Index 2+3 pro Gewerk)
const NEW_FAQS = {
  dach: (c) => [
    { q: `Kann ich in ${c} Solarmodule auf mein Dach montieren lassen?`, a: `In den meisten Fällen ja! Wir prüfen die Statik Ihrer Dachkonstruktion und ob die Ausrichtung für Solar geeignet ist. In ${c} gibt es oft zusätzliche Förderprogramm auf Landesebene, die sich mit dem Bundessolarpaket kombinieren lassen. Den Antrag übernehmen wir für Sie.` },
    { q: `Mein Dach in ${c} ist undicht — was sollte ich sofort tun?`, a: `Erstens: Sicherheit — Wasser und Strom vertragen sich nicht. Zweitens: Leckage mit Eimer auffangen und Möbel wegräumen. Drittens: uns anrufen! In ${c} erreichen Sie unseren Notdienst auch am Wochenende. Wir machen die Erstabsicherung und dokumentieren alles für Ihre Versicherung.` },
  ],
  elek: (c) => [
    { q: `Was kostet ein E-Check für mein Haus in ${c}?`, a: `Ein E-Check für ein Einfamilienhaus in ${c} beginnt bei etwa 120 € — je nach Anzahl der Stromkreise und dem Alter der Anlage. Bei Befund bekommen Sie ein zertifiziertes Prüfprotokoll, das auch für Ihre Versicherung wertvoll ist.` },
    { q: `Bieten Sie Smart-Home-Installationen in ${c} an?`, a: `Ja! Von intelligenter Beleuchtung über Heizungssteuerung bis zur Einbruchmeldeanlage — wir rüsten Bestandsgebäude in ${c} nach und achten darauf, dass alles über eine App zentral steuerbar bleibt. KNX oder offene Standards, ganz wie Sie wollen.` },
  ],
  klempner: (c) => [
    { q: `Wie schnell ist der Sanitär-Notdienst in ${c} vor Ort?`, a: `In ${c} sind wir im Schnitt innerhalb von 60 bis 90 Minuten bei Ihnen — rund um die Uhr, auch an Wochenenden und Feiertagen. Unsere Fahrzeuge sind komplett ausgestattet, sodass die meisten Notfälle direkt vor Ort behoben werden können.` },
    { q: `Was kostet eine Badsanierung in ${c} im Durchschnitt?`, a: `Eine Komplettsanierung eines Bades in ${c} beginnt bei etwa 8.000 € — je nach Größe, Ausstattung und ob Rohrleitungen erneuert werden müssen. Wir erstellen Ihnen ein detailliertes Angebot mit Festpreis, ohne versteckte Kosten.` },
  ],
  zimm: (c) => [
    { q: `Was kostet eine Terrassenüberdachung in ${c}?`, a: `Eine maßgefertigte Terrassenüberdachung aus Holz in ${c} beginnt bei etwa 6.000 € — je nach Größe, Dachart und ob Sie eine Verglasung oder ein Solargdach wünschen. Die Statik und Statiknachweise übernehmen wir komplett.` },
    { q: `Ist Holzbau in ${c} nachhaltig und langlebig?`, a: `Absolut! Holz ist der einzige Baustoff, der CO₂ speichert statt zu verbrauchen. Mit der richtigen Holzart und Konstruktion halten unsere Bauwerke in ${c} Jahrzehnte — und sehen dabei noch großartig aus.` },
  ],
  maler: (c) => [
    { q: `Was kostet der Innenanstrich eines Zimmers in ${c}?`, a: `Je nach Größe, Untergrund und Farbqualität beginnen die Kosten für ein Wohnzimmer in ${c} bei etwa 400 €. Inklusive Abkleben, Grundierung und zwei Schichten hochwertiger Wandfarbe. Transparentes Angebot ohne versteckte Positionen.` },
    { q: `Gibt es Vorschriften für Fassadenfarben in ${c}?`, a: `In Denkmalschutzbereichen von ${c} gibt es tatsächlich Farbvorgaben — wir kennen die örtlichen Richtlinien und stimmen uns bei Bedarf mit dem Denkmalamt ab. Für alle anderen Gebäude in ${c} haben Sie freie Farbwahl.` },
  ],
};

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

let added = 0, skipped = 0, errors = [];

for (const file of files) {
  try {
    const match = file.match(/^stadt-([a-z]+)-(.+)\.html$/);
    if (!match) continue;
    const tradeKey = match[1];
    const citySlug = match[2];

    if (!NEW_FAQS[tradeKey]) continue; // Gartenbau hat schon 4+
    const cityName = CITIES[citySlug];
    if (!cityName) { errors.push(`${file}: unbekannte Stadt`); continue; }

    const filePath = path.join(PUBLIC_DIR, file);
    let html = fs.readFileSync(filePath, 'utf8');

    // Idempotenz: Prüfe ob erste neue FAQ schon existiert
    const newFaqs = NEW_FAQS[tradeKey](cityName);
    const firstQ = newFaqs[0].q;
    if (html.includes(firstQ)) { skipped++; continue; }

    // Finde das Ende des space-y-4 FAQ-Containers (vor max-w-3xl + section-ende)
    const faqSection = html.indexOf('id="faq"');
    if (faqSection < 0) { errors.push(`${file}: keine FAQ-Section`); continue; }

    const sectionClose = html.indexOf('</section>', faqSection);
    // Pattern: "    </div>\n  </div>\n</section>" am Ende der FAQ-Section
    const insertPoint = html.lastIndexOf('    </div>\n  </div>\n</section>', sectionClose + 20);

    if (insertPoint <= faqSection) {
      // Fallback: vor </section>
      const fallback = html.indexOf('</section>', faqSection);
      const block = '\n      ' + newFaqs.map(faqToDropdown).join('\n      ');
      html = html.slice(0, fallback) + block + '\n' + html.slice(fallback);
    } else {
      const block = '\n      ' + newFaqs.map(faqToDropdown).join('\n      ');
      html = html.slice(0, insertPoint) + block + html.slice(insertPoint);
    }

    fs.writeFileSync(filePath, html);
    added++;
    console.log(`  ✅ ${file}: +${newFaqs.length} FAQs (${newFaqs.map(f => f.q.substring(0, 40)).join(' | ')})`);
  } catch (e) {
    errors.push(`${file}: ${e.message}`);
  }
}

console.log(`\n════════════════════════════════════`);
console.log(`✅ Hinzugefügt: ${added} | ⏭️ Bereits vorhanden: ${skipped} | ❌ Fehler: ${errors.length}`);
if (errors.length) console.log(errors.join('\n'));
