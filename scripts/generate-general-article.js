#!/usr/bin/env node
/**
 * generate-general-article.js — General-Ratgeber-Artikel generieren (SSOT-Engine)
 *
 * Wie auf den Stadtseiten, aber regionsneutral: kein Stadtname im Fließtext,
 * dafür City-Link-Box für interne Verlinkung.
 *
 * Nutzung:
 *   node scripts/generate-general-article.js --trade klempner --topic wasserschaden-sanierung   (Dry-Run)
 *   node scripts/generate-general-article.js --trade klempner --topic wasserschaden-sanierung --write
 *   node scripts/generate-general-article.js --all        (ein ungenutzter Topic pro Gewerk)
 *
 * Idempotent: existierende artikel-Slugs + Registry-Einträge werden übersprungen.
 */
const fs = require('fs')
const path = require('path')
const {
  getTrade, getArticleTopics, getAllTrades,
} = require('../config/system-config')
const {
  loadRegistry, saveRegistry, registryKey, generalArticleFromTemplate, tradeHubShell, mainHub,
} = require('../lib/ratgeber-lib')

const ROOT = path.join(__dirname, '..')
const WRITE = process.argv.includes('--write')
const args = process.argv.slice(2)
const argVal = (k) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : null }

// ─── CONTENT-BAUKASTEN PRO TOPIC (regional-neutral!) ────────────────
// Jeder Topic-Slug bekommt eigene Sektionen für Qualität; unbekannte Topics
// bekommen ein generisches Template aus Title-Keyword + Trade-Kontext.
const TOPIC_CONTENT = {
  'wasserschaden-sanierung': {
    tag: 'Notfall',
    title: 'Wasserschaden sanieren: Schnelle Hilfe, Kosten & die entscheidenden ersten Stunden',
    intro: 'Ein Wasserschaden ist eines der häufigsten Gebäudeschäden in Deutschland – und jede Stunde zählt. Was Sie in den ersten Stunden tun müssen, was die Sanierung kostet und wie Sie teure Folgeschäden vermeiden.',
    sections: [
      { h: 'Die ersten 60 Minuten entscheiden', ps: ['<strong>Wasser abstellen:</strong> Hauptventil zu – meist im Keller oder Bad. Bei Rohrbruch zusätzlich die betroffene Leitung isolieren.', '<strong>Strom absichern:</strong> Feuchte Elektroleitungen sind lebensgefährlich. Bei Wasser in der Nähe von Steckdosen: Sicherung raus.', '<strong>Dokumentieren:</strong> Fotos und Videos vom Schaden – für Versicherung und Handwerker. Alles mit Zeitstempel.', '<strong>Wasser aufnehmen:</strong> Tücher, Eimer, nasse Staubsauger. Je schneller die Feuchtigkeit weg ist, desto kleiner der Schaden.'] },
      { h: 'Professionelle Trocknung statt Heimwerkerei', ps: ['Nach dem ersten Schock beginnt der Wettlauf gegen den Schimmel. Bautrockner und Luftentfeuchter sind Pflicht – aber nur der Profi findet die versteckte Feuchtigkeit in Wänden, Estrich und Dämmung.', 'Mit einem Feuchtemessgerät wird genau kartiert, wo getrocknet werden muss. Das kostet etwas mehr als der Baumarkt-Trockner, verhindert aber Schimmel hinter der Wand, der erst nach Monaten sichtbar wird.'] },
      { h: 'Was kostet die Sanierung?', ps: ['<strong>Kleiner Schaden</strong> (austretendes Wasser, trockene Wand): 500 – 1.500 €', '<strong>Mittlerer Schaden</strong> (Boden, Möbel, Trocknung): 1.500 – 5.000 €', '<strong>Großer Schaden</strong> (Decken, Statik, über Wochen feucht): 5.000 – 20.000 €', 'Die Versicherung übernimmt meist die Kosten – aber nur bei fachgerechter Dokumentation und schnellem Handeln. Lassen Sie die Schadenshöhe immer durch einen Fachbetrieb schätzen.'] },
      { h: 'Versicherung: Diese Fehler ruinieren die Regulierung', ps: ['Viele Versicherer verlangen die Meldung <strong>innerhalb von 48 Stunden</strong>. Wer zu spät meldet, riskiert die Leistung.', 'Nicht selbst großflächig aufstemmen oder Material entsorgen, bevor der Gutachter da war. Foto-Dokumentation vor jeder Maßnahme!', 'Einen Fachbetrieb mit Versicherungserfahrung beauftragen – er übernimmt die Kommunikation und dokumentiert fachgerecht.'] },
    ],
    outro: 'Bei Wasserschaden zählt jede Stunde: schnell abstellen, dokumentieren und professionell trocknen lassen. Der Aufwand für eine fachgerechte Sanierung ist deutlich geringer als die Kosten für übersehenen Schimmel oder morsches Holz. Lassen Sie den Schaden frühzeitig durch einen SHK-Fachbetrieb bewerten.',
    ctaQuestion: 'Wasserschaden? Jetzt schnell handeln!',
    desc: 'Die entscheidenden ersten Stunden, professionelle Trocknung, Kosten und die Versicherungs-Fallen – was Sie bei Wasserschaden wissen müssen.',
  },
  'rohrreinigung-notdienst': {
    tag: 'Notfall',
    title: 'Rohrreinigung & Notdienst: Wann es professionelle Hilfe braucht – und was es kostet',
    intro: 'Der Abfluss gluckert, das Wasser steht: Rohrprobleme eskalieren schnell. Wann eine Rohrreinigung reicht, wann der Notdienst kommen muss und welche Kosten Sie erwarten dürfen.',
    sections: [
      { h: 'Die ersten Anzeichen eines Rohrproblems', ps: ['<strong>Abfluss läuft langsam:</strong> Meist Fett, Haare und Seifenreste – hier hilft oft eine mechanische Reinigung.', '<strong>Gluckern in den Leitungen:</strong> Luft im System, oft durch Verstopfung weiter hinten. Chemische Abflussreiniger können Rohre angreifen – besser mechanisch reinigen lassen.', '<strong>Wasser tritt an Übergängen aus:</strong> Akute Notfallsituation – Wasser abstellen und Notdienst rufen.', '<strong>Übler Geruch aus dem Abfluss:</strong> Trockene Siphons oder Fäulnis in der Leitung – bei wiederkehrendem Geruch liegt oft eine größere Ablagerung vor.'] },
      { h: 'Selbst reinigen oder Fachbetrieb rufen?', ps: ['Pümpel und Rohrreinigungsspirale aus dem Baumarkt reichen bei oberflächlichen Verstopfungen. Wer zweimal ziehen muss, hat das Problem nicht gelöst – dann sitzt die Verstopfung tiefer.', 'Professionelle Reinigung mit Spül- oder Sauganlage kostet 80 – 200 € und dauert eine Stunde. Dafür wird die Leitung komplett frei – inklusive Kamerainspektion bei hartnäckigen Fällen.'] },
      { h: 'Notdienst: Kosten & Ablauf', ps: ['<strong>Werktags tagsüber:</strong> 100 – 250 € für die Anfahrt und erste Maßnahme.', '<strong>Abends, Wochenende, Feiertag:</strong> 150 – 400 € – die Zuschläge sind gesetzlich gedeckelt, Betrüger verlangen oft das Doppelte.', '<strong>Wichtig:</strong> Vor der Beauftragung nach dem Preis fragen! Seriöse Notdienste nennen Festpreise am Telefon.', 'Bei Wasserschäden an Mietwohnung: sofort Vermieter informieren – die Gebäudeversicherung greift oft.'] },
      { h: 'Verstopfungen dauerhaft vermeiden', ps: ['Fett NIEMALS in den Ausguss – sondern in einen Behälter und in den Restmüll.', 'Haare nach dem Duschen aus dem Abfluss entfernen, regelmäßig Sieb reinigen.', 'Bei wiederkehrenden Verstopfungen: Kamerainspektion anfordern. Häufig sind alte Rohre verformt oder Wurzeln eingedrungen – das muss man sehen, bevor man ständig nachbessert.'] },
    ],
    outro: 'Rohrprobleme werden nicht besser, wenn man sie ignoriert. Schnell handeln, seriöse Betriebe mit Festpreis wählen und bei wiederkehrenden Problemen die Ursache per Kamera klären lassen. So bleibt die Kanalisation dauerhaft frei.',
    ctaQuestion: 'Abfluss verstopft? Schnelle Hilfe in Ihrer Stadt!',
    desc: 'Verstopfte Leitung, Notdienst-Kosten, Kamerainspektion: Was Sie bei Rohrproblemen wissen müssen – inklusive der Abzocke-Fallen.',
  },
  'holzterrasse-anlegen': {
    tag: 'Anleitung',
    title: 'Holzterrasse anlegen: Unterkonstruktion, Holzwahl & die häufigsten Fehler',
    intro: 'Eine Holzterrasse ist der Klassiker unter den Gartenprojekten. Mit der richtigen Planung hält sie 20 Jahre und mehr – mit den typischen Anfängerfehlern nur wenige Saisons.',
    sections: [
      { h: 'Die Planung: Größe, Lage, Material', ps: ['<strong>Größe:</strong> 12 – 20 m² sind für eine Sitzecke ideal. Ab 20 m² ist in vielen Bundesländern eine Baugenehmigung nötig – vorher beim Bauamt erkundigen.', '<strong>Lage:</strong> Sonnig oder schattig? Südseiten altern schneller, Nordseiten bleiben feuchter und neigen zu Algen.', '<strong>Holz:</strong> Heimische Hölzer (Douglasie, Lärche) sind günstig und nachhaltig. Harthölzer wie Bangkirai sind dauerhafter, aber teurer und müssen nachbehandelt werden. WPC ist pflegeleicht, aber wärmer und teurer.'] },
      { h: 'Der entscheidendste Punkt: die Unterkonstruktion', ps: ['80 % aller Terrassenschäden entstehen an der Unterkonstruktion. Sie muss exakt waagrecht liegen, einen Mindestabstand von 5 cm zum Boden haben und mit Fundamenten (nicht direkt auf dem Boden) verankert werden.', 'Konstruktionsholz mindestens 60 × 80 mm, Abstand der Balken max. 50 cm bei 28 mm Dielen. Bei großen Spannweiten: Statik beachten oder Statiker fragen.', 'Häufigster Fehler: Dielen direkt auf den Rasen legen. Feuchtigkeit steigt auf, das Holz fault von unten.'] },
      { h: 'Verlegung: Schritt für Schritt', ps: ['Unterkonstruktion ausrichten und befestigen – Wasser muss ablaufen können, Gefälle 1–2 %.', 'Dielen mit Abstand 5–7 mm verlegen (Holz arbeitet!), Edelstahlschrauben vorbohren.', 'Erste und letzte Diele fixieren, Zwischenräume mit Abstandshaltern kontrollieren.', 'Abschließend mit Hartöl oder Lasur behandeln – gerade bei Douglasie wichtig, sonst graut sie schnell.'] },
      { h: 'Kosten im Überblick', ps: ['<strong>Material (Holz, 15 m²):</strong> 800 – 1.800 € je nach Holzart', '<strong>Unterkonstruktion & Fundamente:</strong> 300 – 600 €', '<strong>Profi-Verlegung inklusive Material:</strong> 100 – 150 € pro m²', 'Selbstbau spart 40–50 % der Kosten – aber nur, wenn Unterkonstruktion und Werkzeug stimmen.'] },
    ],
    outro: 'Eine Holzterrasse ist ein Wochenendprojekt mit Planungspflicht: Unterkonstruktion exakt, Holz qualitativ, Fugen großzügig. Wer unsicher ist, lässt den Unterbau vom Zimmerer oder Gartenbauer setzen – die Dielen verlegen kann man dann selbst.',
    ctaQuestion: 'Traumterrasse statt Bauchlandung?',
    desc: 'Unterkonstruktion, Holzwahl, Kosten: Wie Ihre Holzterrasse 20 Jahre hält – statt nach zwei Saisons zu wackeln.',
  },
  'tapezieren-techniken': {
    tag: 'Technik',
    title: 'Tapezieren: Vom glatten Putz zur perfekten Wand – Techniken & Profi-Tipps',
    intro: 'Eine sauber getapezierte Wand verändert einen Raum grundlegend. Welche Tapeten es gibt, welche Technik zu welchem Untergrund passt und die Fehler, die jeder Anfänger macht.',
    sections: [
      { h: 'Die richtige Tapete für jeden Zweck', ps: ['<strong>Vliestapeten</strong> sind die Allrounder: robust, formstabil und einfach zu verarbeiten – die Kleister kommt direkt an die Wand.', '<strong>Papiertapeten</strong> sind günstig und atmungsaktiv, aber empfindlich bei der Verarbeitung.', '<strong>Vinyltapeten</strong> sind abwaschbar und ideal für Küche, Bad und stark genutzte Flure.', '<strong>Glasgewebe</strong> deckt Risse und unebene Untergründe ab – beliebt in Altbauten.'] },
      { h: 'Vorbereitung ist die halbe Miete', ps: ['Der größte Fehler: Tapezieren auf Staub und Unebenheiten. Der Untergrund muss trocken, sauber, tragfähig und glatt sein.', 'Löcher und Risse mit Spachtelmasse schließen, anschließend grundieren. Bei stark saugenden Untergründen (Gipskarton) ist eine Grundierung Pflicht, sonst trocknet der Kleister zu schnell ein.', 'Strom aus, Steckdosen und Schalter demontieren, Leitungen abkleben. Sauberes Arbeiten beginnt vor der ersten Bahn.'] },
      { h: 'Die Bahn für Bahn: Anleitung für saubere Ergebnisse', ps: ['Beginnen Sie an einer Fenster- oder Türseite und arbeiten Sie sich gegen den Lichtfall vor – so sehen Sie Überstände sofort.', 'Erste Bahn absolut lotrecht ansetzen, jede weitere Bahn knapp anstoßen, ohne Überlappung. Nahtroller leicht andrücken – nicht quetschen.', 'Bei Mustertapeten: Rapport beachten und genug Zuschlag einplanen. Ein Rapport-Fehler kostet meist eine ganze Bahn.'] },
      { h: 'Wann lohnt sich der Profi?', ps: ['Bei Raufasertapeten in großen Räumen, Mustertapeten mit Rapport, Decken und schwierigen Ecken zahlt sich ein Maler aus.', 'Kosten: einfaches Tapezieren 8 – 12 € pro m², inklusive Material und Vorbereitung 15 – 25 €. Für ein Wohnzimmer mit 40 m² Wandfläche: 600 – 1.000 € vom Profi.', 'Gerade in Mietwohnungen lohnt der Profi doppelt: saubere Kanten an Decken und Sockelleisten sind beim Auszug die halbe Kaution.'] },
    ],
    outro: 'Tapezieren ist keine Hexerei – aber Handarbeit, die Übung braucht. Wer Wert auf perfekte Kanten, Rapportgenauigkeit und dauerhaft schöne Wände legt, ist mit einem Maler auf der sicheren Seite. Für kleine Projekte lohnt der Selbstversuch mit Vlies- oder Raufasertapeten.',
    ctaQuestion: 'Perfekte Wände statt Wellen und Blasen?',
    desc: 'Vliestapete, Rapport, Untergrund-Grundierung: Welche Tapete zu welchem Raum passt und wann der Maler die bessere Wahl ist.',
  },
}

