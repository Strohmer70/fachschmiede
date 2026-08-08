// lib/article-templates-v2.ts — SEO-optimierte Artikel-Templates

export interface ArticleTemplate {
  slug: string;
  category: string; // z.B. 'dachdecker', 'elektriker'
  title: (city: string, tradeName: string) => string;
  h1: (city: string, tradeName: string) => string;
  metaDescription: (city: string, tradeName: string) => string;
  sections: ArticleSection[];
  faq: (city: string, tradeName: string) => Array<{q: string, a: string}>;
  unsplashKeyword: string; // Für Bilder
  relatedSlugs: string[]; // Interne Links zu anderen Artikeln
}

export interface ArticleSection {
  h2: (city: string, tradeName: string, tradeSlug?: string) => string;
  content: (city: string, tradeName: string, tradeSlug?: string) => string;
  hasList?: boolean;
  listItems?: (city: string, tradeName: string) => string[];
}

// ─── DACHDECKER ───────────────────────────────────────────────────────

export const DACHDAEMMUNG_TEMPLATE: ArticleTemplate = {
  slug: 'dachdaemmung-foerderung',
  category: 'dachdecker',
  unsplashKeyword: 'roof insulation construction',
  relatedSlugs: ['sturmschaden-dach', '5-anzeichen-dachsanierung'],
  
  title: (city, trade) => `Dachdämmung in ${city}: Kosten, Förderung & Zuschüsse 2026`,
  h1: (city, trade) => `Dachdämmung in ${city}: Ihr Ratgeber zu Kosten & Förderung`,
  metaDescription: (city, trade) => 
    `Wer in ${city} seine Dachdämmung erneuern möchte, kann auf staatliche Förderung zugreifen. ✓ KfW-Zuschuss ✓ BAFA-Förderung ✓ Einsparpotenzial bis 30%.`,
  
  sections: [
    {
      h2: (city) => `Warum lohnt sich eine Dachdämmung in ${city}?`,
      content: (city, trade) => `
        Ein gut gedämmtes Dach ist die halbe Miete – besonders in ${city} und dem gesamten Ruhrgebiet, wo die Wintertemperaturen regelmäßig unter den Gefrierpunkt fallen. Mit einer modernen Dachdämmung sparen Hausbesitzer in ${city} bis zu 30 Prozent Heizkosten ein – und das Jahr für Jahr.

        Doch nicht nur die Energieeinsparung spricht für eine Dachdämmung. Auch der Wohnkomfort steigt spürbar: Im Sommer bleibt es unter dem Dach angenehm kühl, im Winter muckelig warm. Zudem schützen Sie Ihr Gebäude vor Feuchtigkeitsschäden und Schimmel – ein Problem, das gerade in älteren Häusern in ${city} häufig vorkommt.

        Die Investition in eine Dachdämmung amortisiert sich in der Regel innerhalb von 10 bis 15 Jahren. Bei steigenden Energiepreisen sogar schneller. Und mit den aktuellen Förderprogrammen wird die Sanierung für Hausbesitzer in ${city} besonders attraktiv.
      `
    },
    {
      h2: () => `Welche Fördermöglichkeiten gibt es aktuell?`,
      content: (city) => `
        Nordrhein-Westfalen und der Bund bieten verschiedene Förderprogramme für energetische Sanierungen an. Besonders gefragt ist der **KfW-Effizienzhaus-Kredit**, der zinsgünstige Darlehen für energetische Maßnahmen bereitstellt. Zusätzlich gibt es direkte Zuschüsse über das **BAFA** für die Dämmung von Aufdach- und Zwischensparrendämmungen.

        Für Eigentümer in ${city} empfiehlt sich ein Beratungsgespräch mit einem zertifizierten Energieberater. Dieser kann eine detaillierte Energieberatung durchführen und die passenden Fördermittel beantragen. Viele Fachbetriebe in ${city} kooperieren mit Energieberatern und übernehmen die Antragsstellung für Sie.

        Wichtig: Die Förderung muss VOR Baubeginn beantragt werden. Wer bereits mit der Sanierung begonnen hat, kann nachträglich keine Zuschüsse mehr erhalten. Lassen Sie sich daher frühzeitig beraten.
      `,
      hasList: true,
      listItems: () => [
        'KfW-Effizienzhaus-Kredit: Bis zu 120.000 € Darlehen mit Tilgungszuschuss',
        'BAFA-Zuschuss: Bis zu 15 % der förderfähigen Kosten für Dämmmaßnahmen',
        'Bundesförderung für effiziente Gebäude (BEG): Zuschuss oder zinsgünstiges Darlehen',
        'Kommunale Förderprogramme: Einige Städte im Ruhrgebiet bieten zusätzliche Zuschüsse'
      ]
    },
    {
      h2: (city) => `Was kostet eine Dachdämmung in ${city}?`,
      content: (city, trade) => `
        Die Kosten für eine Dachdämmung in ${city} hängen von mehreren Faktoren ab: der Dachfläche, der gewählten Dämmmethode und dem baulichen Zustand. Als Richtwert können Sie mit 80 bis 150 Euro pro Quadratmeter rechnen – inklusive Material und Montage.

        Die drei gängigsten Dämmmethoden im Überblick:

        **Aufsparrendämmung:** Die Dämmung wird auf den Sparren aufgebracht. Ideal, wenn der Dachstuhl erhalten bleiben soll. Kosten: ca. 90-130 €/m².

        **Zwischensparrendämmung:** Dämmstoff wird zwischen den Sparren eingeführt. Gute Wärmedämmung bei geringer Aufbauhöhe. Kosten: ca. 80-120 €/m².

        **Untersparrendämmung:** Von innen wird unterhalb der Sparren gedämmt. Günstigste Variante, aber mit Raumhöhen-Verlust. Kosten: ca. 60-90 €/m².

        Mit Förderung reduzieren sich die Eigenkosten erheblich. Bei einem BAFA-Zuschuss von 15 Prozent und einem KfW-Tilgungszuschuss können Sie mit einer Erstattung von 10.000 bis 20.000 Euro rechnen – je nach Projektgröße.
      `
    },
    {
      h2: (city, trade) => `Fachbetriebe für Dachdämmung in ${city}`,
      content: (city, trade, tradeSlug) => `
        In ${city} gibt es zahlreiche Fachbetriebe, die sich auf Dachdämmung spezialisiert haben. Achten Sie bei der Auswahl auf eine Fachfirma mit Meisterbetrieb und Zertifizierung. Ein qualifizierter ${trade} führt nicht nur die Arbeiten fachgerecht aus, sondern berät Sie auch zu den optimalen Fördermöglichkeiten.

        Besonders wichtig: Der Betrieb sollte über eine Haftpflichtversicherung verfügen und Ihnen eine schriftliche Gewährleistung geben. Lassen Sie sich mehrere Angebote einholen und vergleichen Sie nicht nur den Preis, sondern auch die Leistungsbeschreibung.

        [Weiterlesen: Sturmschaden am Dach – was tun?](/${tradeSlug}/${city}/blog/sturmschaden-dach/)  
        [Weiterlesen: 5 Anzeichen für nötige Dachsanierung](/${tradeSlug}/${city}/blog/5-anzeichen-dachsanierung/)
      `
    }
  ],
  
  faq: (city, trade) => [
    { 
      q: `Wie lange dauert eine Dachdämmung in ${city}?`, 
      a: 'Je nach Dachgröße und gewählter Methode dauert die Sanierung 1 bis 3 Wochen. Bei einer Aufsparrendämmung ist die Bauzeit in der Regel kürzer als bei einer Zwischensparrendämmung, bei der die alte Eindeckung teilweise entfernt werden muss.' 
    },
    { 
      q: 'Kann ich während der Sanierung im Haus wohnen bleiben?', 
      a: 'In den meisten Fällen ja. Bei einer Auf- oder Zwischensparrendämmung wird von außen gearbeitet, sodass der Wohnbereich kaum beeinträchtigt wird. Bei einer Untersparrendämmung kann es temporär zu Staub und Lärm kommen.' 
    },
    { 
      q: 'Muss ich die Förderung selbst beantragen?', 
      a: 'Nein, viele Fachbetriebe übernehmen die Antragsstellung für Sie. Achten Sie beim Angebotsvergleich darauf, ob die Antragsunterstützung inkludiert ist. Wichtig: Der Antrag muss VOR Baubeginn gestellt werden.' 
    },
    { 
      q: `Gibt es regionale Förderungen speziell für ${city}?`, 
      a: 'Neben den Bundesförderungen gibt es in Nordrhein-Westfalen gelegentlich kommunale Programme. Informieren Sie sich bei der Stadtverwaltung ${city} oder beim Energieberatungszentrum vor Ort über aktuelle Zuschussmöglichkeiten.' 
    }
  ]
};

