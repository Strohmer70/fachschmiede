// ═══════════════════════════════════════════════════════════════
// FACHSCHMIEDE SYSTEM CONFIG — Single Source of Truth (SSOT)
// ═══════════════════════════════════════════════════════════════
// WIRD VON ALLEM gelesen: Admin, Generator, Blog, API, Frontend
// NIE mehr Hardcodes in einzelnen Dateien!
// ═══════════════════════════════════════════════════════════════

const SYSTEM_CONFIG = {
  version: "2.0.0",
  lastUpdated: "2026-09-09",

  // ═══════════════════════════════════════════
  // GEWERKE — Alle verfügbaren Gewerke
  // ═══════════════════════════════════════════
  trades: {
    dachdecker: {
      id: "dachdecker",
      name: "Dachdecker",
      plural: "Dachdecker",
      slug: "dachdecker",
      urlSlug: "dachdecker",
      emoji: "🏠",
      icon: "🏠",
      color: { 50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#f97316',600:'#ea580c',700:'#c2410c',800:'#9a3412',900:'#7c2d12' },
      images: {
        hero: '/images/hero.jpg',
        team: '/images/team.jpg',
        project: '/images/projekt.jpg',
      },
      services: ['Dachreparatur', 'Dachneueindeckung', 'Dachsanierung', 'Dachfenster', 'Dachrinnen', 'Dachinspektion'],
      keywords: ['Dach', 'Schiefer', 'Ziegel', 'Dachstuhl'],
      painPoints: 'undichte Stellen, Sturmschäden, Alterserscheinungen',
      badgeText: 'Sturmschaden? Wir helfen schnell.',
      ctaPrimary: 'Kostenlose Dach-Inspektion anfragen',
      h1Template: (city) => `Dachdecker in ${city}. Festpreis. Feste Termine.`,
      articleTopics: [
        { slug: 'dachdaemmung-foerderung', title: (c) => `Dachdämmung in ${c}: Kosten, Förderung & Zuschüsse 2026`, tag: 'Ratgeber' },
        { slug: 'sturmschaden-dach', title: (c) => `Sturmschaden am Dach in ${c}: Soforthilfe & Kosten`, tag: 'Ratgeber' },
        { slug: '5-anzeichen-dachsanierung', title: (c) => `5 Anzeichen für nötige Dachsanierung in ${c}`, tag: 'Ratgeber' },
      ],
    },

    elektriker: {
      id: "elektriker",
      name: "Elektriker",
      plural: "Elektriker",
      slug: "elektriker",
      urlSlug: "elektriker",
      emoji: "⚡",
      icon: "⚡",
      color: { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a' },
      images: {
        hero: '/images/hero-elektro.jpg',
        team: '/images/team-elektro.jpg',
        project: '/images/projekt-elektro.jpg',
      },
      services: ['Elektroinstallation', 'Stromausfall-Reparatur', 'Sicherungskasten', 'Smart-Home', 'Elektroprüfung', 'Beleuchtung'],
      keywords: ['Strom', 'Elektro', 'Sicherung', 'Leitung'],
      painPoints: 'häufige Sicherungsauslösungen, veraltete Elektroinstallationen',
      badgeText: 'Stromausfall? Wir sind in 30 Min. da.',
      ctaPrimary: 'Kostenlose Besichtigung anfragen',
      h1Template: (city) => `Elektriker in ${city}. Festpreis. Feste Termine.`,
      articleTopics: [
        { slug: 'e-check-sicherheit', title: (c) => `E-Check in ${c}: Sicherheitsprüfung & Kosten`, tag: 'Ratgeber' },
        { slug: 'wallbox-zuhause', title: (c) => `Wallbox installieren in ${c}: Kosten & Förderung`, tag: 'Ratgeber' },
        { slug: 'smart-home-nachruesten', title: (c) => `Smart Home nachrüsten in ${c}: Systeme & Kosten`, tag: 'Ratgeber' },
      ],
    },

    klempner: {
      id: "klempner",
      name: "Klempner / SHK",
      plural: "Klempner",
      slug: "klempner",
      urlSlug: "klempner",
      emoji: "🔥",
      icon: "🔥",
      color: { 50:'#f0fdfa',100:'#ccfbf1',200:'#99f6e4',300:'#5eead4',400:'#2dd4bf',500:'#14b8a6',600:'#0d9488',700:'#0f766e',800:'#115e59',900:'#134e4a' },
      images: {
        hero: '/images/hero-shk.jpg',
        team: '/images/team-shk.jpg',
        project: '/images/projekt-shk.jpg',
      },
      services: ['Rohrreinigung', 'Heizungsinstallation', 'Badmodernisierung', 'Wasserschaden', 'Toiletten-Installation', '24h Notdienst'],
      keywords: ['Wasser', 'Rohr', 'Heizung', 'Abfluss'],
      painPoints: 'verstopfte Abflüsse, undichte Rohre, kalte Heizkörper',
      badgeText: 'Wasserschaden? Schnelle Hilfe garantiert.',
      ctaPrimary: 'Kostenlose Besichtigung anfragen',
      h1Template: (city) => `Klempner in ${city}. Festpreis. Feste Termine.`,
      articleTopics: [
        { slug: 'rohrreinigung-notdienst', title: (c) => `Rohrreinigung in ${c}: Notdienst & Kosten`, tag: 'Ratgeber' },
        { slug: 'heizung-tauschen', title: (c) => `Heizung tauschen in ${c}: Kosten & Förderung`, tag: 'Ratgeber' },
        { slug: 'wasserschaden-sanierung', title: (c) => `Wasserschaden in ${c}: Schnelle Hilfe & Kosten`, tag: 'Ratgeber' },
      ],
    },

    zimmerer: {
      id: "zimmerer",
      name: "Zimmerer",
      plural: "Zimmerer",
      slug: "zimmerer",
      urlSlug: "zimmerer",
      emoji: "🔨",
      icon: "🔨",
      color: { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#92400e',900:'#78350f' },
      images: {
        hero: '/images/hero-zimmerer.jpg',
        team: '/images/team-zimmerer.jpg',
        project: '/images/projekt-zimmerer.jpg',
      },
      services: ['Dachstuhl', 'Carport', 'Holzbau', 'Holzterrasse', 'Gartenhaus', 'Innenausbau'],
      keywords: ['Holz', 'Zimmerei', 'Dachstuhl', 'Carport'],
      painPoints: 'morsche Balken, undichte Dachstühle, fehlende Carports',
      badgeText: 'Holzschaden? Wir beraten kostenlos.',
      ctaPrimary: 'Kostenlose Besichtigung anfragen',
      h1Template: (city) => `Zimmerer in ${city}. Festpreis. Termintreue.`,
      articleTopics: [
        { slug: 'carport-bauen', title: (c) => `Carport bauen in ${c}: Kosten & Genehmigung`, tag: 'Ratgeber' },
        { slug: 'dachstuhl-sanierung', title: (c) => `Dachstuhl sanieren in ${c}: Kosten & Förderung`, tag: 'Ratgeber' },
        { slug: 'holzterrasse-anlegen', title: (c) => `Holzterrasse in ${c}: Kosten & Pflege`, tag: 'Ratgeber' },
      ],
    },

    maler: {
      id: "maler",
      name: "Maler",
      plural: "Maler",
      slug: "maler",
      urlSlug: "maler",
      emoji: "🖌️",
      icon: "🖌️",
      color: { 50:'#fff1f2',100:'#ffe4e6',200:'#fecdd3',300:'#fda4af',400:'#fb7185',500:'#f43f5e',600:'#e11d48',700:'#be123c',800:'#9f1239',900:'#881337' },
      images: {
        hero: '/images/hero-maler.jpg',
        team: '/images/team-maler.jpg',
        project: '/images/projekt-maler.jpg',
      },
      services: ['Innenraum-Streicharbeiten', 'Fassadenanstrich', 'Tapezierarbeiten', 'Lackierarbeiten', 'Bodengestaltung', 'Farberatung'],
      keywords: ['Farbe', 'Lack', 'Tapete', 'Fassade'],
      painPoints: 'abblätternde Farbe, Schimmel, veraltete Tapeten',
      badgeText: 'Renovierung geplant? Wir beraten kostenlos.',
      ctaPrimary: 'Kostenlose Farbberatung anfragen',
      h1Template: (city) => `Maler in ${city}. Sauber. Farbecht. Festpreis.`,
      articleTopics: [
        { slug: 'fassade-streichen', title: (c) => `Fassade streichen in ${c}: Kosten & Farbauswahl`, tag: 'Ratgeber' },
        { slug: 'tapezieren-techniken', title: (c) => `Tapezieren in ${c}: Techniken & Kosten`, tag: 'Ratgeber' },
        { slug: 'schimmel-entfernen', title: (c) => `Schimmel entfernen in ${c}: Ursachen & Kosten`, tag: 'Ratgeber' },
      ],
    },

    gartenbau: {
      id: "gartenbau",
      name: "Garten & Landschaftsbau",
      plural: "Garten und Landschaftsbau",
      slug: "garten-und-landschaftsbau",
      urlSlug: "garten-und-landschaftsbau",
      emoji: "🌳",
      icon: "🌳",
      color: { 50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',300:'#86efac',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d',800:'#166534',900:'#14532d' },
      images: {
        hero: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1920&q=80',
        team: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&q=80',
        project: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80',
      },
      services: ['Gartengestaltung', 'Rasenanlage', 'Heckenschnitt', 'Baumpflege', 'Gartenpflege', 'Terrassenbau'],
      keywords: ['Garten', 'Rasen', 'Hecke', 'Baum', 'Terrasse'],
      painPoints: 'unkrautüberwucherte Beete, kahle Stellen im Rasen, überwucherte Hecken',
      badgeText: 'Gartenprojekt? Wir beraten kostenlos.',
      ctaPrimary: 'Kostenlose Gartenberatung anfragen',
      h1Template: (city) => `Gartenbau in ${city}. Ihr Traumgarten. Unsere Leidenschaft.`,
      articleTopics: [
        { slug: 'gartenplanung-ideen', title: (c) => `Gartenplanung in ${c}: Ideen & Kosten`, tag: 'Ratgeber' },
        { slug: 'rasen-neuanlage', title: (c) => `Rasen neu anlegen in ${c}: Kosten & Pflege`, tag: 'Ratgeber' },
        { slug: 'terrasse-bauen', title: (c) => `Terrasse bauen in ${c}: Materialien & Kosten`, tag: 'Ratgeber' },
      ],
    },
  },

  // ═══════════════════════════════════════════
  // STÄDTE — Alle verfügbaren Städte
  // ═══════════════════════════════════════════
  cities: {
    'bergkamen': { name: 'Bergkamen', region: 'Nordrhein-Westfalen', slug: 'bergkamen' },
    'bochum': { name: 'Bochum', region: 'Nordrhein-Westfalen', slug: 'bochum' },
    'castrop-rauxel': { name: 'Castrop-Rauxel', region: 'Nordrhein-Westfalen', slug: 'castrop-rauxel' },
    'dortmund': { name: 'Dortmund', region: 'Nordrhein-Westfalen', slug: 'dortmund' },
    'ennepetal': { name: 'Ennepetal', region: 'Nordrhein-Westfalen', slug: 'ennepetal' },
    'froendenberg': { name: 'Fröndenberg', region: 'Nordrhein-Westfalen', slug: 'froendenberg' },
    'gevelsberg': { name: 'Gevelsberg', region: 'Nordrhein-Westfalen', slug: 'gevelsberg' },
    'hagen': { name: 'Hagen', region: 'Nordrhein-Westfalen', slug: 'hagen' },
    'hattingen': { name: 'Hattingen', region: 'Nordrhein-Westfalen', slug: 'hattingen' },
    'herne': { name: 'Herne', region: 'Nordrhein-Westfalen', slug: 'herne' },
    'holzwickede': { name: 'Holzwickede', region: 'Nordrhein-Westfalen', slug: 'holzwickede' },
    'iserlohn': { name: 'Iserlohn', region: 'Nordrhein-Westfalen', slug: 'iserlohn' },
    'kamen': { name: 'Kamen', region: 'Nordrhein-Westfalen', slug: 'kamen' },
    'luenen': { name: 'Lünen', region: 'Nordrhein-Westfalen', slug: 'luenen' },
    'schwelm': { name: 'Schwelm', region: 'Nordrhein-Westfalen', slug: 'schwelm' },
    'schwerte': { name: 'Schwerte', region: 'Nordrhein-Westfalen', slug: 'schwerte' },
    'sprockhoevel': { name: 'Sprockhövel', region: 'Nordrhein-Westfalen', slug: 'sprockhoevel' },
    'unna': { name: 'Unna', region: 'Nordrhein-Westfalen', slug: 'unna' },
    'wetter-ruhr': { name: 'Wetter (Ruhr)', region: 'Nordrhein-Westfalen', slug: 'wetter-ruhr' },
    'witten': { name: 'Witten', region: 'Nordrhein-Westfalen', slug: 'witten' },
        'ruenthe': { name: 'Rünthe', region: 'Nordrhein-Westfalen', slug: 'ruenthe' },
    // NEUE STÄDTE HIER EINFÜGEN
  },

  // ═══════════════════════════════════════════
  // SYSTEM-EINSTELLUNGEN
  // ═══════════════════════════════════════════
  settings: {
    defaultRegion: 'Nordrhein-Westfalen',
    defaultLanguage: 'de',
    articlesPerTradeCity: 3,
    monthlyArticleGeneration: {
      free: 1,
      basis: 2,
      pro: 4,
    },
    prices: {
      monthlyBase: 18900, // in Cent
      monthlyPro: 34900,  // in Cent
    }
  }
};

// ═══════════════════════════════════════════
// HILFSFUNKTIONEN — Werden von ALLEN Modulen genutzt
// ═══════════════════════════════════════════

function getTrade(tradeSlug) {
  // Findet Gewerk per Key ('gartenbau') ODER Slug ('garten-und-landschaftsbau')
  return SYSTEM_CONFIG.trades[tradeSlug] 
    || Object.values(SYSTEM_CONFIG.trades).find(t => t.slug === tradeSlug)
    || null;
}

function getAllTrades() {
  return Object.values(SYSTEM_CONFIG.trades);
}

function getTradeSlugs() {
  // Gibt Config-Keys zurück (= Verzeichnisnamen, z.B. 'gartenbau')
  // NICHT trade.slug — das ist der URL-Slug (z.B. 'garten-und-landschaftsbau')
  return Object.keys(SYSTEM_CONFIG.trades);
}

function getCity(citySlug) {
  return SYSTEM_CONFIG.cities[citySlug] || null;
}

function getAllCities() {
  return Object.values(SYSTEM_CONFIG.cities);
}

function getCitySlugs() {
  return Object.keys(SYSTEM_CONFIG.cities);
}

function getAllCombinations() {
  const combos = [];
  for (const tradeSlug of getTradeSlugs()) {
    for (const citySlug of getCitySlugs()) {
      combos.push({ tradeSlug, citySlug });
    }
  }
  return combos;
}

function getTotalPossiblePages() {
  return getTradeSlugs().length * getCitySlugs().length;
}

function getTradeEmoji(tradeSlug) {
  const trade = getTrade(tradeSlug);
  return trade ? trade.emoji : '🏗️';
}

function getTradeName(tradeSlug) {
  const trade = getTrade(tradeSlug);
  return trade ? trade.name : tradeSlug;
}

function getCityName(citySlug) {
  const city = getCity(citySlug);
  return city ? city.name : citySlug;
}

function getArticleTopics(tradeSlug) {
  const trade = getTrade(tradeSlug);
  return trade ? trade.articleTopics : [];
}

// ═══════════════════════════════════════════
// SEITEN-MODULE & LEISTUNGSKARTEN (Mieter-Dashboard → Mietseite)
// 2026-10-01: Module-Toggles verdrahtet. SSOT für available_services
// je Gewerk. Label = exakter h3-Text der Leistungskarte auf den
// stadt-*.html Seiten (applyRental matcht darüber). Nicht ändern ohne
// Seiten-Regeneration oder Batch-Patch!
// ═══════════════════════════════════════════
const PAGE_MODULES = [
  { key: 'notdienst_banner', label: 'Notdienst-Modul', desc: 'Banner „Sturmschaden? Wir helfen schnell." + 24h-Hinweis' },
  { key: 'bewertungen',    label: 'Bewertungen anzeigen', desc: 'Kundenstimmen-Sektion (freigegebene Bewertungen)' },
  { key: 'blog',           label: 'Blog / Ratgeber', desc: 'Artikel aus der Redaktion, automatisch gepflegt' },
  { key: 'faq',            label: 'FAQ-Bereich', desc: 'Häufige Fragen – gut für Google (Rich Snippets)' },
  { key: 'kennzahlen',     label: 'Kennzahlen-Leiste', desc: 'Nur sinnvoll, wenn „Erfahrung & Qualifikationen" aktiv sind' },
];

const PAGE_SERVICES = {
  "dachdecker": [
    { emoji: "🏠", label: "Dachsanierung", desc: "Komplettsanierung vom Sparren bis zum Ziegel – inklusive Unterspannbahn, Lattung und Eindeckung. Auf Wunsch direkt mit Dämmung und Solar-Vorbereitung." },
    { emoji: "🔧", label: "Dachreparatur", desc: "Lose Ziegel, undichte Kehlen, defekte Rinnen: Wir beheben Schäden schnell und dauerhaft – inklusive Ursachenanalyse statt Kosmetik." },
    { emoji: "🌡️", label: "Dachdämmung", desc: "Auf-, Zwischen- oder Untersparrendämmung nach EnEV/GEG. Wir beraten zu Förderung und bringen Ihr Dach auf heutigen Energiestandard." },
    { emoji: "▭", label: "Flachdach", desc: "Abdichtung und Sanierung von Flachdächern – Garage, Anbau oder Gewerbehalle. Mit mehrschichtiger Sicherung und langer Gewährleistung." },
    { emoji: "☀️", label: "Solar-Vorbereitung", desc: "Wir machen Ihr Dach fit für Photovoltaik: tragfähige Konstruktion, Dachhaken, Leerrohre – sauber abgestimmt mit dem Solarteur." },
    { emoji: "⚠️", label: "Sturm- & Notdienst", desc: "Sturmschaden? Wir sichern schnell ab, dokumentieren für die Versicherung und reparieren zuverlässig – auch am Wochenende erreichbar." },
  ],
  "elektriker": [
    { emoji: "⚡", label: "Elektroinstallation", desc: "Neuinstallation, Erweiterung und Modernisierung – von der Leitung bis zum Schalterprogramm. Sauber geplant, normgerecht ausgeführt." },
    { emoji: "✅", label: "E-Check & Prüfung", desc: "Sicherheitsprüfung Ihrer Elektroanlage mit Prüfprotokoll – für Eigentümer, Käufer und Vermieter. Inklusive Mängelliste mit klaren Prioritäten." },
    { emoji: "🚗", label: "Wallbox & E-Mobilität", desc: "Wallbox planen, anmelden, installieren: Wir kümmern uns um Anschlussleistung, Zählerschrank und Netzbetreiber – bis zum ersten Ladevorgang." },
    { emoji: "🏠", label: "Smart Home", desc: "Licht, Heizung, Rollladen intelligent steuern – funk- oder busbasiert, auch im Bestand ohne große Umbauten nachrüstbar." },
    { emoji: "☀️", label: "Photovoltaik", desc: "PV-Anlage mit Speicher und Wallbox aus einer Hand: Ertragsrechnung, Montage, Anmeldung beim Netzbetreiber, Inbetriebnahme." },
    { emoji: "🛠️", label: "Störung & Reparatur", desc: "Sicherung fliegt raus, Steckdose tot, FI löst aus? Wir finden die Ursache und beheben sie – im Notdienst auch kurzfristig." },
  ],
  "klempner": [
    { emoji: "🚿", label: "Badsanierung & Sanitär", desc: "Komplettbad, Gäste-WC oder barrierefreies Bad: Wir sanieren von der Planung bis zur letzten Fuge – inklusive Fliesen, Elektrik-Anschluss und Trockenbau aus einer Hand." },
    { emoji: "🔥", label: "Heizung & Wärmepumpe", desc: "Heizungstausch nach GEG, Wärmepumpe, Hybridanlage oder Gas-Brennwert: Wir rechnen ehrlich nach, was sich für Ihr Haus lohnt – mit Förderberatung und hydraulischem Abgleich." },
    { emoji: "💧", label: "Rohr & Leitung", desc: "Strangsanierung, Leckortung, Trinkwasserhygiene: Wir erneuern alte Leitungen sauber und staubarm – mit Kamerainspektion und dokumentierter Druckprüfung." },
    { emoji: "🧰", label: "Wartung & Service", desc: "Heizungswartung, Thermen-Check, Wartungsvertrag: Regelmäßig gewartete Anlagen verbrauchen weniger und fallen seltener aus. Wir erinnern Sie automatisch an den Termin." },
    { emoji: "🌡️", label: "Klima & Lüftung", desc: "Split-Klimageräte und kontrollierte Wohnraumlüftung: kühle Schlafzimmer im Sommer, frische Luft ohne Zug im Winter – sauber geplant und leise installiert." },
    { emoji: "⚠️", label: "Klempner-Notdienst", desc: "Rohrbruch, verstopfter Abfluss, Heizungsausfall: Unser Notdienst sichert schnell ab, ortet die Ursache und dokumentiert alles für die Versicherung – auch am Wochenende." },
  ],
  "maler": [
    { emoji: "🖌️", label: "Innenanstrich & Wände", desc: "Wände und Decken in Wohnung, Haus oder Büro: sauber abgeklebt, eben gespachtelt und mit hochwertigen, emissionsarmen Farben gestrichen." },
    { emoji: "🏢", label: "Fassade & Außenanstrich", desc: "Fassadenanstrich inklusive Untergrundsanierung, Rissverpressung und Gerüststellung: für ein frisches Erscheinungsbild und dauerhaften Wetterschutz." },
    { emoji: "🧻", label: "Tapezieren & Wandgestaltung", desc: "Raufaser, Vlies oder Mustertapete, dazu Akzentwände und dekorative Techniken: Wir bringen Struktur und Farbe in Ihre Räume." },
    { emoji: "🚪", label: "Lackieren & Holzschutz", desc: "Türen, Fenster, Treppen und Heizkörper: fachgerecht geschliffen, grundiert und lackiert – für Oberflächen, die tägliche Belastung aushalten." },
    { emoji: "💧", label: "Schimmel & Sanierung", desc: "Ursachenanalyse statt Überstreichen: Wir sanieren Schimmel nachhaltig, mit mineralischen Beschichtungen und Beratung zu Lüftung und Bautrocknung." },
    { emoji: "🏗️", label: "Boden & Beschichtung", desc: "Bodenbeschichtungen für Keller, Garage und Werkstatt, dazu Spachtel- und Füllarbeiten: robuste Oberflächen für stark genutzte Bereiche." },
  ],
  "zimmerer": [
    { emoji: "🏠", label: "Dachstuhl & Holzbau", desc: "Neuer Dachstuhl, Aufstockung oder Anbau in Holzrahmenbauweise: Wir planen und bauen tragende Holzkonstruktionen – inklusive Statik-Abstimmung und auf Wunsch Eindeckung im Verbund." },
    { emoji: "🚗", label: "Carport & Überdachung", desc: "Carport, Terrassenüberdachung oder Vordach: maßgefertigt aus heimischem Holz – wir kümmern uns um Statik, Fundamente und auf Wunsch die Genehmigungsunterlagen." },
    { emoji: "🌿", label: "Terrasse & Balkon", desc: "Holzterrasse aus Lärche oder Bangkirai, Balkonsanierung, Sichtschutz: langlebig gebaut mit verdeckter Befestigung und fachgerechter Unterkonstruktion." },
    { emoji: "🧱", label: "Innenausbau & Trockenbau", desc: "Dachausbau, Trennwände, abgehängte Decken und Trockenbau: Wir machen aus Rohbauten und ungenutzten Dächern Wohnraum – inklusive Dämmung und Abstimmung mit den Nachbargewerken." },
    { emoji: "🏛️", label: "Sanierung & Denkmal", desc: "Fachwerksanierung, Balkenköpfe, Holzbalkendecken: behutsam instand gesetzt nach den Regeln der Denkmalpflege – in Abstimmung mit den Behörden." },
    { emoji: "🛡️", label: "Holzschutz & Wartung", desc: "Holzschädlinge, Hausschwamm, Witterungsschutz: Wir untersuchen, sanieren und schützen Ihr Holzwerk dauerhaft – mit dokumentierter Beweissicherung." },
  ],
  "garten-und-landschaftsbau": [
    { emoji: "🌳", label: "Gartengestaltung", desc: "Gartengestaltung für Castrop-Rauxels Bestandsgärten. Behutsame Modernisierung, Bewahrung historischer Elemente und sensible Ergänzung." },
    { emoji: "✂️", label: "Baumfällung & Pflege", desc: "Baumpflege in Castrop-Rauxel. Pflege alter Obstbäume in Ickern und Habinghorst — mit Respekt vor dem Bestand." },
    { emoji: "🌱", label: "Rasen & Bepflanzung", desc: "Traditionelle Bepflanzung für Castrop-Rauxel. Bauerngärten, Kräuterbeete und Blutbuchenhecken — passend zum Charakter der Altstadt." },
    { emoji: "💧", label: "Teichbau & Bewässerung", desc: "Bewässerung für Castrop-Rauxels traditionelle Gärten. Diskrete Systeme, die nicht stören — aber wirken. In Rauxel und Deininghausen." },
    { emoji: "🏡", label: "Gartenpflege & Unterhalt", desc: "Gartenpflege für Castrop-Rauxel. Alte Hecken schneiden, Wege pflegen, Bestandspflanzen erhalten — in Münsterwiesche und Schwerin." },
    { emoji: "🍂", label: "Herbst- & Winterdienst", desc: "Winterdienst für Castrop-Rauxel. Laub kompostieren, Blutbuchenhecken schneiden, Boden pflegen — in Frohlinde und Henrichenburg." },
  ],
};

// DB-Slug (landing_pages.slug) → Gewerk-Key für PAGE_SERVICES
function getTradeKeyFromPageSlug(pageSlug) {
  if (!pageSlug) return null;
  const first = String(pageSlug).split('-')[0];
  if (first === 'garten') return 'garten-und-landschaftsbau';
  if (PAGE_SERVICES[first]) return first;
  return null;
}

function getPageServices(pageSlug) {
  const key = getTradeKeyFromPageSlug(pageSlug);
  return key ? PAGE_SERVICES[key] : [];
}

// ═══════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SYSTEM_CONFIG,
    PAGE_MODULES,
    PAGE_SERVICES,
    getTrade,
    getAllTrades,
    getTradeSlugs,
    getCity,
    getAllCities,
    getCitySlugs,
    getAllCombinations,
    getTotalPossiblePages,
    getTradeEmoji,
    getTradeName,
    getCityName,
    getArticleTopics,
    getPageServices,
    getTradeKeyFromPageSlug,
  };
}
