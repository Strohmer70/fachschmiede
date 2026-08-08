#!/usr/bin/env node
/**
 * SEO-optimierte Artikel-Generierung V2
 * 
 * Ersetzt alle existierenden Artikel durch längere, SEO-bessere Versionen.
 * Nutzung: node scripts/generate-articles-v2.js
 */

const fs = require('fs');
const path = require('path');

// Templates laden
const { ARTICLE_TEMPLATES } = require('/root/.openclaw/workspace/fachschmiede/lib/article-templates-v2');

const TRADES = {
  dachdecker: { name: 'Dachdecker', plural: 'Dachdecker', slug: 'dachdecker' },
  elektriker: { name: 'Elektriker', plural: 'Elektriker', slug: 'elektriker' },
  shk: { name: 'Klempner', plural: 'Klempner', slug: 'shk' },
  maler: { name: 'Maler', plural: 'Maler', slug: 'maler' },
  zimmerer: { name: 'Zimmerer', plural: 'Zimmerer', slug: 'zimmerer' },
};

const CITIES = {
  'bergkamen': { name: 'Bergkamen', state: 'Nordrhein-Westfalen' },
  'bochum': { name: 'Bochum', state: 'Nordrhein-Westfalen' },
  'castrop-rauxel': { name: 'Castrop-Rauxel', state: 'Nordrhein-Westfalen' },
  'dortmund': { name: 'Dortmund', state: 'Nordrhein-Westfalen' },
  'ennepetal': { name: 'Ennepetal', state: 'Nordrhein-Westfalen' },
  'froendenberg': { name: 'Fröndenberg', state: 'Nordrhein-Westfalen' },
  'gevelsberg': { name: 'Gevelsberg', state: 'Nordrhein-Westfalen' },
  'hagen': { name: 'Hagen', state: 'Nordrhein-Westfalen' },
  'hattingen': { name: 'Hattingen', state: 'Nordrhein-Westfalen' },
  'herne': { name: 'Herne', state: 'Nordrhein-Westfalen' },
  'holzwickede': { name: 'Holzwickede', state: 'Nordrhein-Westfalen' },
  'iserlohn': { name: 'Iserlohn', state: 'Nordrhein-Westfalen' },
  'kamen': { name: 'Kamen', state: 'Nordrhein-Westfalen' },
  'luenen': { name: 'Lünen', state: 'Nordrhein-Westfalen' },
  'schwelm': { name: 'Schwelm', state: 'Nordrhein-Westfalen' },
  'schwerte': { name: 'Schwerte', state: 'Nordrhein-Westfalen' },
  'sprockhoevel': { name: 'Sprockhövel', state: 'Nordrhein-Westfalen' },
  'unna': { name: 'Unna', state: 'Nordrhein-Westfalen' },
  'wetter-ruhr': { name: 'Wetter (Ruhr)', state: 'Nordrhein-Westfalen' },
  'witten': { name: 'Witten', state: 'Nordrhein-Westfalen' },
};

// Unsplash Bild-Keywords pro Template
const UNSPLASH_IMAGES = {
  'dachdaemmung-foerderung': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
  'e-check-sicherheit': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80',
  'rohrbruch-sofortmassnahmen': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1200&q=80',
  'fassade-streichen-kosten': 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1200&q=80',
  'carport-bauen': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=80',
  'sturmschaden-dach': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
  '5-anzeichen-dachsanierung': 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80',
  'heizungs-check-winter': 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1200&q=80',
  'schimmel-wohnung': 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80',
  'wallbox-zuhause': 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&q=80',
  'smart-home-nachruesten': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1200&q=80',
  'holzterrasse-pflegen': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=80',
  'farben-raumwirkung': 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1200&q=80',
  'default': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80'
};

function getUnsplashImage(slug) {
  return UNSPLASH_IMAGES[slug] || UNSPLASH_IMAGES['default'];
}

