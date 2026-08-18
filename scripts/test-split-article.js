const fs = require('fs');
const path = require('path');

const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const MOONSHOT_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

async function callKimiAPI(prompt, maxTokens = 2000) {
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
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function main() {
  console.log('🧪 TEST: Artikel in 3 Teilen generieren (schneller, stabiler)');
  console.log('==============================================================');

  const cityName = 'Hattingen';
  const topicTitle = 'Dachdämmung Kosten';
  const keyword = 'Dachdämmung';

  // TEIL 1: Einleitung + Warum wichtig
  console.log('\n📄 TEIL 1/3: Einleitung & Relevanz...');
  const prompt1 = `Schreibe TEIL 1 eines Artikels über "${topicTitle}" in ${cityName}.

UMFANG: 400-500 Wörter
INHALT:
1. EINLEITUNG (150-200 Wörter): Ansprechende Einleitung mit Bezug zu ${cityName} und dem Ruhrgebiet. Erwähne ${cityName} 3-4 Mal.
2. WARUM DAS THEMA WICHTIG IST (200-250 Wörter): Lokale Relevanz für ${cityName}, typische Altbauten aus den 60er/70er Jahren, Klima im Ruhrgebiet.

FORMAT: Markdown mit ## Überschriften. Nur den Text, keine Erklärungen.`;

  const start1 = Date.now();
  const part1 = await callKimiAPI(prompt1, 2000);
  console.log(`   ✅ Fertig in ${((Date.now()-start1)/1000).toFixed(1)}s | ${part1.length} Zeichen`);

  // TEIL 2: Hauptteil + Kosten
  console.log('\n📄 TEIL 2/3: Tipps & Kosten...');
  const prompt2 = `Schreibe TEIL 2 eines Artikels über "${topicTitle}" in ${cityName}.

UMFANG: 400-500 Wörter
INHALT:
3. DIE 5 WICHTIGSTEN PUNKTE (250-300 Wörter): Praktische Tipps mit Bezug auf ${cityName}. Erwähne ${cityName} 2-3 Mal, Ruhrgebiet 1-2 Mal.
4. KOSTEN IN ${cityName.toUpperCase()} (200-250 Wörter): Realistische Preise für ${cityName}, Fördermöglichkeiten KfW/BAFA.

FORMAT: Markdown mit ## Überschriften. Nur den Text, keine Erklärungen.`;

  const start2 = Date.now();
  const part2 = await callKimiAPI(prompt2, 2000);
  console.log(`   ✅ Fertig in ${((Date.now()-start2)/1000).toFixed(1)}s | ${part2.length} Zeichen`);

  // TEIL 3: FAQ + Fazit
  console.log('\n📄 TEIL 3/3: FAQ & Fazit...');
  const prompt3 = `Schreibe TEIL 3 (Abschluss) eines Artikels über "${topicTitle}" in ${cityName}.

UMFANG: 300-400 Wörter
INHALT:
5. FAQ (4-5 Fragen): Häufige Fragen mit konkreten Antworten für ${cityName}. Format: Jede Frage als ### Überschrift, dann Antwort als Absatz.
6. FAZIT (150-200 Wörter): Zusammenfassung + Handlungsaufruf für ${cityName}. Erwähne ${cityName} 2-3 Mal.

FORMAT: Markdown mit ## und ### Überschriften. Nur den Text, keine Erklärungen.`;

  const start3 = Date.now();
  const part3 = await callKimiAPI(prompt3, 2000);
  console.log(`   ✅ Fertig in ${((Date.now()-start3)/1000).toFixed(1)}s | ${part3.length} Zeichen`);

  // Kombiniere
  const fullArticle = `${part1}\n\n${part2}\n\n${part3}`;
  const wordCount = Math.round(fullArticle.length / 6);

  console.log('\n' + '='.repeat(60));
  console.log('🎉 ARTIKEL KOMPLETT!');
  console.log(`📊 Gesamtlänge: ${fullArticle.length} Zeichen (~${wordCount} Wörter)`);
  console.log(`⏱️  Gesamtdauer: ${((Date.now()-start1)/1000).toFixed(1)}s`);
  console.log('='.repeat(60));

  // Speichere
  const testDir = path.join(__dirname, '..', 'public', 'blog', 'test');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(path.join(testDir, 'split-test-article.md'), fullArticle, 'utf-8');
  console.log('\n💾 Gespeichert: public/blog/test/split-test-article.md');
}

main().catch(err => {
  console.error('❌ Fehler:', err.message);
  process.exit(1);
});