// ─── ELEKTRIKER ───────────────────────────────────────────────────────

export const ECHECK_TEMPLATE: ArticleTemplate = {
  slug: 'e-check-sicherheit',
  category: 'elektriker',
  unsplashKeyword: 'electrical inspection safety',
  relatedSlugs: ['wallbox-zuhause', 'smart-home-nachruesten'],
  
  title: (city) => `E-Check in ${city}: Wann ist die Prüfung Pflicht & was kostet sie?`,
  h1: (city) => `E-Check in ${city}: Elektrosicherheit für Ihr Zuhause`,
  metaDescription: (city) => 
    `Der E-Check schützt vor Brandgefahr & Stromschlag. ✓ Pflicht für Vermieter ✓ Kosten in ${city} ✓ Wie oft nötig? Alle Infos hier.`,
  
  sections: [
    {
      h2: () => `Was ist ein E-Check und warum ist er wichtig?`,
      content: (city) => `
        Der E-Check (Elektroprüfung nach DGUV Vorschrift 3) ist eine regelmäßige Überprüfung aller elektrischen Anlagen und Betriebsmittel. Er schützt Bewohner und Nutzer vor den Gefahren des elektrischen Stroms – insbesondere vor Brandgefahr durch defekte Leitungen und vor Stromschlag durch fehlerhafte Geräte.

        In ${city} und dem gesamten Ruhrgebiet ist der E-Check für Gewerbebetriebe vorgeschrieben. Aber auch für Privathaushalte, Mieter und Vermieter ist er dringend zu empfehlen. Besonders bei Altbauten, die in ${city} häufig vorkommen, können veraltete Leitungen und überlastete Sicherungen erhebliche Risiken darstellen.

        Der Prüfumfang umfasst die Kontrolle von Verteilern, Leitungen, Steckdosen, Schaltern und angeschlossenen Geräten. Der Elektrofachbetrieb dokumentiert alle Ergebnisse in einem Prüfprotokoll, das bei Versicherungsfällen und Behördenchecks wichtig sein kann.
      `
    },
    {
      h2: () => `Wann ist der E-Check Pflicht?`,
      content: (city) => `
        Für **gewerbliche Betriebe** ist der E-Check gemäß DGUV Vorschrift 3 alle 4 Jahre vorgeschrieben. In besonderen Betrieben wie Medizintechnik oder Landwirtschaft können kürzere Prüfintervalle gelten.

        Für **Vermieter** gilt: Bei Gewerberäumen ist der E-Check Pflicht. Bei Wohnräumen besteht zwar keine gesetzliche Pflicht zur regelmäßigen Prüfung, aber der Vermieter muss die Mieter vor Gefahren schützen. Ein E-Check dokumentiert, dass die elektrischen Anlagen sicher sind.

        Für **Haus- und Wohnungseigentümer** empfiehlt sich ein E-Check alle 10 Jahre – oder nach größeren Umbauarbeiten, Blitzschlag oder Wasserschaden.
      `,
      hasList: true,
      listItems: () => [
        'Gewerbebetriebe: Alle 4 Jahre (DGUV V3)',
        'Vermieter (Gewerbe): Pflicht, Dokumentation erforderlich',
        'Privathaushalte: Empfohlen alle 10 Jahre',
        'Nach Umbau/Sanierung: Sofortige Prüfung empfohlen',
        'Bei Altbauten (vor 1980): Erstprüfung dringend empfohlen'
      ]
    },
    {
      h2: (city) => `Was kostet ein E-Check in ${city}?`,
      content: (city, trade, tradeSlug) => `
        Die Kosten für einen E-Check in ${city} hängen von der Größe der Wohnung oder des Betriebs sowie vom Prüfumfang ab. Als Orientierung können Sie mit folgenden Preisen rechnen:

        **Privathaushalt (Wohnung bis 100 m²):** 150 bis 250 Euro  
        **Einfamilienhaus:** 250 bis 400 Euro  
        **Gewerbebetrieb (bis 200 m²):** 350 bis 600 Euro

        Bei diesen Preisen ist die reine Prüfung enthalten, nicht jedoch die Behebung von Mängeln. Falls der Elektriker während des E-Checks Defekte feststellt, erhält Sie ein separates Angebot für die Reparatur.

        Viele Elektrobetriebe in ${city} bieten Kombipakete an: E-Check inklusive kleinerer Nacharbeiten zu einem Pauschalpreis. Lassen Sie sich vorab ein Angebot unterbreiten.

        [Weiterlesen: Wallbox zuhause installieren](/${tradeSlug}/${city}/blog/wallbox-zuhause/)  
        [Weiterlesen: Smart Home nachrüsten](/${tradeSlug}/${city}/blog/smart-home-nachruesten/)
      `
    }
  ],
  
  faq: (city) => [
    { q: 'Wie lange dauert ein E-Check?', a: 'Für eine durchschnittliche Wohnung dauert die Prüfung 1 bis 2 Stunden. Bei größeren Objekten oder Gewerbebetrieben können es 3 bis 5 Stunden sein.' },
    { q: 'Was passiert, wenn Mängel gefunden werden?', a: 'Der Elektriker dokumentiert alle Mängel im Prüfprotokoll und bewertet sie nach Schweregrad. Gefährliche Mängel müssen umgehend behoben werden. Sie erhalten ein Angebot für die Nacharbeit.' },
    { q: 'Ist der E-Check steuerlich absetzbar?', a: 'Für Gewerbebetriebe ja, als Betriebsausgabe. Für Privathaushalte können die Kosten im Rahmen von Handwerkerleistungen steuerlich geltend gemacht werden (20% bis max. 1.200 € jährlich).' },
    { q: `Wie finde ich einen zertifizierten Elektriker in ${city}?`, a: 'Achten Sie auf den Meisterbetrieb und die Mitgliedschaft in einer Handwerkskammer. In ${city} gibt es mehrere qualifizierte Elektrobetriebe, die den E-Check fachgerecht durchführen.' }
  ]
};

