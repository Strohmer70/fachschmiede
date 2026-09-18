#!/usr/bin/env node
/**
 * BATCH-FIX 3: Unique Content Upgrade für alle 120 Landing Pages
 * Fügt je Gewerk+Stadt einen einzigartigen Intro-Text, FAQ-Section und
 * Stadtspezifische Details hinzu — gegen Thin/Duplicate Content.
 */

const fs = require('fs');
const path = require('path');
const {
  getAllCombinations,
  getTrade,
  getCity,
} = require('../config/system-config.js');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
let updated = 0;
let skipped = 0;

const DIR_MAP = {
  'garten-und-landschaftsbau': 'gartenbau',
};

// ─── Unique City Facts ───
const CITY_FACTS = {
  'bochum': { population: '364.000', character: 'das pulsierende Herz des Ruhrgebiets', landmark: 'das Deutsche Bergbau-Museum', district: 'das Bermuda3Eck' },
  'dortmund': { population: '587.000', character: 'die größte Stadt Westfalens', landmark: 'der Signal Iduna Park', district: 'die Dortmunder Innenstadt' },
  'hagen': { population: '189.000', character: 'die Stadt auf vier Hügeln', landmark: 'das Osthaus Museum', district: 'die Hagener Innenstadt' },
  'herne': { population: '156.000', character: 'eine Stadt mit Herz im Ruhrgebiet', landmark: 'der Schloss Strünkede', district: 'die Herner Innenstadt' },
  'witten': { population: '96.000', character: 'die Edelstahlstadt an der Ruhr', landmark: 'das Märkische Museum', district: 'die Witten-Mitte' },
  'iserlohn': { population: '92.000', character: 'die grüne Stadt am Ardeygebirge', landmark: 'die Dechenhöhle', district: 'die Iserlohner Altstadt' },
  'unna': { population: '59.000', character: 'die Torstadt zur Soester Börde', landmark: 'die Unnaer Stadtmauer', district: 'die Unnaer Innenstadt' },
  'schwerte': { population: '46.000', character: 'die Stadt an der Ruhr und dem Hengsteysee', landmark: 'der Hengsteysee', district: 'die Schwerte-Mitte' },
  'kamen': { population: '42.000', character: 'die Kurstadt am Kamener Kreuz', landmark: 'das Rathaus Kamen', district: 'die Kamener Mitte' },
  'luenen': { population: '86.000', character: 'die Lippestadt mit Hafenflair', landmark: 'der Preußenhafen Lünen', district: 'die Lüner Altstadt' },
  'bergkamen': { population: '48.000', character: 'die jüngste Stadt Westfalens', landmark: 'das Heinrich-Böll-Haus', district: 'das Gewerbegebiet Rünthe' },
  'castrop-rauxel': { population: '34.000', character: 'die Stadt am Emscher-Genesungsraum', landmark: 'das Haus Goldschmieding', district: 'das Europaviertel' },
  'wetter-ruhr': { population: '27.000', character: 'die Stadt an der Ruhr mit Altstadt-Charme', landmark: 'Schloss Wetter', district: 'die Wetterer Altstadt' },
  'schwelm': { population: '28.000', character: 'das Tor zum Bergischen Land', landmark: 'die evangelische Stadtkirche', district: 'das Haus Martfeld' },
  'enneetal': { population: '30.000', character: 'die Stadt in schöner Talbildung', landmark: 'das Haus Berge', district: 'der Enneper Strand' },
  'gevelsberg': { population: '31.000', character: 'die Stadt der 120 Lindentunnel', landmark: 'das Kulturhaus', district: 'die Gevelsberger Altstadt' },
  'hattingen': { population: '54.000', character: 'die historische Altstadt an der Ruhr', landmark: 'die Burg Blankenstein', district: 'die mittelalterliche Altstadt' },
  'holzwickede': { population: '17.000', character: 'die dörfliche Gemeinde am Dortmund-Ems-Kanal', landmark: 'die St. Laurentius-Kirche', district: 'das Holzwickeder Zentrum' },
  'sprockhoevel': { population: '24.000', character: 'die Stadt auf den Hügeln', landmark: 'das Haus Nottbeck', district: 'das Sprockhöveler Zentrum' },
  'froendenberg': { population: '20.000', character: 'die Ruhrstadt mit Rittertradition', landmark: 'das Kloster Fröndenberg', district: 'die Fröndenberger Altstadt' },
};

