/**
 * city-gen.js — Stadt-Generierungs-Engine (fachschmiede.de)
 * Erzeugt aus einem Stadt-Profil vollständige, individuelle Stadtseiten:
 *  - stadt-{key}-{city}.html (6 Gewerke, Unique-Content-Regionen neu generiert)
 *  - Blog-Dateien (Index + 3 Artikel) + article-index.json Einträge
 *  - Salespage-Patches (CITY_SLUGS + Karte + Region-Attr + Zähler)
 *  - system-config.js Eintrag, sitemap.xml
 * Nutzbar von: scripts/generate-city.js (CLI) UND app/api/admin/pages/route.ts (Serverless).
 * PURE FUNCTIONS — kein fs, kein Netz. Caller liefert Dateiinhalte + schreibt Ergebnisse.
 */

// ─── Konfiguration ───────────────────────────────────────────────
const TRADES = {
  dachdecker: { key: 'dach', label: 'Dachdecker', word: 'dachdecker', topic: 'die Dachpflege', articleDir: 'dachdecker' },
  elektriker: { key: 'elek', label: 'Elektriker', word: 'elektriker', topic: 'die Elektroinstallation', articleDir: 'elektriker' },
  klempner: { key: 'klempner', label: 'Klempner / SHK', word: 'klempner', topic: 'die Haustechnik', articleDir: 'klempner' },
  maler: { key: 'maler', label: 'Maler', word: 'maler', topic: 'der Fassadenschutz', articleDir: 'maler' },
  zimmerer: { key: 'zimm', label: 'Zimmerer', word: 'zimmerer', topic: 'der Holzbau', articleDir: 'zimmerer' },
  'garten-und-landschaftsbau': { key: 'garten', label: 'Garten & Landschaftsbau', word: 'garten- und landschaftsbau', topic: 'die Gartengestaltung', articleDir: 'garten-und-landschaftsbau' },
}
const SALES_FILES = {
  dachdecker: 'sales-dachdecker.html',
  elektriker: 'sales-elektriker.html',
  klempner: 'sales-klempner.html',
  maler: 'sales-maler.html',
  zimmerer: 'sales-zimmerer.html',
  'garten-und-landschaftsbau': 'sales-garten-und-landschaftsbau.html',
}
const TEMPLATE_CITY = 'witten' // neutrale Template-Stadt (alle 6 Gewerke vorhanden)
const TEMPLATE_DISTRICTS = ['Herbede', 'Mitte', 'Rüdinghausen', 'Bommern', 'Annen']

// ─── Text-Varianten (Unique-Content-Engine) ─────────────────────
const CLIMATE = {
  'Nordrhein-Westfalen': 'Das westliche Klima bringt viel Niederschlag und wechselhafte Witterung — Gebäude in der Region sind entsprechend beansprucht.',
  'Bayern': 'Kräftige Gewitter im Sommer und Schneelasten im Winter setzen den Gebäuden in der Region einiges ab.',
  'Baden-Württemberg': 'Hanglagen und das lokale Kleinklima prägen viele Grundstücke in der Region — Fachwissen vor Ort zahlt sich aus.',
  'Niedersachsen': 'Die norddeutsche Witterung mit viel Wind und Regen beansprucht Gebäude gleichermaßen.',
  'Hessen': 'Wechselhaftes Wetter und kräftige Sommergewitter prägen die Region.',
  'Rheinland-Pfalz': 'Die Mittelgebirgslage bringt kräftige Niederschläge mit sich — regelmäßige Kontrolle ist hier Pflicht.',
  'Sachsen': 'Harsche Winter und warme Sommer setzen den Baustoffen in der Region stark zu.',
  'Sachsen-Anhalt': 'Wechselnde Temperaturen und Wind setzen den Gebäuden in der Region einiges ab.',
  'Thüringen': 'Das Thüringer Klima mit kalten Wintern und warmen Sommern fordert den Baubestand heraus.',
  'Schleswig-Holstein': 'Küstennahe Stürme und viel Regen prägen die Witterung in der Region.',
  'Hamburg': 'Die Nähe zur Elbe und der Seewind prägen die Witterung — Gebäude sind entsprechend beansprucht.',
  'Bremen': 'Nordseewind und viel Regen beanspruchen die Gebäude in der Region.',
  'Berlin': 'Das urban-kontinentale Klima mit heißen Sommern und kalten Wintern setzt dem Baubestand zu.',
  'Brandenburg': 'Weite Landschaft und wechselhafte Witterung prägen die Region.',
  'Mecklenburg-Vorpommern': 'Ostseenahe Witterung mit viel Wind und Regen beansprucht die Gebäude in der Region.',
  'Saarland': 'Das saarländische Hügelland und viel Regen prägen die örtlichen Gegebenheiten.',
}
const climateFor = (state) => CLIMATE[state] || 'Die regionale Witterung setzt den Gebäuden hier einiges ab — regelmäßige Fachkontrolle zahlt sich aus.'

