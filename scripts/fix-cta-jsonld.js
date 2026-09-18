#!/usr/bin/env node
/**
 * BATCH-FIX 2: "Jetzt mieten" CTA + JSON-LD zu allen Landing Pages
 */

const fs = require('fs');
const path = require('path');
const {
  getAllCombinations,
  getTrade,
  getCity,
} = require('../config/system-config.js');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
let updated = 0;
let skipped = 0;

const DIR_MAP = {
  'garten-und-landschaftsbau': 'gartenbau',
};

function fixPage(tradeSlug, citySlug) {
  const dir = DIR_MAP[tradeSlug] || tradeSlug;
  const trade = getTrade(tradeSlug);
  const city = getCity(citySlug);
  const filePath = path.join(PUBLIC_DIR, dir, `${citySlug}.html`);
  
  if (!fs.existsSync(filePath)) { skipped++; return; }
  
  let html = fs.readFileSync(filePath, 'utf-8');
  
  if (html.includes('Jetzt mieten')) {
    console.log(`  ⏭️  ${dir}/${citySlug} — already has CTA`);
    skipped++;
    return;
  }
  
  const tradeName = trade.name;
  const cityName = city.name;
  const color700 = trade.color?.[700] || '#1d4ed8';
  const color600 = trade.color?.[600] || '#2563eb';
  const emoji = trade.emoji || '🏗️';
  
  // 1. Add JSON-LD LocalBusiness schema before </head>
  const jsonLd = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "${tradeName} in ${cityName} | fachschmiede.de",
  "description": "${tradeName} in ${cityName} — Festpreis, feste Termine, Garantie.",
  "url": "https://www.fachschmiede.de/${dir}/${citySlug}/",
  "telephone": "",
  "email": "hello@fachschmiede.de",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "${cityName}",
    "addressRegion": "Nordrhein-Westfalen",
    "addressCountry": "DE"
  },
  "areaServed": { "@type": "City", "name": "${cityName}" },
  "priceRange": "€€"
}
</script>
</head>`;
  
  html = html.replace('</head>', jsonLd);
  
  // 2. Add "Jetzt mieten" banner before the kontakt section
  const rentBanner = `
<!-- ═══════════ JETZT MIETEN BANNER ═══════════ -->
<section style="padding:60px 0;background:linear-gradient(135deg,${color700},${color600});color:white;text-align:center;">
<div class="container" style="max-width:700px;">
<div style="font-size:2.5rem;margin-bottom:16px;">${emoji}</div>
<h2 style="font-size:2rem;font-weight:800;margin-bottom:16px;">Diese Seite ist frei — Jetzt mieten!</h2>
<p style="font-size:1.15rem;opacity:0.9;margin-bottom:12px;">Werden Sie <strong>der ${tradeName} in ${cityName}</strong>, den Kunden über Google finden.</p>
<p style="font-size:1rem;opacity:0.8;margin-bottom:32px;">Festpreis · Monatlich kündbar · Sofort startklar</p>
<div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
<a href="/fuer-dienstleister/#preise" style="display:inline-block;padding:16px 36px;background:white;color:${color700};font-weight:800;border-radius:12px;text-decoration:none;font-size:1.1rem;box-shadow:0 4px 6px rgba(0,0,0,0.2);">📋 Preise ansehen</a>
<a href="/fuer-dienstleister/" style="display:inline-block;padding:16px 36px;background:rgba(255,255,255,0.15);color:white;font-weight:700;border-radius:12px;text-decoration:none;font-size:1.1rem;border:2px solid rgba(255,255,255,0.4);">Mehr erfahren →</a>
</div>
</div>
</section>

<section id="kontakt"`;
  
  html = html.replace('<section id="kontakt"', rentBanner);
  
  fs.writeFileSync(filePath, html, 'utf-8');
  updated++;
  console.log(`  ✅ ${dir}/${citySlug} — JSON-LD + Miet-CTA`);
}

console.log('🔧 Batch-Fix 2: Miet-CTA + JSON-LD\n');
const combinations = getAllCombinations();
for (const { tradeSlug, citySlug } of combinations) {
  fixPage(tradeSlug, citySlug);
}

console.log(`\n✅ Updated: ${updated} | ⏭️ Skipped: ${skipped}`);
