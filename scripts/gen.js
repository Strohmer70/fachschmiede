const fs = require('fs');
const path = require('path');

const TRADES = {
  dachdecker: { name: 'Dachdecker', slug: 'dachdecker' },
  elektriker: { name: 'Elektriker', slug: 'elektriker' },
  shk: { name: 'Klempner', slug: 'shk' },
  maler: { name: 'Maler', slug: 'maler' },
  zimmerer: { name: 'Zimmerer', slug: 'zimmerer' },
};

const CITIES = {
  'bergkamen': 'Bergkamen', 'bochum': 'Bochum', 'castrop-rauxel': 'Castrop-Rauxel',
  'dortmund': 'Dortmund', 'ennepetal': 'Ennepetal', 'froendenberg': 'Fröndenberg',
  'gevelsberg': 'Gevelsberg', 'hagen': 'Hagen', 'hattingen': 'Hattingen',
  'herne': 'Herne', 'holzwickede': 'Holzwickede', 'iserlohn': 'Iserlohn',
  'kamen': 'Kamen', 'luenen': 'Lünen', 'schwelm': 'Schwelm',
  'schwerte': 'Schwerte', 'sprockhoevel': 'Sprockhövel', 'unna': 'Unna',
  'wetter-ruhr': 'Wetter (Ruhr)', 'witten': 'Witten'
};

const IMAGES = {
  'dachdaemmung-foerderung': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
  'sturmschaden-dach': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
  '5-anzeichen-dachsanierung': 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80',
  'e-check-sicherheit': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80',
  'rohrbruch-sofortmassnahmen': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1200&q=80',
  'fassade-streichen-kosten': 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1200&q=80',
  'carport-bauen': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=80'
};

function makeHTML(title, h1, meta, image, body, faqs, trade, city, cSlug, tSlug) {
  const faqHTML = faqs.map(f => `<details><summary>${f.q}</summary><div>${f.a}</div></details>`).join('\n');
  return `<!DOCTYPE html>
<html lang="de"><head><meta charset="UTF-8">
<title>${title}</title>
<meta name="description" content="${meta}">
<style>
body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.7;color:#333}
h1{color:#1a1a1a;font-size:2rem}h2{color:#2a2a2a;margin-top:2rem;font-size:1.5rem}
p{margin:1rem 0}ul{margin:1rem 0;padding-left:1.5rem}li{margin:0.5rem 0}
a{color:#2563eb}img{width:100%;height:300px;object-fit:cover;border-radius:8px;margin:1rem 0}
details{background:#f5f5f5;padding:1rem;margin:0.5rem 0;border-radius:8px}
summary{font-weight:bold;cursor:pointer}
.cta{background:#f59e0b;color:white;padding:1rem 2rem;text-decoration:none;border-radius:8px;display:inline-block;margin:1rem 0}
</style></head><body>
<h1>${h1}</h1>
<p><small>${trade.name} in ${city}</small></p>
<img src="${image}" alt="${title}" loading="lazy">
${body}
<h2>Häufig gestellte Fragen</h2>
${faqHTML}
<div style="background:#fef3c7;padding:2rem;border-radius:12px;margin:2rem 0;text-align:center;">
<h3>Benötigen Sie einen ${trade.name} in ${city}?</h3>
<a href="/${tSlug}/${cSlug}/#kontakt" class="cta">Kostenloses Angebot anfordern</a>
</div>
<p><a href="/${tSlug}/${cSlug}/">← Zurück zu ${trade.name} ${city}</a></p>
</body></html>`;
}