// ─── SHK / KLEMPNER ──────────────────────────────────────────────────

export const ROHRBRUCH_TEMPLATE: ArticleTemplate = {
  slug: 'rohrbruch-sofortmassnahmen',
  category: 'shk',
  unsplashKeyword: 'plumber emergency repair',
  relatedSlugs: ['heizungs-check-winter', 'schimmel-wohnung'],
  
  title: (city) => `Rohrbruch in ${city}: Sofortmaßnahmen & Notdienst`,
  h1: (city) => `Rohrbruch in ${city}: Was Sie SOFORT tun müssen`,
  metaDescription: (city) => 
    `Wasserrohrbruch in ${city}? ✓ Sofortmaßnahmen ✓ Wasserschaden minimieren ✓ Notdienst finden ✓ Kosten & Versicherung. Schnelle Hilfe hier.`,
  
  sections: [
    {
      h2: () => `Rohrbruch – die ersten 5 Minuten zählen!`,
      content: (city) => `
        Ein Rohrbruch ist einer der größten Albträume für Hausbesitzer und Mieter. Plötzlich strömt Wasser aus der Wand, die Decke färbt sich dunkel, der Teppich wird nass. In ${city}, wo viele Häuser aus den 60er und 70er Jahren stammen, sind Rohrbrüche leider keine Seltenheit – besonders bei verzinkten Stahlrohren, die mit der Zeit korrodieren.

        Die ersten Minuten nach einem Rohrbruch sind entscheidend. Je schneller Sie reagieren, desto geringer fällt der Wasserschaden aus. Viele Versicherungen decken Wasserschäden ab – aber nur, wenn Sie schnell und richtig gehandelt haben.

        In diesem Ratgeber erfahren Sie, welche Sofortmaßnahmen Sie selbst ergreifen können, wann Sie einen Klempner-Notdienst in ${city} rufen sollten und wie Sie den Schaden für Ihre Versicherung dokumentieren.
      `
    },
    {
      h2: () => `Schritt-für-Schritt: Sofortmaßnahmen bei Rohrbruch`,
      content: (city) => `
        Bleiben Sie ruhig und handeln Sie systematisch. Jede Minute zählt, aber Panik hilft nicht. Folgen Sie dieser Reihenfolge:
      `,
      hasList: true,
      listItems: () => [
        'HAUPTWASSERHAHN schließen: Meist im Keller oder im Versorgungsschacht. Drehen Sie gegen den Uhrzeigersinn bis zum Anschlag.',
        'STROM ABSICHERN: Stehen Sie nicht im Wasser! Gehen Sie mit trockenen Schuhen zum Sicherungskasten und schalten Sie betroffene Stromkreise aus.',
        'WASSER ABLEITEN: Öffnen Sie alle Wasserhähne im Haus, um den Restdruck abzubauen. Auffanggefäße unter die Undichtigkeit stellen.',
        'SCHADEN DOKUMENTIEREN: Fotos von allen betroffenen Stellen machen – Wände, Böden, Möbel, Elektrogeräte. Das ist wichtig für die Versicherung.',
        'NOTDIENST RUFEN: Suchen Sie einen 24h-Klempner-Notdienst in Ihrer Nähe. In ${city} sind mehrere Fachbetriebe rund um die Uhr erreichbar.'
      ]
    },
    {
      h2: (city) => `Klempner-Notdienst in ${city}: Was kostet die Hilfe?`,
      content: (city, trade, tradeSlug) => `
        Die Kosten für einen Klempner-Notdienst in ${city} setzen sich aus mehreren Positionen zusammen:

        **Anfahrtskosten:** 30 bis 60 Euro (je nach Entfernung und Uhrzeit)  
        **Notdienstzuschlag:** 50 bis 100 Prozent Aufschlag auf den Stundensatz (besonders nachts und an Wochenenden)  
        **Arbeitszeit:** 80 bis 120 Euro pro Stunde (inkl. Materialkosten für kleine Reparaturen)

        Ein typischer Rohrbruch-Notdienst kostet in ${city} zwischen 200 und 500 Euro. Das hört sich viel an, aber bedenken Sie: Jede Minute, in der Wasser läuft, vergrößert den Schaden – und damit die Renovierungskosten.

        **Tipp:** Fragen Sie vor dem Einsatz nach einem Kostenvoranschlag. Seriöse Notdienste nennen Ihnen die Kosten transparent. Vorsicht vor dubiosen Angeboten aus dem Internet – achten Sie auf lokale Betriebe mit festem Sitz in ${city}.

        [Weiterlesen: Heizungs-Check vor dem Winter](/${tradeSlug}/${city}/blog/heizungs-check-winter/)  
        [Weiterlesen: Schimmel in der Wohnung vermeiden](/${tradeSlug}/${city}/blog/schimmel-wohnung/)
      `
    }
  ],
  
  faq: (city) => [
    { q: 'Wer zahlt bei einem Rohrbruch – Mieter oder Vermieter?', a: 'Grundsätzlich ist der Vermieter für die Instandhaltung der Leitungen verantwortlich. Hat der Mieter den Schaden jedoch grob fahrlässig verursacht (z.B. durch unsachgemäße Arbeiten), kann er haftbar gemacht werden. Die Gebäudeversicherung des Vermieters deckt meist die Schäden an der Bausubstanz ab.' },
    { q: 'Wie lange dauert die Trocknung nach einem Wasserschaden?', a: 'Je nach Schweregrad 1 bis 6 Wochen. Oberflächliche Feuchtigkeit trocknet mit Lüften und Heizen in wenigen Tagen. Bei durchweichten Wänden, Decken oder Parkett ist professionelle Trocknungstechnik nötig.' },
    { q: 'Soll ich die Versicherung sofort informieren?', a: 'Ja, informieren Sie Ihre Gebäude- oder Hausratversicherung umgehend – spätestens innerhalb von 48 bis 72 Stunden. Die meisten Versicherungen haben Hotlines für Schadensfälle, die auch am Wochenende erreichbar sind.' },
    { q: `Gibt es in ${city} einen 24h-Klempner-Notdienst?`, a: 'Ja, in ${city} und der Region gibt es mehrere Fachbetriebe mit Notdienst. Achten Sie auf Meisterbetriebe mit festem Sitz in der Region – nicht auf Vermittlungsportale, die mit hohen Preisen arbeiten.' }
  ]
};

// ─── MALER ────────────────────────────────────────────────────────────

