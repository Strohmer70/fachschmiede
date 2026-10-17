#!/usr/bin/env node
/**
 * heal-general-articles.js — Demo-Branding aus 15 allgemeinen Artikeln + 4 Trade-Hubs entfernen
 * Idempotent: jede Ersetzung ist kontext-sicher (matcht nur Demo-Muster).
 *
 * Ausführung: node scripts/heal-general-articles.js           (Dry-Run)
 *             node scripts/heal-general-articles.js --write
 */
const fs = require('fs')
const path = require('path')
const ROOT = path.join(__dirname, '..')
const WRITE = process.argv.includes('--write')

// ═══ GEWERK-MAP: Datei → Trade-Metadaten ═══
const TRADES = {
  dachdecker: {
    slug: 'dachdecker', name: 'Dachdecker', color: '#ea580c', color600: '#ea580c',
    city: 'Schwerte', tenant: 'Bergmann Bedachungen',
    articles: ['artikel-5-anzeichen-dachsanierung', 'artikel-dachdaemmung-foerderung', 'artikel-sturmschaden-sofortmassnahmen'],
    brandPattern: /Redaktion „Ihr Dachdecker in Schwerte"\s*<span class="italic">\(Demo\)<\/span>/,
  },
  elektriker: {
    slug: 'elektriker', name: 'Elektriker', color: '#2563eb', color600: '#2563eb',
    city: 'Dortmund', tenant: 'Volt Elektrotechnik',
    articles: ['artikel-e-check-sicherheitspruefung', 'artikel-smart-home-nachruesten', 'artikel-wallbox-zuhause'],
    brandPattern: /Redaktion „Ihr Elektriker in Dortmund"\s*<span class="italic">\(Demo\)<\/span>/,
  },
  klempner: {
    slug: 'klempner', name: 'Klempner & SHK', color: '#0d9488', color600: '#0d9488',
    city: 'Unna', tenant: 'Brinkmann Haustechnik',
    articles: ['artikel-heizungs-check-winter', 'artikel-heizungstausch-foerderung', 'artikel-rohrbruch-sofortmassnahmen'],
    brandPattern: /Redaktion „Ihr Klempner in Unna[“"]\s*<span class="italic">\(Demo\)<\/span>/,
  },
  maler: {
    slug: 'maler', name: 'Maler', color: '#7c3aed', color600: '#7c3aed',
    city: 'Bochum', tenant: 'Koslowski Malermeister',
    articles: ['artikel-farben-raumwirkung', 'artikel-fassade-streichen-kosten', 'artikel-schimmel-wohnung'],
    brandPattern: /Redaktion „Ihr Maler in Bochum"\s*<span class="italic">\(Demo\)<\/span>/,
  },
  zimmerer: {
    slug: 'zimmerer', name: 'Zimmerer', color: '#b45309', color600: '#b45309',
    city: 'Iserlohn', tenant: 'Holzbau Lindemann',
    articles: ['artikel-carport-bauen', 'artikel-dachstuhl-sanieren', 'artikel-holzterrasse-pflegen'],
    brandPattern: /Redaktion „Ihr Zimmerer in Iserlohn"\s*<span class="italic">\(Demo\)<\/span>/,
  },
}

// ratgeber-*.html → Trade (4 existierende Hubs)
const HUB_FILES = {
  'ratgeber-elektriker': 'elektriker',
  'ratgeber-klempner': 'klempner',
  'ratgeber-maler': 'maler',
  'ratgeber-zimmerer': 'zimmerer',
}

let changed = 0, skipped = 0
const report = []

function healFile(relPath, trade) {
  const abs = path.join(ROOT, 'public', relPath)
  if (!fs.existsSync(abs)) { report.push(`⚠️  FEHLT: ${relPath}`); skipped++; return }
  let html = fs.readFileSync(abs, 'utf8')
  const orig = html
  const t = TRADES[trade]
  const isHub = relPath.startsWith('ratgeber')

  // ── 1. robots: noindex → index, follow ──
  html = html.replace(
    /<meta name="robots" content="noindex, nofollow">/,
    '<meta name="robots" content="index, follow">'
  )

  // ── 2. Title: "X | Ratgeber {Trade} {City} – MUSTERSEITE" → "X | Ratgeber – fachschmiede.de" ──
  if (isHub) {
    html = html.replace(
      /<title>Ratgeber & Blog \| [^<]*MUSTERSEITE<\/title>/,
      `<title>Ratgeber ${t.name} | fachschmiede.de – Wissen für Haus & Handwerk</title>`
    )
    // Meta-Description (Demo-Text → echter Text)
    html = html.replace(
      /<meta name="description" content="Muster-Blog:[^"]*">/,
      `<meta name="description" content="Ratgeber ${t.name}: Fachwissen verständlich erklärt – Kosten, Förderung, Pflege und Notfälle. Neu: regelmäßig frische Artikel von der fachschmiede.de-Redaktion.">`
    )
    // Hub-Intro: "die Redaktion übernimmt das für den Mieter" → neutral
    html = html.replace(
      /Neue Beiträge erscheinen regelmäßig – die Redaktion übernimmt das für den Mieter\./,
      'Neue Beiträge erscheinen regelmäßig – von der Redaktion recherchiert und verständlich aufbereitet.'
    )
  } else {
    html = html.replace(
      /<title>([^<]*?) \| Ratgeber [^<]*MUSTERSEITE<\/title>/,
      '<title>$1 | Ratgeber – fachschmiede.de</title>'
    )
  }

  // ── 3. Byline: Demo-Redaktion → fachschmiede.de-Redaktion ──
  if (t.brandPattern) html = html.replace(t.brandPattern, 'Redaktion fachschmiede.de')

  // ── 4. CTA-Box: Stadt-Bezug + Musterseiten-Link → neutraler Trade-Link ──
  // Muster: <h2>Fragen zu Ihrer X?</h2> ... "in {City} und Umgebung." ... href="/stadt-..."
  html = html.replace(
    /(Fragen zu Ihrem [^<]*\?|Fragen zu Ihrer [^<]*\?)/,
    'Fachbetrieb gesucht?'
  )
  html = html.replace(
    /Kostenlose Erstberatung(?: und Besichtigung)? in [^<]*?(?: und Umgebung\.)?\.?</,
    'Kostenlose Erstberatung – bundesweit in Ihrer Stadt.'
  )
  // CTA-Link: /stadt-*.html#kontakt → /{trade}/dortmund/ (größte Stadt, alle Gewerke vorhanden)
  html = html.replace(
    /href="\/stadt-[a-z-]+\.html#kontakt"/,
    `href="/${t.slug}/dortmund/"`
  )

  // ── 5. Footer: Demo-Tenant + "Zur Musterseite" → fachschmiede.de-Footer ──
  const footerNew = `<p>© <span id="jahr"></span> fachschmiede.de – Der Ratgeber für Handwerk & Haus. <a href="/ratgeber/" class="underline hover:text-white">Ratgeber-Übersicht</a> · <a href="/ratgeber-${t.slug}/" class="underline hover:text-white">Mehr ${t.name}</a> · <a href="/impressum.html" class="underline hover:text-white">Impressum</a> · <a href="/datenschutz.html" class="underline hover:text-white">Datenschutz</a></p>`
  html = html.replace(
    /<p>© <span id="jahr"><\/span>[^<]*– Musterseite\. Alle Inhalte sind fiktiv\. .*?<\/p>/,
    footerNew
  )
  // Variante 2 (ohne Tenant): "© <span id="jahr"></span> Musterseite – alle Inhalte fiktiv. <a ...>← Zurück zum Ratgeber</a>"
  html = html.replace(
    /<p>© <span id="jahr"><\/span> Musterseite – alle Inhalte fiktiv\. <a [^>]*>.*?<\/a><\/p>/,
    footerNew
  )

  // ── 6. Interne Links: .html-Form → saubere Slash-URLs (trailingSlash-Standard) ──
  html = html.replace(/href="\/ratgeber\.html"/g, 'href="/ratgeber/"')
  html = html.replace(/href="\/ratgeber-(elektriker|klempner|maler|zimmerer)\.html"/g, 'href="/ratgeber-$1/"')
  // Artikel-Links auf Hubs (slash-URL via Rewrite)
  for (const t2 of Object.values(TRADES)) {
    for (const a of t2.articles) {
      html = html.replace(new RegExp(`href="/${a}\\.html"`, 'g'), `href="/${a}/"`)
    }
  }

  // ── 7. "Zurück zur Ratgeber-Übersicht" am Ende → bleibt (Link jetzt /ratgeber/) ✓ ──

  if (html !== orig) {
    changed++
    report.push(`✅ ${relPath}`)
    if (WRITE) fs.writeFileSync(abs, html)
  } else {
    skipped++
    report.push(`➖ ${relPath} (keine Änderung)`)
  }
}

