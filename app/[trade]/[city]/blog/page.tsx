import { notFound } from 'next/navigation'
import Link from 'next/link'
// @ts-ignore
import articleIndex from '@/lib/article-index.json'

interface PageProps {
  params: {
    trade: string
    city: string
  }
}

const tradeNames: Record<string, string> = {
  dachdecker: 'Dachdecker',
  elektriker: 'Elektriker',
  klempner: 'Klempner',
  maler: 'Maler',
  zimmerer: 'Zimmerer',
}

const cityNames: Record<string, string> = {
  bergkamen: 'Bergkamen',
  bochum: 'Bochum',
  'castrop-rauxel': 'Castrop-Rauxel',
  dortmund: 'Dortmund',
  ennepetal: 'Ennepetal',
  froendenberg: 'Fröndenberg',
  gevelsberg: 'Gevelsberg',
  hagen: 'Hagen',
  hattingen: 'Hattingen',
  herne: 'Herne',
  holzwickede: 'Holzwickede',
  iserlohn: 'Iserlohn',
  kamen: 'Kamen',
  luenen: 'Lünen',
  schwelm: 'Schwelm',
  schwerte: 'Schwerte',
  sprockhoevel: 'Sprockhövel',
  unna: 'Unna',
  'wetter-ruhr': 'Wetter (Ruhr)',
  witten: 'Witten',
}

export async function generateStaticParams() {
  const params: { trade: string; city: string }[] = []
  
  Object.entries(articleIndex).forEach(([trade, cities]) => {
    Object.keys(cities as Record<string, unknown>).forEach((city) => {
      params.push({ trade, city })
    })
  })
  
  return params
}

export async function generateMetadata({ params }: PageProps) {
  const tradeName = tradeNames[params.trade] || params.trade
  const cityName = cityNames[params.city] || params.city
  
  return {
    title: `Ratgeber & Blog: ${tradeName} in ${cityName}`,
    description: `Praxisnahe Ratgeber für ${tradeName} in ${cityName} – mit lokalem Fachwissen.`,
  }
}

export default function BlogOverviewPage({ params }: PageProps) {
  const tradeName = tradeNames[params.trade] || params.trade
  const cityName = cityNames[params.city] || params.city
  
  // @ts-ignore
  const articles = articleIndex[params.trade]?.[params.city]
  
  if (!articles || articles.length === 0) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white text-ink-800 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-ink-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
          <Link href={`/${params.trade}/${params.city}/`} className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-accent-600 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-8 9 8M5 10v10h14V10" />
              </svg>
            </span>
            <span className="leading-tight">
              <span className="block font-extrabold text-lg text-ink-900">{tradeName} {cityName}</span>
              <span className="block text-xs text-ink-500 font-medium">{tradeName} · {cityName}</span>
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-ink-600">
            <Link href={`/${params.trade}/${params.city}/`} className="hover:text-accent-600 transition">Zurück zur Startseite</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-ink-900 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/25 backdrop-blur text-xs sm:text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-accent-400" />
              Ratgeber & Fachwissen
            </span>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-6">
              Aktuelle Artikel für {cityName}
            </h1>
            <p className="text-lg sm:text-xl text-ink-200">
              Praxisnahe Ratgeber für Eigentümer in {cityName} – mit lokalem Fachwissen.
            </p>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article: any, i: number) => (
              <a 
                key={i} 
                href={article.url} 
                className="bg-white rounded-2xl overflow-hidden border border-ink-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 group block"
              >
                <div className={`h-44 bg-gradient-to-br ${article.gradient} flex items-center justify-center`}>
                  <svg 
                    className="w-16 h-16 text-white/80" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth={1.5} 
                    viewBox="0 0 24 24" 
                    dangerouslySetInnerHTML={{ __html: article.svg }} 
                  />
                </div>
                <div className="p-7">
                  <p className="text-xs font-semibold text-ink-400">{article.tag} · 6 Min. Lesezeit</p>
                  <h3 className="mt-2 text-lg font-bold text-ink-900 group-hover:text-accent-600 transition leading-snug">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-sm text-ink-600 leading-relaxed">{article.excerpt}</p>
                  <p className="mt-4 text-sm font-bold text-accent-600">Beitrag lesen →</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Back Link */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-ink-50 border-t border-ink-100">
        <div className="max-w-7xl mx-auto text-center">
          <Link 
            href={`/${params.trade}/${params.city}/`}
            className="inline-flex items-center gap-2 text-accent-600 font-bold hover:text-accent-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Zurück zur {tradeName}-Seite für {cityName}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink-900 text-ink-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center text-white text-sm font-black">F</span>
                <span className="font-bold text-white">fachschmiede.de</span>
              </div>
              <p className="text-sm">Professionelle Handwerker-Websites in Ihrer Stadt.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Rechtliches</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/impressum" className="hover:text-accent-400 transition">Impressum</Link></li>
                <li><Link href="/datenschutz" className="hover:text-accent-400 transition">Datenschutz</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-ink-800 pt-8 text-center text-sm">
            © 2026 fachschmiede.de — Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>
    </div>
  )
}
