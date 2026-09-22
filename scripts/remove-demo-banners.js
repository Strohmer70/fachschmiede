#!/usr/bin/env node
/**
 * remove-demo-banners.js
 * ======================
 * Entfernt ALLE Demo-/Muster-Elemente von den Live-Seiten:
 *
 *  1. DEMO-HINWEIS-Banner (amber): "⚠️ MUSTERSEITE – Beispiel einer Miet-Website…"
 *  2. DEMO-NAVIGATION-Leiste: "Demo-Portal:" + Musterseiten-Links
 *  3. Formular: Fake-onsubmit → echtes submitLead() mit Fetch an /api/leads/
 *  4. Erfolgs-Text: "(Demo-Hinweis…)" → echte Bestätigung
 *  5. Kleindruck: "Demo-Formular…" → ehrlicher Datenschutz-Hinweis
 *  6. Karte: "(Demo)"-Titel + Disclaimer-Zeile entfernen
 *  7. Footer: "{trade}-{city}-muster.de – MUSTERSEITE…" → fachschmiede.de
 *
 * Idempotent: bereinigt nur, wenn Muster vorhanden. Div-Counter-Ansatz
 * (Lesson Learned aus FAQ-Fix) für robuste Block-Extraktion.
 */

const fs = require('fs')
const path = require('path')

const PUBLIC = path.join(__dirname, '..', 'public')

// ── Div-Counter: extrahiert ab Start-<div> den kompletten Block ──
function extractDivBlock(html, startIdx) {
  let depth = 0
  let i = startIdx
  const openRe = /<div[\s>]/g
  const closeRe = /<\/div>/g

  // Erstes öffnendes <div ab startIdx
  openRe.lastIndex = startIdx
  const first = openRe.exec(html)
  if (!first) return null
  i = first.index

  while (i < html.length) {
    openRe.lastIndex = i
    closeRe.lastIndex = i
    const o = openRe.exec(html)
    const c = closeRe.exec(html)
    if (c && (!o || c.index < o.index)) {
      depth--
      i = c.index + 6
      if (depth === 0) return { block: html.slice(startIdx, i), end: i }
    } else if (o) {
      depth++
      i = o.index + 4
    } else {
      break
    }
  }
  return null
}

// ── Entfernt "KOMMENTAR + folgenden div-Block" ──
function removeCommentDivBlock(html, commentText) {
  const commentIdx = html.indexOf(commentText)
  if (commentIdx === -1) return { html, changed: false }

  // Block-Ende: Ende des div-Blocks nach dem Kommentar
  const afterComment = html.slice(commentIdx)
  const divMatch = /<div[\s>]/.exec(afterComment)
  if (!divMatch) {
    // Kein div gefunden → nur Kommentarzeile entfernen
    const lineEnd = html.indexOf('\n', commentIdx)
    return { html: html.slice(0, commentIdx) + html.slice(lineEnd + 1), changed: true }
  }
  const divStart = commentIdx + divMatch.index
  const extracted = extractDivBlock(html, divStart)
  if (!extracted) return { html, changed: false }

  // Alles von Kommentar bis Block-Ende + nachfolgende Newline entfernen
  let end = extracted.end
  if (html[end] === '\r') end++
  if (html[end] === '\n') end++

  return { html: html.slice(0, commentIdx) + html.slice(end), changed: true }
}

