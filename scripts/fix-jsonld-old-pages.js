#!/usr/bin/env node
/**
 * BATCH-FIX: JSON-LD LocalBusiness auf alle 126 alten stadt-*.html Seiten
 * Fügt strukturierte Daten im <head> hinzu — KEIN sichtbarer Design-Change!
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// ─── Trade Config ───
const TRADES = {
  dach: {
    name: 'Dachdecker',
    schemaType: 'RoofingContractor',
    services: ['Dachsanierung', 'Dachreparatur', 'Dachdämmung', 'Dachrinnenreinigung', 'Sturmschaden-Reparatur'],
    description: (city) => `Dachdecker in ${city} – Dachsanierung, Reparatur & Dämmung. Festpreis. Feste Termine. Kostenlose Besichtigung.`,
  },
  elek: {
    name: 'Elektriker',
    schemaType: 'Electrician',
    services: ['Elektroinstallation', 'Smart Home', 'Wallbox-Installation', 'E-Check', 'Leitungsreparatur'],
    description: (city) => `Elektriker in ${city} – Elektroinstallation, Smart Home & Wallbox. Festpreis. Feste Termine.`,
  },
  klempner: {
    name: 'Klempner',
    schemaType: 'Plumber',
    services: ['Badsanierung', 'Heizungsinstallation', 'Rohrreinigung', 'Notdienst', 'Klempnerarbeiten'],
    description: (city) => `Klempner & SHK-Meisterbetrieb in ${city} – Sanitär, Heizung, Badsanierung & Notdienst. Festpreis. Feste Termine.`,
  },
  zimm: {
    name: 'Zimmerer',
    schemaType: 'Carpenter',
    services: ['Dachstuhl', 'Holzbau', 'Carport', 'Terrassenüberdachung', 'Innenausbau'],
    description: (city) => `Zimmerer in ${city} – Dachstuhl, Holzbau & Carport. Festpreis. Feste Termine.`,
  },
  maler: {
    name: 'Maler',
    schemaType: 'Painter',
    services: ['Innenanstrich', 'Fassadenanstrich', 'Trockenbau', 'Lackieren', 'Tapezieren'],
    description: (city) => `Maler in ${city} – Innenanstrich, Fassade & Trockenbau. Festpreis. Feste Termine.`,
  },
  garten: {
    name: 'Garten- und Landschaftsbau',
    schemaType: 'LandscapingBusiness',
    services: ['Gartengestaltung', 'Terrassenbau', 'Pflasterarbeiten', 'Gartenpflege', 'Zaunbau'],
    description: (city) => `Garten- und Landschaftsbau in ${city} – Gartengestaltung, Terrassen & Pflege. Festpreis. Feste Termine.`,
  },
};

// ─── City Names (proper capitalization) ───
const CITY_NAMES = {
  'bochum': 'Bochum',
  'dortmund': 'Dortmund',
  'hagen': 'Hagen',
  'herne': 'Herne',
  'witten': 'Witten',
  'iserlohn': 'Iserlohn',
  'unna': 'Unna',
  'schwerte': 'Schwerte',
  'kamen': 'Kamen',
  'luenen': 'Lünen',
  'bergkamen': 'Bergkamen',
  'castrop-rauxel': 'Castrop-Rauxel',
  'wetter-ruhr': 'Wetter (Ruhr)',
  'schwelm': 'Schwelm',
  'enneetal': 'Ennepetal',
  'gevelsberg': 'Gevelsberg',
  'hattingen': 'Hattingen',
  'holzwickede': 'Holzwickede',
  'sprockhoevel': 'Sprockhövel',
  'froendenberg': 'Fröndenberg',
  'muenchen': 'München',
};

function getCityName(slug) {
  return CITY_NAMES[slug] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function generateJSONLD(tradeKey, citySlug) {
  const trade = TRADES[tradeKey];
  const cityName = getCityName(citySlug);
  const url = `https://www.fachschmiede.de/${tradeKey === 'garten' ? 'gartenbau' : trade.name.toLowerCase()}/${citySlug}/`;
  
  const schema = {
    "@context": "https://schema.org",
    "@type": trade.schemaType,
    "@id": `${url}#business`,
    "name": `${trade.name} ${cityName}`,
    "description": trade.description(cityName),
    "url": url,
    "telephone": "+49-2304-12345678",
    "priceRange": "€€",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": cityName,
      "addressRegion": "NRW",
      "addressCountry": "DE"
    },
    "areaServed": {
      "@type": "City",
      "name": cityName
    },
    "geo": {
      "@type": "GeoCoordinates",
      "address": `${cityName}, Germany`
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "07:00",
      "closes": "18:00"
    },
    "knowsAbout": trade.services,
    "serviceType": trade.services,
    "additionalType": "https://www.fachschmiede.de/",
    "isPartOf": {
      "@type": "WebSite",
      "name": "fachschmiede.de",
      "url": "https://www.fachschmiede.de"
    }
  };
  
  return JSON.stringify(schema, null, 2);
}

let updated = 0;
let skipped = 0;

for (const tradeKey of Object.keys(TRADES)) {
  const files = fs.readdirSync(PUBLIC_DIR)
    .filter(f => f.startsWith(`stadt-${tradeKey}-`) && f.endsWith('.html'));
  
  for (const file of files) {
    const filePath = path.join(PUBLIC_DIR, file);
    const citySlug = file.replace(`stadt-${tradeKey}-`, '').replace('.html', '');
    
    let html = fs.readFileSync(filePath, 'utf-8');
    
    // Skip if JSON-LD already exists
    if (html.includes('application/ld+json')) {
      console.log(`  ⏭️  ${file} — already has JSON-LD`);
      skipped++;
      continue;
    }
    
    // Skip if no </head> tag
    if (!html.includes('</head>')) {
      console.log(`  ⚠️  ${file} — no </head> found`);
      skipped++;
      continue;
    }
    
    const jsonld = generateJSONLD(tradeKey, citySlug);
    const scriptTag = `\n<!-- LocalBusiness Structured Data -->\n<script type="application/ld+json">\n${jsonld}\n</script>\n`;
    
    // Insert before </head>
    html = html.replace('</head>', `${scriptTag}</head>`);
    
    fs.writeFileSync(filePath, html, 'utf-8');
    updated++;
    console.log(`  ✅ ${file} — JSON-LD (${tradeKey}/${citySlug})`);
  }
}

console.log(`\n✅ Updated: ${updated} | ⏭️ Skipped: ${skipped}`);
