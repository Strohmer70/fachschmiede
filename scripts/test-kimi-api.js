const fs = require('fs');
const path = require('path');

const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const MOONSHOT_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

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
        { role: 'system', content: 'Du bist ein deutscher SEO-Content-Writer für Handwerker im Ruhrgebiet.' },
        { role: 'user', content: prompt }
      ],
      temperature: 1,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function main() {
  console.log('🧪 TESTLAUF: Kimi API Artikel-Generator');
  console.log('========================================');
  console.log(`🔑 API Key: ${MOONSHOT_API_KEY ? '✅ Vorhanden' : '❌ FEHLt'}`);
  console.log(`🌐 API URL: ${MOONSHOT_API_URL}`);
  console.log('');

  if (!MOONSHOT_API_KEY) {
    console.error('❌ Kein API Key gefunden!');
    process.exit(1);
  }

  const city = 'hattingen';
  const cityName = 'Hattingen';
  const tradeName = 'Dachdecker';
  const topic = { slug: 'dachdaemmung-kosten', title: 'Dachdämmung Kosten', keyword: 'Dachdämmung' };

  console.log(`📝 Test-Artikel: ${topic.title} in ${cityName}`);
  console.log('⏳ Rufe Kimi API auf...');
  console.log('');

  const prompt = `Schreibe einen umfassenden, SEO-optimierten Ratgeber-Artikel über "${topic.title}" in ${cityName}.

ANFORDERUNGEN:
- Länge: 1200-1500 Wörter
- Sprache: Deutsch (Deutschland)
- Zielgruppe: Hausbesitzer in ${cityName}

LOKALE BEZÜGE:
- Erwähne "${cityName}" mindestens 8-10 Mal
- Erwähne "Ruhrgebiet" mindestens 3-4 Mal
- Bezug auf Altbautypen aus den 60er/70er Jahren, Kohleabbau-Geschichte

STRUKTUR:
1. EINLEITUNG (150-200 Wörter)
2. WARUM DAS THEMA WICHTIG IST (200-250 Wörter)
3. DIE 5 WICHTIGSTEN PUNKTE (250-300 Wörter)
4. KOSTEN IN ${cityName.toUpperCase()} (200-250 Wörter)
5. FAQ (4-5 Fragen)
6. FAZIT (150-200 Wörter)

SEO:
- Haupt-Keyword: "${topic.keyword} ${cityName}"
- Überschriften mit H2 (##)
- Kurze Absätze

GIB NUR DEN REINEN ARTIKEL-TEXT ZURÜCK. Markdown-Formatierung mit ## für Überschriften.`;

  try {
    const startTime = Date.now();
    const content = await callKimiAPI(prompt);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('✅ API-Antwort erhalten!');
    console.log(`⏱️  Dauer: ${duration}s`);
    console.log(`📊 Länge: ${content.length} Zeichen (~${Math.round(content.length / 6)} Wörter)`);
    console.log('');
    console.log('📝 ARTIKEL-VORSCHAU (erste 800 Zeichen):');
    console.log('─'.repeat(60));
    console.log(content.substring(0, 800));
    console.log('─'.repeat(60));
    console.log('');

    // Speichere Test-Artikel
    const testDir = path.join(__dirname, '..', 'public', 'blog', 'test');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    const testFile = path.join(testDir, `test-${Date.now()}.md`);
    fs.writeFileSync(testFile, content, 'utf-8');
    console.log(`💾 Test-Artikel gespeichert: ${testFile}`);
    console.log('');
    console.log('🎉 TEST ERFOLGREICH! Die Kimi API funktioniert.');

  } catch (error) {
    console.error('❌ FEHLER:', error.message);
    process.exit(1);
  }
}

main();
