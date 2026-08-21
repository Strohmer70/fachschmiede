import { notFound } from 'next/navigation'
import Link from 'next/link'
import { RentBanner } from '@/components/RentBanner'
import { TenantBranding } from '@/components/TenantBranding'
import { FALLBACK_TRADES, FALLBACK_CITIES, FALLBACK_PAGES } from '@/lib/fallback-data'
import { supabase } from '@/lib/supabase'
// @ts-ignore
import articleIndex from '@/lib/article-index.json'

interface PageProps {
  params: {
    trade: string
    city: string
  }
}

// Mapping für SEO-freundliche URLs → interne Datenbank-Slugs
const TRADE_SLUG_MAP: Record<string, string> = {
  'klempner': 'shk',  // Datenbank hat noch 'shk'
}

function getDbTradeSlug(tradeSlug: string): string {
  return TRADE_SLUG_MAP[tradeSlug] || tradeSlug
}

export async function generateStaticParams() {
  return Object.keys(FALLBACK_PAGES).map(slug => {
    const parts = slug.split('-')
    return {
      trade: parts[0],
      city: parts.slice(1).join('-')
    }
  })
}

export async function generateMetadata({ params }: PageProps) {
  const cleanTrade = params.trade?.replace(/\/$/, '') || params.trade
  const cleanCity = params.city?.replace(/\/$/, '') || params.city
  const slug = `${cleanTrade}-${cleanCity}`
  
  const page = FALLBACK_PAGES[slug]
  if (!page) return { title: 'Seite nicht gefunden' }

  return {
    title: page.title,
    description: page.meta_description,
  }
}