function generateArticleHTML(template, trade, city, citySlug, tradeSlug) {
  const title = template.title(city.name, trade.name);
  const h1 = template.h1(city.name, trade.name);
  const metaDesc = template.metaDescription(city.name, trade.name);
  const imageUrl = getUnsplashImage(template.slug);
  
  // Schema.org Article JSON-LD
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": metaDesc,
    "image": imageUrl,
    "author": {
      "@type": "Organization",
      "name": `${trade.name} ${city.name}`,
      "url": `https://fachschmiede.de/${tradeSlug}/${citySlug}/`
    },
    "publisher": {
      "@type": "Organization",
      "name": "fachschmiede.de",
      "logo": {
        "@type": "ImageObject",
        "url": "https://fachschmiede.de/logo.png"
      }
    },
    "datePublished": new Date().toISOString().split('T')[0],
    "dateModified": new Date().toISOString().split('T')[0],
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://fachschmiede.de/${tradeSlug}/${citySlug}/blog/${template.slug}/`
    }
  };

  // FAQ Schema
  const faqs = template.faq(city.name, trade.name);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  };

  // Sections HTML bauen
  let sectionsHTML = '';
  template.sections.forEach((section, idx) => {
    const h2 = section.h2(city.name, trade.name);
    const content = section.content(city.name, trade.name, tradeSlug)
      .trim()
      .split('\n\n')
      .map(p => {
        // Interne Links parsen
        let processed = p
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #2563eb; text-decoration: none;">$1</a>');
        
        // Fettgedruckte Texte
        processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        return `<p>${processed}</p>`;
      })
      .join('\n      ');

    let listHTML = '';
    if (section.hasList && section.listItems) {
      const items = section.listItems(city.name, trade.name);
      listHTML = `
      <ul style="margin: 20px 0; padding-left: 24px;">
        ${items.map(item => `<li style="margin-bottom: 10px; color: #475569;">${item}</li>`).join('\n        ')}
      </ul>`;
    }

    sectionsHTML += `
      <h2 style="font-size: 1.5rem; font-weight: 700; margin: 40px 0 20px; color: #0f172a;">${h2}</h2>
      ${content}
      ${listHTML}
    `;
  });

  // FAQ HTML
  const faqHTML = faqs.map((f, i) => `
    <details style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 12px; overflow: hidden;">
      <summary style="padding: 20px; cursor: pointer; font-weight: 600; color: #0f172a; list-style: none; display: flex; justify-content: space-between; align-items: center;">
        ${f.q}
        <svg style="width: 20px; height: 20px; color: #64748b; flex-shrink: 0; margin-left: 12px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
      </summary>
      <div style="padding: 0 20px 20px; color: #475569; line-height: 1.7;">${f.a}</div>
    </details>
  `).join('\n');

  // Wortzählen für Debugging
  const plainText = sectionsHTML.replace(/<[^>]*>/g, '');
  const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${metaDesc}">
  <meta name="keywords" content="${trade.name}, ${city.name}, ${template.slug.replace(/-/g, ' ')}, Ruhrgebiet, Nordrhein-Westfalen">
  <meta name="author" content="${trade.name} ${city.name}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://fachschmiede.de/${tradeSlug}/${citySlug}/blog/${template.slug}/">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${metaDesc}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://fachschmiede.de/${tradeSlug}/${citySlug}/blog/${template.slug}/">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${metaDesc}">
  <meta name="twitter:image" content="${imageUrl}">
  
  <!-- Schema.org -->
  <script type="application/ld+json">${JSON.stringify(schemaData)}</script>
  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
  
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.7; }
    .container { max-width: 800px; margin: 0 auto; padding: 0 20px; }
    header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 40px 0; text-align: center; }
    header h1 { font-size: 2rem; font-weight: 800; margin-bottom: 10px; }
    header .meta { color: #94a3b8; font-size: 0.9rem; }
    .hero-image { width: 100%; height: 400px; object-fit: cover; }
    .content { background: white; margin: 40px auto; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .content h2 { font-size: 1.5rem; font-weight: 700; margin: 40px 0 20px; color: #0f172a; }
    .content h3 { font-size: 1.2rem; font-weight: 600; margin: 24px 0 12px; color: #334155; }
    .content p { margin-bottom: 20px; color: #475569; line-height: 1.8; }
    .content ul { margin: 20px 0; padding-left: 24px; }
    .content li { margin-bottom: 10px; color: #475569; }
    .content strong { color: #0f172a; }
    .content a { color: #2563eb; text-decoration: none; }
    .content a:hover { text-decoration: underline; }
    .breadcrumb { padding: 16px 0; font-size: 0.875rem; color: #64748b; }
    .breadcrumb a { color: #3b82f6; text-decoration: none; }
    .breadcrumb a:hover { text-decoration: underline; }
    .faq-section { margin-top: 40px; }
    .faq-section h2 { margin-bottom: 20px; }
    .cta-box { margin-top: 40px; padding: 30px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; text-align: center; }
    .cta-box h3 { margin-bottom: 16px; color: #92400e; }
    .cta-box p { margin-bottom: 20px; color: #78350f; }
    .cta-button { display: inline-block; padding: 14px 32px; background: #f59e0b; color: white; font-weight: 700; text-decoration: none; border-radius: 12px; transition: background 0.2s; }
    .cta-button:hover { background: #d97706; }
    .back-link { display: inline-block; margin-top: 30px; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .back-link:hover { background: #2563eb; }
    .word-count { text-align: center; color: #94a3b8; font-size: 0.875rem; margin-top: 20px; }
    @media (max-width: 640px) {
      header h1 { font-size: 1.5rem; }
      .content { padding: 24px; margin: 20px auto; }
      .hero-image { height: 250px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <div style="font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.1em; color: #60a5fa; margin-bottom: 8px;">${trade.name} in ${city.name}</div>
      <h1>${h1}</h1>
      <div class="meta">Aktualisiert: ${new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })} · 8 Min. Lesezeit · ${wordCount} Wörter</div>
    </div>
  </header>
  
  <img src="${imageUrl}" alt="${title}" class="hero-image" loading="lazy">
  
  <div class="container">
    <div class="breadcrumb">
      <a href="/${tradeSlug}/${citySlug}/">${city.name}</a> / <a href="/${tradeSlug}/${citySlug}/">${trade.name}</a> / Blog
    </div>
    
    <article class="content">
      <p style="font-size: 1.125rem; color: #334155; margin-bottom: 24px; font-weight: 500;">${metaDesc}</p>
      
      ${sectionsHTML}
      
      <div class="faq-section">
        <h2>Häufig gestellte Fragen</h2>
        ${faqHTML}
      </div>
      
      <div class="cta-box">
        <h3>Benötigen Sie einen ${trade.name} in ${city.name}?</h3>
        <p>Unsere Partnerbetriebe in ${city.name} helfen Ihnen gerne bei Ihrem Vorhaben. Kostenlose Beratung vor Ort.</p>
        <a href="/${tradeSlug}/${citySlug}/#kontakt" class="cta-button">Kostenloses Angebot anfordern</a>
      </div>
    </article>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="/${tradeSlug}/${citySlug}/" class="back-link">← Zurück zu ${trade.name} ${city.name}</a>
    </div>
    
    <div class="word-count">Artikel-ID: ${template.slug} · ${citySlug} · ${tradeSlug} · fachschmiede.de</div>
  </div>
</body>
</html>`;
}

async function generateAllArticles() {
  console.log('🚀 Starte SEO-Artikel-Generierung V2...\n');
  
  let totalGenerated = 0;
  let totalWords = 0;
  
  for (const [tradeSlug, trade] of Object.entries(TRADES)) {
    const templates = ARTICLE_TEMPLATES[tradeSlug];
    if (!templates) {
      console.log(`⚠️ Keine Templates für ${tradeSlug}, überspringe...`);
      continue;
    }
    
    for (const [citySlug, city] of Object.entries(CITIES)) {
      for (const template of templates) {
        const outputDir = path.join('/root/.openclaw/workspace/fachschmiede', 'public', 'blog', tradeSlug, citySlug);
        const outputFile = path.join(outputDir, `${template.slug}.html`);
        
        // Verzeichnis erstellen
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Artikel generieren
        const html = generateArticleHTML(template, trade, city, citySlug, tradeSlug);
        
        // Wörter zählen
        const wordCount = html.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;
        totalWords += wordCount;
        
        fs.writeFileSync(outputFile, html);
        totalGenerated++;
        
        process.stdout.write(`✅ ${tradeSlug}/${citySlug}/${template.slug}.html (${wordCount} Wörter)\n`);
      }
    }
  }
  
  console.log(`\n🎉 FERTIG!`);
  console.log(`   Artikel generiert: ${totalGenerated}`);
  console.log(`   Gesamtwortzahl: ${totalWords.toLocaleString()}`);
  console.log(`   Durchschnitt pro Artikel: ${Math.round(totalWords / totalGenerated)} Wörter`);
  console.log(`\n✨ Nächster Schritt: node scripts/build-article-index.js`);
}

generateAllArticles().catch(console.error);
