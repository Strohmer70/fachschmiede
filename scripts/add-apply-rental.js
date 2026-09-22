// scripts/add-apply-rental.js — applyRental() auf allen 126 Stadtseiten injizieren
// Liest Miet-Status von /api/pages/{slug}/ und passt DOM an wenn vermietet:
// - Miet-CTAs + Free-Box ausblenden
// - "noch frei" → Firmenname
// - tel:/wa.me auf Mieter-Daten umschreiben
const fs = require('fs')

const TRADE_MAP = {
  'stadt-dach-': 'dachdecker',
  'stadt-elek-': 'elektriker',
  'stadt-klempner-': 'klempner',
  'stadt-maler-': 'maler',
  'stadt-zimm-': 'zimmerer',
  'stadt-garten-': 'garten-und-landschaftsbau',
}

const files = fs.readdirSync('public').filter(f => f.startsWith('stadt-') && f.endsWith('.html'))
let changed = 0, skipped = 0, errors = []

for (const file of files) {
  let trade = null, prefix = null
  for (const [p, t] of Object.entries(TRADE_MAP)) {
    if (file.startsWith(p)) { trade = t; prefix = p; break }
  }
  if (!trade) { errors.push(`❌ ${file}: kein Trade-Prefix`); continue }
  const city = file.replace(prefix, '').replace(/\.html$/, '')
  const slug = `${trade}-${city}`

  const path = 'public/' + file
  let h = fs.readFileSync(path, 'utf8')
  if (h.includes('async function applyRental')) { skipped++; continue }

  const script = `
<!-- ═══════════ MIET-STATUS (echte Vermietung) ═══════════ -->
<script>
(function(){var PAGE_SLUG='${slug}';
async function applyRental(){
 try{
  var r=await fetch('/api/pages/'+PAGE_SLUG+'/');if(!r.ok)return;
  var d=await r.json();if(!d.rented)return;
  var company=d.company||'Ihr Betrieb', phone=d.phone||'', wa=(d.whatsapp||'').replace(/[^0-9]/g,'');
  // 1) Miet-CTAs ausblenden
  document.querySelectorAll('a').forEach(function(a){
    var t=(a.textContent||'').trim();
    if(/Diese Seite (mieten|anmieten)/.test(t)) a.style.display='none';
  });
  // 2) Free-Box ausblenden (p mit ⚡ → Container mit bg-brand-50 hochgehen)
  var ps=document.querySelectorAll('p');
  for(var i=0;i<ps.length;i++){
    if((ps[i].textContent||'').indexOf('\\u26a1 Diese Seite ist noch frei')===0){
      var box=ps[i],up=0;
      while(up<4&&box.parentElement){box=box.parentElement;up++;if(box.classList&&box.classList.contains('bg-brand-50'))break;}
      box.style.display='none';break;
    }
  }
  // 3) "noch frei"-Spans → Firmenname
  document.querySelectorAll('span').forEach(function(s){
    if((s.textContent||'').trim()==='noch frei'){
      s.textContent=company;s.classList.remove('text-brand-600');s.style.color='#0f172a';
    }
  });
  // Footer-Zeile "Miet-Website · noch frei" → "Geführt von …"
  document.querySelectorAll('span,div').forEach(function(el){
    if(el.childNodes.length&&el.childNodes[0].nodeType===3&&(el.textContent||'').trim()==='Miet-Website \\u00b7 noch frei'){
      el.textContent='Gef\\u00fchrt von '+company;
    }
  });
  // 4) Telefon auf Mieter umschreiben
  if(phone){
    document.querySelectorAll('a[href^="tel:"]').forEach(function(a){
      a.href='tel:'+phone.replace(/[^0-9+]/g,'');a.textContent=phone;
    });
  }
  // 5) WhatsApp auf Mieter umschreiben
  if(wa){
    document.querySelectorAll('a[href*="wa.me"]').forEach(function(a){
      a.href=a.href.replace(/wa\\.me\\/[0-9]+/,'wa.me/'+wa);
    });
  }
 }catch(e){console.error('applyRental',e);}
}
applyRental();})();
</script>
</body>`

  if (!h.includes('</body>')) { errors.push(`❌ ${file}: kein </body>`); continue }
  h = h.replace('</body>', script)
  fs.writeFileSync(path, h)
  changed++
}

// ── Validierung ──
let bad = 0
for (const file of files) {
  const html = fs.readFileSync('public/' + file, 'utf8')
  // JSON-LD/Type-Blöcke überspringen (kein JS!)
  const blocks = [...html.matchAll(/<script(?![^>]*src)(?![^>]*type=["']?(application\/ld\+json|application\/json))[^>]*>([\s\S]*?)<\/script>/g)]
  blocks.forEach((b, i) => {
    try { new Function(b[2] !== undefined ? b[2] : b[1]) } catch (e) { bad++; errors.push(`❌ ${file} Block ${i}: ${e.message}`) }
  })
  // applyRental selbst prüfen (ganzer IIFE-Block inkl. Wrapper!)
  const ar = html.match(/\(function\(\)\{var PAGE_SLUG[\s\S]*?\}\)\(\);/)
  if (!ar) { errors.push(`⚠️ ${file}: applyRental fehlt`); return }
  try { new Function(ar[0]) } catch (e) { bad++; errors.push(`❌ ${file} applyRental: ${e.message}`) }
  // Div-Balance
  const opens = (html.match(/<div[\s>]/g) || []).length
  const closes = (html.match(/<\/div>/g) || []).length
  if (opens !== closes) errors.push(`⚠️ ${file}: Div ${opens}/${closes}`)
}

console.log(`Geändert: ${changed} | Übersprungen (schon drin): ${skipped} | Script-Fehler: ${bad}`)
console.log(errors.length ? errors.join('\n') : '✅ Alle Checks bestanden')
