import type { MetadataRoute } from 'next'
import { getAllCities, getAllTrades } from '../config/system-config.js'
// 2026-10-17: Artikel + Ratgeber-Hubs DYNAMISCH aus lib/general-articles.json (SSOT).
// Vorher HARDCODED → neue Artikel (Generator!) fehlten hier forever.
// Der Generator (scripts/generate-general-article.js) pflegt die Registry;
// diese Route liest live daraus. NIEMALS wieder hardcodieren!
import { loadRegistry } from '../lib/ratgeber-lib'

// 2026-10-16: Städte + Gewerke DYNAMISCH aus der SSOT (config/system-config.js).
// Vorher HARDCODED → neue Städte (z.B. via Admin-Dashboard angelegt) fehlten hier
// FOREVER in der Sitemap. Die SSOT pflegt generateCity (city-gen.js) automatisch.
export const revalidate = 3600

// ═══════════════════════════════════════════════════════════════════
// SITEMAP — REGELN (nach dem 13.10.2026-Desaster):
// 1. NUR URLs die LIVE 200 liefern (keine 308-Ketten, keine 404!)
// 2. IMMER Trailing Slash (next.config: trailingSlash: true)
// 3. KEINE /stadt-* Dateinamen (interne Files, oeffentlich = /gewerk/stadt/)
// 4. KEINE robots.txt-disallowten Pfade (/mieter ist disallowed!)
// 5. Salespages = /sales-*/ (Rewrite → .html), NIEMALS /sales-*.html in Sitemap
// ═══════════════════════════════════════════════════════════════════

const BASE = 'https://www.fachschmiede.de'

export default function sitemap(): MetadataRoute.Sitemap {
  // SSOT: aktuellste Städte/Gewerke — generateCity aktualisiert system-config.js
  // bei jeder neuen Stadt (Admin-Dashboard), diese Route liest live daraus.
  const CITIES = getAllCities().map((c: any) => c.slug)
  const TRADE_SLUGS: string[] = getAllTrades().map((t: any) => t.slug)

  const urls: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, priority: 1.0, changeFrequency: 'weekly' },
  ]

  // Gewerk-Übersichtsseiten (/dachdecker/ etc. — [trade]/page.tsx)
  for (const slug of TRADE_SLUGS) {
    urls.push({ url: `${BASE}/${slug}/`, priority: 0.8, changeFrequency: 'weekly' })
  }

  // Salespages — Geld-Seiten, saubere URLs (Rewrite → .html)
  for (const slug of TRADE_SLUGS) {
    urls.push({ url: `${BASE}/sales-${slug}/`, priority: 0.9, changeFrequency: 'weekly' })
  }

  // Landing Pages: alle Gewerke × alle Städte (/gewerk/stadt/) — SSOT-anzahl
  for (const slug of TRADE_SLUGS) {
    for (const c of CITIES) {
      urls.push({ url: `${BASE}/${slug}/${c}/`, priority: 0.8, changeFrequency: 'weekly' })
    }
  }

  // Artikel — DYNAMISCH aus Registry (SSOT, gepflegt vom Generator)
  const registry = loadRegistry() as { trades: Record<string, { slug: string }[]> }
  const articleSlugs = new Set<string>()
  const ratgeberHubs = new Set<string>(['ratgeber'])
  for (const arts of Object.values(registry.trades)) {
    for (const a of arts) articleSlugs.add(a.slug)
  }
  for (const regKey of Object.keys(registry.trades)) {
    ratgeberHubs.add(`ratgeber-${regKey}`)
  }
  // Hinweis: Set-Iteration braucht es2015-target — Array.from() ist der sichere Weg (TS-target es5-default)
  for (const a of Array.from(articleSlugs)) {
    urls.push({ url: `${BASE}/${a}/`, priority: 0.6, changeFrequency: 'weekly' })
  }

  // Ratgeber-Hubs (Haupt-Hub + alle Gewerk-Hubs)
  for (const r of Array.from(ratgeberHubs)) {
    urls.push({ url: `${BASE}/${r}/`, priority: 0.7, changeFrequency: 'weekly' })
  }

  // Statische Seiten
  urls.push({ url: `${BASE}/fuer-dienstleister/`, priority: 0.7, changeFrequency: 'weekly' })
  urls.push({ url: `${BASE}/mietbedingungen/`, priority: 0.3, changeFrequency: 'monthly' })
  urls.push({ url: `${BASE}/impressum/`, priority: 0.3, changeFrequency: 'monthly' })
  urls.push({ url: `${BASE}/datenschutz/`, priority: 0.3, changeFrequency: 'monthly' })

  return urls
}
