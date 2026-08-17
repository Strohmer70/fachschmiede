#!/usr/bin/env node
/**
 * Monatlicher Artikel-Generator für fachschmiede.de
 * 
 * Nutzt die echte Kimi/Moonshot API zur Generierung einzigartiger,
 * SEO-optimierter Artikel pro Stadt und Gewerk.
 * 
 * Mietplan:
 * - Freie Stadt: 1 Artikel/Monat
 * - Basic: 2 Artikel/Monat
 * - Pro: 4 Artikel/Monat
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// ─── KONFIGURATION ──────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const MOONSHOT_API_URL = process.env.MOONSHOT_API_URL || 'https://api.moonshot.ai/v1/chat/completions';

const CITIES = [
  'bergkamen', 'bochum', 'castrop-rauxel', 'dortmund', 'ennepetal',
  'froendenberg', 'gevelsberg', 'hagen', 'hattingen', 'herne',
  'holzwickede', 'iserlohn', 'kamen', 'luenen', 'schwelm',
  'schwerte', 'sprockhoevel', 'unna', 'wetter-ruhr', 'witten'
];

// Stadtname Mapping (schöne Display-Namen)
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
      { slug: 'dachdaemmung-kosten', title: 'Dachdämmung Kosten', keyword: 'Dachdämmung' },
      { slug: 'sturmschaden-reparatur', title: 'Sturmschaden Reparatur', keyword: 'Sturmschaden Dach' },
      { slug: 'dachsanierung-planen', title: 'Dachsanierung planen', keyword: 'Dachsanierung' },
      { slug: 'dachziegel-arten', title: 'Dachziegel Arten', keyword: 'Dachziegel' },
      { slug: 'dachfenster-einbauen', title: 'Dachfenster einbauen', keyword: 'Dachfenster' },
      { slug: 'flachdach-abdichten', title: 'Flachdach abdichten', keyword: 'Flachdach Abdichtung' },
      { slug: 'dachrinne-reinigen', title: 'Dachrinne reinigen', keyword: 'Dachrinnenreinigung' },
      { slug: 'schornstein-sanieren', title: 'Schornstein sanieren', keyword: 'Schornsteinsanierung' },
      { slug: 'dachboden-ausbauen', title: 'Dachboden ausbauen', keyword: 'Dachbodenausbau' },
      { slug: 'dach-haltbarkeit', title: 'Dach Haltbarkeit', keyword: 'Dachlebensdauer' },
      { slug: 'gruendach-anlegen', title: 'Gründach anlegen', keyword: 'Gründach' },
      { slug: 'dachholz-schutz', title: 'Dachholz Schutz', keyword: 'Holzschutz Dach' },
    ]
  },
  elektriker: {
    name: 'Elektriker',
    topics: [
      { slug: 'e-check-2026', title: 'E-Check 2026', keyword: 'Elektro-Check' },
      { slug: 'led-beleuchtung', title: 'LED Beleuchtung', keyword: 'LED Beleuchtung' },
      { slug: 'sicherungskasten-erneuern', title: 'Sicherungskasten erneuern', keyword: 'Sicherungskasten' },
      { slug: 'elektroheizung-effizienz', title: 'Elektroheizung Effizienz', keyword: 'Elektroheizung' },
      { slug: 'photovoltaik-anschluss', title: 'Photovoltaik Anschluss', keyword: 'Photovoltaik' },
      { slug: 'stromausfall-ursachen', title: 'Stromausfall Ursachen', keyword: 'Stromausfall' },
      { slug: 'erdung-pruefen', title: 'Erdung prüfen', keyword: 'Erdung' },
      { slug: 'kuechenelektro-planen', title: 'Küchenelektro planen', keyword: 'Küchenelektro' },
      { slug: 'badezimmer-elektro', title: 'Badezimmer Elektro', keyword: 'Badezimmer Elektro' },
      { slug: 'smart-meter-vorteile', title: 'Smart Meter Vorteile', keyword: 'Smart Meter' },
      { slug: 'blitzschutz-nachruesten', title: 'Blitzschutz nachrüsten', keyword: 'Blitzschutz' },
      { slug: 'stromkosten-senken', title: 'Stromkosten senken', keyword: 'Stromkosten sparen' },
    ]
  },
  klempner: {
    name: 'Klempner',
    topics: [
      { slug: 'wasserdruck-optimieren', title: 'Wasserdruck optimieren', keyword: 'Wasserdruck' },
      { slug: 'abfluss-verstopft', title: 'Abfluss verstopft', keyword: 'Verstopfter Abfluss' },
      { slug: 'warmwasserspeicher-tauschen', title: 'Warmwasserspeicher tauschen', keyword: 'Warmwasserspeicher' },
      { slug: 'fussbodenheizung-wartung', title: 'Fußbodenheizung Wartung', keyword: 'Fußbodenheizung' },
      { slug: 'gasleitung-pruefen', title: 'Gasleitung prüfen', keyword: 'Gasleitung' },
      { slug: 'wasserenthaertung-anlagen', title: 'Wasserenthärtung Anlagen', keyword: 'Wasserenthärtung' },
      { slug: 'heizkoerper-entlueften', title: 'Heizkörper entlüften', keyword: 'Heizkörper entlüften' },
      { slug: 'trinkwasserqualitaet', title: 'Trinkwasserqualität', keyword: 'Trinkwasser' },
      { slug: 'sanitaer-notdienst', title: 'Sanitär Notdienst', keyword: 'Sanitär Notdienst' },
      { slug: 'badrenovierung-planen', title: 'Badrenovierung planen', keyword: 'Badrenovierung' },
      { slug: 'armaturen-wechseln', title: 'Armaturen wechseln', keyword: 'Armaturen' },
      { slug: 'wasserschaden-sanierung', title: 'Wasserschaden Sanierung', keyword: 'Wasserschaden' },
    ]
  },
  maler: {
    name: 'Maler',
    topics: [
      { slug: 'tapezierarbeiten-kosten', title: 'Tapezierarbeiten Kosten', keyword: 'Tapezieren' },
      { slug: 'spachteln-und-streichen', title: 'Spachteln und streichen', keyword: 'Spachteln Streichen' },
      { slug: 'fassadensanierung-2026', title: 'Fassadensanierung 2026', keyword: 'Fassadensanierung' },
      { slug: 'decken-verkleiden', title: 'Decken verkleiden', keyword: 'Deckenverkleidung' },
      { slug: 'lasuren-holzschutz', title: 'Lasuren Holzschutz', keyword: 'Lasuren' },
      { slug: 'schoener-wohnen-farben', title: 'Schöner Wohnen Farben', keyword: 'Wandfarben' },
      { slug: 'anstrich-daemmschicht', title: 'Anstrich Dämmschicht', keyword: 'Dämmfarbe' },
      { slug: 'malerkosten-pro-qm', title: 'Malerkosten pro m²', keyword: 'Malerkosten' },
      { slug: 'tapeten-trends', title: 'Tapeten Trends', keyword: 'Tapeten' },
      { slug: 'besenstrich-technik', title: 'Besenstrich Technik', keyword: 'Besenstrich' },
      { slug: 'keller-anstreichen', title: 'Keller anstreichen', keyword: 'Keller streichen' },
      { slug: 'lackierarbeiten-moebel', title: 'Lackierarbeiten Möbel', keyword: 'Möbel lackieren' },
    ]
  },
  zimmerer: {
    name: 'Zimmerer',
    topics: [
      { slug: 'holzschutz-terrassen', title: 'Holzschutz Terrassen', keyword: 'Terrassen Holzschutz' },
      { slug: 'carport-planung', title: 'Carport Planung', keyword: 'Carport' },
      { slug: 'gauben-ausbauen', title: 'Gauben ausbauen', keyword: 'Gaube' },
      { slug: 'holzrahmenbau-haus', title: 'Holzrahmenbau Haus', keyword: 'Holzrahmenbau' },
      { slug: 'carport-dach-arten', title: 'Carport Dach Arten', keyword: 'Carport Dach' },
      { slug: 'holzterrasse-verlegen', title: 'Holzterrasse verlegen', keyword: 'Holzterrasse' },
      { slug: 'zimmerei-traditionell', title: 'Zimmerei traditionell', keyword: 'Zimmerei' },
      { slug: 'holzschutz-mittel', title: 'Holzschutz Mittel', keyword: 'Holzschutzmittel' },
      { slug: 'dachstuhl-reparatur', title: 'Dachstuhl Reparatur', keyword: 'Dachstuhl' },
      { slug: 'wintergarten-holz', title: 'Wintergarten Holz', keyword: 'Wintergarten' },
      { slug: 'holzcarport-vs-metall', title: 'Holzcarport vs Metall', keyword: 'Carport Holz Metall' },
      { slug: 'zimmermann-kosten', title: 'Zimmermann Kosten', keyword: 'Zimmermann Kosten' },
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
  return CITY_DISPLAY_NAMES[citySlug] || citySlug.charAt(0).toUpperCase() + citySlug.slice(1).replace(/-/g, ' ');
}

function generateUnsplashUrl(topic, width = 1200) {
  const topicImages = {
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
    'wasserdruck-optimieren': 'wasserhahn,druck,armatur',
    'abfluss-verstopft': 'abfluss,verstopfung,rohr',
    'warmwasserspeicher-tauschen': 'boiler,warmwasser,heizung',
    'fussbodenheizung-wartung': 'fussbodenheizung,boden,warm',
    'gasleitung-pruefen': 'gas,leitung,pruefung',
    'wasserenthaertung-anlagen': 'wasser,filter,anlage',
    'heizkoerper-entlueften': 'heizkoerper,heizung,warm',
    'trinkwasserqualitaet': 'wasserhahn,trinkwasser,glas',
    'sanitaer-notdienst': 'notdienst,werkzeug,plumber',
    'badrenovierung-planen': 'bad,badezimmer,renovierung',
    'armaturen-wechseln': 'armatur,wasserhahn,messing',
    'wasserschaden-sanierung': 'wasserschaden,trocknung,bauseite',
    'tapezierarbeiten-kosten': 'tapete,tapezieren,wand',
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
      "url": `https://fachschmiede.de/${tradeName.toLowerCase()}/${city.toLowerCase().replace(/\s/g, '-')}/`
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

// ─── KIMI API FUNKTIONEN ────────────────────────────────────────────

async function callKimiAPI(prompt, maxRetries = 3) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MOONSHOT_API_KEY}`
  };

  const body = {
    model: 'kimi-k2.6',
    messages: [
      {
        role: 'system',
        content: 'Du bist ein erfahrener deutscher SEO-Content-Writer spezialisiert auf Handwerker- und Baubranche im Ruhrgebiet. Du schreibst fundierte, lokale Ratgeber-Artikel.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 8000
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`   🌐 API-Call Versuch ${attempt}/${maxRetries}...`);
      
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
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      }
      
      throw new Error('Ungültige API-Antwortstruktur');
    } catch (error) {
      console.error(`   ❌ Versuch ${attempt} fehlgeschlagen: ${error.message}`);
      
      if (attempt === maxRetries) {
        throw new Error(`API-Call nach ${maxRetries} Versuchen fehlgeschlagen: ${error.message}`);
      }
      
      // Exponentielles Backoff
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      console.log(`   ⏳ Warte ${Math.round(delay/1000)}s vor nächstem Versuch...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function generateArticleContent(tradeSlug, citySlug, cityName, tradeName, topic) {
  const { slug, title: topicTitle, keyword } = topic;
  
  const prompt = `Schreibe einen umfassenden, SEO-optimierten Ratgeber-Artikel über "${topicTitle}" in ${cityName}.

ANFORDERUNGEN:
- Länge: 1200-1500 Wörter (absolutes Minimum: 1000 Wörter)
- Sprache: Deutsch (Deutschland)
- Zielgruppe: Hausbesitzer und Immobilieneigentümer in ${cityName}
- Ton: Professionell, vertrauenswürdig, lokal verbunden

LOKALE BEZÜGE (MÜSSEN enthalten sein):
- Erwähne "${cityName}" mindestens 8-10 Mal natürlich im Text
- Erwähne "Ruhrgebiet" mindestens 3-4 Mal
- Bezug auf lokale Gegebenheiten: Altbautypen aus den 60er/70er Jahren, Kohleabbau- Geschichte, typische Bausubstanz
- Erwähne regionale Besonderheiten von ${cityName} wenn möglich

STRUKTUR (Muss exakt eingehalten werden):
1. EINLEITUNG (150-200 Wörter): Ansprechende Einleitung mit Bezug zu ${cityName}
2. WARUM DAS THEMA WICHTIG IST (200-250 Wörter): Lokale Relevanz, Klima, Bausubstanz
3. DIE 5 WICHTIGSTEN PUNKTE (250-300 Wörter): Praktische Tipps mit Bezug auf ${cityName}
4. KOSTEN IN ${cityName.toUpperCase()} (200-250 Wörter): Realistische Preise, Fördermöglichkeiten, KfW, BAFA
5. FAQ (4-5 Fragen): Häufige Fragen mit konkreten Antworten für ${cityName}
6. FAZIT (150-200 Wörter): Zusammenfassung + Handlungsaufruf

SEO-ANFORDERUNGEN:
- Haupt-Keyword: "${keyword} ${cityName}"
- Natürliche Keyword-Einbettung
- Überschriften mit H2-Tags (markdown ##)
- Kurze Absätze (3-4 Sätze)
- Aufzählungspunkte wo sinnvoll
- Konkrete Zahlen und Preise

GIB NUR DEN REINEN ARTIKEL-TEXT ZURÜCK (keine Meta-Infos, keine Erklärungen). Verwende Markdown-Formatierung mit ## für Überschriften.`;

  const content = await callKimiAPI(prompt);
  return content;
}

async function generateFAQs(tradeSlug, citySlug, cityName, tradeName, topic) {
  const { slug, title: topicTitle, keyword } = topic;
  
  const prompt = `Erstelle 4-5 relevante FAQ-Einträge für "${topicTitle}" in ${cityName}.

Format pro FAQ:
FRAGE: [Konkrete Frage]
ANTWORT: [Detaillierte Antwort mit Bezug zu ${cityName}, 2-3 Sätze]

Themen für FAQs:
- Kosten in ${cityName}
- Dauer der Arbeiten
- Genehmigungen/Baugenehmigung
- Ob man während der Arbeiten im Haus bleiben kann
- Garantie/Gewährleistung

GIB NUR FAQS ZURÜCK, JEDE im Format:
FRAGE: ...
ANTWORT: ...`;

  const faqText = await callKimiAPI(prompt);
  
  // Parse FAQs
  const faqs = [];
  const lines = faqText.split('\n');
  let currentQ = null;
  let currentA = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('FRAGE:')) {
      if (currentQ) {
        faqs.push({ q: currentQ, a: currentA.trim() });
      }
      currentQ = trimmed.replace('FRAGE:', '').trim();
      currentA = '';
    } else if (trimmed.startsWith('ANTWORT:')) {
      currentA = trimmed.replace('ANTWORT:', '').trim();
    } else if (currentQ && trimmed) {
      currentA += ' ' + trimmed;
    }
  }
  
  if (currentQ) {
    faqs.push({ q: currentQ, a: currentA.trim() });
  }
  
  // Fallback FAQs wenn das Parsing fehlschlägt
  if (faqs.length === 0) {
    return [
      { q: `Wie lange dauert ${topicTitle} in ${cityName}?`, a: `Die Dauer hängt vom Umfang ab. In der Regel rechnen Sie mit 1 bis 3 Werktagen für Standardarbeiten. Bei umfangreicheren Projekten in ${cityName} kann es auch 1 bis 2 Wochen dauern.` },
      { q: `Was kostet ${topicTitle} in ${cityName}?`, a: `Die Kosten variieren je nach Umfang und Material. Für eine Standard-Lösung in ${cityName} können Sie mit 500 bis 2.000 Euro rechnen. Holen Sie sich am besten mehrere kostenlose Angebote ein.` },
      { q: `Benötige ich eine Genehmigung für ${topicTitle} in ${cityName}?`, a: `Das kommt auf das Projekt an. Kleine Reparaturen sind in der Regel genehmigungsfrei. Bei größeren Umbauten in ${cityName} sollten Sie sich vorab beim Bauamt erkundigen.` },
      { q: `Kann ich während der Arbeiten im Haus wohnen bleiben?`, a: `In den meisten Fällen ja. Bei ${topicTitle} in ${cityName} wird in der Regel nur einzelne Bereiche bearbeitet, sodass Sie normal im Haus wohnen können.` }
    ];
  }
  
  return faqs;
}

async function generateHowToSteps(tradeSlug, citySlug, cityName, tradeName, topic) {
  const { slug, title: topicTitle, keyword } = topic;
  
  const prompt = `Erstelle 5 praktische HowTo-Schritte für "${topicTitle}" in ${cityName}.

Format pro Schritt:
SCHRITT [Nummer]: [Titel]
BESCHREIBUNG: [2-3 Sätze mit konkreten Tipps für ${cityName}]

GIB NUR DIE SCHRITTE ZURÜCK im Format:
SCHRITT 1: ...
BESCHREIBUNG: ...`;

  const howToText = await callKimiAPI(prompt);
  
  // Parse HowTo Steps
  const steps = [];
  const lines = howToText.split('\n');
  let currentName = null;
  let currentText = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    const stepMatch = trimmed.match(/^SCHRITT\s*\d*[:\.]?\s*(.+)/i);
    
    if (stepMatch) {
      if (currentName) {
        steps.push({ name: currentName, text: currentText.trim() });
      }
      currentName = stepMatch[1].trim();
      currentText = '';
    } else if (trimmed.toLowerCase().startsWith('beschreibung:')) {
      currentText = trimmed.replace(/beschreibung[:\.]?/i, '').trim();
    } else if (currentName && trimmed) {
      currentText += ' ' + trimmed;
    }
  }
  
  if (currentName) {
    steps.push({ name: currentName, text: currentText.trim() });
  }
  
  // Fallback
  if (steps.length === 0) {
    return [
      { name: 'Bedarf analysieren', text: `Definieren Sie Ihre Anforderungen für ${topicTitle} in ${cityName}. Welches Budget haben Sie? Welche Termine sind realistisch?` },
      { name: 'Fachbetrieb wählen', text: `Vergleichen Sie mindestens 3 Fachbetriebe aus ${cityName}. Achten Sie auf Meisterbetrieb, Referenzen und Gewährleistung.` },
      { name: 'Angebot einholen', text: `Lassen Sie sich ein detailliertes, schriftliches Angebot unterbreiten. Prüfen Sie Leistungsumfang, Material und Termine.` },
      { name: 'Auftrag erteilen', text: `Nach Prüfung des Angebots erteilen Sie den Auftrag. Vereinbaren Sie einen festen Termin und klären Sie alle Details.` },
      { name: 'Abnahme & Zahlung', text: `Nach Fertigstellung prüfen Sie die Arbeiten. Bei Zufriedenheit erfolgt die Abnahme und Zahlung gemäß Vereinbarung.` }
    ];
  }
  
  return steps;
}

// ─── ARTIKEL-HTML-GENERATOR ─────────────────────────────────────────

function generateArticleHTML(tradeSlug, citySlug, cityName, tradeName, topic, monthSlug, articleContent, faqs, howToSteps, relatedSlugs) {
  const { slug, title: topicTitle, keyword } = topic;
  const fullSlug = `${slug}-${monthSlug}`;
  const title = `${topicTitle} in ${cityName}: Ratgeber & Kosten ${new Date().getFullYear()}`;
  const h1 = `${topicTitle} in ${cityName}: Was Sie wissen müssen`;
  const meta = `${topicTitle} in ${cityName} ✓ Fachbetriebe ✓ Kosten ✓ Tipps ✓ Förderung. Erfahren Sie alles Wichtige in unserem ${new Date().getFullYear()}-Ratgeber.`;
  const image = generateUnsplashUrl(slug);
  const imgAlt = `${topicTitle} in ${cityName} - Kosten und Förderung ${new Date().getFullYear()}`;
  const imgCaption = `${topicTitle} in ${cityName} und dem Ruhrgebiet`;
  
  const today = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  
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
  
  // Convert markdown content to HTML
  const contentHTML = articleContent
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^\*\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^\-\s+(.+)$/gm, '<li>$1</li>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .split('\n\n')
    .map(para => {
      const trimmed = para.trim();
      if (trimmed.startsWith('<h2>') || trimmed.startsWith('<h3>') || trimmed.startsWith('<li>')) return trimmed;
      if (trimmed) return `<p>${trimmed}</p>`;
      return '';
    })
    .join('\n');
  
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
h2{font-size:1.5rem;font-weight:700;margin:40px 0 20px;color:#0f172a}
h3{font-size:1.25rem;font-weight:600;margin:30px 0 15px;color:#1e293b}
.meta{color:#94a3b8;font-size:0.9rem}
.hero-image{width:100%;height:400px;object-fit:cover;display:block}
.img-caption{text-align:center;color:#64748b;font-size:0.875rem;padding:8px 0;font-style:italic}
.content{background:white;margin:40px auto;padding:40px;border-radius:16px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)}
p{margin-bottom:20px;color:#475569;line-height:1.8}
ul{margin:20px 0;padding-left:24px}
li{margin-bottom:12px;color:#475569}
strong{color:#0f172a}
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

${contentHTML}

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
  console.log('🚀 Monatlicher Artikel-Generator mit Kimi API gestartet');
  console.log(`📅 Monat: ${getMonthSlug()}`);
  console.log(`🌐 API-URL: ${MOONSHOT_API_URL}`);
  
  // Prüfe Umgebungsvariablen
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
  console.log(`⚡ Rate-Limit: Max 1 API-Call alle 3 Sekunden`);
  
  // Lade bestehenden Index
  const indexPath = path.join(process.cwd(), 'lib', 'article-index.json');
  let articleIndex = {};
  try {
    articleIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  } catch {
    articleIndex = {};
  }
  
  // Generiere Artikel
  const monthSlug = getMonthSlug();
  let generatedCount = 0;
  let apiCalls = 0;
  
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
      
      // Erstelle Artikel
      const fullSlug = `${topic.slug}-${monthSlug}`;
      const filePath = path.join(process.cwd(), 'public', 'blog', tradeSlug, city, `${fullSlug}.html`);
      
      // Prüfe ob Artikel bereits existiert
      if (fs.existsSync(filePath)) {
        console.log(`⏭️  Überspringe (existiert): ${tradeSlug}/${city}/${fullSlug}`);
        continue;
      }
      
      console.log(`\n📝 Generiere: ${tradeSlug}/${city}/${fullSlug}`);
      console.log(`   Thema: ${topic.title} | Stadt: ${cityName} | Gewerk: ${trade.name}`);
      
      try {
        // Generiere Artikel-Content per API
        console.log(`   ✍️  Rufe Kimi API für Artikel-Content auf...`);
        const articleContent = await generateArticleContent(tradeSlug, city, cityName, trade.name, topic);
        apiCalls++;
        
        // Warte 3 Sekunden vor nächstem API-Call (Rate-Limit)
        await new Promise(r => setTimeout(r, 3000));
        
        // Generiere FAQs
        console.log(`   ❓ Generiere FAQs...`);
        const faqs = await generateFAQs(tradeSlug, city, cityName, trade.name, topic);
        apiCalls++;
        
        await new Promise(r => setTimeout(r, 3000));
        
        // Generiere HowTo Steps
        console.log(`   📝 Generiere HowTo-Schritte...`);
        const howToSteps = await generateHowToSteps(tradeSlug, city, cityName, trade.name, topic);
        apiCalls++;
        
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
        
        const html = generateArticleHTML(tradeSlug, city, cityName, trade.name, topic, monthSlug, articleContent, faqs, howToSteps, relatedSlugs);
        
        fs.writeFileSync(filePath, html, 'utf-8');
        
        // Füge zu Index hinzu
        if (!articleIndex[tradeSlug]) {
          articleIndex[tradeSlug] = {};
        }
        if (!articleIndex[tradeSlug][city]) {
          articleIndex[tradeSlug][city] = [];
        }
        
        // Prüfe ob bereits im Index
        const existingIndex = articleIndex[tradeSlug][city].findIndex(a => a.url.includes(fullSlug));
        if (existingIndex === -1) {
          articleIndex[tradeSlug][city].push({
            title: `${topic.title} in ${cityName}`,
            excerpt: `Wertvolle Tipps zu ${topic.title} in ${cityName} und dem Ruhrgebiet.`,
            tag: 'Ratgeber',
            gradient: 'from-accent-500 to-accent-700',
            svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>',
            url: `/${tradeSlug}/${city}/blog/${fullSlug}/`
          });
        }
        
        console.log(`   ✅ Erfolgreich generiert! (${articleContent.length} Zeichen)`);
        generatedCount++;
        
        // Warte vor nächster Stadt (Rate-Limit)
        if (generatedCount < totalArticles) {
          console.log(`   ⏳ Warte 5s vor nächstem Artikel...`);
          await new Promise(r => setTimeout(r, 5000));
        }
        
      } catch (error) {
        console.error(`   ❌ Fehler bei Generierung: ${error.message}`);
        console.log(`   ⚠️  Überspringe diesen Artikel und fahre fort...`);
        continue;
      }
    }
  }
  
  // Speichere Index
  fs.writeFileSync(indexPath, JSON.stringify(articleIndex, null, 2), 'utf-8');
  
  // Zähle Gesamt-Artikel im verschachtelten Index
  let totalIndexedArticles = 0;
  for (const trade of Object.values(articleIndex)) {
    for (const cityArticles of Object.values(trade)) {
      totalIndexedArticles += cityArticles.length;
    }
  }
  
  console.log(`\n🎉 Fertig! ${generatedCount} neue Artikel generiert.`);
  console.log(`🌐 Insgesamt ${apiCalls} API-Calls an Kimi/Moonshot`);
  console.log(`📚 Index aktualisiert: ${totalIndexedArticles} Gesamt-Artikel`);
  
  // Git commit Info
  console.log(`\n💡 Nächste Schritte:`);
  console.log(`   git add -A`);
  console.log(`   git commit -m "feat: ${generatedCount} monatliche Artikel mit Kimi API (${monthSlug})"`);
  console.log(`   git push`);
}

// Ausführen
main().catch(err => {
  console.error('❌ Kritischer Fehler:', err);
  process.exit(1);
});
