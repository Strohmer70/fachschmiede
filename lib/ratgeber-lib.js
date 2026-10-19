/**
 * lib/ratgeber-lib.js — Shared-Engine für den allgemeinen Ratgeber
 * Wird genutzt von: build-ratgeber-architecture.js, generate-general-article.js
 * SSOT: Metadaten aus lib/general-articles.json, Städte/Gewerke aus system-config
 */
const fs = require('fs')
const path = require('path')
const { getAllCities, getTrade } = require('../config/system-config')

// 2026-10-19: __dirname ist im Next-Server-Bundle (.next/server/app/sitemap.xml/) KAPUTT.
// Auflösung: process.cwd() (Projektroot bei dev/build/Vercel) zuerst, dann __dirname-Fallbacks.
const REGISTRY_CANDIDATES = [
  path.join(process.cwd(), 'lib', 'general-articles.json'),
  path.join(__dirname, 'general-articles.json'),
  path.join(__dirname, '..', '..', '..', '..', 'lib', 'general-articles.json'),
]
const REGISTRY_PATH = REGISTRY_CANDIDATES.find(p => fs.existsSync(p)) || REGISTRY_CANDIDATES[0]

function loadRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'))
}
function saveRegistry(reg) {
  reg.updated = new Date().toISOString().slice(0, 10)
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(reg, null, 2) + '\n')
}

const TRADE_META = {
  dachdecker: { name: 'Dachdecker', emoji: '🏠', hub: 'ratgeber-dachdecker', color: '#ea580c', desc: 'Dachsanierung, Förderung, Sturmschäden' },
  elektriker: { name: 'Elektriker', emoji: '⚡', hub: 'ratgeber-elektriker', color: '#2563eb', desc: 'Sicherheit, E-Mobilität, Smart Home' },
  klempner: { name: 'Klempner & SHK', emoji: '🔥', hub: 'ratgeber-klempner', color: '#0d9488', desc: 'Heizung, Wasser, Notfälle' },
  maler: { name: 'Maler', emoji: '🎨', hub: 'ratgeber-maler', color: '#7c3aed', desc: 'Fassade, Farben, Schimmel' },
  zimmerer: { name: 'Zimmerer', emoji: '🪵', hub: 'ratgeber-zimmerer', color: '#b45309', desc: 'Carport, Dachstuhl, Terrasse' },
  'garten-und-landschaftsbau': { name: 'Gartenbau', emoji: '🌳', hub: 'ratgeber-garten-und-landschaftsbau', color: '#16a34a', desc: 'Planung, Rasen, Terrassen' },
}

// system-config-trade-slug ↔ registry-key mappen (gartenbau → garten-und-landschaftsbau)
function registryKey(tradeSlug) {
  const t = getTrade(tradeSlug)
  return t.urlSlug || t.slug
}

function cityLinksBox(tradeSlug, tradeName, color) {
  const cities = getAllCities()
  const label = tradeSlug === 'garten-und-landschaftsbau' ? 'Gartenbau' : tradeName
  const lis = cities
    .map(c => {
      const name = c.name.replace(/ \(.+\)/, '')
      return `    <li><a href="/${tradeSlug}/${c.slug}/" style="color:${color};font-weight:600;font-size:14px;text-decoration:none">${label} ${name}</a></li>`
    })
    .join('\n')
  return `<!--citylinks:v1:${tradeSlug}-->
<nav aria-label="${label} in Ihrer Stadt" style="margin:40px 0 0;padding:28px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px">
  <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0f172a">${label} in Ihrer Stadt</h2>
  <p style="margin:0 0 16px;font-size:14px;color:#475569">Kostenlose Erstberatung &amp; Angebote von geprüften Fachbetrieben – direkt in Ihrer Region:</p>
  <ul style="list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px 16px">
${lis}
  </ul>
</nav>`
}

