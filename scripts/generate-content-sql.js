#!/usr/bin/env node
/**
 * Content Generator als SQL-Output
 * Gibt UPDATE-Statements aus, die im Supabase SQL Editor ausgeführt werden können
 */

const fs = require('fs');
const path = require('path');

// Lade .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  });
}

// Templates (kopiert aus generate-landing-content.js)
const TEMPLATES = {
  'dachdecker': {
    hero_title: '{trade} in {city}. Festpreis. Feste Termine.',
    hero_subtitle: 'Ein Dach zeigt seine Schwächen meist erst, wenn es zu spät ist – undichte Stellen, lose Ziegel, verstopfte Rinnen. In {city} schauen wir uns Ihr Dach kostenlos an und sagen Ihnen ehrlich, was nötig ist und was warten kann.',
    faq: [
      { q: 'Was kostet eine Dachreparatur in {city}?', a: 'Die Kosten hängen vom Umfang der Schäden ab. Nach der kostenlosen Besichtigung erhalten Sie einen verbindlichen Festpreis – ohne versteckte Kosten.' },
      { q: 'Wie lange dauert eine Dachsanierung?', a: 'Die Dauer hängt vom Projekt ab. Eine typische Sanierung dauert zwischen einer Woche und drei Wochen.' },
      { q: 'Gibt es eine Garantie auf Dacharbeiten?', a: 'Ja, wir gewährleisten auf alle Dacharbeiten eine umfassende Garantie.' },
      { q: 'Bieten Sie kostenlose Besichtigungen an?', a: 'Ja, wir bieten eine kostenlose und unverbindliche Erstbesichtigung vor Ort an.' },
    ],
  },
  'elektriker': {
    hero_title: '{trade} in {city}. Sicher. Kompetent. Vor Ort.',
    hero_subtitle: 'Ob Stromausfall, neue Elektroinstallation oder Smart-Home-Umstellung – in {city} sind wir Ihr zuverlässiger Partner für alle elektrischen Arbeiten. Kostenlose Erstberatung vor Ort.',
    faq: [
      { q: 'Was kostet eine Elektroinstallation in {city}?', a: 'Die Kosten hängen vom Umfang ab. Wir erstellen Ihnen ein kostenloses Angebot vor Ort.' },
      { q: 'Wie schnell sind Sie bei einem Stromausfall vor Ort?', a: 'Bei Notfällen sind wir in der Regel innerhalb von 1-2 Stunden in {city} vor Ort.' },
      { q: 'Erhalten Sie auch Elektro-Gutachten?', a: 'Ja, wir erstellen Elektro-Gutachten für Versicherungen und Behörden.' },
      { q: 'Sind Sie für Smart-Home-Installationen zertifiziert?', a: 'Ja, wir sind auf Smart-Home-Systeme spezialisiert und beraten Sie gerne kostenlos.' },
    ],
  },
  'klempner': {
    hero_title: '{trade} in {city}. Schnell. Sauber. Fair.',
    hero_subtitle: 'Rohrbruch, Heizungsausfall oder neue Sanitärinstallation – in {city} sind wir Ihr zuverlässiger Klempner. 24h-Notdienst, transparente Preise, feste Termine.',
    faq: [
      { q: 'Was kostet ein Klempner in {city}?', a: 'Wir berechnen transparente Festpreise. Nach der kostenlosen Besichtigung erhalten Sie ein verbindliches Angebot.' },
      { q: 'Bieten Sie einen 24h-Notdienst an?', a: 'Ja, unser Notdienst ist rund um die Uhr für Sie da – auch an Wochenenden und Feiertagen.' },
      { q: 'Wie lange dauert eine Heizungsinstallation?', a: 'Eine komplette Heizungsinstallation dauert in der Regel 1-3 Tage, je nach Umfang.' },
      { q: 'Reparieren Sie auch Rohrbrüche?', a: 'Ja, Rohrbrüche gehören zu unseren Kernkompetenzen. Wir finden die Leckage und reparieren sie fachgerecht.' },
    ],
  },
  'maler': {
    hero_title: '{trade} in {city}. Farbe, die hält.',
    hero_subtitle: 'Ob Neuanstrich, Renovierung oder kreative Wandgestaltung – in {city} bringen wir Farbe in Ihr Leben. Kostenlose Beratung, Festpreis-Garantie, saubere Arbeit.',
    faq: [
      { q: 'Was kostet ein Maler in {city}?', a: 'Die Kosten hängen von der Fläche und den Anforderungen ab. Wir erstellen Ihnen ein kostenloses Angebot vor Ort.' },
      { q: 'Wie lange dauert ein Raum streichen?', a: 'Ein durchschnittlicher Raum (20m²) dauert etwa 1-2 Tage inklusive Trocknungszeit.' },
      { q: 'Verwenden Sie ökologische Farben?', a: 'Ja, wir bieten eine große Auswahl an umweltfreundlichen und lösemittelfreien Farben an.' },
      { q: 'Übernehmen Sie auch Tapezierarbeiten?', a: 'Ja, wir sind auch auf Tapezierarbeiten spezialisiert – von Vliestapete bis zu exklusiven Designer-Tapeten.' },
    ],
  },
  'zimmerer': {
    hero_title: '{trade} in {city}. Solide. Traditionell. Innovativ.',
    hero_subtitle: 'Vom Carport bis zur Dachkonstruktion – in {city} realisieren wir Ihre Holzprojekte mit Handwerkskunst und moderner Technik. Kostenlose Beratung vor Ort.',
    faq: [
      { q: 'Was kostet ein Carport in {city}?', a: 'Die Kosten hängen von Größe und Material ab. Wir erstellen Ihnen ein kostenloses Angebot mit Festpreis-Garantie.' },
      { q: 'Wie lange hält eine Holzkonstruktion?', a: 'Mit fachgerechter Behandlung halten unsere Holzkonstruktionen 30-50 Jahre und länger.' },
      { q: 'Arbeiten Sie auch mit Fichtenholz?', a: 'Ja, wir verarbeiten alle gängigen Holzarten – von Fichte über Lärche bis zur Eiche.' },
      { q: 'Bieten Sie auch Reparaturen an?', a: 'Ja, wir reparieren und sanieren bestehende Holzkonstruktionen fachgerecht.' },
    ],
  },
};

