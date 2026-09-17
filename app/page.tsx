import type { Metadata } from 'next'
import PortalSearch from '@/components/portal-search'
// @ts-ignore — CJS-Config ohne Typdeklarationen
import { getAllTrades, getAllCities } from '../config/system-config'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'fachschmiede.de – Handwerker & Fachbetriebe im Ruhrgebiet finden',
  description:
    'Dachdecker, Elektriker, Klempner, Zimmerer, Maler und Gartenbau in 20 Städten des Ruhrgebiets. Lokale Fachbetriebe finden – schnell, kostenlos und unkompliziert.',
  openGraph: {
    title: 'fachschmiede.de – Handwerker im Ruhrgebiet finden',
    description:
      'Lokale Fachbetriebe für Dach, Elektrik, Sanitär, Holz, Farbe & Garten – in deiner Stadt.',
    url: 'https://fachschmiede.de',
    siteName: 'fachschmiede.de',
    locale: 'de_DE',
    type: 'website',
  },
}

interface TradeData {
  slug: string
  name: string
  plural: string
  emoji: string
  services: string[]
}

interface CityData {
  slug: string
  name: string
}

export default function PortalHomePage() {
  const trades: TradeData[] = getAllTrades().map((t: any) => ({
    slug: t.slug,
    name: t.name,
    plural: t.plural,
    emoji: t.emoji,
    services: t.services || [],
  }))
  const cities: CityData[] = getAllCities().map((c: any) => ({
    slug: c.slug,
    name: c.name,
  }))

  const quickLinks = [
    { trade: 'dachdecker', city: 'dortmund' },
    { trade: 'elektriker', city: 'bochum' },
    { trade: 'klempner', city: 'hagen' },
    { trade: 'maler', city: 'witten' },
    { trade: 'zimmerer', city: 'iserlohn' },
    { trade: 'garten-und-landschaftsbau', city: 'unna' },
  ]

  const findName = (slug: string, list: { slug: string; name: string }[]) =>
    list.find((x) => x.slug === slug)?.name || slug

  return (
    <div className="min-h-screen bg-white">
      {/* ═══════════ HEADER ═══════════ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-lg">
              F
            </span>
            <span className="font-extrabold text-xl text-ink-900 tracking-tight">
              fachschmiede<span className="text-brand-600">.de</span>
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-ink-600">
            <a href="#gewerke" className="hover:text-brand-600 transition">Gewerke</a>
            <a href="#staedte" className="hover:text-brand-600 transition">Städte</a>
            <a href="#so-funktionierts" className="hover:text-brand-600 transition">So funktioniert&apos;s</a>
          </nav>
          <a
            href="/fuer-dienstleister/"
            className="bg-ink-900 hover:bg-ink-800 text-white text-sm font-bold px-4 sm:px-5 py-2.5 rounded-lg transition"
          >
            Für Handwerker →
          </a>
        </div>
      </header>

      {/* ═══════════ HERO + SUCHE ═══════════ */}
      <section className="relative bg-ink-900 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'linear-gradient(115deg, rgba(15,23,42,1) 0%, rgba(49,46,129,.9) 55%, rgba(67,56,202,.8) 100%)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
            Den richtigen Fachbetrieb finden.
            <br />
            <span className="text-brand-300">In deiner Stadt.</span>
          </h1>
          <p className="mt-4 text-ink-300 text-base sm:text-lg max-w-2xl mx-auto">
            Lokale Handwerker im Ruhrgebiet – von Dach bis Garten. Gewerk wählen, Stadt wählen, Anfrage senden.
          </p>
          <div className="mt-8">
            <PortalSearch trades={trades} cities={cities} />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="text-ink-400 text-xs font-semibold self-center mr-1 uppercase tracking-wider">
              Beliebt:
            </span>
            {quickLinks.map((q) => (
              <a
                key={`${q.trade}-${q.city}`}
                href={`/${q.trade}/${q.city}/`}
                className="text-xs font-semibold text-ink-200 bg-ink-800/70 hover:bg-brand-600 border border-ink-700 hover:border-brand-500 rounded-full px-3.5 py-1.5 transition"
              >
                {findName(q.trade, trades)} {findName(q.city, cities)}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TRUST BAR ═══════════ */}
      <section className="border-b border-ink-100 bg-ink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: `${trades.length}`, label: 'Gewerke' },
            { n: `${cities.length}`, label: 'Städte' },
            { n: `${trades.length * cities.length}+`, label: 'Lokale Seiten' },
            { n: '100%', label: 'Aus dem Ruhrgebiet' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-black text-ink-900">{s.n}</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ GEWERKE-DIRECTORY ═══════════ */}
      <section id="gewerke" className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-black text-ink-900 tracking-tight">
            Alle Gewerke. Alle Städte.
          </h2>
          <p className="mt-3 text-ink-500 max-w-xl mx-auto">
            Wähle dein Gewerk und deine Stadt – du landest direkt auf der lokalen Seite mit Anfrageformular.
          </p>
        </div>
        <div className="space-y-10">
          {trades.map((trade) => (
            <div
              key={trade.slug}
              id={`gewerk-${trade.slug}`}
              className="bg-white border border-ink-100 rounded-2xl shadow-sm overflow-hidden scroll-mt-24"
            >
              <div className="flex flex-wrap items-center gap-3 px-6 py-5 bg-ink-50 border-b border-ink-100">
                <span className="text-2xl">{trade.emoji}</span>
                <h3 className="text-lg sm:text-xl font-extrabold text-ink-900">{trade.plural}</h3>
                <span className="text-ink-400 text-sm font-medium">
                  {trade.services.slice(0, 3).join(' · ')}
                </span>
                <a
                  href={`/${trade.slug}/${cities[0].slug}/`}
                  className="ml-auto text-sm font-bold text-brand-600 hover:text-brand-700 whitespace-nowrap"
                >
                  Zur Übersicht →
                </a>
              </div>
              <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2.5">
                {cities.map((city) => (
                  <a
                    key={city.slug}
                    href={`/${trade.slug}/${city.slug}/`}
                    className="group flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-brand-600 transition py-1"
                  >
                    <span className="text-ink-300 group-hover:text-brand-500 transition">→</span>
                    {trade.name} {city.name}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ SO FUNKTIONIERT'S ═══════════ */}
      <section id="so-funktionierts" className="bg-ink-900 py-16 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">So einfach geht&apos;s</h2>
            <p className="mt-3 text-ink-400 max-w-xl mx-auto">Kein Anruf-Marathon. Keine Warteschleifen. Zwei Minuten, fertig.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Gewerk & Stadt wählen',
                text: 'Sag uns, welchen Handwerker du suchst und wo – z. B. Dachdecker in Dortmund.',
              },
              {
                step: '2',
                title: 'Anfrage in 2 Minuten',
                text: 'Formular auf der lokalen Seite ausfüllen – kostenlos und unverbindlich.',
              },
              {
                step: '3',
                title: 'Fachbetrieb meldet sich',
                text: 'Ein lokaler Betrieb aus deiner Region meldet sich mit einem konkreten Angebot.',
              },
            ].map((s) => (
              <div key={s.step} className="bg-ink-800/60 border border-ink-700 rounded-2xl p-7">
                <div className="w-11 h-11 rounded-xl bg-brand-600 text-white font-black text-lg flex items-center justify-center mb-5">
                  {s.step}
                </div>
                <h3 className="text-lg font-extrabold text-white mb-2">{s.title}</h3>
                <p className="text-ink-400 text-sm leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ STÄDTE-STRIP ═══════════ */}
      <section id="staedte" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 scroll-mt-24">
        <h2 className="text-2xl sm:text-3xl font-black text-ink-900 tracking-tight text-center mb-8">
          20 Städte im Ruhrgebiet & Umgebung
        </h2>
        <div className="flex flex-wrap justify-center gap-2.5">
          {cities.map((city) => (
            <a
              key={city.slug}
              href={`/${trades[0].slug}/${city.slug}/`}
              className="bg-ink-50 hover:bg-brand-50 border border-ink-200 hover:border-brand-300 text-ink-700 hover:text-brand-700 font-semibold text-sm rounded-full px-4 py-2 transition"
            >
              {city.name}
            </a>
          ))}
        </div>
      </section>

      {/* ═══════════ B2B-BRIDGE ═══════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-8 py-14 sm:px-14 text-center shadow-2xl">
          <div className="relative">
            <div className="text-4xl mb-4">🔧</div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Du bist Handwerker?
            </h2>
            <p className="mt-4 text-brand-100 max-w-2xl mx-auto text-base sm:text-lg">
              Miete deine eigene lokale Seite und erhalte Anfragen aus deiner Stadt –
              ab €189/Monat, selbst verwalten, keine Agentur nötig.
            </p>
            <a
              href="/fuer-dienstleister/"
              className="inline-block mt-8 bg-white text-brand-700 font-black text-base sm:text-lg px-8 py-4 rounded-xl shadow-lg hover:bg-brand-50 transition"
            >
              Jetzt Seite mieten →
            </a>
            <p className="mt-4 text-brand-200 text-xs font-semibold uppercase tracking-wider">
              Dachdecker · Elektriker · Klempner · Zimmerer · Maler · Gartenbau
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-ink-100 bg-ink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center text-white font-black text-sm">
                  F
                </span>
                <span className="font-extrabold text-ink-900">fachschmiede.de</span>
              </div>
              <p className="mt-2 text-ink-500 text-sm max-w-sm">
                Das lokale Portal für Handwerk & Fachbetriebe im Ruhrgebiet.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-ink-600">
              <a href="/fuer-dienstleister/" className="hover:text-brand-600 transition">Für Handwerker</a>
              <a href="/impressum/" className="hover:text-brand-600 transition">Impressum</a>
              <a href="/datenschutz/" className="hover:text-brand-600 transition">Datenschutz</a>
            </nav>
          </div>
          <div className="mt-8 pt-6 border-t border-ink-200 text-xs text-ink-400">
            © {new Date().getFullYear()} fachschmiede.de – Handwerk mit Profil.
          </div>
        </div>
      </footer>
    </div>
  )
}
