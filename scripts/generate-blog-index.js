#!/usr/bin/env node
/**
 * Generiert Blog-Index-Seiten für jede Gewerk/Stadt-Kombination
 * URL: /{trade}/{city}/blog/ → public/blog/{trade}/{city}/index.html
 */

const fs = require('fs');
const path = require('path');
const {
  getAllCombinations,
  getTrade,
  getCity,
} = require('../config/system-config.js');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const BLOG_DIR = path.join(PUBLIC_DIR, 'blog');

const DIR_MAP = {
  'garten-und-landschaftsbau': 'gartenbau',
};
const REVERSE_DIR_MAP = {
  'gartenbau': 'garten-und-landschaftsbau',
};

let created = 0;
let skipped = 0;

function generateBlogIndex(tradeSlug, citySlug) {
  const dirSlug = DIR_MAP[tradeSlug] || tradeSlug;
  const blogTradeSlug = REVERSE_DIR_MAP[dirSlug] || dirSlug;
  const trade = getTrade(tradeSlug);
  const city = getCity(citySlug);
  
  if (!trade || !city) return;
  
  const cityDir = path.join(BLOG_DIR, blogTradeSlug, citySlug);
  if (!fs.existsSync(cityDir)) { skipped++; return; }
  
  const articles = fs.readdirSync(cityDir)
    .filter(f => f.endsWith('.html') && f !== 'index.html')
    .sort();
  
  if (articles.length === 0) { skipped++; return; }
  
  const indexPath = path.join(cityDir, 'index.html');
  const tradeName = trade.name;
  const cityName = city.name;
  const color700 = trade.color?.[700] || '#1d4ed8';
  const color600 = trade.color?.[600] || '#2563eb';
  const color100 = trade.color?.[100] || '#dbeafe';
  const emoji = trade.emoji || '🏗️';
  
  // Extract article titles from files
  const articleList = articles.map(f => {
    const slug = f.replace('.html', '');
    const filePath = path.join(cityDir, f);
    const content = fs.readFileSync(filePath, 'utf-8');
    const titleMatch = content.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(/ \| fachschmiede\.de.*$/, '') : slug;
    const descMatch = content.match(/<meta name="description" content="([^"]*)"/);
    const desc = descMatch ? descMatch[1] : '';
    return { slug, title, desc, url: `/${dirSlug}/${citySlug}/blog/${slug}/` };
  });
  
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ratgeber & Blog: ${tradeName} in ${cityName} | fachschmiede.de</title>
<meta name="description" content="Alle Ratgeber und Artikel zu ${tradeName} in ${cityName} — Tipps, Kosten, Förderung und mehr.">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#f8fafc;color:#1e293b;line-height:1.6}
.container{max-width:1200px;margin:0 auto;padding:0 20px}
.hero{background:linear-gradient(135deg,${color700},${color600});color:white;padding:60px 0;text-align:center}
.hero h1{font-size:2.5rem;font-weight:800;margin-bottom:12px}
.hero p{font-size:1.1rem;opacity:0.9}
.badge{display:inline-block;padding:6px 14px;background:${color100};color:${color700};border-radius:20px;font-size:0.85rem;font-weight:600;margin-bottom:16px}
.articles{padding:50px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:24px}
.card{background:white;border-radius:16px;padding:28px;border:1px solid #e2e8f0;transition:transform .2s,box-shadow .2s;display:flex;flex-direction:column}
.card:hover{transform:translateY(-4px);box-shadow:0 8px 25px rgba(0,0,0,0.1)}
.card h3{font-size:1.15rem;margin-bottom:10px;color:${color700}}
.card p{font-size:0.9rem;color:#64748b;flex:1}
.card .read-more{display:inline-block;margin-top:16px;color:${color700};font-weight:700;font-size:0.9rem}
.back-link{display:inline-block;margin-top:30px;color:${color700};font-weight:700;text-decoration:none;font-size:1.05rem}
.count{margin-bottom:30px;color:#64748b;font-size:0.95rem}
.footer{background:#1e293b;color:white;padding:40px 0;text-align:center;margin-top:60px}
.footer a{color:white;text-decoration:underline}
@media(max-width:768px){.hero h1{font-size:1.8rem}}
</style>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Blog","name":"${tradeName} Blog ${cityName}","url":"https://www.fachschmiede.de/${dirSlug}/${citySlug}/blog/","blogPost":[${articleList.map(a => `{"@type":"BlogPosting","headline":"${a.title.replace(/"/g, '\\"')}","url":"https://www.fachschmiede.de${a.url}"}`).join(',')}]}
</script>
</head>
<body>
<header class="hero">
<div class="container">
<div class="badge">${emoji} ${tradeName} ${cityName}</div>
<h1>Ratgeber & Blog</h1>
<p>Nützliche Tipps und Infos zu ${tradeName.toLowerCase()}-Themen in ${cityName}</p>
</div>
</header>

<main class="articles">
<div class="container">
<p class="count">📚 ${articleList.length} Artikel</p>
<div class="grid">
${articleList.map(a => `
<a href="${a.url}" style="text-decoration:none;color:inherit;">
<div class="card">
<h3>${a.title}</h3>
<p>${a.desc || 'Praktische Tipps und Infos für ' + cityName + '.'}</p>
<span class="read-more">Weiterlesen →</span>
</div>
</a>
`).join('\n')}
</div>
<a href="/${dirSlug}/${citySlug}/" class="back-link">← Zurück zu ${tradeName} ${cityName}</a>
</div>
</main>

<footer class="footer">
<div class="container">
<p>© 2026 fachschmiede.de</p>
<p style="margin-top:12px;font-size:0.85rem;opacity:0.7;">
<a href="/impressum/">Impressum</a> · <a href="/datenschutz/">Datenschutz</a>
</p>
</div>
</footer>
</body>
</html>`;
  
  fs.writeFileSync(indexPath, html, 'utf-8');
  created++;
  console.log(`  ✅ ${dirSlug}/${citySlug}/blog/ (${articles.length} Artikel)`);
}

console.log('🔧 Generiere Blog-Index-Seiten\n');
const combinations = getAllCombinations();
for (const { tradeSlug, citySlug } of combinations) {
  generateBlogIndex(tradeSlug, citySlug);
}

console.log(`\n✅ Created: ${created} | ⏭️ Skipped: ${skipped}`);
