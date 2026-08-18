const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Umgebungsvariablen
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tlxlkmewbhnpzvrphcq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const MOONSHOT_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CITIES = ['hattingen', 'bochum'];
const CITY_DISPLAY_NAMES = {
  'hattingen': 'Hattingen',
  'bochum': 'Bochum'
};

const TRADES = {
  dachdecker: {
    name: 'Dachdecker',
    topics: [
      { slug: 'dachdaemmung-kosten', title: 'Dachdämmung Kosten', keyword: 'Dachdämmung' },
      { slug: 'sturmschaden-reparatur', title: 'Sturmschaden Reparatur', keyword: 'Sturmschaden Dach' }
    ]
  }
};

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

async function generateFullArticle(cityName, tradeName, topic) {
  const { title: topicTitle, keyword } = topic;
  
  const prompt = `Schreibe einen SEO-Artikel (1200-1500 Wörter) über "${topicTitle}" in ${cityName}.

STRUKTUR (## Überschriften):
## Einleitung (150-200 Wörter)
## Warum wichtig (200-250 Wörter)
## 5 wichtige Punkte (250-300 Wörter)
## Kosten in ${cityName} (200-250 Wörter)
## FAQ - 4-5 Fragen im Format:
**Frage:** [Frage]
**Antwort:** [2-3 Sätze]
## Fazit (150-200 Wörter)
## So gehen Sie vor: 5 Schritte im Format:
1. **[Titel]**: [Beschreibung]

SEO: "${keyword} ${cityName}", kurze Absätze. Nur Text, keine Erklärungen.`;

  const content = await callKimiAPI(prompt);
  
  const faqs = [];
  const faqRegex = /\*\*Frage:\*\*\s*(.+?)\n\*\*Antwort:\*\*\s*(.+?)(?=\n\*\*Frage:|\n## |$)/gs;
  let match;
  while ((match = faqRegex.exec(content)) !== null) {
    faqs.push({ q: match[1].trim(), a: match[2].trim() });
  }
  if (faqs.length === 0) {
    faqs.push(
      { q: `Wie lange dauert ${topicTitle} in ${cityName}?`, a: `1-3 Werktage.` },
      { q: `Was kostet es?`, a: `500-2.000 Euro.` }
    );
  }
  
  const howToSteps = [];
  const stepRegex = /^(\d+)\.\s*\*\*(.+?)\*\*:\s*(.+)$/gm;
  let stepMatch;
  while ((stepMatch = stepRegex.exec(content)) !== null) {
    howToSteps.push({ name: stepMatch[2].trim(), text: stepMatch[3].trim() });
  }
  if (howToSteps.length === 0) {
    howToSteps.push(
      { name: 'Bedarf analysieren', text: 'Definieren Sie Ihre Anforderungen.' },
      { name: 'Fachbetrieb wählen', text: 'Vergleichen Sie Anbieter.' }
    );
  }
  
  return { content, faqs, howToSteps };
}

async function main() {
  console.log('🧪 TESTLAUF: 2 Artikel mit optimiertem 1-Call-System');
  console.log('=====================================================');
  console.log('⚡ Pro Artikel: 1 API-Call (~3 Minuten)');
  console.log('');

  let generated = 0;
  const monthSlug = '2026-08';

  for (const citySlug of CITIES) {
    const cityName = CITY_DISPLAY_NAMES[citySlug];
    const tradeSlug = 'dachdecker';
    const trade = TRADES[tradeSlug];
    const topic = trade.topics[generated % trade.topics.length];
    
    console.log(`\n📝 Artikel ${generated + 1}/2: ${topic.title} in ${cityName}`);
    console.log(`⏳ Starte API-Call...`);
    
    try {
      const start = Date.now();
      const { content, faqs, howToSteps } = await generateFullArticle(cityName, trade.name, topic);
      const duration = ((Date.now() - start) / 1000).toFixed(1);
      
      console.log(`✅ Fertig in ${duration}s`);
      console.log(`📊 ${content.length} Zeichen, ${faqs.length} FAQs, ${howToSteps.length} Schritte`);
      
      // Speichere
      const filePath = path.join(__dirname, '..', 'public', 'blog', 'test', `test-${citySlug}-${Date.now()}.md`);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      
      fs.writeFileSync(filePath, `# ${topic.title} in ${cityName}\n\n${content}\n\n## FAQs\n\n${faqs.map(f => `**Q:** ${f.q}\n**A:** ${f.a}`).join('\n\n')}`, 'utf-8');
      console.log(`💾 Gespeichert: ${filePath}`);
      
      generated++;
      
    } catch (err) {
      console.error(`❌ Fehler: ${err.message}`);
    }
  }

  console.log(`\n🎉 TESTLAUF BEENDET! ${generated}/2 Artikel erfolgreich.`);
}

main().catch(console.error);
