// validate-sales.js — Syntax + Div-Balance aller Salespages prüfen
const fs = require('fs');
const vm = require('vm');
let bad = 0;
for (const f of fs.readdirSync('public').filter(x => /^sales-.*\.html$/.test(x))) {
  const p = 'public/' + f;
  const html = fs.readFileSync(p, 'utf8');
  const scripts = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  let ok = true;
  scripts.forEach((s, i) => { try { new vm.Script(s); } catch (e) { ok = false; bad++; console.log('✗ ' + f + ' Script' + i + ': ' + e.message); } });
  const opens = (html.match(/<div[\s>]/g) || []).length, closes = (html.match(/<\/div>/g) || []).length;
  const bal = opens === closes;
  if (!bal) bad++;
  console.log((ok && bal ? '✓' : '✗') + ' ' + f + ' — divs ' + opens + '/' + closes + ', scripts ' + (ok ? 'OK' : 'FEHLER'));
}
process.exit(bad ? 1 : 0);