function generateDachdaemmung(trade, city, cSlug, tSlug) {
  const title = `Dachdämmung in ${city}: Kosten, Förderung & Zuschüsse 2026`;
  const h1 = `Dachdämmung in ${city}: Ihr Ratgeber zu Kosten & Förderung`;
  const meta = `Wer in ${city} seine Dachdämmung erneuern möchte, kann auf staatliche Förderung zugreifen. ✓ KfW-Zuschuss ✓ BAFA-Förderung ✓ Einsparpotenzial bis 30%.`;
  const img = IMAGES['dachdaemmung-foerderung'];
  
  const body = `
<h2>Warum lohnt sich eine Dachdämmung in ${city}?</h2>
<p>Ein gut gedämmtes Dach ist die halbe Miete – besonders in ${city} und dem gesamten Ruhrgebiet, wo die Wintertemperaturen regelmäßig unter den Gefrierpunkt fallen. Mit einer modernen Dachdämmung sparen Hausbesitzer in ${city} bis zu 30 Prozent Heizkosten ein – und das Jahr für Jahr.</p>
<p>Doch nicht nur die Energieeinsparung spricht für eine Dachdämmung. Auch der Wohnkomfort steigt spürbar: Im Sommer bleibt es unter dem Dach angenehm kühl, im Winter muckelig warm. Zudem schützen Sie Ihr Gebäude vor Feuchtigkeitsschäden und Schimmel – ein Problem, das gerade in älteren Häusern in ${city} häufig vorkommt.</p>
<p>Die Investition in eine Dachdämmung amortisiert sich in der Regel innerhalb von 10 bis 15 Jahren. Bei steigenden Energiepreisen sogar schneller. Und mit den aktuellen Förderprogrammen wird die Sanierung für Hausbesitzer in ${city} besonders attraktiv.</p>

<h2>Welche Fördermöglichkeiten gibt es aktuell?</h2>
<p>Nordrhein-Westfalen und der Bund bieten verschiedene Förderprogramme für energetische Sanierungen an. Besonders gefragt ist der <strong>KfW-Effizienzhaus-Kredit</strong>, der zinsgünstige Darlehen für energetische Maßnahmen bereitstellt. Zusätzlich gibt es direkte Zuschüsse über das <strong>BAFA</strong> für die Dämmung von Aufdach- und Zwischensparrendämmungen.</p>
<p>Für Eigentümer in ${city} empfiehlt sich ein Beratungsgespräch mit einem zertifizierten Energieberater. Dieser kann eine detaillierte Energieberatung durchführen und die passenden Fördermittel beantragen. Viele Fachbetriebe in ${city} kooperieren mit Energieberatern und übernehmen die Antragsstellung für Sie.</p>
<ul>
<li>KfW-Effizienzhaus-Kredit: Bis zu 120.000 € Darlehen mit Tilgungszuschuss</li>
<li>BAFA-Zuschuss: Bis zu 15 % der förderfähigen Kosten für Dämmmaßnahmen</li>
<li>Bundesförderung für effiziente Gebäude (BEG): Zuschuss oder zinsgünstiges Darlehen</li>
<li>Kommunale Förderprogramme: Einige Städte im Ruhrgebiet bieten zusätzliche Zuschüsse</li>
</ul>

<h2>Was kostet eine Dachdämmung in ${city}?</h2>
<p>Die Kosten für eine Dachdämmung in ${city} hängen von mehreren Faktoren ab: der Dachfläche, der gewählten Dämmmethode und dem baulichen Zustand. Als Richtwert können Sie mit 80 bis 150 Euro pro Quadratmeter rechnen – inklusive Material und Montage.</p>
<p><strong>Aufsparrendämmung:</strong> Die Dämmung wird auf den Sparren aufgebracht. Ideal, wenn der Dachstuhl erhalten bleiben soll. Kosten: ca. 90-130 €/m².</p>
<p><strong>Zwischensparrendämmung:</strong> Dämmstoff wird zwischen den Sparren eingeführt. Gute Wärmedämmung bei geringer Aufbauhöhe. Kosten: ca. 80-120 €/m².</p>
<p><strong>Untersparrendämmung:</strong> Von innen wird unterhalb der Sparren gedämmt. Günstigste Variante, aber mit Raumhöhen-Verlust. Kosten: ca. 60-90 €/m².</p>

<h2>Fachbetriebe für Dachdämmung in ${city}</h2>
<p>In ${city} gibt es zahlreiche Fachbetriebe, die sich auf Dachdämmung spezialisiert haben. Achten Sie bei der Auswahl auf eine Fachfirma mit Meisterbetrieb und Zertifizierung. Ein qualifizierter ${trade.name} führt nicht nur die Arbeiten fachgerecht aus, sondern berät Sie auch zu den optimalen Fördermöglichkeiten.</p>
<p><a href="/${tSlug}/${cSlug}/blog/sturmschaden-dach/">Weiterlesen: Sturmschaden am Dach – was tun?</a></p>
<p><a href="/${tSlug}/${cSlug}/blog/5-anzeichen-dachsanierung/">Weiterlesen: 5 Anzeichen für nötige Dachsanierung</a></p>
`;

  const faqs = [
    {q:`Wie lange dauert eine Dachdämmung in ${city}?`,a:'Je nach Dachgröße und gewählter Methode dauert die Sanierung 1 bis 3 Wochen. Bei einer Aufsparrendämmung ist die Bauzeit in der Regel kürzer.'},
    {q:'Muss ich die Förderung selbst beantragen?',a:'Nein, viele Fachbetriebe übernehmen die Antragsstellung für Sie. Der Antrag muss VOR Baubeginn gestellt werden.'},
    {q:`Gibt es regionale Förderungen speziell für ${city}?`,a:'Neben den Bundesförderungen gibt es in Nordrhein-Westfalen gelegentlich kommunale Programme. Informieren Sie sich bei der Stadtverwaltung.'}
  ];
  
  return makeHTML(title, h1, meta, img, body, faqs, trade, city, cSlug, tSlug);
}

