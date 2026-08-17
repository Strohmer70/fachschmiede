#!/usr/bin/env node
/**
 * Monatlicher Artikel-Generator für fachschmiede.de
 * Nutzt die echte Kimi/Moonshot API für einzigartige, SEO-optimierte Artikel.
 * 
 * 1-2-4 System:
 * - Freie Stadt: 1 Artikel/Monat
 * - Basic: 2 Artikel/Monat
 * - Pro: 4 Artikel/Monat
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ─── KONFIGURATION ──────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const MOONSHOT_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

const CITIES = [
  'bergkamen', 'bochum', 'castrop-rauxel', 'dortmund', 'ennepetal',
  'froendenberg', 'gevelsberg', 'hagen', 'hattingen', 'herne',
  'holzwickede', 'iserlohn', 'kamen', 'luenen', 'schwelm',
  'schwerte', 'sprockhoevel', 'unna', 'wetter-ruhr', 'witten'
];

const CITY_DISPLAY_NAMES = {
  'bergkamen': 'Bergkamen',
  'bochum': 'Bochum',
  'castrop-rauxel': 'Castrop-Rauxel',
  'dortmund': 'Dortmund',
  'ennepetal': 'Ennepetal',
  'froendenberg': 'Fröndenberg',
  'gevelsberg': 'Gevelsberg',
  'hagen': 'Hagen',
  'hattingen': 'Hattingen',
  'herne': 'Herne',
  'holzwickede': 'Holzwickede',
  'iserlohn': 'Iserlohn',
  'kamen': 'Kamen',
  'luenen': 'Lünen',
  'schwelm': 'Schwelm',
  'schwerte': 'Schwerte',
  'sprockhoevel': 'Sprockhövel',
  'unna': 'Unna',
  'wetter-ruhr': 'Wetter (Ruhr)',
  'witten': 'Witten'
};

const TRADES = {
  dachdecker: {
    name: 'Dachdecker',
    topics: [
      { slug: 'dachdaemmung-kosten', title: 'Dachdämmung Kosten', keyword: 'Dachdämmung', searchTerms: 'dach,daemmung,dachdecker,wärmedämmung' },
      { slug: 'sturmschaden-reparatur', title: 'Sturmschaden Reparatur', keyword: 'Sturmschaden', searchTerms: 'dach,sturm,schaden,reparatur' },
      { slug: 'dachsanierung-planen', title: 'Dachsanierung planen', keyword: 'Dachsanierung', searchTerms: 'dachsanierung,dach,bau,erneuerung' },
      { slug: 'dachziegel-arten', title: 'Dachziegel Arten', keyword: 'Dachziegel', searchTerms: 'dachziegel,dach,ton,tonne' },
      { slug: 'dachfenster-einbauen', title: 'Dachfenster einbauen', keyword: 'Dachfenster', searchTerms: 'dachfenster,dachgaube,licht,fenster' },
      { slug: 'flachdach-abdichten', title: 'Flachdach abdichten', keyword: 'Flachdach', searchTerms: 'flachdach,abdichtung,membran,bitumen' },
      { slug: 'dachrinne-reinigen', title: 'Dachrinne reinigen', keyword: 'Dachrinne', searchTerms: 'dachrinne,laub,herbst,reinigung' },
      { slug: 'schornstein-sanieren', title: 'Schornstein sanieren', keyword: 'Schornstein', searchTerms: 'schornstein,kamin,mauerwerk,sanierung' },
      { slug: 'dachboden-ausbauen', title: 'Dachboden ausbauen', keyword: 'Dachboden', searchTerms: 'dachboden,ausbau,holz,dachgeschoss' },
      { slug: 'dach-haltbarkeit', title: 'Dach Haltbarkeit', keyword: 'Dachhaltbarkeit', searchTerms: 'dach,altbau,ziegel,lebensdauer' },
      { slug: 'gruendach-anlegen', title: 'Gründach anlegen', keyword: 'Gründach', searchTerms: 'gruendach,pflanzen,oekologisch,dachbegrünung' },
      { slug: 'dachholz-schutz', title: 'Dachholz Schutz', keyword: 'Dachholz', searchTerms: 'holzschutz,dachholz,lasur,pilz' },
    ]
  },
  elektriker: {
    name: 'Elektriker',
    topics: [
      { slug: 'e-check-2026', title: 'E-Check 2026', keyword: 'E-Check', searchTerms: 'elektriker,pruefung,sicherheit,e-check' },
      { slug: 'led-beleuchtung', title: 'LED Beleuchtung', keyword: 'LED', searchTerms: 'led,lampe,beleuchtung,energiesparen' },
      { slug: 'sicherungskasten-erneuern', title: 'Sicherungskasten erneuern', keyword: 'Sicherungskasten', searchTerms: 'sicherungskasten,elektro,verteiler,fi-schalter' },
      { slug: 'elektroheizung-effizienz', title: 'Elektroheizung Effizienz', keyword: 'Elektroheizung', searchTerms: 'heizung,elektro,warm,infrarot' },
      { slug: 'photovoltaik-anschluss', title: 'Photovoltaik Anschluss', keyword: 'Photovoltaik', searchTerms: 'solar,pv,dach,strom' },
      { slug: 'stromausfall-ursachen', title: 'Stromausfall Ursachen', keyword: 'Stromausfall', searchTerms: 'stromausfall,dunkel,kerze,notstrom' },
      { slug: 'erdung-pruefen', title: 'Erdung prüfen', keyword: 'Erdung', searchTerms: 'erdung,elektro,messung,potentialausgleich' },
      { slug: 'kuechenelektro-planen', title: 'Küchenelektro planen', keyword: 'Küchenelektro', searchTerms: 'kueche,elektro,steckdose,herd' },
      { slug: 'badezimmer-elektro', title: 'Badezimmer Elektro', keyword: 'Badelektro', searchTerms: 'bad,elektro,licht,steckdose,schutzraum' },
      { slug: 'smart-meter-vorteile', title: 'Smart Meter Vorteile', keyword: 'Smart Meter', searchTerms: 'smartmeter,stromzaehler,digital,verbrauch' },
      { slug: 'blitzschutz-nachruesten', title: 'Blitzschutz nachrüsten', keyword: 'Blitzschutz', searchTerms: 'blitz,blitzableiter,dach,schutz' },
      { slug: 'stromkosten-senken', title: 'Stromkosten senken', keyword: 'Stromkosten', searchTerms: 'strom,sparen,energie,verbrauch' },
    ]
  },
  klempner: {
    name: 'Klempner',
    topics: [
      { slug: 'wasserdruck-optimieren', title: 'Wasserdruck optimieren', keyword: 'Wasserdruck', searchTerms: 'wasserhahn,druck,armatur,pumpe' },
      { slug: 'abfluss-verstopft', title: 'Abfluss verstopft', keyword: 'Abfluss', searchTerms: 'abfluss,verstopfung,rohr,pümpel' },
      { slug: 'warmwasserspeicher-tauschen', title: 'Warmwasserspeicher tauschen', keyword: 'Warmwasserspeicher', searchTerms: 'boiler,warmwasser,heizung,speicher' },
      { slug: 'fussbodenheizung-wartung', title: 'Fußbodenheizung Wartung', keyword: 'Fußbodenheizung', searchTerms: 'fussbodenheizung,boden,warm,heizkreis' },
      { slug: 'gasleitung-pruefen', title: 'Gasleitung prüfen', keyword: 'Gasleitung', searchTerms: 'gas,leitung,pruefung,dichtheitsprüfung' },
      { slug: 'wasserenthaertung-anlagen', title: 'Wasserenthärtung Anlagen', keyword: 'Wasserenthärtung', searchTerms: 'wasser,filter,anlage,enthärtung' },
      { slug: 'heizkoerper-entlueften', title: 'Heizkörper entlüften', keyword: 'Heizkörper', searchTerms: 'heizkoerper,heizung,warm,entlüften' },
      { slug: 'trinkwasserqualitaet', title: 'Trinkwasserqualität', keyword: 'Trinkwasser', searchTerms: 'wasserhahn,trinkwasser,glas,blei' },
      { slug: 'sanitaer-notdienst', title: 'Sanitär Notdienst', keyword: 'Notdienst', searchTerms: 'notdienst,werkzeug,plumber,rohrbruch' },
      { slug: 'badrenovierung-planen', title: 'Badrenovierung planen', keyword: 'Badrenovierung', searchTerms: 'bad,badezimmer,renovierung,fliesen' },
      { slug: 'armaturen-wechseln', title: 'Armaturen wechseln', keyword: 'Armaturen', searchTerms: 'armatur,wasserhahn,messing,mischer' },
      { slug: 'wasserschaden-sanierung', title: 'Wasserschaden Sanierung', keyword: 'Wasserschaden', searchTerms: 'wasserschaden,trocknung,bauseite,schimmel' },
    ]
  },
  maler: {
    name: 'Maler',
    topics: [
      { slug: 'tapezierarbeiten-kosten', title: 'Tapezierarbeiten Kosten', keyword: 'Tapezieren', searchTerms: 'tapete,tapezieren,wand,muster' },
      { slug: 'spachteln-und-streichen', title: 'Spachteln und streichen', keyword: 'Spachteln', searchTerms: 'spachtel,streichen,farbe,putz' },
      { slug: 'fassadensanierung-2026', title: 'Fassadensanierung 2026', keyword: 'Fassadensanierung', searchTerms: 'fassade,sanierung,anstrich,putz' },
      { slug: 'decken-verkleiden', title: 'Decken verkleiden', keyword: 'Deckenverkleidung', searchTerms: 'decke,verkleidung,holz,paneele' },
      { slug: 'lasuren-holzschutz', title: 'Lasuren Holzschutz', keyword: 'Holzschutz', searchTerms: 'holz,lasur,schutz,anstrich' },
      { slug: 'schoener-wohnen-farben', title: 'Schöner Wohnen Farben', keyword: 'Farben', searchTerms: 'farben,wand,interior,design' },
      { slug: 'anstrich-daemmschicht', title: 'Anstrich Dämmschicht', keyword: 'Dämmschicht', searchTerms: 'daemmung,fassade,energie,wärmedämmung' },
      { slug: 'malerkosten-pro-qm', title: 'Malerkosten pro m²', keyword: 'Malerkosten', searchTerms: 'maler,farbe,rolle,kosten' },
      { slug: 'tapeten-trends', title: 'Tapeten Trends', keyword: 'Tapeten', searchTerms: 'tapete,muster,wand,design' },
      { slug: 'besenstrich-technik', title: 'Besenstrich Technik', keyword: 'Besenstrich', searchTerms: 'streichen,technik,farbe,effekt' },
      { slug: 'keller-anstreichen', title: 'Keller anstreichen', keyword: 'Kelleranstrich', searchTerms: 'keller,anstrich,feuchtigkeit,schimmel' },
      { slug: 'lackierarbeiten-moebel', title: 'Lackierarbeiten Möbel', keyword: 'Lackierarbeiten', searchTerms: 'moebel,lack,tisch,schrank' },
    ]
  },
  zimmerer: {
    name: 'Zimmerer',
    topics: [
      { slug: 'holzschutz-terrassen', title: 'Holzschutz Terrassen', keyword: 'Holzschutz', searchTerms: 'terrasse,holz,oel,schutz' },
      { slug: 'carport-planung', title: 'Carport Planung', keyword: 'Carport', searchTerms: 'carport,auto,holz,überdachung' },
      { slug: 'gauben-ausbauen', title: 'Gauben ausbauen', keyword: 'Gaube', searchTerms: 'gaube,dach,ausbau,dachgaube' },
      { slug: 'holzrahmenbau-haus', title: 'Holzrahmenbau Haus', keyword: 'Holzrahmenbau', searchTerms: 'holzhaus,rahmenbau,bau,fertighaus' },
      { slug: 'carport-dach-arten', title: 'Carport Dach Arten', keyword: 'Carportdach', searchTerms: 'carport,dach,auto,pvc' },
      { slug: 'holzterrasse-verlegen', title: 'Holzterrasse verlegen', keyword: 'Holzterrasse', searchTerms: 'terrasse,holz,bauen,verlegen' },
      { slug: 'zimmerei-traditionell', title: 'Zimmerei traditionell', keyword: 'Zimmerei', searchTerms: 'zimmerei,holz,balken,fachwerk' },
      { slug: 'holzschutz-mittel', title: 'Holzschutz Mittel', keyword: 'Holzschutzmittel', searchTerms: 'holzschutz,lasur,holz,pilz' },
      { slug: 'dachstuhl-reparatur', title: 'Dachstuhl Reparatur', keyword: 'Dachstuhl', searchTerms: 'dachstuhl,holz,bau,reparatur' },
      { slug: 'wintergarten-holz', title: 'Wintergarten Holz', keyword: 'Wintergarten', searchTerms: 'wintergarten,glas,holz,veranda' },
      { slug: 'holzcarport-vs-metall', title: 'Holzcarport vs Metall', keyword: 'Carport Vergleich', searchTerms: 'carport,holz,metall,vergleich' },
      { slug: 'zimmermann-kosten', title: 'Zimmermann Kosten', keyword: 'Zimmermann', searchTerms: 'zimmermann,holz,bauen,kosten' },
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

function getCityDisplayName(citySlug) {
  return CITY_DISPLAY_NAMES[citySlug] || citySlug.charAt(0).toUpperCase() + citySlug.slice(1);
}

function generateUnsplashUrl(searchTerms, width = 1200) {
  return `https://source.unsplash.com/${width}x600/?${searchTerms}`;
}

// ─── KIMI/MOONSHOT API ──────────────────────────────────────────────

/**
 * Ruft die Moonshot API mit Retry-Logik auf.
 * Max 3 Versuche bei Fehlern, exponentielles Backoff.
 */
