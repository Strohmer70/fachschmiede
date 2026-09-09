#!/usr/bin/env node
/**
 * Fix alle Stadtseiten - Einheitliche Portal-Navigation
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = '/root/.openclaw/workspace/fachschmiede/public';

const PORTAL_NAV = `<!-- ═══════════ PORTAL-NAVIGATION ═══════════ -->
<div class="bg-ink-900 text-ink-300 text-xs sm:text-sm py-2.5 px-4">
  <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
    <span class="font-bold text-white uppercase tracking-widest text-[10px] sm:text-xs">Portal:</span>
    <a href="/start.html" class="hover:text-white transition">💼 Start</a>
    <a href="/sales-dachdecker.html" class="hover:text-white transition">🏠 Dachdecker</a>
    <a href="/sales-elektriker.html" class="hover:text-white transition">⚡ Elektriker</a>
    <a href="/sales-klempner.html" class="hover:text-white transition">🔥 Klempner / SHK</a>
    <a href="/sales-zimmerer.html" class="hover:text-white transition">🔨 Zimmerer</a>
    <a href="/sales-maler.html" class="hover:text-white transition">🖌️ Maler</a>
    <a href="/sales-garten-und-landschaftsbau.html" class="hover:text-white transition">🌳 Gartenbau</a>
    <a href="/admin.html" class="hover:text-white transition">⚙️ Admin</a>
    <a href="/mieter.html" class="hover:text-white transition">👤 Mieter</a>
  </div>
</div>`;

function addNavToFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  
  // Wenn bereits Portal-Navigation vorhanden, überspringen
  if (content.includes('PORTAL-NAVIGATION')) {
    return false;
  }
  
  // Suche nach Demo-Hinweis oder body-Tag
  const demoHintRegex = /(<!-- ═══════════ DEMO-HINWEIS ═══════════ -->[\s\S]*?<\/div>)/;
  const bodyRegex = /(<body[^>]*>)/;
  
  if (demoHintRegex.test(content)) {
    // Füge nach Demo-Hinweis ein
    content = content.replace(demoHintRegex, '$1\n' + PORTAL_NAV);
    fs.writeFileSync(filepath, content);
    return true;
  } else if (bodyRegex.test(content)) {
    // Füge nach body-Tag ein
    content = content.replace(bodyRegex, '$1\n' + PORTAL_NAV);
    fs.writeFileSync(filepath, content);
    return true;
  }
  
  return false;
}

// 1. Stadt-Dateien (stadt-*.html)
const stadtFiles = fs.readdirSync(PUBLIC_DIR)
  .filter(f => f.startsWith('stadt-') && f.endsWith('.html'));

let fixedCount = 0;
stadtFiles.forEach(f => {
  const filepath = path.join(PUBLIC_DIR, f);
  if (addNavToFile(filepath)) {
    fixedCount++;
    console.log(`✅ ${f}`);
  }
});

// 2. Trade/City Dateien (trade/city.html)
const trades = ['dachdecker', 'elektriker', 'klempner', 'zimmerer', 'maler', 'gartenbau'];
trades.forEach(trade => {
  const tradeDir = path.join(PUBLIC_DIR, trade);
  if (!fs.existsSync(tradeDir)) return;
  
  const cityFiles = fs.readdirSync(tradeDir).filter(f => f.endsWith('.html'));
  cityFiles.forEach(f => {
    const filepath = path.join(tradeDir, f);
    if (addNavToFile(filepath)) {
      fixedCount++;
      console.log(`✅ ${trade}/${f}`);
    }
  });
});

console.log(`\n🎉 ${fixedCount} Stadtseiten mit Navigation versehen!`);
