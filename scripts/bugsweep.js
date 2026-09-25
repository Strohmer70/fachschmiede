const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pub = '/root/.openclaw/workspace/fachschmiede/public';
const files = fs.readdirSync(pub).filter(f => f.endsWith('.html'));
const MAP = { dachdecker: 'dach', elektriker: 'elek', zimmerer: 'zimm', maler: 'maler', klempner: 'klempner', 'garten-und-landschaftsbau': 'garten', gartenbau: 'garten' };

let jsBlocks = 0, jsErrors = [];
const dupIds = [], deadLinks = [], deadImgs = [], deadHandlers = [];

for (const f of files) {
  const html = fs.readFileSync(path.join(pub, f), 'utf8');

  // 1) Inline-JS extrahieren (keine src, kein JSON-LD)
  const scriptRe = /<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)(?![^>]*application\/json)[^>]*>([\s\S]*?)<\/script>/g;
  const scripts = [...html.matchAll(scriptRe)].map(m => m[1]).filter(s => s.trim().length > 10);
  scripts.forEach((s, i) => {
    jsBlocks++;
    const tmp = `/tmp/bugsweep/${f.replace(/[^a-z0-9]/gi, '_')}_${i}.js`;
    fs.writeFileSync(tmp, s);
    try {
      execSync(`node --check "${tmp}"`, { stdio: 'pipe' });
    } catch (e) {
      jsErrors.push(`${f} [Block ${i}]: ${e.stderr.toString().split('\n').slice(0, 3).join(' | ')}`);
    }
  });

  // 2) Duplicate IDs
  const ids = {};
  for (const m of html.matchAll(/ id="([^"]+)"/g)) ids[m[1]] = (ids[m[1]] || 0) + 1;
  const dups = Object.entries(ids).filter(([, v]) => v > 1);
  if (dups.length) dupIds.push(`${f}: ${dups.map(([k, v]) => k + '×' + v).join(', ')}`);

  // 3) Tote lokale Bilder
  const refs = [];
  for (const m of html.matchAll(/src="(\/[^"]+)"/g)) refs.push(m[1]);
  for (const m of html.matchAll(/href="(\/[^"#?]+\.(?:jpg|jpeg|png|webp|gif|svg))"/g)) refs.push(m[1]);
  for (const m of html.matchAll(/url\(['"]?(\/[^')"']+)['"]?\)/g)) refs.push(m[1]);
  for (const r of [...new Set(refs)]) {
    const p = r.split('?')[0];
    if (!p.startsWith('/images') && !p.startsWith('/blog')) continue;
    if (!fs.existsSync(path.join(pub, p))) deadImgs.push(`${f} → ${p}`);
  }

  // 4) Tote lokale Links (mit Rewrite-Mapping)
  const handlers = new Set([...html.matchAll(/function\s+(\w+)/g)].map(m => m[1]));
  for (const m of html.matchAll(/on(?:click|submit|change|input)="(\w+)\(/g)) {
    if (!handlers.has(m[1])) deadHandlers.push(`${f}: ${m[1]}()`);
  }

  // 5) Tote hrefs
  for (const m of html.matchAll(/href="(\/[^"#?]+)"/g)) {
    let p = m[1].endsWith('/') ? m[1].slice(0, -1) : m[1];
    if (p === '' || p.startsWith('/api/')) continue;
    if (/\.(jpg|jpeg|png|webp|gif|svg)$/.test(p)) continue;
    if (fs.existsSync(path.join(pub, p)) || fs.existsSync(path.join(pub, p + '.html'))) continue;
    const mm = p.match(/^\/([a-z-]+)\/([a-z-]+)(\/blog)?$/);
    if (mm) {
      const pref = MAP[mm[1]];
      if (pref) {
        const target = mm[3]
          ? path.join(pub, 'blog', mm[1], mm[2], 'index.html')
          : path.join(pub, `stadt-${pref}-${mm[2]}.html`);
        if (fs.existsSync(target)) continue;
        // Blog-Artikel-Ebene: /gewerk/stadt/blog/artikel/
        const art = path.join(pub, 'blog', mm[1], mm[2]);
        if (fs.existsSync(art)) continue;
      }
    }
    // Deeper blog article links: /gewerk/stadt/blog/artikel-slug/
    const bm = p.match(/^\/([a-z-]+)\/([a-z-]+)\/blog\/([a-z0-9-]+)$/);
    if (bm) {
      const art = path.join(pub, 'blog', bm[1], bm[2], bm[3] + '.html');
      if (fs.existsSync(art)) continue;
    }
    deadLinks.push(`${f} → ${m[1]}`);
  }
}

console.log('═══ BUG-SWEEP REPORT ═══');
console.log(`Dateien: ${files.length} | JS-Blöcke geprüft: ${jsBlocks}`);
console.log(`\n❌ JS-Syntaxfehler: ${jsErrors.length}`);
jsErrors.forEach(x => console.log('  ' + x));
console.log(`\n❌ Duplicate IDs: ${dupIds.length}`);
dupIds.forEach(x => console.log('  ' + x));
console.log(`\n❌ Tote Bilder: ${deadImgs.length}`);
[...new Set(deadImgs)].slice(0, 15).forEach(x => console.log('  ' + x));
console.log(`\n❌ Fehlende Handler-Funktionen: ${deadHandlers.length}`);
[...new Set(deadHandlers)].slice(0, 15).forEach(x => console.log('  ' + x));
console.log(`\n❌ Tote Links: ${deadLinks.length}`);
[...new Set(deadLinks)].slice(0, 25).forEach(x => console.log('  ' + x));
