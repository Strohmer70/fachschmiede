#!/usr/bin/env node
/**
 * Fix Salespages - Einheitliche Navigation
 */

const fs = require('fs');
const path = require('path');

const SALES_PAGES = [
  'sales-dachdecker.html',
  'sales-elektriker.html',
  'sales-klempner.html',
  'sales-zimmerer.html',
  'sales-maler.html',
  'sales-garten-und-landschaftsbau.html'
];

const NAV_TEMPLATE = `<!-- ═══════════ PORTAL-NAVIGATION ═══════════ -->
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

function fixSalesPage(filename) {
  const filepath = path.join('/root/.openclaw/workspace/fachschmiede/public', filename);
  if (!fs.existsSync(filepath)) {
    console.log(`❌ ${filename} nicht gefunden`);
    return;
  }

  let content = fs.readFileSync(filepath, 'utf8');
  
  // Alte Demo-Navigation ersetzen
  const navRegex = /<!-- ═══════════ DEMO-NAVIGATION ═══════════ -->[\s\S]*?<\/div>\s*<\/div>/;
  if (navRegex.test(content)) {
    content = content.replace(navRegex, NAV_TEMPLATE);
    console.log(`✅ ${filename} Navigation ersetzt`);
  } else {
    // Fallback: Suche nach bg-ink-900 Text-Nav
    const altNavRegex = /<div class="bg-ink-900 text-ink-300[^"]*"[^>]*>[\s\S]*?Demo-Portal:[\s\S]*?<\/div>\s*<\/div>/;
    if (altNavRegex.test(content)) {
      content = content.replace(altNavRegex, NAV_TEMPLATE);
      console.log(`✅ ${filename} Alternative Navigation ersetzt`);
    } else {
      console.log(`⚠️ ${filename} Navigation nicht gefunden (manuelle Prüfung nötig)`);
    }
  }

  // Relative Links zu absoluten machen (sales-*.html → /sales-*.html)
  content = content.replace(/href="sales-([a-z-]+)\.html"/g, 'href="/sales-$1.html"');
  content = content.replace(/href="ratgeber([^"]*)\.html"/g, 'href="/ratgeber$1.html"');
  content = content.replace(/href="admin\.html"/g, 'href="/admin.html"');
  content = content.replace(/href="mieter\.html"/g, 'href="/mieter.html"');
  content = content.replace(/href="start\.html"/g, 'href="/start.html"');
  
  // Falsche Links fixen (elektriker.html statt sales-elektriker.html)
  content = content.replace(/href="\/elektriker\.html"/g, 'href="/sales-elektriker.html"');
  content = content.replace(/href="\/klempner\.html"/g, 'href="/sales-klempner.html"');
  content = content.replace(/href="\/zimmerer\.html"/g, 'href="/sales-zimmerer.html"');
  content = content.replace(/href="\/maler\.html"/g, 'href="/sales-maler.html"');
  content = content.replace(/href="\/dachdecker\.html"/g, 'href="/sales-dachdecker.html"');

  fs.writeFileSync(filepath, content);
  console.log(`💾 ${filename} gespeichert`);
}

// Alle Salespages fixen
SALES_PAGES.forEach(fixSalesPage);

console.log('\n🎉 Alle Salespages aktualisiert!');
