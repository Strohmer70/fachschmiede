import Link from 'next/link'
import { FALLBACK_TRADES } from '@/lib/fallback-data'

const TRADES_LIST = Object.values(FALLBACK_TRADES)

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-slate-900 text-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span className="text-xl font-bold">fachschmiede.de</span>
          <span className="text-sm text-slate-400">Die Plattform für lokale Handwerker</span>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-slate-900 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Lokale Handwerker<br />mit einem Klick finden
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Wir schmieden die Verbindung zwischen Ihnen und den besten Fachbetrieben in Ihrer Region.
          </p>
        </div>
      </section>

      {/* Trades Grid */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Wählen Sie Ihr Gewerk
          </h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Finden Sie erfahrene Handwerker in Ihrer Stadt. Wählen Sie unten Ihr Gewerk und suchen Sie nach Ihrer Stadt.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TRADES_LIST.map((trade) => (
              <Link 
                key={trade.slug}
                href={`/gewerk/${trade.slug}`}
                className="bg-white p-6 rounded-xl border border-slate-200 hover:border-orange-500 hover:shadow-xl transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center text-2xl group-hover:bg-orange-500 group-hover:text-white transition">
                    {trade.slug === 'dachdecker' ? '🏠' : trade.slug === 'elektriker' ? '⚡' : '🔧'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-orange-600 transition">
                      {trade.name}
                    </h3>
                    <p className="text-slate-500 text-sm">
                      {trade.services.length} Leistungen
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {trade.services.slice(0, 3).map((service: string, i: number) => (
                    <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                      {service}
                    </span>
                  ))}
                  {trade.services.length > 3 && (
                    <span className="text-xs text-slate-400 px-2 py-1">+{trade.services.length - 3} mehr</span>
                  )}
                </div>
                <div className="mt-4 flex items-center text-orange-500 font-medium text-sm">
                  <span>Städte durchsuchen</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            So funktioniert's
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-lg mb-2">Gewerk wählen</h3>
              <p className="text-slate-600">Wählen Sie Ihr Handwerk aus unserer Liste.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-lg mb-2">Stadt suchen</h3>
              <p className="text-slate-600">Finden Sie Handwerker in Ihrer Stadt.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-lg mb-2">Kontakt aufnehmen</h3>
              <p className="text-slate-600">Direkt Angebot einholen – kostenlos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 text-center text-sm">
        <p>© 2026 fachschmiede.de — Wir schmieden deine lokale Präsenz.</p>
      </footer>
    </div>
  )
}
