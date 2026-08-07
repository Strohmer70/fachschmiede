const fs = require('fs');
const path = require('path');

// Templates
const ARTICLE_TEMPLATES = [
  {
    slug: 'dachdaemmung-foerderung',
    category: 'dachdecker',
    title_template: 'Dachdämmung in {stadt}: Zuschüsse & Förderung {jahr}',
    h1_template: 'Dachdämmung fördern lassen in {stadt}',
    meta_description_template: 'Wer in {stadt} seine Dachdämmung erneuern möchte, kann auf staatliche Förderung zugreifen. Erfahren Sie, welche Zuschüsse für {stadt} und das {bundesland} aktuell verfügbar sind.',
    excerpt_template: 'Zuschuss oder Kredit? Wer die Dämmung seines Dachs in {stadt} plant, sollte die aktuellen Fördermöglichkeiten prüfen.',
    content_template: `## Dachdämmung in {stadt}: Das sollten Sie wissen

Ein gut gedämmtes Dach ist die halbe Miete – besonders in {stadt}, wo die Wintertemperaturen regelmäßig unter den Gefrierpunkt fallen. Doch nicht nur der Komfort spielt eine Rolle: Mit einer modernen Dachdämmung sparen Hausbesitzer in {stadt} bis zu 30 Prozent Heizkosten ein.

### Fördermöglichkeiten für {stadt} im Überblick

Das {bundesland} bietet verschiedene Förderprogramme für energetische Sanierungen an. Besonders gefragt ist der **KfW-Effizienzhaus-Kredit**, der mit günstigen Zinsen lockt. Zusätzlich gibt es Zuschüsse über das BAFA für die Dämmung von Aufdach- und Zwischensparrendämmungen.

Für Eigentümer in {stadt} und der näheren Umgebung empfiehlt sich ein Beratungsgespräch mit einem {gewerk} vor Ort. Dieser kann eine detaillierte Energieberatung durchführen und die passenden Fördermittel beantragen.

### Wann lohnt sich eine Nachdämmung?

Wenn Ihr Dach älter als 20 Jahre ist oder Sie hohe Heizkosten haben, lohnt sich eine Prüfung. In {stadt} gibt es zahlreiche Fachbetriebe, die eine kostenlose Erstinspektion anbieten.

**Tipp:** Kombinieren Sie Dachdämmung und Dachfenster-Austausch – so erreichen Sie den besten Effizienzwert und maximale Förderung.`,
  },
  {
    slug: 'e-check-sicherheit',
    category: 'elektriker',
    title_template: 'E-Check in {stadt}: Wann ist die Prüfung Pflicht?',
    h1_template: 'Elektrische Sicherheitsprüfung in {stadt}',
    meta_description_template: 'Der E-Check schützt vor Stromunfällen und Brandschäden. Erfahren Sie, wann eine Prüfung in {stadt} Pflicht ist und was sie kostet.',
    excerpt_template: 'Stromunfälle vermeiden: Der E-Check ist für Gewerbe in {stadt} Pflicht und für Privathaushalte empfohlen.',
    content_template: `## E-Check in {stadt}: Sicherheit durch Fachkraft

Elektrische Anlagen altern – und damit steigt das Risiko von Kurzschlüssen und Brandgefahren. Der E-Check, auch als elektrische Sicherheitsprüfung bekannt, ist für Gewerbebetriebe in {stadt} gesetzlich vorgeschrieben.

### Was wird geprüft?

Bei einer E-Check-Prüfung in {stadt} werden Verteiler, Leitungen, Schutzschalter und Verbrauchsstellen auf Schäden und normgerechten Zustand überprüft. Besonders wichtig: Die Prüfung darf nur von einem zertifizierten {gewerk} durchgeführt werden.

### Häufige Mängel in {stadt}

In älteren Gebäuden in {stadt} finden Prüfer oft veraltete Sicherungsautomaten, nicht mehr normgerechte Steckdosen in Feuchträumen oder überlastete Leitungen. Diese Mängel werden dokumentiert und müssen beseitigt werden.

### Kosten und Intervalle

Für ein Einfamilienhaus in {stadt} liegen die Kosten für einen E-Check zwischen 150 und 300 Euro. Gewerbebetriebe sollten alle 1-4 Jahre prüfen lassen – je nach Branche und Versicherungsanforderungen.`,
  },
  {
    slug: 'heizungstausch-foerderung',
    category: 'shk',
    title_template: 'Heizungstausch in {stadt}: Förderung & Kosten {jahr}',
    h1_template: 'Heizung erneuern in {stadt}: Diese Förderung gibt es',
    meta_description_template: 'Der Heizungstausch wird in {stadt} mit bis zu 70% gefördert. Erfahren Sie mehr über BEG-Förderung, Kosten und die besten Heizungssysteme für Ihr Gebäude.',
    excerpt_template: 'Bis zu 70% Förderung beim Heizungstausch: Was Eigentümer in {stadt} über die BEG wissen müssen.',
    content_template: `## Heizungstausch in {stadt}: Zeit für effiziente Wärme

Die Energiepreise steigen, und alte Heizungen werden ineffizient. Wer in {stadt} seine Heizung erneuern möchte, kann aktuell auf attraktive Förderungen zugreifen.

### BEG-Förderung für {stadt}

Die Bundesförderung für effiziente Gebäude (BEG) unterstützt Eigentümer in {stadt} beim Austausch ihrer alten Heizung. Je nachdem, welches neue System installiert wird, gibt es Zuschüsse zwischen 30 und 70 Prozent der Investitionskosten.

### Welche Heizung passt zu meinem Haus?

In {stadt} und dem {bundesland} sind Wärmepumpen besonders beliebt, da sie effizient auch bei moderaten Außentemperaturen arbeiten. Für Bestandsgebäude mit höherem Wärmebedarf können Hybridheizungen eine gute Zwischenlösung sein.

### Ablauf: Vom Check zur neuen Heizung

1. Energieberatung vor Ort in {stadt}
2. Förderfähigkeit prüfen und Antrag stellen
3. Angebote von {gewerk} einholen
4. Förderzusage abwarten
5. Installation durchführen lassen

**Wichtig:** Die Förderung muss VOR Beginn der Arbeiten beantragt werden.`,
  },
];

