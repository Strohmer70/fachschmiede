import { notFound } from 'next/navigation'
import Link from 'next/link'
import { RentBanner } from '@/components/RentBanner'
import { TenantBranding } from '@/components/TenantBranding'
import { FALLBACK_TRADES, FALLBACK_CITIES, FALLBACK_PAGES } from '@/lib/fallback-data'
import { supabase } from '@/lib/supabase'

interface PageProps {
  params: {
    trade: string
    city: string
  }
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

// Star rating component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-slate-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default async function LandingPage({ params }: PageProps) {
  const cleanTrade = params.trade?.replace(/\/$/, '') || params.trade
  const cleanCity = params.city?.replace(/\/$/, '') || params.city
  const slug = `${cleanTrade}-${cleanCity}`

  let page = null
  try {
    const { data } = await supabase
      .from('landing_pages')
      .select(`*, trade:trades(*), city:cities(*), page_customizations(*, tenant:tenants(*))`)
      .eq('slug', slug)
      .single()
    page = data
  } catch {}

  if (!page) page = FALLBACK_PAGES[slug]
  if (!page) notFound()

  let trade = page.trade
  let city = page.city
  if (!trade) trade = FALLBACK_TRADES[cleanTrade]
  if (!city) city = FALLBACK_CITIES[cleanCity]
  if (!trade || !city) notFound()

  const isAvailable = page.status === 'available'
  const customization = page.page_customizations?.[0]
  const tenant = customization?.tenant

  // Get detailed service descriptions based on trade
  const serviceDetails = getServiceDetails(trade.slug)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-slate-900">fachschmiede.de</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:block">{trade.name} in {city.name}</span>
            <a href="#kontakt" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition">
              Anfragen
            </a>
          </div>
        </div>
      </header>

      {/* Rent Banner */}
      {isAvailable && (
        <RentBanner tradeName={trade.name} cityName={city.name} price={page.monthly_price} slug={slug} />
      )}

      {/* Tenant Branding */}
      {tenant && customization && (
        <TenantBranding customization={customization} tenant={tenant} />
      )}