const CHIP_DESCS = [
  'Wohngebiet mit gepflegtem Miet- und Eigentumsbestand',
  'Ruhige Lage mit viel Grün und älterem Baubestand',
  'Gefragte Wohnlage nahe dem Zentrum',
  'Gemischtes Wohngebiet mit Neubau und Bestand',
  'Gründerzeit-Bestand und moderne Erweiterungen',
  'Familiengeprägte Lage mit vielen Einfamilienhäusern',
]

function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h + str.charCodeAt(i)) | 0 }
  return Math.abs(h)
}
function pick(arr, seed) { return arr[seed % arr.length] }
function fmtPop(pop) {
  if (!pop) return ''
  const rounded = Math.round(pop / 100) * 100
  return rounded.toLocaleString('de-DE')
}

// ─── Profil aus de-orte.json auflösen ────────────────────────────
function loadOrtIndex(orteJson) {
  const arr = typeof orteJson === 'string' ? JSON.parse(orteJson) : orteJson
  const bySlug = {}
  for (const o of arr) bySlug[o.s] = o
  return bySlug
}

function resolveProfile(ortEntry, opts = {}) {
  const isDistrict = ortEntry.t === 'd'
  const name = opts.name || (isDistrict ? ortEntry.dn : ortEntry.n)
  const slug = opts.citySlug || ortEntry.s
  const state = ortEntry.b || opts.state || ''
  return {
    slug,
    name,                                   // Anzeigename (ohne Klammerzusatz)
    displayName: ortEntry.n || name,        // voller Listenname z.B. "Charlottenburg (Berlin)"
    isDistrict,
    parentCity: ortEntry.c || null,
    parentName: isDistrict ? (ortEntry.n.match(/\(([^)]+)\)/) || [])[1] || '' : null,
    pop: ortEntry.p || 0,
    state,
    kreis: ortEntry.k || '',
    districts: opts.districts || [],
  }
}