async function callMoonshotAPI(messages, maxRetries = 3) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MOONSHOT_API_KEY}`
  };

  const body = {
    model: 'moonshot-v1-32k',
    messages: messages,
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: 'json_object' }
  };

  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`   🌙 API Call (Versuch ${attempt}/${maxRetries})...`);
      
      const response = await fetch(MOONSHOT_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Ungültige API-Antwort: Keine choices gefunden');
      }

      const content = data.choices[0].message.content;
      
      // Versuche JSON zu parsen
      try {
        return JSON.parse(content);
      } catch (parseErr) {
        // Manchmal ist JSON in Markdown-Codeblock eingewickelt
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         content.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        }
        throw new Error('JSON Parse Fehler: ' + parseErr.message);
      }
    } catch (err) {
      lastError = err;
      console.log(`   ⚠️  Fehler: ${err.message}`);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`   ⏳ Warte ${delay}ms vor nächstem Versuch...`);
        await sleep(delay);
      }
    }
  }
  
  throw new Error(`API-Aufruf nach ${maxRetries} Versuchen fehlgeschlagen: ${lastError.message}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Baut den Prompt für die Artikel-Generierung.
 * Sehr detailliert für beste SEO-Ergebnisse.
 */
function buildArticlePrompt(tradeName, cityName, topic, citySlug, tradeSlug) {
  const year = new Date().getFullYear();
  
  return [
    {
      role: 'system',
      content: `Du bist ein erfahrener SEO-Content-Writer für das deutsche Handwerker-Portal fachschmiede.de. 
Du schreibst hochwertige, einzigartige Ratgeber-Artikel für Handwerker-Themen im Ruhrgebiet.

WICHTIGE REGELN:
- Schreibe auf Deutsch (Deutschland)
- 1000-1500 Wörter pro Artikel
- Nutze lokale Bezüge zur Stadt und zum Ruhrgebiet
- SEO-optimiert mit natürlicher Keyword-Verteilung
- Fachlich korrekt und vertrauenswürdig
- Enthält konkrete Zahlen, Kosten und Preisspannen
- Erwähne Förderprogramme (KfW, BAFA, kommunale Zuschüsse NRW)
- Verwende Übergangswörter für guten Lesefluss

Das Ruhrgebiet hat spezifische Merkmale:
- Viele Häuser aus den 1950er-1970er Jahren (Siedlungsbau)
- Steigende Energiekosten
- Förderung durch Landesprogramme NRW
- Typische bauliche Probleme: Feuchtigkeit, Schimmel, Altbau-Sanierung
- Starker Zusammenhang mit Bergbau-Geschichte (viele Häuser für Bergarbeiter gebaut)

Antworte AUSSCHLIESSLICH im JSON-Format mit folgender Struktur:`
    },
    {
      role: 'user',
      content: `Schreibe einen umfassenden SEO-Ratgeber-Artikel zum Thema:

THEMA: ${topic.title}
GEWERK: ${tradeName}
STADT: ${cityName}
JAHR: ${year}

Gib mir das Ergebnis als JSON mit folgenden Feldern:

{
  "title": "SEO-Title (max 60 Zeichen)",
  "h1": "H1-Überschrift (max 70 Zeichen)",
  "metaDescription": "Meta-Description (max 160 Zeichen)",
  "intro": "Einleitungstext (2-3 Absätze, ca. 200 Wörter). Muss Stadtname und Ruhrgebiet enthalten.",
  "sections": [
    {
      "h2": "H2-Überschrift",
      "content": "Absatz-Text (HTML mit <p> und <ul>/<li>). Ca. 150-250 Wörter pro Section."
    }
  ],
  "faq": [
    { "q": "Frage 1", "a": "Antwort 1 (ca. 2-3 Sätze)" },
    { "q": "Frage 2", "a": "Antwort 2" },
    { "q": "Frage 3", "a": "Antwort 3" },
    { "q": "Frage 4", "a": "Antwort 4" }
  ],
  "howTo": {
    "title": "HowTo Titel",
    "steps": [
      { "name": "Schritt 1", "text": "Beschreibung" },
      { "name": "Schritt 2", "text": "Beschreibung" },
      { "name": "Schritt 3", "text": "Beschreibung" },
      { "name": "Schritt 4", "text": "Beschreibung" },
      { "name": "Schritt 5", "text": "Beschreibung" }
    ]
  },
  "internalLinks": [
    { "text": "Verlinkungstext", "url": "relativer-link" }
  ],
  "conclusion": "Fazit-Absatz (ca. 150 Wörter)"
}

ANFORDERUNGEN AN DEN INHALT:
1. Mindestens 5 H2-Sections mit sinnvoller Struktur
2. Jede Section muss echte, nützliche Informationen enthalten
3. Erwähne konkrete Kosten, Preisspannen und Fördermöglichkeiten
4. Nutze Fachbegriffe des Gewerks
5. Verweise auf lokale Besonderheiten von ${cityName}
6. Erwähne das Ruhrgebiet mindestens 3x
7. Nutze natürliche Keywords: ${topic.keyword}, ${tradeName} ${cityName}, ${topic.title}
8. Schreibe im "Wir"-Stil als erfahrener Fachbetrieb
9. Keine Platzhalter oder generischen Floskeln
10. Jeder FAQ-Eintrag muss eine konkrete, hilfreiche Antwort haben
11. Die HowTo-Steps müssen praktisch umsetzbar sein

Das JSON muss valide sein - achte auf korrekte Escape-Zeichen bei Anführungszeichen im Text.`
    }
  ];
}