// ── Text-Ersetzungen (pro Datei) ──
function applyTextFixes(html) {
  const fixes = [
    // 1. Formular-onsubmit → echtes submitLead()
    {
      from: `onsubmit="event.preventDefault(); document.getElementById('formSuccess').classList.remove('hidden');"`,
      to: `onsubmit="event.preventDefault(); submitLead(this);"`,
      label: 'form-onsubmit',
    },
    // 2. Erfolgs-Text
    {
      from: '✓ Vielen Dank! (Demo-Hinweis: Diese Anfrage wird nicht wirklich versendet.)',
      to: '✓ Vielen Dank für Ihre Anfrage! Wir melden uns innerhalb von 24 Stunden bei Ihnen.',
      label: 'success-text',
    },
    // 3. Kleindruck unter dem Formular
    {
      from: 'Demo-Formular – es werden keine Daten übertragen oder gespeichert.',
      to: 'Ihre Anfrage wird sicher übertragen und ausschließlich zur Bearbeitung Ihres Anliegens verwendet.',
      label: 'form-fineprint',
    },
    // 4. Map-Disclaimer
    {
      fromRegex: /\s*<p class="px-6 py-3 text-xs text-ink-400 italic">Demo-Karte\. Nach der Anmietung wird hier der echte Firmenstandort des Mieters \(Google Maps Place ID\) eingebunden\.<\/p>/,
      to: '',
      label: 'map-disclaimer',
    },
    // 5. Map-Titel "(Demo)"
    {
      fromRegex: /title="Karte ([^(]+?) \(Demo\)"/g,
      to: 'title="Karte $1"',
      label: 'map-title',
    },
    // 6. Footer-Copyright
    {
      fromRegex: /© <span id="jahr"><\/span> [^<]+ – MUSTERSEITE\. Alle Inhalte, Personen und Bewertungen sind fiktiv\./,
      to: '© <span id="jahr"></span> fachschmiede.de – Ihr Portal für lokale Handwerks-Profis.',
      label: 'footer-copy',
    },
  ]

  const applied = []
  for (const f of fixes) {
    if (f.from !== undefined) {
      if (html.includes(f.from)) {
        html = html.split(f.from).join(f.to)
        applied.push(f.label)
      }
    } else if (f.fromRegex) {
      if (f.fromRegex.test(html)) {
        html = html.replace(f.fromRegex, f.to)
        applied.push(f.label)
      }
    }
  }
  return { html, applied }
}

// ── submitLead-Script vor </body> einfügen ──
const LEAD_SCRIPT = `
<script>
// ── ECHTES Lead-Capture → /api/leads/ ──
async function submitLead(form){
  var btn = form.querySelector('button[type="submit"]');
  var success = document.getElementById('formSuccess');
  var errBox = document.getElementById('formError');
  var origBtn = btn ? btn.textContent : '';
  var nameEl = document.getElementById('name');
  var telEl = document.getElementById('tel');
  var themaEl = document.getElementById('thema');
  var msgEl = document.getElementById('nachricht');
  var parts = location.pathname.split('/').filter(Boolean);
  var trade = parts[0] || '';
  var city = parts[1] || '';
  var payload = {
    trade: trade,
    city: city,
    name: nameEl ? nameEl.value.trim() : '',
    phone: telEl ? telEl.value.trim() : '',
    message: 'Thema: ' + (themaEl ? themaEl.value : '') + '\\n\\n' + (msgEl ? msgEl.value.trim() : '')
  };
  if(btn){ btn.disabled = true; btn.textContent = 'Wird gesendet…'; }
  try{
    var res = await fetch('/api/leads/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    var data = await res.json().catch(function(){ return {}; });
    if(!res.ok) throw new Error(data.error || 'Senden fehlgeschlagen');
    if(success){
      success.textContent = '✓ Vielen Dank für Ihre Anfrage! Wir melden uns innerhalb von 24 Stunden bei Ihnen.';
      success.classList.remove('hidden');
    }
    if(errBox) errBox.classList.add('hidden');
    form.reset();
    if(success) success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }catch(e){
    if(!errBox && success && success.parentNode){
      errBox = document.createElement('p');
      errBox.id = 'formError';
      errBox.className = 'mt-4 text-center text-red-700 font-bold bg-red-50 border border-red-200 rounded-lg py-3 px-4';
      success.parentNode.insertBefore(errBox, success.nextSibling);
    }
    if(errBox){
      errBox.textContent = '✗ ' + (e.message || 'Fehler') + ' – bitte versuchen Sie es erneut oder kontaktieren Sie uns telefonisch.';
      errBox.classList.remove('hidden');
    }
  }
  if(btn){ btn.disabled = false; btn.textContent = origBtn; }
}
</script>
`