// ─── Trade-Specific Unique Intros ───
function generateIntro(trade, city, cityFact) {
  const t = trade.name.toLowerCase();
  const c = city.name;
  const p = cityFact.population;
  const ch = cityFact.character;
  const lm = cityFact.landmark;
  const ds = cityFact.district;
  
  const intros = {
    dachdecker: `${c} mit seinen ${p} Einwohnern und ${ch} hat einen besonderen Bedarf an qualifizierten Dachdecker-Leistungen. Die Mischung aus historischen Gebäuden in ${ds} und modernen Neubaugebieten erfordert Fachwissen in allen Bereichen der Dacharbeit. Ob traditionelle Schieferdeckung bei Altbauten nahe ${lm} oder energieeffiziente Dachsanierung in den Neubaugebieten — die Ansprüche an ein Dach sind vielfältig.`,
    elektriker: `Als ${ch} ist ${c} ein Standort, der Elektriker mit vielfältigen Aufgabenstellungen konfrontiert. Von der Elektroinstallation in den Wohngebieten bis zur E-Mobilität-Infrastruktur in ${ds} — die ${p} Einwohner von ${c} brauchen zuverlässige Elektrofachkräfte. Besonders die wachsende Bedeutung von Smart-Home-Technologien und Wallbox-Installationen in der Region um ${lm} macht qualifizierte Elektriker unverzichtbar.`,
    klempner: `Die ${p} Menschen in ${c} wissen: Ein zuverlässiger Klempner ist Gold wert. Ob Heizungsmodernisierung in den Altbauten nahe ${lm} oder Badsanierung in den Neubaugebieten — ${ch} bietet vielfältige Projekte für SHK-Fachkräfte. Die Region um ${ds} hat besonderen Bedarf an modernen Heizungssystemen und barrierefreien Bädern.`,
    zimmerer: `${c} mit ${ch} hat eine reiche bauliche Tradition, die geschickte Zimmerer verlangt. Von der historischen Fachwerksanierung in ${ds} bis zum modernen Holzbau in den Neubaugebieten — die Zimmerer-Handwerkskunst ist hier gefragt wie nie. Die Nähe zu ${lm} und die ${p} Einwohner schaffen ein stetiges Auftragsvolumen für qualifizierte Holzbauer.`,
    maler: `In ${c} mit seinen ${p} Einwohnern und ${ch} ist der Malerberuf mehr als nur Farbe auftragen. Die Mischung aus historischem Baubestand in ${ds} und modernen Wohnbauten erfordert Fachwissen in Fassadensanierung, Innenraumgestaltung und Denkmalpflege. Die kulturelle Vielfalt rund um ${lm} spiegelt sich auch in den Ansprüchen der Auftraggeber wider.`,
    gartenbau: `${c} mit ${ch} und ${p} Einwohnern bietet ideale Voraussetzungen für professionelle Garten- und Landschaftsbau-Arbeiten. Ob Pflege historischer Grünanlagen nahe ${lm} oder Neuanlagen in den Wohngebieten um ${ds} — die Menschen hier legen Wert auf gepflegte Außenanlagen und nachhaltige Gartengestaltung.`,
  };
  
  return intros[trade.slug] || intros.dachdecker;
}