// ─── SCHEMA.ORG GENERATOREN ─────────────────────────────────────────

function generateSchemaOrgArticle(title, description, image, city, tradeName, datePublished) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": image,
    "datePublished": datePublished,
    "dateModified": datePublished,
    "author": {
      "@type": "Organization",
      "name": `${tradeName} ${city}`,
      "url": `https://fachschmiede.de/${tradeName.toLowerCase()}/${city.toLowerCase().replace(/\s+/g, '-')}/`
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

// ─── HTML BUILDER ───────────────────────────────────────────────────

function buildArticleHTML(apiResponse, tradeSlug, citySlug, cityName, tradeName, topic, monthSlug, relatedSlugs) {
  const { title, h1, metaDescription, intro, sections, faq, howTo, internalLinks, conclusion } = apiResponse;
  
  const fullSlug = `${topic.slug}-${monthSlug}`;
  const image = generateUnsplashUrl(topic.searchTerms);
  const imgAlt = `${topic.title} in ${cityName} - Kosten und Förderung ${new Date().getFullYear()}`;
  const imgCaption = `${topic.title} in ${cityName} und dem Ruhrgebiet`;
  const today = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  const isoDate = new Date().toISOString();
  
  // Schema.org JSON
  const schemaArticle = JSON.stringify(generateSchemaOrgArticle(title, metaDescription, image, cityName, tradeName, isoDate));
  const schemaFAQ = JSON.stringify(generateSchemaOrgFAQ(faq));
  const schemaHowTo = JSON.stringify(generateSchemaOrgHowTo(howTo.title || title, metaDescription, image, howTo.steps));
  
  // Build sections HTML
  const sectionsHTML = sections.map(section => `
<h2>${section.h2}</h2>
${section.content}
  `).join('\n');
  
  // Build FAQ HTML
  const faqHTML = faq.map(faqItem => `
<details style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px;overflow:hidden;">
  <summary style="padding:20px;cursor:pointer;font-weight:600;color:#0f172a;list-style:none;display:flex;justify-content:space-between;align-items:center;">
    ${faqItem.q}
    <svg style="width:20px;height:20px;color:#64748b;flex-shrink:0;margin-left:12px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
    </svg>
  </summary>
  <div style="padding:0 20px 20px;color:#475569;line-height:1.7;">${faqItem.a}</div>
</details>
  `).join('');
  
  // Build internal links
  const linksHTML = (internalLinks || []).map(link => `
<p><a href="${link.url}">→ ${link.text}</a></p>
  `).join('');
  
  // Related links from parameter
  const relatedLinksHTML = relatedSlugs.map(relSlug => {
    const relTitle = relSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `<p><a href="/${tradeSlug}/${citySlug}/blog/${relSlug}/">→ ${relTitle} in ${cityName}</a></p>`;
  }).join('\n');
  
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${metaDescription}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://fachschmiede.de/${tradeSlug}/${citySlug}/blog/${fullSlug}/">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${metaDescription}">
<meta property="og:image" content="${image}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://fachschmiede.de/${tradeSlug}/${citySlug}/blog/${fullSlug}/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${metaDescription}">
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
<p style="font-size:1.125rem;color:#334155;margin-bottom:24px;font-weight:500;">${metaDescription}</p>

${intro}

${sectionsHTML}

<div style="margin-top:40px">
<h2>Häufig gestellte Fragen</h2>
${faqHTML}
</div>

<h2>Fazit: Ihr nächster Schritt in ${cityName}</h2>
${conclusion}

<h2>Weitere Artikel für ${cityName}</h2>
${relatedLinksHTML}
${linksHTML}
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

// ─── RATE LIMITER ───────────────────────────────────────────────────

class RateLimiter {
  constructor(maxConcurrent = 2, delayBetweenMs = 3000) {
    this.maxConcurrent = maxConcurrent;
    this.delayBetweenMs = delayBetweenMs;
    this.running = 0;
    this.queue = [];
  }

  async execute(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { fn, resolve, reject } = this.queue.shift();

    try {
      const result = await fn();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      this.running--;
      // Delay before processing next
      setTimeout(() => this.processQueue(), this.delayBetweenMs);
    }
  }
}

// ─── HAUPTFUNKTION ──────────────────────────────────────────────────

async function main() {
  console.log('🚀 Monatlicher Artikel-Generator mit Kimi/Moonshot API');
  console.log(`📅 Monat: ${getMonthSlug()}`);
  
  // Prüfe Credentials
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Supabase Credentials fehlen!');
    process.exit(1);
  }
  if (!MOONSHOT_API_KEY) {
    console.error('❌ MOONSHOT_API_KEY fehlt in .env.local!');
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
  console.log(`💰 Geschätzte API-Kosten: ~$${(totalArticles * 0.05).toFixed(2)} (${totalArticles} × $0.05)`);
  
  // Lade bestehenden Index
  const indexPath = path.join(process.cwd(), 'lib', 'article-index.json');
  let articleIndex = {};
  try {
    articleIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  } catch {
    articleIndex = {};
  }
  
  // Rate Limiter für API-Calls
  const rateLimiter = new RateLimiter(2, 3000); // Max 2 gleichzeitig, 3s Pause
  
  // Generiere Artikel
  const monthSlug = getMonthSlug();
  let generatedCount = 0;
  let failedCount = 0;
  const failedArticles = [];
  
  for (const { city, count } of generationPlan) {
    const cityName = getCityDisplayName(city);
    
    for (let i = 0; i < count; i++) {
      // Wähle Gewerk rotierend
      const tradeKeys = Object.keys(TRADES);
      const tradeSlug = tradeKeys[generatedCount % tradeKeys.length];
      const trade = TRADES[tradeSlug];
      
      // Wähle Topic rotierend
      const topicIndex = Math.floor(generatedCount / tradeKeys.length) % trade.topics.length;
      const topic = trade.topics[topicIndex];
      
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
      
      // Verwandte Links für diesen Artikel
      const relatedSlugs = trade.topics
        .filter((_, idx) => idx !== topicIndex)
        .slice(0, 2)
        .map(t => t.slug);
      
      // API Call mit Rate Limiting
      console.log(`\n📝 Generiere: ${tradeSlug}/${city}/${fullSlug}`);
      console.log(`   Thema: ${topic.title} | Stadt: ${cityName} | Gewerk: ${trade.name}`);
      
      try {
        const apiResponse = await rateLimiter.execute(async () => {
          const messages = buildArticlePrompt(trade.name, cityName, topic, city, tradeSlug);
          return await callMoonshotAPI(messages);
        });
        
        // Validiere API-Response
        if (!apiResponse.title || !apiResponse.h1 || !apiResponse.sections) {
          throw new Error('API-Antwort enthält nicht alle erforderlichen Felder');
        }
        
        // Baue HTML
        const html = buildArticleHTML(apiResponse, tradeSlug, city, cityName, trade.name, topic, monthSlug, relatedSlugs);
        
        fs.writeFileSync(filePath, html, 'utf-8');
        
        // Füge zu Index hinzu
        if (!articleIndex[tradeSlug]) {
          articleIndex[tradeSlug] = {};
        }
        if (!articleIndex[tradeSlug][city]) {
          articleIndex[tradeSlug][city] = [];
        }
        
        // Prüfe ob Eintrag bereits existiert
        const existingIndex = articleIndex[tradeSlug][city].findIndex(a => a.url === `/${tradeSlug}/${city}/blog/${fullSlug}/`);
        const newEntry = {
          title: apiResponse.title,
          excerpt: apiResponse.metaDescription || `Wertvolle Tipps zu ${topic.title} in ${cityName} und dem Ruhrgebiet.`,
          tag: 'Ratgeber',
          gradient: 'from-accent-500 to-accent-700',
          svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>',
          url: `/${tradeSlug}/${city}/blog/${fullSlug}/`
        };
        
        if (existingIndex >= 0) {
          articleIndex[tradeSlug][city][existingIndex] = newEntry;
        } else {
          articleIndex[tradeSlug][city].push(newEntry);
        }
        
        // Zähle Wörter im Artikel
        const wordCount = html.replace(/<[^>]*>/g, '').split(/\s+/).length;
        console.log(`   ✅ Erfolg! ${wordCount} Wörter generiert.`);
        generatedCount++;
        
      } catch (err) {
        console.error(`   ❌ FEHLER: ${err.message}`);
        failedCount++;
        failedArticles.push({ city, trade: tradeSlug, topic: topic.slug, error: err.message });
      }
    }
  }
  
  // Speichere Index
  fs.writeFileSync(indexPath, JSON.stringify(articleIndex, null, 2), 'utf-8');
  
  // Zähle Gesamt-Artikel im Index
  let totalIndexed = 0;
  for (const trade of Object.values(articleIndex)) {
    for (const cityArticles of Object.values(trade)) {
      totalIndexed += cityArticles.length;
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 FERTIG!`);
  console.log(`✅ ${generatedCount} neue Artikel generiert`);
  console.log(`❌ ${failedCount} Fehler`);
  console.log(`📚 Index aktualisiert: ${totalIndexed} Gesamt-Artikel`);
  
  if (failedArticles.length > 0) {
    console.log(`\n⚠️  Fehlgeschlagene Artikel:`);
    failedArticles.forEach(f => console.log(`   - ${f.trade}/${f.city}/${f.topic}: ${f.error}`));
  }
  
  console.log(`\n💡 Nächste Schritte:`);
  console.log(`   git add -A`);
  console.log(`   git commit -m "feat: ${generatedCount} monatliche AI-Artikel (${monthSlug})"`);
  console.log(`   git push`);
}

// Ausführen
main().catch(err => {
  console.error('❌ Kritischer Fehler:', err);
  process.exit(1);
});
