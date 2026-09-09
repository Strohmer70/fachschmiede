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
  return SYSTEM_CONFIG.trades[tradeSlug] || null;
}

function getAllTrades() {
  return Object.values(SYSTEM_CONFIG.trades);
}

function getTradeSlugs() {
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
// EXPORT
// ═══════════════════════════════════════════
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SYSTEM_CONFIG,
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
  };
}