/** Fallback-Content für Topics ohne eigenen Baukasten */
function genericTopicContent(tradeSlug, topic) {
  const t = getTrade(tradeSlug)
  const kw = (typeof topic.title === 'function' ? topic.title('Ihrer Stadt') : topic.title)
    .replace(/\s+in\s+Ihrer Stadt/i, '').trim()
  const pain = t.painPoints || []
  return {
    tag: topic.tag || 'Ratgeber',
    title: kw.charAt(0).toUpperCase() + kw.slice(1),
    intro: `${kw} betrifft fast jeden Hausbesitzer früher oder später. Dieser Ratgeber erklärt verständlich, worauf es ankommt, was es kostet und wie Sie die richtigen Entscheidungen treffen – von der ersten Planung bis zur Umsetzung.`,
    sections: [
      { h: `Warum ${kw} gut geplant sein will`, ps: [`${kw} ist selten eine Nebensache: Falsche Entscheidungen bei Planung oder Ausführung kosten später deutlich mehr als die Erstinvestition.`, `Die häufigsten Ursachen für Ärger: unklare Leistungsvereinbarung, fehlende Vergleichsangebote und Zeitdruck bei der Betriebswahl. Mit etwas Vorbereitung lassen sich alle drei vermeiden.`, `Typische Themen rund um ${kw}: ${pain[0] || 'Qualität und Haltbarkeit'}, ${pain[1] || 'Kostenkontrolle'} und ${pain[2] || 'fachgerechte Ausführung'}.`] },
      { h: 'Die wichtigsten Entscheidungen', ps: ['<strong>Leistungsumfang:</strong> Was genau soll umgesetzt werden? Schriftlich festhalten – Wunsch und Angebot müssen übereinstimmen.', '<strong>Budget:</strong> Realistisch kalkulieren und 15 % Reserve für Unvorhergesehenes einplanen.', '<strong>Betrieb:</strong> Mindestens drei Angebote vergleichen – nicht nur den Preis, sondern Material, Zeitplan und Garantie.'] },
      { h: 'Was kostet es?', ps: ['Kleine Projekte: 300 – 1.500 €', 'Mittlere Projekte: 1.500 – 5.000 €', 'Große Projekte: 5.000 – 15.000 €', 'Richtwerte – ein verbindliches Angebot gibt es nach einer kostenlosen Besichtigung vor Ort.'] },
    ],
    outro: `${kw} gelingt mit guter Planung, klarem Budget und dem richtigen Fachbetrieb. Lassen Sie sich kostenlos beraten und vergleichen Sie Angebote – das zahlt sich doppelt aus: in Qualität und Preis.`,
    ctaQuestion: 'Unverbindlich beraten lassen?',
    desc: `${kw}: Kosten, Ablauf und die wichtigsten Entscheidungen – verständlich erklärt vom ${t.name}.`,
  }
}

