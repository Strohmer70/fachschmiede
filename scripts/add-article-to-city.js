#!/usr/bin/env node
/**
 * add-article-to-city.js
 *
 * Helper that inserts a new article card into a city page's "Ratgeber" grid.
 * Inserts as FIRST item, preserving all existing cards.
 *
 * Usage:
 *   const addArticle = require('./add-article-to-city');
 *   await addArticle('/path/to/stadt-dach-bochum.html', {
 *     href: '/blog/dachdecker/bochum/dachfenster-einbauen-2026-09.html',
 *     tradeName: 'Dachdecker',
 *     cityName: 'Bochum',
 *     title: 'Dachfenster einbauen in Bochum: Ratgeber & Kosten 2026'
 *   });
 */

const fs = require('fs');

/**
 * Insert a new article card into the city page's Ratgeber grid.
 *
 * @param {string} cityPagePath - Absolute path to the city HTML file
 * @param {object} article - Article data
 * @param {string} article.href - Link to the article
 * @param {string} article.tradeName - e.g. "Dachdecker"
 * @param {string} article.cityName - e.g. "Bochum"
 * @param {string} article.title - Article title
 */
function addArticleToCity(cityPagePath, article) {
  if (!fs.existsSync(cityPagePath)) {
    throw new Error(`City page not found: ${cityPagePath}`);
  }

  let html = fs.readFileSync(cityPagePath, 'utf-8');

  // Build the new article card HTML (matching existing structure exactly)
  const newCard = `      <a href="${article.href}" class="reveal block bg-white rounded-2xl overflow-hidden border border-ink-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 group">
        <div class="h-44 bg-gradient-to-br from-brand-100 to-amber-100 flex items-center justify-center text-5xl group-hover:scale-105 transition duration-500">📖</div>
        <div class="p-5">
          <p class="text-xs font-bold text-brand-600 uppercase tracking-wider">${article.tradeName} · ${article.cityName}</p>
          <h3 class="mt-1.5 text-lg font-bold text-ink-900 leading-snug group-hover:text-brand-600 transition">${article.title}</h3>
          <span class="mt-3 inline-flex items-center text-sm font-bold text-brand-600">Weiterlesen →</span>
        </div>
      </a>`;

  // Strategy: Find the Ratgeber grid and insert the new card as the first child.
  // The grid looks like: <div class="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  // We insert right after this opening tag, before the first existing <a> card.

  const gridRegex = /(<div\s+class="mt-10\s+grid\s+md:grid-cols-2\s+lg:grid-cols-3\s+gap-6">)/;

  if (!gridRegex.test(html)) {
    // Fallback: try a more flexible grid pattern
    const fallbackRegex = /(<div\s+class="mt-10\s+grid[\s\w-:]+gap-6">)/;
    if (!fallbackRegex.test(html)) {
      throw new Error('Could not find Ratgeber grid in city page');
    }
    // Replace with fallback
    html = html.replace(fallbackRegex, `$1\n${newCard}`);
  } else {
    html = html.replace(gridRegex, `$1\n${newCard}`);
  }

  // Also update the "Alle Beiträge →" link if it points to a generic blog page
  // (optional enhancement — ensure it stays valid)

  fs.writeFileSync(cityPagePath, html, 'utf-8');
  return true;
}

module.exports = addArticleToCity;

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.error('Usage: node add-article-to-city.js <city-page> <href> <trade> <city> <title>');
    process.exit(1);
  }
  const [cityPage, href, trade, city, ...titleParts] = args;
  const title = titleParts.join(' ');
  addArticleToCity(cityPage, { href, tradeName: trade, cityName: city, title });
  console.log(`✅ Article card added to ${cityPage}`);
}