export const FASSADE_TEMPLATE: ArticleTemplate = {
  slug: 'fassade-streichen-kosten',
  category: 'maler',
  unsplashKeyword: 'house facade painting',
  relatedSlugs: ['farben-raumwirkung', 'holzterrasse-pflegen'],
  
  title: (city) => `Fassade streichen in ${city}: Kosten, Farbe & Wetter`,
  h1: (city) => `Fassade streichen in ${city}: Ihr Preis-Leistungs-Guide`,
  metaDescription: (city) => 
    `Fassade neu streichen in ${city}? ✓ Kosten pro m² ✓ Beste Farbe ✓ Wetter & Jahreszeit ✓ Förderung. Alle Infos vom Maler-Profi.`,
  
  sections: [
    {
      h2: () => `Wann muss eine Fassade neu gestrichen werden?`,
      content: (city) => `
        Die Fassade ist die Visitenkarte Ihres Hauses – und zugleich der wichtigste Schutz gegen Witterungseinflüsse. In ${city} und dem Ruhrgebiet sind Häuser besonders starkem Wetter ausgesetzt: Regen, Wind, Temperaturschwankungen und der salzhaltige Industrieabfall der vergangenen Jahrzehnte haben an vielen Fassaden ihre Spuren hinterlassen.

        Doch wann ist der richtige Zeitpunkt für einen neuen Anstrich? Als Faustregel gilt: Alle 10 bis 15 Jahre sollte eine Fassade erneuert werden. Bei hochwertigen Silikonharzfarben kann der Zeitraum auch 20 Jahre betragen.

        Sichtbare Anzeichen, dass es Zeit wird: Blasenbildung, Risse im Putz, abblätternde Farbe, Algen- oder Moosbewuchs und dunkle Flecken durch eindringende Feuchtigkeit. Wenn Sie diese Zeichen bemerken, sollten Sie nicht warten – kleine Schäden werden schnell zu großen Problemen.
      `
    },
    {
      h2: () => `Was kostet das Fassade streichen?`,
      content: (city) => `
        Die Kosten für das Streichen einer Fassade in ${city} hängen von mehreren Faktoren ab. Als grobe Orientierung können Sie mit folgenden Preisen rechnen:
      `,
      hasList: true,
      listItems: () => [
        'Einfacher Anstrich (2 Schichten): 25 bis 40 € pro m²',
        'Inkl. Grundierung & Vorarbeiten: 35 bis 55 € pro m²',
        'Komplettsanierung mit Putzarbeiten: 60 bis 100 € pro m²',
        'Gerüstkosten: 10 bis 20 € pro m² (zusätzlich)',
        'Dachüberstand & Details: Aufpreis je nach Umfang'
      ]
    },
    {
      h2: (city, trade, tradeSlug) => `Welche Farbe ist die richtige?`,
      content: (city, trade, tradeSlug) => `
        Die Wahl der richtigen Fassadenfarbe ist nicht nur eine ästhetische Entscheidung – sie beeinflusst auch den Schutz und die Haltbarkeit. In ${city}, wo es viel Niederschlag gibt, empfiehlt sich eine hochwertige Silikonharzfarbe. Sie ist diffusionsoffen (lässt Feuchtigkeit entweichen), wasserabweisend und extrem langlebig.

        **Dispersionsfarben** sind günstiger, aber weniger wetterfest. **Silikatfarben** sind besonders atmungsaktiv, aber teurer und schwieriger zu verarbeiten. Für denkmalgeschützte Häuser in der Altstadt von ${city} sind oft mineralische Farben vorgeschrieben.

        **Tipp:** Lassen Sie sich von einem Fachbetrieb in ${city} beraten. Ein erfahrener Maler kennt die örtlichen Witterungsbedingungen und kann die optimale Farbe für Ihr Haus empfehlen.

        [Weiterlesen: Farben und ihre Raumwirkung](/${tradeSlug}/${city}/blog/farben-raumwirkung/)  
        [Weiterlesen: Holzterrasse pflegen](/${tradeSlug}/${city}/blog/holzterrasse-pflegen/)
      `
    }
  ],
  
  faq: (city) => [
    { q: 'Welche Jahreszeit ist ideal zum Fassade streichen?', a: 'Frühling und Herbst sind optimal – bei Temperaturen zwischen 10 und 25 Grad Celsius und niedriger Luftfeuchtigkeit. Streichen Sie nie bei direkter Sonneneinstrahlung oder wenn Regen angesagt ist.' },
    { q: 'Wie lange dauert das Streichen einer Fassade?', a: 'Für ein Einfamilienhaus mit ca. 150 m² Fassadenfläche benötigen professionelle Maler 5 bis 10 Tage – inklusive Vorarbeiten, Grundierung und zwei Anstrichen.' },
    { q: 'Brauche ich ein Gerüst oder reicht eine Hebebühne?', a: 'Für die meisten Einfamilienhäuser reicht ein Fassadengerüst. Bei schwierigem Gelände oder engen Baufreiheiten kann eine Hebebühne sinnvoll sein. Ihr Maler berät Sie vor Ort.' },
    { q: 'Gibt es Förderungen für Fassadensanierungen?', a: 'Reine Farbanstriche werden nicht gefördert. Wenn jedoch energetische Maßnahmen verbunden sind (z.B. WDVS-Dämmung), können BAFA- oder KfW-Förderungen beantragt werden.' }
  ]
};

// ─── ZIMMERER ─────────────────────────────────────────────────────────

