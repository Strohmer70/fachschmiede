#!/usr/bin/env node
/**
 * extract-default-content.js
 * Extrahiert aus allen stadt-*.html die neutralen Standard-Inhalte
 * (aktuell: Über-uns-Text), damit das Mieter-Dashboard den Kunden-TEXT
 * als editierbare Basis vorbelegen kann.
 *
 * Output: app/api/_lib/default-content.json  { slug: { about, aboutP2 } }
 * Wird von /api/tenant/customization (Prefill) und Seiten-Checks genutzt.
 * Nach jeder Stadtseiten-Generierung (auto-sync) neu ausführen!
 */
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const OUT = path.join(__dirname, '..', 'app', 'api', '_lib', 'default-content.json');

const out = {};
const files = fs.readdirSync(PUBLIC).filter(f => /^stadt-.*\.html$/.test(f));
let count = 0;

for (const f of files) {
  const slug = f.replace(/^stadt-/, '').replace(/\.html$/, '');
  const html = fs.readFileSync(path.join(PUBLIC, f), 'utf8');
  const m = html.match(/<section id="ueber-uns"[\s\S]*?<\/section>/);
  if (!m) continue;
  const ps = [...m[0].matchAll(/<p class="mt-(?:6|4) text-ink-600[^"]*"[^>]*>([\s\S]*?)<\/p>/g)];
  const clean = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  out[slug] = {
    about: ps.length > 0 ? clean(ps[0][1]) : '',
    aboutP2: ps.length > 1 ? clean(ps[1][1]) : '',
  };
  count++;
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(`✓ ${count}/${files.length} Stadtseiten → default-content.json`);
