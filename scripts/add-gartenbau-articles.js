const fs = require('fs');
const path = require('path');

// Lies die aktuelle article-index.json
const articleIndexPath = path.join(__dirname, '../public/lib/article-index.json');
const articleIndex = JSON.parse(fs.readFileSync(articleIndexPath, 'utf-8'));

// Alle Städte aus der system-config.js
const cities = [
  'bergkamen', 'bochum', 'castrop-rauxel', 'dortmund', 'ennepetal',
  'froendenberg', 'gevelsberg', 'hagen', 'hattingen', 'herne',
  'holzwickede', 'iserlohn', 'kamen', 'luenen', 'schwelm',
  'schwerte', 'sprockhoevel', 'unna', 'wetter-ruhr', 'witten'
];

// Stadtname-Mapping
const cityNames = {
  'bergkamen': 'Bergkamen',
  'bochum': 'Bochum',
  'castrop-rauxel': 'Castrop-Rauxel',
  'dortmund': 'Dortmund',
  'ennepetal': 'Ennepetal',
  'froendenberg': 'Fröndenberg',
  'gevelsberg': 'Gevelsberg',
  'hagen': 'Hagen',
  'hattingen': 'Hattingen',
  'herne': 'Herne',
  'holzwickede': 'Holzwickede',
  'iserlohn': 'Iserlohn',
  'kamen': 'Kamen',
  'luenen': 'Lünen',
  'schwelm': 'Schwelm',
  'schwerte': 'Schwerte',
  'sprockhoevel': 'Sprockhövel',
  'unna': 'Unna',
  'wetter-ruhr': 'Wetter (Ruhr)',
  'witten': 'Witten'
};

// SVG Icon für Gartenbau
const gardenSvg = '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>';

// Generiere Gartenbau-Artikel für jede Stadt
const gartenbauArticles = {};

for (const citySlug of cities) {
  const cityName = cityNames[citySlug];
  
  gartenbauArticles[citySlug] = [
    {
      title: `Gartenplanung in ${cityName}: Ideen & Kosten`,
      excerpt: "Wertvolle Tipps und Fachwissen für Ihr Projekt.",
      tag: "Ratgeber",
      gradient: "from-accent-500 to-accent-700",
      svg: gardenSvg,
      url: `/garten-und-landschaftsbau/${citySlug}/blog/gartenplanung-ideen/`
    },
    {
      title: `Rasen neu anlegen in ${cityName}: Kosten & Pflege`,
      excerpt: "Wertvolle Tipps und Fachwissen für Ihr Projekt.",
      tag: "Ratgeber",
      gradient: "from-accent-500 to-accent-700",
      svg: gardenSvg,
      url: `/garten-und-landschaftsbau/${citySlug}/blog/rasen-neuanlage/`
    },
    {
      title: `Terrasse bauen in ${cityName}: Materialien & Kosten`,
      excerpt: "Wertvolle Tipps und Fachwissen für Ihr Projekt.",
      tag: "Ratgeber",
      gradient: "from-accent-500 to-accent-700",
      svg: gardenSvg,
      url: `/garten-und-landschaftsbau/${citySlug}/blog/terrasse-bauen/`
    }
  ];
}

// Füge Gartenbau zum Index hinzu
articleIndex['garten-und-landschaftsbau'] = gartenbauArticles;

// Speichere die aktualisierte Datei
fs.writeFileSync(articleIndexPath, JSON.stringify(articleIndex, null, 2));

console.log('✅ Gartenbau-Artikel erfolgreich hinzugefügt!');
console.log(`📊 Statistik:`);
console.log(`   - Gewerke im Index: ${Object.keys(articleIndex).length}`);
console.log(`   - Städte pro Gewerk: ${Object.keys(gartenbauArticles).length}`);
console.log(`   - Artikel pro Stadt: 3`);
console.log(`   - Neue Artikel gesamt: ${Object.keys(gartenbauArticles).length * 3}`);
