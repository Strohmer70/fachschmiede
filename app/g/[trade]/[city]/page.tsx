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

  const services = trade.services || []
  const isAvailable = page.status === 'available'
  const customization = page.page_customizations?.[0]
  const tenant = customization?.tenant

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-slate-900">fachschmiede.de</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{trade.name} in {city.name}</span>
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
      <section className="relative bg-slate-900 text-white py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80')] bg-cover bg-center opacity-20"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-block bg-orange-500 text-white text-sm font-medium px-4 py-1 rounded-full mb-6">
            {city.name}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {customization?.custom_welcome_text || `${trade.name} in ${city.name}`}
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            {customization?.custom_welcome_text 
              ? `Willkommen bei ${customization.custom_company_name || tenant.company_name} — Ihr ${trade.name} in ${city.name}.`
              : `Professionelle ${trade.plural_name} für Ihr Projekt in ${city.name} und Umgebung. Zuverlässig, fair und vor Ort.`
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#kontakt" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-xl transition text-lg shadow-lg shadow-orange-500/30">
              Kostenlos anfragen
            </a>
            <a href="#leistungen" className="bg-white/10 hover:bg-white/20 text-white font-medium py-4 px-8 rounded-xl transition backdrop-blur">
              Leistungen ansehen
            </a>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-slate-50 py-8 px-6 border-b border-slate-200">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-8 items-center">
          <div className="flex items-center gap-2 text-slate-600">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            <span className="text-sm font-medium">Geprüfte Fachbetriebe</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            <span className="text-sm font-medium">Schnelle Reaktionszeit</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            <span className="text-sm font-medium">Transparente Preise</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            <span className="text-sm font-medium">Lokale Ansprechpartner</span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="leistungen" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {customization?.custom_company_name || trade.name}-Leistungen in {city.name}
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Von der Planung bis zur Ausführung — kompetente Betreuung für Ihr Vorhaben.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(customization?.custom_services || services).map((service: string, i: number) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 hover:border-orange-500 hover:shadow-lg transition group">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mb-4 group-hover:bg-orange-500 group-hover:text-white transition">
                  <span className="text-lg font-bold">{i + 1}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{service}</h3>
                <p className="text-slate-600 text-sm">
                  Professionelle {service} durch erfahrene {trade.plural_name} in {city.name} und Umgebung.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info (if rented) */}
      {tenant && (
        <section className="bg-orange-50 py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-10">Direkt kontaktieren</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {customization?.custom_phone && (
                <a href={`tel:${customization.custom_phone}`} className="bg-white p-6 rounded-xl border border-slate-200 hover:border-orange-500 hover:shadow-lg transition text-center group">
                  <div className="text-4xl mb-4">📞</div>
                  <h3 className="font-semibold mb-2">Telefon</h3>
                  <p className="text-orange-600 group-hover:text-orange-700">{customization.custom_phone}</p>
                </a>
              )}
              {customization?.custom_email && (
                <a href={`mailto:${customization.custom_email}`} className="bg-white p-6 rounded-xl border border-slate-200 hover:border-orange-500 hover:shadow-lg transition text-center group">
                  <div className="text-4xl mb-4">✉️</div>
                  <h3 className="font-semibold mb-2">E-Mail</h3>
                  <p className="text-orange-600 group-hover:text-orange-700">{customization.custom_email}</p>
                </a>
              )}
              {customization?.custom_address && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 text-center">
                  <div className="text-4xl mb-4">📍</div>
                  <h3 className="font-semibold mb-2">Adresse</h3>
                  <p className="text-slate-600">{customization.custom_address}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose */}
      <section className="py-20 px-6 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Warum {city.name}er {trade.plural_name} wählen?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                ⚡
              </div>
              <h3 className="font-bold text-xl mb-3">Schnelle Reaktion</h3>
              <p className="text-slate-400">
                Kurze Reaktionszeiten für Ihre Anfragen. Vor-Ort-Termine in der Regel innerhalb weniger Tage.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                🛡️
              </div>
              <h3 className="font-bold text-xl mb-3">Qualität & Garantie</h3>
              <p className="text-slate-400">
                Professionelle Ausführung nach aktuellen Standards. Gewährleistung auf alle Arbeiten.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                💰
              </div>
              <h3 className="font-bold text-xl mb-3">Faire Preise</h3>
              <p className="text-slate-400">
                Transparente Kosten. Festpreisangebote vor Arbeitsbeginn. Keine versteckten Gebühren.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="kontakt" className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {trade.name} in {city.name} gesucht?
            </h2>
            <p className="text-slate-600">
              Füllen Sie das Formular aus – wir verbinden Sie mit einem passenden Fachbetrieb in Ihrer Region.
            </p>
          </div>
          
          <form className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg" action={`/api/leads/${page.id || 'fallback'}`} method="POST">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input type="text" name="name" placeholder="Max Mustermann" required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail *</label>
                <input type="email" name="email" placeholder="max@beispiel.de" required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
              <input type="tel" name="phone" placeholder="+49 123 456789"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">Ihr Anliegen *</label>
              <textarea name="message" placeholder="Beschreiben Sie kurz Ihr Vorhaben..." rows={4} required
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

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <Link href="/" className="text-xl font-bold text-white">fachschmiede.de</Link>
              <p className="text-sm mt-1">Wir schmieden deine lokale Präsenz.</p>
            </div>
            {isAvailable && (
              <Link href={`/mieten/${slug}`} className="text-orange-400 hover:text-orange-300 text-sm">
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
