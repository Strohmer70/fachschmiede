"use client";

import { useState, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════
   TRADE-KONFIGURATION
   ═══════════════════════════════════════════════════════════════ */
interface TradeConfig {
  color: string;
  heroImage: string;
  teamImage: string;
  iconPath: string;
  name: string;
  label: string;
  services: { icon: string; title: string; desc: string }[];
  faq: { q: string; a: string }[];
  blog: { title: string; slug: string }[];
  contactFormOptions: string[];
  phone: string;
  whatsappNumber: string;
}

const TRADES: Record<string, TradeConfig> = {
  dachdecker: {
    color: "#f97316",
    heroImage: "/images/hero.jpg",
    iconPath: "M3 12l9-8 9 8M5 10v10h14V10",
    teamImage: "/images/team.jpg",
    name: "Dachdecker",
    label: "Dachdecker",
    services: [
      { icon: "🏠", title: "Dachsanierung", desc: "Komplette Sanierung von Steildächern mit Dachziegeln oder Schiefer. Inklusive Unterspannbahn, Lattung und Dachfenster." },
      { icon: "🔧", title: "Dachreparatur", desc: "Schadstellen lokalisieren und fachgerecht beheben – undicht, abgehängt, beschädigt. Mit Garantie auf die Reparaturstelle." },
      { icon: "🚨", title: "Dachdecker-Notdienst", desc: "Sturmschaden, Wassereinbruch oder abgedeckt? Wir sichern das Dach kurzfristig und planen die dauerhafte Reparatur." },
      { icon: "🪟", title: "Dachfenster", desc: "Einbau und Austausch von Dachfenstern aller Marken. Optimiert für Licht, Lüftung und Energieeffizienz." },
      { icon: "🏢", title: "Flachdach", desc: "Abdichtung, Sanierung und Neubau von Flachdächern. Abdichtungssysteme für PVC, Bitumen und Flüssigkunststoff." },
      { icon: "🏡", title: "Gauben & Aufstockung", desc: "Gaubenbau und Dachaufstockung für mehr Wohnraum unter dem Dach. Statisch geprüft und wärmebrückenfrei." },
    ],
    faq: [
      { q: "Was kostet eine Dachsanierung in Hattingen?", a: "Je nach Dachfläche, Material und Zustand liegen Komplettsanierungen typischerweise zwischen 8.000 € und 25.000 €. Nach einer kostenlosen Bestandsaufnahme erhalten Sie ein detailliertes Festpreis-Angebot." },
      { q: "Wie lange hält ein gedecktes Dach?", a: "Ein gut gepflegtes Ziegeldach hält 50–70 Jahre, Schiefer sogar über 100 Jahre. Regelmäßige Dachinspektionen verlängern die Lebensdauer deutlich." },
      { q: "Was ist eine Dachinspektion und wann ist sie sinnvoll?", a: "Eine Dachinspektion deckt verborgene Schäden frühzeitig auf – besonders nach Sturm, Hagel oder wenn das Dach älter als 20 Jahre ist. Sie erhalten ein bebildertes Gutachten." },
      { q: "Wie schnell sind Sie im Notdienst vor Ort?", a: "Bei akutem Wassereinbruch oder Sturmschaden sind wir in Hattingen und Umgebung in der Regel innerhalb von 2–4 Stunden vor Ort zur Erstsicherung." },
    ],
    blog: [
      { title: "Dachsanierung: Wann lohnt sich die Investition?", slug: "dachsanierung-lohnt-sich" },
      { title: "Dachfenster einbauen: Mehr Licht unter dem Dach", slug: "dachfenster-einbauen" },
      { title: "Flachdach abdichten: Systeme im Vergleich", slug: "flachdach-abdichten" },
    ],
    contactFormOptions: ["Dachsanierung", "Dachreparatur", "Dachfenster", "Flachdach", "Gaubenbau", "Notdienst", "Sonstiges"],
    phone: "02324 / 123 456 78",
    whatsappNumber: "4915123456789",
  },
  elektriker: {
    color: "#3b82f6",
    heroImage: "/images/hero-elektro.jpg",
    iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
    teamImage: "/images/team-elektro.jpg",
    name: "Elektriker",
    label: "Elektriker",
    services: [
      { icon: "⚡", title: "Elektroinstallation", desc: "Neuinstallation, Erweiterung und Modernisierung – von der Leitung bis zum Schalterprogramm. Sauber geplant, normgerecht ausgeführt." },
      { icon: "✅", title: "E-Check & Prüfung", desc: "Sicherheitsprüfung Ihrer Elektroanlage mit Prüfprotokoll – für Eigentümer, Käufer und Vermieter. Inklusive Mängelliste mit klaren Prioritäten." },
      { icon: "🚗", title: "Wallbox & E-Mobilität", desc: "Wallbox planen, anmelden, installieren: Wir kümmern uns um Anschlussleistung, Zählerschrank und Netzbetreiber – bis zum ersten Ladevorgang." },
      { icon: "🏠", title: "Smart Home", desc: "Licht, Heizung, Rollladen intelligent steuern – funk- oder busbasiert, auch im Bestand ohne große Umbauten nachrüstbar." },
      { icon: "☀️", title: "Photovoltaik", desc: "PV-Anlage mit Speicher und Wallbox aus einer Hand: Ertragsrechnung, Montage, Anmeldung beim Netzbetreiber, Inbetriebnahme." },
      { icon: "🛠️", title: "Störung & Reparatur", desc: "Sicherung fliegt raus, Steckdose tot, FI löst aus? Wir finden die Ursache und beheben sie – im Notdienst auch kurzfristig." },
    ],
    faq: [
      { q: "Was kostet eine Wallbox-Installation in Hattingen?", a: "Je nach Anschlussleistung, Leitungsweg und Zählerschrank liegen typische Projekte in Hattingen zwischen 900 und 2.500 € inklusive Wallbox. Nach einem kostenlosen Vor-Ort-Check erhalten Sie einen Festpreis." },
      { q: "Muss mein Zählerschrank erneuert werden?", a: "Wenn er älter als ca. 30 Jahre ist oder kein Platz für FI-Schalter und Überspannungsschutz bleibt – meist ja. Wir prüfen das kostenlos und sagen Ihnen ehrlich, was nötig ist." },
      { q: "Was ist der E-Check?", a: "Der E-Check ist die anerkannte Sicherheitsprüfung Ihrer Elektroanlage: Leitungen, Schutzmaßnahmen, Geräte. Sie erhalten ein Prüfprotokoll mit allen Mängeln und einer klaren Empfehlung – ideal auch für Käufer und Vermieter." },
      { q: "Wie schnell bekomme ich einen Termin?", a: "Für Beratung und Besichtigung in Hattingen meist innerhalb einer Woche. Bei Störungen und Ausfällen sind wir im Notdienst deutlich schneller." },
    ],
    blog: [
      { title: "E-Check: Wann lohnt sich die Sicherheitsprüfung?", slug: "e-check-sicherheit" },
      { title: "Smart Home nachrüsten: Einstieg ohne großen Umbau", slug: "smart-home-nachruesten" },
      { title: "Wallbox zu Hause: Das müssen Sie vor der Installation wissen", slug: "wallbox-zuhause" },
    ],
    contactFormOptions: ["Elektroinstallation", "E-Check & Prüfung", "Wallbox & E-Mobilität", "Smart Home", "Photovoltaik", "Störung & Reparatur", "Sonstiges"],
    phone: "02324 / 123 456 78",
    whatsappNumber: "4915123456789",
  },
  klempner: {
    color: "#14b8a6",
    heroImage: "/images/hero-klempner.jpg",
    iconPath: "M12 2v4m0 12v4m-4-8H4m16 0h-4",
    teamImage: "/images/team-klempner.jpg",
    name: "Klempner",
    label: "SHK / Klempner",
    services: [
      { icon: "🔥", title: "Heizungsinstallation", desc: "Neuinstallation und Austausch von Heizungen aller Art. Inklusive Hydraulischer Abgleich, Thermostatventile und Energieberatung." },
      { icon: "🚿", title: "Rohrreinigung", desc: "Verstopfte Abflüsse, Rohre und Kanäle professionell gereinigt – mit Kamera-Inspektion, Hochdruckspülung und Dichtheitsprüfung." },
      { icon: "🛁", title: "Badsanierung", desc: "Komplette Badrenovierung aus einer Hand: Entwässerung, Heizkörper, Armaturen, Fliesen und Abdichtung. Mit Festpreis-Garantie." },
      { icon: "❄️", title: "Wärmepumpe", desc: "Beratung, Planung und Installation von Wärmepumpen. Fördermittel-Check, JAZ-Berechnung und Anschluss an bestehende Heizkörper." },
      { icon: "🚨", title: "Rohrbruch-Notdienst", desc: "Wasserschaden, Rohrbruch oder Überschwemmung? Wir finden die Leckage, schließen sie und sanieren die Schäden – rund um die Uhr." },
      { icon: "☀️", title: "Solarthermie", desc: "Warmwasser und Heizungsunterstützung mit Solarthermie. Kollektoren, Speicher und Regelung aus einer Hand – inklusive Förderung." },
    ],
    faq: [
      { q: "Was kostet eine Badsanierung in Hattingen?", a: "Eine Komplettsanierung inklusive Entwässerung, Fliesen, Armaturen und Heizkörper liegt typischerweise zwischen 8.000 € und 20.000 €. Nach einer kostenlosen Bestandsaufnahme erhalten Sie ein detailliertes Festpreis-Angebot." },
      { q: "Wann sollte die Heizung erneuert werden?", a: "Heizungen älter als 15–20 Jahre sollten überprüft werden. Moderne Brennwert- oder Wärmepumpen-Technologie senkt die Heizkosten um bis zu 30 %." },
      { q: "Was tun bei einem Wasserschaden?", a: "Erst Wasser abstellen, dann uns rufen. Wir lokalisieren die Leckage mit Thermografie und Endoskopie, schließen sie dauerhaft und dokumentieren für die Versicherung." },
      { q: "Wie schnell sind Sie im Notdienst vor Ort?", a: "Bei Rohrbruch oder Wasserschaden in Hattingen und Umgebung in der Regel innerhalb von 1–2 Stunden. Wir sind 24/7 erreichbar." },
    ],
    blog: [
      { title: "Heizung modernisieren: Wann lohnt sich der Austausch?", slug: "heizung-modernisieren" },
      { title: "Rohrverstopfung vermeiden: Tipps für den Haushalt", slug: "rohrverstopfung-vermeiden" },
      { title: "Wärmepumpe: Kosten und Förderung im Überblick", slug: "waermepumpe-kosten" },
    ],
    contactFormOptions: ["Heizungsinstallation", "Rohrreinigung", "Badsanierung", "Wärmepumpe", "Rohrbruch-Notdienst", "Solarthermie", "Sonstiges"],
    phone: "02324 / 123 456 78",
    whatsappNumber: "4915123456789",
  },
  maler: {
    color: "#f43f5e",
    heroImage: "/images/hero-maler.jpg",
    iconPath: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12",
    teamImage: "/images/team-maler.jpg",
    name: "Maler",
    label: "Maler",
    services: [
      { icon: "🎨", title: "Innenanstrich", desc: "Wohnräume, Küchen, Bäder und Büros professionell gestrichen. Inklusive Spachtelarbeit, Grundierung und zwei Deckanstrichen in Wunschfarbe." },
      { icon: "🏠", title: "Außenanstrich", desc: "Fassaden, Giebel und Außenwände wetterfest streichen. Fassadenanstriche mit Silikonharz, Mineralputz oder Dispersionsfarbe." },
      { icon: "🧱", title: "Tapezierarbeit", desc: "Vliestapeten, Papier- oder Vinyltapeten fachgerecht tapezieren. Inklusive Untergrundvorbereitung und Kantenbearbeitung." },
      { icon: "🔨", title: "Fassadensanierung", desc: "Fassadenreinigung, Ausbesserung von Rissen, Neuverputzung und Anstrich. Mit Wärmedämmung und Schimmelprävention." },
      { icon: "🪵", title: "Bodenbeläge", desc: "Laminat, Vinyl, Designboden und Teppichboden verlegen. Inklusive Entfernung alter Beläge und Untergrundvorbereitung." },
      { icon: "✨", title: "Lackierung", desc: "Türen, Fenster, Treppen und Möbel lackieren. Schleifen, Grundieren und Lackieren mit hochwertigen Materialien für langlebigen Schutz." },
    ],
    faq: [
      { q: "Was kostet ein Innenanstrich in Hattingen?", a: "Je nach Raumgröße, Zustand der Wände und Anzahl der Anstriche liegen die Kosten typischerweise zwischen 8 € und 15 € pro Quadratmeter. Nach einer Besichtigung erhalten Sie ein Festpreis-Angebot." },
      { q: "Wie oft sollte eine Fassade gestrichen werden?", a: "Alle 10–15 Jahre ist eine Auffrischung empfohlen, je nach Lage und vorherigem Anstrich. Bei Algen- oder Schimmelbefall sollte früher gehandelt werden." },
      { q: "Welche Farbe eignet sich für welchen Raum?", a: "Feuchträume benötigen spezielle Feuchtigkeitsschutzfarben, Wohnräume profitieren von atmungsaktiven Dispersionsfarben. Wir beraten Sie gerne vor Ort." },
      { q: "Wie lange trocknet ein frischer Anstrich?", a: "Bei 20 °C und guter Lüftung ist die Oberfläche nach 4–6 Stunden staubtrocken, nach 24 Stunden überstreichbar. Vollständige Aushärtung dauert etwa 2–4 Wochen." },
    ],
    blog: [
      { title: "Wandfarben-Trends: Was ist 2024 angesagt?", slug: "wandfarben-trends" },
      { title: "Fassade streichen: Kosten und Zeitplanung", slug: "fassade-streichen-kosten" },
      { title: "Tapezieren wie ein Profi: Tipps und Tricks", slug: "tapezieren-tipps" },
    ],
    contactFormOptions: ["Innenanstrich", "Außenanstrich", "Tapezierarbeit", "Fassadensanierung", "Bodenbeläge", "Lackierung", "Sonstiges"],
    phone: "02324 / 123 456 78",
    whatsappNumber: "4915123456789",
  },
  zimmerer: {
    color: "#f59e0b",
    heroImage: "/images/hero-zimmerer.jpg",
    iconPath: "M3 7l9-4 9 4v10l-9 4-9-4V7z",
    teamImage: "/images/team-zimmerer.jpg",
    name: "Zimmerer",
    label: "Zimmerer",
    services: [
      { icon: "🏗️", title: "Dachstuhl", desc: "Neubau, Erneuerung und Reparatur von Dachstühlen aus Holz. Statisch berechnet, mit Nagelplatten oder traditioneller Zimmermannsart." },
      { icon: "🚗", title: "Carport", desc: "Individuell geplante Carports aus Holz – freistehend, angebaut oder mit Geräteraum. Wetterfest imprägniert und optisch ansprechend." },
      { icon: "🏡", title: "Holzrahmenbau", desc: "Energieeffizientes Bauen mit Holzrahmenbauweise. Schnelle Bauzeit, hohe Dämmwerte und nachhaltiges Baumaterial aus regionaler Forstwirtschaft." },
      { icon: "🌤️", title: "Terrassenüberdachung", desc: "Maßgefertigte Überdachungen aus Holz und Glas. Wettergeschützter Freisitz mit optionaler Markise oder Beleuchtung." },
      { icon: "🪵", title: "Innenausbau", desc: "Holzvertäfelung, Deckenverkleidung, Treppenbau und Einbauschränke aus Massivholz oder Furnier. Maßarbeit mit Charakter." },
      { icon: "🛡️", title: "Holzschutz", desc: "Imprägnierung, Lasur und Schutz gegen Holzwurm, Pilze und Witterung. Mit ökologischen Mitteln und langanhaltendem Schutz." },
    ],
    faq: [
      { q: "Was kostet ein neuer Dachstuhl in Hattingen?", a: "Je nach Größe, Holzart und Dachform liegen die Kosten typischerweise zwischen 15.000 € und 40.000 €. Nach einer statischen Berechnung und Besichtigung erhalten Sie ein Festpreis-Angebot." },
      { q: "Wie lange hält ein Holzcarport?", a: "Mit qualitativ hochwertigem Holz, korrekter Imprägnierung und regelmäßiger Pflege halten Carports 20–30 Jahre und länger." },
      { q: "Was ist ein Holzrahmenbau und wann ist er sinnvoll?", a: "Der Holzrahmenbau ist eine moderne, energieeffiziente Bauweise mit kurzer Bauzeit. Besonders sinnvoll für Anbauten, Einfamilienhäuser und ökologisches Bauen." },
      { q: "Wann muss Holz imprägniert werden?", a: "Neues Holz sollte vor dem ersten Witterungseinstand imprägniert werden. Nachbehandlungen alle 3–5 Jahre mit Lasur oder Öl verlängern die Lebensdauer deutlich." },
    ],
    blog: [
      { title: "Dachstuhl erneuern: Kosten und Ablauf", slug: "dachstuhl-erneuern-kosten" },
      { title: "Carport bauen: Planung und Genehmigung", slug: "carport-bauen-planung" },
      { title: "Holzschutz im Außenbereich: So bleibt Ihr Holz lange schön", slug: "holzschutz-aussenbereich" },
    ],
    contactFormOptions: ["Dachstuhl", "Carport", "Holzrahmenbau", "Terrassenüberdachung", "Innenausbau", "Holzschutz", "Sonstiges"],
    phone: "02324 / 123 456 78",
    whatsappNumber: "4915123456789",
  },
};

const CITY = {
  name: "Hattingen",
  population: 54000,
  region: "Ennepe-Ruhr-Kreis",
  river: "an der Ruhr",
};

/* ═══════════════════════════════════════════════════════════════
   CLIENT COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function MusterPageClient({ tradeKey }: { tradeKey: string }) {
  const resolvedKey = tradeKey === "shk" ? "klempner" : tradeKey;
  const cfg = TRADES[resolvedKey] || TRADES.elektriker;
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  /* ── Scroll-Reveal ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const toggleFaq = (idx: number) => {
    setOpenFaq((prev) => (prev === idx ? null : idx));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess(true);
  };

  const c = cfg.color;

  return (
    <>
      {/* ═══════════ DEMO-HINWEIS ═══════════ */}
      <div
        className="text-white text-center text-xs sm:text-sm font-semibold py-2 px-4"
        style={{ backgroundColor: "#f97316" }}
      >
        ⚠️ MUSTERSEITE – Beispiel einer Miet-Website für Handwerksbetriebe. Alle
        Inhalte, Namen, Bilder und Bewertungen sind fiktiv.
      </div>

      {/* ═══════════ DEMO-NAVIGATION ═══════════ */}
      <div className="bg-ink-900 text-ink-300 text-xs sm:text-sm py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          <span className="font-bold text-white uppercase tracking-widest text-[10px] sm:text-xs">
            Demo-Portal:
          </span>
          <a href="/start" className="hover:text-white transition">💼 Salespage</a>
          <a href="/sales-dachdecker" className="hover:text-white transition">🏠 Gewerk Dachdecker</a>
          <a href="/sales-elektriker" className="hover:text-white transition">⚡ Gewerk Elektriker</a>
          <a href="/sales-klempner" className="hover:text-white transition">🔥 Gewerk Klempner</a>
          <a href="/sales-zimmerer" className="hover:text-white transition">🔨 Gewerk Zimmerer</a>
          <a href="/sales-maler" className="hover:text-white transition">🖌️ Gewerk Maler</a>
          <a href="/admin" className="hover:text-white transition">🛠 Admin-Dashboard</a>
        </div>
      </div>

      {/* ═══════════ HEADER ═══════════ */}
      <header className="bg-white/95 backdrop-blur border-b border-ink-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
          <a href="#" className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: c }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={cfg.iconPath} />
              </svg>
            </span>
            <span className="leading-tight">
              <span className="block font-extrabold text-lg text-ink-900">
                {cfg.name} {CITY.name}
              </span>
              <span className="block text-xs text-ink-500 font-medium">
                Miet-Website ·{" "}
                <span className="font-bold" style={{ color: c }}>
                  noch frei
                </span>
              </span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-ink-600">
            {[
              { href: "#leistungen", label: "Leistungen" },
              { href: "#ort", label: CITY.name },
              { href: "#ratgeber", label: "Ratgeber" },
              { href: "#faq", label: "FAQ" },
              { href: "#kontakt", label: "Kontakt" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition"
                style={{ color: undefined }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = c)}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "")}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={`/sales-${tradeKey}`}
              className="hidden sm:inline-flex text-white text-sm font-bold px-5 py-2.5 rounded-lg transition shadow-sm"
              style={{ backgroundColor: c }}
            >
              Diese Seite mieten
            </a>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden p-2 rounded-lg hover:bg-ink-100"
              aria-label="Menü öffnen"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-ink-100 bg-white px-4 py-4 space-y-1 text-sm font-semibold text-ink-700">
            <a href="#leistungen" className="block py-2.5 px-3 rounded-lg hover:bg-ink-50" onClick={() => setMenuOpen(false)}>Leistungen</a>
            <a href="#ort" className="block py-2.5 px-3 rounded-lg hover:bg-ink-50" onClick={() => setMenuOpen(false)}>{CITY.name}</a>
            <a href="#ratgeber" className="block py-2.5 px-3 rounded-lg hover:bg-ink-50" onClick={() => setMenuOpen(false)}>Ratgeber</a>
            <a href="#faq" className="block py-2.5 px-3 rounded-lg hover:bg-ink-50" onClick={() => setMenuOpen(false)}>FAQ</a>
            <a href="#kontakt" className="block py-2.5 px-3 rounded-lg hover:bg-ink-50" onClick={() => setMenuOpen(false)}>Kontakt</a>
            <a
              href={`/sales-${tradeKey}`}
              className="block mt-2 text-white text-center font-bold px-5 py-3 rounded-lg"
              style={{ backgroundColor: c }}
            >
              Diese Seite mieten
            </a>
          </div>
        )}
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-[86vh] flex items-center">
        <img
          src={cfg.heroImage}
          alt={`${cfg.name} bei der Arbeit`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(105deg, rgba(15,23,42,.92) 0%, rgba(15,23,42,.75) 45%, rgba(15,23,42,.35) 100%)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-white">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 bg-white/10 border border-white/25 backdrop-blur rounded-full px-4 py-1.5 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              {cfg.name} in {CITY.name} – kostenlose Besichtigung
            </p>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
              {cfg.name} in {CITY.name}.
              <br />
              <span style={{ color: cfg.color }}>Festpreis. Feste Termine.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-200 leading-relaxed max-w-xl">
              {cfg.name} aus {CITY.name} – Ihr Partner für alle Arbeiten rund ums
              Gewerk. Kostenlose Besichtigung, transparente Festpreise und
              termingerechte Ausführung.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="#kontakt"
                className="text-white font-bold px-8 py-4 rounded-xl text-lg transition shadow-lg"
                style={{ backgroundColor: c, boxShadow: `${c}4D 0px 8px 24px` }}
              >
                Kostenlose Besichtigung anfragen
              </a>
              <a
                href="#leistungen"
                className="inline-flex justify-center items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur text-white font-bold px-8 py-4 rounded-xl text-lg transition"
              >
                Leistungen ansehen
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ VERFÜGBARKEITS-BANNER ═══════════ */}
      <section
        className="border-y"
        style={{ backgroundColor: `${c}14`, borderColor: `${c}33` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2">
            <p className="font-black text-ink-900 text-lg">
              Diese Website ist eine Miet-Website – und für {CITY.name} noch frei.
            </p>
            <p className="mt-2 text-ink-600 text-sm leading-relaxed">
              Sie steht heute neutral im Netz und kann sofort angemietet werden:
              Dein Firmenname, deine Kontaktdaten, deine Leistungen – fertig
              individualisiert in wenigen Minuten. Alle Texte auf dieser Seite
              sind für <strong>{CITY.name}</strong> individuell formuliert; jede
              unserer Stadt-Websites erhält eine eigene Textfassung, damit Google
              sie als eigenständig wertet. Pro Stadt vergeben wir die Seite nur{" "}
              <strong>einmal</strong>.
            </p>
          </div>
          <div className="lg:text-right">
            <a
              href={`/sales-${tradeKey}`}
              className="inline-block text-white font-bold px-8 py-4 rounded-xl transition shadow-lg"
              style={{ backgroundColor: c, boxShadow: `${c}40 0px 8px 24px` }}
            >
              Jetzt für {CITY.name} sichern →
            </a>
            <p className="mt-2 text-xs text-ink-500">
              Self-Check-in · sofort online · monatlich kündbar
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ LEISTUNGEN ═══════════ */}
      <section id="leistungen" className="py-20 sm:py-28 bg-ink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl reveal">
            <p
              className="font-bold text-sm uppercase tracking-widest"
              style={{ color: c }}
            >
              Leistungen
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">
              Alles rund ums Thema {cfg.name} in {CITY.name}
            </h2>
            <p className="mt-4 text-ink-600 text-lg">
              Professionelle Handwerksleistungen mit kostenloser Besichtigung
              und Festpreis-Angebot.
            </p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cfg.services.map((s, i) => (
              <div
                key={i}
                className="reveal bg-white rounded-2xl p-7 border border-ink-200 hover:shadow-xl hover:-translate-y-1 transition duration-300"
              >
                <span
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${c}14`, color: c }}
                >
                  {s.icon}
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink-900">{s.title}</h3>
                <p className="mt-2 text-ink-600 text-sm leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ ÜBER UNS ═══════════ */}
      <section id="ueber-uns" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="reveal">
            <img
              src={cfg.teamImage}
              alt={`${cfg.name} bei der Arbeit`}
              className="rounded-2xl shadow-2xl w-full object-cover aspect-[3/2]"
            />
            <div className="mt-4 flex items-center gap-4 bg-ink-900 text-white rounded-2xl p-5">
              <p className="text-4xl font-black" style={{ color: c }}>
                {CITY.name}
              </p>
              <p className="text-sm text-ink-200 leading-snug">
                unser Standort –
                <br />
                kurze Wege in der gesamten Region
              </p>
            </div>
          </div>
          <div className="reveal">
            <p
              className="font-bold text-sm uppercase tracking-widest"
              style={{ color: c }}
            >
              Über uns
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">
              Ein Betrieb, auf den Sie sich verlassen können
            </h2>
            <p className="mt-6 text-ink-600 text-lg leading-relaxed">
              Ein {cfg.label.toLowerCase()} aus {CITY.name}, auf den Sie sich
              verlassen können. Wir kennen die Gegebenheiten in der Region und
              wissen, worauf es ankommt.
            </p>
            <p className="mt-4 text-ink-600 leading-relaxed">
              Wir wissen, welche Herausforderungen in {CITY.name} typisch sind
              und worauf es bei der Ausführung ankommt.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                {
                  title: "Fachgerechte Ausführung:",
                  text: "Qualifizierte Arbeit nach den anerkannten Regeln der Technik.",
                },
                {
                  title: "Schriftliches Angebot:",
                  text: "Transparent kalkuliert – keine versteckten Kosten, keine Überraschungen.",
                },
                {
                  title: "Saubere Baustelle:",
                  text: "Wir hinterlassen Ihr Grundstück so, wie wir es vorgefunden haben – versprochen.",
                },
                {
                  title: "Persönliche Betreuung:",
                  text: "Ein fester Ansprechpartner begleitet Ihr Projekt von Anfang bis Ende.",
                },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    style={{ color: c }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-ink-700">
                    <strong className="text-ink-900">{item.title}</strong>{" "}
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
            <a
              href="#kontakt"
              className="mt-8 inline-flex items-center gap-2 font-bold hover:gap-3 transition-all"
              style={{ color: c }}
            >
              Lernen Sie uns kennen – kostenlose Erstberatung
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ RATGEBER ═══════════ */}
      <section id="ratgeber" className="py-20 sm:py-28 bg-ink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p
                className="font-bold text-sm uppercase tracking-widest"
                style={{ color: c }}
              >
                Ratgeber & Fachwissen
              </p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-black text-ink-900">
                Aktuelle Artikel für {CITY.name}
              </h2>
              <p className="mt-3 text-ink-600 max-w-2xl">
                Praxisnahe Ratgeber für Eigentümer in {CITY.name} – mit lokalem
                Fachwissen.
              </p>
            </div>
            <a
              href={`/${tradeKey}/${CITY.name.toLowerCase()}/blog/`}
              className="font-bold hover:underline shrink-0"
              style={{ color: c }}
            >
              Alle Beiträge →
            </a>
          </div>
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cfg.blog.map((post, i) => (
              <a
                key={i}
                href={`/blog/${tradeKey}/${CITY.name.toLowerCase()}/${post.slug}.html`}
                className="reveal block bg-white rounded-2xl overflow-hidden border border-ink-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 group"
              >
                <div
                  className="h-44 flex items-center justify-center text-5xl group-hover:scale-105 transition duration-500"
                  style={{
                    background: `linear-gradient(to bottom right, ${c}1A, #fef3c7)`,
                  }}
                >
                  📖
                </div>
                <div className="p-5">
                  <p
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: c }}
                  >
                    {cfg.name} · {CITY.name}
                  </p>
                  <h3 className="mt-1.5 text-lg font-bold text-ink-900 leading-snug group-hover:transition-colors">
                    {post.title}
                  </h3>
                  <span
                    className="mt-3 inline-flex items-center text-sm font-bold"
                    style={{ color: c }}
                  >
                    Weiterlesen →
                  </span>
                </div>
              </a>
            ))}
          </div>
          <p className="mt-6 text-xs text-ink-400 italic">
            Hinweis: Jeder Artikel ist für diese Stadt individuell verfasst – nie
            Duplicate Content.
          </p>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center reveal">
            <p
              className="font-bold text-sm uppercase tracking-widest"
              style={{ color: c }}
            >
              Häufige Fragen
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">
              Das fragen Kunden aus {CITY.name}
            </h2>
          </div>
          <div className="mt-10 space-y-4">
            {cfg.faq.map((f, i) => (
              <div
                key={i}
                className={`reveal bg-white rounded-xl border border-ink-200 faq-item ${
                  openFaq === i ? "open" : ""
                }`}
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-bold text-ink-900">{f.q}</span>
                  <svg
                    className={`chev w-5 h-5 shrink-0 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                    style={{ color: c }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className="faq-answer"
                  style={{
                    maxHeight: openFaq === i ? "500px" : "0",
                  }}
                >
                  <p className="px-6 pb-5 text-ink-600 text-sm leading-relaxed">
                    {f.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ NOTFALL-CTA ═══════════ */}
      <section style={{ backgroundColor: c }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-white">
            <span className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"
                />
              </svg>
            </span>
            <div>
              <p className="text-xl sm:text-2xl font-black">
                Notfall? Wir sind schnell vor Ort.
              </p>
              <p className="mt-1" style={{ color: "#ffffffcc" }}>
                Notdienst für {CITY.name} und Umgebung – 24h erreichbar.
              </p>
            </div>
          </div>
          <a
            href={`tel:${cfg.phone.replace(/\s/g, "").replace("/", "")}`}
            className="inline-flex items-center gap-2 bg-white font-black px-8 py-4 rounded-xl text-lg hover:bg-gray-50 transition shadow-lg shrink-0"
            style={{ color: c }}
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 3a1 1 0 011-1h2.2a1 1 0 01.95.68l1.2 3.6a1 1 0 01-.27 1.06l-1.6 1.6a12.05 12.05 0 005.58 5.58l1.6-1.6a1 1 0 011.06-.27l3.6 1.2a1 1 0 01.68.95V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 6V3z" />
            </svg>
            {cfg.phone}
          </a>
        </div>
      </section>

      {/* ═══════════ KONTAKT ═══════════ */}
      <section id="kontakt" className="py-20 sm:py-28 bg-ink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2 reveal">
            <p
              className="font-bold text-sm uppercase tracking-widest"
              style={{ color: c }}
            >
              Kontakt
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">
              Kostenlose Besichtigung in {CITY.name} anfragen
            </h2>
            <p className="mt-4 text-ink-600 leading-relaxed">
              Beschreiben Sie kurz Ihr Anliegen – Sie erhalten zeitnah einen
              Terminvorschlag und danach ein schriftliches Festpreis-Angebot.
            </p>
            <div
              className="mt-8 border rounded-2xl p-6"
              style={{
                backgroundColor: `${c}0D`,
                borderColor: `${c}33`,
              }}
            >
              <p className="font-black text-ink-900">
                ⚡ Diese Seite ist noch frei
              </p>
              <p className="mt-1.5 text-sm text-ink-600 leading-relaxed">
                {cfg.name} aus {CITY.name} oder Umgebung? Miete diese Website und
                erscheine mit deinem Firmennamen genau hier – inklusive deiner
                Rufnummer, WhatsApp und Google-Maps-Standort.
              </p>
              <a
                href={`/sales-${tradeKey}`}
                className="mt-4 inline-block text-white text-sm font-bold px-6 py-3 rounded-lg transition"
                style={{ backgroundColor: c }}
              >
                Seite anmieten →
              </a>
            </div>
          </div>
          <div className="lg:col-span-3 reveal">
            <form
              onSubmit={handleFormSubmit}
              className="bg-white rounded-2xl shadow-lg border border-ink-100 p-7 sm:p-10"
            >
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-ink-800 mb-1.5">
                    Ihr Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Max Mustermann"
                    className="w-full rounded-lg border border-ink-200 px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ outlineColor: c }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ink-800 mb-1.5">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0…"
                    className="w-full rounded-lg border border-ink-200 px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ outlineColor: c }}
                  />
                </div>
              </div>
              <div className="mt-5">
                <label className="block text-sm font-bold text-ink-800 mb-1.5">
                  Worum geht es? *
                </label>
                <select
                  required
                  className="w-full rounded-lg border border-ink-200 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ outlineColor: c }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Bitte auswählen …
                  </option>
                  {cfg.contactFormOptions.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="mt-5">
                <label className="block text-sm font-bold text-ink-800 mb-1.5">
                  Ihre Nachricht *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Beschreiben Sie kurz Ihr Anliegen …"
                  className="w-full rounded-lg border border-ink-200 px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ outlineColor: c }}
                />
              </div>
              <label className="mt-5 flex items-start gap-3 text-sm text-ink-600">
                <input
                  type="checkbox"
                  required
                  className="mt-1 w-4 h-4 rounded border-ink-300"
                  style={{ accentColor: c }}
                />
                <span>
                  Ich bin mit der Verarbeitung meiner Daten zur Bearbeitung der
                  Anfrage einverstanden. *
                </span>
              </label>
              <button
                type="submit"
                className="mt-7 w-full text-white font-black text-lg py-4 rounded-xl transition shadow-lg"
                style={{
                  backgroundColor: c,
                  boxShadow: `${c}40 0px 8px 24px`,
                }}
              >
                Besichtigung anfragen
              </button>
              {formSuccess && (
                <p className="mt-4 text-center text-green-700 font-bold bg-green-50 border border-green-200 rounded-lg py-3 px-4">
                  ✓ Vielen Dank! (Demo-Hinweis: Diese Anfrage wird nicht wirklich
                  versendet.)
                </p>
              )}
              <p className="mt-4 text-xs text-ink-400 text-center">
                Demo-Formular – es werden keine Daten übertragen oder
                gespeichert.
              </p>
            </form>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 reveal">
          <div className="rounded-2xl overflow-hidden border border-ink-200 shadow-lg bg-white">
            <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-ink-100">
              <p className="font-bold text-ink-900 flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  style={{ color: c }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <circle cx="12" cy="11" r="3" />
                </svg>
                Einsatzgebiet {CITY.name}
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${CITY.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold hover:underline"
                style={{ color: c }}
              >
                In Google Maps öffnen →
              </a>
            </div>
            <iframe
              title={`Karte ${CITY.name} (Demo)`}
              src={`https://www.google.com/maps?q=${CITY.name}&z=12&output=embed`}
              className="w-full h-80 border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <p className="px-6 py-3 text-xs text-ink-400 italic">
              Demo-Karte. Nach der Anmietung wird hier der echte Firmenstandort
              des Mieters (Google Maps Place ID) eingebunden.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-ink-900 text-ink-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid sm:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: c }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={cfg.iconPath}
                  />
                </svg>
              </span>
              <span className="leading-tight">
                <span className="block font-extrabold text-white">
                  {cfg.name} {CITY.name}
                </span>
                <span className="block text-xs text-ink-400">
                  Miet-Website · noch frei
                </span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed">
              {cfg.name} {CITY.name} – professionelle Handwerksleistungen –{" "}
              {CITY.region}, {CITY.river}.
            </p>
          </div>
          <div>
            <p className="font-bold text-white text-sm uppercase tracking-widest">
              Leistungen
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {cfg.services.slice(0, 6).map((s, i) => (
                <li key={i}>
                  <a
                    href="#leistungen"
                    className="transition"
                    onMouseEnter={(e) =>
                      ((e.target as HTMLElement).style.color = c)
                    }
                    onMouseLeave={(e) =>
                      ((e.target as HTMLElement).style.color = "")
                    }
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-bold text-white text-sm uppercase tracking-widest">
              Miet-Website
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: `/sales-${tradeKey}`, label: "Diese Seite mieten" },
                { href: `/${tradeKey}/${CITY.name.toLowerCase()}/blog/`, label: "Ratgeber" },
                { href: "#kontakt", label: "Kontakt" },
                { href: "/start", label: "Über das Miet-Modell" },
                { href: "/impressum", label: "Impressum" },
                { href: "/datenschutz", label: "Datenschutzerklärung" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="transition"
                    onMouseEnter={(e) =>
                      ((e.target as HTMLElement).style.color = c)
                    }
                    onMouseLeave={(e) =>
                      ((e.target as HTMLElement).style.color = "")
                    }
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-ink-800 py-5 text-center text-xs text-ink-500">
          <p>
            © {new Date().getFullYear()} {tradeKey}-{CITY.name.toLowerCase()}-
            muster.de – MUSTERSEITE. Alle Inhalte, Personen und Bewertungen sind
            fiktiv.
          </p>
        </div>
      </footer>

      {/* ═══════════ WHATSAPP FLOATING BUTTON ═══════════ */}
      <a
        href={`https://wa.me/${cfg.whatsappNumber}?text=Hallo%2C%20ich%20interessiere%20mich%20f%C3%BCr%20ein%20Angebot.`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1fb856] text-white flex items-center justify-center shadow-2xl transition hover:scale-105"
        aria-label="Per WhatsApp kontaktieren"
      >
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>
    </>
  );
}