// ─── Trade-Specific FAQs ───
function generateFAQs(trade, city) {
  const c = city.name;
  const t = trade.name;
  
  const faqs = {
    dachdecker: [
      { q: `Was kostet eine Dachsanierung in ${c}?`, a: `Die Kosten hängen von Dachfläche, Material und Umfang ab. Eine Dachsanierung in ${c} beginnt bei ca. 80–150 €/m². Wir erstellen gerne ein kostenloses Angebot nach Besichtigung.` },
      { q: `Wann brauche ich einen Dachdecker in ${c}?`, a: `Bei Undichtigkeiten, Sturmschäden, losem Dachmaterial oder wenn Ihr Dach über 20 Jahre alt ist. Ein Dachdecker in ${c} prüft Ihr Dach auf Schäden und empfiehlt die beste Lösung.` },
      { q: `Gibt es Förderungen für Dacharbeiten in ${c}?`, a: `Ja, für Dachdämmung und energetische Sanierung gibt es KfW-Förderungen und BAFA-Zuschüsse. Wir beraten Sie gerne zu aktuellen Förderprogrammen in ${c}.` },
    ],
    elektriker: [
      { q: `Was kostet eine Elektroinstallation in ${c}?`, a: `Kosten hängen vom Umfang ab. Eine Neuinstallation in einer Wohnung in ${c} beginnt bei ca. 2.000–5.000 €. Wir erstellen ein transparentes Festpreisangebot.` },
      { q: `Brauche ich einen E-Check in ${c}?`, a: `Der E-Check ist für Gewerbe in ${c} Pflicht, für Privathaushalte empfohlen. Er prüft die elektrische Sicherheit und verhindert Brände durch Defekte.` },
      { q: `Kann ich eine Wallbox in ${c} installieren lassen?`, a: `Ja! Wir installieren Wallboxen für E-Autos in ${c} — inkl. Anmeldung beim Netzbetreiber und Förderberatung.` },
    ],
    klempner: [
      { q: `Was kostet eine Badsanierung in ${c}?`, a: `Eine Badsanierung in ${c} beginnt bei ca. 5.000 € für ein einfaches Bad. Premium-Bäder mit bodengleicher Dusche kosten 15.000–25.000 €. Wir erstellen ein detailliertes Angebot.` },
      { q: `Wann sollte ich die Heizung in ${c} tauschen?`, a: `Wenn Ihre Heizung älter als 15 Jahre ist oder hohe Reparaturkosten verursacht. Mit der Heizungsförderung 2026 können Sie bis zu 70 % der Kosten sparen.` },
      { q: `Hilft ein Klempner bei Rohrbruch in ${c}?`, a: `Ja! Bei Rohrbruch in ${c} sind wir schnell vor Ort. Wir orten das Leck, reparieren es und dokumentieren für die Versicherung.` },
    ],
    zimmerer: [
      { q: `Was kostet ein Carport in ${c}?`, a: `Ein hochwertiger Holz-Carport in ${c} beginnt bei ca. 3.000–8.000 €. Wir beraten Sie gerne und erstellen ein individuelles Angebot.` },
      { q: `Sanierung oder Neubau — was lohnt sich in ${c}?`, a: `Das hängt vom Zustand ab. Wir begutachten Ihr Gebäude in ${c} und beraten ehrlich, ob Sanierung oder Neubau wirtschaftlicher ist.` },
      { q: `Bauen Sie auch mit nachhaltigem Holz in ${c}?`, a: `Ja! Wir arbeiten mit zertifiziertem Holz aus nachhaltiger Forstwirtschaft. Holzbau ist klimafreundlich und ideal für ${c}.` },
    ],
    maler: [
      { q: `Was kostet das Streichen einer Wohnung in ${c}?`, a: `Das Streichen einer 3-Zimmer-Wohnung in ${c} beginnt bei ca. 1.500–3.000 € inkl. Material. Wir erstellen ein transparentes Angebot nach Besichtigung.` },
      { q: `Fassadenanstrich in ${c} — wie oft nötig?`, a: `Eine Fassade in ${c} sollte alle 10–15 Jahre gestrichen werden. Bei Rissen oder Ausblühungen sollten Sie früher handeln.` },
      { q: `Welche Farben sind für ${c} empfohlen?`, a: `Das hängt vom Baustil und Ihrem Geschmack ab. Wir beraten Sie gerne zu Farbtrends und nachhaltigen Farben für Ihr Projekt in ${c}.` },
    ],
    gartenbau: [
      { q: `Was kostet eine Gartengestaltung in ${c}?`, a: `Die Kosten hängen von Größe und Umfang ab. Ein Neugarten in ${c} beginnt bei ca. 50–150 €/m². Wir erstellen ein kostenloses Konzept.` },
      { q: `Pflasterarbeiten in ${c} — was ist möglich?`, a: `Wir verlegen Terrassen, Wege, Einfahrten und Mauern in ${c} — mit Naturstein, Beton oder Klinker. Alles aus einer Hand.` },
      { q: `Pflege Sie auch bestehende Gärten in ${c}?`, a: `Ja! Wir übernehmen regelmäßige Gartenpflege in ${c} — Rasen, Hecken, Beete und Bewässerung.` },
    ],
  };
  
  return faqs[trade.slug] || faqs.dachdecker;
}

