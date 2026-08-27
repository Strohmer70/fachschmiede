#!/usr/bin/env node
/**
 * Vereinfacht alle Salespages auf einen Preis (189€/Monat)
 * Entfernt Basis/Pro Tarif-Auswahl
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const SALES_FILES = [
  'sales-dachdecker.html',
  'sales-elektriker.html',
  'sales-klempner.html',
  'sales-maler.html',
  'sales-zimmerer.html',
  'sales-garten-und-landschaftsbau.html',
];

// Vereinfachte Preis-Anzeige (statt Tarif-Auswahl)
const PRICE_HTML = `
            <div class="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-4">
              <div class="flex items-center justify-between">
                <span class="font-bold text-ink-900">Dein Preis</span>
                <span class="font-black text-2xl text-brand-600">189 €<span class="text-sm font-semibold text-ink-500">/Monat</span></span>
              </div>
              <p class="text-xs text-ink-500 mt-1">Inklusive: Website, Blog, E-Mail-Leads, Hosting, SSL, Updates</p>
            </div>`;

function simplifySalesPage(filePath) {
  let html = fs.readFileSync(filePath, 'utf-8');

  // 1. Tarif-Label entfernen
  html = html.replace(
    /<label class="block text-sm font-bold text-ink-800 mb-2">Dein Tarif \*<\/label>/,
    '<!-- Tarif entfernt – einfaches Preismodell -->'
  );

  // 2. Tarif-Radiobuttons entfernen
  html = html.replace(
    /<div class="grid grid-cols-2 gap-3 mb-4">[\s\S]*?<\/div>\s*(?=<div class="mb-4">|<label)/,
    PRICE_HTML
  );

  // 3. pickTarif() Funktion entfernen
  html = html.replace(
    /function pickTarif\(t\)\{[\s\S]*?\}\s*/,
    ''
  );

  // 4. tarif aus API-Request entfernen
  html = html.replace(
    /tarif: tarifEl \? tarifEl\.value : 'Basis',/g,
    ''
  );

  // 5. 289€ Referenzen entfernen
  html = html.replace(/289\s*€/g, '189 €');
  html = html.replace(/289€/g, '189€');

  fs.writeFileSync(filePath, html, 'utf-8');
  console.log(`✅ ${path.basename(filePath)} vereinfacht`);
}

for (const file of SALES_FILES) {
  const filePath = path.join(PUBLIC_DIR, file);
  if (fs.existsSync(filePath)) {
    simplifySalesPage(filePath);
  } else {
    console.log(`⚠️  ${file} nicht gefunden`);
  }
}

console.log('\n🏁 Alle Salespages vereinfacht!');