/** Artikel-Shell (Design der geheilten Artikel) */
function articleShell({ trade, topic, kicker, title, date, readMin, intro, sections, outro, ctaQuestion, ctaText }) {
  const t = getTrade(trade)
  const color = t.color[600]
  const secs = sections
    .map(s => `    <h2 class="text-2xl font-black text-ink-900">${s.h}</h2>
    ${s.ps.map(p => `<p>${p}</p>`).join('\n    ')}`)
    .join('\n\n')
  const urlSlug = registryKey(trade)
  const footerTradeLink = urlSlug === 'garten-und-landschaftsbau' ? urlSlug : urlSlug
  return `<!DOCTYPE html>
<html lang="de" class="scroll-smooth">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} | Ratgeber – fachschmiede.de</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any">
  <link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48">
  <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
  <link rel="icon" href="/favicon-16.png" type="image/png" sizes="16x16">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="description" content="${t.name === 'Gartenbau' ? 'Gartenbau' : t.name}-Ratgeber: ${intro.replace(/<[^>]+>/g, '').slice(0, 155)}">
<meta name="robots" content="index, follow">
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: {50:'${t.color[50]}',100:'${t.color[100]}',200:'${t.color[200]}',300:'${t.color[300]}',400:'${t.color[400]}',500:'${t.color[500]}',600:'${t.color[600]}',700:'${t.color[700]}',800:'${t.color[800]}',900:'${t.color[900]}'},
        ink: {50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a'}
      },
      fontFamily: { sans: ['Inter','system-ui','sans-serif'] }
    }
  }
}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>body{font-family:'Inter',system-ui,sans-serif} ::selection{background:${color};color:#fff}</style>
</head>
<body class="bg-white text-ink-800 antialiased">
<header class="bg-gradient-to-br from-ink-700 to-ink-900 text-white py-16">
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <p class="font-bold text-sm uppercase tracking-widest text-white/80">${kicker}</p>
    <h1 class="mt-3 text-3xl sm:text-4xl font-black tracking-tight leading-tight">${title}</h1>
    <p class="mt-4 text-white/70 text-sm">${date} · ${readMin} Min. Lesezeit · Redaktion fachschmiede.de</p>
  </div>
</header>

<main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  <p class="text-xl text-ink-700 leading-relaxed font-medium">${intro}</p>
  <div class="mt-8 space-y-8 text-ink-700 leading-relaxed">
${secs}

    <h2 class="text-2xl font-black text-ink-900">Fazit</h2>
    <p>${outro}</p>
  </div>

${cityLinksBox(urlSlug, t.name, color)}

  <div class="mt-12 bg-ink-900 text-white rounded-2xl p-8 text-center">
    <h2 class="text-2xl font-black">${ctaQuestion}</h2>
    <p class="mt-2 text-ink-300">Kostenlose Erstberatung – bundesweit in Ihrer Stadt.</p>
    <a href="/${urlSlug}/dortmund/" class="mt-5 inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-4 rounded-xl transition">${ctaText}</a>
  </div>

  <p class="mt-8 text-center"><a href="/ratgeber/" class="text-brand-600 font-bold hover:underline">← Zurück zur Ratgeber-Übersicht</a></p>
</main>

<footer class="bg-ink-900 text-ink-400 text-xs py-6 px-4 text-center">
  <p>© <span id="jahr"></span> fachschmiede.de – Der Ratgeber für Handwerk & Haus. <a href="/ratgeber/" class="underline hover:text-white">Ratgeber-Übersicht</a> · <a href="/ratgeber-${footerTradeLink}/" class="underline hover:text-white">Mehr ${t.name === 'Gartenbau' ? 'Gartenbau' : t.name}</a> · <a href="/impressum.html" class="underline hover:text-white">Impressum</a> · <a href="/datenschutz.html" class="underline hover:text-white">Datenschutz</a></p>
</footer>
<script>document.getElementById('jahr').textContent = new Date().getFullYear();</script>
</body>
</html>
`
}

