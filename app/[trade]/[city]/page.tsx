import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'

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
    title: `${capitalize(cleanTrade)} ${capitalize(cleanCity)} | Professionelle Leistungen ab €149/Monat`,
    description: `Erfahrene ${capitalize(cleanTrade)} in ${capitalize(cleanCity)}. Kostenlose Besichtigung & Festpreis-Angebot. Jetzt lokale Fachbetriebe finden.`,
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')
}

// ═══════════════════════════════════════════
// GEWERKESPEZIFISCHE FALLBACK-TEXT
// Jeder Text enthält den Stadtnamen und ist gewerkespezifisch
// ═══════════════════════════════════════════
function getTradeContent(tradeSlug: string, cityName: string, tradeName: string) {
  const contents: Record<string, any> = {
    'dachdecker': {
      heroTitle: `${tradeName} in ${cityName}. Festpreis. Feste Termine.`,
      heroSubtitle: `Ein Dach zeigt seine Schwächen meist erst, wenn es zu spät ist – undichte Stellen, lose Ziegel, verstopfte Rinnen. In ${cityName} schauen wir uns Ihr Dach kostenlos an und sagen Ihnen ehrlich, was nötig ist und was warten kann.`,
      aboutTitle: 'Ein Betrieb, auf den Sie sich verlassen können',
      aboutText: `Ein ${tradeName.toLowerCase()}betrieb aus ${cityName}, auf den Sie sich verlassen können. Wir kennen die typischen Dachprobleme in der Region und bieten maßgeschneiderte Lösungen – von der Dachreparatur bis zur kompletten Sanierung.`,
      ctaText: `Schnelle Hilfe für ${cityName} und Umgebung`,
    },
    'elektriker': {
      heroTitle: `${tradeName} in ${cityName}. Sicher. Kompetent. Vor Ort.`,
      heroSubtitle: `Ob Stromausfall, neue Elektroinstallation oder Smart-Home-Umstellung – in ${cityName} sind wir Ihr zuverlässiger Partner für alle elektrischen Arbeiten. Kostenlose Erstberatung vor Ort.`,
      aboutTitle: 'Ihr Elektrofachbetrieb in der Region',
      aboutText: `Als ${tradeName} in ${cityName} kennen wir die örtlichen Gegebenheiten und die typischen Herausforderungen älterer Elektroinstallationen. Wir arbeiten nach den aktuellen VDE-Vorschriften und dokumentieren alles ordnungsgemäß.`,
      ctaText: `Elektro-Notdienst für ${cityName} und Umgebung`,
    },
    'klempner': {
      heroTitle: `${tradeName} in ${cityName}. Sauber. Schnell. Fair.`,
      heroSubtitle: `Rohrbruch, verstopfter Abfluss oder neue Heizungsinstallation? In ${cityName} helfen wir Ihnen schnell und zuverlässig – mit transparenten Preisen und terminlicher Zuverlässigkeit.`,
      aboutTitle: 'Ihr Sanitärfachbetrieb vor Ort',
      aboutText: `Als erfahrener ${tradeName} in ${cityName} kennen wir die typischen Probleme der Region – von alten Bleirohren bis zu modernen Heizungssystemen. Wir finden die passende Lösung für Ihr Projekt.`,
      ctaText: `Sanitär-Notdienst für ${cityName} und Umgebung`,
    },
    'garten-und-landschaftsbau': {
      heroTitle: `${tradeName} in ${cityName}. Ihr Garten. Unsere Leidenschaft.`,
      heroSubtitle: `Von der Gartenpflege über die Neugestaltung bis zur professionellen Baumpflege – in ${cityName} verwandeln wir Ihren Garten in eine Wohlfühloase. Kostenlose Beratung vor Ort.`,
      aboutTitle: 'Grünanlagen-Experten in Ihrer Region',
      aboutText: `Als ${tradeName} in ${cityName} kennen wir die örtlichen Bodenverhältnisse, das Klima und die typischen Gartenherausforderungen der Region. Wir schaffen Gärten, die Freude bereiten und pflegeleicht sind.`,
      ctaText: `Garten-Experten für ${cityName} und Umgebung`,
    },
    'bestatter': {
      heroTitle: `${tradeName} in ${cityName}. Würdevoll. Menschlich. Nahe.`,
      heroSubtitle: `In schwierigen Zeiten brauchen Sie einen verlässlichen Partner an Ihrer Seite. Wir begleiten Familien in ${cityName} mit Würde, Respekt und professioneller Beratung bei der letzten Reise Ihres Angehörigen.`,
      aboutTitle: 'Ein Bestattungshaus, das Sie versteht',
      aboutText: `Als erfahrener ${tradeName} in ${cityName} wissen wir, wie wichtig es ist, in Trauerfällen schnell, diskret und einfühlsam zu handeln. Wir übernehmen alle Formalitäten und gestalten die Trauerfeier nach Ihren Wünschen.`,
      ctaText: `24h Erreichbar für ${cityName} und Umgebung`,
    },
  }
  
  return contents[tradeSlug] || {
    heroTitle: `${tradeName} in ${cityName}. Professionell. Zuverlässig.`,
    heroSubtitle: `Professionelle ${tradeName}-Leistungen in ${cityName} und Umgebung. Kostenlose Besichtigung und transparente Festpreise.`,
    aboutTitle: 'Ihr Fachbetrieb in der Region',
    aboutText: `Wir sind Ihr zuverlässiger ${tradeName} in ${cityName} und der Umgebung. Mit langjähriger Erfahrung und einem engagierten Team realisieren wir Ihr Projekt professionell und termingerecht.`,
    ctaText: `Schnelle Hilfe für ${cityName} und Umgebung`,
  }
}