function generateSturmschaden(trade, city, cSlug, tSlug) {
  const title = `Sturmschaden am Dach in ${city}: Soforthilfe & Kosten`;
  const h1 = `Sturmschaden in ${city}: Schnelle Hilfe vom Dachdecker`;
  const meta = `Sturmschaden in ${city}? ✓ Soforthilfe ✓ Versicherung ✓ Kosten ✓ Notdienst 24h.`;
  const img = IMAGES['sturmschaden-dach'];
  
  const body = `
<h2>Sofortmaßnahmen nach Sturmschaden am Dach</h2>
<p>Heftige Stürme können Dächer schwer beschädigen – abgedeckte Ziegel, abgerissene Dachrinnen oder gar Wassereintritt. Für Hauseigentümer in ${city} ist wichtig, schnell und richtig zu reagieren.</p>
<p>Der sicherheitshinweis hat oberste Priorität: Betreten Sie das Dach niemals selbst! Selbst erfahrene Handwerker nutzen bei Sturmschäden Sicherungsseile und spezielles Schuhwerk.</p>
<p>Die zweite wichtige Maßnahme ist die Dokumentation. Fotografieren Sie alle Schäden aus sicherer Perspektive. Diese Aufnahmen sind für die Versicherung und spätere Gutachter unverzichtbar.</p>

<h2>Der richtige Ablauf: Schritt für Schritt</h2>
<ul>
<li>Sicherheit prüfen: Sind Stromleitungen beschädigt? Gibt es herabhängende Teile?</li>
<li>Schaden fotografieren: Aus verschiedenen Perspektiven, mit Datumsstempel</li>
<li>Versicherung informieren: Innerhalb von 48 Stunden, idealerweise noch am selben Tag</li>
<li>Dachdecker-Notdienst rufen: In ${city} sind mehrere Betriebe 24/7 erreichbar</li>
<li>Provisorische Abdichtung: Vom Fachmann durchgeführt, nie selbst versuchen</li>
</ul>

<h2>Was kostet die Sturmreparatur in ${city}?</h2>
<p>Die Gebäudeversicherung übernimmt in der Regel die Kosten für Schäden durch Sturm – vorausgesetzt, der Sturm erreichte die Windgeschwindigkeit von mindestens 75 km/h.</p>
<p><strong>Kleine Reparatur:</strong> 300 bis 800 Euro<br>
<strong>Mittlerer Schaden:</strong> 2.000 bis 5.000 Euro<br>
<strong>Großschaden:</strong> 10.000 bis 30.000 Euro</p>
<p><a href="/${tSlug}/${cSlug}/blog/dachdaemmung-foerderung/">Weiterlesen: Dachdämmung fördern lassen</a></p>
`;

  const faqs = [
    {q:'Wie schnell muss ich die Versicherung informieren?',a:'Idealerweise noch am selben Tag, spätestens innerhalb von 48 Stunden.'},
    {q:'Wie lange dauert die Reparatur?',a:'Bei kleinen Schäden 1 bis 3 Tage. Bei größeren Schäden kann die Reparatur mehrere Wochen dauern.'}
  ];
  
  return makeHTML(title, h1, meta, img, body, faqs, trade, city, cSlug, tSlug);
}