function injectLeadScript(html) {
  if (html.includes('async function submitLead')) return { html, changed: false }
  if (!html.includes('submitLead(this)')) return { html, changed: false }
  // Vor dem schließenden </body> einfügen
  const bodyClose = html.lastIndexOf('</body>')
  if (bodyClose === -1) return { html, changed: false }
  return { html: html.slice(0, bodyClose) + LEAD_SCRIPT + '\n' + html.slice(bodyClose), changed: true }
}

// ══════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════
const files = fs.readdirSync(PUBLIC).filter((f) => f.endsWith('.html'))
const stats = { scanned: 0, changed: [], unchanged: [], detail: {} }

for (const file of files) {
  const fp = path.join(PUBLIC, file)
  let html = fs.readFileSync(fp, 'utf8')
  const before = html

  const actions = []

  // 1+2: Demo-Banner + Demo-Navigation entfernen
  let r = removeCommentDivBlock(html, '<!-- ═══════════ DEMO-HINWEIS ═══════════ -->')
  html = r.html
  if (r.changed) actions.push('demo-hinweis-entfernt')

  r = removeCommentDivBlock(html, '<!-- ═══════════ DEMO-NAVIGATION ═══════════ -->')
  html = r.html
  if (r.changed) actions.push('demo-navigation-entfernt')

  // 3-6: Text-Fixes
  const fx = applyTextFixes(html)
  html = fx.html
  actions.push(...fx.applied)

  // 7: Lead-Script injizieren (nur wenn submitLead(this) im Formular)
  const inj = injectLeadScript(html)
  html = inj.html
  if (inj.changed) actions.push('lead-script-eingefuegt')

  stats.scanned++
  if (html !== before) {
    fs.writeFileSync(fp, html)
    stats.changed.push(file)
    stats.detail[file] = actions
  } else {
    stats.unchanged.push(file)
  }
}

// ══ REPORT ══
console.log(`\n╔══════════════════════════════════════════════════╗`)
console.log(`║  DEMO-BANNER-ENTFERNUNG – REPORT                  ║`)
console.log(`╚══════════════════════════════════════════════════╝`)
console.log(`\nGescannt: ${stats.scanned} Dateien`)
console.log(`Geändert: ${stats.changed.length}`)
console.log(`Unverändert: ${stats.unchanged.length}`)

// Zusammenfassung der Aktionen
const actionCounts = {}
for (const f of stats.changed) {
  for (const a of stats.detail[f]) {
    actionCounts[a] = (actionCounts[a] || 0) + 1
  }
}
console.log(`\n── Aktionen ──`)
for (const [a, n] of Object.entries(actionCounts).sort((x, y) => y[1] - x[1])) {
  console.log(`  ${a}: ${n}`)
}

// Verifikation: Keine Demo-Banner mehr?
let leftover = 0
for (const file of files) {
  const html = fs.readFileSync(path.join(PUBLIC, file), 'utf8')
  if (html.includes('DEMO-HINWEIS') || html.includes('DEMO-NAVIGATION')) leftover++
}
console.log(`\n── Verifikation ──`)
console.log(leftover === 0 ? '✅ Keine DEMO-HINWEIS/DEMO-NAVIGATION mehr vorhanden' : `❌ ${leftover} Dateien mit Resten!`)

// Stichprobe Div-Balance auf 3 geänderten Dateien
const sample = stats.changed.slice(0, 3)
for (const f of sample) {
  const html = fs.readFileSync(path.join(PUBLIC, f), 'utf8')
  const opens = (html.match(/<div[\s>]/g) || []).length
  const closes = (html.match(/<\/div>/g) || []).length
  console.log(`  Div-Balance ${f}: ${opens}/${closes} ${opens === closes ? '✅' : '❌'}`)
}
