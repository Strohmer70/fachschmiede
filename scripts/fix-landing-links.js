const fs = require('fs');
const path = require('path');

const publicDir = '/root/.openclaw/workspace/fachschmiede/public';
const blogDir = path.join(publicDir, 'blog');

// Artikel-Titel-Mapping
const TITLES = {
  '5-anzeichen-dachsanierung': '5 Anzeichen für nötige Dachsanierung',
  'dachdaemmung-foerderung': 'Dachdämmung fördern lassen',
  'sturmschaden-dach': 'Sturmschaden am Dach',
  'e-check-sicherheit': 'E-Check Sicherheit',
  'smart-home-nachruesten': 'Smart Home nachrüsten',
  'wallbox-zuhause': 'Wallbox Zuhause',
  'heizungs-check-winter': 'Heizungs-Check vor dem Winter',
  'rohrbruch-sofortmassnahmen': 'Rohrbruch Sofortmaßnahmen',
  'schimmel-wohnung': 'Schimmel in der Wohnung',
  'farben-raumwirkung': 'Farben & Raumwirkung',
  'fassade-streichen-kosten': 'Fassade streichen Kosten',
  'holzterrasse-pflegen': 'Holzterrasse pflegen',
  'carport-bauen': 'Carport bauen'
};

const files = fs.readdirSync(publicDir).filter(f => f.startsWith('stadt-') && f.endsWith('.html'));
let fixedCount = 0;

for (const file of files) {
  const match = file.match(/stadt-([a-z]+)-(.+)\.html$/);
  if (!match) continue;
  
  const trade = match[1];
  const city = match[2];
  
  const cityBlogDir = path.join(blogDir, trade, city);
  if (!fs.existsSync(cityBlogDir)) continue;
  
  const existingArticles = fs.readdirSync(cityBlogDir)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace('.html', ''));
  
  if (existingArticles.length === 0) continue;
  
  const filePath = path.join(publicDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  // Finde alle Blog-Links in dieser Landingpage
  const linkRegex = new RegExp(`href="/blog/${trade}/${city}/([^"]+)\\.html"`, 'g');
  const links = [...content.matchAll(linkRegex)];
  
  for (const linkMatch of links) {
    const fullMatch = linkMatch[0];
    const slug = linkMatch[1];
    
    if (!existingArticles.includes(slug)) {
      // Ersetze durch ersten existierenden Artikel
      const newSlug = existingArticles[0];
      const newHref = `href="/blog/${trade}/${city}/${newSlug}.html"`;
      content = content.replace(fullMatch, newHref);
      modified = true;
      console.log(`  ${file}: ${slug} -> ${newSlug}`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    fixedCount++;
  }
}

console.log(`\n✅ ${fixedCount} Landingpages gefixed`);
