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
  return Object.keys(FALLBACK_PAGES).map(slug => ({
    slug: slug
  }))
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

  // Try Supabase first, fallback to static data
  let page = null
  try {
    const { data } = await supabase
      .from('landing_pages')
      .select(`*, trade:trades(*), city:cities(*)`)
      .eq('slug', cleanSlug)
      .single()
    page = data
  } catch {
    // Supabase failed, use fallback
  }

  if (!page) {
    page = FALLBACK_PAGES[cleanSlug]
  }

  if (!page) notFound()

  const trade = page.trade || FALLBACK_TRADES[page.trade_id]
  const city = page.city || FALLBACK_CITIES[page.city_id]
  const priceEuro = (page.monthly_price / 100).toFixed(0)

  if (page.status !== 'available') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-4">Diese Seite ist bereits vermietet</h1>
          <p className="text-slate-600 mb-6">
            Diese {trade?.name}-Seite für {city?.name} ist leider nicht mehr verfügbar.
          </p>
          <Link href="/" className="bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition">
            Weitere Seiten entdecken
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-slate-900 text-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">fachschmiede.de</Link>
          <span className="text-sm text-slate-400">Seite mieten</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🚀</div>
          <h1 className="text-4xl font-bold mb-4">Diese Seite mieten</h1>
          <p className="text-xl text-slate-600">
            {trade?.name} in {city?.name} — Sofort online, sofort rankend
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-slate-50 p-8 rounded-xl">
            <h2 className="text-2xl font-bold mb-6">Was Sie bekommen</h2>
            <ul className="space-y-4">
              {[
                '✅ Sofort rankende Seite auf Google',
                '✅ Ihr Firmenlogo & Name',
                '✅ Ihre Telefonnummer & E-Mail',
                '✅ Ihre Adresse & Leistungen',
                '✅ Eigenes Dashboard zum Verwalten',
                '✅ Kunden-Anfragen direkt an Sie',
                '✅ Monatlich kündbar',
              ].map((item, i) => (
                <li key={i} className="text-slate-700">{item}</li>
              ))}
            </ul>

            <div className="mt-8 p-6 bg-white rounded-lg border border-orange-200">
              <p className="text-sm text-slate-500 mb-1">Monatlicher Preis</p>
              <p className="text-4xl font-bold text-orange-600">€{priceEuro}</p>
              <p className="text-sm text-slate-400 mt-2">Monatlich kündbar. Keine Einrichtungsgebühr.</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl border border-slate-200">
            <h2 className="text-2xl font-bold mb-6">Jetzt mieten</h2>
            
            <form action="/api/rent" method="POST" className="space-y-4">
              <input type="hidden" name="landing_page_id" value={page.id || cleanSlug} />
              <input type="hidden" name="slug" value={cleanSlug} />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Firmenname *</label>
                <input type="text" name="company_name" required
                  placeholder="z.B. Müller Dachbau GmbH"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ihr Name *</label>
                <input type="text" name="contact_name" required
                  placeholder="Max Mustermann"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail *</label>
                <input type="email" name="email" required
                  placeholder="max@mueller-dachbau.de"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon *</label>
                <input type="tel" name="phone" required
                  placeholder="+49 123 456789"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                <input type="text" name="address"
                  placeholder="Musterstraße 1, 12345 Musterstadt"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
              </div>

              <div className="pt-4">
                <button type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-lg transition text-lg">
                  🚀 Jetzt mieten für €{priceEuro}/Monat
                </button>
              </div>

              <p className="text-xs text-slate-400 text-center mt-4">
                🔒 SSL-verschlüsselt. Keine versteckten Kosten. Monatlich kündbar.
              </p>
            </form>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Häufige Fragen</h2>
          <div className="space-y-4">
            {[
              { q: 'Wie funktioniert das?', a: 'Sie füllen das Formular aus. Wir aktivieren die Seite sofort mit Ihren Daten. Sie bekommen Zugang zum Dashboard. Fertig.' },
              { q: 'Wie lange dauert es?', a: 'Sofort. Die Seite ist bereits live und rankt. Ihre Daten sind innerhalb von 24h eingebunden.' },
              { q: 'Kann ich kündigen?', a: 'Ja, jederzeit mit 30 Tagen Frist. Keine Bindung, keine Strafe.' },
              { q: 'Was passiert nach der Kündigung?', a: 'Die Seite wird zurückgesetzt und steht wieder zur Miete. Ihre Daten werden gelöscht.' },
            ].map((faq, i) => (
              <div key={i} className="bg-slate-50 p-4 rounded-lg">
                <p className="font-semibold mb-2">{faq.q}</p>
                <p className="text-slate-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="bg-slate-900 text-slate-400 py-8 px-6 text-center text-sm">
        <p>© 2026 fachschmiede.de — Wir schmieden deine lokale Präsenz.</p>
      </footer>
    </div>
  )
}
