import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
// @ts-ignore
import articleIndex from '@/lib/article-index.json'

interface PageProps {
  params: {
    trade: string
    city: string
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TRADE_SLUG_MAP: Record<string, string> = {
  'klempner': 'shk',
}

function getDbTradeSlug(tradeSlug: string): string {
  return TRADE_SLUG_MAP[tradeSlug] || tradeSlug
}

export async function generateMetadata({ params }: PageProps) {
  const cleanTrade = params.trade?.replace(/\/$/, '') || params.trade
  const cleanCity = params.city?.replace(/\/$/, '') || params.city
  return {
    title: `${capitalize(cleanTrade)} ${capitalize(cleanCity)} | Professionelle Leistungen vor Ort`,
    description: `Professionelle ${capitalize(cleanTrade)}-Leistungen in ${capitalize(cleanCity)}. Kostenlose Besichtigung & Festpreis-Angebot.`,
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')
}

export default async function LandingPage({ params }: PageProps) {
  const cleanTrade = params.trade?.replace(/\/$/, '') || params.trade
  const cleanCity = params.city?.replace(/\/$/, '') || params.city
  const dbTradeSlug = getDbTradeSlug(cleanTrade)
  const slug = `${dbTradeSlug}-${cleanCity}`

  // Load from Supabase
  let page: any = null
  let trade: any = null
  let city: any = null
  let customization: any = null
  let tenant: any = null

  try {
    const { data } = await supabaseAdmin
      .from('landing_pages')
      .select(`*, trade:trades(*), city:cities(*), page_customizations(*, tenant:tenants(*))`)
      .eq('slug', slug)
      .single()
    
    if (data) {
      page = data
      trade = data.trade
      city = data.city
      customization = data.page_customizations?.[0]
      tenant = customization?.tenant
    }
  } catch (err) {
    console.log('Supabase error:', err)
  }

  if (!page) {
    // Try without DB slug mapping
    try {
      const { data } = await supabaseAdmin
        .from('landing_pages')
        .select(`*, trade:trades(*), city:cities(*), page_customizations(*, tenant:tenants(*))`)
        .eq('slug', `${cleanTrade}-${cleanCity}`)
        .single()
      
      if (data) {
        page = data
        trade = data.trade
        city = data.city
        customization = data.page_customizations?.[0]
        tenant = customization?.tenant
      }
    } catch (err) {
      console.log('Supabase error 2:', err)
    }
  }

  if (!page || !trade || !city) notFound()

  const isAvailable = page.status === 'available'
  const isRented = !!tenant
  const monthlyPrice = page.monthly_price || 149

  // Get services from trade data
  const services = trade.services || []
  const heroImage = trade.hero_image || '/images/hero.jpg'
  const tradeName = trade.name
  const cityName = city.name

  return (
    <div className="min-h-screen bg-white text-ink-800 antialiased">
      {/* ═══════════ HEADER ═══════════ */}
      <header className="bg-white/95 backdrop-blur border-b border-ink-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
          <Link href={`/${cleanTrade}/${cleanCity}/`} className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-8 9 8M5 10v10h14V10"/>
              </svg>
            </span>
            <span className="leading-tight">
              <span className="block font-extrabold text-lg text-ink-900">{tenant?.company_name || `${tradeName} ${cityName}`}</span>
              <span className="block text-xs text-ink-500 font-medium">{tradeName} · {cityName}{isAvailable && ' · noch frei'}</span>
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-ink-600">
            <a href="#leistungen" className="hover:text-brand-600 transition">Leistungen</a>
            <a href="#ueber-uns" className="hover:text-brand-600 transition">Über uns</a>
            <a href="#faq" className="hover:text-brand-600 transition">FAQ</a>
            <a href="#kontakt" className="hover:text-brand-600 transition">Kontakt</a>
          </nav>
          <a href="#kontakt" className="hidden sm:inline-flex bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition shadow-sm">
            {isRented ? 'Angebot anfragen' : 'Jetzt anfragen'}
          </a>
        </div>
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-[86vh] flex items-center">
        <img 
          src={heroImage} 
          alt={`${tradeName} bei der Arbeit`} 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{background: 'linear-gradient(105deg,rgba(15,23,42,.92) 0%,rgba(15,23,42,.75) 45%,rgba(15,23,42,.35) 100%)'}} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-white">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 bg-white/10 border border-white/25 backdrop-blur rounded-full px-4 py-1.5 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              {tradeName} in {cityName} – kostenlose Besichtigung
            </p>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
              {tradeName} in {cityName}.<br />
              <span className="text-brand-400">Festpreis. Feste Termine.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-200 leading-relaxed max-w-xl">
              Professionelle Leistungen aus einer Hand – persönlich, sauber und zuverlässig. 
              Für Privat- und Geschäftskunden in {cityName} und Umgebung.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a href="#kontakt" className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition shadow-lg shadow-brand-600/30">
                Kostenlose Besichtigung anfragen
              </a>
              <a href="#leistungen" className="inline-flex justify-center items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur text-white font-bold px-8 py-4 rounded-xl text-lg transition">
                Leistungen ansehen
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ VERFÜGBARKEITS-BANNER (MIET-MODELL) ═══════════ */}
      {isAvailable && (
        <section className="bg-brand-50 border-y border-brand-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2">
              <p className="font-black text-ink-900 text-lg">Diese Website ist eine Miet-Website – und für {cityName} noch frei.</p>
              <p className="mt-2 text-ink-600 text-sm leading-relaxed">
                Sie steht heute neutral im Netz und kann sofort angemietet werden: Dein Firmenname, deine Kontaktdaten, deine Leistungen – fertig individualisiert in wenigen Minuten. Alle Texte auf dieser Seite sind für <strong>{cityName}</strong> individuell formuliert; jede unserer Stadt-Websites erhält eine eigene Textfassung, damit Google sie als eigenständig wertet. Pro Stadt vergeben wir die Seite nur <strong>einmal</strong>.
              </p>
            </div>
            <div className="lg:text-right">
              <Link href={`/mieten?gewerk=${cleanTrade}&stadt=${cleanCity}`} className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-4 rounded-xl transition shadow-lg shadow-brand-600/25">
                Jetzt für {cityName} sichern →
              </Link>
              <p className="mt-2 text-xs text-ink-500">ab {monthlyPrice} €/Monat · Self-Check-in · sofort online · monatlich kündbar</p>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ LEISTUNGEN ═══════════ */}
      <section id="leistungen" className="py-20 sm:py-28 bg-ink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-brand-600 font-bold text-sm uppercase tracking-widest">Leistungen</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">
              Alles rund ums Thema {tradeName} in {cityName}
            </h2>
            <p className="mt-4 text-ink-600 text-lg">
              Professionelle {tradeName}-Leistungen mit kostenloser Besichtigung und Festpreis-Angebot.
            </p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service: string, i: number) => (
              <div key={i} className="bg-white rounded-2xl p-7 border border-ink-200 hover:shadow-xl hover:-translate-y-1 transition duration-300">
                <span className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center text-2xl">
                  {getServiceIcon(i)}
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink-900">{service}</h3>
                <p className="mt-2 text-ink-600 text-sm leading-relaxed">
                  Professionelle {service} in {cityName} und Umgebung. Kostenlose Besichtigung vor Ort.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ ÜBER UNS / STADT ═══════════ */}
      <section id="ueber-uns" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-brand-600 font-bold text-sm uppercase tracking-widest">Über uns</p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">
                Ihr {tradeName} in {cityName}
              </h2>
              <p className="mt-4 text-ink-600 leading-relaxed">
                {cityName} mit seinen {city.einwohner?.toLocaleString() || 'vielen'} Einwohnern hat einen besonderen Bedarf an qualifizierten {trade.plural_name || tradeName}. Wir kennen die Region und bieten maßgeschneiderte Lösungen.
              </p>
              <div className="mt-8 bg-brand-50 border border-brand-200 rounded-2xl p-6">
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
                      <svg className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-ink-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="bg-ink-900 rounded-2xl p-8 text-white">
              <h3 className="text-xl font-bold mb-4">Unser Versprechen</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <span className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">1</span>
                  <div>
                    <p className="font-bold">Kostenlose Besichtigung</p>
                    <p className="text-sm text-ink-300">Wir kommen vorbei und analysieren Ihr Projekt – kostenlos und unverbindlich.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">2</span>
                  <div>
                    <p className="font-bold">Festpreis-Angebot</p>
                    <p className="text-sm text-ink-300">Sie erhalten ein schriftliches Angebot mit Festpreis – keine versteckten Kosten.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">3</span>
                  <div>
                    <p className="font-bold">Termingerechte Ausführung</p>
                    <p className="text-sm text-ink-300">Wir halten unsere Termine ein und arbeiten sauber, schnell und zuverlässig.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="py-20 sm:py-28 bg-ink-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-brand-600 font-bold text-sm uppercase tracking-widest">FAQ</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">Häufige Fragen</h2>
          </div>
          <div className="space-y-4">
            {getFAQ(tradeName).map((faq, i) => (
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

      {/* ═══════════ KONTAKT ═══════════ */}
      <section id="kontakt" className="py-20 sm:py-28 bg-ink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <p className="text-brand-600 font-bold text-sm uppercase tracking-widest">Kontakt</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">
              Kostenlose Besichtigung in {cityName} anfragen
            </h2>
            <p className="mt-4 text-ink-600 leading-relaxed">
              Beschreiben Sie kurz Ihr Anliegen – Sie erhalten zeitnah einen Terminvorschlag und danach ein schriftliches Festpreis-Angebot.
            </p>
            
            {isAvailable && (
              <div className="mt-8 bg-brand-50 border border-brand-200 rounded-2xl p-6">
                <p className="font-black text-ink-900">⚡ Diese Seite ist noch frei</p>
                <p className="mt-1.5 text-sm text-ink-600 leading-relaxed">
                  {tradeName} aus {cityName} oder Umgebung? Miete diese Website und erscheine mit deinem Firmennamen genau hier – inklusive deiner Rufnummer, WhatsApp und Google-Maps-Standort.
                </p>
                <Link href={`/mieten?gewerk=${cleanTrade}&stadt=${cleanCity}`} className="mt-4 inline-block bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-6 py-3 rounded-lg transition">
                  Seite anmieten →
                </Link>
              </div>
            )}

            {isRented && tenant && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href={`tel:${tenant.phone || '+491234567890'}`} className="text-ink-700 hover:text-brand-600 font-semibold">
                    {tenant.phone || '+49 123 4567890'}
                  </a>
                </div>
                {tenant.email && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href={`mailto:${tenant.email}`} className="text-ink-700 hover:text-brand-600 font-semibold">
                      {tenant.email}
                    </a>
                  </div>
                )}
                {tenant.address && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <circle cx="12" cy="11" r="3" />
                    </svg>
                    <span className="text-ink-700">{tenant.address}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="lg:col-span-3">
            <form className="bg-white rounded-2xl shadow-lg border border-ink-100 p-7 sm:p-10">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-ink-800 mb-1.5">Ihr Name *</label>
                  <input type="text" required placeholder="Max Mustermann" className="w-full rounded-lg border border-ink-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ink-800 mb-1.5">Telefon *</label>
                  <input type="tel" required placeholder="0…" className="w-full rounded-lg border border-ink-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                </div>
              </div>
              <div className="mt-5">
                <label className="block text-sm font-bold text-ink-800 mb-1.5">Worum geht es? *</label>
                <select required className="w-full rounded-lg border border-ink-200 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent">
                  <option value="">Bitte auswählen …</option>
                  {services.map((s: string, i: number) => (
                    <option key={i}>{s}</option>
                  ))}
                  <option>Sonstiges</option>
                </select>
              </div>
              <div className="mt-5">
                <label className="block text-sm font-bold text-ink-800 mb-1.5">Ihre Nachricht *</label>
                <textarea rows={4} required placeholder="Beschreiben Sie kurz Ihr Anliegen …" className="w-full rounded-lg border border-ink-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
              </div>
              <label className="mt-5 flex items-start gap-3 text-sm text-ink-600">
                <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
                <span>Ich bin mit der Verarbeitung meiner Daten zur Bearbeitung der Anfrage einverstanden. *</span>
              </label>
              <button type="submit" className="mt-7 w-full bg-brand-600 hover:bg-brand-700 text-white font-black text-lg py-4 rounded-xl transition shadow-lg shadow-brand-600/25">
                Besichtigung anfragen
              </button>
            </form>
          </div>
        </div>

        {/* ═══════════ KARTE ═══════════ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
          <div className="rounded-2xl overflow-hidden border border-ink-200 shadow-lg bg-white">
            <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-ink-100">
              <p className="font-bold text-ink-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <circle cx="12" cy="11" r="3" />
                </svg>
                Einsatzgebiet {cityName}
              </p>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cityName)}`} target="_blank" rel="noopener" className="text-sm font-bold text-brand-600 hover:underline">
                In Google Maps öffnen →
              </a>
            </div>
            <iframe 
              title={`Karte ${cityName}`} 
              src={`https://www.google.com/maps?q=${encodeURIComponent(cityName)}&z=12&output=embed`} 
              className="w-full h-80 border-0" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade" 
            />
            {isAvailable && (
              <p className="px-6 py-3 text-xs text-ink-400 italic">
                Demo-Karte. Nach der Anmietung wird hier der echte Firmenstandort des Mieters (Google Maps Place ID) eingebunden.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-ink-900 text-ink-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid sm:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-8 9 8M5 10v10h14V10" />
                </svg>
              </span>
              <span className="leading-tight">
                <span className="block font-extrabold text-white">{tenant?.company_name || `${tradeName} ${cityName}`}</span>
                <span className="block text-xs text-ink-400">{isAvailable ? 'Miet-Website · noch frei' : 'Ihr Partner vor Ort'}</span>
              </span>
            </div>
            <p className="mt-4 text-sm">Professionelle {tradeName}-Leistungen in {cityName} und Umgebung.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Rechtliches</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/impressum" className="hover:text-brand-400 transition">Impressum</Link></li>
              <li><Link href="/datenschutz" className="hover:text-brand-400 transition">Datenschutz</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Kontakt</h4>
            {isRented && tenant ? (
              <ul className="space-y-2 text-sm">
                <li>{tenant.phone || '+49 123 4567890'}</li>
                <li>{tenant.email || 'hello@fachschmiede.de'}</li>
              </ul>
            ) : (
              <ul className="space-y-2 text-sm">
                <li>hello@fachschmiede.de</li>
                <li><Link href={`/mieten?gewerk=${cleanTrade}&stadt=${cleanCity}`} className="text-brand-400 hover:underline">Seite anmieten →</Link></li>
              </ul>
            )}
          </div>
        </div>
        <div className="border-t border-ink-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm">
            © 2026 fachschmiede.de — Alle Rechte vorbehalten.
            {isAvailable && (
              <span className="block mt-2 text-ink-500">
                Diese Website steht zur Miete. <Link href={`/mieten?gewerk=${cleanTrade}&stadt=${cleanCity}`} className="text-brand-400 hover:underline">Jetzt sichern →</Link>
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* ═══════════ WHATSAPP BUTTON ═══════════ */}
      {isRented && tenant?.phone && (
        <a 
          href={`https://wa.me/${tenant.phone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center text-white transition hover:scale-110"
          aria-label="WhatsApp"
        >
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </div>
  )
}

function getServiceIcon(index: number): string {
  const icons = ['🏠', '🔧', '🌡️', '🪟', '🚨', '🧹', '⚡', '🚗', '✅', '💡', '🔥', '🚿', '💧', '🌳', '🎨', '🖌️', '📜', '🏗️', '🎭', '🏡']
  return icons[index % icons.length]
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
