import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FALLBACK_TRADES, FALLBACK_CITIES, FALLBACK_PAGES } from '@/lib/fallback-data'

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

export default function TradePage({ params }: PageProps) {
  const trade = FALLBACK_TRADES[params.trade]
  if (!trade) notFound()

  // Find all pages for this trade
  const pages = Object.values(FALLBACK_PAGES).filter(
    (p: any) => p.trade_id === params.trade
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-slate-900 text-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">fachschmiede.de</Link>
          <span className="text-sm text-slate-400">{trade.name} finden</span>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {trade.name} in Ihrer Stadt
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Finden Sie erfahrene {trade.plural_name} in Ihrer Nähe.
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="py-12 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Leistungen</h2>
          <div className="flex flex-wrap gap-3">
            {trade.services.map((service: string, i: number) => (
              <span key={i} className="bg-white text-slate-700 px-4 py-2 rounded-lg border border-slate-200 text-sm">
                {service}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Verfügbare Städte</h2>
          <p className="text-slate-600 mb-8">Wählen Sie Ihre Stadt für lokale {trade.name}.</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map((page: any) => {
              const city = FALLBACK_CITIES[page.city_id]
              return (
                <Link
                  key={page.slug}
                  href={`/g/${params.trade}/${page.city_id}`}
                  className="bg-white p-6 rounded-xl border border-slate-200 hover:border-orange-500 hover:shadow-lg transition group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-orange-600 transition">
                        {trade.name} {city.name}
                      </h3>
                      <p className="text-slate-500 text-sm">{city.state}</p>
                    </div>
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Rent CTA */}
      <section className="bg-orange-50 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Sind Sie {trade.name}?
          </h2>
          <p className="text-slate-600 mb-8">
            Mieten Sie eine professionelle Landing Page und gewinnen Sie neue Kunden in Ihrer Region.
          </p>
          <Link
            href="/"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition inline-block"
          >
            Mehr erfahren
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 text-center text-sm">
        <p>© 2026 fachschmiede.de — Wir schmieden deine lokale Präsenz.</p>
      </footer>
    </div>
  )
}
