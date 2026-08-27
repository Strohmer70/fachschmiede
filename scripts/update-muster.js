#!/usr/bin/env node
/**
 * Kopiere existierende Stadtseiten als Gewerk-Musterseiten.
 * Minimal-Anpassungen: Title, Demo-Hinweis, Links.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const GEWERKE = [
  { slug: 'dachdecker', source: 'stadt-dach-hattingen.html', target: 'index.html', city: 'Hattingen', name: 'Dachdecker' },
  { slug: 'elektriker', source: 'stadt-elek-bochum.html', target: 'elektriker.html', city: 'Bochum', name: 'Elektriker' },
  { slug: 'klempner', source: 'stadt-klempner-dortmund.html', target: 'klempner.html', city: 'Dortmund', name: 'Klempner' },
  { slug: 'maler', source: 'stadt-maler-hagen.html', target: 'maler.html', city: 'Hagen', name: 'Maler' },
  { slug: 'zimmerer', source: 'stadt-zimm-herne.html', target: 'zimmerer.html', city: 'Herne', name: 'Zimmerer' },
];

for (const g of GEWERKE) {
  const srcPath = path.join(PUBLIC_DIR, g.source);
  const dstPath = path.join(PUBLIC_DIR, g.target);

  if (!fs.existsSync(srcPath)) {
    console.error(`❌ Quelldatei fehlt: ${g.source}`);
    continue;
  }

  let html = fs.readFileSync(srcPath, 'utf-8');

  // Title: "Dachdecker Hattingen | Miet-Website zum Anmieten – DEMO" → "Dachdecker Hattingen | Musterseite"
  html = html.replace(
    `${g.name} ${g.city} | Miet-Website zum Anmieten – DEMO`,
    `${g.name} ${g.city} | Musterseite zur Anmietung`
  );

  // Meta description: "Miet-Website (Demo):" → "Musterseite:"
  html = html.replace('Miet-Website (Demo):', 'Musterseite:');

  // Demo-Banner Text aktualisieren
  html = html.replace(
    /⚠️ MUSTERSEITE – Beispiel einer Miet-Website für Handwerksbetriebe\. Alle Inhalte, Namen, Bilder und Bewertungen sind fiktiv\./,
    `⚠️ MUSTERSEITE – Beispiel einer Miet-Website für ${g.name}. Alle Inhalte sind fiktiv. Echte Website zur Anmietung verfügbar.`
  );

  // Salespage-Link im Header: von ?stadt=... auf reine Salespage
  html = html.replace(
    new RegExp(`href="/sales-${g.slug}\.html\\?stadt=[^"]*"`, 'g'),
    `href="/sales-${g.slug}.html"`
  );

  fs.writeFileSync(dstPath, html, 'utf-8');
  console.log(`✅ ${g.target} ← ${g.source} (${Math.round(html.length / 1024)} KB)`);
}

console.log('\n🏁 Fertig!');
