#!/usr/bin/env node
/**
 * build-ratgeber-architecture.js — Baut die fehlenden Teile des allgemeinen Ratgebers
 *
 * Erzeugt:
 *  1. 3 Garten-Generalartikel (artikel-gartenplanung-ideen/rasen-neuanlage/terrasse-bauen)
 *  2. ratgeber.html — komplett neuer Haupt-Hub (6 Gewerke, 18 Artikel)
 *  3. ratgeber-dachdecker.html + ratgeber-garten-und-landschaftsbau.html (fehlende Trade-Hubs)
 *  4. next.config.js — Rewrites für die 5 neuen Seiten (idempotent)
 *
 * SSOT: liest Städte + Gewerke aus config/system-config.js
 * Idempotent: bestehende Inhalte werden überschrieben ( deterministisch )
 */
const fs = require('fs')
const path = require('path')
const { getAllCities, getTrade, getAllTrades } = require('../config/system-config')

const ROOT = path.join(__dirname, '..')
const WRITE = process.argv.includes('--write')
const today = '17.10.2026'

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function cityLinksBox(tradeSlug, tradeName, color) {
  const cities = getAllCities()
  const lis = cities
    .map(c => {
      const label = tradeSlug === 'garten-und-landschaftsbau' ? 'Gartenbau' : tradeName
      const name = c.name.replace(/ \(.+\)/, '')
      return `    <li><a href="/${tradeSlug}/${c.slug}/" style="color:${color};font-weight:600;font-size:14px;text-decoration:none">${label} ${name}</a></li>`
    })
    .join('\n')
  const label = tradeSlug === 'garten-und-landschaftsbau' ? 'Gartenbau' : tradeName
  return `<!--citylinks:v1:${tradeSlug}-->
<nav aria-label="${label} in Ihrer Stadt" style="margin:40px 0 0;padding:28px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px">
  <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0f172a">${label} in Ihrer Stadt</h2>
  <p style="margin:0 0 16px;font-size:14px;color:#475569">Kostenlose Erstberatung &amp; Angebote von geprüften Fachbetrieben – direkt in Ihrer Region:</p>
  <ul style="list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px 16px">
${lis}
  </ul>
</nav>`
}

