#!/usr/bin/env node
/**
 * apply-rental-v7-services-custom.js (2026-10-03)
 * Fuegt Block 9b in alle stadt-*.html ein: services_custom ueberschreibt
 * Titel/Text der Standard-Leistungskarten (Mieter-Edit + Reset via NULL).
 * Idempotent via Markervorabfrage.
 */
const fs = require('fs'), path = require('path');
const PUBLIC = path.join(__dirname, '..', 'public');

const ANCHOR = `        if(card)card.style.display='none';
      }
    });
  }
`;
const INSERT = ANCHOR +
`  /* 9b) Leistungskarten-Texte ueberschreiben (2026-10-03): Mieter editiert Titel/Text.
     Reset = Eintrag aus services_custom loeschen → Originaltext der Vorlage greift.
     XSS-sicher: textContent, keine innerHTML-Injection. */
  var svcC=d.services_custom||{};
  Object.keys(svcC).forEach(function(lb){
    var ov=svcC[lb]; if(!ov) return;
    document.querySelectorAll('#leistungen h3').forEach(function(h3){
      if(h3.textContent.replace(/\\s+/g,' ').trim()!==lb) return;
      if(ov.title){ h3.textContent=String(ov.title).slice(0,60); }
      if(ov.text!=null){
        var card9=h3.closest('div.reveal')||h3.parentElement;
        var p9=card9?card9.querySelector('p'):null;
        if(p9) p9.textContent=String(ov.text).slice(0,280);
      }
    });
  });
`;

const files = fs.readdirSync(PUBLIC).filter(f => /^stadt-.*\.html$/.test(f)).sort();
let ok = 0, skip = 0, fail = 0; const failures = [];
for (const f of files) {
  const p = path.join(PUBLIC, f);
  let html = fs.readFileSync(p, 'utf8');
  try {
    if (html.includes('svcC=d.services_custom')) { skip++; continue; }
    const n = html.split(ANCHOR).length - 1;
    if (n !== 1) throw new Error(`Anchor ${n}x gefunden`);
    html = html.replace(ANCHOR, INSERT);
    if (!html.includes('svcC=d.services_custom')) throw new Error('Marker fehlt nach Insert');
    fs.writeFileSync(p, html); ok++;
  } catch (e) { fail++; failures.push(f + ': ' + e.message); }
}
console.log(`OK:${ok} skip:${skip} FAIL:${fail} total:${files.length}`);
if (failures.length) { console.log(failures.join('\n')); process.exit(1); }
