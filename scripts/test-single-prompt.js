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

  const data = await response.json();
  return data.choices[0].message.content;
}

async function main() {
  console.log('⚡ TEST: Alles in EINEM Prompt (1 API-Call statt 3)');
  console.log('=====================================================');

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
150-200 Wörter. Bezug zu ${cityName} und Ruhrgebiet. Erwähne ${cityName} 3-4 Mal.

## Warum ist das Thema wichtig?
200-250 Wörter. Lokale Relevanz, Altbauten aus den 60er/70er Jahren, Klima.

## Die 5 wichtigsten Punkte
250-300 Wörter. Praktische Tipps mit Bezug auf ${cityName}.

## Kosten in ${cityName}
200-250 Wörter. Realistische Preise, Fördermöglichkeiten (KfW, BAFA).

## Häufig gestellte Fragen
4-5 Fragen im Format:
**Frage:** [Frage]
**Antwort:** [2-3 Sätze mit Bezug zu ${cityName}]

## Fazit
150-200 Wörter. Zusammenfassung + Handlungsaufruf.

## HowTo: So gehen Sie vor
5 Schritte im Format:
1. **[Schritt-Titel]**: [2-3 Sätze Beschreibung]
2. ...usw.

SEO: Haupt-Keyword "${keyword} ${cityName}", kurze Absätze, konkrete Zahlen.

GIB NUR DEN ARTIKEL-TEXT ZURÜCK. Keine Meta-Infos.`;

  console.log('⏳ Einzelner API-Call mit komplettem Artikel...');
  const start = Date.now();
  const content = await callKimiAPI(prompt);
  const duration = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\n✅ Fertig in ${duration}s`);
  console.log(`📊 Länge: ${content.length} Zeichen (~${Math.round(content.length/6)} Wörter)`);
  console.log('\n📝 VORSCHAU:');
  console.log('─'.repeat(60));
  console.log(content.substring(0, 800));
  console.log('─'.repeat(60));
}

main().catch(err => {
  console.error('❌ Fehler:', err.message);
});
