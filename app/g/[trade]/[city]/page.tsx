import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { RentBanner } from '@/components/RentBanner'
import { TenantBranding } from '@/components/TenantBranding'

interface PageProps {
  params: {
    trade: string
    city: string
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { data: page } = await supabase
    .from('landing_pages')
    .select('title, meta_description, status, page_customizations(custom_company_name)')
    .eq('slug', `${params.trade}-${params.city}`)
    .single()

  if (!page) return { title: 'Seite nicht gefunden' }

  const companyName = page.page_customizations?.[0]?.custom_company_name
  const title = companyName 
    ? `${page.title} — ${companyName}` 
    : page.title

  return {
    title,
    description: page.meta_description,
  }
}

export default async function LandingPage({ params }: PageProps) {
  const { data: page } = await supabase
    .from('landing_pages')
    .select(`
      *,
      trade:trades(*),
      city:cities(*),
      page_customizations(*, tenant:tenants(*))
    `)
    .eq('slug', `${params.trade}-${params.city}`)
    .single()

  if (!page) notFound()

  const trade = page.trade as any
  const city = page.city as any
  const services = trade.services || []
  const isAvailable = page.status === 'available'
  const customization = page.page_customizations?.[0]
  const tenant = customization?.tenant

  // Increment page views (fire and forget)
  supabase.from('landing_pages').update({ page_views: (page.page_views || 0) + 1 }).eq('id', page.id).then(() => {})

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-slate-900 text-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">fachschmiede.de</Link>
          <span className="text-sm text-slate-400">Lokale Handwerker finden</span>
        </div>
      </header>

      {/* Miet-mich Banner (only if available) */}
      {isAvailable && (
        <RentBanner 
          tradeName={trade.name} 
          cityName={city.name} 
          price={page.monthly_price} 
          slug={page.slug}
        />
      )}

      {/* Tenant Branding (if rented) */}
      {tenant && customization && (
        <TenantBranding customization={customization} tenant={tenant} />
      )}

      {/* Hero */}
      <section className="bg-slate-900 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {customization?.custom_welcome_text || page.h1}
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            {customization?.custom_welcome_text 
              ? `Willkommen bei ${customization.custom_company_name || tenant.company_name} — Ihr ${trade.name} in ${city.name}.`
              : `Sie suchen einen zuverlässigen ${trade.name} in ${city.name}? Wir verbinden Sie mit erfahrenen Fachbetrieben aus Ihrer Region.`
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#kontakt" 
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition"
            >
              Jetzt anfragen
            </a>
            <a 
              href="#leistungen" 
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-8 rounded-lg transition"
            >
              Unsere Leistungen
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="leistungen" className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            {customization?.custom_company_name || trade.name}-Leistungen in {city.name}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(customization?.custom_services || services).map((service: string, i: number) => (
              <div key={i} className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mb-4">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-lg mb-2">{service}</h3>
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
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Direkt kontaktieren</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {customization?.custom_phone && (
                <div>
                  <div className="text-4xl mb-4">📞</div>
                  <h3 className="font-semibold mb-2">Telefon</h3>
                  <a href={`tel:${customization.custom_phone}`} className="text-orange-600 hover:text-orange-700 text-lg">
                    {customization.custom_phone}
                  </a>
                </div>
              )}
              {customization?.custom_email && (
                <div>
                  <div className="text-4xl mb-4">✉️</div>
                  <h3 className="font-semibold mb-2">E-Mail</h3>
                  <a href={`mailto:${customization.custom_email}`} className="text-orange-600 hover:text-orange-700">
                    {customization.custom_email}
                  </a>
                </div>
              )}
              {customization?.custom_address && (
                <div>
                  <div className="text-4xl mb-4">📍</div>
                  <h3 className="font-semibold mb-2">Adresse</h3>
                  <p className="text-slate-600">{customization.custom_address}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Why Us */}
      <section className="bg-slate-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Warum {city.name}er {trade.plural_name} wählen?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="font-semibold mb-2">Schnelle Reaktion</h3>
              <p className="text-slate-600">Durchschnittlich 24h bis zur ersten Begehung</p>
            </div>
            <div>
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="font-semibold mb-2">Qualitätsgarantie</h3>
              <p className="text-slate-600">5 Jahre Gewährleistung auf alle Arbeiten</p>
            </div>
            <div>
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-semibold mb-2">Faire Preise</h3>
              <p className="text-slate-600">Transparente Kosten, keine versteckten Gebühren</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="kontakt" className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            {trade.name} in {city.name} gesucht?
          </h2>
          <p className="text-slate-600 mb-8">
            Füllen Sie das Formular aus – wir verbinden Sie mit dem besten {trade.name} in Ihrer Nähe.
          </p>
          <form className="space-y-4 text-left" action={`/api/leads/${page.id}`} method="POST">
            <div className="grid md:grid-cols-2 gap-4">
              <input 
                type="text" 
                name="name"
                placeholder="Name" 
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input 
                type="email" 
                name="email"
                placeholder="E-Mail" 
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <input 
              type="tel" 
              name="phone"
              placeholder="Telefon" 
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <textarea 
              name="message"
              placeholder="Beschreiben Sie Ihr Vorhaben..." 
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button 
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition"
            >
              Kostenlose Anfrage senden
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 text-center text-sm">
        <p>© 2026 fachschmiede.de — {trade.name} {city.name}</p>
        {isAvailable && (
          <p className="mt-2">
            <Link href={`/mieten/${page.slug}`} className="text-orange-400 hover:text-orange-300">
              Sind Sie {trade.name}? Diese Seite mieten →
            </Link>
          </p>
        )}
      </footer>
    </div>
  )
}