// ─── Unique-Region-Generierung ───────────────────────────────────
// Erwartet Template-HTML, ersetzt die stadt-spezifischen Sätze.
function generateUniqueRegions(html, profile, trade) {
  const seed = hashCode(profile.slug + ':' + trade.key)
  const D = profile.districts.length ? profile.districts : null
  const d = (i) => D ? D[i % D.length] : null
  const climate = climateFor(profile.state)
  const tradeWord = trade.word
  const popOk = profile.pop > 0
  const pop = fmtPop(profile.pop)
  // Stadtteile: mit Parent-Kontext ("Hörde (Dortmund)") für lokale SEO
  const pname = profile.isDistrict ? (profile.displayName || profile.name) : profile.name
  const dativKreis = profile.kreis ? profile.kreis.replace(/er Kreis$/, 'en Kreis') : ''
  // Stadtteile ohne Kreis/State: neutrale Phrase statt defektem "X in "
  const kreisPhrase = dativKreis
    ? `${pname} im ${dativKreis}`
    : (profile.state ? `${pname} in ${profile.state}` : `${pname} und dem umliegenden Stadtgebiet`)

  let out = html
  let count = 0
  const replaceOnce = (regex, repl, label, { required = true } = {}) => {
    const all = out.match(new RegExp(regex.source, 'g'))
    if (!all || all.length !== 1) {
      if (required) throw new Error(`[city-gen] Anker "${label}" in ${trade.key}: ${all ? all.length : 0} Treffer (erwartet 1)`)
      return false
    }
    out = out.replace(regex, repl)
    count++
    return true
  }

  // 1) Hero-Subline
  const heroVariants = D ? [
    `Von ${d(0)} bis ${d(2)}: Unsere ${tradeWord}-Leistungen sind auf den lokalen Wohnungsbestand in ${pname} abgestimmt. ${climate}`,
    `${pname} ist vielfältig — und unsere ${tradeWord}-Leistungen sind es auch. Vom Zentrum um ${d(0)} bis zu den Randlagen bei ${d(1)}: Wir kennen die lokalen Gegebenheiten. ${climate}`,
  ] : [
    `Unsere ${tradeWord}-Leistungen sind auf ${pname} und die gesamte Region abgestimmt. ${climate}`,
    `Vom Zentrum bis in die Randlagen: In ${pname} kennen wir den lokalen Wohnungsbestand — und die typischen Bauprobleme der Region. ${climate}`,
  ]
  replaceOnce(
    /<p class="text-lg text-ink-600 leading-relaxed mb-8 max-w-3xl">((?:(?!<\/p>)[\s\S])*)Witten((?:(?!<\/p>)[\s\S])*)<\/p>/,
    `<p class="text-lg text-ink-600 leading-relaxed mb-8 max-w-3xl">${pick(heroVariants, seed)}</p>`,
    'hero-subline'
  )

  // 2) Motivations-Block
  const motVariants = D ? [
    `Was uns in ${pname} antreibt? Die Vielfalt der Projekte. Kein Haus in ${d(0)} gleicht dem anderen — und genau das macht unsere Arbeit spannend. Wir bringen jahrzehntelange Erfahrung mit und bleiben gleichzeitig am Puls der Zeit.`,
    `${pname} ist unser Zuhause. Wir wohnen hier, arbeiten hier, kennen die Menschen und die Häuser. Ob in ${d(0)} oder einem der anderen Ortsteile — wenn Sie einen ${trade.label} suchen, der die Region wirklich kennt, sind Sie bei uns richtig.`,
  ] : [
    `Was uns in ${pname} antreibt? Die Menschen und ihre Projekte. Vom Altbau im Zentrum bis zum Neubau am Stadtrand — wir bringen die Erfahrung mit, die Ihr Vorhaben braucht.`,
    `${pname} ist unsere Heimat. Wir kennen die Bauten, die Witterung und die Menschen der Region — und beraten Sie so, wie wir selbst beraten werden wollen.`,
  ]
  replaceOnce(
    /<p class="text-sm text-ink-200 leading-relaxed">[^]*?<\/p>/,
    `<p class="text-sm text-ink-200 leading-relaxed">${pick(motVariants, seed)}</p>`,
    'motivation'
  )

  // 3) LOKAL-Intro — `<p class="text-lg">` kommt genau 1× pro Template vor
  //    (dach: „Gerade in …“, maler/elek/…: „In Witten mit seinem Mischbestand …“)
  const lokalIntroD = [
    `Gerade in ${pname} mit seinem gemischten Wohnungsbestand ist ${trade.topic} ein Thema, das viele Eigentümer beschäftigt. ${kreisPhrase} verbindet urbanes Leben im Zentrum mit ruhigen Wohnlagen in den Randlagen. Der Baubestand reicht von klassischen Mietshäusern bis zu großzügigen Einfamilienhäusern in ${d(1)} und Umgebung.`,
    `In ${pname} ist ${trade.topic} ein Thema, das viele Eigentümer beschäftigt. ${kreisPhrase} verbindet urbane Mitte mit ruhigen Randlagen — der Baubestand ist ebenso vielfältig wie die Anforderungen.`,
  ]
  const lokalIntroNoD = [
    `In ${pname} ist ${trade.topic} ein Thema, das viele Eigentümer beschäftigt. ${kreisPhrase} verbindet urbane Mitte mit ruhigen Randlagen — der Baubestand ist ebenso vielfältig wie die Anforderungen.`,
    `Ob Zentrum oder Randlage: In ${pname} unterscheiden sich die Bauprojekte von Straße zu Straße. Wir kennen die lokalen Gegebenheiten und passen unsere Leistungen genau darauf an.`,
  ]
  // Custom-Finder: JEDER stadtspezifische Intro-Absatz wird ersetzt
  // (garten hat 2: „In Witten legen…" + „Von 96.000 Einwohnern…")
  {
    const introPoolD = [
      ...lokalIntroD,
      `In ${pname} legen die Menschen Wert auf gepflegte Außenanlagen — ob Reihenhaus-Garten oder großzügiges Grundstück. ${kreisPhrase} verbindet urbane Mitte mit ruhigen Randlagen. Wir gestalten Gärten, die zu dieser Vielfalt passen.`,
      `Jedes Grundstück in ${pname} ist anders — und genau das macht unsere Arbeit aus. Vom kompakten Stadtgarten bis zur großen Außenanlage in der Randlage: Wir kennen die lokalen Bedingungen. ${climate}`,
    ]
    const introPoolNoD = [
      ...lokalIntroNoD,
      `In ${pname} legen die Menschen Wert auf gepflegte Außenanlagen — ob Reihenhaus-Garten oder großzügiges Grundstück. Wir gestalten Gärten, die zur Region passen.`,
      `Jedes Grundstück in ${pname} ist anders — und genau das macht unsere Arbeit aus. Vom kompakten Stadtgarten bis zur großen Außenanlage: Wir kennen die lokalen Bedingungen. ${climate}`,
    ]
    const introRe = /<p class="text-lg[^"]*"[^>]*>((?:(?!<\/p>)[\s\S])*)<\/p>/g
    let m, introIdx = 0
    const parts = []
    let lastEnd = 0
    while ((m = introRe.exec(out)) !== null) {
      if (!/(Einwohnern|Edelstahlstadt|Mischbestand|geprägt durch|legt die Menschen Wert)/.test(m[1])) continue
      parts.push(out.slice(lastEnd, m.index))
      const cls = m[0].match(/<p class="([^"]*)"/)[1]
      const pool = D ? introPoolD : introPoolNoD
      parts.push(`<p class="${cls}">${pool[introIdx % pool.length]}</p>`)
      introIdx++
      lastEnd = m.index + m[0].length
    }
    if (introIdx === 0) throw new Error(`[city-gen] lokal-intro in ${trade.key} nicht gefunden`)
    parts.push(out.slice(lastEnd))
    out = parts.join('')
    count += introIdx
  }

  // 3b) Service-Karten: „Witten an der Ruhr" → „Witten" (Garten-Templates)
  if (out.includes('Witten an der Ruhr')) {
    out = out.split('Witten an der Ruhr').join('Witten')
    count++
  }

  // 4) LOKAL-Para2 ("Mit rund … gehört …") — alle Templates
  const areaList = D ? D.slice(0, 5).join(', ') : `${pname} und Umgebung`
  const lokalPara2 = popOk
    ? `Mit rund ${pop} Einwohnern gehört ${pname} zu ${profile.state} — einer Region, in der die Ansprüche an moderne ${tradeWord}-Leistungen stetig wachsen. Unsere Einsatzgebiete decken ${D ? 'alle Stadtteile ab: <strong class="text-ink-900">' + areaList + '</strong>' : profile.name + ' und die gesamte Umgebung ab'}.`
    : `${pname} gehört zu ${profile.state} — einer Region, in der die Ansprüche an moderne ${tradeWord}-Leistungen stetig wachsen. Unsere Einsatzgebiete decken ${D ? 'alle Stadtteile ab: <strong class="text-ink-900">' + areaList + '</strong>' : profile.name + ' und die gesamte Umgebung ab'}.`
  replaceOnce(
    /<p[^>]*>[\s\S]*?Einwohnern gehört[\s\S]*?<\/p>/,
    `<p>${lokalPara2}</p>`,
    'lokal-para2'
  )

  // 5) Stadtteil-Chips (3 Slots): ganzen Chip-Block ersetzen
  let chipCount = 0
  const chipRegex = /<div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">[A-Z]<\/div>\s*<div>\s*<h3 class="font-bold text-ink-900">(Herbede|Mitte|Bommern|Rüdinghausen|Annen)<\/h3>\s*<p class="text-sm text-ink-600">[^<]*<\/p>/g
  out = out.replace(chipRegex, (m) => {
    const name = D ? D[chipCount % D.length] : ['Zentrum & Kernstadt', 'Neubaugebiete am Rand', 'Ruhige Randlagen'][chipCount]
    const desc = CHIP_DESCS[(seed + chipCount) % CHIP_DESCS.length]
    chipCount++
    return `<div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">${name[0]}</div><div><h3 class="font-bold text-ink-900">${name}</h3><p class="text-sm text-ink-600">${desc}</p>`
  })
  if (chipCount === 0) throw new Error(`[city-gen] keine Stadtteil-Chips in ${trade.key} gefunden`)
  count++

  // 6) Projekte: Template-Distrikt-Namen in Titeln swappen
  const districtsUsed = TEMPLATE_DISTRICTS.filter(t => out.includes(' in ' + t) || out.includes('in ' + t))
  if (districtsUsed.length) {
    let pi = 0
    for (const td of districtsUsed) {
      const target = D ? D[pi % D.length] : profile.name
      out = out.split(td).join('§§D' + pi + '§§')
      pi++
    }
    for (let i = 0; i < pi; i++) {
      out = out.split(`§§D${i}§§`).join(D ? D[i % D.length] : profile.name)
    }
    count++
  }

  // 7) Profi-Tipps — Trigger „…-Tipps für “ deckt Dach-Profi-Tipps,
  //    Maler-Tipps, Elektro-Tipps etc. ab (NICHT nur „-Profi-Tipps“!)
  if (new RegExp(`-Tipps für `).test(out)) {
    const nTeile = D ? D.length : 'viele'
    const spanSentence = D
      ? `Von ${D[0]} über ${D[D.length > 2 ? 1 : 0]} bis ${D[D.length - 1]}: Jeder Stadtteil verlangt ein eigenes Konzept.`
      : `Vom Zentrum bis in die Randlagen: Jede Lage in ${pname} verlangt ein eigenes Konzept.`
    const tips = [
      climate,
      popOk
        ? `${pname}: rund ${pop} Einwohner, ${nTeile === 'viele' ? 'zahlreiche Ortsteile' : nTeile + ' Stadtteile'} — und jedes Gebäude mit eigenen Anforderungen.`
        : `${pname}: jedes Gebäude mit eigenen Anforderungen — vom Altbau in der Mitte bis zum Neubau am Rand.`,
      spanSentence,
    ]
    replaceOnce(
      /<div class="space-y-4 text-ink-600 leading-relaxed">((?:(?!<\/div>)[\s\S])*)<\/div>/,
      `<div class="space-y-4 text-ink-600 leading-relaxed">${tips.map(t => `<p>${t}</p>`).join('')}</div>`,
      'tips-body',
      { required: false }
    )
  }

  // 8) Witten-Regions-Sweep: Fluss-/Kreis-Reste aus allen Templates entfernen
  //    (v.a. garten: „Ruhrdeich", „nahe der Ruhr", Footer-Metadaten)
  const regionSwaps = [
    ['Ruhrdeich', profile.name],
    ['nahe der Ruhr', 'nahe des Wassers'],
    ['an der Ruhr', 'am Wasser'],
    ['Ruhr jetzt teilen', 'jetzt teilen'],
    [' – Ruhrgebiet, zwischen Bochum und Gelsenkirchen', ` – ${profile.state || 'Ihre Region'}`],
  ]
  for (const [from, to] of regionSwaps) {
    if (out.includes(from)) { out = out.split(from).join(to); count++ }
  }

  return { html: out, regionsReplaced: count }
}

