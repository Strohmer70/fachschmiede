import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FALLBACK_TRADES, FALLBACK_CITIES, FALLBACK_PAGES } from '@/lib/fallback-data'
import { supabase } from '@/lib/supabase'

interface PageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  return Object.keys(FALLBACK_PAGES).map(slug => ({ slug }))
}

export async function generateMetadata({ params }: PageProps) {
  const cleanSlug = params.slug?.replace(/\/$/, '') || params.slug
  const page = FALLBACK_PAGES[cleanSlug]
  if (!page) return { title: 'Seite nicht gefunden' }
  const trade = FALLBACK_TRADES[page.trade_id]
  const city = FALLBACK_CITIES[page.city_id]
  return {
    title: `Diese Seite mieten — ${trade?.name || 'Handwerker'} in ${city?.name || 'Ihrer Stadt'}`,
  }
}

export default async function RentPage({ params }: PageProps) {
  const cleanSlug = params.slug?.replace(/\/$/, '') || params.slug

  let page = null
  try {
    const { data } = await supabase
      .from('landing_pages')
      .select(`*, trade:trades(*), city:cities(*)`)
      .eq('slug', cleanSlug)
      .single()
    page = data
  } catch {}

  if (!page) page = FALLBACK_PAGES[cleanSlug]
  if (!page) notFound()

  const trade = page.trade || FALLBACK_TRADES[page.trade_id]
  const city = page.city || FALLBACK_CITIES[page.city_id]
  const priceEuro = (page.monthly_price / 100).toFixed(0)

  if (page.status !== 'available') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-4">Diese Seite ist bereits vermietet</h1>
          <p className="text-slate-600 mb-6">
            Diese {trade?.name}-Seite für {city?.name} ist leider nicht mehr verfügbar.
          </p>
          <Link href="/" className="bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition inline-block">
            Weitere Seiten entdecken
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-slate-900">fachschmiede.de</Link>
          <span className="text-sm text-slate-500">Seite mieten</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto py-16 px-6">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-block bg-orange-100 text-orange-700 text-sm font-medium px-4 py-1 rounded-full mb-6">
            Verfügbar in {city?.name}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Diese Seite mieten
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {trade?.name} in {city?.name} — Professionelle Online-Präsenz für Ihr Handwerksbetrieb
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Left: Features */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold mb-6">Was Sie bekommen</h2>
            
            <div className="space-y-4">
              {[
                {
                  icon: '🚀',
                  title: 'Sofort online',
                  desc: 'Die Seite ist bereits live und rankt auf Google. Keine Wartezeit, keine Entwicklung.'
                },
                {
                  icon: '🎨',
                  title: 'Ihr Branding',
                  desc: 'Ihr Firmenlogo, Name, Telefonnummer, E-Mail, Adresse und WhatsApp — prominent platziert.'
                },
                {
                  icon: '📍',
                  title: 'Google Maps Integration',
                  desc: 'Ihr Standort wird auf einer interaktiven Karte angezeigt — Kunden finden Sie sofort.'
                },
                {
                  icon: '📱',
                  title: 'Mobil optimiert',
                  desc: 'Die Seite funktioniert perfekt auf Smartphones, Tablets und Desktop-Computern.'
                },
                {
                  icon: '📊',
                  title: 'Eigenes Dashboard',
                  desc: 'Verwalten Sie Ihre Seite, sehen Sie Besucherzahlen und verwalten Sie Kundenanfragen.'
                },
                {
                  icon: '📧',
                  title: 'Lead-Erfassung',
                  desc: 'Kundenanfragen kommen direkt an Sie — per E-Mail oder in Ihrem Dashboard.'
                },
                {
                  icon: '🔄',
                  title: 'Monatlich kündbar',
                  desc: 'Keine langfristige Bindung. Jederzeit mit 30 Tagen Frist kündbar.'
                },
              ].map((feature, i) => (
                <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="text-2xl">{feature.icon}</div>
                  <div>
                    <h3 className="font-bold text-slate-900">{feature.title}</h3>
                    <p className="text-slate-600 text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Box */}
            <div className="mt-8 p-6 bg-orange-50 rounded-xl border border-orange-200">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-sm text-slate-600">Monatlicher Preis</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-orange-600">€{priceEuro}</span>
                <span className="text-slate-500">/Monat</span>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Keine Einrichtungsgebühr. Keine versteckten Kosten. Monatlich kündbar.
              </p>
            </div>

            {/* FAQ */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Häufige Fragen</h2>
              <div className="space-y-4">
                {[
                  {
                    q: 'Wie funktioniert das Mieten?',
                    a: 'Sie füllen das Formular aus. Wir aktivieren die Seite sofort mit Ihren Daten. Sie bekommen Zugang zum Dashboard. Fertig.'
                  },
                  {
                    q: 'Wie lange dauert die Aktivierung?',
                    a: 'Die Seite ist bereits live. Ihre Daten sind innerhalb von 24 Stunden eingebunden.'
                  },
                  {
                    q: 'Kann ich die Seite später anpassen?',
                    a: 'Ja, über Ihr Dashboard können Sie Texte, Kontaktdaten und Bilder jederzeit ändern.'
                  },
                  {
                    q: 'Was passiert nach der Kündigung?',
                    a: 'Die Seite wird zurückgesetzt und steht wieder zur Miete. Ihre Daten werden gelöscht.'
                  },
                ].map((faq, i) => (
                  <details key={i} className="group bg-slate-50 rounded-xl">
                    <summary className="flex justify-between items-center cursor-pointer p-4 font-medium text-slate-900">
                      {faq.q}
                      <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="px-4 pb-4 text-slate-600 text-sm">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
              <h2 className="text-xl font-bold mb-6">Jetzt mieten</h2>
              
              <form action="/api/rent" method="POST" className="space-y-4">
                <input type="hidden" name="landing_page_id" value={page.id || cleanSlug} />
                <input type="hidden" name="slug" value={cleanSlug} />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Firmenname *</label>
                  <input type="text" name="company_name" required
                    placeholder="z.B. Müller Dachbau GmbH"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ansprechpartner *</label>
                  <input type="text" name="contact_name" required
                    placeholder="Max Mustermann"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail *</label>
                  <input type="email" name="email" required
                    placeholder="max@firma.de"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefon *</label>
                  <input type="tel" name="phone" required
                    placeholder="+49 123 456789"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                  <input type="text" name="address"
                    placeholder="Musterstraße 1, 12345 Stadt"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    WhatsApp-Nummer <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input type="tel" name="whatsapp"
                    placeholder="+49 123 456789"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                  <p className="text-xs text-slate-400 mt-1">Kunden können Sie direkt über WhatsApp kontaktieren.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Google Maps Place ID <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input type="text" name="place_id"
                    placeholder="ChIJ..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                  <p className="text-xs text-slate-400 mt-1">
                    <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                      Place ID hier finden →
                    </a>
                  </p>
                </div>

                <div className="pt-2">
                  <button type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition text-lg shadow-lg shadow-orange-500/30">
                    🚀 Jetzt mieten für €{priceEuro}/Monat
                  </button>
                </div>

                <p className="text-xs text-slate-400 text-center">
                  🔒 SSL-verschlüsselt. Keine versteckten Kosten.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 text-center text-sm">
        <p>© 2026 fachschmiede.de — Wir schmieden deine lokale Präsenz.</p>
      </footer>
    </div>
  )
}
