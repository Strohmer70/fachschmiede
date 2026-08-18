const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const MOONSHOT_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

async function testHighTokens() {
  console.log('🔍 TEST: max_tokens=16000 (für Reasoning-Modell)');
  console.log('=================================================');

  const prompt = `Schreibe eine kurze Einleitung (80-100 Wörter) über Dachdämmung in Hattingen. Erwähne Hattingen 2-3 Mal.`;

  const body = {
    model: 'kimi-k2.6',
    messages: [
      { role: 'system', content: 'Du bist ein deutscher SEO-Writer.' },
      { role: 'user', content: prompt }
    ],
    temperature: 1,
    max_tokens: 16000
  };

  console.log('📤 Request mit max_tokens=16000');

  const response = await fetch(MOONSHOT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MOONSHOT_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  
  console.log(`📥 Status: ${response.status}`);
  console.log(`📥 Content length: ${data.choices?.[0]?.message?.content?.length || 0}`);
  console.log(`📥 Reasoning length: ${data.choices?.[0]?.message?.reasoning_content?.length || 0}`);
  console.log(`📥 Finish reason: ${data.choices?.[0]?.finish_reason}`);
  console.log(`📥 Total tokens: ${data.usage?.total_tokens}`);
  console.log('');
  console.log('📥 Content:');
  console.log(data.choices?.[0]?.message?.content || '(leer)');
}

testHighTokens();
