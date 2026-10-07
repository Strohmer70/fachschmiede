// scripts/add-paypal-checkout.js — PayPal als primäre Zahlungsoption in alle 6 Salespages
// Fügt PayPal-Radio (checked, default) + PayPal-Panel + SDK-Flow ein; Stripe bleibt als Option.
const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('public').filter(f => /^sales-.*\.html$/.test(f)).map(f => path.join('public', f));

// A) Grid 2→3 Spalten + PayPal-Option FIRST (checked) — Kreditkarte-Option verliert checked
const OLD_GRID_OPEN = `<div class="grid sm:grid-cols-2 gap-3">
            <label class="pay-opt cursor-pointer border-2 border-brand-600 bg-brand-50 rounded-xl p-4 block transition" onclick="pickPay(this)">
              <input type="radio" name="pay" value="card" checked class="sr-only">`;
const NEW_GRID_OPEN = `<div class="grid sm:grid-cols-3 gap-3">
            <label class="pay-opt cursor-pointer border-2 border-[#0070ba] bg-[#f0f7ff] rounded-xl p-4 block transition" onclick="pickPay(this)" title="Empfohlen: PayPal">
              <input type="radio" name="pay" value="paypal" checked class="sr-only">
              <span class="font-bold text-ink-900 text-sm"><span style="color:#003087;font-weight:900;font-style:italic">Pay</span><span style="color:#0079c1;font-weight:900;font-style:italic">Pal</span> <span class="ml-1 align-middle text-[9px] font-black bg-[#0070ba] text-white rounded px-1.5 py-0.5 uppercase tracking-wide">Empfohlen</span></span>
              <span class="mt-1 block text-[11px] text-ink-500 leading-snug">Käuferschutz · Karte &amp; Lastschrift auch ohne PayPal-Konto<br>Abwicklung via <strong>PayPal</strong></span>
            </label>
            <label class="pay-opt cursor-pointer border-2 border-ink-200 rounded-xl p-4 block transition hover:border-brand-400" onclick="pickPay(this)">
              <input type="radio" name="pay" value="card" class="sr-only">`;

// B) Hinweistext
const OLD_NOTE = '<p class="mt-2 text-xs text-ink-400">Sichere Abwicklung über Stripe – keine Zahlungsdaten auf unseren Servern.</p>';
const NEW_NOTE = '<p class="mt-2 text-xs text-ink-400">Sichere Abwicklung über <strong>PayPal</strong> oder <strong>Stripe</strong> – keine Zahlungsdaten auf unseren Servern.</p>';

// C) PayPal-Panel vor pubBtn
const OLD_PUBBTN = '<button id="pubBtn" onclick="publish()"';
const PANEL = `<div id="paypalPanel" class="hidden mt-6 text-left bg-[#f0f7ff] border-2 border-[#0070ba] rounded-xl p-5">
        <p class="font-black text-ink-900 text-lg">Fast geschafft! 🎉</p>
        <p id="paypalPanelText" class="mt-1 text-sm text-ink-600 leading-relaxed">Dein Konto ist angelegt. Bestätige jetzt dein Abo bei PayPal:</p>
        <div id="paypal-button-container" class="mt-4 max-w-sm"></div>
        <p class="mt-3 text-[11px] text-ink-400">Nach der Bestätigung bist du sofort live — dein Dashboard-Zugang kommt per E-Mail.</p>
      </div>
        <button id="pubBtn" onclick="publish()"`;

// D) publish(): PayPal-Branch (nach checkout_url-Branch)
const OLD_REDIRECT = 'if(data.checkout_url){ window.location.href = data.checkout_url; return; }';
const NEW_REDIRECT = `if(data.checkout_url){ window.location.href = data.checkout_url; return; }
    if(data.paypal && data.paypal.subscription_id){ startPayPalFlow(data.paypal); return; }`;

// E) PayPal-Funktionen (vor onb.addEventListener-Anker)
const ANCHOR_ONB = "onb.addEventListener('click', e => { if(e.target === onb) closeOnboarding(); });";
const PAYPAL_FUNCS = `// ── PayPal-Abo-Flow (primär; Stripe = Option) ──
function startPayPalFlow(pp){
  const step3 = document.getElementById('step3');
  if(step3){ step3.querySelectorAll(':scope > *').forEach(function(el){ if(el.id !== 'paypalPanel') el.style.display = 'none'; }); }
  const panel = document.getElementById('paypalPanel');
  if(panel){
    panel.classList.remove('hidden');
    const txt = document.getElementById('paypalPanelText');
    if(txt) txt.innerHTML = (window.onbMode === 'test')
      ? 'Dein Konto ist angelegt. Bestätige jetzt deine <strong>kostenlose 14-Tage-Testphase</strong> bei PayPal (danach <span class="dynPrice">189 €</span>/Monat — jederzeit kündbar):'
      : 'Dein Konto ist angelegt. Bestätige jetzt dein Abo (<span class="dynPrice">189 €</span>/Monat, monatlich kündbar) bei PayPal:';
  }
  loadPayPalSdk(pp.client_id, function(){
    window.paypal.Buttons({
      style: { shape:'rect', color:'blue', layout:'vertical', label:'subscribe' },
      createSubscription: function(){ return pp.subscription_id; },
      onApprove: function(){
        const slug = GEWERK_SLUG + '-' + (CITY_SLUGS[onbCity] || '');
        window.location.href = 'https://www.fachschmiede.de/mieten/erfolg/?slug=' + encodeURIComponent(slug);
      },
      onCancel: function(){ if(typeof showToast==='function') showToast('PayPal-Vorgang abgebrochen — der Button bleibt bereit.'); },
      onError: function(err){ console.error('PayPal Fehler', err); alert('PayPal-Fehler — bitte erneut versuchen oder Stripe als Zahlungsmethode wählen.'); }
    }).render('#paypal-button-container');
  });
}
function loadPayPalSdk(clientId, cb){
  if(window.paypal){ return cb(); }
  const s = document.createElement('script');
  s.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(clientId) + '&vault=true&intent=subscription&currency=EUR&components=buttons';
  s.onload = cb;
  document.head.appendChild(s);
}
` + ANCHOR_ONB;

// F) doneMsg: Stripe → PayPal oder Stripe
const OLD_DONE = 'Zahlungsmethode (Stripe).';
const NEW_DONE = 'Zahlungsmethode (PayPal oder Stripe).';

let fail = 0;
for (const f of files) {
  let html = fs.readFileSync(f, 'utf8');
  const checks = [
    ['GRID', OLD_GRID_OPEN, NEW_GRID_OPEN],
    ['NOTE', OLD_NOTE, NEW_NOTE],
    ['PANEL', OLD_PUBBTN, PANEL],
    ['REDIRECT', OLD_REDIRECT, NEW_REDIRECT],
    ['FUNCS', ANCHOR_ONB, PAYPAL_FUNCS],
    ['DONE', OLD_DONE, NEW_DONE],
  ];
  let fileChanges = 0;
  for (const [tag, from, to] of checks) {
    if (!html.includes(from)) { console.log('✗ ' + f + ' [' + tag + '] Anker nicht gefunden'); fail++; continue; }
    html = html.split(from).join(to);
    fileChanges++;
  }
  if (fileChanges === checks.length) {
    fs.writeFileSync(f, html);
    console.log('✓ ' + f + ' (' + fileChanges + ' Patches)');
  }
}
if (fail) { console.log('FEHLER:', fail, 'Anker fehlten!'); process.exit(1); }
console.log('ALLE 6 SALESPAGES GEPATCHT');
