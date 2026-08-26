#!/usr/bin/env node
/**
 * Content Generator für fachschmiede.de Landing Pages
 * 
 * Generiert einzigartigen content_json für jede Landing Page,
 * um Duplicate Content bei Google zu vermeiden.
 * 
 * Usage: node scripts/generate-landing-content.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Fehlende Umgebungsvariablen: NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ═══════════════════════════════════════════
// GEWERKESPEZIFISCHE CONTENT-TEMPLATES
// Jeder Text enthält den Stadtnamen und ist einzigartig
// ═══════════════════════════════════════════
const TRADE_CONTENT_TEMPLATES = {
  'dachdecker': {
    hero_title_template: '{trade} in {city}. Festpreis. Feste Termine.',
    hero_subtitle_template: 'Ein Dach zeigt seine Schwächen meist erst, wenn es zu spät ist – undichte Stellen, lose Ziegel, verstopfte Rinnen. In {city} schauen wir uns Ihr Dach kostenlos an und sagen Ihnen ehrlich, was nötig ist und was warten kann.',
    about_title: 'Ein Betrieb, auf den Sie sich verlassen können',
    about_text_template: 'Ein Dachdeckerbetrieb aus {city}, auf den Sie sich verlassen können. Wir kennen die typischen Dachprobleme in der Region und bieten maßgeschneiderte Lösungen – von der Dachreparatur bis zur kompletten Sanierung.',
    cta_text_template: 'Schnelle Hilfe für {city} und Umgebung',
    faq: [
      { q: 'Was kostet eine Dachreparatur in {city}?', a: 'Die Kosten hängen vom Umfang der Schäden ab. Nach der kostenlosen Besichtigung erhalten Sie einen verbindlichen Festpreis – ohne versteckte Kosten.' },
      { q: 'Wie lange dauert eine Dachsanierung?', a: 'Die Dauer hängt vom Projekt ab. Eine typische Sanierung dauert zwischen einer Woche und drei Wochen. Den genauen Zeitplan erhalten Sie vor Baubeginn schriftlich.' },
      { q: 'Gibt es eine Garantie auf Dacharbeiten?', a: 'Ja, wir gewährleisten auf alle Dacharbeiten eine umfassende Garantie. Die genauen Bedingungen werden im Angebot festgehalten.' },
      { q: 'Bieten Sie kostenlose Besichtigungen an?', a: 'Ja, wir bieten eine kostenlose und unverbindliche Erstbesichtigung vor Ort an. Anschließend erhalten Sie ein schriftliches Festpreisangebot.' },
    ],
    article_titles_template: [
      '5 Anzeichen, dass Ihr Dach in {city} eine Reparatur braucht',
      'Dachsanierung: Kosten und Förderungen in {city}',
      'Notfall-Dachreparatur: Was tun bei Sturmschaden?',
    ],
  },
  'elektriker': {
    hero_title_template: '{trade} in {city}. Sicher. Kompetent. Vor Ort.',
    hero_subtitle_template: 'Ob Stromausfall, neue Elektroinstallation oder Smart-Home-Umstellung – in {city} sind wir Ihr zuverlässiger Partner für alle elektrischen Arbeiten. Kostenlose Erstberatung vor Ort.',
    about_title: 'Ihr Elektrofachbetrieb in der Region',
    about_text_template: 'Als Elektriker in {city} kennen wir die örtlichen Gegebenheiten und die typischen Herausforderungen älterer Elektroinstallationen. Wir arbeiten nach den aktuellen VDE-Vorschriften und dokumentieren alles ordnungsgemäß.',
    cta_text_template: 'Elektro-Notdienst für {city} und Umgebung',
    faq: [
      { q: 'Was kostet eine Elektroinstallation in {city}?', a: 'Die Kosten hängen vom Umfang der Installation ab. Nach der kostenlosen Besichtigung erhalten Sie einen verbindlichen Festpreis – ohne versteckte Kosten.' },
      { q: 'Wie lange dauert eine Elektroinstallation?', a: 'Die Dauer hängt vom Projekt ab. Eine typische Installation dauert zwischen einem Tag und einer Woche. Den genauen Zeitplan erhalten Sie vor Baubeginn schriftlich.' },
      { q: 'Sind Sie für Smart-Home-Installationen qualifiziert?', a: 'Ja, wir sind spezialisiert auf Smart-Home-Systeme und beraten Sie gerne zu den besten Lösungen für Ihr Zuhause in {city}.' },
      { q: 'Bieten Sie kostenlose Besichtigungen an?', a: 'Ja, wir bieten eine kostenlose und unverbindliche Erstbesichtigung vor Ort an. Anschließend erhalten Sie ein schriftliches Festpreisangebot.' },
    ],
    article_titles_template: [
      '5 Gründe für eine Elektroprüfung in {city}',
      'Smart-Home: Die besten Systeme für {city}',
      'Stromausfall: Schnelle Hilfe in {city}',
    ],
  },
  'klempner': {
    hero_title_template: '{trade} in {city}. Sauber. Schnell. Fair.',
    hero_subtitle_template: 'Rohrbruch, verstopfter Abfluss oder neue Heizungsinstallation? In {city} helfen wir Ihnen schnell und zuverlässig – mit transparenten Preisen und terminlicher Zuverlässigkeit.',
    about_title: 'Ihr Sanitärfachbetrieb vor Ort',
    about_text_template: 'Als erfahrener Klempner in {city} kennen wir die typischen Probleme der Region – von alten Bleirohren bis zu modernen Heizungssystemen. Wir finden die passende Lösung für Ihr Projekt.',
    cta_text_template: 'Sanitär-Notdienst für {city} und Umgebung',
    faq: [
      { q: 'Was kostet eine Rohrreinigung in {city}?', a: 'Die Kosten hängen von der Art der Verstopfung ab. Nach der kostenlosen Besichtigung erhalten Sie einen verbindlichen Festpreis – ohne versteckte Kosten.' },
      { q: 'Wie lange dauert eine Heizungsinstallation?', a: 'Die Dauer hängt vom Projekt ab. Eine typische Installation dauert zwischen einem Tag und drei Tagen. Den genauen Zeitplan erhalten Sie vor Baubeginn schriftlich.' },
      { q: 'Bieten Sie Notdienst an?', a: 'Ja, wir bieten einen 24/7 Notdienst für Rohrbrüche und Wasserschäden in {city} und Umgebung an.' },
      { q: 'Bieten Sie kostenlose Besichtigungen an?', a: 'Ja, wir bieten eine kostenlose und unverbindliche Erstbesichtigung vor Ort an. Anschließend erhalten Sie ein schriftliches Festpreisangebot.' },
    ],
    article_titles_template: [
      '5 Anzeichen für einen Rohrbruch in {city}',
      'Heizungswartung: Wann ist der richtige Zeitpunkt?',
      'Wasserschaden: Schnelle Hilfe in {city}',
    ],
  },
  'garten-und-landschaftsbau': {
    hero_title_template: '{trade} in {city}. Ihr Garten. Unsere Leidenschaft.',
    hero_subtitle_template: 'Von der Gartenpflege über die Neugestaltung bis zur professionellen Baumpflege – in {city} verwandeln wir Ihren Garten in eine Wohlfühloase. Kostenlose Beratung vor Ort.',
    about_title: 'Grünanlagen-Experten in Ihrer Region',
    about_text_template: 'Als Garten- und Landschaftsbau in {city} kennen wir die örtlichen Bodenverhältnisse, das Klima und die typischen Gartenherausforderungen der Region. Wir schaffen Gärten, die Freude bereiten und pflegeleicht sind.',
    cta_text_template: 'Garten-Experten für {city} und Umgebung',
    faq: [
      { q: 'Was kostet Gartenpflege in {city}?', a: 'Die Kosten hängen von der Größe Ihres Gartens und dem Umfang der Arbeiten ab. Nach der kostenlosen Besichtigung erhalten Sie einen verbindlichen Festpreis – ohne versteckte Kosten.' },
      { q: 'Wann ist der beste Zeitpunkt für eine Gartengestaltung?', a: 'Der beste Zeitpunkt ist der Frühling oder Herbst. Wir beraten Sie gerne zu den idealen Pflanzzeiten für {city}.' },
      { q: 'Bieten Sie auch Baumpflege an?', a: 'Ja, wir sind spezialisiert auf professionelle Baumpflege, Baumschnitt und Baumentfernung in {city} und Umgebung.' },
      { q: 'Bieten Sie kostenlose Besichtigungen an?', a: 'Ja, wir bieten eine kostenlose und unverbindliche Erstbesichtigung vor Ort an. Anschließend erhalten Sie ein schriftliches Festpreisangebot.' },
    ],
    article_titles_template: [
      '5 Tipps für den pflegeleichten Garten in {city}',
      'Hecke schneiden: Der beste Zeitpunkt im Ruhrgebiet',
      'Baumpflege: Wann ist professionelle Hilfe nötig?',
    ],
  },
  'bestatter': {
    hero_title_template: '{trade} in {city}. Würdevoll. Menschlich. Nahe.',
    hero_subtitle_template: 'In schwierigen Zeiten brauchen Sie einen verlässlichen Partner an Ihrer Seite. Wir begleiten Familien in {city} mit Würde, Respekt und professioneller Beratung bei der letzten Reise Ihres Angehörigen.',
    about_title: 'Ein Bestattungshaus, das Sie versteht',
    about_text_template: 'Als erfahrener Bestatter in {city} wissen wir, wie wichtig es ist, in Trauerfällen schnell, diskret und einfühlsam zu handeln. Wir übernehmen alle Formalitäten und gestalten die Trauerfeier nach Ihren Wünschen.',
    cta_text_template: '24h Erreichbar für {city} und Umgebung',
    faq: [
      { q: 'Was kostet eine Bestattung in {city}?', a: 'Die Kosten hängen von der Art der Bestattung ab. Wir bieten transparente Preise und beraten Sie gerne zu den verschiedenen Möglichkeiten.' },
      { q: 'Welche Bestattungsarten bieten Sie an?', a: 'Wir bieten Erdbestattungen, Urnenbestattungen, Seebestattungen und naturverträgliche Bestattungen in {city} und Umgebung an.' },
      { q: 'Sind Sie rund um die Uhr erreichbar?', a: 'Ja, wir sind 24 Stunden am Tag, 7 Tage die Woche für Sie erreichbar. In Trauerfällen reagieren wir sofort.' },
      { q: 'Übernehmen Sie die Formalitäten?', a: 'Ja, wir übernehmen alle behördlichen Formalitäten und Meldungen für Sie, damit Sie sich in dieser schweren Zeit um das Wichtigste kümmern können.' },
    ],
    article_titles_template: [
      'Bestattungsvorsorge: So entlasten Sie Ihre Angehörigen in {city}',
      'Die verschiedenen Bestattungsarten im Überblick',
      'Trauerfeier gestalten: Ideen für eine würdevolle Abschiedszeremonie',
    ],
  },
};

// ═══════════════════════════════════════════
// HILFSFUNKTIONEN
// ═══════════════════════════════════════════
function fillTemplate(template, city, trade) {
  return template
    .replace(/\{city\}/g, city)
    .replace(/\{trade\}/g, trade);
}

function generateContent(tradeSlug, cityName, tradeName) {
  const template = TRADE_CONTENT_TEMPLATES[tradeSlug] || TRADE_CONTENT_TEMPLATES['dachdecker'];
  
  return {
    hero_title: fillTemplate(template.hero_title_template, cityName, tradeName),
    hero_subtitle: fillTemplate(template.hero_subtitle_template, cityName, tradeName),
    about_title: template.about_title,
    about_text: fillTemplate(template.about_text_template, cityName, tradeName),
    cta_text: fillTemplate(template.cta_text_template, cityName, tradeName),
    faq: template.faq.map(f => ({
      q: fillTemplate(f.q, cityName, tradeName),
      a: fillTemplate(f.a, cityName, tradeName),
    })),
    article_titles: template.article_titles_template.map(t => fillTemplate(t, cityName, tradeName)),
  };
}

// ═══════════════════════════════════════════
// HAUPTFUNKTION
// ═══════════════════════════════════════════
async function main() {
  console.log('🚀 Content Generator gestartet...\n');
  
  // Alle Landing Pages laden
  const { data: pages, error } = await supabase
    .from('landing_pages')
    .select('id, slug, trade_id, city_id, status, content_json, trade:trades(slug, name), city:cities(name)');
  
  if (error) {
    console.error('❌ Fehler beim Laden der Landing Pages:', error.message);
    process.exit(1);
  }
  
  console.log(`📋 ${pages.length} Landing Pages gefunden\n`);
  
  let updated = 0;
  let skipped = 0;
  
  for (const page of pages) {
    const tradeSlug = page.trade?.slug;
    const tradeName = page.trade?.name;
    const cityName = page.city?.name;
    
    if (!tradeSlug || !cityName) {
      console.log(`⏭️  Übersprungen: ${page.slug} (fehlende Trade/City Daten)`);
      skipped++;
      continue;
    }
    
    // Prüfen ob bereits content_json vorhanden
    if (page.content_json && Object.keys(page.content_json).length > 0) {
      console.log(`⏭️  Übersprungen: ${page.slug} (bereits Content vorhanden)`);
      skipped++;
      continue;
    }
    
    // Content generieren
    const content = generateContent(tradeSlug, cityName, tradeName);
    
    // In DB speichern
    const { error: updateError } = await supabase
      .from('landing_pages')
      .update({ content_json: content })
      .eq('id', page.id);
    
    if (updateError) {
      console.error(`❌ Fehler beim Speichern von ${page.slug}:`, updateError.message);
    } else {
      console.log(`✅ ${page.slug}: Content generiert (${content.hero_title.substring(0, 50)}...)`);
      updated++;
    }
  }
  
  console.log(`\n📊 Zusammenfassung:`);
  console.log(`   ✅ Aktualisiert: ${updated}`);
  console.log(`   ⏭️  Übersprungen: ${skipped}`);
  console.log(`   📈 Total: ${pages.length}`);
  
  if (updated > 0) {
    console.log(`\n🔥 Content wurde erfolgreich generiert!`);
    console.log(`   Jede Seite hat jetzt einzigartigen Text für SEO.`);
  }
}

main().catch(err => {
  console.error('❌ Unbehandelter Fehler:', err);
  process.exit(1);
});
