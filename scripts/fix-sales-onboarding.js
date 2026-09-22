// scripts/fix-sales-onboarding.js — Salespages: Fake-publish() → echtes Onboarding
// 1. Step1-Inputs bekommen IDs (onbName, onbLoginMail)
// 2. GEWERK_SLUG-Konstante (DB-Slug-Format: dachdecker-herne)
// 3. publish() → POST /api/rent/ → Stripe-Checkout-Redirect
const fs = require('fs')

const SLUG_MAP = { dach: 'dachdecker', elek: 'elektriker', klempner: 'klempner', shk: 'klempner', zimm: 'zimmerer', maler: 'maler', garten: 'garten-und-landschaftsbau' }

const files = fs.readdirSync('public').filter(f => /^sales-.*\.html$/.test(f))
let report = []

for (const file of files) {
  const path = 'public/' + file
  let h = fs.readFileSync(path, 'utf8')
  const orig = h
  const actions = []

  // ── GEWERK_SLUG nach GEWERK_KEY einfügen ──
  const gkMatch = h.match(/const GEWERK_KEY = '([^']+)';/)
  if (!gkMatch) { report.push(`❌ ${file}: GEWERK_KEY nicht gefunden`); continue }
  const slug = SLUG_MAP[gkMatch[1]]
  if (!slug) { report.push(`❌ ${file}: kein SLUG_MAP für '${gkMatch[1]}'`); continue }
  if (!h.includes('const GEWERK_SLUG')) {
    h = h.replace(/const GEWERK_KEY = '[^']+';/, (m) => m + `\nconst GEWERK_SLUG = '${slug}';`)
    actions.push('gewerk-slug')
  }

  // ── Step1-Inputs IDs geben (einmalig, idempotent) ──
  // Name-Input: required + placeholder "Vor- und Nachname", kein id=
  if (!h.includes('id="onbName"')) {
    const nameRe = /<input type="text" required placeholder="Vor- und Nachname"/
    if (nameRe.test(h)) {
      h = h.replace(nameRe, '<input id="onbName" type="text" required placeholder="Vor- und Nachname"')
      actions.push('onbName')
    } else report.push(`⚠️ ${file}: Name-Input nicht gefunden`)
  }
  if (!h.includes('id="onbLoginMail"')) {
    const mailRe = /<input type="email" required placeholder="E-Mail-Adresse"/
    if (mailRe.test(h)) {
      h = h.replace(mailRe, '<input id="onbLoginMail" type="email" required placeholder="E-Mail-Adresse"')
      actions.push('onbLoginMail')
    } else report.push(`⚠️ ${file}: LoginMail-Input nicht gefunden`)
  }

  // ── publish() ersetzen (Brace-Counting mit String/Regex/TEMPLATE-Awareness) ──
  const startIdx = h.indexOf('function publish(){')
  if (startIdx === -1) { report.push(`❌ ${file}: publish() nicht gefunden`); continue }

  let i = h.indexOf('{', startIdx)
  let depth = 0, endIdx = -1
  let inStr = null      // aktives String-Zeichen (', ", `) oder null
  let inLine = false    // //-Kommentar
  let inBlock = false   // /* */-Kommentar
  let esc = false       // Escape innerhalb String
  for (; i < h.length; i++) {
    const c = h[i], n = h[i + 1]
    if (inLine) { if (c === '\n') inLine = false; continue }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i++ } continue }
    if (inStr) {
      if (esc) { esc = false; continue }
      if (c === '\\') { esc = true; continue }
      if (c === inStr) inStr = null
      continue
    }
    if (c === '/' && n === '/') { inLine = true; i++; continue }
    if (c === '/' && n === '*') { inBlock = true; i++; continue }
    if (c === "'" || c === '"' || c === '`') { inStr = c; continue }
    if (c === '{') depth++
    else if (c === '}') { depth--; if (depth === 0) { endIdx = i + 1; break } }
  }
  if (endIdx === -1) { report.push(`❌ ${file}: publish() unvollständig`); continue }

  const newPublish = `async function publish(){
  const pw1 = (document.getElementById('pw1')||{}).value || '';
  const pw2 = (document.getElementById('pw2')||{}).value || '';
  if(pw1.length < 8){ alert('Bitte ein Passwort mit mindestens 8 Zeichen in Schritt 1 wählen.'); gotoStep(1); return; }
  if(pw1 !== pw2){ alert('Die Passwörter stimmen nicht überein.'); gotoStep(1); return; }
  const firmaEl = document.getElementById('onbFirma');
  const slug = GEWERK_SLUG + '-' + (CITY_SLUGS[onbCity] || '');
  const payload = {
    slug: slug, trade: GEWERK_SLUG, city: onbCity,
    firma: firmaEl ? firmaEl.value.trim() : '',
    name: ((document.getElementById('onbName')||{}).value || '').trim(),
    email: ((document.getElementById('onbLoginMail')||{}).value || '').trim(),
    tel: (document.getElementById('onbTel') || {}).value || '',
    password: pw1, modus: onbMode
  };
  if(!payload.firma){ alert('Bitte Firmennamen in Schritt 2 ausfüllen.'); gotoStep(2); return; }
  if(!payload.email){ alert('Bitte E-Mail in Schritt 1 ausfüllen.'); gotoStep(1); return; }
  const btn = document.querySelector('#step3 button[onclick="publish()"]') || document.querySelector('#stepDone button');
  const oldLabel = btn ? btn.innerHTML : '';
  if(btn){ btn.disabled = true; btn.innerHTML = '⏳ Wird eingerichtet…'; }
  try{
    const res = await fetch('/api/rent/', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    const data = await res.json();
    if(!res.ok){
      if(btn){ btn.disabled = false; btn.innerHTML = oldLabel; }
      alert(data.error || 'Einrichtung fehlgeschlagen. Bitte versuche es erneut.');
      return;
    }
    if(data.checkout_url){ window.location.href = data.checkout_url; return; }
    // Stripe noch nicht konfiguriert → trotzdem Bestätigung anzeigen
    gotoStep('Done');
    const doneMsg = document.getElementById('doneMsg');
    if(doneMsg) doneMsg.innerHTML = 'Dein Konto ist angelegt! Wir aktivieren deine Seite <strong>' + GEWERK_LABEL + ' ' + onbCity + '</strong> in Kürze – du erhältst eine Bestätigungs-E-Mail mit deinen Zugangsdaten.';
    const siteLink = document.getElementById('doneSiteLink');
    if(siteLink) siteLink.href = '/stadt-' + GEWERK_KEY + '-' + (CITY_SLUGS[onbCity]||'') + '.html';
  }catch(e){
    if(btn){ btn.disabled = false; btn.innerHTML = oldLabel; }
    alert('Netzwerkfehler – bitte prüfe deine Verbindung und versuche es erneut.');
  }
}`

  h = h.slice(0, startIdx) + newPublish + h.slice(endIdx)
  actions.push('publish-real')

  if (h !== orig) {
    fs.writeFileSync(path, h)
    report.push(`✅ ${file}: ${actions.join(', ')}`)
  } else {
    report.push(`— ${file}: unverändert`)
  }
}

// ── Script-Validierung ──
console.log(report.join('\n'))
let bad = 0
for (const file of files) {
  const html = fs.readFileSync('public/' + file, 'utf8')
  const blocks = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)]
  blocks.forEach((b, i) => {
    try { new Function(b[1]) } catch (e) { bad++; console.log(`❌ ${file} Block ${i}: ${e.message}`) }
  })
}
console.log(bad === 0 ? '\n✅ Alle Script-Blöcke valide' : `\n❌ ${bad} Script-Fehler`)
