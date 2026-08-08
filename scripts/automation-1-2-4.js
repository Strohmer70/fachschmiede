#!/usr/bin/env node
/**
 * 1-2-4 Automation für fachschmiede.de
 * 
 * Generiert Artikel für neue Städte nach dem 1-2-4-System:
 * Woche 1: 1 Stadt, Woche 2: 2 Städte, Woche 3: 4 Städte, etc.
 * 
 * Nutzung: node scripts/automation-1-2-4.js
 */

const fs = require('fs');
const path = require('path');

// ─── KONFIGURATION ────────────────────────────────────────────────────

const CITIES = [
  // Ruhrgebiet (bereits abgedeckt)
  // 'bergkamen', 'bochum', 'castrop-rauxel', 'dortmund', 'ennepetal',
  // 'froendenberg', 'gevelsberg', 'hagen', 'hattingen', 'herne',
  // 'holzwickede', 'iserlohn', 'kamen', 'luenen', 'schwelm',
  // 'schwerte', 'sprockhoevel', 'unna', 'wetter-ruhr', 'witten',
  
  // Weitere NRW-Städte (Phase 2)
  'duisburg', 'essen', 'gelsenkirchen', 'krefeld', 'moenchengladbach',
  'neuss', 'oberhausen', 'relingen', 'remscheid', 'solingen',
  
  // Phase 3
  'aachen', 'bonn', 'koeln', 'duesseldorf', 'wuppertal',
  'bielefeld', 'muenster', 'paderborn', 'siegen', 'bergisch-gladbach',
  
  // Phase 4
  'troisdorf', 'guetersloh', 'marl', 'wesel', 'recklinghausen',
  'kerpen', 'herford', 'moers', 'bergheim', 'erftstadt',
  
  // Phase 5
  'juelich', 'dueren', 'korschenbroich', 'rheine', 'ahlen',
  'huerth', 'euskirchen', 'gummersbach', 'iserlohn', 'menden'
];

const TRADES = {
  dachdecker: { name: 'Dachdecker', articles: ['dachdaemmung-foerderung', 'sturmschaden-dach', '5-anzeichen-dachsanierung'] },
  elektriker: { name: 'Elektriker', articles: ['e-check-sicherheit', 'wallbox-zuhause', 'smart-home-nachruesten'] },
  shk: { name: 'Klempner', articles: ['rohrbruch-sofortmassnahmen', 'heizungs-check-winter', 'schimmel-wohnung'] },
  maler: { name: 'Maler', articles: ['fassade-streichen-kosten', 'farben-raumwirkung', 'holzterrasse-pflegen'] },
  zimmerer: { name: 'Zimmerer', articles: ['carport-bauen', 'holzterrasse-pflegen', 'dachdaemmung-foerderung'] }
};

const STATE = path.join(__dirname, '..', 'automation-state.json');

// ─── HILFSFUNKTIONEN ──────────────────────────────────────────────────

function loadState() {
  if (fs.existsSync(STATE)) {
    return JSON.parse(fs.readFileSync(STATE, 'utf8'));
  }
  return { week: 1, lastRun: null, citiesDone: [] };
}

function saveState(state) {
  fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
}

function getCitiesForWeek(week) {
  const count = Math.pow(2, week - 1); // 1, 2, 4, 8, 16...
  const start = 0;
  for (let i = 1; i < week; i++) {
    start += Math.pow(2, i - 1);
  }
  return CITIES.slice(start, start + count);
}

function generateArticle(tradeKey, city, articleSlug) {
  const trade = TRADES[tradeKey];
  const titleMap = {
    'dachdaemmung-foerderung': `Dachdämmung in ${city}: Kosten & Förderung`,
    'sturmschaden-dach': `Sturmschaden in ${city}: Soforthilfe`,
    '5-anzeichen-dachsanierung': `5 Anzeichen für Dachsanierung in ${city}`,
    'e-check-sicherheit': `E-Check in ${city}: Sicherheit & Kosten`,
    'wallbox-zuhause': `Wallbox installieren in ${city}`,
    'smart-home-nachruesten': `Smart Home in ${city}: Systeme & Kosten`,
    'rohrbruch-sofortmassnahmen': `Rohrbruch in ${city}: Soforthilfe`,
    'heizungs-check-winter': `Heizungs-Check in ${city}`,
    'schimmel-wohnung': `Schimmel in ${city}: Ursachen & Sanierung`,
    'fassade-streichen-kosten': `Fassade streichen in ${city}: Kosten`,
    'farben-raumwirkung': `Farben & Raumwirkung in ${city}`,
    'holzterrasse-pflegen': `Holzterrasse pflegen in ${city}`,
    'carport-bauen': `Carport bauen in ${city}: Kosten & Planung`
  };
  
  const title = titleMap[articleSlug] || `${trade.name} in ${city}`;
  
  return `<!DOCTYPE html>
<html lang="de"><head><meta charset="UTF-8">
<title>${title}</title>
<meta name="description" content="${trade.name} in ${city} ✓ Fachbetriebe ✓ Kosten ✓ Tipps. Aktueller Ratgeber für Ihr Projekt.">
<style>
body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.7;color:#333}
h1{color:#1a1a1a}h2{color:#2a2a2a;margin-top:2rem}p{margin:1rem 0}a{color:#2563eb}
</style></head><body>
<h1>${title}</h1>
<p><small>${trade.name} in ${city} · Aktualisiert: ${new Date().toLocaleDateString('de-DE')}</small></p>

<h2>Übersicht</h2>
<p>Dieser Ratgeber für ${city} und Umgebung gibt Ihnen einen Überblick zu ${articleSlug.replace(/-/g, ' ')}. 
Als erfahrener ${trade.name} kenne ich die typischen Herausforderungen in ${city} und der Region.</p>

<h2>Häufige Fragen</h2>
<details><summary>Was kostet der Service?</summary><p>Die Kosten hängen vom Umfang ab. Kontaktieren Sie uns für ein kostenloses Angebot.</p></details>
<details><summary>Wie schnell sind Sie vor Ort?</summary><p>In ${city} und Umgebung sind wir in der Regel innerhalb von 24 Stunden vor Ort.</p></details>

<div style="background:#fef3c7;padding:2rem;border-radius:12px;margin:2rem 0;text-align:center;">
<h3>Benötigen Sie einen ${trade.name} in ${city}?</h3>
<a href="/${tradeKey}/${city.toLowerCase().replace(/ /g, '-')}/#kontakt" style="background:#f59e0b;color:white;padding:1rem 2rem;text-decoration:none;border-radius:8px;display:inline-block;">Kostenloses Angebot</a>
</div>

<p><a href="/${tradeKey}/${city.toLowerCase().replace(/ /g, '-')}/">← Zurück zu ${trade.name} ${city}</a></p>
</body></html>`;
}