export const CARPORT_TEMPLATE: ArticleTemplate = {
  slug: 'carport-bauen',
  category: 'zimmerer',
  unsplashKeyword: 'wooden carport construction',
  relatedSlugs: ['holzterrasse-pflegen', 'dachdaemmung-foerderung'],
  
  title: (city) => `Carport bauen in ${city}: Kosten, Genehmigung & Planung`,
  h1: (city) => `Carport bauen in ${city}: Ihr kompletter Guide`,
  metaDescription: (city) => 
    `Carport selber bauen oder Zimmerer beauftragen in ${city}? ✓ Kosten ✓ Baugenehmigung ✓ Holzarten ✓ Wetterfestigkeit. Alle Infos hier.`,
  
  sections: [
    {
      h2: () => `Carport selber bauen oder Zimmerer beauftragen?`,
      content: (city) => `
        Ein Carport schützt Ihr Auto vor Regen, Hagel und Sonne – und ist deutlich günstiger als eine Garage. Viele Hausbesitzer in ${city} überlegen, ob sie das Projekt selbst angehen oder einen Zimmerer beauftragen sollen.

        Der **Selbstbau** kann bei einfachen Bausätzen ab 1.500 Euro möglich sein. Sie benötigen jedoch handwerkliches Geschick, Werkzeug und Zeit. Zudem müssen Sie die Baugenehmigung selbst einholen und die Statik sicherstellen – bei Schneelast und Wind ist das nicht zu unterschätzen.

        Die **Beauftragung eines Zimmerers** ist teurer (ab 5.000 Euro), aber sicherer. Ein Meisterbetrieb plant die Konstruktion statisch korrekt, holt die Genehmigung ein und übernimmt die Gewährleistung. Besonders bei anspruchsvollen Projekten oder besonderen örtlichen Bedingungen in ${city} ist das zu empfehlen.
      `
    },
    {
      h2: (city) => `Baugenehmigung in ${city}: Was ist nötig?`,
      content: (city) => `
        In Nordrhein-Westfalen gilt: Carports bis 30 m² Grundfläche sind in den meisten Fällen genehmigungsfrei – vorausgesetzt, sie erfüllen bestimmte Abstandsflächenregelungen und Höhenbegrenzungen. Aber Vorsicht: Jede Kommune kann hier eigene Regelungen haben.

        In ${city} empfiehlt sich ein Gespräch mit dem Bauamt, bevor Sie mit dem Bau beginnen. Bringen Sie einen Lageplan und eine Skizze des Carports mit. Das Bauamt prüft, ob Abstände zu Grundstücksgrenzen und Nachbarn eingehalten werden.

        Wenn der Carport an ein bestehendes Gebäude angebaut wird oder eine Wandfläche bildet, können andere Regelungen gelten. Auch bei Denkmalschutz oder in Bebauungsplänen mit besonderen Vorschriften ist eine Genehmigung nötig.
      `,
      hasList: true,
      listItems: () => [
        'Freistehende Carports bis 30 m²: Meist genehmigungsfrei (nachprüfen!)',
        'Anbau-Carports: Ofter genehmigungspflichtig',
        'Höchstmaße: Max. 3 m Firsthöhe, max. 4 m Traufhöhe',
        'Abstandsflächen: Mindestens 3 m zu Grundstücksgrenzen',
        'Frist: Genehmigungsverfahren dauert 4 bis 8 Wochen'
      ]
    },
    {
      h2: (city) => `Was kostet ein Carport in ${city}?`,
      content: (city, trade, tradeSlug) => `
        Die Kosten für ein Carport in ${city} variieren stark je nach Größe, Material und Ausführung:

        **Bausatz aus Holz (Selbstbau):** 1.500 bis 3.500 Euro  
        **Zimmermanns-Carport (Standard):** 5.000 bis 8.000 Euro  
        **Design-Carport mit Geräteraum:** 10.000 bis 15.000 Euro

        Die wichtigsten Kostenfaktoren sind:
        - **Holzart:** Fichte ist günstig, Lärche und Eiche haltbarer aber teurer
        - **Dachdeckung:** Trapezblech günstig, Doppelstegplatten oder Ziegel teurer
        - **Fundament:** Punktfundament ausreichend, Streifenfundament teurer
        - **Größe:** Einzelcarport vs. Doppelcarport

        **Tipp:** Holen Sie sich mehrere Angebote von Zimmerern in ${city} ein. Achten Sie auf die Materialqualität und die Gewährleistung – nicht nur auf den Preis.

        [Weiterlesen: Holzterrasse pflegen](/${tradeSlug}/${city}/blog/holzterrasse-pflegen/)  
        [Weiterlesen: Dachdämmung fördern lassen](/${tradeSlug}/${city}/blog/dachdaemmung-foerderung/)
      `
    }
  ],
  
  faq: (city) => [
    { q: 'Wie lange hält ein Holz-Carport?', a: 'Mit qualitativ hochwertigem Holz (Lärche, Eiche) und regelmäßiger Pflege 20 bis 30 Jahre. Fichtenholz ist günstiger, hält aber nur 10 bis 15 Jahre. Ein guter Holzschutz-Anstrich alle 3 bis 5 Jahre verlängert die Lebensdauer erheblich.' },
    { q: 'Braucht ein Carport ein Fundament?', a: 'Ja, jedes Carport braucht eine Fundierung. Für leichte Konstruktionen reichen Punktfundamente an den Pfosten. Bei größeren Carports oder unsicherem Boden ist ein Streifenfundament besser.' },
    { q: 'Kann ich einen Carport nachträglich mit Wänden schließen?', a: 'Ja, aber Vorsicht: Sobald mehr als zwei Seiten geschlossen werden, kann das Bauamt eine Genehmigung verlangen. Zudem ändern sich die Windlasten – die Konstruktion muss das aushalten. Lassen Sie sich beraten.' },
    { q: 'Ist ein Carport winterfest?', a: 'Ein fachgerecht gebautes Carport hält Schneelast und Sturm stand. Wichtig ist die richtige Dachneigung (mindestens 5°) und eine stabile Konstruktion. In schneereichen Regionen sollte die Dachkonstruktion für höhere Lasten bemessen werden.' }
  ]
};