function topicContent(tradeSlug, topic) {
  return TOPIC_CONTENT[topic.slug] || genericTopicContent(tradeSlug, topic)
}

// ─── ENGINE ─────────────────────────────────────────────────────────
function nextRewriteAndSitemap(slug) {
  const nc = fs.readFileSync(path.join(ROOT, 'next.config.js'), 'utf8')
  const sm = fs.readFileSync(path.join(ROOT, 'public/sitemap.xml'), 'utf8')
  return { nc, sm }
}

function findDup(existing, artSlug, c) {
  const clashBySlug = existing.find(a => a.slug === artSlug)
  if (clashBySlug) return clashBySlug
  const wordsOf = (s) => s.toLowerCase().replace(/[^a-zäöüß\s]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !['kosten', 'ratgeber', 'ihre', 'ihrer', 'einem', 'einer', 'wissen', 'müssen'].includes(w))
  const newWords = wordsOf(c.title)
  return existing.find(a => {
    const oldWords = wordsOf(a.title)
    const overlap = newWords.filter(w => oldWords.some(o => o === w || o.startsWith(w.slice(0, 5)) || w.startsWith(o.slice(0, 5))))
    return overlap.length >= Math.min(newWords.length, 2) && overlap.length / Math.max(newWords.length, 1) >= 0.6
  })
}

