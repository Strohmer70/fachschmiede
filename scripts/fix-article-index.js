#!/usr/bin/env node
/**
 * Konvertiert den flachen article-index.json in das verschachtelte Format
 * das von app/[trade]/[city]/page.tsx erwartet wird.
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(process.cwd(), 'fachschmiede', 'lib', 'article-index.json');

// Lade flachen Index
const flatIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

// Konvertiere in verschachteltes Format
const nestedIndex = {};

for (const article of flatIndex) {
  const { trade, city, slug, title } = article;
  
  if (!nestedIndex[trade]) {
    nestedIndex[trade] = {};
  }
  if (!nestedIndex[trade][city]) {
    nestedIndex[trade][city] = [];
  }
  
  // Generiere URL basierend auf altem oder neuem Format
  const url = article.month 
    ? `/${trade}/${city}/blog/${slug}/`
    : `/${trade}/${city}/blog/${slug}/`;
  
  nestedIndex[trade][city].push({
    title: title,
    excerpt: article.excerpt || 'Wertvolle Tipps und Fachwissen für Ihr Projekt.',
    tag: article.tag || 'Ratgeber',
    gradient: article.gradient || 'from-accent-500 to-accent-700',
    svg: article.svg || '<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>',
    url: url
  });
}

// Speichere verschachtelten Index
fs.writeFileSync(indexPath, JSON.stringify(nestedIndex, null, 2), 'utf-8');

console.log('✅ Index konvertiert!');
console.log(`📊 Gewerke: ${Object.keys(nestedIndex).length}`);
console.log(`📊 Städte pro Gewerk: ${Object.keys(nestedIndex).map(t => `${t}: ${Object.keys(nestedIndex[t]).length}`).join(', ')}`);
console.log(`📊 Gesamt-Artikel: ${flatIndex.length}`);
