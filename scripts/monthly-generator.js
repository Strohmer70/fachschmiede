#!/usr/bin/env node
/**
 * TEMPLATE-BASIERTER Artikel-Generator für fachschmiede.de
 * 
 * KEINE API-ANRUFE! 100% kostenlos, sofort einsatzbereit.
 * Nutzt lokale Templates mit Stadt/Gewerk-Variablen.
 */

const fs = require('fs');
const path = require('path');

// ═══ ZENTRALE CONFIG LADEN ═══
const {
  SYSTEM_CONFIG,
  getAllCombinations,
  getTrade,
  getCity,
  getTradeName,
  getCityName,
  getArticleTopics,
  getTradeEmoji,
} = require('../config/system-config.js');

// ─── KONFIGURATION ──────────────────────────────────────────────────

// Max Artikel pro Durchlauf (Safety-Limit)
const MAX_ARTICLES_PER_RUN = parseInt(process.env.MAX_ARTICLES_PER_RUN || '10', 10);

// ─── TEMPLATE-SYSTEM ────────────────────────────────────────────────

/**
 * Generiert Artikel-Content aus Templates
 * Kein API-Aufruf! Variablen werden ersetzt.
 */
function generateArticleFromTemplate(tradeSlug, citySlug, cityName, tradeName, topic) {
  const topicTitle = typeof topic.title === 'function' ? topic.title(cityName) : topic.title;
  const trade = getTrade(tradeSlug);
  const services = trade?.services?.join(', ') || 'verschiedene Leistungen';
  const painPoints = trade?.painPoints || 'typische Probleme';
  
  // Haupt-Keyword für SEO
  const mainKeyword = topicTitle.split(':')[0];
  
  // Template-Content mit Variablen
  const content = `## Einleitung

Wenn Sie als Hausbesitzer in ${cityName} mit ${topicTitle} beschäftigt sind, stehen Sie vor einer wichtigen Entscheidung. Die Wahl des richtigen Fachbetriebs macht den Unterschied zwischen einem reibungslosen Projekt und jahrelangen Nacharbeiten.

In ${cityName} und dem gesamten Ruhrgebiet gibt es spezifische Herausforderungen: Die typischen Altbauten aus den 60er und 70er Jahren erfordern besonderes Fachwissen. Ein erfahrener ${tradeName} kennt diese Eigenheiten und plant entsprechend.

## Warum ist das wichtig?

Viele Hausbesitzer in ${cityName} unterschätzen die Komplexität von ${mainKeyword}. Die Folgen: Verzögerungen, Kostensteigerungen und im schlimmsten Fall Mängel, die erst nach Monaten auffallen.

Die gute Nachricht: Mit der richtigen Vorbereitung und einem qualifizierten ${tradeName} aus der Region lässt sich das Projekt effizient umsetzen. Die kurzen Wege in ${cityName} und die Umgebung ermöglichen schnelle Reaktionszeiten – besonders wichtig bei ${painPoints}.

## Die 5 wichtigsten Punkte

### 1. Fachgerechte Planung
Jedes Projekt beginnt mit einer gründlichen Analyse. Ein professioneller ${tradeName} in ${cityName} erstellt zunächst ein Konzept, das Ihre spezifischen Anforderungen berücksichtigt. Dabei werden auch bauliche Gegebenheiten wie die typischen Dachformen oder Elektroinstallationen älterer Gebäude im Ruhrgebiet einbezogen.

### 2. Transparente Kostenkalkulation
Überraschende Zusatzkosten sind der größte Stressfaktor bei Bauprojekten. Seriöse Fachbetriebe in ${cityName} erstellen daher ein detailliertes, schriftliches Angebot. Darin enthalten sind alle Leistungen, Materialien und Zeitpläne – ohne versteckte Kosten.

### 3. Qualität der Materialien
Die Wahl der richtigen Materialien ist entscheidend für die Haltbarkeit. In ${cityName}, wo das Klima mit seinen feuchten Herbsttagen und kalten Wintern besondere Anforderungen stellt, kommt es auf Qualität an. Günstige Alternativen führen oft zu teuren Nacharbeiten.

### 4. Termintreue und Zuverlässigkeit
Ein zuverlässiger ${tradeName} hält Einhaltung der vereinbarten Termine. Das ist besonders wichtig, wenn das Projekt zeitkritisch ist – etwa bei ${painPoints}. Fragen Sie vorab nach Referenzen und Erfahrungen mit ähnlichen Projekten in ${cityName}.

### 5. Garantie und Service
Professionelle Anbieter gewährleisten ihre Arbeit. Eine umfassende Garantie gibt Ihnen die Sicherheit, dass eventuelle Probleme kostenlos behoben werden. Achten Sie auf die genauen Konditionen und die Reaktionszeit im Garantiefall.

## Kosten in ${cityName}

Die Kosten für ${mainKeyword} in ${cityName} variieren je nach Projektumfang:

**Kleine Projekte:** 500 – 1.500 €  
**Mittlere Projekte:** 1.500 – 5.000 €  
**Große Projekte:** 5.000 – 15.000 €

Diese Angaben sind Richtwerte. Für ein verbindliches Angebot ist eine kostenlose Besichtigung vor Ort notwendig. Der Fachbetrieb kann dann die spezifischen Gegebenheiten Ihres Objekts in ${cityName} bewerten und ein maßgeschneidertes Konzept erstellen.

**Was beeinflusst die Kosten?**
- Umfang und Komplexität des Projekts
- Zugänglichkeit der Baustelle
- Materialwahl (Standard vs. Premium)
- Dringlichkeit (Normaltermin vs. Express)

**Tipp:** Lassen Sie sich von mehreren Fachbetrieben in ${cityName} ein Angebot erstellen. Vergleichen Sie nicht nur den Preis, sondern auch den Leistungsumfang und die eingesetzten Materialien.

## Häufig gestellte Fragen

**Wie lange dauert ${mainKeyword} in ${cityName}?**
Die Dauer hängt stark vom Projektumfang ab. Kleine Aufträge sind oft innerhalb eines Tages erledigt, größere Projekte können mehrere Wochen in Anspruch nehmen. Bei der Besichtigung erhalten Sie einen konkreten Zeitplan.

**Was kostet ein ${tradeName} in ${cityName}?**
Die Kosten variieren je nach Aufwand. Für eine erste Einschätzung reicht oft eine telefonische Beschreibung des Problems. Ein verbindliches Angebot erhalten Sie nach der kostenlosen Besichtigung vor Ort.

**Benötige ich eine Genehmigung?**
Für viele Arbeiten ist keine Genehmigung nötig. Bei umfangreicheren Projekten oder Eingriffen in die Bausubstanz kann jedoch eine Baugenehmigung erforderlich sein. Ein erfahrener ${tradeName} aus ${cityName} berät Sie hierzu.

**Wie finde ich einen zuverlässigen ${tradeName} in ${cityName}?**
Achten Sie auf nachweisbare Erfahrung, transparente Kommunikation und schriftliche Angebote. Lokale Betriebe haben den Vorteil kurzer Anfahrtswege und Kenntnis der regionalen Besonderheiten.

**Was ist bei Altbauten in ${cityName} zu beachten?**
Die typischen Wohngebäude aus den 60er und 70er Jahren im Ruhrgebiet haben oft spezifische Eigenschaften. Ein ortsansässiger Fachbetrieb kennt diese Herausforderungen und plant entsprechend.

## Fazit

${mainKeyword} in ${cityName} erfordert Fachwissen und eine sorgfältige Planung. Die Investition in einen qualifizierten ${tradeName} zahlt sich durch qualitativ hochwertige Ergebnisse und langfristige Haltbarkeit aus.

Nutzen Sie die kostenlose Erstberatung vor Ort, um Ihr Projekt professionell zu planen. Ein verlässlicher Partner aus der Region ${cityName} begleitet Sie von der ersten Idee bis zur fertigen Umsetzung – und darüber hinaus mit umfassendem Service.

**Kontaktieren Sie noch heute einen erfahrenen ${tradeName} in ${cityName} und sichern Sie sich Ihr kostenloses Angebot.**`;

  // FAQs generieren
  const faqs = [
    { 
      q: `Wie lange dauert ${mainKeyword} in ${cityName}?`, 
      a: `Die Dauer hängt vom Umfang ab. Kleine Projekte: 1-3 Tage. Mittlere Projekte: 1-2 Wochen. Bei der kostenlosen Besichtigung erhalten Sie einen konkreten Zeitplan.` 
    },
    { 
      q: `Was kostet ${mainKeyword} in ${cityName}?`, 
      a: `Kleine Projekte: 500-1.500 €, Mittlere: 1.500-5.000 €, Große: 5.000-15.000 €. Ein verbindliches Angebot erhalten Sie nach der kostenlosen Besichtigung.` 
    },
    { 
      q: `Benötige ich eine Baugenehmigung in ${cityName}?`, 
      a: `Für kleinere Arbeiten meist nicht. Bei größeren Eingriffen oder Änderungen an der Bausubstanz kann eine Genehmigung nötig sein. Ihr ${tradeName} berät Sie dazu.` 
    },
    { 
      q: `Wie finde ich einen zuverlässigen ${tradeName} in ${cityName}?`, 
      a: `Achten Sie auf: nachweisbare Erfahrung, transparente Kommunikation, schriftliche Angebote, lokale Referenzen und umfassende Garantieleistungen.` 
    }
  ];
  
  return { content, faqs };
}