export default async function LandingPage({ params }: PageProps) {
  const cleanTrade = params.trade?.replace(/\/$/, '') || params.trade
  const cleanCity = params.city?.replace(/\/$/, '') || params.city
  const dbTradeSlug = getDbTradeSlug(cleanTrade)
  const slug = `${dbTradeSlug}-${cleanCity}`

  let page: any = null
  let trade: any = null
  let city: any = null

  try {
    const { data } = await supabaseAdmin
      .from('landing_pages')
      .select(`*, trade:trades(*), city:cities(*)`)
      .eq('slug', slug)
      .single()
    if (data) { page = data; trade = data.trade; city = data.city }
  } catch (err) { console.log('Supabase error:', err) }

  if (!page) {
    try {
      const { data } = await supabaseAdmin
        .from('landing_pages')
        .select(`*, trade:trades(*), city:cities(*)`)
        .eq('slug', `${cleanTrade}-${cleanCity}`)
        .single()
      if (data) { page = data; trade = data.trade; city = data.city }
    } catch (err) { console.log('Supabase error 2:', err) }
  }

  if (!page || !trade || !city) notFound()

  const isAvailable = page.status === 'available'
  const tradeName = trade.name
  const cityName = city.name
  const tradeSlug = trade.slug
  const services = trade.services || []
  
  // ═══════════════════════════════════════════
  // GEWERKESPEZIFISCHE BILDER (nicht generisch!)
  // ═══════════════════════════════════════════
  const heroImage = trade.hero_image || `/images/${tradeSlug}-hero.jpg`
  const teamImage = trade.team_image || `/images/${tradeSlug}-team.jpg`
  
  // ═══════════════════════════════════════════
  // CONTENT: Erst DB (content_json), dann Fallback
  // ═══════════════════════════════════════════
  const dbContent = page.content_json || {}
  const fallbackContent = getTradeContent(tradeSlug, cityName, tradeName)
  
  const content = {
    heroTitle: dbContent.hero_title || fallbackContent.heroTitle,
    heroSubtitle: dbContent.hero_subtitle || fallbackContent.heroSubtitle,
    aboutTitle: dbContent.about_title || fallbackContent.aboutTitle,
    aboutText: dbContent.about_text || fallbackContent.aboutText,
    ctaText: dbContent.cta_text || fallbackContent.ctaText,
    faq: dbContent.faq || null,
    articleTitles: dbContent.article_titles || null,
  }

  return (
    <div className="min-h-screen bg-white text-ink-800 antialiased" style={{fontFamily: "'Inter',system-ui,sans-serif"}}>
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
              <span className="block font-extrabold text-lg text-ink-900">{tradeName} {cityName}</span>
              <span className="block text-xs text-ink-500 font-medium">Miet-Website · {isAvailable ? <span className="text-brand-600 font-bold">noch frei</span> : 'vermietet'}</span>
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-ink-600">
            <a href="#leistungen" className="hover:text-brand-600 transition">Leistungen</a>
            <a href="#ort" className="hover:text-brand-600 transition">{cityName}</a>
            <a href="#ratgeber" className="hover:text-brand-600 transition">Ratgeber</a>
            <a href="#faq" className="hover:text-brand-600 transition">FAQ</a>
            <a href="#kontakt" className="hover:text-brand-600 transition">Kontakt</a>
          </nav>
              <a href={`/sales-${cleanTrade}.html?stadt=${cleanCity}`} className="hidden sm:inline-flex bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition shadow-sm">
                Diese Seite mieten
              </a>
        </div>
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-[86vh] flex items-center">
        <img src={heroImage} alt={`${tradeName} bei der Arbeit`} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{background: 'linear-gradient(105deg,rgba(15,23,42,.92) 0%,rgba(15,23,42,.75) 45%,rgba(15,23,42,.35) 100%)'}} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-white">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 bg-white/10 border border-white/25 backdrop-blur rounded-full px-4 py-1.5 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              {tradeName} in {cityName} – kostenlose Besichtigung
            </p>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
              {content.heroTitle}
            </h1>
            <p className="mt-6 text-lg text-ink-200 leading-relaxed max-w-xl">
              {content.heroSubtitle}
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
              <a href={`/sales-${cleanTrade}.html?stadt=${cleanCity}`} className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-4 rounded-xl transition shadow-lg shadow-brand-600/25">
                Jetzt für {cityName} sichern →
              </a>
              <p className="mt-2 text-xs text-ink-500">Self-Check-in · sofort online · monatlich kündbar</p>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ LEISTUNGEN ═══════════ */}
      <section id="leistungen" className="py-20 sm:py-28 bg-ink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-brand-600 font-bold text-sm uppercase tracking-widest">Leistungen</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">Alles rund ums Thema {tradeName} in {cityName}</h2>
            <p className="mt-4 text-ink-600 text-lg">Professionelle {tradeName}-Leistungen mit kostenloser Besichtigung und Festpreis-Angebot.</p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service: string, i: number) => (
              <div key={i} className="bg-white rounded-2xl p-7 border border-ink-200 hover:shadow-xl hover:-translate-y-1 transition duration-300">
                <span className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center text-2xl">
                  {getServiceIcon(i)}
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink-900">{service}</h3>
                <p className="mt-2 text-ink-600 text-sm leading-relaxed">
                  {service} in {cityName} und Umgebung. Kostenlose Besichtigung vor Ort und transparente Festpreise.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ ÜBER UNS / STADT ═══════════ */}
      <section id="ort" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <img src={teamImage} alt={`${tradeName} Team in ${cityName}`} className="rounded-2xl shadow-2xl w-full object-cover aspect-[3/2]" />
            <div className="mt-4 flex items-center gap-4 bg-ink-900 text-white rounded-2xl p-5">
              <p className="text-4xl font-black text-brand-400">{cityName}</p>
              <p className="text-sm text-ink-200 leading-snug">unser Standort –<br />kurze Wege in der gesamten Region</p>
            </div>
          </div>
          <div>
            <p className="text-brand-600 font-bold text-sm uppercase tracking-widest">Über uns</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">
              {content.aboutTitle}
            </h2>
            <p className="mt-6 text-ink-600 text-lg leading-relaxed">
              {content.aboutText}
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { title: 'Fachgerechte Ausführung', desc: 'Qualifizierte Arbeit nach den anerkannten Regeln der Technik.' },
                { title: 'Schriftliches Angebot', desc: 'Transparent kalkuliert – keine versteckten Kosten, keine Überraschungen.' },
                { title: 'Saubere Baustelle', desc: 'Wir hinterlassen Ihr Grundstück so, wie wir es vorgefunden haben – versprochen.' },
                { title: 'Persönliche Betreuung', desc: 'Ein fester Ansprechpartner begleitet Ihr Projekt von Anfang bis Ende.' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-brand-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-ink-700">
                    <strong className="text-ink-900">{item.title}:</strong> {item.desc}
                  </span>
                </li>
              ))}
            </ul>
            <a href="#kontakt" className="mt-8 inline-flex items-center gap-2 text-brand-600 font-bold hover:gap-3 transition-all">
              Lernen Sie uns kennen – kostenlose Erstberatung
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ RATGEBER / BLOG ═══════════ */}
      <section id="ratgeber" className="py-20 sm:py-28 bg-ink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-brand-600 font-bold text-sm uppercase tracking-widest">Ratgeber & Fachwissen</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-black text-ink-900">Aktuelle Artikel für {cityName}</h2>
              <p className="mt-3 text-ink-600 max-w-2xl">Praxisnahe Ratgeber für {cityName} – mit lokalem Fachwissen aus der Region.</p>
            </div>
            <Link href={`/${cleanTrade}/${cleanCity}/blog/`} className="text-brand-600 font-bold hover:underline shrink-0">Alle Beiträge →</Link>
          </div>
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(content.articleTitles || getDefaultArticleTitles(tradeName, cityName)).slice(0, 3).map((title: string, i: number) => (
              <Link key={i} href={`/${cleanTrade}/${cleanCity}/blog/`} className="block bg-white rounded-2xl overflow-hidden border border-ink-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 group">
                <div className="h-44 bg-gradient-to-br from-brand-100 to-amber-100 flex items-center justify-center text-5xl group-hover:scale-105 transition duration-500">📖</div>
                <div className="p-5">
                  <p className="text-xs font-bold text-brand-600 uppercase tracking-wider">{tradeName} · {cityName}</p>
                  <h3 className="mt-1.5 text-lg font-bold text-ink-900 leading-snug group-hover:text-brand-600 transition">
                    {title}
                  </h3>
                  <span className="mt-3 inline-flex items-center text-sm font-bold text-brand-600">Weiterlesen →</span>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-xs text-ink-400 italic">Hinweis: Jeder Artikel ist für diese Stadt individuell verfasst – nie Duplicate Content.</p>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-brand-600 font-bold text-sm uppercase tracking-widest">Häufige Fragen</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">Das fragen Kunden aus {cityName}</h2>
          </div>
          <div className="mt-10 space-y-4">
            {(content.faq || getDefaultFAQ(tradeName, cityName)).map((faq: any, i: number) => (
              <details key={i} className="bg-white rounded-xl border border-ink-200 overflow-hidden group">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-bold text-ink-800 hover:bg-ink-50 transition">
                  {faq.q}
                  <svg className="w-5 h-5 text-brand-600 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-ink-600 text-sm leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA BANNER ═══════════ */}
      <section className="bg-brand-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-white">
            <span className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/>
              </svg>
            </span>
            <div>
              <p className="text-xl sm:text-2xl font-black">{content.ctaText}</p>
              <p className="text-brand-100 mt-1">Rufen Sie uns einfach an – wir sind für Sie da.</p>
            </div>
          </div>
          <a href="tel:+4915123456789" className="inline-flex items-center gap-2 bg-white text-brand-700 font-black px-8 py-4 rounded-xl text-lg hover:bg-brand-50 transition shadow-lg shrink-0">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.2a1 1 0 01.95.68l1.2 3.6a1 1 0 01-.27 1.06l-1.6 1.6a12.05 12.05 0 005.58 5.58l1.6-1.6a1 1 0 011.06-.27l3.6 1.2a1 1 0 01.68.95V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 6V3z"/>
            </svg>
            0151 / 234 567 89
          </a>
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
                <a href={`/sales-${cleanTrade}.html?stadt=${cleanCity}`} className="mt-4 inline-block bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-6 py-3 rounded-lg transition">
                  Seite anmieten →
                </a>
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
              <p className="mt-4 text-xs text-ink-400 text-center">Demo-Formular – es werden keine Daten übertragen oder gespeichert.</p>
            </form>
          </div>
        </div>

        {/* KARTE */}
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
                <span className="block font-extrabold text-white">{tradeName} {cityName}</span>
                <span className="block text-xs text-ink-400">Miet-Website {isAvailable ? '· noch frei' : ''}</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed">Professionelle {tradeName}-Leistungen in {cityName} und Umgebung.</p>
          </div>
          <div>
            <p className="font-bold text-white text-sm uppercase tracking-widest">Leistungen</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {services.slice(0, 6).map((s: string, i: number) => (
                <li key={i}><a href="#leistungen" className="hover:text-brand-400 transition">{s}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-bold text-white text-sm uppercase tracking-widest">Miet-Website</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><a href={`/sales-${cleanTrade}.html?stadt=${cleanCity}`} className="hover:text-brand-400 transition">Diese Seite mieten</a></li>
              <li><Link href={`/${cleanTrade}/${cleanCity}/blog/`} className="hover:text-brand-400 transition">Ratgeber</Link></li>
              <li><a href="#kontakt" className="hover:text-brand-400 transition">Kontakt</a></li>
              <li><Link href="/impressum" className="hover:text-brand-400 transition">Impressum</Link></li>
              <li><Link href="/datenschutz" className="hover:text-brand-400 transition">Datenschutzerklärung</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-ink-800 py-5 text-center text-xs text-ink-500">
          <p>© {new Date().getFullYear()} fachschmiede.de – {isAvailable ? 'MUSTERSITE. Alle Inhalte sind fiktiv.' : 'Alle Rechte vorbehalten.'}</p>
        </div>
      </footer>

      {/* ═══════════ WHATSAPP FLOATING BUTTON ═══════════ */}
      <a 
        href="https://wa.me/4915123456789?text=Hallo%2C%20ich%20interessiere%20mich%20f%C3%BCr%20ein%20Angebot."
        target="_blank"
        rel="noopener"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1fb856] text-white flex items-center justify-center shadow-2xl transition hover:scale-105"
        aria-label="Per WhatsApp kontaktieren"
      >
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>
    </div>
  )
}

function getServiceIcon(index: number): string {
  const icons = ['🏠', '🔧', '🌡️', '▭', '☀️', '⚠️', '⚡', '🚗', '✅', '💡', '🔥', '🚿', '💧', '🌳', '🎨', '🖌️', '📜', '🏗️', '🎭', '🏡']
  return icons[index % icons.length]
}

function getDefaultArticleTitles(tradeName: string, cityName: string): string[] {
  return [
    `5 Anzeichen, dass Sie einen ${tradeName} brauchen`,
    `${tradeName}: Was kostet es in ${cityName}?`,
    `Notfall: Was tun, wenn der ${tradeName} nicht erreichbar ist?`,
  ]
}

function getDefaultFAQ(tradeName: string, cityName: string) {
  return [
    { q: `Was kostet ein ${tradeName.toLowerCase()} in ${cityName}?`, a: 'Die Kosten hängen vom Umfang des Projekts ab. Nach der kostenlosen Besichtigung erhalten Sie einen verbindlichen Festpreis – ohne versteckte Kosten.' },
    { q: 'Wie lange dauern die Arbeiten?', a: 'Die Dauer hängt vom Projekt ab. Ein typischer Auftrag dauert zwischen einem Tag und zwei Wochen. Den genauen Zeitplan erhalten Sie vor Baubeginn schriftlich.' },
    { q: 'Gibt es eine Garantie?', a: 'Ja, wir gewährleisten auf alle Arbeiten eine umfassende Garantie. Die genauen Bedingungen werden im Angebot festgehalten.' },
    { q: 'Bieten Sie kostenlose Besichtigungen an?', a: 'Ja, wir bieten eine kostenlose und unverbindliche Erstbesichtigung vor Ort an. Anschließend erhalten Sie ein schriftliches Festpreisangebot.' },
  ]
}
