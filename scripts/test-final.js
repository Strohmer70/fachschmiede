const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const MOONSHOT_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

async function callKimiAPI(prompt) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300000); // 5 Minuten Timeout

  try {
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
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

async function main() {
  console.log('⚡ FINALER TEST: node-fetch + 5min Timeout');
  console.log('============================================');

  const prompt = `Schreibe einen SEO-Artikel (800-1000 Wörter) über "Dachdämmung Kosten" in Hattingen.

Struktur:
## Einleitung (100 Wörter)
## Warum wichtig (150 Wörter)  
## 5 Tipps (200 Wörter)
## Kosten in Hattingen (150 Wörter)
## FAQ - 4 Fragen
## Fazit (100 Wörter)

Erwähne Hattingen und Ruhrgebiet. Markdown mit ##. Nur Text.`;

  console.log('🚀 Starte API-Call (Timeout: 5 Minuten)...');
  const start = Date.now();
  
  try {
    const content = await callKimiAPI(prompt);
    const duration = ((Date.now() - start) / 1000).toFixed(1);

    console.log(`\n✅ FERTIG in ${duration}s!`);
    console.log(`📊 ${content.length} Zeichen`);
    console.log('\n📝 VORSCHAU:');
    console.log(content.substring(0, 800));

    const testDir = path.join(__dirname, '..', 'public', 'blog', 'test');
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, 'final-test.md'), content, 'utf-8');
    console.log('\n💾 Gespeichert!');

  } catch (err) {
    console.error(`\n❌ FEHLER nach ${((Date.now()-start)/1000).toFixed(1)}s: ${err.message}`);
  }
}

main();