/** Trade-Hub aus Registry */
function tradeHubShell(regKey) {
  const m = TRADE_META[regKey]
  const reg = loadRegistry()
  const articles = reg.trades[regKey] || []
  const tradeSlug = regKey === 'garten-und-landschaftsbau' ? 'gartenbau' : regKey
  const t = getTrade(tradeSlug)
  const cards = articles.map(a => `    <a href="/${a.slug}/" class="bg-white rounded-2xl overflow-hidden border border-ink-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 group">
      <div class="h-44 bg-gradient-to-br from-[${t.color[500]}] to-[${t.color[700]}] flex items-center justify-center">
        <span class="text-6xl">${m.emoji}</span>
      </div>
      <div class="p-7">
        <p class="text-xs font-semibold text-ink-400">${a.tag} · ${a.min} Min. Lesezeit</p>
        <h2 class="mt-2 text-lg font-bold text-ink-900 group-hover:text-brand-600 transition leading-snug">${a.title}</h2>
        <p class="mt-2 text-sm text-ink-600 leading-relaxed">${a.desc}</p>
        <p class="mt-4 text-sm font-bold text-brand-600">Beitrag lesen →</p>
      </div>
    </a>`).join('\n')
  return `<!DOCTYPE html>
<html lang="de" class="scroll-smooth">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ratgeber ${m.name} | fachschmiede.de – Wissen für Haus & Handwerk</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any">
  <link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48">
  <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
  <link rel="icon" href="/favicon-16.png" type="image/png" sizes="16x16">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="description" content="Ratgeber ${m.name}: ${m.desc} – verständlich erklärt von der fachschmiede.de-Redaktion. Kosten, Förderung, Pflege und Notfälle im Überblick.">
<meta name="robots" content="index, follow">
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: {50:'${t.color[50]}',100:'${t.color[100]}',200:'${t.color[200]}',300:'${t.color[300]}',400:'${t.color[400]}',500:'${t.color[500]}',600:'${t.color[600]}',700:'${t.color[700]}',800:'${t.color[800]}',900:'${t.color[900]}'},
        ink: {50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a'}
      },
      fontFamily: { sans: ['Inter','system-ui','sans-serif'] }
    }
  }
}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>body{font-family:'Inter',system-ui,sans-serif} ::selection{background:${t.color[600]};color:#fff}</style>
</head>
<body class="bg-white text-ink-800 antialiased">
<header class="bg-ink-900 text-white py-16 sm:py-20">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <a href="/ratgeber/" class="text-sm text-ink-400 hover:text-white transition">← Alle Ratgeber-Themen</a>
    <p class="mt-6 text-brand-400 font-bold text-sm uppercase tracking-widest">Ratgeber &amp; Blog</p>
    <h1 class="mt-3 text-3xl sm:text-5xl font-black tracking-tight">${m.emoji} Wissen rund um ${m.name}</h1>
    <p class="mt-4 text-ink-300 text-lg max-w-2xl">${m.desc} – verständlich erklärt. Neue Beiträge erscheinen regelmäßig, von der Redaktion recherchiert und aufbereitet.</p>
  </div>
</header>

<main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
  <div class="grid md:grid-cols-3 gap-6">
${cards}
  </div>

  <div class="mt-14 bg-ink-900 text-white rounded-2xl p-8 text-center">
    <h2 class="text-2xl font-black">Fachbetrieb gesucht?</h2>
    <p class="mt-2 text-ink-300">Kostenlose Erstberatung – bundesweit in Ihrer Stadt.</p>
    <a href="/${regKey}/dortmund/" class="mt-5 inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-4 rounded-xl transition">${t.ctaPrimary || 'Kostenlose Beratung anfragen'}</a>
  </div>
</main>

<footer class="bg-ink-900 text-ink-400 text-xs py-6 px-4 text-center">
  <p>© <span id="jahr"></span> fachschmiede.de – Der Ratgeber für Handwerk & Haus. <a href="/ratgeber/" class="underline hover:text-white">Ratgeber-Übersicht</a> · <a href="/${regKey}/dortmund/" class="underline hover:text-white">${m.name} Dortmund</a> · <a href="/impressum.html" class="underline hover:text-white">Impressum</a> · <a href="/datenschutz.html" class="underline hover:text-white">Datenschutz</a></p>
</footer>
<script>document.getElementById('jahr').textContent = new Date().getFullYear();</script>
</body>
</html>
`
}

