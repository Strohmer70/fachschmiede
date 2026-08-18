const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const MOONSHOT_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

async function testModel(modelName, prompt, maxTokens = 4000) {
  console.log(`\n🧪 Teste Modell: ${modelName}`);
  console.log('─'.repeat(40));
  
  const start = Date.now();
  try {
    const response = await fetch(MOONSHOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MOONSHOT_API_KEY}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: 'Du bist ein deutscher SEO-Writer für Handwerker.' },
          { role: 'user', content: prompt }
        ],
        temperature: 1,
        max_tokens: maxTokens
      })
    });

    const duration = ((Date.now() - start) / 1000).toFixed(1);
    const data = await response.json();
    
    const content = data.choices?.[0]?.message?.content || '';
    const reasoning = data.choices?.[0]?.message?.reasoning_content || '';
    
    console.log(`⏱️  Dauer: ${duration}s`);
    console.log(`📊 Content: ${content.length} Zeichen`);
    console.log(`🧠 Reasoning: ${reasoning.length > 0 ? reasoning.length + ' Zeichen' : 'Nein'}`);
    console.log(`🏁 Finish: ${data.choices?.[0]?.finish_reason}`);
    
    if (content.length > 0) {
      console.log(`✅ ${modelName} FUNKTIONIERT!`);
      return { success: true, duration: parseFloat(duration), content };
    } else {
      console.log(`❌ ${modelName}: Kein Content`);
      return { success: false };
    }
  } catch (err) {
    console.log(`❌ ${modelName} FEHLER: ${err.message}`);
    return { success: false };
  }
}

async function main() {
  console.log('🔬 MODELL-VERGLEICH: Welches ist schnell genug?');
  console.log('=================================================');

  const prompt = `Schreibe eine kurze Einleitung (100 Wörter) über Dachdämmung in Hattingen. Erwähne Hattingen 2-3 Mal.`;

  // Teste verschiedene Modelle
  const models = ['kimi-k2.5', 'kimi-k2', 'kimi-latest'];
  
  for (const model of models) {
    await testModel(model, prompt, 4000);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏆 ERGEBNIS:');
  console.log('Das schnellste Modell ohne Reasoning wird empfohlen.');
}

main();