export default async function LandingPage({ params }: PageProps) {
  const cleanTrade = params.trade?.replace(/\/$/, '') || params.trade
  const cleanCity = params.city?.replace(/\/$/, '') || params.city
  const dbTradeSlug = getDbTradeSlug(cleanTrade)
  const slug = `${dbTradeSlug}-${cleanCity}`

  let page = null
  try {
    const { data } = await supabase
      .from('landing_pages')
      .select(`*, trade:trades(*), city:cities(*), page_customizations(*, tenant:tenants(*))`)
      .eq('slug', slug)
      .single()
    page = data
  } catch (err) {
    console.error('Supabase load error:', err)
  }

  if (!page) page = FALLBACK_PAGES[slug] || FALLBACK_PAGES[`${cleanTrade}-${cleanCity}`]
  if (!page) notFound()

  let trade = page.trade
  let city = page.city
  if (!trade) trade = FALLBACK_TRADES[cleanTrade]
  if (!city) city = FALLBACK_CITIES[cleanCity]
  if (!trade || !city) notFound()

  const isAvailable = page.status === 'available'
  const customization = page.page_customizations?.[0]
  const tenant = customization?.tenant

  const services = getServices(trade.slug)
  const faqs = getFAQ(trade.name)
  const articles = getArticles(cleanTrade, cleanCity)

  return (
    <div className="min-h-screen bg-white text-ink-800 antialiased">
      {/* Rent Banner */}
      {isAvailable && (
        <RentBanner tradeName={trade.name} cityName={city.name} price={page.monthly_price || 18900} slug={slug} />
      )}

      {/* Tenant Branding */}
      {tenant && customization && (
        <TenantBranding customization={customization} tenant={tenant} />
      )}

      {/* Orange Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-ink-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-accent-600 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-8 9 8M5 10v10h14V10" />
              </svg>
            </span>
            <span className="leading-tight">
              <span className="block font-extrabold text-lg text-ink-900">{tenant?.company_name || `${trade.name} ${city.name}`}</span>
              <span className="block text-xs text-ink-500 font-medium">{trade.name} · {city.name}</span>
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-ink-600">
            <a href="#leistungen" className="hover:text-accent-600 transition">Leistungen</a>
            <a href="#ueber-uns" className="hover:text-accent-600 transition">Über uns</a>
            <a href="#faq" className="hover:text-accent-600 transition">FAQ</a>
            <a href="#kontakt" className="hover:text-accent-600 transition">Kontakt</a>
          </nav>
          <a href="#kontakt" className="hidden sm:inline-flex bg-accent-600 hover:bg-accent-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition shadow-sm">
            Angebot anfragen
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-ink-900 text-white overflow-hidden">
        <div className="absolute inset-0 hero-gradient-dark" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/25 backdrop-blur text-xs sm:text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-accent-400" />
              {trade.name} aus {city.name}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
              Ihr {trade.name}<br />in <span className="text-accent-400">{city.name}</span>.
            </h1>
            <p className="text-lg sm:text-xl text-ink-200 mb-8 max-w-xl">
              Professionelle Leistungen aus einer Hand – persönlich, sauber und zuverlässig. 
              Für Privat- und Geschäftskunden in {city.name} und Umgebung.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#kontakt" className="inline-flex justify-center items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition shadow-lg">
                Kostenloses Angebot
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a href="tel:+491234567890" className="inline-flex justify-center items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur text-white font-bold px-8 py-4 rounded-xl text-lg transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.2a1 1 0 01.95.68l1.2 3.6a1 1 0 01-.27 1.06l-1.6 1.6a12.05 12.05 0 005.58 5.58l1.6-1.6a1 1 0 011.06-.27l3.6 1.2a1 1 0 01.68.95V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 6V3z" />
                </svg>
                Jetzt anrufen
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-ink-200">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-accent-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" /></svg>
                Kostenlose Erstberatung
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-accent-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" /></svg>
                Transparente Angebote
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-accent-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" /></svg>
                Schnelle Terminvergabe
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-10 bg-ink-50 border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-ink-600">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Kostenlose Besichtigung
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Festpreis-Garantie
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              24h Notdienst
            </span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="leistungen" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-ink-900 mb-4">Unsere Leistungen</h2>
            <p className="text-lg text-ink-500 max-w-2xl mx-auto">
              Professionelle {trade.name}-Leistungen für {city.name} und die gesamte Region.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-ink-200 hover:shadow-lg hover:border-accent-200 transition">
                <div className="w-12 h-12 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center text-xl mb-4">
                  {service.icon}
                </div>
                <h3 className="text-lg font-bold text-ink-900 mb-2">{service.title}</h3>
                <p className="text-ink-500 text-sm">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / City Context */}
      <section id="ueber-uns" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-ink-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-ink-900 mb-6">
                Ihr {trade.name} in {city.name}
              </h2>
              <p className="text-ink-600 mb-4 leading-relaxed">
                {city.name} mit seinen {city.einwohner?.toLocaleString() || 'vielen'} Einwohnern 
                hat einen besonderen Bedarf an qualifizierten {trade.plural_name || trade.name}. 
                Wir kennen die Region und bieten maßgeschneiderte Lösungen.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#kontakt" className="inline-flex items-center bg-accent-600 hover:bg-accent-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg">
                  Jetzt anfragen
                </a>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-ink-200 shadow-sm">
              <h3 className="text-xl font-bold text-ink-900 mb-4">Warum wir der richtige Partner sind</h3>
              <ul className="space-y-3">
                {[
                  'Jahrelange Erfahrung in der Region',
                  'Festpreis ohne versteckte Kosten',
                  'Termintreue und Zuverlässigkeit',
                  'Garantie auf alle Arbeiten',
                  'Kostenlose Beratung vor Ort',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-ink-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-ink-900 mb-4">Häufige Fragen</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-white rounded-xl border border-ink-200 overflow-hidden group">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-semibold text-ink-800 hover:bg-ink-50 transition">
                  {faq.q}
                  <svg className="w-5 h-5 text-ink-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-ink-600 leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Blog / Articles */}
      <section id="blog" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-ink-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-accent-600 font-bold text-sm uppercase tracking-widest mb-2">Ratgeber & Blog</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-ink-900 mb-4">Wissen rund um {trade.name}</h2>
            <p className="text-lg text-ink-500 max-w-2xl mx-auto">
              Praktische Tipps und Fachwissen für {city.name} und Umgebung.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {articles.map((article: any, i: number) => (
              <a key={i} href={article.url} className="bg-white rounded-2xl overflow-hidden border border-ink-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 group block">
                <div className={`h-44 bg-gradient-to-br ${article.gradient} flex items-center justify-center`}>
                  <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: article.svg }} />
                </div>
                <div className="p-7">
                  <p className="text-xs font-semibold text-ink-400">{article.tag} · 6 Min. Lesezeit</p>
                  <h3 className="mt-2 text-lg font-bold text-ink-900 group-hover:text-accent-600 transition leading-snug">{article.title}</h3>
                  <p className="mt-2 text-sm text-ink-600 leading-relaxed">{article.excerpt}</p>
                  <p className="mt-4 text-sm font-bold text-accent-600">Beitrag lesen →</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="kontakt" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-accent-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ink-900 mb-4">
            Bereit für Ihr Projekt?
          </h2>
          <p className="text-lg text-ink-500 mb-8 max-w-2xl mx-auto">
            Kontaktieren Sie uns für eine kostenlose Beratung und ein unverbindliches Angebot.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="tel:+491234567890" className="inline-flex items-center bg-accent-600 hover:bg-accent-700 text-white font-bold px-8 py-4 rounded-xl transition shadow-lg text-lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Jetzt anrufen
            </a>
            <a href="mailto:hello@fachschmiede.de" className="inline-flex items-center bg-white hover:bg-ink-50 text-ink-800 font-bold px-8 py-4 rounded-xl transition border border-ink-200 text-lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              E-Mail schreiben
            </a>
          </div>
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
            <div>
              <h4 className="font-semibold text-white mb-3">Kontakt</h4>
              <p className="text-sm">hello@fachschmiede.de</p>
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

function getServices(tradeSlug: string) {
  const services: Record<string, Array<{icon: string, title: string, desc: string}>> = {
    dachdecker: [
      { icon: '🏠', title: 'Dachsanierung', desc: 'Komplette Sanierung Ihres Daches mit modernen Materialien.' },
      { icon: '🔧', title: 'Dachreparatur', desc: 'Schnelle und zuverlässige Reparaturen für alle Dachschäden.' },
      { icon: '🌡️', title: 'Dachdämmung', desc: 'Energieeffiziente Dämmung für beste Wärmedämmung.' },
      { icon: '🪟', title: 'Dachfenster', desc: 'Einbau und Austausch von Dachfenstern aller Marken.' },
      { icon: '🚨', title: 'Dachnotdienst', desc: '24-Stunden-Notdienst für akute Dachschäden.' },
      { icon: '🧹', title: 'Dachreinigung', desc: 'Professionelle Reinigung und Moosentfernung.' },
    ],
    elektriker: [
      { icon: '⚡', title: 'Elektroinstallation', desc: 'Komplette Elektroinstallation für Neubau und Sanierung.' },
      { icon: '🏠', title: 'Smart Home', desc: 'Vernetzung Ihres Zuhauses mit intelligenter Technik.' },
      { icon: '🚗', title: 'Wallbox', desc: 'Professioneller Einbau von Ladestationen für E-Autos.' },
      { icon: '✅', title: 'E-Check', desc: 'Sicherheitsprüfung Ihrer elektrischen Anlagen.' },
      { icon: '🚨', title: 'Elektronotdienst', desc: 'Schnelle Hilfe bei Stromausfall.' },
      { icon: '💡', title: 'LED-Beleuchtung', desc: 'Energieeffiziente Beleuchtungslösungen.' },
    ],
    shk: [
      { icon: '🔥', title: 'Heizungsinstallation', desc: 'Installation und Austausch von Heizungsanlagen.' },
      { icon: '🚿', title: 'Sanitär', desc: 'Komplette Sanitärarbeiten für Bad und Küche.' },
      { icon: '💧', title: 'Wasserinstallation', desc: 'Neuinstallation und Reparatur von Wasserleitungen.' },
      { icon: '🧹', title: 'Rohrreinigung', desc: 'Professionelle Reinigung verstopfter Rohre.' },
      { icon: '🚨', title: 'Rohrnotdienst', desc: 'Schnelle Hilfe bei Rohrbruch.' },
      { icon: '🌡️', title: 'Wärmepumpen', desc: 'Beratung und Installation energiesparender Wärmepumpen.' },
    ],
    maler: [
      { icon: '🎨', title: 'Innenanstrich', desc: 'Professionelle Malerarbeiten für alle Räume.' },
      { icon: '🏠', title: 'Fassadenanstrich', desc: 'Schützende und verschönernde Anstriche.' },
      { icon: '🖌️', title: 'Lackierarbeiten', desc: 'Hochwertige Lackierung von Türen und Fenstern.' },
      { icon: '📜', title: 'Tapezierarbeiten', desc: 'Expertise in allen Tapeziertechniken.' },
      { icon: '🏗️', title: 'Spachtelarbeiten', desc: 'Glatte Wände und Decken.' },
      { icon: '🎭', title: 'Dekorative Techniken', desc: 'Kreative Wandgestaltung.' },
    ],
    zimmerer: [
      { icon: '🏠', title: 'Carport-Bau', desc: 'Maßgefertigte Carports aus Holz.' },
      { icon: '🌳', title: 'Holzbau', desc: 'Traditioneller und moderner Holzbau.' },
      { icon: '🏗️', title: 'Dachstuhl', desc: 'Neubau und Reparatur von Dachstühlen.' },
      { icon: '🌞', title: 'Terrassenbau', desc: 'Witterungsbeständige Holzterrassen.' },
      { icon: '🔨', title: 'Holzreparatur', desc: 'Fachgerechte Reparatur von Holzbauteilen.' },
      { icon: '🏡', title: 'Gartenhäuser', desc: 'Individuelle Gartenhäuser und Geräteschuppen.' },
    ],
  }
  return services[tradeSlug] || services.dachdecker
}

function getFAQ(tradeName: string) {
  return [
    { q: `Wie schnell können ${tradeName} vor Ort sein?`, a: 'In der Regel sind wir innerhalb von 24 Stunden bei Ihnen vor Ort. Bei Notfällen bieten wir einen 24h-Notdienst an.' },
    { q: 'Bieten Sie kostenlose Besichtigungen an?', a: 'Ja, wir bieten eine kostenlose und unverbindliche Erstbesichtigung vor Ort an.' },
    { q: 'Gibt es eine Festpreis-Garantie?', a: 'Nach der Besichtigung erhalten Sie ein verbindliches Festpreisangebot. Keine versteckten Kosten.' },
    { q: 'Wie lange dauern die Arbeiten?', a: 'Das hängt vom Umfang des Projekts ab. Nach der Besichtigung erhalten Sie einen genauen Zeitplan.' },
    { q: 'Gibt es eine Garantie?', a: 'Ja, wir gewährleisten auf alle Arbeiten eine umfassende Garantie.' },
  ]
}

function getArticles(tradeSlug: string, citySlug: string) {
  // @ts-ignore
  const idx = articleIndex[tradeSlug]?.[citySlug]
  if (!idx || idx.length === 0) {
    return [
      { title: `5 Anzeichen, dass Sie einen Fachmann brauchen`, excerpt: 'Woran Sie erkennen, dass es Zeit für den Profi wird.', tag: 'Ratgeber', gradient: 'from-accent-500 to-accent-700', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>', url: '#' },
      { title: 'Förderungen für Sanierungen: Diese Zuschüsse gibt es', excerpt: 'BAFA-Zuschuss oder KfW-Kredit? Ein Überblick über die Fördermöglichkeiten.', tag: 'Förderung', gradient: 'from-ink-700 to-ink-900', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>', url: '#' },
      { title: 'Notfall: Was Sie sofort tun sollten', excerpt: 'Die wichtigsten Schritte im Überblick.', tag: 'Notfall', gradient: 'from-sky-600 to-ink-800', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999A5.002 5.002 0 105.9 8.001 4.002 4.002 0 003 15z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M13 10l-2 4h3l-2 4"></path>', url: '#' },
    ]
  }
  return idx.map((a: any) => ({
    title: a.title,
    excerpt: a.excerpt || 'Wertvolle Tipps und Fachwissen für Ihr Projekt.',
    tag: a.tag,
    gradient: a.gradient,
    svg: a.svg,
    url: a.url,
  }))
}
