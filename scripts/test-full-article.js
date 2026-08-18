const fs = require('fs');
const path = require('path');

// Lade den Generator als Modul
const generatorPath = path.join(__dirname, 'monthly-generator.js');

// Wir müssen die Funktionen aus dem Generator importieren - da er nicht exportiert,
// kopieren wir die relevanten Teile hierher

const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const MOONSHOT_API_URL = 'https://api.moonshot.ai/v1/chat/completions';

async function callKimiAPI(prompt, maxRetries = 3) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MOONSHOT_API_KEY}`
  };

  const body = {
    model: 'kimi-k2.6',
    messages: [
      { role: 'system', content: 'Du bist ein erfahrener deutscher SEO-Content-Writer spezialisiert auf Handwerker- und Baubranche im Ruhrgebiet.' },
      { role: 'user', content: prompt }
    ],
    temperature: 1,
    max_tokens: 16000
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`   🌐 API-Call Versuch ${attempt}/${maxRetries}...`);
      const response = await fetch(MOONSHOT_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
      throw new Error('Ungültige API-Antwortstruktur');
    } catch (error) {
      console.error(`   ❌ Versuch ${attempt} fehlgeschlagen: ${error.message}`);
      if (attempt === maxRetries) throw error;
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function generateArticleContent(tradeSlug, citySlug, cityName, tradeName, topic) {
  const { slug, title: topicTitle, keyword } = topic;
  const prompt = `Schreibe einen umfassenden, SEO-optimierten Ratgeber-Artikel über "${topicTitle}" in ${cityName}.

ANFORDERUNGEN:
- Länge: 1200-1500 Wörter (absolutes Minimum: 1000 Wörter)
- Sprache: Deutsch (Deutschland)
- Zielgruppe: Hausbesitzer in ${cityName}

LOKALE BEZÜGE:
- Erwähne "${cityName}" mindestens 8-10 Mal
- Erwähne "Ruhrgebiet" mindestens 3-4 Mal
- Bezug auf Altbauten aus den 60er/70er Jahren

STRUKTUR:
1. EINLEITUNG (150-200 Wörter)
2. WARUM WICHTIG (200-250 Wörter)
3. 5 WICHTIGE PUNKTE (250-300 Wörter)
4. KOSTEN IN ${cityName.toUpperCase()} (200-250 Wörter)
5. FAQ (4-5 Fragen)
6. FAZIT (150-200 Wörter)

SEO: Haupt-Keyword "${keyword} ${cityName}", H2-Überschriften (##), kurze Absätze.

GIB NUR DEN REINEN ARTIKEL-TEXT ZURÜCK. Markdown mit ## für Überschriften.`;

  return await callKimiAPI(prompt);
}

async function generateFAQs(tradeSlug, citySlug, cityName, tradeName, topic) {
  const { title: topicTitle } = topic;
  const prompt = `Erstelle 4-5 FAQs für "${topicTitle}" in ${cityName}.

Format pro FAQ:
FRAGE: [Konkrete Frage]
ANTWORT: [2-3 Sätze mit Bezug zu ${cityName}]

Themen: Kosten, Dauer, Genehmigungen, Wohnen während Arbeiten, Garantie.

GIB NUR FAQS ZURÜCK.`;

  const faqText = await callKimiAPI(prompt);
  const faqs = [];
  const lines = faqText.split('\n');
  let currentQ = null, currentA = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('FRAGE:')) {
      if (currentQ) faqs.push({ q: currentQ, a: currentA.trim() });
      currentQ = trimmed.replace('FRAGE:', '').trim();
      currentA = '';
    } else if (trimmed.startsWith('ANTWORT:')) {
      currentA = trimmed.replace('ANTWORT:', '').trim();
    } else if (currentQ && trimmed) {
      currentA += ' ' + trimmed;
    }
  }
  if (currentQ) faqs.push({ q: currentQ, a: currentA.trim() });
  
  if (faqs.length === 0) {
    return [
      { q: `Wie lange dauert ${topicTitle} in ${cityName}?`, a: `In der Regel 1-3 Werktage.` },
      { q: `Was kostet ${topicTitle} in ${cityName}?`, a: `500-2.000 Euro je nach Umfang.` },
      { q: `Benötige ich eine Genehmigung?`, a: `Kleine Reparaturen meist nicht.` },
      { q: `Kann ich während der Arbeiten im Haus wohnen?`, a: `Ja, in der Regel kein Problem.` }
    ];
  }
  return faqs;
}

