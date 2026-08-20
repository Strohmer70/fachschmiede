import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FALLBACK_TRADES, FALLBACK_CITIES, FALLBACK_PAGES } from '@/lib/fallback-data'
import { supabase } from '@/lib/supabase'

interface PageProps {
  params: {
    trade: string
  }
}

export async function generateStaticParams() {
  return Object.keys(FALLBACK_TRADES).map(slug => ({
    trade: slug
  }))
}

async function loadTradeData(tradeSlug: string) {
  try {
    const { data: trade } = await supabase
      .from('trades')
      .select('*')
      .eq('slug', tradeSlug)
      .single()

    if (trade) {
      const { data: pages } = await supabase
        .from('landing_pages')
        .select('*, city:cities(*)')
        .eq('trade_id', tradeSlug)
        .eq('status', 'available')

      return { trade, pages: pages || [] }
    }
  } catch (err) {
    console.error('Trade load error:', err)
  }

  const trade = FALLBACK_TRADES[tradeSlug]
  if (!trade) return null

  const pages = Object.values(FALLBACK_PAGES).filter(
    (p: any) => p.trade_id === tradeSlug
  )

  return { trade, pages }
}

const tradeIcons: Record<string, string> = {
  dachdecker: '🏠',
  elektriker: '⚡',
  klempner: '🔥',
  maler: '🖌️',
  zimmerer: '🔨',
}

export default async function TradePage({ params }: PageProps) {
  const data = await loadTradeData(params.trade)
  if (!data) notFound()

  const { trade, pages } = data
  const icon = tradeIcons[params.trade] || '🔧'

  return (
    <div className="min-h-screen bg-white">
      {/* Orange Header for Trade Pages */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-ink-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-accent-600 flex items-center justify-center text-white font-black text-lg">M</span>
            <span className="leading-tight">
              <span className="block font-extrabold text-lg text-ink-900">MietWebsites</span>
              <span className="block text-xs text-ink-500 font-medium">für Handwerker</span>
            </span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-ink-600 hover:text-accent-600 transition">← Alle Gewerke</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-ink-900 text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent-600/20 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-xs sm:text-sm font-semibold px-4 py-2 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {pages.length} von {pages.length} Stadt-Websites noch frei
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            {trade.name}-Website mieten –<br /><span className="text-accent-400">heute noch online.</span>
          </h1>
          <p className="mt-5 text-lg text-ink-300 leading-relaxed max-w-xl">
            Kein Verkaufsgespräch, keine Wartezeit: Stadt auswählen, in 5 Minuten individualisieren, 
            veröffentlichen – fertig. Deine Website geht sofort unter deinem Namen online.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <a href="#staedte" className="bg-accent-600 hover:bg-accent-700 text-white font-bold px-7 py-3.5 rounded-xl transition shadow-lg">
              Stadt wählen & loslegen
            </a>
            <span className="bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold px-7 py-3.5 rounded-xl transition cursor-pointer">
              Live-Beispiel ansehen
            </span>
          </div>
        </div>
      </section>

      {/* Cities Grid */}
      <section id="staedte" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-ink-900 mb-4">
              Verfügbare Städte – {trade.name}
            </h2>
            <p className="text-lg text-ink-500 max-w-2xl mx-auto">
              Wähle deine Stadt. Jede Stadt-Website ist einzigartig und SEO-optimiert.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pages.map((page: any) => {
              const city = page.city || FALLBACK_CITIES[page.city_id]
              const citySlug = page.city?.slug || page.city_id
              if (!city) return null
              
              return (
                <Link
                  key={page.slug}
                  href={`/${params.trade}/${citySlug}/`}
                  className="group bg-white p-5 rounded-xl border border-ink-200 hover:border-accent-300 hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-ink-900 group-hover:text-accent-600 transition">
                      {city.name}
                    </h3>
                    <span className="text-xs text-ink-400">{city.state || 'NRW'}</span>
                  </div>
                  <p className="text-sm text-ink-500">
                    {trade.name} {city.name}
                  </p>
                  <div className="mt-3 flex items-center text-accent-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition">
                    Seite ansehen
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink-900 text-ink-400 py-8 px-4 sm:px-6 lg:px-8 text-center text-sm">
        <p>© 2026 fachschmiede.de — Alle Rechte vorbehalten.</p>
      </footer>
    </div>
  )
}