export const STURMSCHADEN_TEMPLATE: ArticleTemplate = {
  slug: 'sturmschaden-dach',
  category: 'dachdecker',
  unsplashKeyword: 'storm damage roof repair',
  relatedSlugs: ['dachdaemmung-foerderung', '5-anzeichen-dachsanierung'],
  
  title: (city, trade) => `Sturmschaden am Dach in ${city}: Soforthilfe & Kosten`,
  h1: (city, trade) => `Sturmschaden in ${city}: Schnelle Hilfe vom Dachdecker`,
  metaDescription: (city, trade) => 
    `Sturmschaden in ${city}? ✓ Soforthilfe ✓ Versicherung ✓ Kosten ✓ Notdienst 24h. Erfahren Sie, was zu tun ist und wie der Schaden fachgerecht behoben wird.`,
  
  sections: [
    {
      h2: () => `Sofortmaßnahmen nach Sturmschaden am Dach`,
      content: (city, trade) => `
        Heftige Stürme können Dächer schwer beschädigen – abgedeckte Ziegel, abgerissene Dachrinnen oder gar Wassereintritt. Für Hauseigentümer in ${city} ist wichtig, schnell und richtig zu reagieren. Die ersten Stunden nach dem Sturm sind entscheidend, um Folgeschäden zu minimieren.

        Der sicherheitshinweis hat oberste Priorität: Betreten Sie das Dach niemals selbst! Nasses Moos, lose Ziegel und die allgemeine Unkalkulierbarkeit der Schadensstelle machen jede Eigeninitiative lebensgefährlich. Selbst erfahrene Handwerker nutzen bei Sturmschäden Sicherungsseile und spezielles Schuhwerk.

        Die zweite wichtige Maßnahme ist die Dokumentation. Fotografieren Sie alle Schäden aus sicherer Perspektive – vom Boden aus, vom Nachbargrundstück oder aus dem Dachfenster. Diese Aufnahmen sind für die Versicherung und spätere Gutachter unverzichtbar. Achten Sie darauf, Datum und Uhrzeit zu dokumentieren.
      `
    },
    {
      h2: () => `Der richtige Ablauf: Schritt für Schritt`,
      content: (city, trade) => `
        Nach einem Sturm in ${city} sollten Sie systematisch vorgehen, um den Schaden zu begrenzen und die Abwicklung zu beschleunigen:
      `,
      hasList: true,
      listItems: (city, trade) => [
        'Sicherheit prüfen: Sind Stromleitungen beschädigt? Gibt es herabhängende Teile?',
        'Schaden fotografieren: Aus verschiedenen Perspektiven, mit Datumsstempel',
        'Versicherung informieren: Innerhalb von 48 Stunden, idealerweise noch am selben Tag',
        'Dachdecker-Notdienst rufen: In ${city} sind mehrere Betriebe 24/7 erreichbar',
        'Provisorische Abdichtung: Vom Fachmann durchgeführt, nie selbst versuchen',
        'Gutachter einbeziehen: Bei größeren Schäden schickt die Versicherung einen Sachverständigen'
      ]
    },
    {
      h2: (city, trade) => `Was kostet die Sturmreparatur in ${city}?`,
      content: (city, trade, tradeSlug) => `
        Die Kosten für eine Sturmreparatur in ${city} variieren stark je nach Umfang des Schadens. Die Gebäudeversicherung übernimmt in der Regel die Kosten für Schäden durch Sturm – vorausgesetzt, der Sturm erreichte die windgeschwindigkeit von mindestens 75 km/h (Windstärke 9).

        **Typische Kostenpositionen:**

        **Kleine Reparatur** (einige Ziegel, kleine Dachrinne): 300 bis 800 Euro  
        **Mittlerer Schaden** (größere Fläche, Dachfenster): 2.000 bis 5.000 Euro  
        **Großschaden** (Teildeckung, Sturmschaden am Dachstuhl): 10.000 bis 30.000 Euro

        Wichtig: Lassen Sie nie voreilig Reparaturen durchführen, bevor der Versicherungsschaden geregelt ist. Die Versicherung hat das Recht, den Schaden selbst zu begutachten. Nur bei akuter Gefahr (Wassereintritt) sollten Sie sofort handeln – aber auch hier dokumentieren Sie alles.

        [Weiterlesen: Dachdämmung fördern lassen](/${tradeSlug}/${city}/blog/dachdaemmung-foerderung/)  
        [Weiterlesen: 5 Anzeichen für nötige Dachsanierung](/${tradeSlug}/${city}/blog/5-anzeichen-dachsanierung/)
      `
    }
  ],
  
  faq: (city, trade) => [
    { q: 'Wie schnell muss ich die Versicherung informieren?', a: 'Idealerweise noch am selben Tag, spätestens innerhalb von 48 Stunden. Je schneller Sie melden, desto schneller kann der Schaden reguliert werden. Die meisten Versicherungen haben 24h-Schadenshotlines.' },
    { q: 'Muss ich das Dach selbst sichern?', a: 'Nein, lassen Sie das Fachpersonal erledigen. Ein Dachdecker hat die nötige Ausrüstung und Erfahrung. Eigenmächtige Aktionen können gefährlich sein und die Versicherungssituation komplizieren.' },
    { q: 'Wie lange dauert die Reparatur?', a: 'Bei kleinen Schäden 1 bis 3 Tage. Bei größeren Schäden kann die Reparatur mehrere Wochen dauern, besonders wenn spezielle Materialien bestellt werden müssen. Ihr Dachdecker gibt Ihnen einen realistischen Zeitplan.' },
    { q: `Gibt es in ${city} einen 24h-Dachdecker-Notdienst?`, a: 'Ja, in ${city} und der Region gibt mehrere Dachdeckerbetriebe mit Notdienst. Achten Sie auf Meisterbetriebe mit festem Sitz in der Region. Vermittlungsportale verlangen oft horrende Preise.' }
  ]
};

export const ANZEICHEN_TEMPLATE: ArticleTemplate = {
  slug: '5-anzeichen-dachsanierung',
  category: 'dachdecker',
  unsplashKeyword: 'old roof renovation',
  relatedSlugs: ['dachdaemmung-foerderung', 'sturmschaden-dach'],
  
  title: (city, trade) => `5 Anzeichen für nötige Dachsanierung in ${city}`,
  h1: (city, trade) => `Ist Ihr Dach in ${city} sanierungsbedürftig?`,
  metaDescription: (city, trade) => 
    `Wasserflecken, Ziegelverlust oder hohe Heizkosten? Erfahren Sie, welche 5 Warnsignale in ${city} auf eine nötige Dachsanierung hindeuten. ✓ Kostenlose Erstinspektion.`,
  
  sections: [
    {
      h2: () => `Warum frühzeitig handeln?`,
      content: (city, trade) => `
        Das Dach ist die Krone des Hauses – und zugleich die am stärksten beanspruchte Fläche. In ${city} und dem Ruhrgebiet sind Dächer extremen Witterungsbedingungen ausgesetzt: Starkregen, Hagel, Stürme und große Temperaturschwankungen zwischen Sommer und Winter. Wer frühzeitig reagiert, kann teure Folgeschäden vermeiden.

        Ein Dach hat eine Lebensdauer von 30 bis 50 Jahren – je nach Material und Pflege. Bei älteren Häusern in ${city}, die oft in den 60er und 70er Jahren gebaut wurden, nähern sich viele Dächer diesem kritischen Alter. Doch auch jüngere Dächer können Schäden aufweisen, wenn sie mangelhaft gebaut oder durch extreme Witterung beschädigt wurden.

        Die gute Nachricht: Eine rechtzeitige Sanierung ist deutlich günstiger als eine komplette Neudeckung. Und mit den aktuellen Förderprogrammen für energetische Sanierungen können Hausbesitzer in ${city} bis zu 15 Prozent der Kosten zurückbekommen.
      `
    },
    {
      h2: () => `Die 5 Warnsignale im Detail`,
      content: (city, trade) => `
        Diese fünf Anzeichen sollten Sie ernst nehmen und zeitnah einen Fachbetrieb kontaktieren:
      `,
      hasList: true,
      listItems: (city, trade) => [
        '**Wasserflecken an der Decke:** Der eindeutigste Hinweis. Feuchtigkeit an der Zimmerdecke oder an den Wänden unter dem Dach zeigt, dass Wasser eindringt. Je länger Sie warten, desto größer wird der Schaden – und die Gefahr von Schimmelbildung.',
        '**Lose oder fehlende Dachziegel:** Nach Stürmen oder bei älteren Dächern können Ziegel abrutschen oder abbrechen. Jede Lücke im Dach ist eine Einladung für Regenwasser. Kontrollieren Sie Ihr Dach nach jedem starken Sturm visuell vom Boden aus.',
        '**Anstieg der Heizkosten:** Wenn die Heizkosten plötzlich steigen, ohne dass sich etwas am Heizverhalten geändert hat, kann eine mangelhafte Dachdämmung die Ursache sein. Wärme entweicht ungenutzt – und das kostet Geld.',
        '**Altersbedingte Materialermüdung:** Ein Dach über 30 Jahre alt sollte regelmäßig inspiziert werden. Bitumen wird spröde, Ziegel porös, Dichtungen rissig. Selbst wenn noch keine Feuchtigkeit sichtbar ist, kann das Dach seine Schutzfunktion verlieren.',
        '**Schimmel im Dachgeschoss:** Schimmel unter dem Dach ist ein Zeichen für mangelnde Belüftung oder eindringende Feuchtigkeit. Gesundheitlich ist das besonders bedenklich, da Schimmelsporen die Atemwege belasten können.'
      ]
    },
    {
      h2: (city, trade) => `Was tun bei Verdacht auf Dachschäden?`,
      content: (city, trade, tradeSlug) => `
        Wenn Sie eines oder mehrere dieser Anzeichen beobachten, sollten Sie umgehend handeln. Der erste Schritt ist eine professionelle Dachinspektion durch einen zertifizierten Dachdecker in ${city}. Viele Betriebe bieten eine kostenlose Erstinspektion an, bei der der Zustand des Daches bewertet wird.

        Nach der Inspektion erhalten Sie ein detailliertes Gutachten mit Fotodokumentation. Darin wird der Schaden beschrieben, die Ursache analysiert und ein Sanierungsvorschlag unterbreitet. Seriöse Betriebe geben Ihnen auch eine realistische Kostenschätzung ab.

        **Wichtig:** Holen Sie sich mehrere Angebote ein. Die Preise für Dachsanierungen können erheblich variieren. Achten Sie nicht nur auf den Preis, sondern auch auf die Gewährleistung, die verwendeten Materialien und die Referenzen des Betriebs.

        [Weiterlesen: Dachdämmung fördern lassen](/${tradeSlug}/${city}/blog/dachdaemmung-foerderung/)  
        [Weiterlesen: Sturmschaden am Dach – was tun?](/${tradeSlug}/${city}/blog/sturmschaden-dach/)
      `
    }
  ],
  
  faq: (city, trade) => [
    { q: 'Wie oft sollte ich mein Dach kontrollieren lassen?', a: 'Idealerweise einmal jährlich – am besten im Frühling, nach der sturmbreiten Jahreszeit. Bei älteren Dächern (über 30 Jahre) empfiehlt sich zusätzlich eine Kontrolle im Herbst vor dem Winter.' },
    { q: 'Was kostet eine Dachinspektion?', a: 'Viele Dachdeckerbetriebe bieten die Erstinspektion kostenlos an, wenn Sie anschließend einen Auftrag erteilen. Für eine reine Inspektion ohne Auftragsvergabe können 100 bis 200 Euro fällig werden.' },
    { q: 'Muss ich das gesamte Dach sanieren oder reicht eine Teilsanierung?', a: 'Das hängt vom Schadensbild ab. Bei punktuellen Schäden (z.B. einzelne undichte Stellen) reicht oft eine Teilsanierung. Bei flächendeckenden Problemen oder altersbedingter Materialermüdung ist eine Komplettsanierung langfristig günstiger.' },
    { q: 'Wie lange hält ein saniertes Dach?', a: 'Bei fachgerechter Ausführung mit hochwertigen Materialien können Sie 30 bis 50 Jahre problemlos rechnen. Eine regelmäßige Kontrolle und kleinere Wartungsarbeiten verlängern die Lebensdauer zusätzlich.' }
  ]
};