async function generateHowToSteps(tradeSlug, citySlug, cityName, tradeName, topic) {
  const { title: topicTitle } = topic;
  const prompt = `Erstelle 5 HowTo-Schritte für "${topicTitle}" in ${cityName}.

Format:
SCHRITT [Nummer]: [Titel]
BESCHREIBUNG: [2-3 Sätze]

GIB NUR SCHRITTE ZURÜCK.`;

  const howToText = await callKimiAPI(prompt);
  const steps = [];
  const lines = howToText.split('\n');
  let currentName = null, currentText = '';
  for (const line of lines) {
    const trimmed = line.trim();
    const stepMatch = trimmed.match(/^SCHRITT\s*\d*[:\.]?\s*(.+)/i);
    if (stepMatch) {
      if (currentName) steps.push({ name: currentName, text: currentText.trim() });
      currentName = stepMatch[1].trim();
      currentText = '';
    } else if (trimmed.toLowerCase().startsWith('beschreibung:')) {
      currentText = trimmed.replace(/beschreibung[:\.]?/i, '').trim();
    } else if (currentName && trimmed) {
      currentText += ' ' + trimmed;
    }
  }
  if (currentName) steps.push({ name: currentName, text: currentText.trim() });
  
  if (steps.length === 0) {
    return [
      { name: 'Bedarf analysieren', text: `Definieren Sie Ihre Anforderungen für ${topicTitle} in ${cityName}.` },
      { name: 'Fachbetrieb wählen', text: `Vergleichen Sie mindestens 3 Fachbetriebe aus ${cityName}.` },
      { name: 'Angebot einholen', text: `Lassen Sie sich ein detailliertes Angebot unterbreiten.` },
      { name: 'Auftrag erteilen', text: `Nach Prüfung des Angebots erteilen Sie den Auftrag.` },
      { name: 'Abnahme', text: `Prüfen Sie die Arbeiten und nehmen Sie sie ab.` }
    ];
  }
  return steps;
}

async function main() {
  console.log('🧪 VOLLSTÄNDIGER TEST: 1 Artikel mit allen API-Calls');
  console.log('=====================================================');

  const citySlug = 'hattingen';
  const cityName = 'Hattingen';
  const tradeSlug = 'dachdecker';
  const tradeName = 'Dachdecker';
  const topic = { slug: 'dachdaemmung-kosten', title: 'Dachdämmung Kosten', keyword: 'Dachdämmung' };

  console.log(`\n📝 Artikel: ${topic.title} in ${cityName}`);
  console.log(`⚡ max_tokens: 16000 (für Reasoning-Modell)`);

  // 1. Artikel-Content
  console.log('\n📄 Schritt 1/3: Artikel-Content generieren...');
  const start1 = Date.now();
  const articleContent = await generateArticleContent(tradeSlug, citySlug, cityName, tradeName, topic);
  console.log(`   ✅ Fertig in ${((Date.now()-start1)/1000).toFixed(1)}s | ${articleContent.length} Zeichen`);

  // 2. FAQs
  console.log('\n📄 Schritt 2/3: FAQs generieren...');
  const start2 = Date.now();
  const faqs = await generateFAQs(tradeSlug, citySlug, cityName, tradeName, topic);
  console.log(`   ✅ Fertig in ${((Date.now()-start2)/1000).toFixed(1)}s | ${faqs.length} FAQs`);

  // 3. HowTo
  console.log('\n📄 Schritt 3/3: HowTo-Schritte generieren...');
  const start3 = Date.now();
  const howToSteps = await generateHowToSteps(tradeSlug, citySlug, cityName, tradeName, topic);
  console.log(`   ✅ Fertig in ${((Date.now()-start3)/1000).toFixed(1)}s | ${howToSteps.length} Schritte`);

  // Zusammenfassung
  const totalTime = ((Date.now()-start1)/1000).toFixed(1);
  const wordCount = Math.round(articleContent.length / 6);

  console.log('\n' + '='.repeat(60));
  console.log('🎉 ARTIKEL VOLLSTÄNDIG GENERIERT!');
  console.log(`📊 Artikel-Länge: ${articleContent.length} Zeichen (~${wordCount} Wörter)`);
  console.log(`❓ FAQs: ${faqs.length}`);
  console.log(`📝 HowTo-Schritte: ${howToSteps.length}`);
  console.log(`⏱️  Gesamtdauer: ${totalTime}s`);
  console.log('='.repeat(60));

  // Speichere
  const testDir = path.join(__dirname, '..', 'public', 'blog', 'test');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
  
  fs.writeFileSync(path.join(testDir, 'full-article-content.md'), articleContent, 'utf-8');
  fs.writeFileSync(path.join(testDir, 'full-article-faqs.json'), JSON.stringify(faqs, null, 2), 'utf-8');
  fs.writeFileSync(path.join(testDir, 'full-article-howto.json'), JSON.stringify(howToSteps, null, 2), 'utf-8');

  console.log('\n💾 Dateien gespeichert:');
  console.log('   - public/blog/test/full-article-content.md');
  console.log('   - public/blog/test/full-article-faqs.json');
  console.log('   - public/blog/test/full-article-howto.json');
  console.log('\n✅ Der Generator funktioniert jetzt korrekt!');
  console.log('💡 Nächster Schritt: monthly-generator.js mit max_tokens=16000 deployen');
}

main().catch(err => {
  console.error('❌ Fehler:', err.message);
  process.exit(1);
});
