#!/usr/bin/env node
/**
 * Generiere Musterseiten für jedes Gewerk basierend auf existierenden Stadtseiten.
 * Die Musterseiten behalten das Design der Stadtseiten bei und fügen Demo-Hinweise hinzu.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');

// Mapping: Gewerk → Quell-Stadtseite, Ziel-Datei, Beispiel-Stadt
const GEWERKE = [
  {
    slug: 'dachdecker',
    tradeKey: 'dach',
    sourceFile: 'stadt-dach-hattingen.html',
    targetFile: 'index.html',
    city: 'Hattingen',
    title: 'Dachdecker',
    color: '#ea580c', // brand-600
    heroImage: '/images/dachdecker-hero.jpg',
  },
  {
    slug: 'elektriker',
    tradeKey: 'elek',
    sourceFile: 'stadt-elek-bochum.html',
    targetFile: 'elektriker.html',
    city: 'Bochum',
    title: 'Elektriker',
    color: '#2563eb',
    heroImage: '/images/elektriker-hero.jpg',
  },
  {
    slug: 'klempner',
    tradeKey: 'klempner',
    sourceFile: 'stadt-klempner-dortmund.html',
    targetFile: 'klempner.html',
    city: 'Dortmund',
    title: 'Klempner',
    color: '#0891b2',
    heroImage: '/images/klempner-hero.jpg',
  },
  {
    slug: 'maler',
    tradeKey: 'maler',
    sourceFile: 'stadt-maler-hagen.html',
    targetFile: 'maler.html',
    city: 'Hagen',
    title: 'Maler',
    color: '#7c3aed',
    heroImage: '/images/maler-hero.jpg',
  },
  {
    slug: 'zimmerer',
    tradeKey: 'zimm',
    sourceFile: 'stadt-zimm-herne.html',
    targetFile: 'zimmerer.html',
    city: 'Herne',
    title: 'Zimmerer',
    color: '#059669',
    heroImage: '/images/zimmerer-hero.jpg',
  },
];

function generateMustache(g) {
  const sourcePath = path.join(PUBLIC_DIR, g.sourceFile);
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Quelldatei fehlt: ${g.sourceFile}`);
    return null;
  }

  let html = fs.readFileSync(sourcePath, 'utf-8');

  // 1. Title anpassen
  html = html.replace(
    new RegExp(`${g.title} ${g.city} \\| Miet-Website zum Anmieten – DEMO`, 'g'),
    `${g.title} ${g.city} | Miet-Website – MUSTERSEITE`
  );

  // 2. Meta description anpassen
  html = html.replace(
    /Miet-Website \(Demo\):/g,
    'Musterseite:'
  );

  // 3. Demo-Hinweis im Header verstärken
  const demoBanner = `<div class="bg-amber-400 text-ink-900 text-center text-xs sm:text-sm font-semibold py-2 px-4">
  ⚠️ MUSTERSEITE – Beispiel einer Miet-Website für ${g.title}. Alle Inhalte, Namen, Bilder und Bewertungen sind fiktiv. Die echte Website ist für Handwerker zur Anmietung verfügbar.
</div>`;

  html = html.replace(
    /<div class="bg-amber-400[^>]*>.*?<\/div>/s,
    demoBanner
  );

  // 4. Demo-Navigation: Aktuelles Gewerk hervorheben
  html = html.replace(
    new RegExp(`<a href="/muster/${g.slug}"[^>]*>`, 'g'),
    `<span class="text-white font-semibold">`
  );
  html = html.replace(
    new RegExp(`</a>(?=\s*<a href="/muster/(?!${g.slug})[^"]*">)`, 'g'),
    `</span>`
  );

  // 5. "Miet-Website · noch frei" im Header beibehalten
  // bereits korrekt in der Quelldatei

  // 6. Salespage-Links anpassen
  html = html.replace(
    new RegExp(`/sales-${g.slug}\.html\?stadt=${g.city.toLowerCase()}`, 'g'),
    `/sales-${g.slug}.html`
  );

  // 7. Footer: "MUSTERSITE" statt "Miet-Website"
  html = html.replace(
    new RegExp(`Miet-Website · noch frei`, 'g'),
    `MUSTERSEITE · zur Anmietung verfügbar`
  );

  // 8. E-Mail im Footer neutralisieren (falls vorhanden)
  html = html.replace(
    /hello@[\w.-]+\.de/g,
    'hello@fachschmiede.de'
  );

  // 9. Telefonnummer neutralisieren
  html = html.replace(
    /0151\s*\/\s*234\s*567\s*89/g,
    '0232 / 123 456 78'
  );

  // 10. WhatsApp-Link neutralisieren
  html = html.replace(
    /wa\.me\/49\d+/g,
    'wa.me/4915123456789'
  );

  return html;
}

function main() {
  console.log('🏗️  Generiere Musterseiten...\n');

  for (const g of GEWERKE) {
    console.log(`→ ${g.title} (${g.sourceFile} → ${g.targetFile})`);
    const html = generateMustache(g);
    if (html) {
      const targetPath = path.join(PUBLIC_DIR, g.targetFile);
      fs.writeFileSync(targetPath, html, 'utf-8');
      console.log(`   ✅ ${g.targetFile} geschrieben (${Math.round(html.length / 1024)} KB)`);
    }
  }

  console.log('\n✅ Alle Musterseiten aktualisiert!');
}

main();