function upgradePage(tradeSlug, citySlug) {
  const dir = DIR_MAP[tradeSlug] || tradeSlug;
  const trade = getTrade(tradeSlug);
  const city = getCity(citySlug);
  const filePath = path.join(PUBLIC_DIR, dir, `${citySlug}.html`);
  
  if (!fs.existsSync(filePath)) { skipped++; return; }
  
  let html = fs.readFileSync(filePath, 'utf-8');
  
  if (html.includes('id="faq"')) {
    console.log(`  ⏭️  ${dir}/${citySlug} — already has FAQ`);
    skipped++;
    return;
  }
  
  const cityFact = CITY_FACTS[citySlug] || {
    population: '50.000',
    character: 'eine Stadt im Ruhrgebiet',
    landmark: 'das Stadtzentrum',
    district: 'die Innenstadt',
  };
  
  const tradeName = trade.name;
  const cityName = city.name;
  const color700 = trade.color?.[700] || '#1d4ed8';
  const color600 = trade.color?.[600] || '#2563eb';
  const color50 = trade.color?.[50] || '#eff6ff';
  
  // 1. Insert unique intro paragraph after the services grid
  const introText = generateIntro(trade, city, cityFact);
  const introHTML = `
<!-- ═══════════ UNIQUE CITY INTRO ═══════════ -->
<section style="padding:50px 0;background:white;">
<div class="container" style="max-width:800px;">
<h2 style="font-size:1.6rem;font-weight:800;margin-bottom:20px;color:#1e293b;">${tradeName} in ${cityName}: Ihr lokaler Fachbetrieb</h2>
<p style="color:#475569;line-height:1.9;font-size:1.05rem;margin-bottom:16px;">${introText}</p>
<p style="color:#475569;line-height:1.9;font-size:1.05rem;">Unser Netzwerk an ${tradeName.toLowerCase()}-Fachbetrieben in ${cityName} deckt alle Leistungen ab — von der Beratung über die Planung bis zur sauberen Ausführung. Jeder Betrieb in unserem Verzeichnis ist geprüft und verfügt über jahrelange Erfahrung in ${cityName} und Umgebung.</p>
</div>
</section>`;
  
  // Insert before the "Jetzt mieten" banner or before kontakt
  if (html.includes('JETZT MIETEN BANNER')) {
    html = html.replace('<!-- ═══════════ JETZT MIETEN BANNER ═══════════ -->', `${introHTML}\n\n<!-- ═══════════ JETZT MIETEN BANNER ═══════════ -->`);
  } else if (html.includes('<section id="kontakt"')) {
    html = html.replace('<section id="kontakt"', `${introHTML}\n\n<section id="kontakt"`);
  }
  
  // 2. Insert FAQ section before the footer
  const faqs = generateFAQs(trade, city);
  const faqHTML = `
<!-- ═══════════ FAQ ═══════════ -->
<section id="faq" style="padding:60px 0;background:${color50};">
<div class="container" style="max-width:700px;">
<h2 style="font-size:1.8rem;font-weight:800;margin-bottom:30px;text-align:center;color:#1e293b;">Häufige Fragen zu ${tradeName} in ${cityName}</h2>
${faqs.map(f => `
<div style="background:white;border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid #e2e8f0;">
<h3 style="font-size:1.05rem;font-weight:700;margin-bottom:10px;color:${color700};">${f.q}</h3>
<p style="color:#64748b;font-size:0.95rem;line-height:1.7;">${f.a}</p>
</div>`).join('\n')}
</div>
</section>`;
  
  html = html.replace(/<footer/, `${faqHTML}\n\n<footer`);
  
  fs.writeFileSync(filePath, html, 'utf-8');
  updated++;
  console.log(`  ✅ ${dir}/${citySlug} — Intro + FAQ (${introText.length} chars)`);
}

console.log('🔧 Batch-Fix 3: Content Upgrade (Unique Intro + FAQ)\n');
const combinations = getAllCombinations();
for (const { tradeSlug, citySlug } of combinations) {
  upgradePage(tradeSlug, citySlug);
}

console.log(`\n✅ Updated: ${updated} | ⏭️ Skipped: ${skipped}`);