      {/* Hero */}
      <section className="relative bg-slate-900 text-white py-20 md:py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80')] bg-cover bg-center opacity-20"></div>
        <div className="relative max-w-5xl mx-auto">
          <div className="inline-block bg-orange-500 text-white text-sm font-medium px-4 py-1 rounded-full mb-6">
            {city.name} & Umgebung
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight max-w-3xl">
            {customization?.custom_welcome_text || `Ihr ${trade.name} in ${city.name}`}
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl">
            {customization?.custom_welcome_text 
              ? `Willkommen bei ${customization.custom_company_name || tenant.company_name} — Ihr zuverlässiger ${trade.name} in ${city.name} und Umgebung.`
              : `Professionelle ${trade.plural_name} für Privat- und Gewerbekunden in ${city.name} und dem gesamten Umland. Persönlich, fair und zuverlässig.`
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#kontakt" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-xl transition text-lg shadow-lg shadow-orange-500/30 text-center">
              Kostenlos anfragen
            </a>
            <a href="#leistungen" className="bg-white/10 hover:bg-white/20 text-white font-medium py-4 px-8 rounded-xl transition backdrop-blur text-center">
              Leistungen ansehen
            </a>
          </div>
          
          {/* Trust badges */}
          <div className="flex flex-wrap gap-6 mt-12">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              Geprüfte Fachbetriebe
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              Transparente Angebote
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              Lokale Ansprechpartner
            </div>
          </div>
        </div>
      </section>

      {/* Services Detail */}
      <section id="leistungen" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Unsere Leistungen
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Von der Planung bis zur Ausführung — kompetente Betreuung für Ihr Vorhaben in {city.name}.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {serviceDetails.map((service, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-orange-500 hover:shadow-lg transition group">
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:bg-orange-500 group-hover:text-white transition">
                  {service.icon}
                </div>
                <h3 className="font-bold text-xl mb-3">{service.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Service */}
      <section className="bg-red-50 py-16 px-6 border-y border-red-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-lg mb-6 uppercase tracking-wide">
            Notdienst
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Schnelle Hilfe im Notfall
          </h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            Sturmschaden, Wassereinbruch oder andere Notfälle? Wir sind für Sie da — auch außerhalb der regulären Geschäftszeiten.
          </p>
          <a href="#kontakt" className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-xl transition inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Jetzt Notfall melden
          </a>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              So funktioniert's
            </h2>
            <p className="text-slate-600">
              In vier einfachen Schritten zu Ihrer Lösung
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Anfrage',
                desc: 'Rufen Sie an oder nutzen Sie das Kontaktformular. Wir melden uns zeitnah bei Ihnen.',
                icon: '📞'
              },
              {
                step: '02',
                title: 'Besichtigung',
                desc: 'Wir schauen uns die Situation vor Ort an — kostenlos und unverbindlich.',
                icon: '🔍'
              },
              {
                step: '03',
                title: 'Angebot',
                desc: 'Sie erhalten ein transparentes, schriftliches Angebot — ohne versteckte Kosten.',
                icon: '📋'
              },
              {
                step: '04',
                title: 'Ausführung',
                desc: 'Unser Team führt die Arbeiten termingerecht und professionell aus.',
                icon: '✅'
              },
            ].map((item, i) => (
              <div key={i} className="text-center relative">
                <div className="w-20 h-20 bg-white rounded-2xl border-2 border-orange-500 flex items-center justify-center text-3xl mx-auto mb-6 shadow-lg">
                  {item.icon}
                </div>
                <div className="text-sm font-bold text-orange-500 mb-2">{item.step}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Das sagen unsere Kunden
            </h2>
            <p className="text-slate-600">
              Bewertungen aus {city.name} und der Region
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                rating: 5,
                text: `"Schnelle Reaktion nach dem Sturm. Das Team war am selben Tag vor Ort und hat alles professionell abgesichert. Die Abrechnung war fair und transparent."`,
                author: 'Familie Schmidt',
                location: `${city.name} · Sturmreparatur`,
              },
              {
                rating: 5,
                text: `"Kompetente Beratung und saubere Ausführung. Man merkt, dass hier Profis am Werk sind. Werde definitiv wieder auf Sie zurückkommen."`,
                author: 'Peter M.',
                location: `${city.name} · Sanierung`,
              },
              {
                rating: 5,
                text: `"Endlich ein Handwerker, der pünktlich kommt und die vereinbarte Arbeit auch wirklich erledigt. Klare Empfehlung!"`,
                author: 'Monika K.',
                location: `${city.name} · Reparatur`,
              },
            ].map((review, i) => (
              <div key={i} className="bg-slate-50 p-6 rounded-2xl">
                <StarRating rating={review.rating} />
                <p className="text-slate-700 mt-4 mb-6 italic">{review.text}</p>
                <div className="border-t border-slate-200 pt-4">
                  <p className="font-semibold text-sm">{review.author}</p>
                  <p className="text-slate-500 text-xs">{review.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local Area */}
      <section className="py-20 px-6 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Ihr {trade.name} in {city.name} und Umgebung
              </h2>
              <p className="text-slate-400 mb-6">
                Kurze Wege bedeuten schnelle Hilfe. Wir sind in der Region {city.name} ansässig und für Sie da — auch in den umliegenden Gemeinden.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {getNearbyCities(city.name).map((nearCity, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-400 text-sm">
                    <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {nearCity}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 p-8 rounded-2xl">
              <h3 className="font-bold text-lg mb-4">Gut zu wissen</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  <span className="text-slate-300 text-sm">Erstbesichtigung vor Ort ist kostenlos und unverbindlich</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  <span className="text-slate-300 text-sm">Transparente, schriftliche Angebote ohne versteckte Kosten</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  <span className="text-slate-300 text-sm">Fester Ansprechpartner für Ihr Projekt</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  <span className="text-slate-300 text-sm">Gewährleistung auf alle ausgeführten Arbeiten</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="kontakt" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {trade.name} in {city.name} gesucht?
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Füllen Sie das Formular aus — wir melden uns zeitnah bei Ihnen für eine kostenlose Erstberatung.
            </p>
          </div>
          
          <form className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-lg" action={`/api/leads/${page.id || 'fallback'}`} method="POST">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                <input type="text" name="name" placeholder="Max Mustermann" required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">E-Mail *</label>
                <input type="email" name="email" placeholder="max@beispiel.de" required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Telefon</label>
              <input type="tel" name="phone" placeholder="+49 123 456789"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Ihr Anliegen *</label>
              <textarea name="message" placeholder="Beschreiben Sie kurz Ihr Vorhaben oder Problem..." rows={4} required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"></textarea>
            </div>
            <button type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition text-lg shadow-lg shadow-orange-500/30">
              Kostenlose Anfrage senden
            </button>
            <p className="text-xs text-slate-400 text-center mt-4">
              🔒 Ihre Daten werden SSL-verschlüsselt übertragen. Keine Weitergabe an Dritte.
            </p>
          </form>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Häufige Fragen</h2>
          <div className="space-y-4">
            {getFAQ(trade.name).map((faq, i) => (
              <details key={i} className="group bg-white rounded-xl border border-slate-200">
                <summary className="flex justify-between items-center cursor-pointer p-6 font-medium text-slate-900">
                  {faq.q}
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-6 pb-6 text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <Link href="/" className="text-xl font-bold text-white">fachschmiede.de</Link>
              <p className="text-sm mt-1">Wir schmieden deine lokale Präsenz.</p>
            </div>
            {isAvailable && (
              <Link href={`/mieten/${slug}`} className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition">
                Sind Sie {trade.name}? Diese Seite mieten →
              </Link>
            )}
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm">
            <p>© 2026 fachschmiede.de — {trade.name} {city.name}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Helper functions for content
function getServiceDetails(tradeSlug: string) {
  const details: Record<string, Array<{icon: string; title: string; description: string}>> = {
    dachdecker: [
      {
        icon: '🏠',
        title: 'Dachsanierung',
        description: 'Komplette Neueindeckung Ihres Dachs inklusive Unterspannbahn, Lattung und Eindeckung. Wir verwenden hochwertige Materialien führender Hersteller für ein langlebiges Ergebnis.'
      },
      {
        icon: '🔧',
        title: 'Dachreparatur',
        description: 'Undichte Stellen, lose Ziegel oder defekte Dachrinnen — wir beheben Schäden schnell und zuverlässig. Auch nach Sturm und Hagel, auf Wunsch mit Dokumentation für Ihre Versicherung.'
      },
      {
        icon: '❄️',
        title: 'Dachdämmung',
        description: 'Aufsparren-, Zwischensparren- oder Geschossdeckendämmung: Senken Sie Ihre Heizkosten dauerhaft. Wir beraten Sie auch zu aktuellen Fördermöglichkeiten.'
      },
      {
        icon: '🏢',
        title: 'Flachdach',
        description: 'Flachdachsanierung und -neubau mit modernen Abdichtungssystemen. Für Garage, Anbau oder Carport — dicht, langlebig und wartungsarm.'
      },
      {
        icon: '☀️',
        title: 'Solar & PV-Vorbereitung',
        description: 'Wir bereiten Ihr Dach optimal für eine Photovoltaik-Anlage vor. Von der statischen Prüfung bis zur Montage der Unterkonstruktion, abgestimmt mit Ihrem Solarteur.'
      },
      {
        icon: '🚨',
        title: 'Sturm- & Notdienst',
        description: 'Sturm- oder Hagelschaden? Wir sichern Ihr Dach schnellstmöglich ab und kümmern uns um die fachgerechte Instandsetzung — auch außerhalb der regulären Zeiten.'
      },
    ],
    elektriker: [
      {
        icon: '⚡',
        title: 'Elektroinstallation',
        description: 'Komplette Elektroinstallation für Neubau, Renovierung oder Modernisierung. Planung, Installation und Prüfung aus einer Hand nach aktuellen VDE-Bestimmungen.'
      },
      {
        icon: '🔌',
        title: 'Elektroreparatur',
        description: 'Stromausfall, defekte Steckdosen oder Sicherungsprobleme — wir beheben Störungen schnell und sicher. Auch für Notfälle außerhalb der regulären Geschäftszeiten.'
      },
      {
        icon: '🔋',
        title: 'Photovoltaik-Installation',
        description: 'Installation von Solaranlagen und Wechselrichtern inklusive Anmeldung beim Netzbetreiber. Wir beraten Sie zu Fördermöglichkeiten und Eigenverbrauchsoptimierung.'
      },
      {
        icon: '🚗',
        title: 'E-Ladesäulen',
        description: 'Installation von Wallboxen und Ladesäulen für Elektroautos. Inklusive Leistungsberechnung, Sicherheitsprüfung und Anmeldung beim Netzbetreiber.'
      },
      {
        icon: '🏠',
        title: 'Smart Home',
        description: 'Vernetzung von Beleuchtung, Heizung und Sicherheitstechnik. Wir planen und installieren Ihr intelligentes Zuhause nach Ihren Wünschen.'
      },
      {
        icon: '📋',
        title: 'E-Check & Prüfung',
        description: 'Regelmäßige Überprüfung Ihrer elektrischen Anlagen nach VDE 0105. Wir dokumentieren alle Prüfergebnisse für Ihre Sicherheit und Versicherung.'
      },
    ],
    klempner: [
      {
        icon: '🚿',
        title: 'Installation & Sanierung',
        description: 'Professionelle Installation und Sanierung von Sanitäranlagen. Badmodernisierung, Wasserleitungsneuverlegung und Heizungsinstallation aus einer Hand.'
      },
      {
        icon: '🔧',
        title: 'Rohrreinigung & Reparatur',
        description: 'Verstopfte Leitungen, undichte Rohre oder Wasserschäden — wir finden die Ursache und beheben das Problem dauerhaft. Auch mit Kamera-Inspektion.'
      },
      {
        icon: '♨️',
        title: 'Heizungsservice',
        description: 'Installation, Wartung und Reparatur von Heizungsanlagen aller Art. Von der Gasheizung bis zur Wärmepumpe — wir beraten Sie zu effizienten Lösungen.'
      },
      {
        icon: '🚽',
        title: 'Badmodernisierung',
        description: 'Komplette Badrenovierung von der Planung bis zur Fertigstellung. Wir koordinieren alle Gewerke und sorgen für Ihr Traumbad.'
      },
      {
        icon: '💧',
        title: 'Wasseraufbereitung',
        description: 'Installation von Wasserenthärtungsanlagen, Umkehrosmose-Systemen und Filtern. Für besseres Wasser in Ihrem Zuhause.'
      },
      {
        icon: '🚨',
        title: 'Notdienst',
        description: 'Wasserschaden oder Rohrbruch? Unser Notdienst ist rund um die Uhr für Sie da. Schnelle Hilfe bei akuten Wasserschäden.'
      },
    ],
  }

  return details[tradeSlug] || details['dachdecker']
}

function getNearbyCities(cityName: string): string[] {
  // Return generic nearby areas based on city
  return [
    `${cityName}-Mitte`,
    `${cityName}-Nord`,
    `${cityName}-Süd`,
    `${cityName}-Ost`,
    `${cityName}-West`,
    'Umland',
    'Region',
  ]
}

function getFAQ(tradeName: string): Array<{q: string; a: string}> {
  return [
    {
      q: `Wie schnell kann ein ${tradeName} vor Ort sein?`,
      a: 'Bei dringenden Angelegenheiten bemühen wir uns, noch am selben oder spätestens am nächsten Tag vor Ort zu sein. Für planbare Projekte vereinbaren wir gerne einen Termin, der Ihnen passt.'
    },
    {
      q: 'Ist die Erstbesichtigung wirklich kostenlos?',
      a: 'Ja, die Erstbesichtigung vor Ort ist für Sie kostenlos und unverbindlich. Sie erhalten ein transparentes Angebot, ohne dass Ihnen daraus Kosten entstehen.'
    },
    {
      q: 'Wie transparent sind die Preise?',
      a: 'Sie erhalten vor Arbeitsbeginn ein schriftliches, detailliertes Angebot. Es gibt keine versteckten Kosten — was im Angebot steht, zahlen Sie.'
    },
    {
      q: 'Gibt es eine Gewährleistung?',
      a: 'Ja, auf alle ausgeführten Arbeiten gibt es eine gesetzliche Gewährleistung. Zusätzlich bieten wir je nach Projekt auch erweiterte Garantien an.'
    },
    {
      q: 'Arbeiten Sie auch mit Versicherungen zusammen?',
      a: 'Ja, bei Sturm-, Hagel- oder Wasserschäden erstellen wir gerne die erforderliche Dokumentation für Ihre Versicherung und unterstützen Sie beim Schadensmanagement.'
    },
  ]
}
