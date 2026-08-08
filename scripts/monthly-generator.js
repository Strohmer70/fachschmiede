#!/usr/bin/env node
/**
 * Monatlicher Artikel-Generator für fachschmiede.de
 * 
 * Liest Supabase-Tabelle `tenants`, generiert basierend auf Mietplan:
 * - Freie Stadt: 1 Artikel/Monat
 * - Basic: 2 Artikel/Monat
 * - Pro: 4 Artikel/Monat
 * 
 * Jeder Artikel folgt SEO-RICHTLINIE.md (1.000-1.500 Wörter, FAQ, HowTo, Bilder, Links)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ─── KONFIGURATION ──────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const CITIES = [
  'bergkamen', 'bochum', 'castrop-rauxel', 'dortmund', 'ennepetal',
  'froendenberg', 'gevelsberg', 'hagen', 'hattingen', 'herne',
  'holzwickede', 'iserlohn', 'kamen', 'luenen', 'schwelm',
  'schwerte', 'sprockhoevel', 'unna', 'wetter-ruhr', 'witten'
];

const TRADES = {
  dachdecker: {
    name: 'Dachdecker',
    topics: [
      { slug: 'dachdaemmung-kosten', title: 'Dachdämmung Kosten', keyword: 'roof insulation' },
      { slug: 'sturmschaden-reparatur', title: 'Sturmschaden Reparatur', keyword: 'storm damage roof' },
      { slug: 'dachsanierung-planen', title: 'Dachsanierung planen', keyword: 'roof renovation' },
      { slug: 'dachziegel-arten', title: 'Dachziegel Arten', keyword: 'roof tiles' },
      { slug: 'dachfenster-einbauen', title: 'Dachfenster einbauen', keyword: 'skylight installation' },
      { slug: 'flachdach-abdichten', title: 'Flachdach abdichten', keyword: 'flat roof sealing' },
      { slug: 'dachrinne-reinigen', title: 'Dachrinne reinigen', keyword: 'gutter cleaning' },
      { slug: 'schornstein-sanieren', title: 'Schornstein sanieren', keyword: 'chimney repair' },
      { slug: 'dachboden-ausbauen', title: 'Dachboden ausbauen', keyword: 'attic conversion' },
      { slug: 'dach-haltbarkeit', title: 'Dach Haltbarkeit', keyword: 'roof lifespan' },
      { slug: 'gruendach-anlegen', title: 'Gründach anlegen', keyword: 'green roof' },
      { slug: 'dachholz-schutz', title: 'Dachholz Schutz', keyword: 'roof wood protection' },
    ]
  },
  elektriker: {
    name: 'Elektriker',
    topics: [
      { slug: 'e-check-2026', title: 'E-Check 2026', keyword: 'electrical inspection' },
      { slug: 'led-beleuchtung', title: 'LED Beleuchtung', keyword: 'LED lighting' },
      { slug: 'sicherungskasten-erneuern', title: 'Sicherungskasten erneuern', keyword: 'fuse box upgrade' },
      { slug: 'elektroheizung-effizienz', title: 'Elektroheizung Effizienz', keyword: 'electric heating' },
      { slug: 'photovoltaik-anschluss', title: 'Photovoltaik Anschluss', keyword: 'solar panel installation' },
      { slug: 'stromausfall-ursachen', title: 'Stromausfall Ursachen', keyword: 'power outage' },
      { slug: 'erdung-pruefen', title: 'Erdung prüfen', keyword: 'grounding test' },
      { slug: 'kuechenelektro-planen', title: 'Küchenelektro planen', keyword: 'kitchen electrical' },
      { slug: 'badezimmer-elektro', title: 'Badezimmer Elektro', keyword: 'bathroom electrical' },
      { slug: 'smart-meter-vorteile', title: 'Smart Meter Vorteile', keyword: 'smart meter' },
      { slug: 'blitzschutz-nachruesten', title: 'Blitzschutz nachrüsten', keyword: 'lightning protection' },
      { slug: 'stromkosten-senken', title: 'Stromkosten senken', keyword: 'reduce electricity costs' },
    ]
  },
  klempner: {
    name: 'Klempner',
    topics: [
      { slug: 'wasserdruck-optimieren', title: 'Wasserdruck optimieren', keyword: 'water pressure' },
      { slug: 'abfluss-verstopft', title: 'Abfluss verstopft', keyword: 'clogged drain' },
      { slug: 'warmwasserspeicher-tauschen', title: 'Warmwasserspeicher tauschen', keyword: 'water heater replacement' },
      { slug: 'fußbodenheizung-wartung', title: 'Fußbodenheizung Wartung', keyword: 'underfloor heating' },
      { slug: 'gasleitung-pruefen', title: 'Gasleitung prüfen', keyword: 'gas line inspection' },
      { slug: 'wasserenthärtung-anlagen', title: 'Wasserenthärtung Anlagen', keyword: 'water softener' },
      { slug: 'heizkoerper-entlueften', title: 'Heizkörper entlüften', keyword: 'radiator bleeding' },
      { slug: 'trinkwasserqualitaet', title: 'Trinkwasserqualität', keyword: 'drinking water quality' },
      { slug: 'sanitaer-notdienst', title: 'Sanitär Notdienst', keyword: 'plumbing emergency' },
      { slug: 'badrenovierung-planen', title: 'Badrenovierung planen', keyword: 'bathroom renovation' },
      { slug: 'armaturen-wechseln', title: 'Armaturen wechseln', keyword: 'faucet replacement' },
      { slug: 'wasserschaden-sanierung', title: 'Wasserschaden Sanierung', keyword: 'water damage restoration' },
    ]
  },
  maler: {
    name: 'Maler',
    topics: [
      { slug: 'tapezierarbeiten-kosten', title: 'Tapezierarbeiten Kosten', keyword: 'wallpaper installation' },
      { slug: 'spachteln-und-streichen', title: 'Spachteln und streichen', keyword: 'plastering painting' },
      { slug: 'fassadensanierung-2026', title: 'Fassadensanierung 2026', keyword: 'facade renovation' },
      { slug: 'decken-verkleiden', title: 'Decken verkleiden', keyword: 'ceiling cladding' },
      { slug: 'lasuren-holzschutz', title: 'Lasuren Holzschutz', keyword: 'wood stain protection' },
      { slug: 'schoener-wohnen-farben', title: 'Schöner Wohnen Farben', keyword: 'interior paint colors' },
      { slug: 'anstrich-daemmschicht', title: 'Anstrich Dämmschicht', keyword: 'insulating paint' },
      { slug: 'malerkosten-pro-qm', title: 'Malerkosten pro m²', keyword: 'painter cost per sqm' },
      { slug: 'tapeten-trends', title: 'Tapeten Trends', keyword: 'wallpaper trends' },
      { slug: 'besenstrich-technik', title: 'Besenstrich Technik', keyword: 'paint technique' },
      { slug: 'keller-anstreichen', title: 'Keller anstreichen', keyword: 'basement painting' },
      { slug: 'lackierarbeiten-moebel', title: 'Lackierarbeiten Möbel', keyword: 'furniture painting' },
    ]
  },
  zimmerer: {
    name: 'Zimmerer',
    topics: [
      { slug: 'holzschutz-terrassen', title: 'Holzschutz Terrassen', keyword: 'wood deck protection' },
      { slug: 'carport-planung', title: 'Carport Planung', keyword: 'carport planning' },
      { slug: 'gauben-ausbauen', title: 'Gauben ausbauen', keyword: 'dormer construction' },
      { slug: 'holzrahmenbau-haus', title: 'Holzrahmenbau Haus', keyword: 'timber frame house' },
      { slug: 'carport-dach-arten', title: 'Carport Dach Arten', keyword: 'carport roof types' },
      { slug: 'holzterrasse-verlegen', title: 'Holzterrasse verlegen', keyword: 'wood deck installation' },
      { slug: 'zimmerei-traditionell', title: 'Zimmerei traditionell', keyword: 'traditional carpentry' },
      { slug: 'holzschutz-mittel', title: 'Holzschutz Mittel', keyword: 'wood preservative' },
      { slug: 'dachstuhl-reparatur', title: 'Dachstuhl Reparatur', keyword: 'roof truss repair' },
      { slug: 'wintergarten-holz', title: 'Wintergarten Holz', keyword: 'wooden conservatory' },
      { slug: 'holzcarport-vs-metall', title: 'Holzcarport vs Metall', keyword: 'wood vs metal carport' },
      { slug: 'zimmermann-kosten', title: 'Zimmermann Kosten', keyword: 'carpenter costs' },
    ]
  }
};

// ─── SUPABASE CLIENT ────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── HILFSFUNKTIONEN ────────────────────────────────────────────────

function getMonthSlug() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getArticleCountByPlan(plan) {
  switch (plan?.toLowerCase()) {
    case 'pro': return 4;
    case 'basic': return 2;
    default: return 1; // Freie Stadt
  }
}

function generateUnsplashUrl(topic, width = 1200) {
  // Themenspezifische deutsche Unsplash-Suchbegriffe
  const topicImages = {
    'heizungs-check-winter': 'heizung,wartung,techniker',
    'heizkoerper-entlueften': 'heizkoerper,heizung,warm',
    'rohrbruch-sofortmassnahmen': 'wasserrohr,leckage,wasser',
    'schimmel-wohnung': 'schimmel,feuchtigkeit,wand',
    'wasserdruck-optimieren': 'wasserhahn,druck,armatur',
    'abfluss-verstopft': 'abfluss,verstopfung,rohr',
    'warmwasserspeicher-tauschen': 'boiler,warmwasser,heizung',
    'fussbodenheizung-wartung': 'fussbodenheizung,boden,warm',
    'gasleitung-pruefen': 'gas,leitung,pruefung',
    'wasserenthaertung-anlagen': 'wasser,filter,anlage',
    'trinkwasserqualitaet': 'wasserhahn,trinkwasser,glas',
    'sanitaer-notdienst': 'notdienst,werkzeug,plumber',
    'badrenovierung-planen': 'bad,badezimmer,renovierung',
    'armaturen-wechseln': 'armatur,wasserhahn,messing',
    'wasserschaden-sanierung': 'wasserschaden,trocknung,bauseite',
    'dachdaemmung-kosten': 'dach,daemmung,dachdecker',
    'sturmschaden-reparatur': 'dach,sturm,schaden',
    'dachsanierung-planen': 'dachsanierung,dach,bau',
    'dachziegel-arten': 'dachziegel,dach,ton',
    'dachfenster-einbauen': 'dachfenster,dachgaube,licht',
    'flachdach-abdichten': 'flachdach,abdichtung,membran',
    'dachrinne-reinigen': 'dachrinne,laub,herbst',
    'schornstein-sanieren': 'schornstein,kamin,mauerwerk',
    'dachboden-ausbauen': 'dachboden,ausbau,holz',
    'dach-haltbarkeit': 'dach,altbau,ziegel',
    'gruendach-anlegen': 'gruendach,pflanzen,oekologisch',
    'dachholz-schutz': 'holzschutz,dachholz,lasur',
    'e-check-2026': 'elektriker,pruefung,sicherheit',
    'led-beleuchtung': 'led,lampe,beleuchtung',
    'sicherungskasten-erneuern': 'sicherungskasten,elektro,verteiler',
    'elektroheizung-effizienz': 'heizung,elektro,warm',
    'photovoltaik-anschluss': 'solar,pv,dach',
    'stromausfall-ursachen': 'stromausfall,dunkel,kerze',
    'erdung-pruefen': 'erdung,elektro,messung',
    'kuechenelektro-planen': 'kueche,elektro,steckdose',
    'badezimmer-elektro': 'bad,elektro,licht',
    'smart-meter-vorteile': 'smartmeter,stromzaehler,digital',
    'blitzschutz-nachruesten': 'blitz,blitzableiter,dach',
    'stromkosten-senken': 'strom,sparen,energie',
    'smart-home-nachruesten': 'smarthome,haus,technik',
    'wallbox-zuhause': 'wallbox,eauto,laden',
    'tapezierarbeiten-kosten': 'tapete, Tapezieren, wand',
    'spachteln-und-streichen': 'spachtel,streichen,farbe',
    'fassadensanierung-2026': 'fassade,sanierung,anstrich',
    'decken-verkleiden': 'decke,verkleidung,holz',
    'lasuren-holzschutz': 'holz,lasur,schutz',
    'schoener-wohnen-farben': 'farben,wand,interior',
    'anstrich-daemmschicht': 'daemmung,fassade,energie',
    'malerkosten-pro-qm': 'maler,farbe,rolle',
    'tapeten-trends': 'tapete,muster,wand',
    'besenstrich-technik': 'streichen,technik,farbe',
    'keller-anstreichen': 'keller,anstrich,feuchtigkeit',
    'lackierarbeiten-moebel': 'moebel,lack,tisch',
    'holzschutz-terrassen': 'terrasse,holz,oel',
    'carport-planung': 'carport,auto,holz',
    'gauben-ausbauen': 'gaube,dach,ausbau',
    'holzrahmenbau-haus': 'holzhaus,rahmenbau,bau',
    'carport-dach-arten': 'carport,dach,auto',
    'holzterrasse-verlegen': 'terrasse,holz,bauen',
    'zimmerei-traditionell': 'zimmerei,holz,balken',
    'holzschutz-mittel': 'holzschutz,lasur,holz',
    'dachstuhl-reparatur': 'dachstuhl,holz,bau',
    'wintergarten-holz': 'wintergarten,glas,holz',
    'holzcarport-vs-metall': 'carport,holz,metall',
    'zimmermann-kosten': 'zimmermann,holz,bauen'
  };
  
  const searchQuery = topicImages[topic] || 'handwerker,bau,fachmann';
  return `https://source.unsplash.com/${width}x600/?${searchQuery}`;
}

function generateSchemaOrgArticle(title, description, image, city, tradeName) {
  const now = new Date().toISOString();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": image,
    "datePublished": now,
    "dateModified": now,
    "author": {
      "@type": "Organization",
      "name": `${tradeName} ${city}`,
      "url": `https://fachschmiede.de/${tradeName.toLowerCase()}/${city.toLowerCase()}/`
    },
    "publisher": {
      "@type": "Organization",
      "name": "fachschmiede.de",
      "logo": {
        "@type": "ImageObject",
        "url": "https://fachschmiede.de/logo.png"
      }
    }
  };
}

function generateSchemaOrgFAQ(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };
}

function generateSchemaOrgHowTo(title, description, image, steps) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": title,
    "description": description,
    "image": image,
    "step": steps.map((step, i) => ({
      "@type": "HowToStep",
      "position": i + 1,
      "name": step.name,
      "text": step.text
    }))
  };
}

// ─── ARTIKEL-GENERATOR ──────────────────────────────────────────────

function generateArticleHTML(tradeSlug, citySlug, cityName, tradeName, topic, monthSlug, relatedSlugs) {
  const { slug, title: topicTitle, keyword } = topic;
  const fullSlug = `${slug}-${monthSlug}`;
  const title = `${topicTitle} in ${cityName}: Ratgeber & Kosten ${new Date().getFullYear()}`;
  const h1 = `${topicTitle} in ${cityName}: Was Sie wissen müssen`;
  const meta = `${topicTitle} in ${cityName} ✓ Fachbetriebe ✓ Kosten ✓ Tipps ✓ Förderung. Erfahren Sie alles Wichtige in unserem ${new Date().getFullYear()}-Ratgeber.`;
  const image = generateUnsplashUrl(slug);
  const imgAlt = `${topicTitle} in ${cityName} - Kosten und Förderung ${new Date().getFullYear()}`;
  const imgCaption = `${topicTitle} in ${cityName} und dem Ruhrgebiet`;
  
  const today = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  
  // FAQ generieren
  const faqs = [
    {
      q: `Wie lange dauert ${topicTitle} in ${cityName}?`,
      a: `Die Dauer hängt vom Umfang ab. In der Regel rechnen Sie mit 1 bis 3 Werktagen für Standardarbeiten. Bei umfangreicheren Projekten in ${cityName} kann es auch 1 bis 2 Wochen dauern. Ein seriöser Fachbetrieb gibt Ihnen vorab einen realistischen Zeitplan.`
    },
    {
      q: `Was kostet ${topicTitle} in ${cityName}?`,
      a: `Die Kosten variieren je nach Umfang und Material. Für eine Standard-Lösung in ${cityName} können Sie mit 500 bis 2.000 Euro rechnen. Holen Sie sich am besten mehrere kostenlose Angebote von Fachbetrieben ein, um einen realistischen Preisvergleich zu erhalten.`
    },
    {
      q: `Benötige ich eine Genehmigung für ${topicTitle} in ${cityName}?`,
      a: `Das kommt auf das Projekt an. Kleine Reparaturen und Instandsetzungen sind in der Regel genehmigungsfrei. Bei größeren Umbauten oder Neubauten in ${cityName} sollten Sie sich vorab beim Bauamt erkundigen. Ihr Fachbetrieb berät Sie hierzu gerne.`
    },
    {
      q: `Kann ich während der Arbeiten im Haus wohnen bleiben?`,
      a: `In den meisten Fällen ja. Bei ${topicTitle} in ${cityName} wird in der Regel nur einzelne Bereiche bearbeitet, sodass Sie normal im Haus wohnen können. Bei größeren Projekten besprechen Sie die genauen Abläufe vorab mit Ihrem Fachbetrieb.`
    }
  ];
  
  // HowTo Steps
  const howToSteps = [
    { name: 'Bedarf analysieren', text: `Definieren Sie Ihre Anforderungen für ${topicTitle} in ${cityName}. Welches Budget haben Sie? Welche Termine sind realistisch?` },
    { name: 'Fachbetrieb wählen', text: `Vergleichen Sie mindestens 3 Fachbetriebe aus ${cityName}. Achten Sie auf Meisterbetrieb, Referenzen und Gewährleistung.` },
    { name: 'Angebot einholen', text: `Lassen Sie sich ein detailliertes, schriftliches Angebot unterbreiten. Prüfen Sie Leistungsumfang, Material und Termine.` },
    { name: 'Auftrag erteilen', text: `Nach Prüfung des Angebots erteilen Sie den Auftrag. Vereinbaren Sie einen festen Termin und klären Sie alle Details.` },
    { name: 'Abnahme & Zahlung', text: `Nach Fertigstellung prüfen Sie die Arbeiten. Bei Zufriedenheit erfolgt die Abnahme und Zahlung gemäß Vereinbarung.` }
  ];
  
  // Schema.org JSON
  const schemaArticle = JSON.stringify(generateSchemaOrgArticle(title, meta, image, cityName, tradeName));
  const schemaFAQ = JSON.stringify(generateSchemaOrgFAQ(faqs));
  const schemaHowTo = JSON.stringify(generateSchemaOrgHowTo(title, meta, image, howToSteps));
  
  // Related links
  const relatedLinks = relatedSlugs.map(relSlug => {
    const relTitle = relSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `<p><a href="/${tradeSlug}/${citySlug}/blog/${relSlug}/">→ ${relTitle} in ${cityName}</a></p>`;
  }).join('\n');
  
  // FAQ HTML
  const faqHTML = faqs.map(faq => `
<details style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px;overflow:hidden;">
  <summary style="padding:20px;cursor:pointer;font-weight:600;color:#0f172a;list-style:none;display:flex;justify-content:space-between;align-items:center;">
    ${faq.q}
    <svg style="width:20px;height:20px;color:#64748b;flex-shrink:0;margin-left:12px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
    </svg>
  </summary>
  <div style="padding:0 20px 20px;color:#475569;line-height:1.7;">${faq.a}</div>
</details>
  `).join('');
  
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${meta}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://fachschmiede.de/${tradeSlug}/${citySlug}/blog/${fullSlug}/">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${meta}">
<meta property="og:image" content="${image}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://fachschmiede.de/${tradeSlug}/${citySlug}/blog/${fullSlug}/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${meta}">
<meta name="twitter:image" content="${image}">
<script type="application/ld+json">${schemaArticle}</script>
<script type="application/ld+json">${schemaFAQ}</script>
<script type="application/ld+json">${schemaHowTo}</script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
body{font-family:'Inter',system-ui,sans-serif;background:#f8fafc;color:#1e293b;line-height:1.7;margin:0}
.container{max-width:800px;margin:0 auto;padding:0 20px}
header{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);color:white;padding:40px 0;text-align:center}
h1{font-size:2rem;font-weight:800;margin-bottom:10px}
.meta{color:#94a3b8;font-size:0.9rem}
.hero-image{width:100%;height:400px;object-fit:cover;display:block}
.img-caption{text-align:center;color:#64748b;font-size:0.875rem;padding:8px 0;font-style:italic}
.content{background:white;margin:40px auto;padding:40px;border-radius:16px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)}
h2{font-size:1.5rem;font-weight:700;margin:40px 0 20px;color:#0f172a}
p{margin-bottom:20px;color:#475569;line-height:1.8}
ul{margin:20px 0;padding-left:24px}
li{margin-bottom:12px;color:#475569}
a{color:#2563eb;text-decoration:none}
a:hover{text-decoration:underline}
.breadcrumb{padding:16px 0;font-size:0.875rem;color:#64748b}
.cta-box{margin-top:40px;padding:30px;background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border-radius:16px;text-align:center}
.cta-box h3{color:#92400e;margin-bottom:16px}
.cta-box p{color:#78350f;margin-bottom:20px}
.cta-button{display:inline-block;padding:14px 32px;background:#f59e0b;color:white;font-weight:700;text-decoration:none;border-radius:12px;transition:background 0.2s}
.cta-button:hover{background:#d97706}
.back-link{display:inline-block;margin-top:30px;padding:12px 24px;background:#3b82f6;color:white;text-decoration:none;border-radius:8px;font-weight:600}
.back-link:hover{background:#2563eb}
@media(max-width:640px){h1{font-size:1.5rem}.content{padding:24px;margin:20px auto}.hero-image{height:250px}}
</style>
</head>
<body>
<header>
<div class="container">
<div style="font-size:0.875rem;text-transform:uppercase;letter-spacing:0.1em;color:#60a5fa;margin-bottom:8px;">${tradeName} in ${cityName}</div>
<h1>${h1}</h1>
<div class="meta">Aktualisiert: ${today} · 8 Min. Lesezeit</div>
</div>
</header>
<img src="${image}" alt="${imgAlt}" class="hero-image" loading="lazy">
<div class="img-caption">${imgCaption}</div>
<div class="container">
<div class="breadcrumb"><a href="/${tradeSlug}/${citySlug}/">${cityName}</a> / <a href="/${tradeSlug}/${citySlug}/">${tradeName}</a> / Blog</div>
<article class="content">
<p style="font-size:1.125rem;color:#334155;margin-bottom:24px;font-weight:500;">${meta}</p>

<p>Wer in ${cityName} und dem Ruhrgebiet lebt, kennt die Herausforderungen: extreme Witterung, wechselnde Temperaturen und der Wunsch nach einem energieeffizienten Zuhause. In diesem Ratgeber erfahren Sie alles Wichtige zu ${topicTitle} – von den Grundlagen über Kosten bis hin zu praktischen Tipps aus der Region.</p>

<p>Als erfahrener ${tradeName} in ${cityName} begleite ich Sie durch das Thema und zeige Ihnen, worauf es bei der Planung und Umsetzung ankommt. Ob Sie bereits konkrete Pläne haben oder sich erst informieren möchten – dieser Guide gibt Ihnen die nötige Orientierung.</p>

<h2>Warum ist das Thema ${topicTitle} in ${cityName} wichtig?</h2>

<p>${cityName} und das gesamte Ruhrgebiet zeichnen sich durch ein anspruchsvolles Klima aus. Heiße Sommer, kalte Winter und häufige Regenfälle stellen besondere Anforderungen an Gebäude und Installationen. Wer hier wohnt, weiß: Fachgerechte Arbeit zahlt sich langfristig aus.</p>

<p>Die Energiekosten steigen kontinuierlich, und die Anforderungen an Effizienz werden höher. Gleichzeitig werden Förderprogramme immer attraktiver, die eine Investition in moderne Technik oder Sanierung unterstützen. Wer frühzeitig handelt, profitiert von Zuschüssen und spart langfristig Geld.</p>

<p>Ein weiterer wichtiger Aspekt ist die Sicherheit. Ob elektrische Anlagen, Wasserleitungen oder Dachkonstruktionen – regelmäßige Prüfungen und fachgerechte Installationen schützen vor teuren Schäden und Gefahren für Gesundheit und Leben.</p>

<h2>Die 5 wichtigsten Punkte für ${cityName}</h2>

<p>Basierend auf meiner Erfahrung als ${tradeName} in ${cityName} und Umgebung habe ich die fünf entscheidenden Faktoren zusammengestellt, die Sie kennen sollten:</p>

<ul>
<li><strong>Regionaler Faktor:</strong> ${cityName} liegt im Ruhrgebiet mit spezifischen baulichen Gegebenheiten. Viele Häuser stammen aus den 60er und 70er Jahren und haben besondere Anforderungen. Ein lokaler Fachbetrieb kennt diese Typen und weiß, worauf zu achten ist.</li>

<li><strong>Fördermöglichkeiten nutzen:</strong> Nordrhein-Westfalen und der Bund bieten zahlreiche Förderprogramme. Von der KfW über das BAFA bis zu kommunalen Zuschüssen – die Möglichkeiten sind vielfältig. Wichtig: Antrag VOR Baubeginn stellen!</li>

<li><strong>Fachbetrieb wählen:</strong> Nicht jeder Handwerker ist für jede Aufgabe geeignet. Achten Sie auf Meisterbetriebe mit regionaler Erfahrung in ${cityName}. Referenzen, Gewährleistung und eine ordentliche Versicherung sind Pflicht.</li>

<li><strong>Qualität vor Preis:</strong> Günstige Angebote können teuer werden, wenn die Qualität nicht stimmt. Setzen Sie auf hochwertige Materialien und fachgerechte Ausführung. Die Investition amortisiert sich durch Langlebigkeit und Effizienz.</li>

<li><strong>Wartung nicht vergessen:</strong> Auch nach der Installation oder Sanierung ist regelmäßige Wartung wichtig. Vereinbaren Sie einen Wartungsvertrag oder planen Sie jährliche Kontrollen ein.</li>
</ul>

<h2>Was kostet es in ${cityName}?</h2>

<p>Die Kosten für ${topicTitle} in ${cityName} variieren je nach Umfang, Material und baulicher Situation. Hier ein realistischer Überblick, basierend auf aktuellen Preisen in der Region:</p>

<p>Für eine typische Durchführung in einem Einfamilienhaus in ${cityName} können Sie mit Kosten zwischen 1.500 und 5.000 Euro rechnen. Diese Spanne ergibt sich aus verschiedenen Faktoren: der Größe des Objekts, dem gewählten Material und dem baulichen Zustand.</p>

<p>Mit Förderung reduziert sich die Rechnung erheblich. Die KfW bietet zinsgünstige Darlehen mit Tilgungszuschuss, das BAFA direkte Zuschüsse. In Kombination können Sie mit einer Erstattung von 15-30 Prozent der Gesamtkosten rechnen.</p>

<p>Tipp: Holen Sie sich mehrere Angebote ein. Seriöse Betriebe in ${cityName} erstellen Ihnen ein kostenloses und unverbindliches Angebot. Achten Sie auf detaillierte Leistungsbeschreibungen und nicht nur auf den Endpreis.</p>

<div style="margin-top:40px">
<h2>Häufig gestellte Fragen</h2>
${faqHTML}
</div>

<h2>Fazit: Ihr nächster Schritt in ${cityName}</h2>

<p>${topicTitle} ist eine Investition, die sich lohnt – finanziell, komfortabel und oft auch förderfähig. In ${cityName} und dem Ruhrgebiet finden Sie zahlreiche qualifizierte Fachbetriebe, die Sie kompetent beraten und die Arbeiten fachgerecht ausführen.</p>

<p>Nutzen Sie die aktuellen Förderprogramme, holen Sie sich mehrere Angebote ein und entscheiden Sie sich für einen Meisterbetrieb mit regionaler Erfahrung. Die Kombination aus Qualität, Förderung und professioneller Ausführung macht Ihr Projekt zum Erfolg.</p>

<p>Mein Tipp: Starten Sie mit einer kostenlosen Beratung bei einem Fachbetrieb in ${cityName}. So erhalten Sie eine realistische Einschätzung der Kosten und des Aufwands – und können gezielt planen.</p>

<h2>Weitere Artikel für ${cityName}</h2>
${relatedLinks}
<p><a href="/${tradeSlug}/${citySlug}/">→ Hauptseite: ${tradeName} ${cityName}</a></p>

<div class="cta-box">
<h3>Benötigen Sie einen ${tradeName} in ${cityName}?</h3>
<p>Unsere Partnerbetriebe in ${cityName} helfen Ihnen gerne bei Ihrem Vorhaben. Kostenlose Beratung vor Ort.</p>
<a href="/${tradeSlug}/${citySlug}/#kontakt" class="cta-button">Kostenloses Angebot anfordern</a>
</div>
</article>
<div style="text-align:center;margin:40px 0">
<a href="/${tradeSlug}/${citySlug}/" class="back-link">← Zurück zu ${tradeName} ${cityName}</a>
</div>
</div>
</body>
</html>`;
}

// ─── HAUPTFUNKTION ──────────────────────────────────────────────────

async function main() {
  console.log('🚀 Monatlicher Artikel-Generator gestartet');
  console.log(`📅 Monat: ${getMonthSlug()}`);
  
  // Prüfe Supabase-Verbindung
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Supabase Credentials fehlen!');
    process.exit(1);
  }
  
  // Lade Mieter aus Supabase
  console.log('📊 Lade Mieter-Daten...');
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('*, landing_page:landing_pages(slug)');
  
  if (error) {
    console.error('❌ Supabase Fehler:', error.message);
    process.exit(1);
  }
  
  // Erstelle Stadt-Plan-Mapping
  const cityPlanMap = {};
  for (const city of CITIES) {
    cityPlanMap[city] = null; // Freie Stadt
  }
  
  for (const tenant of tenants || []) {
    const slug = tenant.landing_page?.slug;
    if (slug) {
      const parts = slug.split('-');
      const citySlug = parts.slice(1).join('-');
      if (CITIES.includes(citySlug)) {
        cityPlanMap[citySlug] = tenant.plan || 'basic';
      }
    }
  }
  
  // Zähle Artikel
  let totalArticles = 0;
  const generationPlan = [];
  
  for (const [citySlug, plan] of Object.entries(cityPlanMap)) {
    const count = getArticleCountByPlan(plan);
    totalArticles += count;
    generationPlan.push({ city: citySlug, plan: plan || 'frei', count });
  }
  
  console.log(`\n📋 Generierungsplan:`);
  console.table(generationPlan);
  console.log(`\n📝 Gesamt: ${totalArticles} neue Artikel`);
  
  // Lade bestehenden Index
  const indexPath = path.join(process.cwd(), 'lib', 'article-index.json');
  let articleIndex = [];
  try {
    articleIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  } catch {
    articleIndex = [];
  }
  
  // Generiere Artikel
  const monthSlug = getMonthSlug();
  let generatedCount = 0;
  
  for (const { city, count } of generationPlan) {
    const cityName = city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, ' ');
    
    for (let i = 0; i < count; i++) {
      // Wähle Gewerk rotierend
      const tradeKeys = Object.keys(TRADES);
      const tradeSlug = tradeKeys[generatedCount % tradeKeys.length];
      const trade = TRADES[tradeSlug];
      
      // Wähle Topic rotierend
      const topicIndex = Math.floor(generatedCount / tradeKeys.length) % trade.topics.length;
      const topic = trade.topics[topicIndex];
      
      // Erstelle Artikel
      const fullSlug = `${topic.slug}-${monthSlug}`;
      const filePath = path.join(process.cwd(), 'public', 'blog', tradeSlug, city, `${fullSlug}.html`);
      
      // Prüfe ob Artikel bereits existiert
      if (fs.existsSync(filePath)) {
        console.log(`⏭️  Überspringe (existiert): ${tradeSlug}/${city}/${fullSlug}`);
        continue;
      }
      
      // Stelle sicher, dass Verzeichnis existiert
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Generiere HTML
      const relatedSlugs = trade.topics
        .filter((_, idx) => idx !== topicIndex)
        .slice(0, 2)
        .map(t => t.slug);
      
      const html = generateArticleHTML(tradeSlug, city, cityName, trade.name, topic, monthSlug, relatedSlugs);
      
      fs.writeFileSync(filePath, html, 'utf-8');
      
      // Füge zu Index hinzu
      articleIndex.push({
        slug: fullSlug,
        trade: tradeSlug,
        city: city,
        title: `${topic.title} in ${cityName}`,
        month: monthSlug,
        generated: new Date().toISOString()
      });
      
      console.log(`✅ Generiert: ${tradeSlug}/${city}/${fullSlug}`);
      generatedCount++;
    }
  }
  
  // Speichere Index
  fs.writeFileSync(indexPath, JSON.stringify(articleIndex, null, 2), 'utf-8');
  
  console.log(`\n🎉 Fertig! ${generatedCount} neue Artikel generiert.`);
  console.log(`📚 Index aktualisiert: ${articleIndex.length} Gesamt-Artikel`);
  
  // Git commit Info
  console.log(`\n💡 Nächste Schritte:`);
  console.log(`   git add -A`);
  console.log(`   git commit -m "feat: ${generatedCount} monatliche Artikel (${monthSlug})"`);
  console.log(`   git push`);
}

// Ausführen
main().catch(err => {
  console.error('❌ Fehler:', err);
  process.exit(1);
});
