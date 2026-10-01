#!/usr/bin/env node
// scripts/apply-rental-v4-modules.js — 2026-10-01
// applyRental v4: Modul-/Leistungs-Toggles aus modules_enabled/services_active.
// Insert vor "reveal(); /* erst verstecken, dann reveal -> null Flackern */".
// IDEMPOTENT: Marker "8) Modul-Toggles" check. Anchor exakt x1 sonst Abbruch.
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

const V4 = `  /* 8) Modul-Toggles (2026-10-01, Mieter-Dashboard Module-Tab) */
  var mods=d.modules_enabled||{};
  if(mods.notdienst_banner===false)hideSel('#notdienst-banner');
  if(mods.bewertungen===false)hideSel('#kundenstimme');
  if(mods.blog===false)hideSel('#ratgeber');
  if(mods.faq===false)hideSel('#faq');
  if(mods.kennzahlen===false){var ksEl=document.getElementById('miet-stats');if(ksEl)ksEl.style.display='none';}
  /* 9) Leistungskarten ein/aus — Label = exakter h3-Text (SSOT PAGE_SERVICES) */
  var svcs=d.services_active||{};
  if(Object.keys(svcs).length){
    document.querySelectorAll('#leistungen h3').forEach(function(h3){
      var label=h3.textContent.replace(/\\s+/g,' ').trim();
      if(svcs[label]===false){
        var card=h3.closest('div.reveal')||h3.parentElement;
        if(card)card.style.display='none';
      }
    });
  }
`

const pub = join(process.cwd(), 'public')
const files = readdirSync(pub).filter(f => /^stadt-.*\.html$/.test(f))
let patched = 0, already = 0
const problems = []

for (const f of files) {
  const path = join(pub, f)
  let html = readFileSync(path, 'utf8')
  if (html.includes('8) Modul-Toggles')) { already++; continue }
  const anchor = 'reveal(); /* erst verstecken, dann reveal -> null Flackern */'
  const count = html.split(anchor).length - 1
  if (count !== 1) { problems.push(`${f}: Anchor x${count}`); continue }
  html = html.replace(anchor, V4 + anchor)
  writeFileSync(path, html)
  patched++
}
console.log(`Gepatcht: ${patched} | Bereits v4: ${already} | Dateien: ${files.length}`)
if (problems.length) { problems.forEach(p => console.log(' -', p)); process.exit(1) }