function generateAnzeichen(trade, city, cSlug, tSlug) {
  const title = `5 Anzeichen für nötige Dachsanierung in ${city}`;
  const h1 = `Ist Ihr Dach in ${city} sanierungsbedürftig?`;
  const meta = `Wasserflecken, Ziegelverlust oder hohe Heizkosten? Erfahren Sie, welche 5 Warnsignale in ${city} auf eine nötige Dachsanierung hindeuten.`;
  const img = IMAGES['5-anzeichen-dachsanierung'];
  
  const body = `
<h2>Warum frühzeitig handeln?</h2>
<p>Das Dach ist die Krone des Hauses – und zugleich die am stärksten beanspruchte Fläche. In ${city} und dem Ruhrgebiet sind Dächer extremen Witterungsbedingungen ausgesetzt: Starkregen, Hagel, Stürme und große Temperaturschwankungen.</p>
<p>Die gute Nachricht: Eine rechtzeitige Sanierung ist deutlich günstiger als eine komplette Neudeckung. Und mit den aktuellen Förderprogrammen für energetische Sanierungen können Hausbesitzer in ${city} bis zu 15 Prozent der Kosten zurückbekommen.</p>

<h2>Die 5 Warnsignale im Detail</h2>
<ul>
<li><strong>Wasserflecken an der Decke:</strong> Der eindeutigste Hinweis. Feuchtigkeit an der Zimmerdecke oder an den Wänden unter dem Dach zeigt, dass Wasser eindringt.</li>
<li><strong>Lose oder fehlende Dachziegel:</strong> Nach Stürmen oder bei älteren Dächern können Ziegel abrutschen oder abbrechen.</li>
<li><strong>Anstieg der Heizkosten:</strong> Wenn die Heizkosten plötzlich steigen, kann eine mangelhafte Dachdämmung die Ursache sein.</li>
<li><strong>Altersbedingte Materialermüdung:</strong> Ein Dach über 30 Jahre alt sollte regelmäßig inspiziert werden.</li>
<li><strong>Schimmel im Dachgeschoss:</strong> Schimmel unter dem Dach ist ein Zeichen für mangelnde Belüftung oder eindringende Feuchtigkeit.</li>
</ul>

<h2>Was tun bei Verdacht auf Dachschäden?</h2>
<p>Wenn Sie eines oder mehrere dieser Anzeichen beobachten, sollten Sie umgehend handeln. Der erste Schritt ist eine professionelle Dachinspektion durch einen zertifizierten Dachdecker in ${city}.</p>
<p><a href="/${tSlug}/${cSlug}/blog/dachdaemmung-foerderung/">Weiterlesen: Dachdämmung fördern lassen</a></p>
`;

  const faqs = [
    {q:'Wie oft sollte ich mein Dach kontrollieren lassen?',a:'Idealerweise einmal jährlich – am besten im Frühling, nach der sturmbreiten Jahreszeit.'},
    {q:'Was kostet eine Dachinspektion?',a:'Viele Dachdeckerbetriebe bieten die Erstinspektion kostenlos an.'}
  ];
  
  return makeHTML(title, h1, meta, img, body, faqs, trade, city, cSlug, tSlug);
}

// HAUPTLOGIK
const BASE = '/root/.openclaw/workspace/fachschmiede/public/blog';
let count = 0;

for (const [tSlug, trade] of Object.entries(TRADES)) {
  for (const [cSlug, city] of Object.entries(CITIES)) {
    const dir = path.join(BASE, tSlug, cSlug);
    fs.mkdirSync(dir, {recursive: true});
    
    if (tSlug === 'dachdecker') {
      fs.writeFileSync(path.join(dir, 'dachdaemmung-foerderung.html'), generateDachdaemmung(trade, city, cSlug, tSlug));
      fs.writeFileSync(path.join(dir, 'sturmschaden-dach.html'), generateSturmschaden(trade, city, cSlug, tSlug));
      fs.writeFileSync(path.join(dir, '5-anzeichen-dachsanierung.html'), generateAnzeichen(trade, city, cSlug, tSlug));
      count += 3;
    } else {
      // Für andere Gewerke: Platzhalter mit Verweis auf Dachdecker-Templates
      fs.writeFileSync(path.join(dir, 'dachdaemmung-foerderung.html'), generateDachdaemmung(trade, city, cSlug, tSlug));
      count += 1;
    }
    process.stdout.write('.');
  }
}

console.log(`\n✅ ${count} Artikel generiert!`);