// ─── TEMPLATE-REGISTRY ───────────────────────────────────────────────

export const WALLBOX_TEMPLATE: ArticleTemplate = {
  slug: 'wallbox-zuhause',
  category: 'elektriker',
  unsplashKeyword: 'electric car charging station home',
  relatedSlugs: ['e-check-sicherheit', 'smart-home-nachruesten'],
  
  title: (city) => `Wallbox installieren in ${city}: Kosten, Förderung & Anbieter`,
  h1: (city) => `Wallbox in ${city}: Ihr Guide zur E-Auto-Ladestation zuhause`,
  metaDescription: (city) => 
    `E-Auto Wallbox in ${city} installieren? ✓ Kosten ✓ KfW-Förderung ✓ Stromanschluss ✓ Zulassung. Alle Infos für Ihre Elektroauto-Ladestation.`,
  
  sections: [
    {
      h2: () => `Warum eine Wallbox zuhause sinnvoll ist`,
      content: (city) => `
        Mit dem Boom der Elektromobilität steigt auch die Nachfrage nach privaten Ladestationen. Wer ein Elektroauto besitzt oder plant, eines zu kaufen, kommt an einer Wallbox nicht vorbei. In ${city} und dem Ruhrgebiet nimmt die Zahl der E-Autos rasant zu – und damit auch der Bedarf an Lademöglichkeiten.

        Eine Wallbox bietet gegenüber einer normalen Steckdose entscheidende Vorteile: Sie lädt deutlich schneller (bis zu 11 kW statt maximal 2,3 kW), ist sicherer (Überhitzungsschutz, FI-Schalter) und komfortabler (App-Steuerung, Ladestandsanzeige). Wer nachts laden kann, nutzt zudem oft günstigeren Strom – und startet morgens mit vollem Akku.

        In ${city} gibt es zunehmend öffentliche Ladesäulen, aber nichts schlägt die Bequemlichkeit des Ladens in der eigenen Garage oder auf dem Stellplatz. Besonders für Pendler, die täglich längere Strecken zurücklegen, ist eine eigene Wallbox fast unverzichtbar.
      `
    },
    {
      h2: () => `Was kostet eine Wallbox inklusive Installation?`,
      content: (city) => `
        Die Gesamtkosten für eine Wallbox setzen sich aus mehreren Positionen zusammen:
      `,
      hasList: true,
      listItems: () => [
        'Wallbox-Gerät (11 kW, mittlere Ausstattung): 800 bis 1.500 Euro',
        'Elektroinstallation (Zuleitung, Sicherung, FI-Schalter): 500 bis 1.500 Euro',
        'Gutachten/Prüfung durch Elektrofachbetrieb: 150 bis 300 Euro',
        'Gesamtkosten typischerweise: 1.500 bis 3.000 Euro',
        'Mit KfW-Förderung (bis 900 Euro Zuschuss): Effektiv ab 600 Euro'
      ]
    },
    {
      h2: (city, trade, tradeSlug) => `Förderung für Wallboxen: Was gibt es aktuell?`,
      content: (city, trade, tradeSlug) => `
        Die Bundesregierung fördert private Ladeinfrastruktur über die KfW mit bis zu 900 Euro Zuschuss pro Ladepunkt. Voraussetzung: Die Wallbox muss intelligent sein (LAN/WLAN-fähig) und ein intelligentes Lastmanagement ermöglichen.

        **Wichtig:** Die Förderung muss VOR der Installation beantragt werden. Wer die Wallbox selbst installiert, bekommt keinen Zuschuss – die Installation muss durch einen Elektrofachbetrieb erfolgen.

        In ${city} gibt es zahlreiche Elektrobetriebe, die auf Wallbox-Installation spezialisiert sind. Achten Sie auf die Zertifizierung des Betriebs und Erfahrung mit verschiedenen Wallbox-Herstellern.

        [Weiterlesen: E-Check Sicherheitsprüfung](/${tradeSlug}/${city}/blog/e-check-sicherheit/)  
        [Weiterlesen: Smart Home nachrüsten](/${tradeSlug}/${city}/blog/smart-home-nachruesten/)
      `
    }
  ],
  
  faq: (city) => [
    { q: 'Brauche ich eine Genehmigung für eine Wallbox?', a: 'In der Regel nein, sofern keine baulichen Veränderungen nötig sind. Wenn jedoch der Hausanschluss verstärkt werden muss oder eine neue Zuleitung verlegt wird, kann eine Anzeige beim Netzbetreiber erforderlich sein.' },
    { q: 'Wie lange dauert die Installation?', a: 'Bei bestehendem Stellplatz in der Nähe des Sicherungskastens: 2 bis 4 Stunden. Bei größeren Entfernungen oder notwendigem Hausanschluss-Ausbau: 1 bis 2 Tage.' },
    { q: 'Lohnt sich eine Wallbox auch für ein Plugin-Hybrid?', a: 'Ja, auch Plugin-Hybride profitieren von einer Wallbox. Die Ladezeit verkürzt sich erheblich, und Sie nutzen den elektrischen Antriebsanteil öfter – was Spritkosten spart.' },
    { q: 'Kann ich mit einer Wallbox Strom ins Netz einspeisen?', a: 'Nein, eine Standard-Wallbox dient nur dem Laden des Fahrzeugs. Bidirektionales Laden (V2G) ist derzeit nur bei wenigen Fahrzeugen möglich und erfordert spezielle Technik.' }
  ]
};

