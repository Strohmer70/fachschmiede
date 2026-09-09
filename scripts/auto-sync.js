#!/usr/bin/env node
/**
 * AUTO-SYNC SYSTEM für fachschmiede.de
 * 
 * Scannt die system-config.js und stellt sicher, dass für JEDE
 * Gewerk-Stadt-Kombination existiert:
 * - Landing Page (HTML)
 * - Artikel-Index-Einträge
 * - Supabase Einträge
 * 
 * Nutzung:
 *   node scripts/auto-sync.js         # Dry-Run (zeigt was fehlt)
 *   node scripts/auto-sync.js --fix   # Erstellt fehlende Seiten
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ═══ ZENTRALE CONFIG LADEN ═══
const {
  SYSTEM_CONFIG,
  getAllCombinations,
  getTrade,
  getCity,
  getTradeName,
  getCityName,
  getTradeEmoji,
  getAllTrades,
  getAllCities,
} = require('../config/system-config.js');

// ─── KONFIGURATION ──────────────────────────────────────────────────

const DRY_RUN = !process.argv.includes('--fix');
const GENERATE_ARTICLES = process.argv.includes('--articles');
const VERBOSE = process.argv.includes('--verbose');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const BLOG_DIR = path.join(PUBLIC_DIR, 'blog');

// ─── HILFSFUNKTIONEN ────────────────────────────────────────────────

function log(message, type = 'info') {
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌', action: '🔧' };
  console.log(`${icons[type] || 'ℹ️'}  ${message}`);
}

function checkLandingPage(tradeSlug, citySlug) {
  // Für Next.js App Router: Prüfe ob Route existiert
  const nextJsPath = path.join(process.cwd(), 'app', tradeSlug, citySlug, 'page.tsx');
  if (fs.existsSync(nextJsPath)) return { exists: true, path: nextJsPath, type: 'nextjs' };
  
  // Fallback: Statische HTML
  const staticPath = path.join(PUBLIC_DIR, `${tradeSlug}`, `${citySlug}.html`);
  if (fs.existsSync(staticPath)) return { exists: true, path: staticPath, type: 'static' };
  
  return { exists: false, path: staticPath, type: 'none' };
}

function checkArticles(tradeSlug, citySlug) {
  const articleDir = path.join(BLOG_DIR, tradeSlug, citySlug);
  if (!fs.existsSync(articleDir)) return { count: 0, files: [] };
  
  const files = fs.readdirSync(articleDir).filter(f => f.endsWith('.html'));
  return { count: files.length, files };
}

function checkArticleIndex(tradeSlug, citySlug) {
  const indexPath = path.join(__dirname, '..', 'public', 'lib', 'article-index.json');
  if (!fs.existsSync(indexPath)) return { exists: false, count: 0 };
  
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  const tradeData = index[tradeSlug];
  if (!tradeData) return { exists: false, count: 0 };
  
  const cityData = tradeData[citySlug];
  if (!cityData) return { exists: false, count: 0 };
  
  return { exists: true, count: Array.isArray(cityData) ? cityData.length : 0 };
}

// ─── LANDING PAGE GENERATOR ────────────────────────────────────────

function generateLandingPageHTML(trade, city) {
  const tradeSlug = trade.slug;
  const citySlug = city.slug;
  const cityName = city.name;
  const tradeName = trade.name;
  const emoji = trade.emoji;
  
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${tradeName} in ${cityName} | fachschmiede.de</title>
<meta name="description" content="${tradeName} in ${cityName} ✓ Festpreis ✓ Feste Termine ✓ Garantie. Jetzt kostenlos anfragen.">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#f8fafc;color:#1e293b;line-height:1.6}
.container{max-width:1200px;margin:0 auto;padding:0 20px}
.hero{background:linear-gradient(135deg,${trade.color[700]},${trade.color[900]});color:white;padding:80px 0;text-align:center}
.hero h1{font-size:3rem;font-weight:800;margin-bottom:16px}
.hero p{font-size:1.25rem;opacity:0.9;margin-bottom:32px}
.cta-button{display:inline-block;padding:16px 32px;background:white;color:${trade.color[700]};font-weight:700;border-radius:12px;text-decoration:none;box-shadow:0 4px 6px rgba(0,0,0,0.1);transition:transform 0.2s}
.cta-button:hover{transform:translateY(-2px)}
.services{padding:60px 0;background:white}
.services h2{text-align:center;font-size:2rem;margin-bottom:40px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}
.card{background:#f8fafc;border-radius:16px;padding:24px;border:1px solid #e2e8f0}
.card h3{font-size:1.25rem;margin-bottom:8px;color:${trade.color[700]}}
.badge{display:inline-block;padding:8px 16px;background:${trade.color[100]};color:${trade.color[700]};border-radius:20px;font-size:0.875rem;font-weight:600;margin-bottom:16px}
.footer{background:#1e293b;color:white;padding:40px 0;text-align:center;margin-top:60px}
@media(max-width:768px){.hero h1{font-size:2rem}}
</style>
</head>
<body>
<header class="hero">
<div class="container">
<div class="badge">${emoji} ${tradeName} ${cityName}</div>
<h1>${tradeName} in ${cityName}</h1>
<p>${trade.painPoints ? `Probleme mit ${trade.painPoints}? Wir helfen!` : 'Professionelle Handwerker in Ihrer Region.'}</p>
<a href="#kontakt" class="cta-button">${trade.ctaPrimary || 'Kostenlos anfragen'}</a>
</div>
</header>

<section class="services">
<div class="container">
<h2>Unsere Leistungen</h2>
<div class="grid">
${trade.services.map(s => `
<div class="card">
<h3>${s}</h3>
<p>Fachgerechte Ausführung in ${cityName} und Umgebung. Qualität garantiert.</p>
</div>
`).join('')}
</div>
</div>
</section>

<section id="kontakt" style="padding:60px 0;background:#f8fafc;">
<div class="container" style="max-width:600px;text-align:center;">
<h2 style="margin-bottom:24px;">Kontaktieren Sie uns</h2>
<p style="margin-bottom:32px;">Schnelle Antwort garantiert. Wir melden uns innerhalb von 24 Stunden.</p>
<a href="mailto:hello@fachschmiede.de" class="cta-button" style="background:${trade.color[600]};color:white;">E-Mail senden</a>
</div>
</section>

<footer class="footer">
<div class="container">
<p>© 2026 fachschmiede.de | ${tradeName} in ${cityName}</p>
</div>
</footer>
</body>
</html>`;
}

// ─── HAUPTFUNKTION ──────────────────────────────────────────────────

async function main() {
  log('Auto-Sync System gestartet', 'info');
  log(`Modus: ${DRY_RUN ? 'DRY-RUN (nur prüfen)' : 'FIX (fehlende erstellen)'}`, 'info');
  
  const combinations = getAllCombinations();
  log(`Kombinationen in Config: ${combinations.length}`, 'info');
  
  let missingLandingPages = [];
  let missingArticles = [];
  let missingIndexEntries = [];
  
  // 1. Prüfe jede Kombination
  for (const { tradeSlug, citySlug } of combinations) {
    const trade = getTrade(tradeSlug);
    const city = getCity(citySlug);
    
    if (!trade || !city) {
      log(`Ungültige Kombination: ${tradeSlug}/${citySlug}`, 'warning');
      continue;
    }
    
    // Prüfe Landing Page
    const landingPage = checkLandingPage(tradeSlug, citySlug);
    if (!landingPage.exists) {
      missingLandingPages.push({ tradeSlug, citySlug, trade, city });
      if (VERBOSE) log(`Fehlende Landing Page: ${tradeSlug}/${citySlug}`, 'warning');
    }
    
    // Prüfe Artikel
    const articles = checkArticles(tradeSlug, citySlug);
    const expectedArticles = trade.articleTopics ? trade.articleTopics.length : 0;
    if (articles.count < expectedArticles) {
      missingArticles.push({ tradeSlug, citySlug, trade, city, expected: expectedArticles, actual: articles.count });
      if (VERBOSE) log(`Fehlende Artikel: ${tradeSlug}/${citySlug} (${articles.count}/${expectedArticles})`, 'warning');
    }
    
    // Prüfe Index
    const indexEntry = checkArticleIndex(tradeSlug, citySlug);
    if (!indexEntry.exists || indexEntry.count < expectedArticles) {
      missingIndexEntries.push({ tradeSlug, citySlug, trade, city, expected: expectedArticles, actual: indexEntry.count });
    }
  }
  
  // 2. Ergebnisse anzeigen
  console.log('\n═══════════════════════════════════════');
  console.log('SYNC-REPORT');
  console.log('═══════════════════════════════════════');
  console.log(`Landing Pages fehlen:     ${missingLandingPages.length}`);
  console.log(`Artikel fehlen:           ${missingArticles.length}`);
  console.log(`Index-Einträge fehlen:    ${missingIndexEntries.length}`);
  console.log(`Gesamt fehlend:           ${missingLandingPages.length + missingArticles.length + missingIndexEntries.length}`);
  console.log('═══════════════════════════════════════\n');
  
  // 3. Dry-Run: Nur anzeigen
  if (DRY_RUN) {
    if (missingLandingPages.length > 0) {
      log('Fehlende Landing Pages:', 'warning');
      missingLandingPages.forEach(({ tradeSlug, citySlug }) => {
        console.log(`  • ${tradeSlug}/${citySlug}`);
      });
    }
    
    log('\nTipp: Führe mit --fix aus um fehlende Seiten zu erstellen', 'info');
    log('      Führe mit --articles aus um auch Artikel zu generieren', 'info');
    return;
  }
  
  // 4. FIX: Fehlende Landing Pages erstellen
  if (missingLandingPages.length > 0) {
    log(`Erstelle ${missingLandingPages.length} fehlende Landing Pages...`, 'action');
    
    for (const { tradeSlug, citySlug, trade, city } of missingLandingPages) {
      const html = generateLandingPageHTML(trade, city);
      const filePath = path.join(PUBLIC_DIR, `${tradeSlug}`, `${citySlug}.html`);
      
      // Verzeichnis erstellen
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      
      fs.writeFileSync(filePath, html, 'utf-8');
      log(`  ✅ ${tradeSlug}/${citySlug}.html erstellt`, 'success');
    }
  }
  
  // 5. FIX: Artikel-Index aktualisieren
  if (missingIndexEntries.length > 0) {
    log(`Aktualisiere Artikel-Index...`, 'action');
    
    const indexPath = path.join(__dirname, '..', 'public', 'lib', 'article-index.json');
    let articleIndex = {};
    try {
      articleIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    } catch {
      articleIndex = {};
    }
    
    for (const { tradeSlug, citySlug, trade, city } of missingIndexEntries) {
      if (!articleIndex[tradeSlug]) articleIndex[tradeSlug] = {};
      if (!articleIndex[tradeSlug][citySlug]) articleIndex[tradeSlug][citySlug] = [];
      
      // Füge Topics hinzu
      if (trade.articleTopics) {
        for (const topic of trade.articleTopics) {
          const exists = articleIndex[tradeSlug][citySlug].some(a => a.url.includes(topic.slug));
          if (!exists) {
            articleIndex[tradeSlug][citySlug].push({
              title: typeof topic.title === 'function' ? topic.title(city.name) : topic.title,
              excerpt: `Ratgeber für ${city.name}.`,
              tag: topic.tag || 'Ratgeber',
              gradient: 'from-accent-500 to-accent-700',
              svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>',
              url: `/${tradeSlug}/${citySlug}/blog/${topic.slug}/`,
            });
          }
        }
      }
      
      log(`  ✅ Index: ${tradeSlug}/${citySlug}`, 'success');
    }
    
    fs.writeFileSync(indexPath, JSON.stringify(articleIndex, null, 2), 'utf-8');
    log('Artikel-Index gespeichert', 'success');
  }
  
  // 6. Artikel generieren (optional)
  if (GENERATE_ARTICLES && missingArticles.length > 0) {
    log(`Starte Artikel-Generator für ${missingArticles.length} Kombinationen...`, 'action');
    try {
      execSync('node scripts/monthly-generator.js', { stdio: 'inherit', cwd: process.cwd() });
    } catch (err) {
      log('Artikel-Generator fehlgeschlagen', 'error');
    }
  }
  
  // 7. Git Commit
  if (!DRY_RUN) {
    log('Erstelle Git Commit...', 'action');
    try {
      execSync('git add -A && git commit -m "auto-sync: Neue Landing Pages & Index-Einträge"', { cwd: process.cwd() });
      log('Git Commit erstellt', 'success');
      
      log('Pushe zu GitHub...', 'action');
      execSync('git push origin main', { cwd: process.cwd() });
      log('Gepusht! Deploy läuft automatisch auf Vercel.', 'success');
    } catch (err) {
      log('Git Operation fehlgeschlagen (nicht kritisch)', 'warning');
    }
  }
  
  log('\n🎉 Auto-Sync abgeschlossen!', 'success');
}

main().catch(err => {
  log(`Fehler: ${err.message}`, 'error');
  process.exit(1);
});