function generateContent(tradeSlug, city) {
  const tmpl = TEMPLATES[tradeSlug];
  if (!tmpl) return null;

  const tradeNames = {
    'dachdecker': 'Dachdecker',
    'elektriker': 'Elektriker',
    'klempner': 'Klempner',
    'maler': 'Maler',
    'zimmerer': 'Zimmerer',
  };

  const trade = tradeNames[tradeSlug] || tradeSlug;

  return {
    hero_title: tmpl.hero_title.replace(/{trade}/g, trade).replace(/{city}/g, city),
    hero_subtitle: tmpl.hero_subtitle.replace(/{city}/g, city),
    faq: tmpl.faq.map(f => ({
      q: f.q.replace(/{city}/g, city),
      a: f.a.replace(/{city}/g, city),
    })),
  };
}

function main() {
  console.log('-- Content Migration SQL');
  console.log('-- Ausführen im Supabase SQL Editor');
  console.log('');

  // Beispiel-Städte pro Gewerk (aus existierenden Seiten)
  const examples = [
    { trade: 'dachdecker', city: 'Hattingen', file: 'stadt-dach-hattingen.html' },
    { trade: 'elektriker', city: 'Bochum', file: 'stadt-elek-bochum.html' },
    { trade: 'klempner', city: 'Dortmund', file: 'stadt-klempner-dortmund.html' },
    { trade: 'maler', city: 'Hagen', file: 'stadt-maler-hagen.html' },
    { trade: 'zimmerer', city: 'Herne', file: 'stadt-zimm-herne.html' },
  ];

  for (const ex of examples) {
    const content = generateContent(ex.trade, ex.city);
    if (!content) continue;

    const contentJson = JSON.stringify(content).replace(/'/g, "''");

    console.log(`-- ${ex.trade} - ${ex.city}`);
    console.log(`UPDATE pages SET content_json = '${contentJson}'`);
    console.log(`WHERE slug LIKE '${ex.trade}-%';`);
    console.log('');
  }

  console.log('-- Verifizierung');
  console.log('SELECT slug, content_json->>\'hero_title\' as hero_title FROM pages WHERE content_json IS NOT NULL LIMIT 5;');
}

main();
