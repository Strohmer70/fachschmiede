#!/usr/bin/env node
/**
 * BATCH-FIX: Fügt Bilder zu allen Landing Pages hinzu
 * - Hero-Background-Bild (trade.images.hero)
 * - "Über uns" Section mit Team-Bild (trade.images.team)
 * - Projekt-Galerie mit Projekt-Bild (trade.images.project)
 * 
 * Nutzung: node scripts/fix-landing-page-images.js
 */

const fs = require('fs');
const path = require('path');
const {
  SYSTEM_CONFIG,
  getAllCombinations,
  getTrade,
  getCity,
} = require('../config/system-config.js');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
let updated = 0;
let skipped = 0;
let errors = 0;

function fixPage(tradeSlug, citySlug) {
  const trade = getTrade(tradeSlug);
  const city = getCity(citySlug);
  const filePath = path.join(PUBLIC_DIR, tradeSlug, `${citySlug}.html`);
  
  if (!fs.existsSync(filePath)) {
    skipped++;
    return;
  }
  
  let html = fs.readFileSync(filePath, 'utf-8');
  
  // Check if already has images
  if (html.includes('background-image') || html.includes('Über uns')) {
    console.log(`  ⏭️  ${tradeSlug}/${citySlug} — already has images, skipping`);
    skipped++;
    return;
  }
  
  const hero = trade.images?.hero || '/images/hero.jpg';
  const team = trade.images?.team || '/images/team.jpg';
  const project = trade.images?.project || '/images/projekt.jpg';
  const tradeName = trade.name;
  const cityName = city.name;
  const color700 = trade.color?.[700] || '#1d4ed8';
  const color600 = trade.color?.[600] || '#2563eb';
  const color100 = trade.color?.[100] || '#dbeafe';
  
  // 1. Hero: Add background-image to .hero CSS
  // Find: .hero{background:linear-gradient(135deg,COLOR1,COLOR2);color:white;
  const heroRegex = /\.hero\{background:linear-gradient\(135deg,([^,]+),([^\)]+)\);color:white;/;
  if (heroRegex.test(html)) {
    html = html.replace(heroRegex, 
      `.hero{background:linear-gradient(rgba(15,23,42,0.55),rgba(15,23,42,0.55)),url('${hero}') center/cover no-repeat;color:white;`
    );
  }
  
  // 2. Add "Über uns" section before the kontakt section
  const aboutSection = `
<!-- ═══════════ ÜBER UNS ═══════════ -->
<section style="padding:60px 0;background:white;">
<div class="container" style="max-width:1000px;">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;" class="about-grid">
<div>
<p style="color:${color700};font-weight:700;text-transform:uppercase;font-size:0.8rem;letter-spacing:0.1em;margin-bottom:12px;">Über uns</p>
<h2 style="font-size:2rem;font-weight:800;margin-bottom:20px;color:#1e293b;">Ihr ${tradeName} in ${cityName}</h2>
<p style="color:#64748b;margin-bottom:16px;line-height:1.8;">Wir sind Ihr zuverlässiger Partner für ${tradeName.toLowerCase()}-Arbeiten in ${cityName} und Umgebung. Mit jahrelanger Erfahrung und einem eingespielten Team sorgen wir dafür, dass Ihr Projekt termingerecht und in höchster Qualität umgesetzt wird.</p>
<p style="color:#64748b;margin-bottom:24px;line-height:1.8;">Festpreis-Garantie, feste Termine und saubere Arbeitsweise — das ist unser Versprechen an Sie.</p>
<div style="display:flex;gap:24px;flex-wrap:wrap;">
<div style="text-align:center;">
<p style="font-size:2rem;font-weight:800;color:${color700};">15+</p>
<p style="font-size:0.8rem;color:#94a3b8;">Jahre Erfahrung</p>
</div>
<div style="text-align:center;">
<p style="font-size:2rem;font-weight:800;color:${color700};">500+</p>
<p style="font-size:0.8rem;color:#94a3b8;">Projekte</p>
</div>
<div style="text-align:center;">
<p style="font-size:2rem;font-weight:800;color:${color700};">100%</p>
<p style="font-size:0.8rem;color:#94a3b8;">Festpreis</p>
</div>
</div>
</div>
<div style="display:grid;gap:16px;">
<img src="${team}" alt="${tradeName} Team in ${cityName}" loading="lazy" style="width:100%;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<img src="${project}" alt="${tradeName} Projekt in ${cityName}" loading="lazy" style="width:100%;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
</div>
</div>
</div>
</section>
<style>@media(max-width:768px){.about-grid{grid-template-columns:1fr!important;}}</style>

<section id="kontakt"`;
  
  html = html.replace('<section id="kontakt"', aboutSection);
  
  // 3. Add Impressum/Datenschutz to footer
  const footerRegex = /<footer class="footer">\s*<div class="container">\s*<p>© 2026 fachschmiede\.de \|/;
  if (footerRegex.test(html) && !html.includes('Impressum')) {
    html = html.replace(
      /<p>© 2026 fachschmiede\.de \|([^<]+)<\/p>/,
      `<p>© 2026 fachschmiede.de | $1</p>
<p style="margin-top:12px;font-size:0.85rem;opacity:0.7;">
<a href="/impressum/" style="color:white;text-decoration:underline;">Impressum</a> · 
<a href="/datenschutz/" style="color:white;text-decoration:underline;">Datenschutz</a> · 
<a href="/" style="color:white;text-decoration:underline;">Portal</a>
</p>`
    );
  }
  
  fs.writeFileSync(filePath, html, 'utf-8');
  updated++;
  console.log(`  ✅ ${tradeSlug}/${citySlug} — hero + about + footer`);
}

// Main
console.log('🔧 Batch-Fix: Landing Page Bilder\n');
const combinations = getAllCombinations();

for (const { tradeSlug, citySlug } of combinations) {
  fixPage(tradeSlug, citySlug);
}

console.log(`\n═══════════════════════════`);
console.log(`✅ Updated: ${updated}`);
console.log(`⏭️  Skipped: ${skipped}`);
console.log(`❌ Errors: ${errors}`);
console.log(`═══════════════════════════`);
