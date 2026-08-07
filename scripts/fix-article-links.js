const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Mapping: stadt-spezifischer Artikel-Präfix → generischer Artikel-Pfad
const ARTICLE_MAP = {
  'artikel-sturmschaden-sofort-': '/artikel-sturmschaden-sofortmassnahmen.html',
  'artikel-dachdaemmung-foerderung-': '/artikel-dachdaemmung-foerderung.html',
  'artikel-dachsanierung-anzeichen-': '/artikel-5-anzeichen-dachsanierung.html',
  'artikel-e-check-sicherheit-': '/artikel-e-check-sicherheitspruefung.html',
  'artikel-smart-home-nachruesten-': '/artikel-smart-home-nachruesten.html',
  'artikel-wallbox-zuhause-': '/artikel-wallbox-zuhause.html',
  'artikel-farben-raumwirkung-': '/artikel-farben-raumwirkung.html',
  'artikel-schimmel-wohnung-': '/artikel-schimmel-wohnung.html',
  'artikel-fassade-streichen-': '/artikel-fassade-streichen-kosten.html',
  'artikel-heizungstausch-foerderung-': '/artikel-heizungstausch-foerderung.html',
  'artikel-heizungs-check-winter-': '/artikel-heizungs-check-winter.html',
  'artikel-rohrbruch-sofort-': '/artikel-rohrbruch-sofortmassnahmen.html',
  'artikel-dachstuhl-sanieren-': '/artikel-dachstuhl-sanieren.html',
  'artikel-carport-bauen-': '/artikel-carport-bauen.html',
  'artikel-holzterrasse-pflegen-': '/artikel-holzterrasse-pflegen.html',
};

function fixArticleLinks(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = 0;

  // Ersetze jeden stadt-spezifischen Artikel-Link
  for (const [prefix, target] of Object.entries(ARTICLE_MAP)) {
    // Regex: href="artikel-xxx-STADT-GEWERK.html"
    const regex = new RegExp(`href="${prefix}[^"]+\\.html"`, 'g');
    
    content = content.replace(regex, (match) => {
      changes++;
      return `href="${target}"`;
    });
  }

  if (changes > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${path.basename(filePath)} — ${changes} Links gefixt`);
  }

  return changes;
}

// Alle Stadt-Dateien durchgehen
const files = fs.readdirSync(publicDir)
  .filter(f => f.startsWith('stadt-') && f.endsWith('.html'));

let totalChanges = 0;

for (const file of files) {
  const filePath = path.join(publicDir, file);
  totalChanges += fixArticleLinks(filePath);
}

console.log(`\n🎉 Fertig! ${files.length} Stadt-Dateien geprüft, ${totalChanges} Links gefixt.`);
