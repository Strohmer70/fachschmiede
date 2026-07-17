import Link from 'next/link'

const POPULAR_COMBOS = [
  { trade: 'dachdecker', city: 'muenchen', tradeName: 'Dachdecker', cityName: 'München' },
  { trade: 'elektriker', city: 'muenchen', tradeName: 'Elektriker', cityName: 'München' },
  { trade: 'klempner', city: 'muenchen', tradeName: 'Klempner', cityName: 'München' },
]

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

      {/* Popular Pages */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Beliebte Suchen
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {POPULAR_COMBOS.map((combo) => (
              <Link 
                key={`${combo.trade}-${combo.city}`}
                href={`/${combo.trade}/${combo.city}`}
                className="bg-slate-50 p-6 rounded-lg border border-slate-200 hover:border-orange-500 hover:shadow-lg transition"
              >
                <h3 className="font-semibold text-lg mb-2">
                  {combo.tradeName} {combo.cityName}
                </h3>
                <p className="text-slate-600 text-sm">
                  Finden Sie erfahrene {combo.tradeName} in {combo.cityName}.
                </p>
                <span className="text-orange-500 text-sm font-medium mt-4 inline-block">
                  Zur Seite →
                </span>
              </Link>
            ))}
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
