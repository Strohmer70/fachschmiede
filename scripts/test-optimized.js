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
        { role: 'system', content: 'Du bist ein erfahrener deutscher SEO-Content-Writer für Handwerker im Ruhrgebiet.' },
        { role: 'user', content: prompt }
      ],
      temperature: 1,
      max_tokens: 16000
    })
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

async function main() {
  console.log('⚡ OPTIMIERTER TEST: 1 Prompt = kompletter Artikel');
  console.log('===================================================');
  console.log('⏳ Das Modell kimi-k2.6 macht internes Reasoning.');
  console.log('⏳ Das dauert 2-4 Minuten pro Artikel. Geduld! 🙏');
  console.log('');

  const cityName = 'Hattingen';
  const topicTitle = 'Dachdämmung Kosten';
  const keyword = 'Dachdämmung';

  const prompt = `Schreibe einen kompletten SEO-Artikel über "${topicTitle}" in ${cityName}.

ANFORDERUNGEN:
- Gesamtlänge: 1200-1500 Wörter
- Sprache: Deutsch
- Zielgruppe: Hausbesitzer in ${cityName}

STRUKTUR (mit ## Überschriften):

## Einleitung
150-200 Wörter. Bezug zu ${cityName} und Ruhrgebiet.

## Warum ist das Thema wichtig?
200-250 Wörter. Lokale Relevanz, Altbauten, Klima.

## Die 5 wichtigsten Punkte
250-300 Wörter. Praktische Tipps.

## Kosten in ${cityName}
200-250 Wörter. Preise, Förderung (KfW, BAFA).

## Häufig gestellte Fragen
4-5 Fragen im Format:
**Frage:** [Frage]
**Antwort:** [2-3 Sätze]

## Fazit
150-200 Wörter. Zusammenfassung + Handlungsaufruf.

## So gehen Sie vor: 5 Schritte
1. **[Titel]**: [Beschreibung]
2. ...usw.

SEO: Keyword "${keyword} ${cityName}", kurze Absätze.
GIB NUR DEN ARTIKEL-TEXT ZURÜCK.`;

  console.log('🚀 Starte API-Call (kann 2-4 Minuten dauern)...');
  const start = Date.now();
  
  try {
    const content = await callKimiAPI(prompt);
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    const wordCount = Math.round(content.length / 6);

    console.log(`\n✅ FERTIG! Dauer: ${duration}s`);
    console.log(`📊 ${content.length} Zeichen (~${wordCount} Wörter)`);
    console.log('\n📝 ARTIKEL-VORSCHAU:');
    console.log('─'.repeat(60));
    console.log(content.substring(0, 1000));
    console.log('─'.repeat(60));

    // Speichere
    const testDir = path.join(__dirname, '..', 'public', 'blog', 'test');
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, 'optimized-article.md'), content, 'utf-8');
    console.log('\n💾 Gespeichert: public/blog/test/optimized-article.md');
    console.log('\n🎉 TEST ERFOLGREICH! Alles funktioniert!');

  } catch (err) {
    console.error('\n❌ FEHLER:', err.message);
  }
}

main();
