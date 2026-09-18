import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
// @ts-ignore — CJS-Config ohne Typdeklarationen
import { getTrade, getAllCities } from '../../config/system-config'

interface PageProps {
  params: {
    trade: string
  }
}

// ═══════════════════════════════════════════
// STATISCHE Pfade für alle Gewerke
// ═══════════════════════════════════════════
export async function generateStaticParams() {
  // @ts-ignore
  const { getAllTrades } = require('../../config/system-config')
  return getAllTrades().map((t: any) => ({ trade: t.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cleanTrade = params.trade?.replace(/\/$/, '') || params.trade
  const trade = getTrade(cleanTrade)
  if (!trade) return { title: 'Nicht gefunden' }
  return {
    title: `${trade.name} im Ruhrgebiet – Alle Städte & Leistungen | fachschmiede.de`,
    description: `${trade.name} in 20 Städten des Ruhrgebiets. ${trade.services.slice(0, 3).join(', ')} & mehr. Kostenlose Besichtigung & Festpreis. Jetzt Fachbetrieb finden.`,
    openGraph: {
      title: `${trade.name} im Ruhrgebiet | fachschmiede.de`,
      description: `Lokale ${trade.plural} in deiner Stadt finden – schnell, kostenlos, unkompliziert.`,
      url: `https://fachschmiede.de/${trade.slug}/`,
      siteName: 'fachschmiede.de',
      locale: 'de_DE',
      type: 'website',
    },
  }
}

// ═══════════════════════════════════════════
// GEWERKESPEZIFISCHE CONTENT-BLÖCKE
// ═══════════════════════════════════════════
function getTradeContent(slug: string) {
  const contents: Record<string, any> = {
    'dachdecker': {
      heroTitle: 'Dachdecker im Ruhrgebiet',
      heroSubtitle: 'Ob Dachreparatur, Neudeckung oder Sanierung – finden Sie erfahrene Dachdecker in Ihrer Stadt. Kostenlose Besichtigung, Festpreis-Angebot, keine versteckten Kosten.',
      introTitle: 'Ihr Dach in besten Händen',
      introText: 'Das Dach ist der wichtigste Schutz Ihres Hauses. Ob undichte Stelle nach dem Sturm, Alterserscheinungen an der Dachdeckung oder eine komplette Sanierung mit Dämmung – unsere Partnerbetriebe decken alle Leistungen rund ums Dach ab. Vom ersten Aufmaß bis zur finalen Abnahme erhalten Sie transparente Festpreise und verbindliche Termine.',
      benefits: [
        { title: 'Sturmschaden-Soforthilfe', desc: 'Schnelle Schadensbegrenzung und Abwicklung mit der Versicherung.' },
        { title: 'Dachdämmung & Förderung', desc: 'Energetische Sanierung mit KfW-/BAFA-Förderung – wir kümmern uns um die Anträge.' },
        { title: 'Dachrinnen & Fallrohre', desc: 'Komplette Regenwasser-Lösungen inkl. Regenwassernutzung.' },
        { title: 'Dachfenster & Lichtkuppeln', desc: 'Mehr Tageslicht im Dachgeschoss – fachgerecht eingebaut und abgedichtet.' },
      ],
      faq: [
        { q: 'Was kostet eine Dachreparatur?', a: 'Kleine Reparaturen starten ab ca. 300 €, eine komplette Dachsanierung bei 15.000–30.000 €. Nach der kostenlosen Besichtigung erhalten Sie einen verbindlichen Festpreis.' },
        { q: 'Wann lohnt sich eine Dachsanierung?', a: 'Typische Anzeichen: undichte Stellen, lose Ziegel, Korrosion an Dachrinnen, Alterserscheinungen nach 20–30 Jahren. Ein Dach-Check klärt, was nötig ist.' },
        { q: 'Gibt es Förderungen für Dachdämmung?', a: 'Ja, über KfW und BAFA sind bis zu 20 % der Kosten förderfähig. Viele Betriebe übernehmen die Antragstellung für Sie.' },
        { q: 'Wie schnell kann ein Dachdecker kommen?', a: 'Bei Sturmschäden oder akuten Undichtigkeiten meist innerhalb von 24–48 Stunden. Vereinbaren Sie am besten direkt einen Termin über unsere Stadtseiten.' },
      ],
    },
    'elektriker': {
      heroTitle: 'Elektriker im Ruhrgebiet',
      heroSubtitle: 'Elektroinstallation, Smart Home, Wallbox, Sicherungskasten – zertifizierte Elektriker in Ihrer Stadt. Sicher nach VDE-Norm, transparent kalkuliert.',
      introTitle: 'Strom sicher & smart',
      introText: 'Elektrik ist Vertrauenssache. Ob Neuinstallation, Modernisierung alter Leitungen oder smarte Steuerung von Licht und Heizung – unsere Partnerbetriebe arbeiten nach den aktuellen VDE-Vorschriften und dokumentieren jede Arbeit ordnungsgemäß. Vom E-Check bis zur Wallbox-Installation.',
      benefits: [
        { title: 'E-Check & Sicherheitsprüfung', desc: 'Regelmäßige Prüfung Ihrer Elektroanlage nach DGUV V3 – mit Prüfprotokoll.' },
        { title: 'Wallbox & E-Mobilität', desc: 'Ladeinfrastruktur für Zuhause – inkl. Förderberatung und Installation.' },
        { title: 'Smart Home', desc: 'Licht, Heizung und Rollläden intelligent steuern – Komfort und Energieeinsparung.' },
        { title: 'Notdienst', desc: 'Bei Stromausfall oder gefährlichen Defekten – schnelle Hilfe, auch am Wochenende.' },
      ],
      faq: [
        { q: 'Was kostet eine Elektroinstallation?', a: 'Kleine Arbeiten ab ca. 80 €/Std. Eine komplette Neuinstallation kostet je nach Wohnungsgröße 2.000–8.000 €. Festpreis nach kostenloser Besichtigung.' },
        { q: 'Wie oft sollte der E-Check gemacht werden?', a: 'Privathaushalte: alle 4 Jahre empfohlen. Gewerbe: jährlich nach DGUV V3. Mieter können den Vermieter zur Prüfung auffordern.' },
        { q: 'Lohnt sich eine Wallbox?', a: 'Ja, bes mit E-Auto. Das Laden zu Hause ist 3–5× günstiger als an öffentlichen Säulen. Förderung bis 900 € möglich.' },
        { q: 'Was tun bei Stromausfall?', a: 'Erst Sicherungen prüfen, dann Verteiler kontrollieren. Wenn nichts hilft: Notdienst anrufen. Nie eigenmächtig an offenen Leitungen arbeiten!' },
      ],
    },
    'klempner': {
      heroTitle: 'Klempner & SHK im Ruhrgebiet',
      heroSubtitle: 'Rohrbruch, Heizungsausfall, Badmodernisierung – SHK-Fachbetriebe in Ihrer Stadt. 24h-Notdienst, transparente Preise, saubere Arbeit.',
      introTitle: 'Wasser. Wärme. Wohlbefinden.',
      introText: 'Sanitär- und Heizungstechnik beeinflusst jeden Tag Ihre Lebensqualität. Ob verstopfter Abfluss, tropfende Armatur oder komplette Badsanierung – unsere Partnerbetriebe decken alle SHK-Leistungen ab. Von der Rohrreinigung bis zur energieeffizienten Heizungsanlage.',
      benefits: [
        { title: '24h Notdienst', desc: 'Rohrbruch oder Heizungsausfall – schnelle Hilfe rund um die Uhr.' },
        { title: 'Heizungstausch', desc: 'Moderne Gas-, Wärmepumpen- oder Pelletheizung inkl. Förderung bis 50 %.' },
        { title: 'Badmodernisierung', desc: 'Komplette Badsanierung aus einer Hand – vom Abbau bis zur Endreinigung.' },
        { title: 'Rohrreinigung & Kanal', desc: 'Professionelle Inspektion und Reinigung mit Kamera-Technik.' },
      ],
      faq: [
        { q: 'Was kostet eine Badsanierung?', a: 'Einfache Renovierung ab 5.000 €, hochwertige Komplettsanierung 15.000–30.000 €. Kostenlose Beratung und Festpreis-Angebot.' },
        { q: 'Wann muss die Heizung getauscht werden?', a: 'Gasheizungen über 20 Jahre alt sollten geprüft werden. Mit Förderung bis 50 % lohnt sich oft ein moderner Wechsel bereits jetzt.' },
        { q: 'Was tun bei Rohrbruch?', a: 'Hauptwasserhahn zudrehen, Strom abschalten falls nötig, Notdienst anrufen. Fotografieren Sie die Schäden für die Versicherung.' },
        { q: 'Ist die Rohrreinigung teuer?', a: 'Einfache Reinigung ab ca. 100–200 €. Bei verstopften Hauptleitungen oder Kanalreinigung mehr. Festpreis vor Arbeitsbeginn.' },
      ],
    },
    'zimmerer': {
      heroTitle: 'Zimmerer im Ruhrgebiet',
      heroSubtitle: 'Dachstuhl, Carport, Terrassenüberdachung, Holzskelettbau – traditionelles Handwerk mit moderner Technik in Ihrer Stadt.',
      introTitle: 'Holz. Handwerk. Haltbarkeit.',
      introText: 'Der Zimmerer ist der Spezialist für alles aus Holz. Ob Dachstuhl-Neubau, Sanierung alter Fachwerkhäuser oder Carport – unsere Partnerbetriebe verbinden jahrhundertealtes Handwerk mit moderner Bauweise. Vom ersten Plan bis zur fertigen Konstruktion.',
      benefits: [
        { title: 'Dachstuhl & Dachkonstruktion', desc: 'Statisch berechnete Dachstühle – vom Satteldach bis zur komplexen Dachlandschaft.' },
        { title: 'Carport & Überdachung', desc: 'Individuelle Carports und Terrassenüberdachungen – wetterfest und langlebig.' },
        { title: 'Fachwerksanierung', desc: 'Behutsame Restaurierung historischer Fachwerkhäuser mit traditionellen Methoden.' },
        { title: 'Holzskelettbau', desc: 'Moderner Holzbau für Wohnhäuser, Anbauten und Gewerbe – schnell und energieeffizient.' },
      ],
      faq: [
        { q: 'Was kostet ein Carport?', a: 'Einfacher Carport ab ca. 2.000 €, Doppelcarport mit Abstellraum 5.000–10.000 €. Individuelle Planung inklusive.' },
        { q: 'Wann brauche ich einen neuen Dachstuhl?', a: 'Bei Durchfeuchtung, Pilzbefall, statischen Problemen oder beim Aufstocken. Ein Zimmerer prüft die Tragfähigkeit.' },
        { q: 'Ist Holzbau teuer?', a: 'Holzskelettbau ist vergleichbar mit Massivbau, aber schneller und wärmebrückenfrei. Bei Energieeffizienz oft die bessere Wahl.' },
        { q: 'Sanierung oder Neubau beim Dachstuhl?', a: 'Oft reicht eine Teilrenovierung. Ein Fachbetrieb berät ehrlich, was sinnvoll ist – nicht, was mehr Umsatz bringt.' },
      ],
    },
    'maler': {
      heroTitle: 'Maler & Lackierer im Ruhrgebiet',
      heroSubtitle: 'Innenanstrich, Fassadensanierung, Bodenbeläge, Trockenbau – farbstarke Profis in Ihrer Stadt. Sauber, termingerecht, mit Garantie.',
      introTitle: 'Farbe verändert alles.',
      introText: 'Ein frischer Anstrich verändert den Charakter eines Raums nachhaltig. Ob Wohnungsrenovierung, Fassadensanierung oder gewerbliche Objekte – unsere Partnerbetriebe arbeiten mit hochwertigen Materialien und sauberer Abdeckung. Von der Farbberatung bis zur letzten Lackschicht.',
      benefits: [
        { title: 'Innenanstrich', desc: 'Wände, Decken, Türen und Heizkörper – sauber abgeklebt, streifenfrei gestrichen.' },
        { title: 'Fassadenanstrich', desc: 'Witterungsschutz und neuer Look für Ihr Haus – inkl. Putzausbesserung.' },
        { title: 'Bodenbeläge', desc: 'Laminat, Vinyl, Designboden und Teppich – fachgerecht verlegt mit Dämmung.' },
        { title: 'Trockenbau & Dämmung', desc: 'Raumkonzepte, Akustikdämmung und Vorsatzschalen für mehr Wohnqualität.' },
      ],
      faq: [
        { q: 'Was kostet das Streichen einer Wohnung?', a: 'Pro Raum ca. 300–800 € je nach Größe und Zustand. Gesamte 3-Zimmer-Wohnung: 2.000–4.000 € inkl. Material.' },
        { q: 'Wie oft muss die Fassade gestrichen werden?', a: 'Alle 10–15 Jahre je nach Lage und Material. Bei Rissen oder Verwitterung früher – rechtzeitig schützt es vor Schäden.' },
        { q: 'Welche Farbe für welchen Raum?', a: 'Schlafzimmer: ruhige Töne. Küche/Bad: feuchtigkeitsbeständige Farben. Wohnzimmer: persönliche Wahl. Wir beraten gerne.' },
        { q: 'Muss ich vor dem Streichen ausziehen?', a: 'Nein, aber Möbel sollten 1m von den Wänden entfernt oder abgedeckt werden. Der Maler übernimmt die Abdeckung professionell.' },
      ],
    },
    'garten-und-landschaftsbau': {
      heroTitle: 'Garten- und Landschaftsbau im Ruhrgebiet',
      heroSubtitle: 'Gartengestaltung, Rollrasen, Teichbau, Baumpflege – Grün-Profis in Ihrer Stadt. Von der Idee bis zum fertigen Garten.',
      introTitle: 'Ihr Garten. Unsere Leidenschaft.',
      introText: 'Ein schöner Garten ist Lebensqualität pur. Ob pflegeleichter Familiengarten, blühende Staudenwiese oder repräsentativer Vorgarten – unsere Partnerbetriebe gestalten Grünflächen, die zu Ihrem Leben passen. Mit regionaler Pflanzenauswahl und nachhaltigen Materialien.',
      benefits: [
        { title: 'Gartengestaltung', desc: 'Individuelle Konzepte von der Skizze bis zur Pflanzung – angepasst an Boden und Lage.' },
        { title: 'Rollrasen & Bepflanzung', desc: 'Sofort grün: hochwertiger Rollrasen und stimmige Stauden- und Gehölzkombinationen.' },
        { title: 'Teich- & Wasseranlagen', desc: 'Naturnahe Teiche, Bachläufe und Springbrunnen – inkl. Pflanzenfilter und Pflege.' },
        { title: 'Baumfällung & Pflege', desc: 'Fachgerechter Kronenschnitt, fällung gefährlicher Bäume und Stumpffräse.' },
      ],
      faq: [
        { q: 'Was kostet eine Gartengestaltung?', a: 'Kleiner Reihenhausgarten ab 3.000 €, großer Garten mit Terrasse 15.000–40.000 €. Kostenlose Beratung vor Ort.' },
        { q: 'Rollrasen oder säen?', a: 'Rollrasen: sofort nutzbar, ca. 15–25 €/m². Ansaat: günstiger, aber 6–12 Monate Wartezeit. Für Familien mit Kindern lohnt sich Rollrasen.' },
        { q: 'Wann ist die beste Zeit für Gartenarbeiten?', a: 'Pflanzzeit: März–Mai und September–Oktober. Rasen: April und September. Pflege: das ganze Jahr je nach Aufgabe.' },
        { q: 'Muss ich den Garten selbst pflegen?', a: 'Nein, viele Betriebe bieten regelmäßige Pflege an. Vereinbaren Sie ein Pflege-Abo für Beete, Rasen und Hecken.' },
      ],
    },
  }
  
  return contents[slug] || {
    heroTitle: 'Handwerker im Ruhrgebiet',
    heroSubtitle: 'Erfahrene Fachbetriebe in Ihrer Stadt. Kostenlose Besichtigung, transparente Festpreise, verbindliche Termine.',
    introTitle: 'Professionelle Leistungen in Ihrer Region',
    introText: 'Wir vermitteln Ihnen erfahrene Fachbetriebe im gesamten Ruhrgebiet. Alle Partner werden sorgfältig ausgewählt und arbeiten nach den anerkannten Regeln der Technik.',
    benefits: [
      { title: 'Kostenlose Besichtigung', desc: 'Vor Ort analysieren, beraten und ein Festpreis-Angebot erstellen.' },
      { title: 'Verbindliche Termine', desc: 'Wir halten, was wir versprechen – pünktlich und zuverlässig.' },
      { title: 'Qualitätsgarantie', desc: 'Alle Arbeiten werden fachgerecht ausgeführt und abgenommen.' },
      { title: 'Transparenz', desc: 'Keine versteckten Kosten – das Angebot ist der Endpreis.' },
    ],
    faq: [
      { q: 'Wie finde ich einen Fachbetrieb?', a: 'Wählen Sie Ihre Stadt aus der Liste unten und fordern Sie direkt ein Angebot an.' },
      { q: 'Was kostet die Anfrage?', a: 'Nichts. Die Anfrage und Besichtigung sind komplett kostenlos und unverbindlich.' },
      { q: 'Wie schnell bekomme ich ein Angebot?', a: 'In der Regel innerhalb von 24–48 Stunden nach der Besichtigung.' },
      { q: 'Gibt es eine Garantie?', a: 'Ja, alle Partnerbetriebe gewähren auf ihre Arbeiten eine umfassende Garantie.' },
    ],
  }
}

export default function TradeOverviewPage({ params }: PageProps) {
  const cleanTrade = params.trade?.replace(/\/$/, '') || params.trade
  const trade = getTrade(cleanTrade)
  
  if (!trade) notFound()
  
  const cities = getAllCities()
  const content = getTradeContent(trade.slug)
  const services = trade.services || []
  
  return (
    <div className="min-h-screen bg-white text-ink-800 antialiased" style={{fontFamily: "'Inter',system-ui,sans-serif"}}>
      
      {/* ═══════════ HEADER ═══════════ */}
      <header className="bg-white/95 backdrop-blur border-b border-ink-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center text-white text-lg font-black">F</span>
            <span className="leading-tight">
              <span className="block font-extrabold text-lg text-ink-900">fachschmiede.de</span>
              <span className="block text-xs text-ink-500 font-medium">{trade.name} im Ruhrgebiet</span>
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-ink-600">
            <a href="#leistungen" className="hover:text-brand-600 transition">Leistungen</a>
            <a href="#staedte" className="hover:text-brand-600 transition">Städte</a>
            <a href="#vorteile" className="hover:text-brand-600 transition">Vorteile</a>
            <a href="#faq" className="hover:text-brand-600 transition">FAQ</a>
            <a href="#kontakt" className="hover:text-brand-600 transition">Kontakt</a>
          </nav>
          <a href="#kontakt" className="hidden sm:inline-flex bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition shadow-sm">
            Angebot anfordern
          </a>
        </div>
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-white">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-5xl">{trade.emoji}</span>
              <div>
                <p className="text-brand-400 font-bold text-sm uppercase tracking-widest">Alle Städte im Ruhrgebiet</p>
                <p className="text-ink-400 text-sm">{cities.length} Städte · {services.length} Leistungen · 1 Ansprechpartner</p>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
              {content.heroTitle}
            </h1>
            <p className="mt-6 text-lg text-ink-300 leading-relaxed max-w-2xl">
              {content.heroSubtitle}
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a href="#staedte" className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition shadow-lg shadow-brand-600/30">
                Ihre Stadt wählen
              </a>
              <a href="#kontakt" className="inline-flex justify-center items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur text-white font-bold px-8 py-4 rounded-xl text-lg transition">
                Kostenlose Beratung
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TRUST BAR ═══════════ */}
      <section className="bg-ink-900 border-t border-ink-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: String(cities.length), label: 'Städte im Ruhrgebiet' },
              { value: String(services.length), label: 'Fachleistungen' },
              { value: '100%', label: 'Kostenlose Besichtigung' },
              { value: '24h', label: 'Schnelle Rückmeldung' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-black text-brand-400">{stat.value}</p>
                <p className="mt-1 text-sm text-ink-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ INTRO / ABOUT THE TRADE ═══════════ */}
      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-brand-600 font-bold text-sm uppercase tracking-widest">Über das Gewerk</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">
              {content.introTitle}
            </h2>
            <p className="mt-6 text-lg text-ink-600 leading-relaxed">
              {content.introText}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ SERVICES ═══════════ */}
      <section id="leistungen" className="py-20 sm:py-24 bg-ink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-brand-600 font-bold text-sm uppercase tracking-widest">Unsere Leistungen</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">
              {trade.name}-Leistungen im Überblick
            </h2>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service: string, i: number) => (
              <div key={i} className="bg-white rounded-2xl p-7 border border-ink-200 hover:shadow-xl hover:-translate-y-1 transition duration-300">
                <span className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center text-2xl">
                  {getServiceEmoji(i, trade.slug)}
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink-900">{service}</h3>
                <p className="mt-2 text-ink-600 text-sm leading-relaxed">
                  Professionelle {service} in {cities.length} Städten des Ruhrgebiets. Kostenlose Besichtigung & Festpreis.
                </p>
                <a href="#staedte" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:gap-2 transition-all">
                  Stadt wählen <span>→</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CITY GRID ═══════════ */}
      <section id="staedte" className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-brand-600 font-bold text-sm uppercase tracking-widest">{cities.length} Städte</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">
              {trade.name} in Ihrer Stadt finden
            </h2>
            <p className="mt-4 text-ink-600 text-lg">
              Wählen Sie Ihre Stadt – Sie landen direkt auf der lokalen Seite mit Anfrageformular, 
              lokalen Informationen und kostenlosem Angebot.
            </p>
          </div>
          
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {cities.map((city: any) => (
              <Link
                key={city.slug}
                href={`/${trade.slug}/${city.slug}/`}
                className="group flex items-center gap-2 bg-white rounded-xl border border-ink-200 px-4 py-3.5 hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 transition duration-200"
              >
                <span className="w-2 h-2 rounded-full bg-ink-200 group-hover:bg-brand-500 transition flex-shrink-0" />
                <span className="text-sm font-semibold text-ink-700 group-hover:text-brand-700 transition truncate">
                  {trade.name} {city.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BENEFITS ═══════════ */}
      <section id="vorteile" className="py-20 sm:py-24 bg-ink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-brand-600 font-bold text-sm uppercase tracking-widest">Ihre Vorteile</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">
              Warum {trade.name} über fachschmiede.de?
            </h2>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 gap-6">
            {content.benefits.map((benefit: any, i: number) => (
              <div key={i} className="flex items-start gap-4 bg-white rounded-2xl p-7 border border-ink-100 hover:shadow-lg transition">
                <span className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center text-xl font-black flex-shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-ink-900">{benefit.title}</h3>
                  <p className="mt-1.5 text-ink-600 text-sm leading-relaxed">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-brand-600 font-bold text-sm uppercase tracking-widest">So einfach geht's</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">
              In 3 Schritten zum Festpreis-Angebot
            </h2>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Stadt wählen', desc: `Wählen Sie Ihre Stadt aus den ${cities.length} Städten des Ruhrgebiets. Jede Stadt hat eine eigene lokale Seite mit Ansprechpartner.` },
              { step: '2', title: 'Anfrage senden', desc: 'Beschreiben Sie kurz Ihr Anliegen im Kontaktformular. Sie erhalten zeitnah einen Rückruf mit einem Terminvorschlag.' },
              { step: '3', title: 'Festpreis erhalten', desc: 'Nach der kostenlosen Besichtigung erhalten Sie ein schriftliches Angebot mit Festpreis – ohne versteckte Kosten.' },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-ink-200" />
                )}
                <div className="relative w-16 h-16 mx-auto rounded-2xl bg-brand-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-brand-600/30">
                  {item.step}
                </div>
                <h3 className="mt-5 text-lg font-bold text-ink-900">{item.title}</h3>
                <p className="mt-2 text-ink-600 text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="py-20 sm:py-24 bg-ink-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-brand-600 font-bold text-sm uppercase tracking-widest">Häufige Fragen</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">
              {trade.name} – Ihre Fragen, unsere Antworten
            </h2>
          </div>
          <div className="mt-10 space-y-4">
            {content.faq.map((faq: any, i: number) => (
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

      {/* ═══════════ LEAD MAGNET / KONTAKT ═══════════ */}
      <section id="kontakt" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-brand-600 font-bold text-sm uppercase tracking-widest">Kostenlose Beratung</p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">
                {trade.name}-Angebot anfordern
              </h2>
              <p className="mt-4 text-ink-600 text-lg leading-relaxed">
                Beschreiben Sie kurz Ihr Projekt. Wir verbinden Sie mit einem erfahrenen 
                {trade.name.toLowerCase()}betrieb aus Ihrer Region – kostenlos und unverbindlich.
              </p>
              
              <div className="mt-8 space-y-4">
                {[
                  { icon: '✅', text: 'Kostenlose Besichtigung vor Ort' },
                  { icon: '📋', text: 'Schriftliches Festpreis-Angebot' },
                  { icon: '⏱️', text: 'Rückmeldung innerhalb von 24h' },
                  { icon: '🛡️', text: 'Qualitätsgarantie auf alle Arbeiten' },
                  { icon: '💬', text: 'Persönliche Beratung ohne Callcenter' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-ink-700 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-brand-50 border border-brand-200 rounded-2xl p-6">
                <p className="font-black text-ink-900">💼 Sind Sie {trade.name}?</p>
                <p className="mt-1.5 text-sm text-ink-600 leading-relaxed">
                  Mieten Sie eine fertige Stadt-Website mit Ihrem Firmennamen, Ihrer Rufnummer und 
                  Ihren Leistungen. Sofort online, monatlich kündbar.
                </p>
                <Link href="/fuer-dienstleister/" className="mt-4 inline-block bg-ink-900 hover:bg-ink-800 text-white text-sm font-bold px-6 py-3 rounded-lg transition">
                  Mehr erfahren →
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-ink-100 p-7 sm:p-10">
              <h3 className="text-xl font-black text-ink-900 mb-6">Anfrage senden</h3>
              <form>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-ink-800 mb-1.5">Name *</label>
                    <input type="text" required placeholder="Max Mustermann" className="w-full rounded-lg border border-ink-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-ink-800 mb-1.5">Telefon *</label>
                    <input type="tel" required placeholder="0…" className="w-full rounded-lg border border-ink-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                  </div>
                </div>
                <div className="mt-5">
                  <label className="block text-sm font-bold text-ink-800 mb-1.5">Ihre Stadt *</label>
                  <select required className="w-full rounded-lg border border-ink-200 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent">
                    <option value="">Bitte wählen …</option>
                    {cities.map((city: any) => (
                      <option key={city.slug} value={city.slug}>{city.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-5">
                  <label className="block text-sm font-bold text-ink-800 mb-1.5">Worum geht es? *</label>
                  <select required className="w-full rounded-lg border border-ink-200 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent">
                    <option value="">Bitte auswählen …</option>
                    {services.map((s: string, i: number) => (
                      <option key={i}>{s}</option>
                    ))}
                    <option>Sonstiges / Beratung</option>
                  </select>
                </div>
                <div className="mt-5">
                  <label className="block text-sm font-bold text-ink-800 mb-1.5">Nachricht *</label>
                  <textarea rows={4} required placeholder="Beschreiben Sie kurz Ihr Anliegen …" className="w-full rounded-lg border border-ink-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
                </div>
                <label className="mt-5 flex items-start gap-3 text-sm text-ink-600">
                  <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
                  <span>Ich bin mit der Verarbeitung meiner Daten zur Bearbeitung der Anfrage einverstanden. *</span>
                </label>
                <button type="submit" className="mt-7 w-full bg-brand-600 hover:bg-brand-700 text-white font-black text-lg py-4 rounded-xl transition shadow-lg shadow-brand-600/25">
                  Kostenlose Beratung anfordern
                </button>
                <p className="mt-4 text-xs text-ink-400 text-center">Demo-Formular – es werden keine Daten übertragen.</p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CROSS-LINKS TO OTHER TRADES ═══════════ */}
      <section className="py-16 bg-ink-50 border-t border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-bold text-ink-500 uppercase tracking-widest mb-6">Weitere Gewerke</p>
          <div className="flex flex-wrap justify-center gap-3">
            {/* @ts-ignore */}
            {(() => { const { getAllTrades } = require('../../config/system-config'); return getAllTrades().filter((t: any) => t.slug !== trade.slug).map((t: any) => (
              <Link key={t.slug} href={`/${t.slug}/`} className="inline-flex items-center gap-2 bg-white rounded-full border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-600 hover:border-brand-300 hover:text-brand-600 hover:shadow-sm transition">
                <span>{t.emoji}</span> {t.plural}
              </Link>
            )) })()}
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-ink-900 text-ink-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center text-white text-lg font-black">F</span>
                <span className="leading-tight">
                  <span className="block font-extrabold text-white">fachschmiede.de</span>
                  <span className="block text-xs text-ink-400">{trade.name} im Ruhrgebiet</span>
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink-400">
                Lokale Fachbetriebe in {cities.length} Städten des Ruhrgebiets. Kostenlose Besichtigung, transparente Festpreise.
              </p>
            </div>
            <div>
              <p className="font-bold text-white text-sm uppercase tracking-widest">Beliebte Städte</p>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {cities.slice(0, 10).map((city: any) => (
                  <li key={city.slug}>
                    <Link href={`/${trade.slug}/${city.slug}/`} className="text-ink-400 hover:text-brand-400 transition">
                      {trade.name} {city.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-white text-sm uppercase tracking-widest">Service</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link href="/" className="text-ink-400 hover:text-brand-400 transition">Startseite</Link></li>
                <li><Link href="/fuer-dienstleister/" className="text-ink-400 hover:text-brand-400 transition">Für Handwerker</Link></li>
                <li><Link href="/impressum" className="text-ink-400 hover:text-brand-400 transition">Impressum</Link></li>
                <li><Link href="/datenschutz" className="text-ink-400 hover:text-brand-400 transition">Datenschutzerklärung</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-ink-800 py-5 text-center text-xs text-ink-500">
          <p>© {new Date().getFullYear()} fachschmiede.de – Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  )
}

function getServiceEmoji(index: number, tradeSlug: string): string {
  const emojiMap: Record<string, string[]> = {
    'dachdecker': ['🏠', '🔨', '🪟', '🌧️', '🔍', '📐'],
    'elektriker': ['⚡', '🔌', '🏠', '🤖', '✅', '💡'],
    'klempner': ['🔥', '🚿', '💧', '🚽', '🛁', '🆘'],
    'zimmerer': ['🪵', '🏠', '🚗', '🏛️', '📐', '🏗️'],
    'maler': ['🎨', '🖌️', '🏠', '📐', '🪵', '✨'],
    'garten-und-landschaftsbau': ['🌳', '✂️', '🌱', '💧', '🏡', '🍂'],
  }
  const emojis = emojiMap[tradeSlug] || ['🔧', '🛠️', '⚙️', '📐', '✅', '🔨']
  return emojis[index % emojis.length]
}
