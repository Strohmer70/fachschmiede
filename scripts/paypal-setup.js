// PayPal-Einmal-Setup: Produkt + Pläne (trial/immediate) + Webhooks — LIVE & SANDBOX
// Ergebnis: scripts/paypal-setup-result.json → danach in platform_settings übertragen
const fs = require('fs');

const MODES = {
  live: {
    base: 'https://api-m.paypal.com',
    id: process.env.PP_LIVE_ID,
    secret: process.env.PP_LIVE_SECRET,
  },
  sandbox: {
    base: 'https://api-m.sandbox.paypal.com',
    id: process.env.PP_SANDBOX_ID,
    secret: process.env.PP_SANDBOX_SECRET,
  },
};
const PRICE_CENTS = 18900; // €189/Monat
const TRIAL_DAYS = 14;
const WEBHOOK_URL = 'https://www.fachschmiede.de/api/paypal/webhook/';
const EVENTS = [
  'BILLING.SUBSCRIPTION.ACTIVATED',
  'BILLING.SUBSCRIPTION.CANCELLED',
  'BILLING.SUBSCRIPTION.SUSPENDED',
  'BILLING.SUBSCRIPTION.EXPIRED',
  'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
  'PAYMENT.CAPTURE.COMPLETED',
];

async function token(mode) {
  const m = MODES[mode];
  const r = await fetch(m.base + '/v1/oauth2/token', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Basic ' + Buffer.from(m.id + ':' + m.secret).toString('base64') },
    body: 'grant_type=client_credentials',
  });
  const d = await r.json();
  if (!d.access_token) throw new Error(mode + ' token failed: ' + JSON.stringify(d));
  return d.access_token;
}
async function api(mode, t, path, body, method) {
  const m = MODES[mode];
  const r = await fetch(m.base + path, {
    method: method || (body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t, 'Prefer': 'return=representation' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(mode + ' ' + path + ' → ' + r.status + ': ' + JSON.stringify(d).slice(0, 400));
  return d;
}

(async () => {
  const out = { price_cents: PRICE_CENTS, trial_days: TRIAL_DAYS, modes: {} };
  for (const mode of ['live', 'sandbox']) {
    console.log('=== ' + mode.toUpperCase() + ' ===');
    const t = await token(mode);

    // 1. Produkt (Service)
    const product = await api(mode, t, '/v1/catalogs/products', {
      name: 'fachschmiede.de Mietseite',
      description: 'Monatliche Miete einer lokalen SEO-Landingpage auf fachschmiede.de',
      type: 'SERVICE',
      category: 'SOFTWARE',
    });
    console.log('Produkt:', product.id);

    // 2a. Plan MIT 14-Tage-Testphase
    const planTrial = await api(mode, t, '/v1/billing/plans', {
      product_id: product.id,
      name: 'Mietseite 189 EUR/Monat (14 Tage kostenlos testen)',
      description: '14 Tage kostenlos, danach 189 EUR monatlich',
      status: 'ACTIVE',
      billing_cycles: [
        {
          tenure_type: 'TRIAL',
          sequence: 1,
          total_cycles: 1,
          pricing_scheme: { fixed_price: { value: '0', currency_code: 'EUR' } },
          frequency: { interval_unit: 'DAY', interval_count: TRIAL_DAYS },
        },
        {
          tenure_type: 'REGULAR',
          sequence: 2,
          total_cycles: 0,
          pricing_scheme: { fixed_price: { value: (PRICE_CENTS / 100).toFixed(2), currency_code: 'EUR' } },
          frequency: { interval_unit: 'MONTH', interval_count: 1 },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 2,
      },
    });
    console.log('Plan TRIAL:', planTrial.id);

    // 2b. Plan SOFORT (kein Test)
    const planImmediate = await api(mode, t, '/v1/billing/plans', {
      product_id: product.id,
      name: 'Mietseite 189 EUR/Monat (sofort)',
      description: '189 EUR monatlich, Beginn sofort',
      status: 'ACTIVE',
      billing_cycles: [
        {
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: { fixed_price: { value: (PRICE_CENTS / 100).toFixed(2), currency_code: 'EUR' } },
          frequency: { interval_unit: 'MONTH', interval_count: 1 },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 2,
      },
    });
    console.log('Plan IMMEDIATE:', planImmediate.id);

    // 3. Webhook registrieren
    const hook = await api(mode, t, '/v1/notifications/webhooks', {
      url: WEBHOOK_URL,
      event_types: EVENTS.map(et => ({ name: et })),
    });
    console.log('Webhook:', hook.id);

    out.modes[mode] = {
      product_id: product.id,
      plans: { trial: planTrial.id, immediate: planImmediate.id },
      webhook_id: hook.id,
    };
  }
  fs.writeFileSync('scripts/paypal-setup-result.json', JSON.stringify(out, null, 2));
  console.log('\n✓ GESCHRIEBEN: scripts/paypal-setup-result.json');
})().catch(e => { console.error('SETUP-FEHLER:', e.message); process.exit(1); });
