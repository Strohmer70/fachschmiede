#!/usr/bin/env node
/**
 * Monatlicher Artikel-Generator für fachschmiede.de
 * 
 * Scannt automatisch alle stadt-*.html Dateien und generiert
 * für jede Stadt-Gewerk-Kombination genau 1 Artikel pro Monat.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// ─── KONFIGURATION ──────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY || 'sk-dflfmQZYslaRgqiVP8edlrh6JKG8Kepm5GkTqZkSmf7pmGgp';
const MOONSHOT_API_URL = process.env.MOONSHOT_API_URL || 'https://api.moonshot.ai/v1/chat/completions';

// Trade Mapping: Kurzform → Voller Name
const TRADE_MAP = {
  'dach': { slug: 'dachdecker', name: 'Dachdecker' },
  'elek': { slug: 'elektriker', name: 'Elektriker' },
  'klempner': { slug: 'klempner', name: 'Klempner' },
  'maler': { slug: 'maler', name: 'Maler' },
  'zimm': { slug: 'zimmerer', name: 'Zimmerer' },
  'garten': { slug: 'gartenpflege', name: 'Gartenpflege' },
  'fliesen': { slug: 'fliesenleger', name: 'Fliesenleger' },
  'schorn': { slug: 'schornsteinfeger', name: 'Schornsteinfeger' },
  'schrein': { slug: 'schreiner', name: 'Schreiner' },
};

// Themen pro Gewerk (rotieren monatlich)
const TOPICS = {
  dachdecker: ['Dachdämmung Kosten', 'Sturmschaden Reparatur', 'Dachsanierung planen', 'Dachziegel Arten', 'Dachfenster einbauen', 'Dachrinne reinigen'],
  elektriker: ['E-Check 2026', 'LED Beleuchtung', 'Sicherungskasten erneuern', 'Photovoltaik Anschluss', 'Smart Home nachrüsten', 'Wallbox Installation'],
  klempner: ['Wasserdruck optimieren', 'Abfluss verstopft', 'Warmwasserspeicher tauschen', 'Heizkörper entlüften', 'Badrenovierung planen', 'Wasserschaden Sanierung'],
  maler: ['Tapezierarbeiten Kosten', 'Fassadensanierung 2026', 'Malerkosten pro m²', 'Tapeten Trends', 'Lasuren Holzschutz', 'Keller anstreichen'],
  zimmerer: ['Holzschutz Terrassen', 'Carport Planung', 'Gauben ausbauen', 'Holzterrasse verlegen', 'Dachstuhl Reparatur', 'Wintergarten Holz'],
  gartenpflege: ['Rasenpflege Frühling', 'Hecke schneiden', 'Baumfällung', 'Gartengestaltung', 'Unkrautbekämpfung', 'Gartenwintervorbereitung'],
  fliesenleger: ['Badfliesen verlegen', 'Bodenfliesen verlegen', 'Naturstein verlegen', 'Fugen erneuern', 'Dusche abdichten', 'Küchenrückwand gestalten'],
  schornsteinfeger: ['Regelmäßige Kehrung', 'Feuerstätten-Bescheid', 'Schornstein Sanierung', 'Kamin reinigen', 'Abgasuntersuchung', 'Pelletofen Beratung'],
  schreiner: ['Maßgefertigte Möbel', 'Küchenbau', 'Treppenbau', 'Fenster erneuern', 'Innenausbau', 'Holzrestaurierung'],
};

// ─── SUPABASE CLIENT (optional) ─────────────────────────────────────

let supabase = null;

function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return false;
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    return true;
  } catch (err) {
    console.log('⚠️  Supabase nicht verfügbar:', err.message);
    return false;
  }
}

// ─── HILFSFUNKTIONEN ────────────────────────────────────────────────

function getMonthSlug() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function discoverCityTradeCombinations() {
  const publicDir = path.join(process.cwd(), 'public');
  const files = fs.readdirSync(publicDir);
  
  const combinations = [];
  const cities = new Set();
  const trades = new Set();
  
  for (const file of files) {
    const match = file.match(/^stadt-([a-z]+)-(.+)\.html$/);
    if (match) {
      const tradeCode = match[1];
      const citySlug = match[2];
      const tradeInfo = TRADE_MAP[tradeCode];
      
      if (tradeInfo) {
        combinations.push({
          citySlug,
          tradeCode,
          tradeSlug: tradeInfo.slug,
          tradeName: tradeInfo.name
        });
        cities.add(citySlug);
        trades.add(tradeInfo.slug);
      }
    }
  }
  
  return { combinations, cities: Array.from(cities), trades: Array.from(trades) };
}

function getCityDisplayName(citySlug) {
  // Einfache Konvertierung: bochum → Bochum, castrop-rauxel → Castrop-Rauxel
  return citySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace('Ruhr', '(Ruhr)');
}

function getTopicForCombination(tradeSlug, comboIndex) {
  const topics = TOPICS[tradeSlug] || TOPICS['dachdecker'];
  const monthIndex = new Date().getMonth();
  const topicIndex = (monthIndex + comboIndex) % topics.length;
  const topicTitle = topics[topicIndex];
  
  return {
    slug: topicTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    title: topicTitle,
    keyword: topicTitle.split(' ')[0]
  };
}

// ─── KIMI API ───────────────────────────────────────────────────────

async function callKimiAPI(prompt, maxRetries = 3) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MOONSHOT_API_KEY}`
  };

  const body = {
    model: 'kimi-k2.6',
    messages: [
      {
        role: 'system',
        content: 'Du bist ein erfahrener deutscher SEO-Content-Writer spezialisiert auf Handwerker- und Baubranche. Du schreibst fundierte, lokale Ratgeber-Artikel.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 1,
    max_tokens: 16000
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(MOONSHOT_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
      throw new Error('Ungültige API-Antwort');
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function generateArticle(tradeSlug, citySlug, cityName, tradeName, topic) {
  const prompt = `Schreibe einen umfassenden, SEO-optimierten Ratgeber-Artikel über "${topic.title}" in ${cityName}.

ANFORDERUNGEN:
- Länge: 1200-1500 Wörter
- Sprache: Deutsch (Deutschland)
- Zielgruppe: Hausbesitzer in ${cityName}
- Ton: Professionell, vertrauenswürdig, lokal

STRUKTUR (mit ## Überschriften):

## Einleitung (150-200 Wörter)
## Warum ist das wichtig? (200-250 Wörter)
## Die 5 wichtigsten Punkte (250-300 Wörter)
## Kosten in ${cityName} (200-250 Wörter)
## Häufig gestellte Fragen (4-5 Fragen)
## Fazit (150-200 Wörter)

LOKALE BEZÜGE:
- Erwähne "${cityName}" natürlich
- Erwähne "Ruhrgebiet" wenn relevant
- Bezug auf Altbautypen aus den 60er/70er Jahren

SEO: Keyword "${topic.keyword} ${cityName}", kurze Absätze, konkrete Zahlen.
GIB NUR DEN ARTIKEL-TEXT ZURÜCK.`;

  const content = await callKimiAPI(prompt);
  
  // Parse FAQs
  const faqs = [];
  const faqRegex = /\*\*Frage:\*\*\s*(.+?)\n\*\*Antwort:\*\*\s*(.+?)(?=\n\*\*Frage:|\n## |$)/gs;
  let match;
  while ((match = faqRegex.exec(content)) !== null) {
    faqs.push({ q: match[1].trim(), a: match[2].trim() });
  }
  
  if (faqs.length === 0) {
    faqs.push(
      { q: `Wie lange dauert ${topic.title} in ${cityName}?`, a: `In der Regel 1-3 Werktage je nach Umfang.` },
      { q: `Was kostet ${topic.title} in ${cityName}?`, a: `Zwischen 500 und 3.000 Euro je nach Projektgröße.` },
      { q: `Benötige ich eine Genehmigung?`, a: `Für kleinere Reparaturen meist nicht. Bei größeren Projekten kann eine Baugenehmigung nötig sein.` }
    );
  }
  
  return { content, faqs };
}

function generateHTML(tradeSlug, citySlug, cityName, tradeName, topic, monthSlug, content, faqs) {
  const fullSlug = `${topic.slug}-${monthSlug}`;
  const title = `${topic.title} in ${cityName}: Ratgeber & Kosten ${new Date().getFullYear()}`;
  const today = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  
  const faqHTML = faqs.map(faq => `
<details style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px;">
  <summary style="padding:16px;cursor:pointer;font-weight:600;">${faq.q}</summary>
  <div style="padding:0 16px 16px;">${faq.a}</div>
</details>`).join('');
  
  const contentHTML = content
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .split('\n\n')
    .map(p => p.trim() ? `<p>${p}</p>` : '')
    .join('\n');

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${topic.title} in ${cityName} ✓ Fachbetriebe ✓ Kosten ✓ Tipps. Erfahren Sie alles Wichtige.">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
body{font-family:'Inter',sans-serif;background:#f8fafc;color:#1e293b;line-height:1.7;margin:0}
.container{max-width:800px;margin:0 auto;padding:0 20px}
header{background:linear-gradient(135deg,#1e293b,#0f172a);color:white;padding:40px 0;text-align:center}
h1{font-size:2rem;font-weight:800;margin-bottom:8px}
.meta{color:#94a3b8;font-size:0.9rem}
.content{background:white;margin:40px auto;padding:40px;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1)}
h2{font-size:1.5rem;font-weight:700;margin:32px 0 16px;color:#0f172a}
p{margin-bottom:16px;color:#475569}
strong{color:#0f172a}
a{color:#2563eb;text-decoration:none}
.cta-box{margin-top:32px;padding:24px;background:#fef3c7;border-radius:12px;text-align:center}
.cta-button{display:inline-block;padding:12px 28px;background:#f59e0b;color:white;font-weight:700;border-radius:8px}
.back-link{display:inline-block;margin-top:24px;padding:10px 20px;background:#3b82f6;color:white;border-radius:8px}
@media(max-width:640px){h1{font-size:1.5rem}.content{padding:24px}}
</style>
</head>
<body>
<header>
<div class="container">
<div style="font-size:0.875rem;text-transform:uppercase;color:#60a5fa;margin-bottom:8px;">${tradeName} ${cityName}</div>
<h1>${topic.title} in ${cityName}</h1>
<div class="meta">Aktualisiert: ${today} · 8 Min. Lesezeit</div>
</div>
</header>
<div class="container">
<article class="content">
${contentHTML}
<div style="margin-top:32px">
<h2>Häufig gestellte Fragen</h2>
${faqHTML}
</div>
<div class="cta-box">
<h3>Benötigen Sie einen ${tradeName} in ${cityName}?</h3>
<a href="/${tradeSlug}/${citySlug}/#kontakt" class="cta-button">Kostenloses Angebot anfordern</a>
</div>
</article>
<a href="/${tradeSlug}/${citySlug}/" class="back-link">← Zurück zu ${tradeName} ${cityName}</a>
</div>
</body>
</html>`;
}

// ─── HAUPTFUNKTION ──────────────────────────────────────────────────

async function main() {
  console.log('🚀 Monatlicher Artikel-Generator gestartet');
  console.log(`📅 Monat: ${getMonthSlug()}`);
  console.log(`🔑 API-Key: ${MOONSHOT_API_KEY ? '✅' : '❌'}`);
  
  if (!MOONSHOT_API_KEY) {
    console.error('❌ MOONSHOT_API_KEY fehlt!');
    process.exit(1);
  }
  
  // 1. Entdecke alle Stadt-Gewerk-Kombinationen
  const { combinations, cities, trades } = discoverCityTradeCombinations();
  console.log(`\n📊 Gefunden: ${combinations.length} Kombinationen`);
  console.log(`   ${cities.length} Städte × ~${trades.length} Gewerke`);
  console.log(`   Gewerke: ${trades.join(', ')}`);
  
  if (combinations.length === 0) {
    console.error('❌ Keine stadt-*.html Dateien gefunden!');
    process.exit(1);
  }
  
  // 2. Lade bestehenden Index
  const indexPath = path.join(process.cwd(), 'lib', 'article-index.json');
  let articleIndex = {};
  try {
    articleIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  } catch {
    articleIndex = {};
  }
  
  // 3. Generiere Artikel
  const monthSlug = getMonthSlug();
  let generatedCount = 0;
  let skippedCount = 0;
  let apiCalls = 0;
  
  for (let i = 0; i < combinations.length; i++) {
    const { citySlug, tradeSlug, tradeName } = combinations[i];
    const cityName = getCityDisplayName(citySlug);
    const topic = getTopicForCombination(tradeSlug, i);
    const fullSlug = `${topic.slug}-${monthSlug}`;
    const filePath = path.join(process.cwd(), 'public', 'blog', tradeSlug, citySlug, `${fullSlug}.html`);
    
    // Prüfe ob existiert
    if (fs.existsSync(filePath)) {
      console.log(`⏭️  [${i+1}/${combinations.length}] ${tradeSlug}/${citySlug} — existiert bereits`);
      skippedCount++;
      continue;
    }
    
    console.log(`\n📝 [${i+1}/${combinations.length}] ${tradeSlug}/${citySlug}`);
    console.log(`   Thema: ${topic.title} | Stadt: ${cityName}`);
    
    try {
      const { content, faqs } = await generateArticle(tradeSlug, citySlug, cityName, tradeName, topic);
      apiCalls++;
      
      // Speichern
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      
      const html = generateHTML(tradeSlug, citySlug, cityName, tradeName, topic, monthSlug, content, faqs);
      fs.writeFileSync(filePath, html, 'utf-8');
      
      // Index aktualisieren
      if (!articleIndex[tradeSlug]) articleIndex[tradeSlug] = {};
      if (!articleIndex[tradeSlug][citySlug]) articleIndex[tradeSlug][citySlug] = [];
      
      articleIndex[tradeSlug][citySlug].push({
        title: `${topic.title} in ${cityName}`,
        excerpt: `Ratgeber zu ${topic.title} in ${cityName}.`,
        tag: 'Ratgeber',
        url: `/${tradeSlug}/${citySlug}/blog/${fullSlug}/`
      });
      
      console.log(`   ✅ Gespeichert (${content.length} Zeichen)`);
      generatedCount++;
      
      // Rate-Limit
      if (i < combinations.length - 1) {
        console.log(`   ⏳ Warte 3s...`);
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (error) {
      console.error(`   ❌ Fehler: ${error.message}`);
    }
  }
  
  // Speichere Index
  fs.writeFileSync(indexPath, JSON.stringify(articleIndex, null, 2), 'utf-8');
  
  console.log(`\n🎉 FERTIG!`);
  console.log(`   ✅ ${generatedCount} neue Artikel`);
  console.log(`   ⏭️  ${skippedCount} übersprungen`);
  console.log(`   🌐 ${apiCalls} API-Calls`);
}

main().catch(err => {
  console.error('❌ Kritischer Fehler:', err);
  process.exit(1);
});