// ─── Stadt-Datei bauen ───────────────────────────────────────────
function buildStadtFile(templateHtml, profile, trade) {
  // Stadtteile: voller Name mit Parent-Kontext für SEO ("Hörde (Dortmund)")
  const cityCap = profile.isDistrict ? (profile.displayName || profile.name) : profile.name
  let html = templateHtml

  const { html: regen } = generateUniqueRegions(html, profile, trade)
  html = regen

  // Fußzeile: Kreis-Phrase → aktuelles Profil (Stadtteile: Parent-Stadt)
  const kreisPhrase = profile.kreis ? `${profile.kreis}, ${profile.state}` : (profile.state || profile.parentName || '')
  html = html.split('Ennepe-Ruhr-Kreis, an der Ruhr').join(kreisPhrase)
  // Auch bare „Ennepe-Ruhr-Kreis“-Reste (z.B. im <title>) ersetzen
  html = html.split('Ennepe-Ruhr-Kreis').join(kreisPhrase)

  // Globale Namens-Swaps (nach Region-Generierung!)
  html = html.split('Witten').join(cityCap)
  html = html.split('witten').join(profile.slug)

  return html
}

// ─── Blog-Dateien ────────────────────────────────────────────────
function buildBlogFiles(templateFiles, profile) {
  // templateFiles: [{name, content}] aus public/blog/{trade}/witten/
  const cap = profile.isDistrict ? (profile.displayName || profile.name) : profile.name
  return templateFiles.map(f => ({
    name: f.name,
    content: f.content
      .split('Witten und dem gesamten Ruhrgebiet').join('Witten und der gesamten Region')
      .split('Witten und dem Ruhrgebiet').join('Witten und der gesamten Region')
      .split('Witten und das gesamte Ruhrgebiet').join('Witten und die gesamte Region')
      .split('Witten liegt im Ruhrgebiet').join('Witten liegt in der Region')
      .split('im Ruhrgebiet').join('in der Region')
      .split('am Ruhrgebiet').join('an der Region')
      .split('Ruhrgebiet').join('Region')
      .split('Witten').join(cap)
      .split('witten').join(profile.slug),
  }))
}

