const fs = require('fs');
const path = require('path');

// Städte (Ruhrgebiet)
const CITIES = [
  'bergkamen', 'bochum', 'castrop-rauxel', 'dortmund', 'ennepetal',
  'froendenberg', 'gevelsberg', 'hagen', 'hattingen', 'herne',
  'holzwickede', 'iserlohn', 'kamen', 'luenen', 'schwelm',
  'schwerte', 'sprockhoevel', 'unna', 'wetter-ruhr', 'witten'
];

// Gewerk-Konfiguration
const TRADES = {
  dach: { slug: 'dachdecker', category: 'dachdecker', name: 'Dachdecker' },
  elek: { slug: 'elektriker', category: 'elektriker', name: 'Elektriker' },
  maler: { slug: 'maler', category: 'maler', name: 'Maler' },
  shk: { slug: 'shk', category: 'klempner', name: 'Klempner' },
  zimm: { slug: 'zimmerer', category: 'zimmerer', name: 'Zimmerer' },
};

// Artikel-Templates (nur die, die zum Gewerk passen)
const ARTICLES = {
  dachdecker: [
    {
      slug: 'dachdaemmung-foerderung',
      title: (s) => `Dachdämmung in ${s}: Zuschüsse & Förderung 2026`,
      h1: (s) => `Dachdämmung fördern lassen in ${s}`,
      meta: (s) => `Wer in ${s} seine Dachdämmung erneuern möchte, kann auf staatliche Förderung zugreifen. Erfahren Sie, welche Zuschüsse für ${s} und Nordrhein-Westfalen aktuell verfügbar sind.`,
      excerpt: (s) => `Zuschuss oder Kredit? Wer die Dämmung seines Dachs in ${s} plant, sollte die aktuellen Fördermöglichkeiten prüfen.`,
      content: (s, g) => `Ein gut gedämmtes Dach ist die halbe Miete – besonders in ${s}, wo die Wintertemperaturen regelmäßig unter den Gefrierpunkt fallen. Mit einer modernen Dachdämmung sparen Hausbesitzer in ${s} bis zu 30 Prozent Heizkosten ein.

Nordrhein-Westfalen bietet verschiedene Förderprogramme für energetische Sanierungen an. Besonders gefragt ist der KfW-Effizienzhaus-Kredit. Zusätzlich gibt es Zuschüsse über das BAFA für die Dämmung von Aufdach- und Zwischensparrendämmungen.

Für Eigentümer in ${s} empfiehlt sich ein Beratungsgespräch mit einem ${g} vor Ort. Dieser kann eine detaillierte Energieberatung durchführen und die passenden Fördermittel beantragen.

Wenn Ihr Dach älter als 20 Jahre ist oder Sie hohe Heizkosten haben, lohnt sich eine Prüfung. In ${s} gibt es zahlreiche Fachbetriebe, die eine kostenlose Erstinspektion anbieten.`
    },
    {
      slug: 'sturmschaden-dach',
      title: (s) => `Sturmschaden am Dach in ${s}: Schnelle Hilfe`,
      h1: (s) => `Dachsturmschaden in ${s}: Notdienst & Regulierung`,
      meta: (s) => `Nach einem Sturm ist schnelles Handeln gefragt. Erfahren Sie, wie Sie Sturmschäden am Dach in ${s} dokumentieren und einen Dachdecker-Notdienst erreichen.`,
      excerpt: (s) => `Loses Dachziegel nach dem Sturm? Was Eigentümer in ${s} sofort tun sollten.`,
      content: (s, g) => `Heftige Stürme können Dächer schwer beschädigen – abgedeckte Ziegel, abgerissene Dachrinnen oder gar Eindringen von Wasser. Für Hauseigentümer in ${s} ist wichtig, schnell und richtig zu reagieren.

**Sofortmaßnahmen nach dem Sturm:**
1. Sicherheit geht vor – das Dach nicht selbst betreten
2. Schaden dokumentieren: Fotos von allen betroffenen Stellen
3. Notdienst kontaktieren: Viele ${g} in ${s} bieten einen 24h-Notdienst
4. Versicherung informieren
5. Provisorische Abdichtung durch Fachmann

Die meisten Gebäudeversicherungen decken Sturmschäden ab. Wichtig ist, den Schaden umgehend zu melden und ein Gutachten einzuholen.`
    },
    {
      slug: '5-anzeichen-dachsanierung',
      title: (s) => `5 Anzeichen für nötige Dachsanierung in ${s}`,
      h1: (s) => `Ist Ihr Dach in ${s} sanierungsbedürftig?`,
      meta: (s) => `Wasserflecken, Ziegelverlust oder hohe Heizkosten? Erfahren Sie, welche 5 Anzeichen in ${s} auf eine nötige Dachsanierung hindeuten.`,
      excerpt: (s) => `Von Wasserflecken bis zum Heizkostenanstieg: 5 Warnsignale, die Hauseigentümer in ${s} ernst nehmen sollten.`,
      content: (s, g) => `Das Dach ist die Krone des Hauses. Wer frühzeitig reagiert, kann teure Folgeschäden vermeiden. Diese 5 Warnsignale sollten Eigentümer in ${s} ernst nehmen:

**1. Wasserflecken an der Decke**
Der eindeutigste Hinweis: Feuchtigkeit an der Zimmerdecke oder an den Wänden unter dem Dach.

**2. Lose oder fehlende Dachziegel**
Nach Stürmen oder bei älteren Dächern können Ziegel abgerissen werden.

**3. Anstieg der Heizkosten**
Wenn die Heizkosten plötzlich steigen, kann eine mangelhafte Dachdämmung die Ursache sein.

**4. Altersbedingte Materialermüdung**
Ein Dach über 30 Jahre alt sollte regelmäßig inspiziert werden.

**5. Schimmel im Dachgeschoss**
Schimmel unter dem Dach ist ein Zeichen für mangelnde Belüftung oder eindringende Feuchtigkeit.`
    }
  ],
  elektriker: [
    {
      slug: 'e-check-sicherheit',
      title: (s) => `E-Check in ${s}: Wann ist die Prüfung Pflicht?`,
      h1: (s) => `Elektrische Sicherheitsprüfung in ${s}`,
      meta: (s) => `Der E-Check schützt vor Stromunfällen und Brandschäden. Erfahren Sie, wann eine Prüfung in ${s} Pflicht ist und was sie kostet.`,
      excerpt: (s) => `Stromunfälle vermeiden: Der E-Check ist für Gewerbe in ${s} Pflicht und für Privathaushalte empfohlen.`,
      content: (s, g) => `Elektrische Anlagen altern – und damit steigt das Risiko von Kurzschlüssen und Brandgefahren. Der E-Check ist für Gewerbebetriebe in ${s} gesetzlich vorgeschrieben.

Bei einer E-Check-Prüfung in ${s} werden Verteiler, Leitungen, Schutzschalter und Verbrauchsstellen überprüft. Besonders wichtig: Die Prüfung darf nur von einem zertifizierten ${g} durchgeführt werden.

In älteren Gebäuden in ${s} finden Prüfer oft veraltete Sicherungsautomaten, nicht mehr normgerechte Steckdosen in Feuchträumen oder überlastete Leitungen.

Für ein Einfamilienhaus in ${s} liegen die Kosten zwischen 150 und 300 Euro. Gewerbebetriebe sollten alle 1-4 Jahre prüfen lassen.`
    },
    {
      slug: 'smart-home-nachruesten',
      title: (s) => `Smart Home in ${s}: Nachrüsten leicht gemacht`,
      h1: (s) => `Smart Home-Systeme für ${s}: Effizient & sicher wohnen`,
      meta: (s) => `Smart Home macht Ihr Haus in ${s} intelligenter. Erfahren Sie, welche Systeme sich nachrüsten lassen und was Elektriker vor Ort empfehlen.`,
      excerpt: (s) => `Von der smarten Steckdose bis zur kompletten Haussteuerung: Smart Home-Trends in ${s}.`,
      content: (s, g) => `Ob Licht, Heizung oder Sicherheit – Smart Home-Systeme machen das Leben komfortabler. Für Hauseigentümer in ${s} gibt es mittlerweile zahlreiche Möglichkeiten, auch nachträglich intelligente Technik einzubauen.

Die beliebtesten Systeme in ${s} sind KNX, Busch-Jaeger free@home, Gira HomeServer und Smart Home über WLAN. Ein ortsansässiger ${g} kann vor Ort prüfen, welche Systeme mit Ihrer bestehenden Elektroinstallation kompatibel sind.

Mit smarten Thermostaten und steuerbaren Rollladenmotoren lassen sich in ${s} bis zu 20 Prozent Heizkosten einsparen.`
    },
    {
      slug: 'wallbox-installation',
      title: (s) => `Wallbox installieren in ${s}: Kosten & Förderung`,
      h1: (s) => `E-Auto-Ladestation in ${s}: Planung & Installation`,
      meta: (s) => `Wallboxen werden in ${s} immer beliebter. Erfahren Sie mehr über Kosten, Förderung und worauf Sie bei der Installation achten sollten.`,
      excerpt: (s) => `Mit 11 oder 22 kW zuhause laden: Was E-Auto-Besitzer in ${s} über Wallboxen wissen müssen.`,
      content: (s, g) => `Die Zahl der Elektroautos steigt – und damit auch der Bedarf an Ladestationen zuhause. Für E-Auto-Besitzer in ${s} ist eine Wallbox die bequemste Lösung.

Die Kosten für eine Wallbox-Installation in ${s} setzen sich zusammen aus: Wallbox-Gerät (500-1.500€), Elektroinstallation (300-800€) und ggf. Zählerschrank-Erweiterung (200-500€). Insgesamt: 1.000-2.500€.

Die KfW fördert Wallboxen mit bis zu 900 Euro pro Ladepunkt. Ein ${g} in ${s} prüft vor Ort: Ist der Zählerschrank ausreichend dimensioniert? Reicht die Hausanschlussleistung?`
    }
  ],
  klempner: [
    {
      slug: 'heizungstausch-foerderung',
      title: (s) => `Heizungstausch in ${s}: Förderung & Kosten 2026`,
      h1: (s) => `Heizung erneuern in ${s}: Diese Förderung gibt es`,
      meta: (s) => `Der Heizungstausch wird in ${s} mit bis zu 70% gefördert. Erfahren Sie mehr über BEG-Förderung, Kosten und die besten Heizungssysteme.`,
      excerpt: (s) => `Bis zu 70% Förderung beim Heizungstausch: Was Eigentümer in ${s} über die BEG wissen müssen.`,
      content: (s, g) => `Die Energiepreise steigen, und alte Heizungen werden ineffizient. Wer in ${s} seine Heizung erneuern möchte, kann aktuell auf attraktive Förderungen zugreifen.

Die Bundesförderung für effiziente Gebäude (BEG) unterstützt Eigentümer in ${s} beim Austausch ihrer alten Heizung. Je nach System gibt es Zuschüsse zwischen 30 und 70 Prozent.

In Nordrhein-Westfalen sind Wärmepumpen besonders beliebt. Für Bestandsgebäude mit höherem Wärmebedarf können Hybridheizungen eine gute Zwischenlösung sein.

**Wichtig:** Die Förderung muss VOR Beginn der Arbeiten beantragt werden. Ein ${g} vor Ort berät Sie gerne.`
    },
    {
      slug: 'rohrbruch-sofortmassnahmen',
      title: (s) => `Rohrbruch in ${s}: Sofortmaßnahmen & Notdienst`,
      h1: (s) => `Wasserrohrbruch in ${s}: Was tun?`,
      meta: (s) => `Ein Rohrbruch ist ein Notfall. Erfahren Sie, welche Sofortmaßnahmen Sie in ${s} ergreifen sollten und wie Sie einen zuverlässigen Klempner-Notdienst erreichen.`,
      excerpt: (s) => `Jede Minute zählt: Was Sie bei einem Rohrbruch in ${s} sofort tun sollten, bevor der Schaden steigt.`,
      content: (s, g) => `Ein Wasserrohrbruch kann innerhalb kürzester Zeit enorme Schäden anrichten. Für Hausbesitzer in ${s} ist es wichtig zu wissen, was im Ernstfall zu tun ist.

**Erste Hilfe bei Rohrbruch:**
1. Hauptwasserhahn schließen
2. Strom abschalten, wenn Wasser in die Nähe von Steckdosen gelangt ist
3. Wasser ablaufen lassen – alle Wasserhähne öffnen
4. Schaden dokumentieren: Fotos für die Versicherung
5. Fachmann rufen: Ein ${g} vor Ort kann die Schadensursache beheben

Viele Sanitärfachbetriebe in ${s} bieten einen 24-Stunden-Notdienst an.`
    },
    {
      slug: 'heizungs-check-winter',
      title: (s) => `Heizungs-Check in ${s}: Fit für den Winter`,
      h1: (s) => `Heizung prüfen in ${s}: 7 Punkte vor dem Winter`,
      meta: (s) => `Bevor die Heizperiode beginnt, sollten Sie Ihre Heizung prüfen. Erfahren Sie, welche 7 Punkte Klempner in ${s} vor dem Winter empfehlen.`,
      excerpt: (s) => `Klappernde Heizung oder kalte Radiatoren? Der Winter-Check für Heizungen in ${s}.`,
      content: (s, g) => `Wenn die Temperaturen fallen, muss die Heizung zuverlässig funktionieren. Ein kurzer Check vor der Heizperiode kann teure Ausfälle verhindern – besonders wichtig in ${s}.

**Der 7-Punkte-Plan:**
1. Heizkörper entlüften
2. Thermostate prüfen
3. Wasserdruck kontrollieren (1,0-1,5 bar)
4. Heizkörper reinigen
5. Heizungsanlage warten (alle 2 Jahre)
6. Dichtheitsprüfung
7. Programmierung checken

Ein ${g} vor Ort bietet professionelle Heizungswartungen an. Eine gut gewartete Heizung spart bis zu 15 Prozent Energiekosten ein.`
    }
  ],
  maler: [
    {
      slug: 'fassade-streichen-kosten',
      title: (s) => `Fassade streichen in ${s}: Kosten, Farbe & Anstrich`,
      h1: (s) => `Hausfassade streichen lassen in ${s}`,
      meta: (s) => `Eine neue Fassade macht Ihr Haus in ${s} fit für die Zukunft. Erfahren Sie mehr über Kosten, Farbwahl und die beste Jahreszeit für den Anstrich.`,
      excerpt: (s) => `Von der Farbwahl bis zum Wetterschutz: Was Sie über Fassadenanstriche in ${s} wissen sollten.`,
      content: (s, g) => `Die Fassade ist die Visitenkarte jedes Hauses. Ein frischer Anstrich schützt nicht nur vor Witterungseinflüssen, sondern steigert auch den Immobilienwert – besonders in ${s}.

Die Kosten für einen professionellen Fassadenanstrich in ${s} liegen bei etwa 80 bis 140 Euro pro Quadratmeter. Dazu kommen eventuelle Vorbereitungsarbeiten.

Im Nordrhein-Westfalen ist der Frühling und Frühsommer die ideale Zeit für Fassadenarbeiten. Die Temperaturen sollten konstant über 5 Grad Celsius liegen.

In manchen Stadtteilen von ${s} gibt es Denkmalschutzauflagen. Ein erfahrener ${g} kennt die Vorschriften und berät Sie bei der Auswahl wetterfester, UV-beständiger Farben.`
    },
    {
      slug: 'schimmel-wohnung',
      title: (s) => `Schimmel in der Wohnung in ${s}: Ursachen & Hilfe`,
      h1: (s) => `Schimmelbekämpfung in ${s}: Effektiv & nachhaltig`,
      meta: (s) => `Schimmel ist ein Gesundheitsrisiko. Erfahren Sie, wie Sie Schimmel in Ihrer Wohnung in ${s} erkennen, entfernen und langfristig verhindern.`,
      excerpt: (s) => `Schimmel ist mehr als ein Schönheitsfehler. Was Mieter und Eigentümer in ${s} tun können.`,
      content: (s, g) => `Schimmel in der Wohnung ist nicht nur unschön, sondern kann ernste Gesundheitsprobleme verursachen. Besonders in älteren Häusern in ${s} ist dies ein häufiges Problem.

Die häufigsten Ursachen in ${s}:
- Zu wenig Lüften (moderne Fenster sind dicht)
- Kalte Brücken (schlecht gedämmte Außenwände)
- Fehlende Entlüftung
- Wasserschäden

Kleine Befallsflächen können Sie selbst entfernen. Größere Befallsflächen (mehr als einen Quadratmeter) sollten Sie einem ${g} überlassen. Wichtig: Die Ursache beseitigen, nicht nur die Symptome.`
    },
    {
      slug: 'farben-raumwirkung',
      title: (s) => `Farben & Raumwirkung in ${s}: Der richtige Ton`,
      h1: (s) => `Wie Farben Räume verändern: Tipps für ${s}`,
      meta: (s) => `Die richtige Farbwahl macht kleine Räume groß und dunkle Räume hell. Erfahren Sie, wie Maler in ${s} mit Farben arbeiten.`,
      excerpt: (s) => `Von der Wohnküche bis zum Home-Office: Wie Farben in ${s}er Wohnungen wirken.`,
      content: (s, g) => `Farben beeinflussen nicht nur die Stimmung, sondern auch die Raumwirkung. Ein erfahrener ${g} in ${s} weiß, wie man mit der richtigen Farbwahl optische Akzente setzt.

Helle, kühle Töne wie Weiß, Hellgrau oder Pastellblau lassen Räume optisch größer wirken. Besonders in den oft kompakten Altbauswohnungen in ${s} ein beliebter Trick.

Trendfarben in ${s} sind derzeit:
- Sage Green: Naturverbunden und beruhigend
- Terracotta: Warm und einladend  
- Dunkelblau: Elegant und zurückhaltend

Ein ${g} vor Ort kann Farbproben anbringen und bei Tageslicht bewerten.`
    }
  ],
  zimmerer: [
    {
      slug: 'carport-bauen',
      title: (s) => `Carport bauen in ${s}: Genehmigung, Kosten & Planung`,
      h1: (s) => `Carport bauen in ${s}: Was Sie beachten müssen`,
      meta: (s) => `Carport bauen in ${s}: Bis 30 m² oft genehmigungsfrei. Erfahren Sie mehr über Kosten, Genehmigung und die richtige Holzwahl.`,
      excerpt: (s) => `Bis 30 m² oft genehmigungsfrei – aber nicht überall. Was Sie vor dem Carport-Bau in ${s} wissen sollten.`,
      content: (s, g) => `Ein Carport schützt das Auto vor Witterungseinflüssen und ist oft günstiger als eine Garage. Doch bevor Sie in ${s} mit dem Bau beginnen, sollten Sie einige wichtige Punkte klären.

Im Nordrhein-Westfalen und speziell in ${s} gilt: Carports bis 30 Quadratmeter sind oft genehmigungsfrei. Voraussetzung ist, dass sie nicht an der Straßengrenze stehen und die Firsthöhe 3 Meter nicht überschreitet.

Für ${s} und das Umland ist Holz die beliebteste Wahl. Lärche und Douglasie sind wetterfest. Ein ortsansässiger ${g} kann bei der Materialauswahl und statischen Planung helfen.

Ein qualitativ hochwertiger Holz-Carport kostet in ${s} zwischen 3.000 und 8.000 Euro.`
    },
    {
      slug: 'dachstuhl-sanieren',
      title: (s) => `Dachstuhl sanieren in ${s}: Kosten & Ablauf`,
      h1: (s) => `Dachstuhl erneuern in ${s}: Was Sie wissen müssen`,
      meta: (s) => `Ein alter Dachstuhl ist kein Grund zur Sorge. Erfahren Sie, wie Zimmerer in ${s} Ihren Dachstuhl fachgerecht sanieren und was es kostet.`,
      excerpt: (s) => `Statt abreißen: Warum eine Dachstuhl-Sanierung in ${s} oft die bessere Wahl ist.`,
      content: (s, g) => `Viele Häuser in ${s} haben Dachstühle, die Jahrzehnte oder sogar Jahrhunderte alt sind. Doch Alter bedeutet nicht automatisch, dass ein Neubau nötig ist. Mit modernen Sanierungsmethoden kann ein ${g} den Bestand erhalten und gleichzeitig auf den neuesten Stand bringen.

Eine Sanierung lohnt sich, wenn:
- Der Holzbefall lokal begrenzt ist
- Die Statik grundsätzlich in Ordnung ist
- Der Denkmalschutz eine Erhaltung vorsieht
- Die Kosten für einen Neubau 50% über den Sanierungskosten liegen würden

Bei einer Sanierung können gleichzeitig Dämmung, Dachfenster und Dichtheit verbessert werden.`
    },
    {
      slug: 'holzterrasse-pflegen',
      title: (s) => `Holzterrasse pflegen in ${s}: So bleibt sie schön`,
      h1: (s) => `Holzterrasse in ${s}: Pflege & Wartung`,
      meta: (s) => `Eine Holzterrasse braucht regelmäßige Pflege. Erfahren Sie, welche Maßnahmen in ${s} wichtig sind und wie Sie Ihre Terrasse lange schön halten.`,
      excerpt: (s) => `Mit der richtigen Pflege hält eine Holzterrasse in ${s} 20 Jahre und länger.`,
      content: (s, g) => `Eine Holzterrasse ist ein wertvoller Wohnraum im Freien. Doch um sie lange zu erhalten, braucht sie regelmäßige Pflege – besonders in ${s}, wo das Klima mit feuchten Wintern und sonnigen Sommern Holz beansprucht.

**Frühling:** Grundreinigung & Ölen nach dem Winter
**Sommer:** Wöchentliche Pflege, aber kein direkte Sonne auf nassem Holz
**Herbst:** Laub und Nadeln regelmäßig entfernen
**Winter:** Schnee nicht länger als nötig liegen lassen

Ein erfahrener ${g} in ${s} kann bei der Neuausrichtung oder dem Austausch einzelner Bretter helfen.`
    }
  ]
};

