const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const MOONSHOT_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

async function testWithFullPrompt() {
  console.log('🔍 DEBUG: Voller Prompt Test mit Logging');
  console.log('=========================================');

  const cityName = 'Hattingen';
  const topicTitle = 'Dachdämmung Kosten';

  const prompt = `Schreibe TEIL 1 eines Artikels über "${topicTitle}" in ${cityName}.

UMFANG: 400-500 Wörter
INHALT:
1. EINLEITUNG (150-200 Wörter): Ansprechende Einleitung mit Bezug zu ${cityName} und dem Ruhrgebiet. Erwähne ${cityName} 3-4 Mal.
2. WARUM DAS THEMA WICHTIG IST (200-250 Wörter): Lokale Relevanz für ${cityName}, typische Altbauten aus den 60er/70er Jahren, Klima im Ruhrgebiet.

FORMAT: Markdown mit ## Überschriften. Nur den Text, keine Erklärungen.`;

  const body = {
    model: 'kimi-k2.6',
    messages: [
      { role: 'system', content: 'Du bist ein deutscher SEO-Content-Writer für Handwerker im Ruhrgebiet.' },
      { role: 'user', content: prompt }
    ],
    temperature: 1,
    max_tokens: 2000
  };

  console.log('📤 Request:');
  console.log(JSON.stringify(body, null, 2).substring(0, 500));
  console.log('');

  const response = await fetch(MOONSHOT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MOONSHOT_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  console.log(`📥 Status: ${response.status}`);
  const data = await response.json();
  
  console.log('📥 FULL Response:');
  console.log(JSON.stringify(data, null, 2));
}

testWithFullPrompt();
