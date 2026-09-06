#!/usr/bin/env node
/**
 * Auto-Linking Article Generator for fachschmiede.de
 *
 * Generates ONE article at a time via Moonshot API and automatically
 * integrates it into the corresponding city page's "Ratgeber" section.
 *
 * Usage:
 *   node scripts/auto-article-generator.js [trade] [city] [topic]
 *
 * Examples:
 *   node scripts/auto-article-generator.js
 *     → Auto-discovers next missing article
 *   node scripts/auto-article-generator.js dachdecker bochum "dachfenster-einbauen"
 *     → Generates specific article
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// ─── KONFIGURATION ──────────────────────────────────────────────────

const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY || 'sk-dflfmQZYslaRgqiVP8edlrh6JKG8Kepm5GkTqZkSmf7pmGgp';
const MOONSHOT_API_URL = 'https://api.moonshot.ai/v1/chat/completions';
const MAX_ARTICLES_PER_RUN = 1; // Safety limit — one at a time

// Trade mapping: filename prefix → { slug, name }
const TRADE_MAP = {
  'dach':    { slug: 'dachdecker',   name: 'Dachdecker',   plural: 'Dachdecker' },
  'elek':    { slug: 'elektriker',   name: 'Elektriker',   plural: 'Elektriker' },
  'klempner':{ slug: 'klempner',     name: 'Klempner',     plural: 'Klempner' },
  'maler':   { slug: 'maler',        name: 'Maler',        plural: 'Maler' },
  'zimm':    { slug: 'zimmerer',     name: 'Zimmerer',     plural: 'Zimmerer' },
  'garten':  { slug: 'gartenpflege', name: 'Gartenpflege', plural: 'Garten- und Landschaftsbau' },
  'fliesen': { slug: 'fliesenleger', name: 'Fliesenleger', plural: 'Fliesenleger' },
  'schorn':  { slug: 'schornsteinfeger', name: 'Schornsteinfeger', plural: 'Schornsteinfeger' },
  'schrein': { slug: 'schreiner',    name: 'Schreiner',    plural: 'Schreiner' },
};

// Topics per trade (for auto-discovery)
const TOPICS = {
  dachdecker: [
    { slug: 'dachfenster-einbauen',         title: 'Dachfenster einbauen',         keyword: 'Dachfenster' },
    { slug: 'dachziegelarten-vergleich',    title: 'Dachziegelarten im Vergleich', keyword: 'Dachziegel' },
    { slug: 'dachdaemmung-kosten',          title: 'Dachdämmung Kosten',           keyword: 'Dachdämmung' },
    { slug: 'dachdaemmung-foerderung',      title: 'Dachdämmung fördern lassen',   keyword: 'Dachdämmung Förderung' },
    { slug: 'sturmschaden-dach',            title: 'Sturmschaden am Dach',         keyword: 'Sturmschaden' },
    { slug: '5-anzeichen-dachsanierung',    title: '5 Anzeichen für nötige Dachsanierung', keyword: 'Dachsanierung' },
  ],
  elektriker: [
    { slug: 'e-check-sicherheit',           title: 'E-Check: Sicherheitsprüfung',  keyword: 'E-Check' },
    { slug: 'wallbox-zuhause',              title: 'Wallbox installieren',         keyword: 'Wallbox' },
    { slug: 'smart-home-nachruesten',       title: 'Smart Home nachrüsten',        keyword: 'Smart Home' },
    { slug: 'led-beleuchtung-2026',         title: 'LED-Beleuchtung 2026',         keyword: 'LED Beleuchtung' },
    { slug: 'sicherungskasten-erneuern',    title: 'Sicherungskasten erneuern',    keyword: 'Sicherungskasten' },
    { slug: 'photovoltaik-anschluss',       title: 'Photovoltaik-Anschluss',       keyword: 'Photovoltaik' },
  ],
  klempner: [
    { slug: 'wasserdruck-optimieren',       title: 'Wasserdruck optimieren',       keyword: 'Wasserdruck' },
    { slug: 'abfluss-verstopft',            title: 'Abfluss verstopft',            keyword: 'Verstopfter Abfluss' },
    { slug: 'warmwasserspeicher-tauschen',  title: 'Warmwasserspeicher tauschen',  keyword: 'Warmwasserspeicher' },
    { slug: 'heizkoerper-entlueften',       title: 'Heizkörper entlüften',         keyword: 'Heizkörper' },
    { slug: 'badrenovierung-planen',        title: 'Badrenovierung planen',         keyword: 'Badrenovierung' },
    { slug: 'wasserschaden-sanierung',      title: 'Wasserschaden-Sanierung',      keyword: 'Wasserschaden' },
  ],
  maler: [
    { slug: 'tapezierarbeiten-kosten',      title: 'Tapezierarbeiten Kosten',      keyword: 'Tapezierarbeiten' },
    { slug: 'fassadensanierung-2026',       title: 'Fassadensanierung 2026',       keyword: 'Fassadensanierung' },
    { slug: 'malerkosten-pro-qm',           title: 'Malerkosten pro m²',           keyword: 'Malerkosten' },
    { slug: 'tapeten-trends-2026',          title: 'Tapeten-Trends 2026',          keyword: 'Tapeten' },
    { slug: 'lasuren-holzschutz',           title: 'Lasuren & Holzschutz',         keyword: 'Lasuren' },
    { slug: 'keller-anstreichen',           title: 'Keller richtig anstreichen',   keyword: 'Keller streichen' },
  ],
  zimmerer: [
    { slug: 'holzschutz-terrassen',         title: 'Holzschutz für Terrassen',     keyword: 'Holzschutz' },
    { slug: 'carport-planung',              title: 'Carport Planung',              keyword: 'Carport' },
    { slug: 'gauben-ausbauen',              title: 'Gauben ausbauen',              keyword: 'Gaube' },
    { slug: 'holzterrasse-verlegen',        title: 'Holzterrasse verlegen',        keyword: 'Holzterrasse' },
    { slug: 'dachstuhl-reparatur',          title: 'Dachstuhl-Reparatur',          keyword: 'Dachstuhl' },
    { slug: 'wintergarten-holz',            title: 'Wintergarten aus Holz',        keyword: 'Wintergarten' },
  ],
  gartenpflege: [
    { slug: 'rasenpflege-fruehling',        title: 'Rasenpflege im Frühling',      keyword: 'Rasenpflege' },
    { slug: 'hecke-schneiden',              title: 'Hecke richtig schneiden',      keyword: 'Hecke schneiden' },
    { slug: 'baumfaellung-kosten',          title: 'Baumfällung Kosten',           keyword: 'Baumfällung' },
    { slug: 'gartengestaltung-ideen',       title: 'Gartengestaltung Ideen',       keyword: 'Gartengestaltung' },
    { slug: 'unkrautbekaempfung',           title: 'Unkrautbekämpfung',            keyword: 'Unkraut' },
    { slug: 'gartenwintervorbereitung',     title: 'Garten Wintervorbereitung',    keyword: 'Garten Winter' },
  ],
};

// ─── HILFSFUNKTIONEN ────────────────────────────────────────────────

function getMonthSlug() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getCityDisplayName(citySlug) {
  return citySlug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace('Ruhr', '(Ruhr)');
}

function discoverCityTradeCombinations() {
  const publicDir = path.join(PROJECT_ROOT, 'public');
  const files = fs.readdirSync(publicDir);
  const combinations = [];

  for (const file of files) {
    const match = file.match(/^stadt-([a-z]+)-(.+)\.html$/);
    if (match) {
      const tradeCode = match[1];
      const citySlug = match[2];
      const tradeInfo = TRADE_MAP[tradeCode];
      if (tradeInfo) {
        combinations.push({ citySlug, tradeCode, tradeSlug: tradeInfo.slug, tradeName: tradeInfo.name });
      }
    }
  }
  return combinations;
}

function findNextMissingArticle(combinations) {
  const monthSlug = getMonthSlug();

  for (const combo of combinations) {
    const topics = TOPICS[combo.tradeSlug] || [];
    for (const topic of topics) {
      const fileName = `${topic.slug}-${monthSlug}.html`;
      const filePath = path.join(process.cwd(), 'public', 'blog', combo.tradeSlug, combo.citySlug, fileName);
      if (!fs.existsSync(filePath)) {
        return { ...combo, topic, monthSlug };
      }
    }
  }
  return null;
}

// ─── KIMI API ───────────────────────────────────────────────────────

async function callKimiAPI(prompt, maxRetries = 3) {
  const body = {
    model: 'kimi-k2.6',
    messages: [
      {
        role: 'system',
        content: 'Du bist ein erfahrener deutscher SEO-Content-Writer spezialisiert auf Handwerker- und Baubranche. Du schreibst fundierte, lokale Ratgeber-Artikel mit präziser HTML-Ausgabe.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 1,
    max_tokens: 16000,
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(MOONSHOT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${MOONSHOT_API_KEY}`,
        },
        body: JSON.stringify(body),
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
      console.log(`   ⚠️  API-Fehler (Versuch ${attempt}/${maxRetries}): ${error.message}. Warte ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ─── ARTICLE GENERATION ─────────────────────────────────────────────

async function generateArticleHTML(tradeSlug, citySlug, cityName, tradeName, topic, monthSlug) {
  const fullSlug = `${topic.slug}-${monthSlug}`;
  const year = new Date().getFullYear();
  const title = `${topic.title} in ${cityName}: Ratgeber & Kosten ${year}`;
  const h1 = `${topic.title} in ${cityName}: Was Sie wissen müssen`;
  const metaDesc = `${topic.title} in ${cityName} ✓ Fachbetriebe ✓ Kosten ✓ Tipps. Erfahren Sie alles Wichtige im ${year}-Ratgeber.`;
  const todayISO = new Date().toISOString();
  const todayDE = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  const prompt = `Schreibe einen umfassenden, SEO-optimierten Ratgeber-Artikel über "${topic.title}" in ${cityName}.

ANFORDERUNGEN:
- Länge: 1200-1800 Wörter
- Sprache: Deutsch (Deutschland)
- Zielgruppe: Hausbesitzer und Immobilienbesitzer in ${cityName}
- Ton: Professionell, vertrauenswürdig, lokal – geschrieben aus Sicht eines erfahrenen ${tradeName}

WICHTIGE FORMATIERUNG:
- Verwende ## für Hauptüberschriften
- Verwende ### für Unterüberschriften
- Nutze **fett** für wichtige Begriffe
- Schreibe konkrete, realistische Zahlen/Preise
- Füge 4-5 FAQ-Paare im Format **Frage:** / **Antwort:** ein
- Erwähne "${cityName}" und typische Stadtteile/Wohngebiete natürlich
- Bezug auf Altbauten aus den 50er-70er Jahren (typisch für Ruhrgebiet)

STRUKTUR:
## Einleitung
## Warum ist das Thema wichtig?
## Die wichtigsten Aspekte im Detail
## Kosten in ${cityName} ${year}
## So finden Sie den richtigen Fachbetrieb
## Häufig gestellte Fragen
## Fazit

GIB NUR DEN ARTIKEL-TEXT ZURÜCK (keine Einleitung, keine Erklärung).`;

  const rawContent = await callKimiAPI(prompt);

  // Parse FAQ pairs
  const faqs = [];
  const faqRegex = /\*\*Frage:\*\*\s*(.+?)\n\*\*Antwort:\*\*\s*(.+?)(?=\n\*\*Frage:|\n## |$)/gs;
  let match;
  while ((match = faqRegex.exec(rawContent)) !== null) {
    faqs.push({ q: match[1].trim(), a: match[2].trim() });
  }
  if (faqs.length === 0) {
    faqs.push(
      { q: `Wie lange dauert ${topic.title} in ${cityName}?`, a: `Die Dauer hängt vom Umfang ab. In der Regel rechnen Sie mit 1–3 Werktagen für Standardarbeiten.` },
      { q: `Was kostet ${topic.title} in ${cityName}?`, a: `Die Kosten liegen je nach Projekt zwischen 500 und 5.000 Euro. Ein konkretes Angebot erhalten Sie nach einer kostenlosen Vor-Ort-Besichtigung.` },
      { q: `Benötige ich eine Genehmigung in ${cityName}?`, a: `Für kleinere Reparaturen und Instandsetzungen meist nicht. Bei größeren baulichen Veränderungen kann eine Baugenehmigung erforderlich sein – Ihr Fachbetrieb berät Sie hierzu.` }
    );
  }

  // Convert markdown to HTML
  let articleBody = rawContent
    .replace(/^###\s+(.+)$/gm, '<h2 style="font-size:1.25rem;margin:30px 0 15px;">$1</h2>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*\*Frage:\*\*\s*.+?\n\*\*Antwort:\*\*\s*.+?(?=\n\*\*Frage:|\n## |$)/gs, ''); // Remove FAQ from body, we'll render separately

  // Re-split into paragraphs
  articleBody = articleBody
    .split('\n\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => {
      if (p.startsWith('<h2')) return p;
      if (p.startsWith('<h3')) return p;
      if (p.startsWith('<ul>') || p.startsWith('<li>')) return p;
      if (p.startsWith('<')) return `<p>${p}</p>`;
      return `<p>${p}</p>`;
    })
    .join('\n');

  // Build FAQ HTML
  const faqHTML = faqs.map((faq) => `
<details style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px;overflow:hidden;">
  <summary style="padding:20px;cursor:pointer;font-weight:600;color:#0f172a;list-style:none;display:flex;justify-content:space-between;align-items:center;">${faq.q}<svg style="width:20px;height:20px;color:#64748b;flex-shrink:0;margin-left:12px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg></summary>
  <div style="padding:0 20px 20px;color:#475569;line-height:1.7;">${faq.a}</div>
</details>`).join('\n');

  // Build related articles links (existing articles in same city/trade)
  const blogDir = path.join(PROJECT_ROOT, 'public', 'blog', tradeSlug, citySlug);
  let relatedLinks = '';
  if (fs.existsSync(blogDir)) {
    const existing = fs.readdirSync(blogDir).filter((f) => f.endsWith('.html') && f !== `${fullSlug}.html`);
    if (existing.length > 0) {
      const links = existing.slice(0, 3).map((f) => {
        const name = f.replace('.html', '').replace(/-\d{4}-\d{2}$/, '').replace(/-/g, ' ');
        return `<p><a href="/blog/${tradeSlug}/${citySlug}/${f}">→ ${name.charAt(0).toUpperCase() + name.slice(1)} in ${cityName}</a></p>`;
      });
      relatedLinks = `<h2>Weitere Artikel für ${cityName}</h2>\n` + links.join('\n') + `\n<p><a href="/${tradeSlug}/${citySlug}/">→ Hauptseite: ${tradeName} ${cityName}</a></p>`;
    }
  }

  // Hero image (Unsplash based on topic)
  const heroImages = {
    dachdecker: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
    elektriker: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80',
    klempner: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1200&q=80',
    maler: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1200&q=80',
    zimmerer: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80',
    gartenpflege: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1200&q=80',
  };
  const heroImage = heroImages[tradeSlug] || heroImages.dachdecker;

  // JSON-LD
  const jsonLdArticle = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: metaDesc,
    image: heroImage,
    datePublished: todayISO,
    dateModified: todayISO,
    author: { '@type': 'Organization', name: `${tradeName} ${cityName}`, url: `https://fachschmiede.de/${tradeSlug}/${citySlug}/` },
    publisher: { '@type': 'Organization', name: 'fachschmiede.de', logo: { '@type': 'ImageObject', url: 'https://fachschmiede.de/logo.png' } },
  });

  const jsonLdFAQ = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  });

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${metaDesc}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://fachschmiede.de/${tradeSlug}/${citySlug}/blog/${fullSlug}/">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${metaDesc}">
<meta property="og:image" content="${heroImage}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://fachschmiede.de/${tradeSlug}/${citySlug}/blog/${fullSlug}/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${metaDesc}">
<meta name="twitter:image" content="${heroImage}">
<script type="application/ld+json">${jsonLdArticle}</script>
<script type="application/ld+json">${jsonLdFAQ}</script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
body{font-family:'Inter',system-ui,sans-serif;background:#f8fafc;color:#1e293b;line-height:1.7;margin:0}
.container{max-width:800px;margin:0 auto;padding:0 20px}
header{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);color:white;padding:40px 0;text-align:center}
h1{font-size:2rem;font-weight:800;margin-bottom:10px}
.meta{color:#94a3b8;font-size:0.9rem}
.hero-image{width:100%;height:400px;object-fit:cover;display:block}
.img-caption{text-align:center;color:#64748b;font-size:0.875rem;padding:8px 0;font-style:italic}
.content{background:white;margin:40px auto;padding:40px;border-radius:16px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)}
h2{font-size:1.5rem;font-weight:700;margin:40px 0 20px;color:#0f172a}
p{margin-bottom:20px;color:#475569;line-height:1.8}
ul{margin:20px 0;padding-left:24px}
li{margin-bottom:12px;color:#475569}
a{color:#2563eb;text-decoration:none}
a:hover{text-decoration:underline}
.cta-box{margin-top:40px;padding:30px;background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border-radius:16px;text-align:center}
.cta-box h3{color:#92400e;margin-bottom:16px}
.cta-box p{color:#78350f;margin-bottom:20px}
.cta-button{display:inline-block;padding:14px 32px;background:#f59e0b;color:white;font-weight:700;text-decoration:none;border-radius:12px;transition:background 0.2s}
.cta-button:hover{background:#d97706}
.back-link{display:inline-block;margin-top:30px;padding:12px 24px;background:#3b82f6;color:white;text-decoration:none;border-radius:8px;font-weight:600}
.back-link:hover{background:#2563eb}
table{width:100%;border-collapse:collapse;margin:20px 0;font-size:0.95rem}
th,td{padding:14px 16px;text-align:left;border-bottom:1px solid #e2e8f0}
th{background:#f1f5f9;font-weight:600;color:#0f172a}
tr:hover{background:#f8fafc}
.price-highlight{font-size:1.25rem;font-weight:700;color:#059669}
.tip-box{background:#ecfdf5;border-left:4px solid #059669;padding:20px;border-radius:0 12px 12px 0;margin:24px 0}
.tip-box strong{color:#065f46}
@media(max-width:640px){h1{font-size:1.5rem}.content{padding:24px;margin:20px auto}.hero-image{height:250px}th,td{padding:10px 8px;font-size:0.85rem}}
</style>
</head>
<body>
<header>
<div class="container">
<div style="font-size:0.875rem;text-transform:uppercase;letter-spacing:0.1em;color:#60a5fa;margin-bottom:8px;">${tradeName} in ${cityName}</div>
<h1>${h1}</h1>
<div class="meta">Aktualisiert: ${todayDE} · 10 Min. Lesezeit</div>
</div>
</header>
<img src="${heroImage}" alt="${topic.title} in ${cityName} - Ratgeber & Kosten ${year}" class="hero-image" loading="lazy">
<div class="img-caption">Professioneller ${tradeName}-Service in ${cityName} und dem Ruhrgebiet</div>
<div class="container">
<div class="breadcrumb" style="padding:16px 0;font-size:0.875rem;color:#64748b;"><a href="/${tradeSlug}/${citySlug}/">${cityName}</a> / <a href="/${tradeSlug}/${citySlug}/">${tradeName}</a> / Blog</div>
<article class="content">
<p style="font-size:1.125rem;color:#334155;margin-bottom:24px;font-weight:500;">${topic.title} in ${cityName} – ein wichtiges Thema für Hausbesitzer. In diesem Ratgeber erfahren Sie alles Wichtige zu Kosten, Ablauf und worauf es bei der Auswahl eines Fachbetriebs ankommt.</p>

${articleBody}

<div style="margin-top:40px">
<h2>Häufig gestellte Fragen</h2>
${faqHTML}
</div>

${relatedLinks}

<div class="cta-box">
<h3>Benötigen Sie einen ${tradeName} in ${cityName}?</h3>
<p>Unsere Partnerbetriebe in ${cityName} helfen Ihnen gerne bei Ihrem Vorhaben. Kostenlose Beratung vor Ort inklusive detaillierter Kostenkalkulation.</p>
<a href="/${tradeSlug}/${citySlug}/#kontakt" class="cta-button">Kostenloses Angebot anfordern</a>
</div>
</article>
<div style="text-align:center;margin:40px 0">
<a href="/${tradeSlug}/${citySlug}/" class="back-link">← Zurück zu ${tradeName} ${cityName}</a>
</div>
</div>
</body>
</html>`;

  return { html, title, fullSlug };
}

// ─── INDEX UPDATE ───────────────────────────────────────────────────

function updateArticleIndex(tradeSlug, citySlug, title, fullSlug) {
  const indexPath = path.join(PROJECT_ROOT, 'lib', 'article-index.json');
  let index = {};
  try {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  } catch {
    index = {};
  }

  if (!index[tradeSlug]) index[tradeSlug] = {};
  if (!index[tradeSlug][citySlug]) index[tradeSlug][citySlug] = [];

  // Avoid duplicates
  const existing = index[tradeSlug][citySlug].find((a) => a.url === `/${tradeSlug}/${citySlug}/blog/${fullSlug}/`);
  if (!existing) {
    index[tradeSlug][citySlug].unshift({
      title: title,
      excerpt: `Ratgeber zu ${title.split(' in ')[0]} in ${getCityDisplayName(citySlug)}.`,
      tag: 'Ratgeber',
      gradient: 'from-accent-500 to-accent-700',
      svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>',
      url: `/${tradeSlug}/${citySlug}/blog/${fullSlug}/`,
    });
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
    console.log('   🗂️   article-index.json aktualisiert');
  }
}

// ─── MAIN ───────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Auto-Linking Article Generator gestartet');
  console.log(`📅 Monat: ${getMonthSlug()}`);
  console.log(`🛡️  Max Artikel pro Run: ${MAX_ARTICLES_PER_RUN}`);

  if (!MOONSHOT_API_KEY) {
    console.error('❌ MOONSHOT_API_KEY fehlt!');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  let targetTrade = args[0] || null;
  let targetCity = args[1] || null;
  let targetTopic = args[2] || null;

  let combo;

  if (targetTrade && targetCity) {
    // Validate trade
    let tradeCode = null;
    let tradeInfo = null;
    for (const [code, info] of Object.entries(TRADE_MAP)) {
      if (info.slug === targetTrade) {
        tradeCode = code;
        tradeInfo = info;
        break;
      }
    }
    if (!tradeInfo) {
      console.error(`❌ Unbekanntes Gewerk: ${targetTrade}`);
      process.exit(1);
    }

    // Check city page exists
    const cityPagePath = path.join(PROJECT_ROOT, 'public', `stadt-${tradeCode}-${targetCity}.html`);
    if (!fs.existsSync(cityPagePath)) {
      console.error(`❌ Stadtseite nicht gefunden: ${cityPagePath}`);
      process.exit(1);
    }

    let topic;
    if (targetTopic) {
      topic = { slug: targetTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), title: targetTopic, keyword: targetTopic.split(' ')[0] };
    } else {
      const topics = TOPICS[targetTrade] || [];
      const monthSlug = getMonthSlug();
      topic = topics.find((t) => !fs.existsSync(path.join(PROJECT_ROOT, 'public', 'blog', targetTrade, targetCity, `${t.slug}-${monthSlug}.html`)));
      if (!topic) {
        console.error(`❌ Kein fehlendes Thema für ${targetTrade}/${targetCity} gefunden`);
        process.exit(1);
      }
    }

    combo = { citySlug: targetCity, tradeCode, tradeSlug: tradeInfo.slug, tradeName: tradeInfo.name, topic, monthSlug: getMonthSlug() };
  } else {
    // Auto-discover
    const combinations = discoverCityTradeCombinations();
    if (combinations.length === 0) {
      console.error('❌ Keine stadt-*.html Dateien gefunden!');
      process.exit(1);
    }
    combo = findNextMissingArticle(combinations);
    if (!combo) {
      console.log('✅ Alle Artikel für diesen Monat bereits vorhanden.');
      process.exit(0);
    }
  }

  const { citySlug, tradeCode, tradeSlug, tradeName, topic, monthSlug } = combo;
  const cityName = getCityDisplayName(citySlug);
  const fullSlug = `${topic.slug}-${monthSlug}`;
  const filePath = path.join(PROJECT_ROOT, 'public', 'blog', tradeSlug, citySlug, `${fullSlug}.html`);

  // ── IDEMPOTENCY CHECK ──
  if (fs.existsSync(filePath)) {
    console.log(`⏭️  Artikel existiert bereits: ${filePath}`);
    process.exit(0);
  }

  console.log(`\n📝 Generiere Artikel:`);
  console.log(`   Gewerk: ${tradeName} (${tradeSlug})`);
  console.log(`   Stadt:  ${cityName} (${citySlug})`);
  console.log(`   Thema:  ${topic.title}`);
  console.log(`   Datei:  ${filePath}`);

  // ── GENERATE ARTICLE ──
  let html, title;
  try {
    const result = await generateArticleHTML(tradeSlug, citySlug, cityName, tradeName, topic, monthSlug);
    html = result.html;
    title = result.title;
    console.log(`   ✅ HTML generiert (${html.length} Zeichen)`);
  } catch (error) {
    console.error(`   ❌ Fehler bei der Generierung: ${error.message}`);
    process.exit(1);
  }

  // ── SAVE ARTICLE ──
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, html, 'utf-8');
    console.log(`   💾 Gespeichert: ${filePath}`);
  } catch (error) {
    console.error(`   ❌ Fehler beim Speichern: ${error.message}`);
    process.exit(1);
  }

  // ── UPDATE CITY PAGE ──
  const cityPagePath = path.join(PROJECT_ROOT, 'public', `stadt-${tradeCode}-${citySlug}.html`);
  if (fs.existsSync(cityPagePath)) {
    try {
      const addArticle = require('./add-article-to-city');
      await addArticle(cityPagePath, {
        href: `/blog/${tradeSlug}/${citySlug}/${fullSlug}.html`,
        tradeName,
        cityName,
        title,
      });
      console.log(`   🔗 Stadtseite aktualisiert: ${cityPagePath}`);
    } catch (error) {
      console.warn(`   ⚠️  Stadtseite konnte nicht aktualisiert werden: ${error.message}`);
      // Non-fatal: article exists, city page can be fixed manually
    }
  } else {
    console.warn(`   ⚠️  Stadtseite nicht gefunden: ${cityPagePath}`);
  }

  // ── UPDATE INDEX ──
  try {
    updateArticleIndex(tradeSlug, citySlug, title, fullSlug);
  } catch (error) {
    console.warn(`   ⚠️  Index konnte nicht aktualisiert werden: ${error.message}`);
  }

  console.log(`\n🎉 FERTIG!`);
  console.log(`   Artikel: ${filePath}`);
  console.log(`   URL:     /blog/${tradeSlug}/${citySlug}/${fullSlug}.html`);
  console.log(`   Titel:   ${title}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