/** Haupt-Hub aus Registry (alle Gewerke) */
function mainHub() {
  const reg = loadRegistry()
  const sections = Object.entries(reg.trades).map(([regKey, articles]) => {
    const m = TRADE_META[regKey]
    const cards = articles.map(a => `      <a href="/${a.slug}/" class="group bg-white rounded-2xl border border-ink-200 p-5 hover:shadow-lg hover:-translate-y-0.5 transition">
        <p class="text-xs font-semibold" style="color:${m.color}">${a.tag} · ${a.min} Min.</p>
        <h3 class="mt-1.5 font-bold text-ink-900 group-hover:text-brand-600 transition leading-snug text-sm">${a.title}</h3>
      </a>`).join('\n')
    return `    <section class="mb-12">
      <div class="flex items-center gap-3 mb-4">
        <span class="text-3xl">${m.emoji}</span>
        <div>
          <h2 class="text-2xl font-black text-ink-900">${m.name}</h2>
          <p class="text-sm text-ink-500">${m.desc} · <a href="/${m.hub}/" class="font-semibold hover:underline" style="color:${m.color}">Alle Artikel →</a></p>
        </div>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
${cards}
      </div>
    </section>`
  }).join('\n\n')

  return `<!DOCTYPE html>
<html lang="de" class="scroll-smooth">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ratgeber & Blog | fachschmiede.de – Wissen für Haus & Handwerk</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any">
  <link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48">
  <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
  <link rel="icon" href="/favicon-16.png" type="image/png" sizes="16x16">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="description" content="Der fachschmiede.de-Ratgeber: Fachwissen rund um Dach, Elektrik, Heizung, Malerarbeiten, Holzbau und Garten – verständlich erklärt. Kosten, Förderung, Pflege und Notfälle.">
<meta name="robots" content="index, follow">
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: {50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#f97316',600:'#ea580c',700:'#c2410c',800:'#9a3412',900:'#7c2d12'},
        ink: {50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a'}
      },
      fontFamily: { sans: ['Inter','system-ui','sans-serif'] }
    }
  }
}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>body{font-family:'Inter',system-ui,sans-serif} ::selection{background:#ea580c;color:#fff}</style>
</head>
<body class="bg-white text-ink-800 antialiased">
<header class="bg-ink-900 text-white py-16 sm:py-20">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <a href="/" class="text-sm text-ink-400 hover:text-white transition">← Zur Startseite</a>
    <p class="mt-6 text-brand-400 font-bold text-sm uppercase tracking-widest">Ratgeber &amp; Blog</p>
    <h1 class="mt-3 text-3xl sm:text-5xl font-black tracking-tight">Wissen für Haus & Handwerk</h1>
    <p class="mt-4 text-ink-300 text-lg max-w-2xl">Kosten, Förderung, Pflege, Notfälle: Die Redaktion der fachschmiede.de erklärt, was Hausbesitzer wissen müssen – verständlich, aktuell und praxisnah. Neue Beiträge erscheinen regelmäßig.</p>
  </div>
</header>

<main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
${sections}

  <div class="mt-6 bg-ink-900 text-white rounded-2xl p-8 text-center">
    <h2 class="text-2xl font-black">Fachbetrieb in Ihrer Stadt finden</h2>
    <p class="mt-2 text-ink-300">Kostenlose Erstberatung von geprüften Handwerksbetrieben – deutschlandweit.</p>
    <a href="/fuer-dienstleister/#gewerke" class="mt-5 inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-4 rounded-xl transition">Gewerk auswählen →</a>
  </div>
</main>

<footer class="bg-ink-900 text-ink-400 text-xs py-6 px-4 text-center">
  <p>© <span id="jahr"></span> fachschmiede.de – Der Ratgeber für Handwerk & Haus. <a href="/" class="underline hover:text-white">Startseite</a> · <a href="/impressum.html" class="underline hover:text-white">Impressum</a> · <a href="/datenschutz.html" class="underline hover:text-white">Datenschutz</a></p>
</footer>
<script>document.getElementById('jahr').textContent = new Date().getFullYear();</script>
</body>
</html>
`
}

/**
 * GENERAL-ARTIKEL TEMPLATE — regionsneutral (kein Stadtname im Fließtext!)
 * topic: {slug,title,sections:[{h,ps[]}],outro,ctaQuestion,tag}
 */
function generalArticleFromTemplate(tradeSlug, topic) {
  const t = getTrade(tradeSlug)
  const services = t.services.join(', ')
  const today = new Date().toLocaleDateString('de-DE')
  const kw = topic.title.split(':')[0].trim()
  return articleShell({
    trade: tradeSlug,
    topic: topic.slug,
    kicker: topic.tag,
    title: topic.title,
    date: today,
    readMin: 7,
    intro: `${topic.intro}`,
    sections: topic.sections,
    outro: topic.outro,
    ctaQuestion: topic.ctaQuestion,
    ctaText: t.ctaPrimary || 'Kostenlose Beratung anfragen',
  })
}

module.exports = {
  loadRegistry, saveRegistry, TRADE_META, registryKey,
  articleShell, tradeHubShell, mainHub, cityLinksBox,
  generalArticleFromTemplate,
}