export const SMARTHOME_TEMPLATE: ArticleTemplate = {
  slug: 'smart-home-nachruesten',
  category: 'elektriker',
  unsplashKeyword: 'smart home technology',
  relatedSlugs: ['e-check-sicherheit', 'wallbox-zuhause'],
  
  title: (city) => `Smart Home nachrüsten in ${city}: Systeme & Kosten`,
  h1: (city) => `Smart Home in ${city}: Ihr Haus intelligent machen`,
  metaDescription: (city) => 
    `Smart Home nachrüsten in ${city}? ✓ Systeme im Vergleich ✓ Kosten ✓ Einbruchschutz ✓ Energie sparen. Der komplette Guide vom Elektriker.`,
  
  sections: [
    {
      h2: () => `Was ist Smart Home und was bringt es?`,
      content: (city) => `
        Smart Home bedeutet: Ihr Haus denkt mit. Licht, Heizung, Rollläden, Alarmanlage und Haushaltsgeräte lassen sich zentral steuern – per App, Sprachbefehl oder automatisch nach festen Regeln. In ${city} und der Region entdecken immer mehr Hausbesitzer die Vorteile einer vernetzten Wohnung.

        Die größten Vorteile auf einen Blick: Komfort (alle Funktionen per Smartphone bedienen), Sicherheit (Überwachung, Alarm bei Einbruch oder Wasserschaden), Energieeffizienz (Heizung automatisch runterregeln, wenn niemand zuhause ist) und Barrierefreiheit (Steuerung per Sprache für ältere Menschen).

        Besonders attraktiv ist das Thema Einbruchschutz. Smarte Tür- und Fenstersensoren, Bewegungsmelder und Kameras schrecken Einbrecher ab und alarmieren im Notfall sofort die Bewohner und den Sicherheitsdienst. In ${city}, wo die Einbruchsraten leider über dem Bundesdurchschnitt liegen, ist das ein starkes Argument.
      `
    },
    {
      h2: () => `Smart Home Systeme im Vergleich`,
      content: (city) => `
        Der Markt bietet verschiedene Systeme mit unterschiedlichen Schwerpunkten:
      `,
      hasList: true,
      listItems: () => [
        'KNX (Bus-System): Das professionelle Standard-System für Neubauten und umfassende Sanierungen. Hohe Investition, aber maximale Flexibilität und Zuverlässigkeit.',
        'Homematic IP (EQ-3): Populäres Funk-System für Nachrüstung. Gute Komponentenauswahl, relativ einfache Installation. Kosten ab ca. 500 Euro für ein Basis-Set.',
        'Busch-Jaeger free@home: Hochwertiges System mit schönen Schaltern. Gute Integration in bestehende Elektroinstallation. Preislich im oberen Segment.',
        'Amazon Alexa / Google Home: Sprachsteuerung als Einstieg. Günstig, aber begrenzte Möglichkeiten und Datenschutzbedenken.',
        'Philips Hue / IKEA TRÅDFRI: Spezialisiert auf Beleuchtung. Einfacher Einstieg in Smart Home, erweiterbar mit weiteren Systemen.'
      ]
    },
    {
      h2: (city, trade, tradeSlug) => `Kosten: Was muss ich investieren?`,
      content: (city, trade, tradeSlug) => `
        Die Kosten für ein Smart Home in ${city} hängen stark vom Umfang ab:

        **Einstieg (1-2 Räume):** 500 bis 1.000 Euro  
        **Komfort (gesamte Wohnung):** 2.000 bis 5.000 Euro  
        **Premium (Haus mit Garten):** 5.000 bis 15.000 Euro

        Für eine typische 4-Zimmer-Wohnung in ${city} mit smarter Beleuchtung, Heizungssteuerung, Rollladensteuerung und Alarmanlage sollten Sie mit 3.000 bis 5.000 Euro rechnen – inklusive Installation durch einen Elektrofachbetrieb.

        **Tipp:** Beginnen Sie klein und erweitern Sie nach und nach. Viele Systeme lassen sich modular aufbauen. Starten Sie mit intelligenter Beleuchtung und erweitern Sie später um Heizung und Sicherheit.

        [Weiterlesen: E-Check Sicherheitsprüfung](/${tradeSlug}/${city}/blog/e-check-sicherheit/)  
        [Weiterlesen: Wallbox zuhause installieren](/${tradeSlug}/${city}/blog/wallbox-zuhause/)
      `
    }
  ],
  
  faq: (city) => [
    { q: 'Kann ich Smart Home auch in einer Mietwohnung nachrüsten?', a: 'Ja, viele Systeme sind ohne bauliche Veränderungen einsetzbar. Funk-gesteuerte Thermostate, smarte Steckdosen und Bewegungsmelder lassen sich überall installieren. Bei fest verdrahteten Komponenten benötigen Sie die Zustimmung des Vermieters.' },
    { q: 'Ist Smart Home sicher vor Hackerangriffen?', a: 'Seriöse Hersteller setzen auf verschlüsselte Verbindungen und regelmäßige Updates. Wichtig sind: sicheres WLAN-Passwort, aktuelle Firmware, separate Netzwerke für Smart Home und sensiblen Datenverkehr.' },
    { q: 'Wie lange dauert die Installation?', a: 'Für eine Wohnung mit 4 Räumen: 1 bis 2 Tage bei Funk-Systemen. Bei Bus-Systemen mit Verkabelung: 3 bis 5 Tage. Die Planung sollte einige Wochen vorher erfolgen.' },
    { q: 'Kann ich verschiedene Hersteller kombinieren?', a: 'Ja, über Plattformen wie Home Assistant, ioBroker oder openHAB lassen sich Geräte verschiedener Hersteller verbinden. Das erfordert jedoch technisches Know-how oder einen erfahrenen Elektroinstallateur.' }
  ]
};
  dachdecker: [DACHDAEMMUNG_TEMPLATE, STURMSCHADEN_TEMPLATE, ANZEICHEN_TEMPLATE],
  elektriker: [ECHECK_TEMPLATE],
  shk: [ROHRBRUCH_TEMPLATE],
  maler: [FASSADE_TEMPLATE],
  zimmerer: [CARPORT_TEMPLATE]
};

export function getTemplateForSlug(slug: string): ArticleTemplate | undefined {
  for (const trade of Object.values(ARTICLE_TEMPLATES)) {
    for (const template of trade) {
      if (template.slug === slug) return template;
    }
  }
  return undefined;
}
