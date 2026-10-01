#!/usr/bin/env node
// scripts/apply-rental-v6-images.js — 2026-10-01
// applyRental v6, Schritt 11: Mieter-Bilder anzeigen — Logo im Header,
// Hero-Bild, Teamfoto, Referenz-Galerie (neue Sektion nach #ueber-uns).
// Insert vor "reveal(); /* erst verstecken, dann reveal -> null Flackern */".
// IDEMPOTENT: Marker "11) Mieter-Bilder" check. Anchor exakt x1 sonst Abbruch.
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

const V6 = `  /* 11) Mieter-Bilder (2026-10-01): Logo, Hero, Team, Referenzen */
  (function(){
    if(d.logo_url){
      var hs=document.querySelector('header span.bg-brand-600');
      if(hs){var lg=document.createElement('img');lg.src=d.logo_url;lg.alt='Logo '+ (d.company||'');lg.style.cssText='height:2.25rem;width:auto;max-width:10rem;object-fit:contain';hs.replaceWith(lg);}
    }
    if(d.hero_url){
      var hi=document.querySelector('img[src$="/images/hero.jpg"]');
      if(hi)hi.src=d.hero_url;
    }
    if(d.team_url){
      var ti=document.querySelector('#ueber-uns img[src$="/images/team.jpg"]');
      if(ti)ti.src=d.team_url;
    }
    if(d.gallery_urls&&d.gallery_urls.length){
      var gs=d.gallery_urls.filter(function(u){return /^https:\\/\\//.test(u)}).slice(0,6);
      if(gs.length){
        var sec=document.createElement('section');
        sec.className='py-16 sm:py-20 bg-ink-50';
        sec.id='referenzen';
        sec.innerHTML='\u003cdiv class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"\u003e'
          +'\u003ch2 class="text-2xl sm:text-3xl font-bold text-ink-900 mb-2"\u003eReferenzen \u0026amp; Projekte\u003c/h2\u003e'
          +'\u003cdiv class="w-12 h-1 bg-brand-500 mb-10 rounded-full"\u003e\u003c/div\u003e'
          +'\u003cdiv class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"\u003e'
          +gs.map(function(u){return '\u003cimg src="'+u+'" alt="Referenz" class="rounded-2xl object-cover w-full aspect-[4/3] shadow-sm" loading="lazy"\u003e'}).join('')
          +'\u003c/div\u003e\u003c/div\u003e';
        var anchor=document.getElementById('ueber-uns');
        if(anchor&&anchor.nextElementSibling)anchor.parentNode.insertBefore(sec,anchor.nextElementSibling);
      }
    }
  })();
`

const pub = join(process.cwd(), 'public')
const files = readdirSync(pub).filter(f => /^stadt-.*\.html$/.test(f))
let patched = 0, already = 0
const problems = []

for (const f of files) {
  const path = join(pub, f)
  let html = readFileSync(path, 'utf8')
  if (html.includes('11) Mieter-Bilder')) { already++; continue }
  const anchor = 'reveal(); /* erst verstecken, dann reveal -> null Flackern */'
  const count = html.split(anchor).length - 1
  if (count !== 1) { problems.push(`${f}: Anchor x${count}`); continue }
  html = html.replace(anchor, V6 + anchor)
  writeFileSync(path, html)
  patched++
}
console.log(`Gepatcht: ${patched} | Bereits v6: ${already} | Dateien: ${files.length}`)
if (problems.length) { problems.forEach(p => console.log(' -', p)); process.exit(1) }
