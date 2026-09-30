// scripts/fix-miet-banner-flicker.js
// Fix 2026-09-30 (Dieter-Report): "Jetzt sichern"-Banner + "Mieten"-Button
// auf VERMIETETEN Seiten sichtbar / flackernd.
//
// Root Causes:
//  A) applyRental() matchte den Vermietungs-Banner nur über Text "⚡ Diese Seite ist noch frei",
//     aber der große Banner lautet "Diese Website ist eine Miet-Website – und für X noch frei."
//     → Banner wurde auf vermieteten Seiten NIE versteckt.
//  B) Banner/CTAs werden im HTML sichtbar gerendert, JS versteckt sie erst nach Fetch
//     → Flackern auf vermieteten Seiten (besonders Header-CTA above the fold).
//
// Fix (idempotent, alle 120 stadt-*.html):
//  1. Banner-Section bekommt id="miet-banner"
//  2. Kontakt-Freebox bekommt id="miet-freebox"
//  3. Alle 3 "Diese Seite mieten"-CTAs bekommen class "miet-cta"
//  4. <head> bekommt Pending-Style (versteckt alle drei bis Entscheidung) + noscript-Fallback
//  5. MIET-STATUS-Script ersetzt: reveal() NACH dem Verstecken, ID-basiertes Hiding,
//     5s-Hard-Timeout, Fail-open nach Retry (Verkauf geht vor)

const fs = require('fs');
const path = require('path');

const pub = path.join(__dirname, '..', 'public');
const files = fs.readdirSync(pub).filter(f => /^stadt-.*\.html$/.test(f)).sort();

let patched = 0, skipped = 0, failed = 0;

function buildScript(slug) {
  return `<!-- ═══════════ MIET-STATUS (echte Vermietung) ═══════════ -->
<script>
(function(){var PAGE_SLUG='${slug}';
function reveal(){var st=document.getElementById('mietPending');if(st)st.remove();}
function hideSel(sel){var el=document.querySelector(sel);if(el)el.style.display='none';}
async function applyRental(retry){
 try{
  var r=await fetch('/api/pages/'+PAGE_SLUG+'/');
  if(!r.ok){
    if(!retry){setTimeout(function(){applyRental(true)},2000);return;}
    reveal();return; /* API streikt auch nach Retry -> Banner zeigen (Verkauf geht vor) */
  }
  var d=await r.json();
  if(!d.rented){reveal();return;}
  var company=d.company||'Ihr Betrieb', phone=d.phone||'', wa=(d.whatsapp||'').replace(/[^0-9]/g,'');
  /* 1) Miet-CTAs (Header Desktop+Mobile, Footer) */
  document.querySelectorAll('a').forEach(function(a){
    var t=(a.textContent||'').trim();
    if(/Diese Seite (mieten|anmieten)/.test(t)) a.style.display='none';
  });
  /* 2) Banner + Freebox per ID (kein fragiles Text-Matching) */
  hideSel('#miet-banner');
  hideSel('#miet-freebox');
  /* Fallback alte Freebox-Texte */
  var ps=document.querySelectorAll('p');
  for(var i=0;i<ps.length;i++){
    if((ps[i].textContent||'').indexOf('\\u26a1 Diese Seite ist noch frei')===0){
      var box=ps[i],up=0;
      while(up<4&&box.parentElement){box=box.parentElement;up++;if(box.classList&&box.classList.contains('bg-brand-50'))break;}
      box.style.display='none';break;
    }
  }
  /* 3) "noch frei" -> Firmenname */
  document.querySelectorAll('span').forEach(function(s){
    if((s.textContent||'').trim()==='noch frei'){
      s.textContent=company;s.classList.remove('text-brand-600');s.style.color='#0f172a';
    }
  });
  document.querySelectorAll('span,div').forEach(function(el){
    if(el.childNodes.length&&el.childNodes[0].nodeType===3&&(el.textContent||'').trim()==='Miet-Website \\u00b7 noch frei'){
      el.textContent='Gef\\u00fchrt von '+company;
    }
  });
  /* 4) Telefon/WhatsApp auf Mieter umschreiben */
  if(phone){
    document.querySelectorAll('a[href^="tel:"]').forEach(function(a){
      a.href='tel:'+phone.replace(/[^0-9+]/g,'');a.textContent=phone;
    });
  }
  if(wa){
    document.querySelectorAll('a[href*="wa.me"]').forEach(function(a){
      a.href=a.href.replace(/wa\\.me\\/[0-9]+/,'wa.me/'+wa);
    });
  }
  reveal(); /* erst verstecken, dann reveal -> null Flackern */
 }catch(e){console.error('applyRental',e);reveal();}
}
/* Hard-Fallback: haengt die API, nach 5s trotzdem einblenden */
setTimeout(reveal,5000);
applyRental(false);})();
</script>`;
}

for (const f of files) {
  const fp = path.join(pub, f);
  let h = fs.readFileSync(fp, 'utf8');
  if (h.includes('id="mietPending"')) { skipped++; continue; }

  const errs = [];
  const orig = h;

  // 1) Banner-Section ID
  const n1 = h.split('<section class="bg-brand-50 border-y border-brand-200">').length - 1;
  if (n1 !== 1) errs.push(`banner section x${n1}`);
  h = h.replace('<section class="bg-brand-50 border-y border-brand-200">', '<section id="miet-banner" class="bg-brand-50 border-y border-brand-200">');

  // 2) Freebox ID
  const n2 = h.split('<div class="mt-8 bg-brand-50 border border-brand-200 rounded-2xl p-6">').length - 1;
  if (n2 !== 1) errs.push(`freebox x${n2}`);
  h = h.replace('<div class="mt-8 bg-brand-50 border border-brand-200 rounded-2xl p-6">', '<div id="miet-freebox" class="mt-8 bg-brand-50 border border-brand-200 rounded-2xl p-6">');

  // 3) miet-cta Klasse an die 3 CTAs
  h = h.replace(/<a href="(\/sales-[^"]*)" class="([^"]*)">Diese Seite mieten<\/a>/g,
    '<a href="$1" class="$2 miet-cta">Diese Seite mieten</a>');
  const n3 = (h.match(/class="[^"]*miet-cta[^"]*">Diese Seite mieten<\/a>/g) || []).length;
  if (n3 !== 3) errs.push(`miet-cta x${n3}`);

  // 4) Pending-Style + noscript in <head>
  if (!h.includes('</head>')) errs.push('kein </head>');
  h = h.replace('</head>',
    '<style id="mietPending">#miet-banner,#miet-freebox,.miet-cta{display:none!important}</style>\n' +
    '<noscript><style>#miet-banner,#miet-freebox{display:block!important}</style></noscript>\n</head>');

  // 5) MIET-STATUS-Script ersetzen (PAGE_SLUG aus Alt-Block uebernehmen)
  const slugM = h.match(/var PAGE_SLUG='([^']+)'/);
  if (!slugM) errs.push('PAGE_SLUG nicht gefunden');
  const slug = slugM ? slugM[1] : '';
  const blockRe = /<!-- ═+\s*MIET-STATUS \(echte Vermietung\)\s*═+ -->\s*<script>[\s\S]*?<\/script>/;
  if (!blockRe.test(h)) errs.push('MIET-STATUS Block nicht gefunden');
  h = h.replace(blockRe, buildScript(slug));

  if (errs.length) { failed++; console.log(`❌ ${f}: ${errs.join(', ')}`); continue; }
  fs.writeFileSync(fp, h);
  patched++;
}
console.log(`\n✅ gepatcht: ${patched} | bereits ok: ${skipped} | Fehler: ${failed}`);
