#!/usr/bin/env node
/**
 * Baut einen JSON-Index aller existierenden Blog-Artikel
 * Ausführung: node scripts/build-article-index.js
 */
const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'public', 'blog');
const INDEX_FILE = path.join(__dirname, '..', 'lib', 'article-index.json');

function extractTitle(html) {
  const match = html.match(/<title>(.*?)<\/title>/);
  return match ? match[1] : 'Artikel';
}

function extractMetaDescription(html) {
  const match = html.match(/<meta name="description" content="(.*?)">/);
  return match ? match[1] : '';
}

function extractH1(html) {
  const match = html.match(/<h1>(.*?)<\/h1>/);
  return match ? match[1] : '';
}

function extractExcerpt(html) {
  // Versuche den ersten <p> nach dem intro zu finden
  const match = html.match(/<p style="font-size: 1\.125rem.*?>(.*?)<\/p>/);
  if (match) return match[1].replace(/<.*?>/g, '').substring(0, 160);
  
  // Fallback: erster Paragraph im content
  const match2 = html.match(/<article class="content">[\s\S]*?<p>(.*?)<\/p>/);
  return match2 ? match2[1].replace(/<.*?>/g, '').substring(0, 160) : '';
}

function getGradient(slug) {
  const gradients = {
    'dachdaemmung-foerderung': 'from-orange-500 to-orange-700',
    'sturmschaden-dach': 'from-sky-600 to-slate-800',
    '5-anzeichen-dachsanierung': 'from-red-500 to-red-700',
    'e-check-sicherheit': 'from-yellow-500 to-orange-600',
    'heizungstausch-foerderung': 'from-blue-500 to-blue-700',
    'wallbox-zuhause': 'from-green-500 to-emerald-700',
    'smart-home-nachruesten': 'from-purple-500 to-indigo-700',
    'rohrbruch-sofortmassnahmen': 'from-cyan-500 to-blue-700',
    'schimmel-wohnung': 'from-teal-500 to-green-700',
    'heizungs-check-winter': 'from-amber-500 to-orange-600',
    'carport-bauen': 'from-stone-500 to-stone-700',
    'fassade-streichen-kosten': 'from-pink-500 to-rose-700',
    'holzterrasse-pflegen': 'from-emerald-500 to-green-700',
    'farben-raumwirkung': 'from-violet-500 to-purple-700',
    'default': 'from-slate-700 to-slate-900'
  };
  return gradients[slug] || gradients['default'];
}

function getTag(slug) {
  const tags = {
    'dachdaemmung-foerderung': 'Förderung',
    'sturmschaden-dach': 'Notfall',
    '5-anzeichen-dachsanierung': 'Ratgeber',
    'e-check-sicherheit': 'Sicherheit',
    'heizungstausch-foerderung': 'Förderung',
    'wallbox-zuhause': 'Elektromobilität',
    'smart-home-nachruesten': 'Smart Home',
    'rohrbruch-sofortmassnahmen': 'Notfall',
    'schimmel-wohnung': 'Gesundheit',
    'heizungs-check-winter': 'Wartung',
    'carport-bauen': 'Planung',
    'fassade-streichen-kosten': 'Kosten',
    'holzterrasse-pflegen': 'Pflege',
    'farben-raumwirkung': 'Ratgeber',
    'default': 'Ratgeber'
  };
  return tags[slug] || tags['default'];
}

function getSvg(slug) {
  const svgs = {
    'dachdaemmung-foerderung': '<path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
    'sturmschaden-dach': '<path stroke-linecap="round" stroke-linejoin="round" d="M13 10l-2 4h3l-2 4"></path><path stroke-linecap="round" stroke-linejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999A5.002 5.002 0 105.9 8.001 4.002 4.002 0 003 15z"></path>',
    '5-anzeichen-dachsanierung': '<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>',
    'e-check-sicherheit': '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>',
    'default': '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>'
  };
  return svgs[slug] || svgs['default'];
}

function buildIndex() {
  const index = {};
  
  const trades = fs.readdirSync(BLOG_DIR).filter(d => fs.statSync(path.join(BLOG_DIR, d)).isDirectory());
  
  for (const trade of trades) {
    index[trade] = {};
    const tradeDir = path.join(BLOG_DIR, trade);
    const cities = fs.readdirSync(tradeDir).filter(d => fs.statSync(path.join(tradeDir, d)).isDirectory());
    
    for (const city of cities) {
      index[trade][city] = [];
      const cityDir = path.join(tradeDir, city);
      const files = fs.readdirSync(cityDir).filter(f => f.endsWith('.html'));
      
      for (const file of files) {
        const filePath = path.join(cityDir, file);
        const html = fs.readFileSync(filePath, 'utf-8');
        const slug = file.replace('.html', '');
        
        index[trade][city].push({
          slug,
          title: extractTitle(html),
          h1: extractH1(html),
          metaDescription: extractMetaDescription(html),
          excerpt: extractExcerpt(html),
          url: `/${trade}/${city}/blog/${slug}/`,
          gradient: getGradient(slug),
          tag: getTag(slug),
          svg: getSvg(slug),
          file: `blog/${trade}/${city}/${file}`
        });
      }
      
      // Sortiere: Förderung zuerst, dann Ratgeber, dann Notfall
      const priority = { 'Förderung': 1, 'Ratgeber': 2, 'Smart Home': 3, 'Sicherheit': 4, 'Elektromobilität': 5, 'Wartung': 6, 'Planung': 7, 'Kosten': 8, 'Pflege': 9, 'Gesundheit': 10, 'Notfall': 99 };
      index[trade][city].sort((a, b) => (priority[a.tag] || 50) - (priority[b.tag] || 50));
    }
  }
  
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
  
  let total = 0;
  for (const trade of Object.keys(index)) {
    for (const city of Object.keys(index[trade])) {
      total += index[trade][city].length;
    }
  }
  
  console.log(`✅ Artikel-Index gebaut: ${total} Artikel in ${INDEX_FILE}`);
  return index;
}

buildIndex();