function generateForCities(cities) {
  const BASE = path.join(__dirname, '..', 'public', 'blog');
  let count = 0;
  
  for (const city of cities) {
    const citySlug = city.toLowerCase().replace(/ /g, '-');
    
    for (const [tradeKey, trade] of Object.entries(TRADES)) {
      const dir = path.join(BASE, tradeKey, citySlug);
      fs.mkdirSync(dir, { recursive: true });
      
      for (const articleSlug of trade.articles) {
        const file = path.join(dir, `${articleSlug}.html`);
        
        // Überspringe wenn schon existiert
        if (fs.existsSync(file)) continue;
        
        const html = generateArticle(tradeKey, city, articleSlug);
        fs.writeFileSync(file, html);
        count++;
      }
    }
  }
  
  return count;
}

function rebuildIndex() {
  const BASE = path.join(__dirname, '..', 'public', 'blog');
  const idx = [];
  
  for (const t of fs.readdirSync(BASE)) {
    const tp = path.join(BASE, t);
    if (!fs.statSync(tp).isDirectory()) continue;
    
    for (const c of fs.readdirSync(tp)) {
      const cp = path.join(tp, c);
      if (!fs.statSync(cp).isDirectory()) continue;
      
      for (const f of fs.readdirSync(cp)) {
        if (!f.endsWith('.html')) continue;
        const slug = f.replace('.html', '');
        const content = fs.readFileSync(path.join(cp, f), 'utf8');
        const titleMatch = content.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? titleMatch[1] : slug;
        idx.push({ slug, trade: t, city: c, title });
      }
    }
  }
  
  fs.writeFileSync(
    path.join(__dirname, '..', 'lib', 'article-index.json'),
    JSON.stringify(idx, null, 2)
  );
  
  return idx.length;
}

// ─── HAUPTLOGIK ───────────────────────────────────────────────────────

function main() {
  console.log('🚀 1-2-4 Automation für fachschmiede.de\n');
  
  const state = loadState();
  console.log(`📅 Aktuelle Woche: ${state.week}`);
  console.log(`🏙️ Bereits abgedeckt: ${state.citiesDone.length} Städte\n`);
  
  const citiesThisWeek = getCitiesForWeek(state.week);
  const newCities = citiesThisWeek.filter(c => !state.citiesDone.includes(c));
  
  if (newCities.length === 0) {
    console.log('✅ Alle Städte aus Phase 1 sind abgedeckt!');
    console.log('📈 Erhöhe Woche und starte Phase 2...');
    state.week++;
    const nextCities = getCitiesForWeek(state.week);
    console.log(`🎯 Woche ${state.week}: ${nextCities.length} Städte`);
    saveState(state);
    return;
  }
  
  console.log(`🎯 Diese Woche: ${newCities.length} neue Städte`);
  console.log(`   ${newCities.join(', ')}\n`);
  
  // Generiere Artikel
  const generated = generateForCities(newCities);
  console.log(`✅ ${generated} neue Artikel generiert`);
  
  // Index neu bauen
  const total = rebuildIndex();
  console.log(`📚 Index aktualisiert: ${total} Artikel gesamt`);
  
  // State aktualisieren
  state.citiesDone.push(...newCities);
  state.lastRun = new Date().toISOString();
  saveState(state);
  
  console.log('\n🎉 Fertig! Nächster Lauf: Erhöhe Woche und führe Script erneut aus.');
  console.log('   Oder: node scripts/automation-1-2-4.js');
}

main();
