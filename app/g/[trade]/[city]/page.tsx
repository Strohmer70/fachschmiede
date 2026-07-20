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

  const isAvailable = page.status === 'available'
  const customization = page.page_customizations?.[0]
  const tenant = customization?.tenant
  const isRented = !!tenant

  const services = getServices(trade.slug)
  const cities = getNearbyCities(city.name)
  const reviews = getReviews(city.name, trade.name)
  const articles = getArticles(trade.name)
  const faqs = getFAQ(trade.name)

  return (
    <div className="bg-white text-slate-800 antialiased">
      <style jsx global>{`
        .reveal { opacity: 0; transform: translateY(24px); transition: opacity .7s ease, transform .7s ease; }
        .reveal.visible { opacity: 1; transform: none; }
        .hero-gradient { background: linear-gradient(105deg, rgba(15,23,42,.92) 0%, rgba(15,23,42,.75) 45%, rgba(15,23,42,.35) 100%); }
        ::selection { background: #f97316; color: #fff; }
      `}</style>

      {/* Rent Banner (if available) */}
      {isAvailable && (
        <RentBanner tradeName={trade.name} cityName={city.name} price={page.monthly_price} slug={slug} />
      )}

      {/* Tenant Branding (if rented) */}
      {tenant && customization && (
        <TenantBranding customization={customization} tenant={tenant} />
      )}

      {/* ═══════════ HEADER ═══════════ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-8 9 8M5 10v10h14V10"></path></svg>
            </span>
            <span className="leading-tight">
              <span className="block font-extrabold text-lg text-slate-900">fachschmiede.de</span>
              <span className="block text-xs text-slate-500 font-medium">{trade.name} · {city.name}</span>
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a className="hover:text-orange-600 transition" href="#leistungen">Leistungen</a>
            <a className="hover:text-orange-600 transition" href="#ueber-uns">Über uns</a>
            <a className="hover:text-orange-600 transition" href="#ablauf">Ablauf</a>
            <a className="hover:text-orange-600 transition" href="#bewertungen">Bewertungen</a>
            <a className="hover:text-orange-600 transition" href="#faq">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            {customization?.custom_phone && (
              <a className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-800 hover:text-orange-600 transition" href={`tel:${customization.custom_phone}`}>
                <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.2a1 1 0 01.95.68l1.2 3.6a1 1 0 01-.27 1.06l-1.6 1.6a12.05 12.05 0 005.58 5.58l1.6-1.6a1 1 0 011.06-.27l3.6 1.2a1 1 0 01.68.95V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 6V3z"></path></svg>
                {customization.custom_phone}
              </a>
            )}
            <a className="hidden sm:inline-flex bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition shadow-sm" href="#kontakt">Angebot anfragen</a>
          </div>
        </div>
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section id="start" className="relative min-h-[92vh] flex items-center">
        <img src={getHeroImage(trade.slug)} alt={`${trade.name} in ${city.name}`} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 hero-gradient"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="max-w-2xl text-white">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/25 backdrop-blur text-xs sm:text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
              {isRented ? (customization?.custom_company_name || tenant?.company_name) : `${trade.name} aus ${city.name}`}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
              Ihr {trade.name}<br />in <span className="text-orange-400">{city.name}</span>.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-100 leading-relaxed max-w-xl">
              Professionelle {trade.plural_name} für Privat- und Geschäftskunden in {city.name} und Umgebung. Persönlich, sauber und zuverlässig.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a className="inline-flex justify-center items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition shadow-lg" href="#kontakt">
                Kostenloses Angebot
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </a>
              {customization?.custom_phone && (
                <a className="inline-flex justify-center items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur text-white font-bold px-8 py-4 rounded-xl text-lg transition" href={`tel:${customization.custom_phone}`}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.2a1 1 0 01.95.68l1.2 3.6a1 1 0 01-.27 1.06l-1.6 1.6a12.05 12.05 0 005.58 5.58l1.6-1.6a1 1 0 011.06-.27l3.6 1.2a1 1 0 01.68.95V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 6V3z"></path></svg>
                  {customization.custom_phone}
                </a>
              )}
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-slate-100">
              <span className="flex items-center gap-2"><svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg> Kostenlose Erstberatung</span>
              <span className="flex items-center gap-2"><svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg> Transparente Angebote</span>
              <span className="flex items-center gap-2"><svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg> Schnelle Terminvergabe</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ VERTRAUENSLEISTE ═══════════ */}
      <section className="bg-slate-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div><p className="text-2xl sm:text-3xl font-black text-orange-400">Komplettservice</p><p className="mt-1 text-sm text-slate-300 font-medium">Alle Leistungen aus einer Hand</p></div>
          <div><p className="text-2xl sm:text-3xl font-black text-orange-400">Regional</p><p className="mt-1 text-sm text-slate-300 font-medium">{city.name} & Umgebung – kurze Wege</p></div>
          <div><p className="text-2xl sm:text-3xl font-black text-orange-400">Kostenlos</p><p className="mt-1 text-sm text-slate-300 font-medium">Erstbesichtigung & Angebot</p></div>
          <div><p className="text-2xl sm:text-3xl font-black text-orange-400">Persönlich</p><p className="mt-1 text-sm text-slate-300 font-medium">Fester Ansprechpartner vor Ort</p></div>
        </div>
      </section>

      {/* ═══════════ LEISTUNGEN ═══════════ */}
      <section id="leistungen" className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-orange-600 font-bold text-sm uppercase tracking-widest">Unsere Leistungen</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Alles rund um {trade.name} – aus einer Hand</h2>
            <p className="mt-4 text-slate-600 text-lg">Vom kleinen Reparaturauftrag bis zur Komplettsanierung: Wir kümmern uns um Ihr Projekt, damit Sie sich um nichts kümmern müssen.</p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition duration-300">
                <span className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: service.svg }} />
                </span>
                <h3 className="mt-5 text-xl font-bold text-slate-900">{service.title}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ ÜBER UNS ═══════════ */}
      <section id="ueber-uns" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <img src={getAboutImage(trade.slug)} alt={`${trade.name} Team`} className="rounded-2xl shadow-2xl w-full object-cover aspect-[3/2]" />
            <div className="mt-4 flex items-center gap-4 bg-slate-900 text-white rounded-2xl p-5">
              <p className="text-4xl font-black text-orange-400">{city.name}</p>
              <p className="text-sm text-slate-200 leading-snug">unser Standort –<br />kurze Wege in der gesamten Region</p>
            </div>
          </div>
          <div>
            <p className="text-orange-600 font-bold text-sm uppercase tracking-widest">Über uns</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Ein Betrieb, auf den Sie sich verlassen können</h2>
            <p className="mt-6 text-slate-600 text-lg leading-relaxed">
              Wir sind ein {trade.name}-Betrieb aus {city.name}. Bei uns sprechen Sie direkt mit den Entscheidern – persönlich, unkompliziert und ohne lange Wege.
            </p>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Wir kennen die {trade.plural_name} in unserer Region und wissen, welche Materialien sich hier bewähren und worauf es bei den typischen Wetterlagen ankommt.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { title: 'Fachgerechte Ausführung', desc: 'Qualifizierte Arbeit nach den anerkannten Regeln der Technik.' },
                { title: 'Schriftliches Angebot', desc: 'Transparent kalkuliert – keine versteckten Kosten, keine Überraschungen.' },
                { title: 'Saubere Baustelle', desc: 'Wir hinterlassen Ihr Grundstück so, wie wir es vorgefunden haben.' },
                { title: 'Persönliche Betreuung', desc: 'Ein fester Ansprechpartner begleitet Ihr Projekt von Anfang bis Ende.' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                  <span className="text-slate-700"><strong className="text-slate-900">{item.title}:</strong> {item.desc}</span>
                </li>
              ))}
            </ul>
            <a className="mt-8 inline-flex items-center gap-2 text-orange-600 font-bold hover:gap-3 transition-all" href="#kontakt">
              Lernen Sie uns kennen – kostenlose Erstberatung
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ ABLAUF ═══════════ */}
      <section id="ablauf" className="py-20 sm:py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-orange-400 font-bold text-sm uppercase tracking-widest">So einfach geht's</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">In vier Schritten zur Lösung</h2>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Anfrage', desc: 'Rufen Sie an oder schreiben Sie uns über das Formular – wir melden uns schnellstmöglich bei Ihnen.' },
              { step: '02', title: 'Besichtigung', desc: 'Wir schauen uns die Situation vor Ort an – kostenlos und unverbindlich, inklusive ehrlicher Ersteinschätzung.' },
              { step: '03', title: 'Transparentes Angebot', desc: 'Sie erhalten ein transparentes, schriftliches Angebot – klar kalkuliert und ohne Verpflichtung.' },
              { step: '04', title: 'Ausführung', desc: 'Unser Team führt die Arbeiten termingerecht aus – mit regelmäßiger Rückmeldung und sauberer Übergabe.' },
            ].map((item, i) => (
              <div key={i} className="bg-slate-800 rounded-2xl p-7 border border-slate-700">
                <p className="text-5xl font-black text-orange-500/40">{item.step}</p>
                <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-slate-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ REFERENZEN ═══════════ */}
      <section id="referenzen" className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img src={getProjectImage(trade.slug)} alt={`${trade.name} Projekt`} className="rounded-2xl shadow-2xl w-full object-cover aspect-[3/2]" />
            </div>
            <div>
              <p className="text-orange-600 font-bold text-sm uppercase tracking-widest">Lokal verwurzelt</p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Ihr {trade.name} in {city.name} und Umgebung</h2>
              <p className="mt-5 text-slate-600 text-lg leading-relaxed">
                Kurze Wege bedeuten schnelle Hilfe. Wir sind direkt in {city.name} ansässig – daher sind wir in der gesamten Region für Sie da:
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {cities.map((c, i) => (
                  <span key={i} className={`${i === 0 ? 'bg-orange-600 text-white' : 'bg-white border border-slate-200 text-slate-700'} text-sm font-semibold px-4 py-2 rounded-full`}>
                    {c}
                  </span>
                ))}
              </div>
              <div className="mt-8 bg-white border-l-4 border-orange-600 rounded-r-xl p-5 shadow-sm">
                <p className="text-slate-700 leading-relaxed"><strong className="text-slate-900">Gut zu wissen:</strong> Die Erstbesichtigung vor Ort ist kostenlos und unverbindlich.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ BEWERTUNGEN ═══════════ */}
      <section id="bewertungen" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-orange-600 font-bold text-sm uppercase tracking-widest">Das sagen unsere Kunden</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Bewertungen aus der Region</h2>
            <p className="mt-4 text-slate-500 text-sm italic">Beispiel-Bewertungen zur Demonstration – keine echten Kundenstimmen.</p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {reviews.map((review, i) => (
              <figure key={i} className="bg-slate-50 rounded-2xl p-8 border border-slate-100 flex flex-col">
                <div className="text-orange-500 text-lg tracking-wider">{'★'.repeat(review.stars)}{'☆'.repeat(5 - review.stars)}</div>
                <blockquote className="mt-4 text-slate-700 leading-relaxed flex-1">„{review.text}"</blockquote>
                <figcaption className="mt-6 pt-5 border-t border-slate-200">
                  <p className="font-bold text-slate-900">{review.author}</p>
                  <p className="text-sm text-slate-500">{review.location}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BLOG ═══════════ */}
      <section id="blog" className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-orange-600 font-bold text-sm uppercase tracking-widest">Ratgeber & Blog</p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Wissen rund um {trade.name}</h2>
            </div>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {articles.map((article, i) => (
              <article key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 group">
                <div className={`h-44 bg-gradient-to-br ${article.gradient} flex items-center justify-center`}>
                  <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: article.svg }} />
                </div>
                <div className="p-7">
                  <p className="text-xs font-semibold text-slate-400">{article.tag}</p>
                  <h3 className="mt-2 text-lg font-bold text-slate-900 group-hover:text-orange-600 transition leading-snug">{article.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{article.desc}</p>
                  <p className="mt-4 text-sm font-bold text-orange-600">Beitrag lesen →</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-orange-600 font-bold text-sm uppercase tracking-widest">Häufige Fragen</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">FAQ – gut zu wissen</h2>
          </div>
          <div className="mt-12 space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between gap-4 text-left px-6 py-5 font-bold text-slate-900 cursor-pointer list-none">
                  {faq.q}
                  <svg className="w-5 h-5 text-orange-600 shrink-0 group-open:rotate-180 transition" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                </summary>
                <p className="px-6 pb-5 text-slate-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ NOTDIENST-BANNER ═══════════ */}
      <section className="bg-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-white">
            <span className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"></path></svg>
            </span>
            <div>
              <p className="text-xl sm:text-2xl font-black">Sturmschaden? Wir helfen schnell.</p>
              <p className="text-orange-100 mt-1">Schnelle Hilfe für {city.name} und Umgebung – rufen Sie uns einfach an.</p>
            </div>
          </div>
          {customization?.custom_phone && (
            <a className="inline-flex items-center gap-2 bg-white text-orange-700 font-black px-8 py-4 rounded-xl text-lg hover:bg-orange-50 transition shadow-lg shrink-0" href={`tel:${customization.custom_phone}`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.2a1 1 0 01.95.68l1.2 3.6a1 1 0 01-.27 1.06l-1.6 1.6a12.05 12.05 0 005.58 5.58l1.6-1.6a1 1 0 011.06-.27l3.6 1.2a1 1 0 01.68.95V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 6V3z"></path></svg>
              {customization.custom_phone}
            </a>
          )}
        </div>
      </section>

      {/* ═══════════ KONTAKT ═══════════ */}
      <section id="kontakt" className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <p className="text-orange-600 font-bold text-sm uppercase tracking-widest">Kontakt</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Schreiben Sie uns – wir melden uns zeitnah</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Ob Angebot, Terminvereinbarung oder eine kurze Frage: Nutzen Sie das Formular oder rufen Sie uns direkt an. Wir freuen uns auf Ihre Nachricht.
            </p>
            
            {isRented && (
              <div className="mt-8 space-y-4">
                {customization?.custom_phone && (
                  <a href={`tel:${customization.custom_phone}`} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-orange-500 hover:shadow-lg transition">
                    <span className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl">📞</span>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase">Telefon</p>
                      <p className="font-bold text-slate-900">{customization.custom_phone}</p>
                    </div>
                  </a>
                )}
                {customization?.custom_whatsapp && (
                  <a href={`https://wa.me/${customization.custom_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-200 hover:border-green-500 hover:shadow-lg transition">
                    <span className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center text-xl">💬</span>
                    <div>
                      <p className="text-xs text-green-600 font-semibold uppercase">WhatsApp</p>
                      <p className="font-bold text-slate-900">{customization.custom_whatsapp}</p>
                    </div>
                  </a>
                )}
                {customization?.custom_email && (
                  <a href={`mailto:${customization.custom_email}`} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-orange-500 hover:shadow-lg transition">
                    <span className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl">✉️</span>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase">E-Mail</p>
                      <p className="font-bold text-slate-900">{customization.custom_email}</p>
                    </div>
                  </a>
                )}
                {customization?.custom_address && (
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
                    <span className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl">📍</span>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase">Adresse</p>
                      <p className="font-bold text-slate-900">{customization.custom_address}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="lg:col-span-3">
            <form className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-lg" action={`/api/leads/${page.id || 'fallback'}`} method="POST">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
                  <input type="text" name="name" required placeholder="Max Mustermann" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">E-Mail *</label>
                  <input type="email" name="email" required placeholder="max@beispiel.de" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:outline-none" />
                </div>
              </div>
              <div className="mt-5">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefon</label>
                <input type="tel" name="phone" placeholder="+49 123 456789" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:outline-none" />
              </div>
              <div className="mt-5">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Ihr Anliegen *</label>
                <textarea name="message" required rows={5} placeholder="Beschreiben Sie kurz Ihr Vorhaben..." className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:outline-none"></textarea>
              </div>
              <button type="submit" className="mt-6 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl text-lg transition shadow-lg shadow-orange-600/25">
                Anfrage senden
              </button>
              <p className="mt-3 text-xs text-slate-400 text-center">
                🔒 SSL-verschlüsselt. Keine Weitergabe an Dritte.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="sm:col-span-2 lg:col-span-2">
              <Link href="/" className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-8 9 8M5 10v10h14V10"></path></svg>
                </span>
                <span className="text-xl font-extrabold text-white">fachschmiede.de</span>
              </Link>
              <p className="mt-3 text-sm leading-relaxed max-w-sm">
                Professionelle Online-Präsenz für Handwerksbetriebe. Wir schmieden deine lokale Präsenz.
              </p>
            </div>
            <div>
              <p className="text-white font-bold mb-3">Seite</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#leistungen" className="hover:text-white transition">Leistungen</a></li>
                <li><a href="#ueber-uns" className="hover:text-white transition">Über uns</a></li>
                <li><a href="#ablauf" className="hover:text-white transition">Ablauf</a></li>
                <li><a href="#bewertungen" className="hover:text-white transition">Bewertungen</a></li>
                <li><a href="#faq" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-bold mb-3">Rechtliches</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Impressum</a></li>
                <li><a href="#" className="hover:text-white transition">Datenschutz</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2026 fachschmiede.de — {trade.name} {city.name}</p>
            {isAvailable && (
              <Link href={`/mieten/${slug}`} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-lg transition inline-flex items-center gap-2">
                Diese Seite mieten
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

// ═══════════ HELPERS ═══════════

function getServices(tradeSlug: string) {
  const svcs: Record<string, Array<{title: string; desc: string; svg: string}>> = {
    dachdecker: [
      { title: 'Dachsanierung', desc: 'Komplette Neueindeckung Ihres Steildachs inkl. Unterspannbahn, Lattung und Eindeckung – mit hochwertigen Materialien führender Hersteller.', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-8 9 8M5 10v10h14V10"></path>' },
      { title: 'Dachreparatur', desc: 'Undichte Stellen, lose Ziegel, defekte Dachrinnen: Wir beheben Schäden schnell und zuverlässig – auch nach Sturm und Hagel, auf Wunsch mit Dokumentation für Ihre Versicherung.', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>' },
      { title: 'Dachdämmung', desc: 'Aufsparren-, Zwischensparren- oder Geschossdeckendämmung: Senken Sie Ihre Heizkosten dauerhaft – wir beraten Sie auch zu aktuellen Fördermöglichkeiten.', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path>' },
      { title: 'Flachdach', desc: 'Flachdachsanierung und -neubau mit modernen Abdichtungssystemen für Garage, Anbau oder Carport – dicht, langlebig und wartungsarm.', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.6-4.6a2 2 0 012.8 0L16 16m-2-2l1.6-1.6a2 2 0 012.8 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>' },
      { title: 'Solar & Photovoltaik', desc: 'Wir bereiten Ihr Dach optimal für eine PV-Anlage vor – von der statischen Prüfung bis zur Montage der Unterkonstruktion, abgestimmt mit Ihrem Solarteur.', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4L17 7M7 17l-1.4 1.4M18.4 18.4L17 17M7 7L5.6 5.6"></path><circle cx="12" cy="12" r="4"></circle>' },
      { title: 'Sturm- & Notdienst', desc: 'Sturm- oder Hagelschaden? Wir sichern Ihr Dach schnellstmöglich ab und kümmern uns um die fachgerechte Instandsetzung.', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"></path>' },
    ],
    elektriker: [
      { title: 'Elektroinstallation', desc: 'Komplette Elektroinstallation für Neubau, Renovierung oder Modernisierung. Planung, Installation und Prüfung aus einer Hand.', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path>' },
      { title: 'Elektroreparatur', desc: 'Stromausfall, defekte Steckdosen oder Sicherungsprobleme – wir beheben Störungen schnell und sicher.', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>' },
      { title: 'Photovoltaik', desc: 'Installation von Solaranlagen und Wechselrichtern inklusive Anmeldung beim Netzbetreiber.', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4L17 7M7 17l-1.4 1.4M18.4 18.4L17 17M7 7L5.6 5.6"></path><circle cx="12" cy="12" r="4"></circle>' },
      { title: 'E-Ladesäulen', desc: 'Installation von Wallboxen und Ladesäulen für Elektroautos. Inklusive Leistungsberechnung und Sicherheitsprüfung.', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.6-4.6a2 2 0 012.8 0L16 16m-2-2l1.6-1.6a2 2 0 012.8 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>' },
      { title: 'Smart Home', desc: 'Vernetzung von Beleuchtung, Heizung und Sicherheitstechnik. Wir planen und installieren Ihr intelligentes Zuhause.', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-8 9 8M5 10v10h14V10"></path>' },
      { title: 'E-Check & Prüfung', desc: 'Regelmäßige Überprüfung Ihrer elektrischen Anlagen nach VDE 0105. Dokumentation für Ihre Sicherheit und Versicherung.', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"></path>' },
    ],
    klempner: [
      { title: 'Installation & Sanierung', desc: 'Professionelle Installation und Sanierung von Sanitäranlagen. Badmodernisierung und Heizungsinstallation aus einer Hand.', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-8 9 8M5 10v10h14V10"></path>' },
      { title: 'Rohrreinigung & Reparatur', desc: 'Verstopfte Leitungen, undichte Rohre oder Wasserschäden – wir finden die Ursache und beheben das Problem dauerhaft.', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>' },
      { title: 'Heizungsservice', desc: 'Installation, Wartung und Reparatur von Heizungsanlagen. Von der Gasheizung bis zur Wärmepumpe.', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path>' },
      { title: 'Badmodernisierung', desc: 'Komplette Badrenovierung von der Planung bis zur Fertigstellung. Wir koordinieren alle Gewerke für Ihr Traumbad.', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.6-4.6a2 2 0 012.8 0L16 16m-2-2l1.6-1.6a2 2 0 012.8 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>' },
      { title: 'Wasseraufbereitung', desc: 'Installation von Wasserenthärtungsanlagen und Filtern. Für besseres Wasser in Ihrem Zuhause.', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4L17 7M7 17l-1.4 1.4M18.4 18.4L17 17M7 7L5.6 5.6"></path><circle cx="12" cy="12" r="4"></circle>' },
      { title: 'Notdienst', desc: 'Wasserschaden oder Rohrbruch? Unser Notdienst ist rund um die Uhr für Sie da. Schnelle Hilfe bei akuten Wasserschäden.', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"></path>' },
    ],
  }
  return svcs[tradeSlug] || svcs['dachdecker']
}

function getHeroImage(tradeSlug: string) {
  const imgs: Record<string, string> = {
    dachdecker: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80',
    elektriker: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1920&q=80',
    klempner: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1920&q=80',
  }
  return imgs[tradeSlug] || imgs['dachdecker']
}

function getAboutImage(tradeSlug: string) {
  const imgs: Record<string, string> = {
    dachdecker: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    elektriker: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
    klempner: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  }
  return imgs[tradeSlug] || imgs['dachdecker']
}

function getProjectImage(tradeSlug: string) {
  const imgs: Record<string, string> = {
    dachdecker: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
    elektriker: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    klempner: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
  }
  return imgs[tradeSlug] || imgs['dachdecker']
}

function getNearbyCities(cityName: string): string[] {
  return [cityName, `${cityName}-Mitte`, `${cityName}-Nord`, `${cityName}-Süd`, `${cityName}-Ost`, `${cityName}-West`, 'Umland', 'Region']
}

function getReviews(cityName: string, tradeName: string) {
  return [
    { stars: 5, text: `Schnelle Reaktion nach dem Sturm. Das Team war am selben Tag vor Ort und hat alles professionell abgesichert. Transparente Abrechnung ohne Überraschungen.`, author: 'Familie Schmidt', location: `${cityName} · Sturmreparatur` },
    { stars: 5, text: `Kompetente Beratung und saubere Ausführung. Man merkt, dass hier Profis am Werk sind. Werde definitiv wieder auf Sie zurückkommen.`, author: 'Peter M.', location: `${cityName} · Sanierung` },
    { stars: 5, text: `Endlich ein Handwerker, der pünktlich kommt und die vereinbarte Arbeit auch wirklich erledigt. Klare Empfehlung für die ganze Region!`, author: 'Monika K.', location: `${cityName} · Reparatur` },
  ]
}

function getArticles(tradeName: string) {
  return [
    { title: `5 Anzeichen, dass Sie einen ${tradeName} brauchen`, desc: 'Woran Sie erkennen, dass es Zeit für den Profi wird.', tag: 'Ratgeber · 6 Min. Lesezeit', gradient: 'from-orange-500 to-orange-700', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>' },
    { title: 'Förderungen für Sanierungen: Diese Zuschüsse gibt es', desc: 'BAFA-Zuschuss oder KfW-Kredit? Ein Überblick über die Fördermöglichkeiten.', tag: 'Förderung · 8 Min. Lesezeit', gradient: 'from-slate-700 to-slate-900', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>' },
    { title: 'Notfall: Was Sie sofort tun sollten', desc: 'Die wichtigsten Schritte im Überblick.', tag: 'Notfall · 5 Min. Lesezeit', gradient: 'from-sky-600 to-slate-800', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999A5.002 5.002 0 105.9 8.001 4.002 4.002 0 003 15z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M13 10l-2 4h3l-2 4"></path>' },
  ]
}

function getFAQ(tradeName: string) {
  return [
    { q: `Was kostet eine typische ${tradeName}-Leistung?`, a: 'Das hängt vom Umfang ab. Nach der kostenlosen Besichtigung erhalten Sie von uns ein verbindliches, schriftliches Angebot.' },
    { q: 'Wie lange dauert ein typischer Auftrag?', a: 'Bei einem typischen Projekt dauert die Ausführung in der Regel wenige Tage bis zwei Wochen. Den genauen Zeitplan erhalten Sie vor Baubeginn schriftlich.' },
    { q: 'Bieten Sie einen Notdienst an?', a: 'Ja. Bei akuten Schäden erreichen Sie uns telefonisch – wir kümmern uns schnellstmöglich um die Sicherung.' },
    { q: 'Gibt es Förderungen für Sanierungen?', a: 'Ja, energetische Sanierungen werden häufig gefördert. Wir beraten Sie im Rahmen der Besichtigung zu den aktuellen Möglichkeiten.' },
    { q: 'Wie lange gilt die Gewährleistung?', a: 'Auf unsere Handwerksleistungen gilt selbstverständlich die gesetzliche Gewährleistung. Details nennen wir Ihnen gerne im Angebot.' },
    { q: 'Arbeiten Sie auch außerhalb der Stadt?', a: 'Ja, unser Einsatzgebiet umfasst die Stadt und alle umliegenden Gemeinden. Für größere Projekte kommen wir auf Anfrage auch darüber hinaus.' },
    { q: 'Ist die Besichtigung wirklich kostenlos?', a: 'Ja. Die Erstbesichtigung inklusive Angebot ist komplett kostenlos und unverbindlich.' },
  ]
}