function run(tradeSlug, topicSlug) {
  const t = getTrade(tradeSlug)
  if (!t) throw new Error('Unbekanntes Gewerk: ' + tradeSlug)
  const regKey = registryKey(tradeSlug)
  const topics = getArticleTopics(tradeSlug)
  const topic = topics.find(x => x.slug === topicSlug)
  if (!topic) throw new Error(`Topic '${topicSlug}' nicht im SSOT-Pool von ${tradeSlug}: ${topics.map(x => x.slug).join(', ')}`)

  const reg = loadRegistry()
  const existing = reg.trades[regKey] || []
  const artSlug = 'artikel-' + topic.slug

  // Slug-/Titel-Kollisionen (Wort-Überlappung ≥ 60% = Duplikat)
  const c = topicContent(tradeSlug, topic)
  const clash = findDup(existing, artSlug, c)
  if (clash) {
    console.log(`  ⏭️ ${clash.slug === artSlug ? artSlug + ' existiert bereits' : 'Thema bereits abgedeckt durch ' + clash.slug} („${clash.title}“)`)
    return false
  }

  const file = path.join(ROOT, 'public', artSlug + '.html')
  const exists = fs.existsSync(file)
  if (exists) {
    console.log(`  ⏭️ Datei existiert: public/${artSlug}.html`)
    return false
  }

  const html = generalArticleFromTemplate(tradeSlug, { slug: artSlug, ...c })
  if (WRITE) fs.writeFileSync(file, html)

  // Registry erweitern + Hubs neu bauen
  existing.push({ slug: artSlug, tag: c.tag, min: 7, title: c.title, desc: c.desc })
  const newReg = { ...reg, trades: { ...reg.trades, [regKey]: existing } }
  if (WRITE) {
    saveRegistry(newReg)
    fs.writeFileSync(path.join(ROOT, 'public', `ratgeber-${regKey}.html`), tradeHubShell(regKey))
    fs.writeFileSync(path.join(ROOT, 'public', 'ratgeber.html'), mainHub())

    // Rewrite + Sitemap (idempotent)
    const ncPath = path.join(ROOT, 'next.config.js')
    let nc = fs.readFileSync(ncPath, 'utf8')
    if (!nc.includes(`source: '/${artSlug}/'`)) {
      const anchor = `      { source: '/artikel-wallbox-zuhause/',`
      if (!nc.includes(anchor.trim())) throw new Error('Rewrite-Anchor verschoben! Bitte next.config.js prüfen.')
      const rewrite = `      { source: '/${artSlug}/', destination: '/${artSlug}.html' },\n`
      nc = nc.replace(anchor, rewrite + anchor)
      fs.writeFileSync(ncPath, nc)
    }
    const smPath = path.join(ROOT, 'public/sitemap.xml')
    let sm = fs.readFileSync(smPath, 'utf8')
    if (!sm.includes(`<loc>https://www.fachschmiede.de/${artSlug}/</loc>`)) {
      sm = sm.replace('</urlset>', `  <url><loc>https://www.fachschmiede.de/${artSlug}/</loc><priority>0.6</priority><changefreq>weekly</changefreq></url>\n</urlset>`)
      fs.writeFileSync(smPath, sm)
    }
  }
  console.log(`  ✓ ${artSlug} (${(html.length / 1024).toFixed(1)} KB) → Hub ${regKey} (${existing.length} Artikel) ${WRITE ? 'GESCHRIEBEN' : '(Dry-Run)'}`)
  return true
}

