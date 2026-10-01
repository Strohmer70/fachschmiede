#!/usr/bin/env node
// scripts/apply-rental-v5-reviews.js — 2026-10-01
// applyRental v5, Schritt 10: freigegebene Kundenbewertungen in #kundenstimme
// rendern + "Bewertung schreiben"-Modal (POST /api/reviews/).
// Insert vor "reveal(); /* erst verstecken, dann reveal -> null Flackern */".
// IDEMPOTENT: Marker "10) Bewertungen rendern" check. Anchor exakt x1 sonst Abbruch.
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

const V5 = `  /* 10) Bewertungen rendern (2026-10-01): freigegebene Reviews + Formular-Modal */
  (function(){
    var ks=document.getElementById('kundenstimme');
    if(!ks)return;
    var revs=d.reviews||[];
    var wrap=ks.querySelector('div.max-w-3xl');
    if(!wrap)return;
    wrap.id='bewerten';
    var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
    var stars=function(n){var s='';n=+n||0;for(var i=1;i<=5;i++)s+=i<=n?'\\u2605':'\\u2606';return s};
    var city='';
    try{var pp=location.pathname.split('/').filter(Boolean);if(pp.length>=2)city=pp[pp.length-1].replace(/-/g,' ')}catch(e){}
    var html='<h2 class="text-2xl sm:text-3xl font-bold text-ink-900 mb-2">Das sagen Kunden'+(city?' aus '+esc(city):'')+'</h2>';
    html+='<div class="w-12 h-1 bg-brand-500 mx-auto mb-8 rounded-full"></div>';
    if(revs.length){
      html+='<div class="grid gap-4 text-left">';
      revs.forEach(function(r){
        var dt='';try{dt=new Date(r.created_at).toLocaleDateString('de-DE',{day:'numeric',month:'long',year:'numeric'})}catch(e){}
        html+='<div class="bg-white rounded-2xl p-6 border border-ink-200 shadow-sm">'
          +'<div class="flex items-center justify-between mb-2 flex-wrap gap-2">'
          +'<span class="text-amber-500 tracking-wide" style="color:#f59e0b">'+stars(r.rating)+'</span>'
          +'<span class="text-xs text-ink-400">'+esc(dt)+'</span></div>'
          +(r.title?'<div class="font-bold text-ink-900 mb-1">'+esc(r.title)+'</div>':'')
          +'<blockquote class="text-ink-700 leading-relaxed mb-3">\\u201E'+esc(r.text)+'\\u201C</blockquote>'
          +'<div class="text-sm text-ink-500 font-medium">\\u2014 '+esc(r.author_name)+'</div></div>';
      });
      html+='</div>';
    }else{
      html+='<p class="text-ink-600 mb-6">Noch keine Bewertungen \\u2013 sei die erste Person, die Erfahrungen teilt!</p>';
    }
    html+='<button id="openReviewForm" class="mt-8 inline-flex items-center gap-2 bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition">\\u270D\\uFE0F Bewertung schreiben</button>';
    wrap.innerHTML=html;
    var modal=document.createElement('div');
    modal.id='reviewModal';
    modal.style.cssText='display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);align-items:center;justify-content:center;padding:1rem';
    modal.innerHTML='<div style="background:#fff;border-radius:1rem;max-width:28rem;width:100%;padding:1.5rem;max-height:90vh;overflow:auto">'
      +'<h3 style="font-size:1.25rem;font-weight:700;margin-bottom:1rem">Bewertung schreiben</h3>'
      +'<form id="reviewForm">'
      +'<label style="display:block;font-size:.875rem;font-weight:600;margin-bottom:.25rem">Dein Name *</label>'
      +'<input id="rvName" required maxlength="80" style="width:100%;border:1px solid #d6d3d1;border-radius:.5rem;padding:.5rem .75rem;margin-bottom:.75rem">'
      +'<label style="display:block;font-size:.875rem;font-weight:600;margin-bottom:.25rem">Sterne *</label>'
      +'<div id="rvStars" style="display:flex;gap:.25rem;font-size:1.75rem;margin-bottom:.75rem;cursor:pointer">'
      +'<span data-v="1">\\u2605</span><span data-v="2">\\u2605</span><span data-v="3">\\u2605</span><span data-v="4">\\u2605</span><span data-v="5">\\u2605</span></div>'
      +'<label style="display:block;font-size:.875rem;font-weight:600;margin-bottom:.25rem">\\u00DCberschrift (optional)</label>'
      +'<input id="rvTitle" maxlength="120" style="width:100%;border:1px solid #d6d3d1;border-radius:.5rem;padding:.5rem .75rem;margin-bottom:.75rem">'
      +'<label style="display:block;font-size:.875rem;font-weight:600;margin-bottom:.25rem">Deine Erfahrung *</label>'
      +'<textarea id="rvText" required minlength="10" maxlength="2000" rows="4" style="width:100%;border:1px solid #d6d3d1;border-radius:.5rem;padding:.5rem .75rem;margin-bottom:.75rem"></textarea>'
      +'<div id="rvErr" style="color:#dc2626;font-size:.875rem;margin-bottom:.5rem;display:none"></div>'
      +'<div style="display:flex;gap:.5rem;justify-content:flex-end">'
      +'<button type="button" id="rvCancel" style="padding:.5rem 1rem;border-radius:.5rem;border:1px solid #d6d3d1">Abbrechen</button>'
      +'<button type="submit" style="padding:.5rem 1rem;border-radius:.5rem;background:#1c1917;color:#fff;font-weight:600">Absenden</button>'
      +'</div></form></div>';
    document.body.appendChild(modal);
    var rating=5;
    var starEls=modal.querySelectorAll('#rvStars span');
    function paint(){starEls.forEach(function(s,i){s.style.color=i<rating?'#f59e0b':'#d6d3d1'})}
    paint();
    starEls.forEach(function(s){s.onclick=function(){rating=+s.getAttribute('data-v');paint()}});
    var openBtn=document.getElementById('openReviewForm');
    if(openBtn)openBtn.onclick=function(){modal.style.display='flex'};
    var cBtn=document.getElementById('rvCancel');
    if(cBtn)cBtn.onclick=function(){modal.style.display='none'};
    modal.onclick=function(e){if(e.target===modal)modal.style.display='none'};
    var form=document.getElementById('reviewForm');
    form.onsubmit=function(e){
      e.preventDefault();
      var err=document.getElementById('rvErr');err.style.display='none';
      var pp=location.pathname.split('/').filter(Boolean);
      var pageSlug=pp.length>=2?pp[pp.length-2]+'-'+pp[pp.length-1]:'';
      var btn=form.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent='Sende\\u2026';
      fetch('/api/reviews/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({page_slug:pageSlug,author_name:document.getElementById('rvName').value,rating:rating,title:document.getElementById('rvTitle').value,text:document.getElementById('rvText').value})})
      .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})})
      .then(function(res){
        if(res.ok&&res.j.ok){
          modal.querySelector('div').innerHTML='<div style="text-align:center;padding:2rem 1rem"><div style="font-size:3rem;margin-bottom:1rem">\\uD83C\\udf89</div><h3 style="font-weight:700;font-size:1.25rem;margin-bottom:.5rem">Danke f\\u00FCr deine Bewertung!</h3><p style="color:#57534e">Sie wird nach Pr\\u00FCfung ver\\u00f6ffentlicht.</p></div>';
          setTimeout(function(){modal.style.display='none'},2500);
        }else{
          err.textContent=(res.j&&res.j.error)||'Fehler beim Senden.';err.style.display='block';
          btn.disabled=false;btn.textContent='Absenden';
        }
      })
      .catch(function(){err.textContent='Netzwerkfehler.';err.style.display='block';btn.disabled=false;btn.textContent='Absenden'});
    };
  })();
`

const pub = join(process.cwd(), 'public')
const files = readdirSync(pub).filter(f => /^stadt-.*\.html$/.test(f))
let patched = 0, already = 0
const problems = []

for (const f of files) {
  const path = join(pub, f)
  let html = readFileSync(path, 'utf8')
  if (html.includes('10) Bewertungen rendern')) { already++; continue }
  const anchor = 'reveal(); /* erst verstecken, dann reveal -> null Flackern */'
  const count = html.split(anchor).length - 1
  if (count !== 1) { problems.push(`${f}: Anchor x${count}`); continue }
  html = html.replace(anchor, V5 + anchor)
  writeFileSync(path, html)
  patched++
}
console.log(`Gepatcht: ${patched} | Bereits v5: ${already} | Dateien: ${files.length}`)
if (problems.length) { problems.forEach(p => console.log(' -', p)); process.exit(1) }