// ── Artikel heilen ──
for (const [trade, t] of Object.entries(TRADES)) {
  for (const a of t.articles) healFile(`${a}.html`, trade)
}
// ── 4 bestehende Trade-Hubs heilen ──
for (const [file, trade] of Object.entries(HUB_FILES)) healFile(`${file}.html`, trade)

console.log(report.join('\n'))
console.log(`\n${changed} geändert, ${skipped} unverändert/fehlend ${WRITE ? '(GESCHRIEBEN)' : '(Dry-Run)'}`)

// Sanity-Checks
const problems = []
for (const [trade, t] of Object.entries(TRADES)) {
  for (const a of t.articles) {
    const html = fs.readFileSync(path.join(ROOT, 'public', `${a}.html`), 'utf8')
    if (/noindex/.test(html)) problems.push(`noindex-Rest: ${a}`)
    if (/MUSTERSEITE/.test(html)) problems.push(`MUSTERSEITE-Rest: ${a}`)
    if (/Musterseite|fiktiv/.test(html)) problems.push(`Musterseiten-Footer-Rest: ${a}`)
    if (/stadt-[a-z-]+\.html/.test(html)) problems.push(`Stadt-Dateilink-Rest: ${a}`)
  }
}
if (problems.length) { console.log('\n⚠️ RESTE GEFUNDEN:'); problems.forEach(p => console.log('  -', p)); process.exit(1) }
else console.log('\n✅ Sanity-Checks sauber')