function generateHTML(tradeSlug, citySlug, cityName, tradeName, topic, monthSlug, content, faqs) {
  const fullSlug = `${topic.slug}-${monthSlug}`;
  const topicTitle = typeof topic.title === 'function' ? topic.title(cityName) : topic.title;
  // Vermeide doppeltes "in Stadtname" im Titel
  const cleanTopicTitle = topicTitle.replace(new RegExp(`\\s+in\\s+${cityName}$`, 'i'), '');
  const title = `${cleanTopicTitle} in ${cityName}: Ratgeber & Kosten ${new Date().getFullYear()}`;
  const today = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  const trade = getTrade(tradeSlug);
  const ctaText = trade?.ctaPrimary || 'Kostenlose Besichtigung anfragen';
  
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
<meta name="description" content="${cleanTopicTitle} in ${cityName} ✓ Fachbetriebe ✓ Kosten ✓ Tipps. Erfahren Sie alles Wichtige.">
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
<h1>${cleanTopicTitle} in ${cityName}</h1>
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
<a href="/${tradeSlug}/${citySlug}/#kontakt" class="cta-button">${ctaText}</a>
</div>
</article>
<a href="/${tradeSlug}/${citySlug}/" class="back-link">← Zurück zu ${tradeName} ${cityName}</a>
</div>
</body>
</html>`;
}

// ─── HAUPTFUNKTION ──────────────────────────────────────────────────

async function main() {
  console.log('🚀 TEMPLATE-BASIERTER Artikel-Generator');
  console.log('💰 KOSTEN: 0€ — Keine API-Aufrufe!');
  console.log(`📅 Monat: ${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  console.log(`🛡️  Max Artikel pro Run: ${MAX_ARTICLES_PER_RUN}`);
  console.log(`📊 Gewerke: ${Object.keys(SYSTEM_CONFIG.trades).length}`);
  console.log(`🏙️  Städte: ${Object.keys(SYSTEM_CONFIG.cities).length}`);
  
  // ═══ ZENTRALE CONFIG NUTZEN ═══
  const combinations = getAllCombinations();
  console.log(`\n📊 Kombinationen: ${combinations.length}`);
  console.log(`   ${Object.keys(SYSTEM_CONFIG.cities).length} Städte × ${Object.keys(SYSTEM_CONFIG.trades).length} Gewerke`);
  
  // Lade bestehenden Index
  const indexPath = path.join(process.cwd(), 'public', 'lib', 'article-index.json');
  let articleIndex = {};
  try {
    articleIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  } catch {
    articleIndex = {};
  }
  
  // Generiere Artikel (mit Limit)
  const monthSlug = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  let generatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < combinations.length; i++) {
    // Safety-Limit prüfen
    if (generatedCount >= MAX_ARTICLES_PER_RUN) {
      console.log(`\n🛡️  Safety-Limit erreicht (${MAX_ARTICLES_PER_RUN} Artikel). Stoppe hier.`);
      break;
    }
    
    const { tradeSlug, citySlug } = combinations[i];
    const trade = getTrade(tradeSlug);
    const city = getCity(citySlug);
    
    if (!trade || !city) {
      console.log(`⚠️  Ungültige Kombination: ${tradeSlug}/${citySlug}`);
      continue;
    }
    
    const cityName = city.name;
    const tradeName = trade.name;
    
    // Bestimme Topic (rotierend nach Monat)
    const topics = getArticleTopics(tradeSlug);
    const topicIndex = new Date().getMonth() % (topics?.length || 1);
    const topic = topics?.[topicIndex] || { 
      slug: 'allgemeiner-ratgeber', 
      title: (c) => `Ratgeber ${tradeName} in ${c}`,
      tag: 'Ratgeber'
    };
    
    const fullSlug = `${topic.slug}-${monthSlug}`;
    const filePath = path.join(process.cwd(), 'public', 'blog', tradeSlug, citySlug, `${fullSlug}.html`);
    
    // Prüfe ob existiert
    if (fs.existsSync(filePath)) {
      console.log(`⏭️  [${i+1}/${combinations.length}] ${tradeSlug}/${citySlug} — existiert bereits`);
      skippedCount++;
      continue;
    }
    
    console.log(`\n📝 [${i+1}/${combinations.length}] ${trade.emoji} ${tradeName} in ${cityName}`);
    console.log(`   Thema: ${typeof topic.title === 'function' ? topic.title(cityName) : topic.title}`);
    
    try {
      // TEMPLATE statt API!
      const { content, faqs } = generateArticleFromTemplate(tradeSlug, citySlug, cityName, tradeName, topic);
      
      // Speichern
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      
      const html = generateHTML(tradeSlug, citySlug, cityName, tradeName, topic, monthSlug, content, faqs);
      fs.writeFileSync(filePath, html, 'utf-8');
      
      // Wörter zählen
      const wordCount = content.split(/\s+/).length;
      
      // Index aktualisieren
      if (!articleIndex[tradeSlug]) articleIndex[tradeSlug] = {};
      if (!articleIndex[tradeSlug][citySlug]) articleIndex[tradeSlug][citySlug] = [];
      
      articleIndex[tradeSlug][citySlug].push({
        title: typeof topic.title === 'function' ? topic.title(cityName) : topic.title,
        excerpt: `Ratgeber zu ${typeof topic.title === 'function' ? topic.title(cityName) : topic.title} in ${cityName}.`,
        tag: topic.tag || 'Ratgeber',
        gradient: 'from-accent-500 to-accent-700',
        svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>',
        url: `/${tradeSlug}/${citySlug}/blog/${fullSlug}/`,
        slug: fullSlug,
        status: 'online',
        wordCount,
        aiGenerated: false,
        templateGenerated: true,
        publishedAt: new Date().toISOString(),
        monthSlug
      });
      
      console.log(`   ✅ Gespeichert (~${wordCount} Wörter)`);
      generatedCount++;
      
    } catch (error) {
      console.error(`   ❌ Fehler: ${error.message}`);
      errorCount++;
    }
  }
  
  // Speichere Index
  fs.writeFileSync(indexPath, JSON.stringify(articleIndex, null, 2), 'utf-8');
  
  console.log(`\n🎉 FERTIG!`);
  console.log(`   ✅ ${generatedCount} neue Artikel (Template)`);
  console.log(`   ⏭️  ${skippedCount} übersprungen`);
  console.log(`   ❌ ${errorCount} Fehler`);
  console.log(`   💰 Kosten: 0€`);
  
  process.exit(errorCount > 5 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