// ─── MAIN ───────────────────────────────────────────────────────────
const reg = loadRegistry()
let planned = []

if (args.includes('--all')) {
  for (const t of getAllTrades()) {
    const regKey = registryKey(t.slug)
    const existing = reg.trades[regKey] || []
    for (const topic of getArticleTopics(t.slug)) {
      const artSlug = 'artikel-' + topic.slug
      if (fs.existsSync(path.join(ROOT, 'public', artSlug + '.html'))) continue
      if (findDup(existing, artSlug, topicContent(t.slug, topic))) continue
      planned.push({ trade: t.slug, topic: topic.slug })
      break // ein Topic pro Gewerk
    }
  }
} else {
  const trade = argVal('trade')
  const topic = argVal('topic')
  if (!trade || !topic) {
    console.log('Nutzen: --trade <gewerk> --topic <slug> [--write] | --all [--write]')
    process.exit(1)
  }
  planned.push({ trade, topic })
}

console.log(`Geplant: ${planned.length} Artikel ${WRITE ? '(SCHREIBT!)' : '(Dry-Run)'}`)
let done = 0
for (const p of planned) if (run(p.trade, p.topic)) done++
console.log(`\n${done} neu generiert, ${planned.length - done} übersprungen.`)

// Sanity nach Write: alle Registry-Artikel existieren als Datei
if (WRITE) {
  const r2 = loadRegistry()
  const missing = []
  for (const [k, arts] of Object.entries(r2.trades)) {
    for (const a of arts) {
      if (!fs.existsSync(path.join(ROOT, 'public', a.slug + '.html'))) missing.push(`${k}: ${a.slug}`)
    }
  }
  if (missing.length) { console.log('⚠️ Registry ohne Datei:', missing.join(', ')); process.exit(1) }
  console.log('✅ Sanity: Registry ↔ Dateien konsistent')
}
