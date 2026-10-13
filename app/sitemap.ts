import type { MetadataRoute } from 'next'

// ═══════════════════════════════════════════════════════════════════
// SITEMAP — REGELN (nach dem 13.10.2026-Desaster):
// 1. NUR URLs die LIVE 200 liefern (keine 308-Ketten, keine 404!)
// 2. IMMER Trailing Slash (next.config: trailingSlash: true)
// 3. KEINE /stadt-* Dateinamen (interne Files, oeffentlich = /gewerk/stadt/)
// 4. KEINE robots.txt-disallowten Pfade (/mieter ist disallowed!)
// 5. Salespages = /sales-*/ (Rewrite → .html), NIEMALS /sales-*.html in Sitemap
// ═══════════════════════════════════════════════════════════════════

const BASE = 'https://www.fachschmiede.de'

const CITIES = [
  'bergkamen', 'berlin-spandau', 'bochum', 'castrop-rauxel', 'dortmund',
  'ennepetal', 'froendenberg', 'gevelsberg', 'hagen', 'hattingen', 'herne',
  'holzwickede', 'iserlohn', 'kamen', 'luenen', 'schwelm', 'schwerte',
  'sprockhoevel', 'unna', 'wetter-ruhr', 'witten',
]

const TRADES = [
  { slug: 'dachdecker', prefix: 'dach' },
  { slug: 'elektriker', prefix: 'elek' },
  { slug: 'garten-und-landschaftsbau', prefix: 'garten' },
  { slug: 'klempner', prefix: 'klempner' },
  { slug: 'maler', prefix: 'maler' },
  { slug: 'zimmerer', prefix: 'zimm' },
]

const ARTICLES = [
  'artikel-5-anzeichen-dachsanierung',
  'artikel-carport-bauen',
  'artikel-dachdaemmung-foerderung',
  'artikel-dachstuhl-sanieren',
  'artikel-e-check-sicherheitspruefung',
  'artikel-farben-raumwirkung',
  'artikel-fassade-streichen-kosten',
  'artikel-heizungs-check-winter',
  'artikel-heizungstausch-foerderung',
  'artikel-holzterrasse-pflegen',
  'artikel-rohrbruch-sofortmassnahmen',
  'artikel-schimmel-wohnung',
  'artikel-smart-home-nachruesten',
  'artikel-sturmschaden-sofortmassnahmen',
  'artikel-wallbox-zuhause',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const urls: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, priority: 1.0, changeFrequency: 'weekly' },
  ]

  // Gewerk-Übersichtsseiten (/dachdecker/ etc. — [trade]/page.tsx)
  for (const t of TRADES) {
    urls.push({ url: `${BASE}/${t.slug}/`, priority: 0.8, changeFrequency: 'weekly' })
  }

  // Salespages — Geld-Seiten, saubere URLs (Rewrite → .html)
  for (const t of TRADES) {
    urls.push({ url: `${BASE}/sales-${t.slug}/`, priority: 0.9, changeFrequency: 'weekly' })
  }

  // Landing Pages: 6 Gewerke × 20 Städte (/gewerk/stadt/)
  for (const t of TRADES) {
    for (const c of CITIES) {
      urls.push({ url: `${BASE}/${t.slug}/${c}/`, priority: 0.8, changeFrequency: 'weekly' })
    }
  }

  // Artikel
  for (const a of ARTICLES) {
    urls.push({ url: `${BASE}/${a}/`, priority: 0.6, changeFrequency: 'weekly' })
  }

  // Ratgeber
  for (const r of ['ratgeber', 'ratgeber-elektriker', 'ratgeber-klempner', 'ratgeber-maler', 'ratgeber-zimmerer']) {
    urls.push({ url: `${BASE}/${r}/`, priority: 0.6, changeFrequency: 'weekly' })
  }

  // Statische Seiten
  urls.push({ url: `${BASE}/fuer-dienstleister/`, priority: 0.7, changeFrequency: 'weekly' })
  urls.push({ url: `${BASE}/mietbedingungen/`, priority: 0.3, changeFrequency: 'monthly' })
  urls.push({ url: `${BASE}/impressum/`, priority: 0.3, changeFrequency: 'monthly' })
  urls.push({ url: `${BASE}/datenschutz/`, priority: 0.3, changeFrequency: 'monthly' })

  return urls
}
