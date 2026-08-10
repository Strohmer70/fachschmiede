const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Mapping: generischer Artikel-Slug → korrekter Blog-Pfad (pro Gewerk)
const ARTICLE_MAP = {
  'dachdecker': {
    'artikel-sturmschaden-sofortmassnahmen': 'sturmschaden-dach',
    'artikel-dachdaemmung-foerderung': 'dachdaemmung-foerderung',
    'artikel-5-anzeichen-dachsanierung': '5-anzeichen-dachsanierung'
  },
  'elektriker': {
    'artikel-e-check-sicherheitspruefung': 'e-check-sicherheit',
    'artikel-smart-home-nachruesten': 'smart-home-nachruesten',
    'artikel-wallbox-zuhause': 'wallbox-zuhause'
  },
  'klempner': {
    'artikel-heizungstausch-foerderung': 'heizungstausch-foerderung',
    'artikel-rohrbruch-sofortmassnahmen': 'rohrbruch-sofortmassnahmen',
    'artikel-heizungs-check-winter': 'heizungs-check-winter'
  },
  'maler': {
    'artikel-fassade-streichen-kosten': 'fassade-streichen-kosten',
    'artikel-schimmel-wohnung': 'schimmel-wohnung',
    'artikel-farben-raumwirkung': 'farben-raumwirkung'
  },
  'zimmerer': {
    'artikel-carport-bauen': 'carport-bauen',
    'artikel-dachstuhl-sanieren': 'dachstuhl-sanieren',
    'artikel-holzterrasse-pflegen': 'holzterrasse-pflegen'
  }
};

// TRADE_MAP umkehren: dach → dachdecker
const TRADE_MAP = {
  'dach': 'dachdecker',
  'elek': 'elektriker',
  'zimm': 'zimmerer',
  'maler': 'maler',
  'shk': 'klempner'
};

// Funktion zum Konvertieren: /artikel-XXX.html → /blog/{gewerk}/{stadt}/XXX.html
function fixArticleLinks(content, tradeSlug, city) {
  const tradeKey = TRADE_MAP[tradeSlug] || tradeSlug;
  const mapping = ARTICLE_MAP[tradeKey];
  if (!mapping) return content;

  let result = content;
  
  for (const [genericSlug, blogSlug] of Object.entries(mapping)) {
    // Generischer Link: href="/artikel-XXX.html"
    const genericPattern = new RegExp(`href="/${genericSlug}\\.html"`, 'g');
    // Neuer lokalisierter Link: href="/blog/dachdecker/hagen/sturmschaden-dach.html"
    const localizedLink = `href="/blog/${tradeKey}/${city}/${blogSlug}.html"`;
    result = result.replace(genericPattern, localizedLink);
  }
  
  return result;
}

// Hauptfunktion
function fixAllCities() {
  const files = fs.readdirSync(publicDir).filter(f => f.startsWith('stadt-') && f.endsWith('.html'));
  let totalFixed = 0;
  
  for (const file of files) {
    // Parse: stadt-dach-hagen.html → trade=dach, city=hagen
    const match = file.match(/^stadt-([a-z]+)-(.+)\.html$/);
    if (!match) continue;
    
    const tradeSlug = match[1];
    const city = match[2];
    
    const filePath = path.join(publicDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;
    
    content = fixArticleLinks(content, tradeSlug, city);
    
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      const changes = (original.match(/href="\/artikel-/g) || []).length - (content.match(/href="\/artikel-/g) || []).length;
      totalFixed += changes;
      console.log(`✅ ${file}: ${changes} Links gefixt`);
    }
  }
  
  console.log(`\n🎉 Fertig! ${totalFixed} Artikel-Links auf lokalisierte Blog-Artikel umgebogen.`);
}

fixAllCities();