// ─── Salespage-Patch ─────────────────────────────────────────────
function patchSalespage(html, profile, tradeSlug, tradeLabel, tradeKey) {
  const file = SALES_FILES[tradeSlug]
  let out = html
  const nameKey = profile.name.replace(/'/g, "\\'")

  // 1) CITY_SLUGS um Stadt erweitern (idempotent — anhand des Slugs,
  //    damit spätere Anzeigenamen-Änderungen keinen Doppel-Eintrag erzeugen)
  if (!out.includes(`'${profile.slug}':'${profile.slug}'`) && !out.match(new RegExp(`'[^']+':'${profile.slug}'`))) {
    const anchor = 'const CITY_SLUGS = {'
    const idx = out.indexOf(anchor)
    if (idx === -1) throw new Error(`[city-gen] CITY_SLUGS nicht in ${file}`)
    const insAt = out.indexOf('{', idx) + 1
    out = out.slice(0, insAt) + `'${nameKey}':'${profile.slug}',` + out.slice(insAt)
  }

  // 2) Karte einfügen (idempotent via data-city="slug ")
  if (!out.includes(`data-city="${profile.slug} `)) {
    const card = buildCityCard(profile, tradeSlug, tradeLabel)
    // cityGrid-Container finden und Karte vor dessen schließendem </div> einsetzen
    const gridAnchor = 'id="cityGrid"'
    const gi = out.indexOf(gridAnchor)
    if (gi === -1) throw new Error(`[city-gen] cityGrid nicht in ${file}`)
    const gridOpenEnd = out.indexOf('>', gi) + 1
    // Schließen des Grids per Div-Balance finden
    let depth = 1, pos = gridOpenEnd
    while (depth > 0 && pos < out.length) {
      const nextOpen = out.indexOf('<div', pos)
      const nextClose = out.indexOf('</div>', pos)
      if (nextClose === -1) throw new Error(`[city-gen] cityGrid nicht geschlossen in ${file}`)
      if (nextOpen !== -1 && nextOpen < nextClose) { depth++; pos = nextOpen + 4 } else { depth--; pos = nextClose + 6 }
    }
    out = out.slice(0, pos - 6) + card + '\n      ' + out.slice(pos - 6)
  }

  // 3) "20 von 20 Städten frei" → Zähler neu (alle Karten zählen)
  const cardCount = (out.match(/class="city-card /g) || []).length
  out = out.replace(/(\d+) von (\d+) Städten frei/, `${cardCount} von ${cardCount} Städten frei`)

  return { content: out, cityCount: cardCount }
}

function buildCityCard(profile, tradeSlug, tradeLabel) {
  const popTxt = profile.pop ? `~${fmtPop(profile.pop)} Einwohner · ` : ''
  const where = profile.kreis ? `${profile.kreis}, ${profile.state}` : (profile.isDistrict ? `Stadtteil von ${profile.parentName}` : profile.state)
  return `
      <div class="city-card reveal bg-white rounded-2xl border-2 border-green-500/60 p-6 hover:shadow-xl hover:-translate-y-1 transition duration-300" data-region="${profile.state}" data-city="${profile.slug} ${profile.name.toLowerCase()}">
        <div class="flex items-start justify-between">
          <div><h3 class="text-xl font-black text-ink-900">${profile.name}</h3><p class="text-sm text-ink-500 mt-0.5">fachschmiede.de/${tradeSlug}/${profile.slug}/</p></div>
          <span class="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full shrink-0">Frei</span>
        </div>
        <p class="mt-4 text-sm text-ink-600">${popTxt}${where}</p>
        <div class="mt-5 flex gap-2">
          <button onclick="startOnboarding('${profile.name.replace(/'/g, '&#39;')}')" class="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition">Jetzt selbst anmieten →</button>
          <a href="/${tradeSlug}/${profile.slug}/" class="shrink-0 inline-flex items-center px-4 border-2 border-brand-600 text-brand-600 hover:bg-brand-50 font-bold rounded-xl transition" title="Live-Stadtseite ansehen">Live ↗</a>
        </div>
        <p class="mt-3 text-[11px] text-ink-400 text-center">Sofort mieten oder <strong class="text-ink-500">14 Tage kostenlos testen</strong> – du entscheidest im Check-in.</p>
      </div>`
}

// ─── system-config.js Patch ──────────────────────────────────────
function patchSystemConfig(content, profile) {
  if (content.includes(`'${profile.slug}': { name:`)) return { content, added: false }
  const anchor = '// NEUE STÄDTE HIER EINFÜGEN'
  if (!content.includes(anchor)) throw new Error('[city-gen] system-config Anker fehlt')
  const line = `    '${profile.slug}': { name: '${profile.name.replace(/'/g, "\\'")}', region: '${profile.state}', slug: '${profile.slug}' },\n    `
  return { content: content.replace(anchor, line + anchor), added: true }
}

// ─── Sitemap (vollständig neu aus Datei-Scan) ────────────────────
function buildSitemap(staticPages, stadtFiles, baseUrl) {
  const urls = []
  urls.push({ loc: `${baseUrl}/`, pri: '1.0' })
  for (const p of staticPages) {
    if (p === 'index.html' || p === 'admin.html') continue
    if (p === 'impressum.html') urls.push({ loc: `${baseUrl}/impressum`, pri: '0.3' })
    else if (p === 'datenschutz.html') urls.push({ loc: `${baseUrl}/datenschutz`, pri: '0.3' })
    else if (p.endsWith('.html')) urls.push({ loc: `${baseUrl}/${p.replace(/\.html$/, '')}`, pri: '0.6' })
  }
  // stadt-*.html → /{trade}/{city}/
  const TRADE_URL = { dach: 'dachdecker', elek: 'elektriker', zimm: 'zimmerer', maler: 'maler', shk: 'klempner', klempner: 'klempner', garten: 'garten-und-landschaftsbau' }
  for (const f of stadtFiles.sort()) {
    const m = f.match(/^stadt-([a-z]+)-(.+)\.html$/)
    if (!m) continue
    const trade = TRADE_URL[m[1]]
    if (trade) urls.push({ loc: `${baseUrl}/${trade}/${m[2]}/`, pri: '0.8' })
  }
  const body = urls.map(u => `  <url><loc>${u.loc}</loc><priority>${u.pri}</priority><changefreq>weekly</changefreq></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`
}

// ─── Haupt-Einstieg ──────────────────────────────────────────────
/**
 * ctx: {
 *   orteJson (string|array), templateFiles: {'stadt|blog/{trade}/...': content},
 *   salesFiles: {filename: content}, systemConfig: string, staticPages: [..], stadtFiles: [..],
 *   existingSlugs: Set/array (DB), baseUrl
 * }
 * Rückgabe: { files: [{path, content}], db: {cities:[..], landingPages:[..]}, log: [..] }
 */
function generateCity(citySlug, opts, ctx) {
  const bySlug = loadOrtIndex(ctx.orteJson)
  const ort = bySlug[citySlug]
  if (!ort) throw new Error(`[city-gen] Stadt "${citySlug}" nicht in de-orte.json`)
  const profile = resolveProfile(ort, opts)
  const tradesWanted = opts.trades && opts.trades.length ? opts.trades : Object.keys(TRADES)
  const files = []
  const log = []

  // 1) Stadt-Seiten + Blog für jedes Gewerk
  for (const tradeSlug of tradesWanted) {
    const trade = TRADES[tradeSlug]
    if (!trade) throw new Error(`[city-gen] unbekanntes Gewerk: ${tradeSlug}`)
    const pageSlug = `${tradeSlug}-${profile.slug}`
    if (ctx.existingSlugs && ctx.existingSlugs.includes(pageSlug)) {
      log.push(`SKIP ${pageSlug} (existiert bereits)`)
      continue
    }
    const tplKey = `stadt/stadt-${trade.key}-${TEMPLATE_CITY}.html`
    const tpl = ctx.templateFiles[tplKey]
    if (!tpl) throw new Error(`[city-gen} Template fehlt: ${tplKey}`)
    const html = buildStadtFile(tpl, profile, trade)
    files.push({ path: `public/stadt-${trade.key}-${profile.slug}.html`, content: html })
    log.push(`OK stadt-${trade.key}-${profile.slug}.html`)

    // Blog
    const blogPrefix = `blog/${trade.articleDir}/${TEMPLATE_CITY}/`
    const blogTpls = Object.keys(ctx.templateFiles).filter(k => k.startsWith(blogPrefix))
    if (blogTpls.length) {
      const tplFiles = blogTpls.map(k => ({ name: k.slice(blogPrefix.length), content: ctx.templateFiles[k] }))
      for (const bf of buildBlogFiles(tplFiles, profile)) {
        files.push({ path: `public/blog/${trade.articleDir}/${profile.slug}/${bf.name}`, content: bf.content })
      }
      log.push(`OK blog/${trade.articleDir}/${profile.slug}/ (${blogTpls.length} Dateien)`)
    }
  }

  // 2) Salespages (nur für erzeugte Gewerke patchen)
  const salesFiles = {}
  for (const tradeSlug of tradesWanted) {
    const fname = SALES_FILES[tradeSlug]
    if (!fname || salesFiles[fname]) continue
    const cur = ctx.salesFiles[fname]
    if (!cur) throw new Error(`[city-gen] Salespage fehlt: ${fname}`)
    const { content } = patchSalespage(cur, profile, tradeSlug, TRADES[tradeSlug].label, TRADES[tradeSlug].key)
    salesFiles[fname] = content
    log.push(`OK ${fname} gepatcht`)
  }
  for (const [fname, content] of Object.entries(salesFiles)) {
    files.push({ path: `public/${fname}`, content })
  }

  // 3) system-config.js
  const cfg = patchSystemConfig(ctx.systemConfig, profile)
  if (cfg.added) {
    files.push({ path: 'config/system-config.js', content: cfg.content })
    log.push(`OK system-config.js (+${profile.slug})`)
  }

  // 3b) article-index.json: Witten-Einträge pro Gewerk klonen + umtaufen
  if (ctx.articleIndex) {
    const ix = typeof ctx.articleIndex === 'string' ? JSON.parse(ctx.articleIndex) : ctx.articleIndex
    let ixChanged = false
    for (const tradeSlug of tradesWanted) {
      const trade = TRADES[tradeSlug]
      if (!ix[trade.articleDir]) continue
      if (ix[trade.articleDir][profile.slug]) continue // idempotent
      const tpl = ix[trade.articleDir][TEMPLATE_CITY]
      if (!tpl) continue
      ix[trade.articleDir][profile.slug] = tpl.map(e => ({
        ...e,
        title: e.title.split('Witten').join(profile.name),
        url: e.url.split('/witten/').join(`/${profile.slug}/`),
      }))
      ixChanged = true
      log.push(`OK article-index.json (+${trade.articleDir}/${profile.slug}, ${tpl.length} Artikel)`)
    }
    if (ixChanged) files.push({ path: 'lib/article-index.json', content: JSON.stringify(ix, null, 2) + '\n' })
  }

  // 4) sitemap.xml neu bauen (neue Stadt-Dateien einkalkulieren)
  const newStadtNames = files.filter(f => f.path.startsWith('public/stadt-')).map(f => f.path.replace('public/', ''))
  const allStadt = [...new Set([...(ctx.stadtFiles || []), ...newStadtNames])]
  const sitemap = buildSitemap(ctx.staticPages || [], allStadt, ctx.baseUrl || 'https://www.fachschmiede.de')
  files.push({ path: 'public/sitemap.xml', content: sitemap })
  log.push(`OK sitemap.xml (${allStadt.length} Stadt-URLs)`)

  // 5) DB-Zeilen (Caller führt aus)
  const db = {
    city: { name: profile.displayName, name_short: profile.name, slug: profile.slug, region: profile.state, population: profile.pop, kreis: profile.kreis, is_district: profile.isDistrict, parent_city: profile.parentCity },
    landingPages: tradesWanted
      .filter(t => !ctx.existingSlugs || !ctx.existingSlugs.includes(`${t}-${profile.slug}`))
      .map(t => ({ trade_slug: t, slug: `${t}-${profile.slug}`, title: `${TRADES[t].label} ${profile.name}` })),
  }

  return { files, db, log, profile }
}

module.exports = { generateCity, TRADES, SALES_FILES, resolveProfile, buildStadtFile, patchSalespage }
