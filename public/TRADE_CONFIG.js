// ═══════════════════════════════════════════════════════════════
// GEWERK-KONFIGURATION — Zentrale Quelle der Wahrheit
// ═══════════════════════════════════════════════════════════════
// JEDES neue Gewerk wird HIER definiert. Der Generator liest
// diese Config und erstellt automatisch alle Seiten, Bilder,
// Farben, Texte — konsistent für Stadtseiten + Salespage + Admin.
// ═══════════════════════════════════════════════════════════════

const TRADE_CONFIG = {
  // ── Dachdecker (Referenz-Gewerk) ──
  dachdecker: {
    name: 'Dachdecker',
    plural: 'Dachdecker',
    slug: 'dachdecker',
    color: { 50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#f97316',600:'#ea580c',700:'#c2410c',800:'#9a3412',900:'#7c2d12' },
    images: {
      hero: '/images/hero.jpg',
      team: '/images/team.jpg',
      project: '/images/projekt.jpg',
    },
    icon: '🏠',
    emoji: '🏠',
    services: ['Dachreparatur', 'Dachneueindeckung', 'Dachsanierung', 'Dachfenster', 'Dachrinnen', 'Dachinspektion'],
    keywords: ['Dach', 'Schiefer', 'Ziegel', 'Dachstuhl'],
    painPoints: 'undichte Stellen, Sturmschäden, Alterserscheinungen',
    badgeText: 'Sturmschaden? Wir helfen schnell.',
    ctaPrimary: 'Kostenlose Dach-Inspektion anfragen',
    h1Template: (city) => `Dachdecker in ${city}. Festpreis. Feste Termine.`,
  },

  // ── Elektriker ──
  elektriker: {
    name: 'Elektriker',
    plural: 'Elektriker',
    slug: 'elektriker',
    color: { 50:'#eff6ff',100:'#dbeafe',200:'#bfdbfe',300:'#93c5fd',400:'#60a5fa',500:'#3b82f6',600:'#2563eb',700:'#1d4ed8',800:'#1e40af',900:'#1e3a8a' },
    images: {
      hero: '/images/hero-elektro.jpg',
      team: '/images/team-elektro.jpg',
      project: '/images/projekt-elektro.jpg',
    },
    icon: '⚡',
    emoji: '⚡',
    services: ['Elektroinstallation', 'Stromausfall-Reparatur', 'Sicherungskasten', 'Smart-Home', 'Elektroprüfung', 'Beleuchtung'],
    keywords: ['Strom', 'Elektro', 'Sicherung', 'Leitung'],
    painPoints: 'häufige Sicherungsauslösungen, veraltete Elektroinstallationen',
    badgeText: 'Stromausfall? Wir sind in 30 Min. da.',
    ctaPrimary: 'Kostenlose Besichtigung anfragen',
    h1Template: (city) => `Elektriker in ${city}. Festpreis. Feste Termine.`,
  },

  // ── Klempner / SHK ──
  klempner: {
    name: 'Klempner / SHK',
    plural: 'Klempner',
    slug: 'klempner',
    color: { 50:'#f0fdfa',100:'#ccfbf1',200:'#99f6e4',300:'#5eead4',400:'#2dd4bf',500:'#14b8a6',600:'#0d9488',700:'#0f766e',800:'#115e59',900:'#134e4a' },
    images: {
      hero: '/images/hero-shk.jpg',
      team: '/images/team-shk.jpg',
      project: '/images/projekt-shk.jpg',
    },
    icon: '🔥',
    emoji: '🔥',
    services: ['Rohrreinigung', 'Heizungsinstallation', 'Badmodernisierung', 'Wasserschaden', 'Toiletten-Installation', '24h Notdienst'],
    keywords: ['Wasser', 'Rohr', 'Heizung', 'Abfluss'],
    painPoints: 'verstopfte Abflüsse, undichte Rohre, kalte Heizkörper',
    badgeText: 'Wasserschaden? Schnelle Hilfe garantiert.',
    ctaPrimary: 'Kostenlose Besichtigung anfragen',
    h1Template: (city) => `Klempner in ${city}. Festpreis. Feste Termine.`,
  },

  // ── Zimmerer ──
  zimmerer: {
    name: 'Zimmerer',
    plural: 'Zimmerer',
    slug: 'zimmerer',
    color: { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#92400e',900:'#78350f' },
    images: {
      hero: '/images/hero-zimmerer.jpg',
      team: '/images/team-zimmerer.jpg',
      project: '/images/projekt-zimmerer.jpg',
    },
    icon: '🔨',
    emoji: '🔨',
    services: ['Dachstuhl', 'Carport', 'Holzbau', 'Holzterrasse', 'Gartenhaus', 'Innenausbau'],
    keywords: ['Holz', 'Zimmerei', 'Dachstuhl', 'Carport'],
    painPoints: 'morsche Balken, undichte Dachstühle, fehlende Carports',
    badgeText: 'Holzschaden? Wir beraten kostenlos.',
    ctaPrimary: 'Kostenlose Besichtigung anfragen',
    h1Template: (city) => `Zimmerer in ${city}. Festpreis. Termintreue.`,
  },

  // ── Maler ──
  maler: {
    name: 'Maler',
    plural: 'Maler',
    slug: 'maler',
    color: { 50:'#fff1f2',100:'#ffe4e6',200:'#fecdd3',300:'#fda4af',400:'#fb7185',500:'#f43f5e',600:'#e11d48',700:'#be123c',800:'#9f1239',900:'#881337' },
    images: {
      hero: '/images/hero-maler.jpg',
      team: '/images/team-maler.jpg',
      project: '/images/projekt-maler.jpg',
    },
    icon: '🖌️',
    emoji: '🖌️',
    services: ['Innenraum-Streicharbeiten', 'Fassadenanstrich', 'Tapezierarbeiten', 'Lackierarbeiten', 'Bodengestaltung', 'Farberatung'],
    keywords: ['Farbe', 'Lack', 'Tapete', 'Fassade'],
    painPoints: 'abblätternde Farbe, Schimmel, veraltete Tapeten',
    badgeText: 'Renovierung geplant? Wir beraten kostenlos.',
    ctaPrimary: 'Kostenlose Farbberatung anfragen',
    h1Template: (city) => `Maler in ${city}. Sauber. Farbecht. Festpreis.`,
  },

  // ── Garten & Landschaftsbau ──
  'garten-und-landschaftsbau': {
    name: 'Garten & Landschaftsbau',
    plural: 'Garten und Landschaftsbau',
    slug: 'garten-und-landschaftsbau',
    color: { 50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',300:'#86efac',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d',800:'#166534',900:'#14532d' },
    images: {
      hero: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1920&q=80',
      team: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&q=80',
      project: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80',
    },
    icon: '🌳',
    emoji: '🌳',
    services: ['Gartengestaltung', 'Rasenanlage', 'Heckenschnitt', 'Baumpflege', 'Gartenpflege', 'Terrassenbau'],
    keywords: ['Garten', 'Rasen', 'Hecke', 'Baum', 'Terrasse'],
    painPoints: 'unkrautüberwucherte Beete, kahle Stellen im Rasen, überwucherte Hecken',
    badgeText: 'Gartenprojekt? Wir beraten kostenlos.',
    ctaPrimary: 'Kostenlose Gartenberatung anfragen',
    h1Template: (city) => `Gartenbau in ${city}. Ihr Traumgarten. Unsere Leidenschaft.`,
  },

  // ── NEUE GEWERKE HIER HINZUFÜGEN ──
  // Einfach kopieren, anpassen, fertig!
};

// Hilfsfunktionen
function getTradeConfig(slug) {
  return TRADE_CONFIG[slug] || TRADE_CONFIG['dachdecker']; // Fallback
}

function getAllTradeSlugs() {
  return Object.keys(TRADE_CONFIG);
}

// Export für Node.js und Browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TRADE_CONFIG, getTradeConfig, getAllTradeSlugs };
}