function articleShell({ trade, topic, kicker, title, date, readMin, intro, sections, outro, ctaQuestion, ctaText }) {
  const t = getTrade(trade)
  const color = t.color[600]
  const secs = sections
    .map(s => `    <h2 class="text-2xl font-black text-ink-900">${s.h}</h2>
    ${s.ps.map(p => `<p>${p}</p>`).join('\n    ')}`)
    .join('\n\n')
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

${cityLinksBox(t.urlSlug || t.slug, t.name, color)}

  <div class="mt-12 bg-ink-900 text-white rounded-2xl p-8 text-center">
    <h2 class="text-2xl font-black">${ctaQuestion}</h2>
    <p class="mt-2 text-ink-300">Kostenlose Erstberatung – bundesweit in Ihrer Stadt.</p>
    <a href="/${t.urlSlug || t.slug}/dortmund/" class="mt-5 inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-4 rounded-xl transition">${ctaText}</a>
  </div>

  <p class="mt-8 text-center"><a href="/ratgeber/" class="text-brand-600 font-bold hover:underline">← Zurück zur Ratgeber-Übersicht</a></p>
</main>

<footer class="bg-ink-900 text-ink-400 text-xs py-6 px-4 text-center">
  <p>© <span id="jahr"></span> fachschmiede.de – Der Ratgeber für Handwerk & Haus. <a href="/ratgeber/" class="underline hover:text-white">Ratgeber-Übersicht</a> · <a href="/ratgeber-${t.slug === 'garten-und-landschaftsbau' ? 'garten-und-landschaftsbau' : t.slug}/" class="underline hover:text-white">Mehr ${t.name === 'Gartenbau' ? 'Gartenbau' : t.name}</a> · <a href="/impressum.html" class="underline hover:text-white">Impressum</a> · <a href="/datenschutz.html" class="underline hover:text-white">Datenschutz</a></p>
</footer>
<script>document.getElementById('jahr').textContent = new Date().getFullYear();</script>
</body>
</html>
`
}

// ═══════════════════════════════════════════════════════════════
// 1. DREI GARTEN-ARTIKEL (eigener Content)
// ═══════════════════════════════════════════════════════════════
const GARTEN_ARTICLES = [
  {
    file: 'artikel-gartenplanung-ideen.html',
    data: {
      trade: 'gartenbau', topic: 'gartenplanung-ideen', kicker: 'Gartenplanung',
      title: 'Gartenplanung: Vom Grundstück zum Traumgarten – Ideen, Ablauf & Kosten',
      date: today, readMin: 8,
      intro: 'Ein schöner Garten entsteht nicht zufällig – er wird geplant. Wer Grundregeln zu Wegeführung, Bepflanzung und Sichtachsen kennt, spart später teure Korrekturen und genießt den Garten von Tag eins an.',
      sections: [
        { h: 'Warum sich professionelle Gartenplanung lohnt', ps: [
          'Viele Gartenbesitzer starten spontan: ein Beet hier, eine Terrasse dort, und nach zwei Jahren passt nichts mehr zusammen. Eine durchdachte Gartenplanung vermeidet genau das. Sie berücksichtigt Sonnenverlauf, Bodenqualität, Sichtachsen vom Wohnzimmer aus und die Frage, wie viel Pflege der Garten wirklich bekommt.',
          'Ein Gartenplaner oder Garten- und Landschaftsbauer bringt außerdem Erfahrung mit Typischen Fehlern: zu enge Wege, falsch platzierte Sitzplätze, Pflanzen, die in zehn Jahren zu groß für ihr Beet werden. Die Planungskosten von etwa 500 bis 2.500 Euro amortisieren sich über die Lebensdauer des Gartens mehrfach.'
        ]},
        { h: 'Der ideale Ablauf: In vier Schritten zum Plan', ps: [
          '<strong>Schritt 1 – Bestand aufnehmen:</strong> Was ist vorhanden? Wo steht der Hausüberstand, wo ist es sonnig, wo verschattet, wo sammelt sich Wasser nach Regen? Ein Wochen lang Beobachten lohnt sich.',
          '<strong>Schritt 2 – Bedürfnisse klären:</strong> Rasen für Kinder, Terrasse für Gäste, Gemüsebeet, Sichtschutz zum Nachbarn? Alles gleichzeitig geht selten – Prioritäten setzen ist die halbe Miete.',
          '<strong>Schritt 3 – Zonen planen:</strong> Nutzgarten, Sitz- und Spielbereich, Stauden- und Gehölzbereich. Gute Pläne folgen der Logik: vom „öffentlichen“ Vorgarten bis zum privaten Sitzplatz hinten.',
          '<strong>Schritt 4 – Bepflanzung und Wege:</strong> Jetzt kommt die botanische Ebene: Standortgerechte Pflanzen, Wege aus Kies, Naturstein oder Betonplatten, und ein Bewässerungskonzept für trockene Sommer.'
        ]},
        { h: 'Was kostet die Umsetzung?', ps: [
          'Die Kosten hängen stark von Ausgangslage und Anspruch ab. Als grobe Orientierung: eine komplette Neugestaltung eines 300–500 m²-Gartens kostet mit Terrasse, Wegen und Bepflanzung meist 15.000 bis 40.000 Euro. Wer in Etappen arbeitet, kann gut planen: zuerst Wege und Terrasse, dann Bepflanzung, später Extras wie Wasserstelle oder Gartenbeleuchtung.',
          'Wichtig: Holen Sie sich von zwei bis drei Gartenbaubetrieben ein schriftliches Angebot mit Planungsbeschreibung. Achten Sie auf klare Positionen statt Pauschalpreise – das schützt vor bösen Überraschungen.'
        ]},
      ],
      outro: 'Gute Gartenplanung ist keine Frage des Budgets, sondern der Reihenfolge: beobachten, priorisieren, zonen, bepflanzen. Wer diese Logik beachtet, bekommt einen Garten, der mitwächst – und nicht ein Sammelsurium teurer Baustellen.',
      ctaQuestion: 'Ihr Garten wartet auf den Plan?', ctaText: 'Kostenlose Gartenberatung anfragen',
    }
  },
  {
    file: 'artikel-rasen-neuanlage.html',
    data: {
      trade: 'gartenbau', topic: 'rasen-neuanlage', kicker: 'Rasen & Grünflächen',
      title: 'Rasen neu anlegen: Saat, Rollrasen oder Nachsäen – Kosten & Pflege im Überblick',
      date: today, readMin: 7,
      intro: 'Kahle Stellen, Moos und Unkraut: Manch ein Rasen ist nicht mehr zu retten. Wir zeigen, wann sich eine Neuanlage lohnt, welche Methode passt und wie die ersten Monate entscheidend für den Erfolg sind.',
      sections: [
        { h: 'Rettung oder Neuanlage – wann lohnt sich was?', ps: [
          'Nicht jeder schlechte Rasen muss komplett neu. Locker aufgraben, mit kompostierter Erde auffüllen, nachsäen und zwei Monate konsequent wässern – oft reicht das für kahle Stellen. Ein komplett verunkrauter, verdichteter oder stark moosiger Rasen ist dagegen meist ein Fall für die Vollernuerung: Altes Grün entfernen, Boden lockern, neue Saat.',
          'Die richtige Jahreszeit spart Geld: Frühjahr (März bis Mai) und Frühsommer bieten ideale Keimbedingungen. Später gesät wird der Rasen vom Sommerstress überrascht, später gepflanzt muss er durch den Winter.'
        ]},
        { h: 'Saat oder Rollrasen? Der Kostenvergleich', ps: [
          '<strong>Rasensaat:</strong> Die günstige Variante. Gute Nachsaat-Mischungen kosten 5–10 Euro pro 10 m², plus Erde und eventuell Fräse. Für 100 m² liegen die Gesamtkosten oft bei nur 150–300 Euro – wenn Sie selbst arbeiten. Der Nachteil: Geduld. Erst nach 4–8 Wochen zeigt sich ein geschlossener Grünteppich.',
          '<strong>Rollrasen:</strong> Sofort schön, aber teurer: 6–12 Euro pro m² verlegen inklusive Bodenvorbereitung liegen bei 100 m² schnell bei 800–1.400 Euro. Dafür haben Sie sofort eine Nutzfläche – ideal, wenn Kinder oder Haustiere nicht warten können.',
          'Tipp: Kombinieren Sie beides! Rollrasen für die sichtbare Terrassenfläche, Saat für die hinteren, weniger genutzten Bereiche.'
        ]},
        { h: 'Die ersten Monate entscheiden über den Erfolg', ps: [
          'Ob Neuanlage oder Rollrasen: Die Anwachsphase ist kritisch. Konsequent wässern (kleinere Mengen, häufiger), den ersten Schnitt erst bei etwa 8–10 cm Grashöhe und dann nur ein Drittel der Blattmasse kürzen. Düngen frühestens nach dem dritten Schnitt.',
          'Auch wichtig: Markieren Sie die neuen Flächen für Kinder und Hunde deutlich ab – ein einziger Fußgängertag kann Wochen der Keimung zunichtemachen.'
        ]},
      ],
      outro: 'Eine gute Rasenfläche ist kein Zufall, sondern das Ergebnis der richtigen Methode zur richtigen Zeit. Wer Boden, Saatgut und Pflegephase ernst nimmt, wird mit einem dichten, gesunden Rasen belohnt, der Jahrzehnte hält.',
      ctaQuestion: 'Neuer Rasen nötig?', ctaText: 'Kostenlose Beratung anfragen',
    }
  },
  {
    file: 'artikel-terrasse-bauen.html',
    data: {
      trade: 'gartenbau', topic: 'terrasse-bauen', kicker: 'Terrassenbau',
      title: 'Terrasse bauen: Materialien, Kosten & die häufigsten Fehler vermeiden',
      date: today, readMin: 8,
      intro: 'Die Terrasse ist das Wohnzimmer im Grünen – aber nur, wenn sie richtig geplant und gebaut ist. Welches Material passt zu Ihrem Haus, was kostet der Bau und welche Fehler Sie unbedingt vermeiden sollten.',
      sections: [
        { h: 'Welches Terrassenmaterial passt zu mir?', ps: [
          '<strong>Holz (Lärche, Bangkirai, Douglasie):</strong> Warm, griffig, naturverbunden. Preis: 40–90 Euro pro m² fürs Material. Nachteil: Pflege. Alle zwei Jahre ölen, sonst wird es grau und rau. Härtere Hölzer wie Bangkirai halten länger, kosten aber mehr.',
          '<strong>WPC (Holz-Kunststoff-Verbund):</strong> Pflegeleicht und formstabil, 50–100 Euro pro m². Sieht aus wie Holz, fühlt sich aber kühl an und kann bei starker Sonne ausdehnen. Ideal für Nicht-Gärtner.',
          '<strong>Naturstein (Sandstein, Basalt, Granit):</strong> Langlebig und wertig, aber teuer: 80–150 Euro pro m² plus Unterbau. Für immer im Garten – Planung muss sitzen.',
          '<strong>Beton- und Keramikplatten:</strong> Die pragmatische Wahl. 25–60 Euro pro m², langlebig, pflegeleicht, aber kühler Look.'
        ]},
        { h: 'Der Unterbau entscheidet über die Lebensdauer', ps: [
          'Die häufigste Ursache für unebene Terrassen: unzureichender Unterbau. Eine stabile Tragschicht aus Schotter (mindestens 10–15 cm, verdichtet) ist Pflicht. Fugenmaterial wie Fugensand oder Splitt verhindert Unkraut und gibt der Fläche Stabilität.',
          'Bei Holz- und WPC-Terrassen kommt noch das Unterkonstruktion dazu: Alu- oder verzinkte Stahlprofile halten länger als Holzlatten. Wichtig: ausreichend Abstand zur Hauswand (mindestens 5 cm) für Wasserablauf und Luftzirkulation.'
        ]},
        { h: 'Was kostet eine Terrasse – realistisch kalkuliert', ps: [
          'Als Faustregel: Selbstbau mit einfachem Material (Betonplatten) ab etwa 50 Euro pro m². Guter Profi-Bau mit WPC oder Holz samt Unterbau und Randeinfassung: 120–200 Euro pro m². Naturstein-Projekte mit individuellem Muster liegen bei 200–300 Euro pro m².',
          'Vergessen Sie nicht die Nebenpositionen: Fundament für eine spätere Überdachung, Strom für Beleuchtung oder Markise, und ein frostfreier Wasseranschluss für Pflanzenpflege. Diese „Kleinigkeiten“ entscheiden später über den Nutzwert.'
        ]},
        { h: 'Die drei häufigsten Terrassen-Fehler', ps: [
          '<strong>1. Falsches Gefälle:</strong> Terrassen brauchen ein Gefälle von 1,5–2 % vom Haus weg – sonst steht das Wasser.',
          '<strong>2. Zu knapp geplant:</strong> Lieber 20 % größer bauen als nötig. Möbel brauchen mehr Platz als gedacht.',
          '<strong>3. Keine Randeinfassung:</strong> Ohne stabile Kante verrutschen Platten und Bretter über die Jahre.'
        ]},
      ],
      outro: 'Eine Terrasse ist eine Langzeit-Investition. Wer Material, Unterbau und Details ernst nimmt, bekommt einen Außenbereich, der zum Leben einlädt – und nicht zur Dauerbaustelle wird. Lassen Sie sich vor dem Bau von einem Fachbetrieb beraten: Die Beratung kostet nichts, spart aber teure Fehler.',
      ctaQuestion: 'Terrassenprojekt geplant?', ctaText: 'Kostenlose Terrassen-Beratung anfragen',
    }
  },
]

// ═══════════════════════════════════════════════════════════════
// 2. HAUPT-HUB ratgeber.html + 3. FEHLENDE TRADE-HUBS
// ═══════════════════════════════════════════════════════════════
const ARTICLES = {
  dachdecker: [
    { slug: 'artikel-5-anzeichen-dachsanierung', tag: 'Sanierung', min: 6, d: 'Moos zwischen den Ziegeln, Fugenstaub in der Dachrinne, Tropfgeräusche im Haus: Diese fünf Anzeichen verraten, dass Ihr Dach bald eine Sanierung braucht – bevor Schäden teuer werden.' },
    { slug: 'artikel-dachdaemmung-foerderung', tag: 'Förderung', min: 8, d: 'Zuschuss oder Kredit? Wer die Dämmung seines Dachs plant, sollte die Förderlandschaft kennen – und einen wichtigen Fehler vermeiden.' },
    { slug: 'artikel-sturmschaden-sofortmassnahmen', tag: 'Notfall', min: 5, d: 'Sturm über dem Dach? Die ersten zwei Stunden entscheiden. Was Sie sofort tun sollten, wen Sie anrufen und was die Versicherung braucht.' },
  ],
  elektriker: [
    { slug: 'artikel-e-check-sicherheitspruefung', tag: 'Sicherheit', min: 6, d: 'Alle zehn Jahre Pflicht, oft sinnvoll früher: Was der E-Check wirklich prüft, was er kostet und wann er sich lohnt.' },
    { slug: 'artikel-wallbox-zuhause', tag: 'E-Mobilität', min: 7, d: 'Ladeleistung, Anmeldepflicht, Kosten: Die wichtigsten Fragen rund um die private Ladestation – verständlich erklärt.' },
    { slug: 'artikel-smart-home-nachruesten', tag: 'Smart Home', min: 7, d: 'Intelligentes Wohnen ohne großen Umbau: Welche Systeme sich nachrüsten lassen und wo der Elektriker helfen muss.' },
  ],
  klempner: [
    { slug: 'artikel-rohrbruch-sofortmassnahmen', tag: 'Notfall', min: 5, d: 'Rohrbruch! Die ersten Minuten entscheiden über den Schaden. Schritt für Schritt: Wasser abstellen, Dokumentation, Versicherung.' },
    { slug: 'artikel-heizungstausch-foerderung', tag: 'Förderung', min: 8, d: 'Heizungstausch 2026: Förderung, GEG & Kosten im Überblick. Welche Heizung passt zu Ihrem Haus und was bezuschusst wird.' },
    { slug: 'artikel-heizungs-check-winter', tag: 'Pflege', min: 6, d: '7 Punkte, die Sie jetzt prüfen sollten, bevor die Heizsaison startet – damit die Anlage durch den Winter kommt.' },
  ],
  maler: [
    { slug: 'artikel-fassade-streichen-kosten', tag: 'Kosten', min: 7, d: 'Kosten, Anstrichsysteme & der richtige Zeitpunkt: Was das Streichen der Fassade wirklich kostet und wie lange es hält.' },
    { slug: 'artikel-farben-raumwirkung', tag: 'Gestaltung', min: 6, d: 'Warm wirkt eng, kalt wirkt weit: Wie Farben Räume verändern – und wie Sie die richtigen Töne wählen.' },
    { slug: 'artikel-schimmel-wohnung', tag: 'Gesundheit', min: 7, d: 'Ursachen, Gesundheit & nachhaltige Sanierung: Wann reicht Wischen, wann muss der Fachmann ran?' },
  ],
  zimmerer: [
    { slug: 'artikel-carport-bauen', tag: 'Genehmigung', min: 7, d: 'Genehmigung, Kosten & die richtige Holzwahl: Was Sie vor dem Carport-Bau wissen müssen – inklusive typischer Fallen.' },
    { slug: 'artikel-dachstuhl-sanieren', tag: 'Sanierung', min: 8, d: 'Sanieren statt abreißen: Kosten, Ablauf & Möglichkeiten, wenn der Dachstuhl alt ist, aber das Fundament stimmt.' },
    { slug: 'artikel-holzterrasse-pflegen', tag: 'Pflege', min: 5, d: 'Ölen, säubern, schützen: Mit dieser Pflege bleibt Ihre Holzterrasse 20 Jahre schön – statt grau und rau.' },
  ],
  'garten-und-landschaftsbau': [
    { slug: 'artikel-gartenplanung-ideen', tag: 'Planung', min: 8, d: 'Vom Grundstück zum Traumgarten: Wegeführung, Zonen, Bepflanzung – und was die Planung wirklich kostet.' },
    { slug: 'artikel-rasen-neuanlage', tag: 'Rasen', min: 7, d: 'Saat, Rollrasen oder Nachsäen? Kosten, richtige Jahreszeit und die entscheidenden ersten Monate.' },
    { slug: 'artikel-terrasse-bauen', tag: 'Terrasse', min: 8, d: 'Holz, WPC oder Naturstein: Welches Material passt, was der Bau kostet und welche Fehler Sie vermeiden sollten.' },
  ],
}

const TRADE_META = {
  dachdecker: { name: 'Dachdecker', emoji: '🏠', hub: 'ratgeber-dachdecker', color: '#ea580c', desc: 'Dachsanierung, Förderung, Sturmschäden' },
  elektriker: { name: 'Elektriker', emoji: '⚡', hub: 'ratgeber-elektriker', color: '#2563eb', desc: 'Sicherheit, E-Mobilität, Smart Home' },
  klempner: { name: 'Klempner & SHK', emoji: '🔥', hub: 'ratgeber-klempner', color: '#0d9488', desc: 'Heizung, Wasser, Notfälle' },
  maler: { name: 'Maler', emoji: '🎨', hub: 'ratgeber-maler', color: '#7c3aed', desc: 'Fassade, Farben, Schimmel' },
  zimmerer: { name: 'Zimmerer', emoji: '🪵', hub: 'ratgeber-zimmerer', color: '#b45309', desc: 'Carport, Dachstuhl, Terrasse' },
  'garten-und-landschaftsbau': { name: 'Gartenbau', emoji: '🌳', hub: 'ratgeber-garten-und-landschaftsbau', color: '#16a34a', desc: 'Planung, Rasen, Terrassen' },
}

function tradeHubShell(slug) {
  const m = TRADE_META[slug]
  const articles = ARTICLES[slug]
  const t = getTrade(slug === 'garten-und-landschaftsbau' ? 'gartenbau' : slug)
  const cards = articles.map(a => `    <a href="/${a.slug}/" class="bg-white rounded-2xl overflow-hidden border border-ink-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 group">
      <div class="h-44 bg-gradient-to-br from-[${t.color[500]}] to-[${t.color[700]}] flex items-center justify-center">
        <span class="text-6xl">${m.emoji}</span>
      </div>
      <div class="p-7">
        <p class="text-xs font-semibold text-ink-400">${a.tag} · ${a.min} Min. Lesezeit</p>
        <h2 class="mt-2 text-lg font-bold text-ink-900 group-hover:text-brand-600 transition leading-snug">${a.title || titleFromSlug(a.slug)}</h2>
        <p class="mt-2 text-sm text-ink-600 leading-relaxed">${a.d}</p>
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
    <a href="/${slug}/dortmund/" class="mt-5 inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-4 rounded-xl transition">${t.ctaPrimary || 'Kostenlose Beratung anfragen'}</a>
  </div>
</main>

<footer class="bg-ink-900 text-ink-400 text-xs py-6 px-4 text-center">
  <p>© <span id="jahr"></span> fachschmiede.de – Der Ratgeber für Handwerk & Haus. <a href="/ratgeber/" class="underline hover:text-white">Ratgeber-Übersicht</a> · <a href="/${slug}/dortmund/" class="underline hover:text-white">${m.name} Dortmund</a> · <a href="/impressum.html" class="underline hover:text-white">Impressum</a> · <a href="/datenschutz.html" class="underline hover:text-white">Datenschutz</a></p>
</footer>
<script>document.getElementById('jahr').textContent = new Date().getFullYear();</script>
</body>
</html>
`
}

function titleFromSlug(slug) {
  const map = {
    'artikel-5-anzeichen-dachsanierung': '5 Anzeichen, dass Ihr Dach saniert werden muss',
    'artikel-dachdaemmung-foerderung': 'Dachdämmung fördern lassen: Diese Zuschüsse gibt es',
    'artikel-sturmschaden-sofortmassnahmen': 'Sturmschaden am Dach: Was Sie sofort tun sollten',
    'artikel-e-check-sicherheitspruefung': 'E-Check: Wann lohnt sich die Sicherheitsprüfung?',
    'artikel-wallbox-zuhause': 'Wallbox zu Hause: Das müssen Sie vor der Installation wissen',
    'artikel-smart-home-nachruesten': 'Smart Home nachrüsten: Einstieg ohne großen Umbau',
    'artikel-rohrbruch-sofortmassnahmen': 'Rohrbruch! Sofortmaßnahmen, bis der Klempner kommt',
    'artikel-heizungstausch-foerderung': 'Heizungstausch 2026: Förderung, GEG & Kosten im Überblick',
    'artikel-heizungs-check-winter': 'Heizungs-Check vor dem Winter: 7 Punkte, die Sie jetzt prüfen sollten',
    'artikel-fassade-streichen-kosten': 'Fassade streichen: Kosten, Anstrichsysteme & der richtige Zeitpunkt',
    'artikel-farben-raumwirkung': 'Farben & Raumwirkung: So wählen Sie den richtigen Ton',
    'artikel-schimmel-wohnung': 'Schimmel in der Wohnung: Ursachen, Gesundheit & nachhaltige Sanierung',
    'artikel-carport-bauen': 'Carport bauen: Genehmigung, Kosten & die richtige Holzwahl',
    'artikel-dachstuhl-sanieren': 'Dachstuhl sanieren statt abreißen: Kosten, Ablauf & Möglichkeiten',
    'artikel-holzterrasse-pflegen': 'Holzterrasse pflegen: So bleibt sie 20 Jahre schön',
    'artikel-gartenplanung-ideen': 'Gartenplanung: Vom Grundstück zum Traumgarten',
    'artikel-rasen-neuanlage': 'Rasen neu anlegen: Saat, Rollrasen oder Nachsäen',
    'artikel-terrasse-bauen': 'Terrasse bauen: Materialien, Kosten & Fehler vermeiden',
  }
  return map[slug] || slug
}

function mainHub() {
  const sections = Object.entries(ARTICLES).map(([slug, articles]) => {
    const m = TRADE_META[slug]
    const cards = articles.map(a => `      <a href="/${a.slug}/" class="group bg-white rounded-2xl border border-ink-200 p-5 hover:shadow-lg hover:-translate-y-0.5 transition">
        <p class="text-xs font-semibold" style="color:${m.color}">${a.tag} · ${a.min} Min.</p>
        <h3 class="mt-1.5 font-bold text-ink-900 group-hover:text-brand-600 transition leading-snug text-sm">${titleFromSlug(a.slug)}</h3>
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

// ═══════════════════════════════════════════════════════════════
// BUILD
// ═══════════════════════════════════════════════════════════════
const outputs = []

// 1. Garten-Artikel
for (const a of GARTEN_ARTICLES) {
  const html = articleShell(a.data)
  outputs.push({ file: path.join('public', a.file), html })
}

// 2. Haupt-Hub
outputs.push({ file: path.join('public', 'ratgeber.html'), html: mainHub() })

// 3. Fehlende Trade-Hubs (Dachdecker + Garten); bestehende 4 bleiben (geheilt)
outputs.push({ file: path.join('public', 'ratgeber-dachdecker.html'), html: tradeHubShell('dachdecker') })
outputs.push({ file: path.join('public', 'ratgeber-garten-und-landschaftsbau.html'), html: tradeHubShell('garten-und-landschaftsbau') })

// 4. next.config.js — Rewrites ergänzen (idempotent)
const ncPath = path.join(ROOT, 'next.config.js')
let nc = fs.readFileSync(ncPath, 'utf8')
const newRewrites = [
  { source: '/artikel-gartenplanung-ideen/', dest: '/artikel-gartenplanung-ideen.html' },
  { source: '/artikel-rasen-neuanlage/', dest: '/artikel-rasen-neuanlage.html' },
  { source: '/artikel-terrasse-bauen/', dest: '/artikel-terrasse-bauen.html' },
  { source: '/ratgeber-dachdecker/', dest: '/ratgeber-dachdecker.html' },
  { source: '/ratgeber-garten-und-landschaftsbau/', dest: '/ratgeber-garten-und-landschaftsbau.html' },
]
let added = 0
for (const r of newRewrites) {
  if (!nc.includes(`source: '${r.source}'`)) {
    // Nach der letzten artikel-Rewrite-Zeile einfügen (vor schließender Klammer des Blocks)
    const anchor = nc.match(/\n(\s*)\{ source: '\/artikel-wallbox-zuhause\/'[^\n]*\n/)
    if (anchor) {
      nc = nc.replace(anchor[0], anchor[0] + `${anchor[1]}{ source: '${r.source}', destination: '${r.dest}' },\n`)
      added++
    } else {
      console.log('⚠️ Anchor nicht gefunden für', r.source)
    }
  }
}
outputs.push({ file: 'next.config.js', html: nc, special: true })

// Ausgabe
for (const o of outputs) {
  const abs = path.join(ROOT, o.file)
  if (WRITE) {
    fs.writeFileSync(abs, o.html)
    console.log('✅ geschrieben:', o.file, `(${o.html.length} Bytes)`)
  } else {
    console.log('📝 würde schreiben:', o.file, `(${o.html.length} Bytes)`)
  }
}
console.log(`\n${outputs.length} Dateien ${WRITE ? '(GESCHRIEBEN)' : '(Dry-Run)'} — Rewrites neu: ${added}`)
