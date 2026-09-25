// scripts/add-tracker.js — Injiziert DSGVO-sicheres Besucherzähl-Snippet
// in alle stadt-*.html (idempotent — Dateien mit vorhandenem Tracker übersprungen)
const fs = require('fs')
const path = require('path')

const pub = path.join(__dirname, '..', 'public')
const SNIPPET =
  `<script>/* fachschmiede.de · Besucherzählung DSGVO-sauber: keine Cookies, keine IP-Speicherung */` +
  `(function(){try{var i=new Image(1,1);i.src='/api/track/?p='+encodeURIComponent(location.pathname)+'&_='+Date.now();}catch(e){}})();</script>`

let changed = 0
let skipped = 0
let errors = 0

for (const f of fs.readdirSync(pub).filter((f) => /^stadt-.*\.html$/.test(f))) {
  const fp = path.join(pub, f)
  let html = fs.readFileSync(fp, 'utf8')
  if (html.includes('/api/track/')) {
    skipped++
    continue
  }
  if (!html.includes('</body>')) {
    console.error('❌ KEIN </body> gefunden:', f)
    errors++
    continue
  }
  html = html.replace('</body>', SNIPPET + '\n</body>')
  fs.writeFileSync(fp, html)
  changed++
}

console.log(`✅ Tracker eingefügt: ${changed} | bereits vorhanden: ${skipped} | Fehler: ${errors}`)