function fillTemplate(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return result;
}

function formatContent(content) {
  return content
    .replace(/## (.*)/g, '<h2 class="text-2xl font-bold text-ink-900 mt-10 mb-4">$1</h2>')
    .replace(/### (.*)/g, '<h3 class="text-xl font-bold text-ink-900 mt-8 mb-3">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/^(.*)$/gm, (match) => {
      if (match.startsWith('<')) return match;
      return `<p class="mb-4">${match}</p>`;
    });
}

function generateHTML(article, trade, city, tradeSlug, citySlug) {
  const accentColor = tradeSlug === 'dachdecker' ? 'orange' :
                      tradeSlug === 'elektriker' ? 'blue' :
                      tradeSlug === 'shk' ? 'teal' :
                      tradeSlug === 'maler' ? 'rose' :
                      tradeSlug === 'zimmerer' ? 'amber' : 'indigo';
  
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${article.title}</title>
<meta name="description" content="${article.meta_description}">
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
  theme: { extend: {
    colors: {
      accent: {50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#f97316',600:'#ea580c',700:'#c2410c',800:'#9a3412',900:'#7c2d12'},
      ink: {50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a'}
    }
  }}
}
</script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>body{font-family:'Inter',system-ui,sans-serif}</style>
</head>
<body class="bg-white text-ink-800 antialiased">

<header class="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-ink-100 shadow-sm">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
    <a href="/${tradeSlug}/${citySlug}/" class="flex items-center gap-3">
      <span class="w-10 h-10 rounded-lg bg-accent-600 flex items-center justify-center text-white font-black text-lg">M</span>
      <span class="leading-tight">
        <span class="block font-extrabold text-lg text-ink-900">${trade.name} ${city.name}</span>
        <span class="block text-xs text-ink-500 font-medium">${city.state}</span>
      </span>
    </a>
  </div>
</header>

<article class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
  <nav class="text-sm text-ink-500 mb-8">
    <a href="/${tradeSlug}/${citySlug}/" class="hover:text-accent-600 transition">${trade.name} ${city.name}</a>
    <span class="mx-2">/</span>
    <span class="text-ink-700">Ratgeber</span>
  </nav>
  
  <h1 class="text-3xl sm:text-4xl font-black text-ink-900 leading-tight mb-4">${article.h1}</h1>
  
  <p class="text-lg text-ink-500 mb-8 border-l-4 border-accent-500 pl-4">${article.excerpt}</p>
  
  <div class="prose prose-lg max-w-none text-ink-700 leading-relaxed">
    ${formatContent(article.content)}
  </div>
  
  <div class="mt-12 p-6 bg-accent-50 rounded-2xl border border-accent-200">
    <h3 class="text-xl font-bold text-ink-900 mb-2">Benötigen Sie einen ${trade.name} in ${city.name}?</h3>
    <p class="text-ink-600 mb-4">Wir vermitteln Sie an erfahrene Fachbetriebe in ${city.name} und Umgebung.</p>
    <a href="/${tradeSlug}/${citySlug}/#kontakt" class="inline-flex items-center bg-accent-600 hover:bg-accent-700 text-white font-bold px-6 py-3 rounded-xl transition">Kontakt aufnehmen</a>
  </div>
</article>

<footer class="bg-ink-900 text-ink-400 py-8 px-4 text-center text-sm">
  <p>© ${new Date().getFullYear()} fachschmiede.de — Alle Rechte vorbehalten.</p>
</footer>

</body>
</html>`;
}

// Hauptfunktion
async function main() {
  const args = process.argv.slice(2);
  const targetTrade = args[0] || 'all';
  const targetCity = args[1] || 'all';
  const articleCount = parseInt(args[2]) || 3;
  
  const TRADES = {
    dachdecker: { name: 'Dachdecker', plural: 'Dachdecker' },
    elektriker: { name: 'Elektriker', plural: 'Elektriker' },
    shk: { name: 'Klempner', plural: 'Klempner' },
    maler: { name: 'Maler', plural: 'Maler' },
    zimmerer: { name: 'Zimmerer', plural: 'Zimmerer' },
  };
  
  const CITIES = {
    'bergkamen': { name: 'Bergkamen', state: 'Nordrhein-Westfalen' },
    'bochum': { name: 'Bochum', state: 'Nordrhein-Westfalen' },
    'castrop-rauxel': { name: 'Castrop-Rauxel', state: 'Nordrhein-Westfalen' },
    'dortmund': { name: 'Dortmund', state: 'Nordrhein-Westfalen' },
    'ennepetal': { name: 'Ennepetal', state: 'Nordrhein-Westfalen' },
    'froendenberg': { name: 'Fröndenberg', state: 'Nordrhein-Westfalen' },
    'gevelsberg': { name: 'Gevelsberg', state: 'Nordrhein-Westfalen' },
    'hagen': { name: 'Hagen', state: 'Nordrhein-Westfalen' },
    'hattingen': { name: 'Hattingen', state: 'Nordrhein-Westfalen' },
    'herne': { name: 'Herne', state: 'Nordrhein-Westfalen' },
    'holzwickede': { name: 'Holzwickede', state: 'Nordrhein-Westfalen' },
    'iserlohn': { name: 'Iserlohn', state: 'Nordrhein-Westfalen' },
    'kamen': { name: 'Kamen', state: 'Nordrhein-Westfalen' },
    'luenen': { name: 'Lünen', state: 'Nordrhein-Westfalen' },
    'schwelm': { name: 'Schwelm', state: 'Nordrhein-Westfalen' },
    'schwerte': { name: 'Schwerte', state: 'Nordrhein-Westfalen' },
    'sprockhoevel': { name: 'Sprockhövel', state: 'Nordrhein-Westfalen' },
    'unna': { name: 'Unna', state: 'Nordrhein-Westfalen' },
    'wetter-ruhr': { name: 'Wetter (Ruhr)', state: 'Nordrhein-Westfalen' },
    'witten': { name: 'Witten', state: 'Nordrhein-Westfalen' },
  };
  
  const publicDir = path.join(__dirname, '..', 'public');
  let totalGenerated = 0;
  
  const tradesToProcess = targetTrade === 'all' ? Object.keys(TRADES) : [targetTrade];
  const citiesToProcess = targetCity === 'all' ? Object.keys(CITIES) : [targetCity];
  
  for (const tradeSlug of tradesToProcess) {
    const trade = TRADES[tradeSlug];
    if (!trade) continue;
    
    for (const citySlug of citiesToProcess) {
      const city = CITIES[citySlug];
      if (!city) continue;
      
      // Erstelle Verzeichnis
      const blogDir = path.join(publicDir, 'blog', tradeSlug, citySlug);
      fs.mkdirSync(blogDir, { recursive: true });
      
      // Generiere Artikel
      for (let i = 0; i < articleCount; i++) {
        const template = ARTICLE_TEMPLATES[i % ARTICLE_TEMPLATES.length];
        
        const variables = {
          stadt: city.name,
          gewerk: trade.name,
          bundesland: city.state,
          jahr: new Date().getFullYear().toString(),
        };
        
        const article = {
          title: fillTemplate(template.title_template, variables),
          h1: fillTemplate(template.h1_template || template.title_template, variables),
          meta_description: fillTemplate(template.meta_description_template, variables),
          content: fillTemplate(template.content_template, variables),
          excerpt: fillTemplate(template.excerpt_template, variables),
        };
        
        const html = generateHTML(article, trade, city, tradeSlug, citySlug);
        const filePath = path.join(blogDir, `${template.slug}.html`);
        fs.writeFileSync(filePath, html);
        
        console.log(`✅ ${tradeSlug}/${citySlug}/${template.slug}.html`);
        totalGenerated++;
      }
    }
  }
  
  console.log(`\n🎉 Fertig! ${totalGenerated} Artikel generiert.`);
}

main().catch(err => {
  console.error('❌ Fehler:', err);
  process.exit(1);
});