// HTML-Template für Blog-Artikel
function generateArticleHTML(article, city, trade) {
  const cityTitle = city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');
  const tradeName = trade.name;
  
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article.title(cityTitle)}</title>
  <meta name="description" content="${article.meta(cityTitle)}">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.7; }
    .container { max-width: 800px; margin: 0 auto; padding: 0 20px; }
    header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; padding: 40px 0; text-align: center; }
    header h1 { font-size: 2rem; font-weight: 800; margin-bottom: 10px; }
    header .meta { color: #94a3b8; font-size: 0.9rem; }
    .content { background: white; margin: 40px auto; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .content h2 { font-size: 1.5rem; font-weight: 700; margin: 30px 0 15px; color: #0f172a; }
    .content h3 { font-size: 1.2rem; font-weight: 600; margin: 20px 0 10px; color: #334155; }
    .content p { margin-bottom: 16px; color: #475569; }
    .content ul { margin: 16px 0; padding-left: 24px; }
    .content li { margin-bottom: 8px; color: #475569; }
    .content strong { color: #0f172a; }
    .breadcrumb { padding: 16px 0; font-size: 0.875rem; color: #64748b; }
    .breadcrumb a { color: #3b82f6; text-decoration: none; }
    .breadcrumb a:hover { text-decoration: underline; }
    .back-link { display: inline-block; margin-top: 30px; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
    .back-link:hover { background: #2563eb; }
    @media (max-width: 640px) {
      header h1 { font-size: 1.5rem; }
      .content { padding: 24px; margin: 20px auto; }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <div style="font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.1em; color: #60a5fa; margin-bottom: 8px;">${tradeName} in ${cityTitle}</div>
      <h1>${article.h1(cityTitle)}</h1>
      <div class="meta">Aktualisiert: August 2026 · 6 Min. Lesezeit</div>
    </div>
  </header>
  
  <div class="container">
    <div class="breadcrumb">
      <a href="/${trade.slug}/${city}/">${cityTitle}</a> / <a href="/${trade.slug}/${city}/">${tradeName}</a> / Blog
    </div>
    
    <article class="content">
      <p style="font-size: 1.125rem; color: #334155; margin-bottom: 24px; font-weight: 500;">${article.excerpt(cityTitle)}</p>
      
      ${article.content(cityTitle, tradeName).split('\n\n').map(p => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return `<h3>${p.replace(/\*\*/g, '')}</h3>`;
        }
        if (p.startsWith('**')) {
          return `<h2>${p.replace(/\*\*/g, '')}</h2>`;
        }
        if (p.includes('\n')) {
          const lines = p.split('\n').filter(l => l.trim());
          if (lines[0].startsWith('1.')) {
            return `<ol>${lines.map(l => `<li>${l.replace(/^\d+\.\s*/, '')}</li>`).join('')}</ol>`;
          }
          return `<ul>${lines.map(l => `<li>${l.replace(/^[-*]\s*/, '')}</li>`).join('')}</ul>`;
        }
        return `<p>${p}</p>`;
      }).join('\n      ')}
      
      <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
        <h3 style="margin-bottom: 16px;">Benötigen Sie einen ${tradeName} in ${cityTitle}?</h3>
        <p style="margin-bottom: 20px;">Unsere Partnerbetriebe in ${cityTitle} helfen Ihnen gerne bei Ihrem Vorhaben.</p>
        <a href="/${trade.slug}/${city}/" class="back-link">${tradeName} in ${cityTitle} finden →</a>
      </div>
    </article>
  </div>
</body>
</html>`;
}

// Hauptfunktion
function generateAll() {
  const publicDir = path.join(__dirname, '..', 'public');
  let count = 0;
  
  for (const [tradeKey, trade] of Object.entries(TRADES)) {
    const articles = ARTICLES[trade.category];
    if (!articles) continue;
    
    for (const city of CITIES) {
      const blogDir = path.join(publicDir, 'blog', trade.slug, city);
      fs.mkdirSync(blogDir, { recursive: true });
      
      for (const article of articles) {
        const html = generateArticleHTML(article, city, trade);
        const filePath = path.join(blogDir, `${article.slug}.html`);
        fs.writeFileSync(filePath, html);
        count++;
      }
    }
    console.log(`✅ ${trade.name}: ${CITIES.length} Städte × ${articles.length} Artikel = ${CITIES.length * articles.length}`);
  }
  
  console.log(`\n🎉 Fertig! ${count} lokalisierte Blog-Artikel generiert.`);
  console.log(`   5 Gewerke × 20 Städte × 3 Artikel = 300 Artikel`);
}

generateAll();
