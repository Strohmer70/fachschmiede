#!/usr/bin/env node
/**
 * Fix: Korrigiere Blog-Artikel-Links in allen Landingpages
 * Die Landingpages verweisen auf Artikel, die nicht existieren
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Mapping: Gewerk → tatsächlich existierende Artikel-Slugs
const TRADE_ARTICLES = {
  'dachdecker': ['5-anzeichen-dachsanierung', 'dachdaemmung-foerderung', 'sturmschaden-dach'],
  'elektriker': ['e-check-sicherheit', 'smart-home-nachruesten', 'wallbox-zuhause'],
  'klempner': ['heizungs-check-winter', 'rohrbruch-sofortmassnahmen', 'schimmel-wohnung'],
  'maler': ['farben-raumwirkung', 'fassade-streichen-kosten', 'holzterrasse-pflegen'],
  'zimmerer': ['carport-bauen', 'dachdaemmung-foerderung', 'holzterrasse-pflegen']
};

const TRADE_NAMES = {
  'dachdecker': 'Dachdecker',
  'elektriker': 'Elektriker',
  'klempner': 'Klempner',
  'maler': 'Maler',
  'zimmerer': 'Zimmerer'
};

function getCityFromFilename(filename) {
  // stadt-maler-froendenberg.html → froendenberg
  const match = filename.match(/stadt-[a-z]+-(.+)\.html$/);
  return match ? match[1] : null;
}

function getTradeFromFilename(filename) {
  // stadt-maler-froendenberg.html → maler
  const match = filename.match(/stadt-([a-z]+)-.+/);
  return match ? match[1] : null;
}

function capitalizeCity(citySlug) {
  return citySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

let fixedPages = 0;

// Finde alle stadt-*.html Dateien
const files = fs.readdirSync(publicDir).filter(f => f.startsWith('stadt-') && f.endsWith('.html'));

for (const file of files) {
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  const trade = getTradeFromFilename(file);
  const city = getCityFromFilename(file);
  
  if (!trade || !city || !TRADE_ARTICLES[trade]) continue;
  
  const cityName = capitalizeCity(city);
  const tradeName = TRADE_NAMES[trade];
  const articles = TRADE_ARTICLES[trade];
  
  // Prüfe ob falsche Links vorhanden sind
  const hasWrongLinks = articles.some(article => {
    // Prüfe ob Link auf diesen Artikel existiert
    const wrongPattern = new RegExp(`/blog/${trade}/${city}/(?!${articles.join('|')})[^"]+\.html`, 'g');
    return wrongPattern.test(content);
  });
  
  if (!hasWrongLinks && content.includes(`/blog/${trade}/${city}/`)) {
    // Bereits korrekt oder keine Links
    continue;
  }
  
  // Ersetze die Blog-Sektion
  // Finde den Blog-Bereich und ersetze ihn
  const blogSectionPattern = /(<h3[^>]*>Blog & Ratgeber<\/h3>[\s\S]*?)(<\/div>\s*<\/section>)/i;
  
  if (blogSectionPattern.test(content)) {
    const articleCards = articles.map((slug, idx) => {
      const titles = {
        '5-anzeichen-dachsanierung': '5 Anzeichen für nötige Dachsanierung',
        'dachdaemmung-foerderung': 'Dachdämmung fördern lassen',
        'sturmschaden-dach': 'Sturmschaden am Dach',
        'e-check-sicherheit': 'E-Check Sicherheit',
        'smart-home-nachruesten': 'Smart Home nachrüsten',
        'wallbox-zuhause': 'Wallbox Zuhause',
        'heizungs-check-winter': 'Heizungs-Check vor dem Winter',
        'rohrbruch-sofortmassnahmen': 'Rohrbruch Sofortmaßnahmen',
        'schimmel-wohnung': 'Schimmel in der Wohnung',
        'farben-raumwirkung': 'Farben und ihre Raumwirkung',
        'fassade-streichen-kosten': 'Fassade streichen Kosten',
        'holzterrasse-pflegen': 'Holzterrasse pflegen',
        'carport-bauen': 'Carport bauen'
      };
      
      const images = {
        '5-anzeichen-dachsanierung': 'dach,sanierung',
        'dachdaemmung-foerderung': 'dach,daemmung',
        'sturmschaden-dach': 'sturm,dach',
        'e-check-sicherheit': 'elektro,pruefung',
        'smart-home-nachruesten': 'smarthome,haus',
        'wallbox-zuhause': 'eauto,laden',
        'heizungs-check-winter': 'heizung,wartung',
        'rohrbruch-sofortmassnahmen': 'wasser,rohr',
        'schimmel-wohnung': 'schimmel,wand',
        'farben-raumwirkung': 'farbe,wand',
        'fassade-streichen-kosten': 'fassade,maler',
        'holzterrasse-pflegen': 'terrasse,holz',
        'carport-bauen': 'carport,holz'
      };
      
      return `
      <a href="/blog/${trade}/${city}/${slug}.html" class="reveal block bg-white rounded-2xl overflow-hidden border border-ink-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 group">
        <div class="relative h-48 overflow-hidden">
          <img src="https://images.unsplash.com/${images[slug] ? 'source/800x600/?' + images[slug] : 'photo-1600585154340-be6161a56a0c?w=800'}" alt="${titles[slug] || slug} ${cityName}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" loading="lazy">
        </div>
        <div class="p-5">
          <h4 class="font-semibold text-ink-900 mb-2 group-hover:text-accent-600 transition">${titles[slug] || slug}</h4>
          <p class="text-sm text-ink-500">Praktische Tipps für ${cityName} und Umgebung</p>
        </div>
      </a>`;
    }).join('');
    
    const newBlogSection = `<h3 class="text-2xl md:text-3xl font-bold text-ink-900 mb-8">Blog & Ratgeber</h3>
    <div class="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      ${articleCards}
    </div>
    <div class="text-center mt-8">
      <a href="/blog/${trade}/${city}/" class="inline-flex items-center px-6 py-3 bg-white border border-ink-200 rounded-full font-semibold text-ink-700 hover:border-accent-400 hover:text-accent-600 transition">
        Alle Artikel ansehen
        <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </a>
    </div>`;
    
    content = content.replace(blogSectionPattern, newBlogSection + '$2');
    fs.writeFileSync(filePath, content, 'utf-8');
    fixedPages++;
    console.log(`✅ Fixed: ${file}`);
  }
}

console.log(`\n✅ ${fixedPages} Landingpages gefixed`);
