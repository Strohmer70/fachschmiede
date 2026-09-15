#!/usr/bin/env node
/**
 * SEO-Unlock für alle stadt-* Live-Seiten
 * 1. robots: noindex,nofollow → index,follow
 * 2. Title: "Miet-Website...DEMO" → Gewerk-Tagline
 * 3. Description: "(Demo)"-Prefix entfernen
 */
const fs = require('fs');
const path = require('path');

const TRADE_TAGLINES = {
  dach: 'Festpreis. Feste Termine.',
  elek: 'Festpreis. Feste Termine.',
  klempner: 'Festpreis. Feste Termine.',
  zimm: 'Festpreis. Termintreue.',
  maler: 'Sauber. Farbecht. Festpreis.',
  garten: 'Ihr Traumgarten. Unsere Leidenschaft.',
};

const publicDir = path.join(__dirname, '..', 'public');
const files = fs.readdirSync(publicDir).filter(f => f.startsWith('stadt-') && f.endsWith('.html'));

let fixedRobots = 0, fixedTitles = 0, fixedDescs = 0;

for (const file of files) {
  const tradeKey = file.split('-')[1];
  const tagline = TRADE_TAGLINES[tradeKey] || 'Festpreis. Feste Termine.';
  const fp = path.join(publicDir, file);
  let html = fs.readFileSync(fp, 'utf-8');
  let changed = false;

  // 1. robots: noindex → index,follow
  if (html.includes('content="noindex, nofollow"')) {
    html = html.replace('content="noindex, nofollow"', 'content="index, follow"');
    fixedRobots++;
    changed = true;
  }

  // 2a. Title Format 1: "Trade City | Miet-Website...DEMO" → Tagline
  let newHtml = html.replace(
    /<title>([^|]+)\| Miet-Website( zum Anmieten)? – DEMO<\/title>/,
    `<title>$1| ${tagline}</title>`
  );
  // 2b. Title Format 2: "Trade City | Tagline – Miet-Website zum Anmieten (DEMO)" → nur DEMO-Suffix entfernen
  newHtml = newHtml.replace(
    / – Miet-Website zum Anmieten \(DEMO\)<\/title>/,
    '</title>'
  );
  if (newHtml !== html) {
    html = newHtml;
    fixedTitles++;
    changed = true;
  }

  // 3. Description: "Miet-Website (Demo): "-Prefix entfernen
  const newHtml2 = html.replace(/content="Miet-Website \(Demo\): /, 'content="');
  if (newHtml2 !== html) {
    html = newHtml2;
    fixedDescs++;
    changed = true;
  }

  if (changed) fs.writeFileSync(fp, html, 'utf-8');
}

console.log(`✅ ${files.length} stadt-* Seiten geprüft:`);
console.log(`   robots fixed:     ${fixedRobots}`);
console.log(`   titles fixed:     ${fixedTitles}`);
console.log(`   descriptions fixed: ${fixedDescs}`);
