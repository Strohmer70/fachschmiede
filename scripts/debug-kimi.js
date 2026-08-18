const fs = require('fs');

const MOONSHOT_API_KEY = 'sk-dflfmQZYslaRgqiVP8edlrh6JKG8Kepm5GkTqZkSmf7pmGgp';
const MOONSHOT_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

async function testAPI() {
  console.log('🔍 DEBUG: Kimi API Test');
  console.log('========================');

  const prompt = `Schreibe einen kurzen Absatz (50 Wörter) über Dachdämmung in Hattingen.`;

  const body = {
    model: 'kimi-k2.6',
    messages: [
      { role: 'system', content: 'Du bist ein deutscher SEO-Writer.' },
      { role: 'user', content: prompt }
    ],
    temperature: 1,
    max_tokens: 2000
  };

  console.log('📤 Request Body:', JSON.stringify(body, null, 2));
  console.log('');

  try {
    const response = await fetch(MOONSHOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MOONSHOT_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    console.log(`📥 HTTP Status: ${response.status}`);
    console.log(`📥 HTTP StatusText: ${response.statusText}`);
    console.log('');

    const data = await response.json();
    console.log('📥 RAW Response:');
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('❌ Fehler:', err.message);
  }
}

testAPI();
