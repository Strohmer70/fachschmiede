const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tlxlkmewbhnpzvrphcq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const MOONSHOT_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function callKimiAPI(prompt) {
  const response = await fetch(MOONSHOT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MOONSHOT_API_KEY}`
    },
    body: JSON.stringify({
      model: 'kimi-k2.6',
      messages: [
        { role: 'system', content: 'Du bist ein erfahrener deutscher SEO-Content-Writer spezialisiert auf Handwerker- und Baubranche im Ruhrgebiet. Du schreibst fundierte, lokale Ratgeber-Artikel.' },
        { role: 'user', content: prompt }
      ],
      temperature: 1,
      max_tokens: 8000
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  console.log('   📥 API Response structure:', Object.keys(data));
  console.log('   📥 Choices count:', data.choices?.length);
  
  if (data.choices?.[0]?.message?.content) {
    return data.choices[0].message.content;
  }
  
  console.log('   ⚠️  Full response:', JSON.stringify(data, null, 2).substring(0, 500));
  throw new Error('Kein Content in API-Antwort');
}

async function main() {
  console.log('🧪 TESTLAUF: Einzelner Artikel mit Kimi API');
  console.log('============================================');
  
  const citySlug = 'hattingen';
  const cityName = 'Hattingen';
  const tradeSlug = 'dachdecker';
  const tradeName = 'Dachdecker';
  const topic = { slug: 'dachdaemmung-kosten', title: 'Dachdämmung Kosten', keyword: 'Dachdämmung' };
  
  const prompt = `Schreibe einen umfassenden, SEO-optimierten Ratgeber-Artikel über "${topic.title}" in ${cityName}.

ANFORDERUNGEN:
- Länge: 1200-1500 Wörter (absolutes Minimum: 1000 Wörter)
- Sprache: Deutsch (Deutschland)
- Zielgruppe: Hausbesitzer und Immobilieneigentümer in ${cityName}
- Ton: Professionell, vertrauenswürdig, lokal verbunden

LOKALE BEZÜGE (MÜSSEN enthalten sein):
- Erwähne "${cityName}" mindestens 8-10 Mal natürlich im Text
- Erwähne "Ruhrgebiet" mindestens 3-4 Mal
- Bezug auf lokale Gegebenheiten: Altbautypen aus den 60er/70er Jahren, Kohleabbau-Geschichte, typische Bausubstanz
- Erwähne regionale Besonderheiten von ${cityName} wenn möglich

STRUKTUR (Muss exakt eingehalten werden):
1. EINLEITUNG (150-200 Wörter): Ansprechende Einleitung mit Bezug zu ${cityName}
2. WARUM DAS THEMA WICHTIG IST (200-250 Wörter): Lokale Relevanz, Klima, Bausubstanz
3. DIE 5 WICHTIGSTEN PUNKTE (250-300 Wörter): Praktische Tipps mit Bezug auf ${cityName}
4. KOSTEN IN ${cityName.toUpperCase()} (200-250 Wörter): Realistische Preise, Fördermöglichkeiten, KfW, BAFA
5. FAQ (4-5 Fragen): Häufige Fragen mit konkreten Antworten für ${cityName}
6. FAZIT (150-200 Wörter): Zusammenfassung + Handlungsaufruf

SEO-ANFORDERUNGEN:
- Haupt-Keyword: "${topic.keyword} ${cityName}"
- Natürliche Keyword-Einbettung
- Überschriften mit H2-Tags (markdown ##)
- Kurze Absätze (3-4 Sätze)
- Aufzählungspunkte wo sinnvoll
- Konkrete Zahlen und Preise

GIB NUR DEN REINEN ARTIKEL-TEXT ZURÜCK (keine Meta-Infos, keine Erklärungen). Verwende Markdown-Formatierung mit ## für Überschriften.`;

  console.log(`📝 Generiere: ${topic.title} in ${cityName}`);
  console.log('⏳ Rufe Kimi API auf... (kann 30-60s dauern)');
  console.log('');

  try {
    const start = Date.now();
    const content = await callKimiAPI(prompt);
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    
    console.log('');
    console.log(`✅ Artikel generiert in ${duration}s`);
    console.log(`📊 Länge: ${content.length} Zeichen (~${Math.round(content.length / 6)} Wörter)`);
    console.log('');
    console.log('📝 VORSCHAU (erste 1000 Zeichen):');
    console.log('─'.repeat(60));
    console.log(content.substring(0, 1000));
    console.log('─'.repeat(60));
    console.log('');
    console.log('🎉 TEST ERFOLGREICH!');
    
    // Speichere
    const testDir = path.join(__dirname, '..', 'public', 'blog', 'test');
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, 'full-test-article.md'), content, 'utf-8');
    console.log('💾 Gespeichert unter: public/blog/test/full-test-article.md');
    
  } catch (err) {
    console.error('❌ FEHLER:', err.message);
    process.exit(1);
  }
}

main();
