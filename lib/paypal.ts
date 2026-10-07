// lib/paypal.ts — PayPal REST-Helper: Token-Cache, Mode (live/sandbox), Plan-Verwaltung
// Setup-Daten (Produkt/Pläne/Webhook-IDs) liegen in platform_settings key 'paypal'.
// Mode-Umschaltung für Sandbox-Tests: platform_settings.paypal.mode = 'sandbox' | 'live'
import { supabaseAdmin } from '@/lib/supabase'

export type PayPalMode = 'live' | 'sandbox'

interface PayPalConfig {
  mode: PayPalMode
  price_cents: number
  trial_days: number
  modes: {
    live: { product_id: string; plans: { trial: string; immediate: string }; webhook_id: string }
    sandbox: { product_id: string; plans: { trial: string; immediate: string }; webhook_id: string }
  }
}

let _cfg: PayPalConfig | null = null
let _cfgAt = 0

export async function getPayPalConfig(): Promise<PayPalConfig | null> {
  // 60s Cache — Mode-Wechsel für Tests greift also spätestens nach 1 Minute
  if (_cfg && Date.now() - _cfgAt < 60_000) return _cfg
  const { data, error } = await supabaseAdmin
    .from('platform_settings').select('value').eq('key', 'paypal').maybeSingle()
  if (error) throw new Error('paypal config DB: ' + error.message)
  if (!data?.value?.modes) return null
  _cfg = data.value as PayPalConfig
  if (!_cfg.mode) _cfg.mode = 'live'
  _cfgAt = Date.now()
  return _cfg
}

export function ppBase(cfg: PayPalConfig): string {
  return cfg.mode === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
}
export function ppClientId(cfg: PayPalConfig): string {
  return cfg.mode === 'sandbox'
    ? process.env.PAYPAL_SANDBOX_ID || ''
    : process.env.PAYPAL_CLIENT_ID || ''
}
export function ppSecret(cfg: PayPalConfig): string {
  return cfg.mode === 'sandbox'
    ? process.env.PAYPAL_SANDBOX_SECRET || ''
    : process.env.PAYPAL_CLIENT_SECRET || ''
}
export function ppWebhookId(cfg: PayPalConfig): string {
  return cfg.modes[cfg.mode]?.webhook_id || ''
}

// ── Token-Cache (59 Min gültig, 55 Min cachen) ──
const _tokens: Record<string, { token: string; until: number }> = {}

export async function ppToken(cfg: PayPalConfig): Promise<string> {
  const cached = _tokens[cfg.mode]
  if (cached && Date.now() < cached.until) return cached.token
  const auth = Buffer.from(ppClientId(cfg) + ':' + ppSecret(cfg)).toString('base64')
  const r = await fetch(ppBase(cfg) + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + auth,
    },
    body: 'grant_type=client_credentials',
  })
  const d: any = await r.json().catch(() => ({}))
  if (!r.ok || !d.access_token) throw new Error('PayPal token (' + cfg.mode + ') ' + r.status + ': ' + JSON.stringify(d).slice(0, 200))
  _tokens[cfg.mode] = { token: d.access_token, until: Date.now() + 55 * 60_000 }
  return d.access_token
}

export async function ppApi(cfg: PayPalConfig, path: string, body?: any, method?: string): Promise<any> {
  const t = await ppToken(cfg)
  const r = await fetch(ppBase(cfg) + path, {
    method: method || (body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t, Prefer: 'return=representation' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const d: any = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error('PayPal ' + path + ' → ' + r.status + ': ' + JSON.stringify(d).slice(0, 300))
  return d
}

// ── Plan je Preis holen oder anlegen (Cache in platform_settings.paypal.plans_by_price) ──
export async function getOrCreatePlan(cfg: PayPalConfig, priceCents: number, withTrial: boolean): Promise<string> {
  const key = String(priceCents)
  const kind = withTrial ? 'trial' : 'immediate'
  // 1) Setup-Script hat Pläne für den Standardpreis hinterlegt → direkt nutzen
  const modePlan = (cfg.modes as any)?.[cfg.mode]?.plans?.[kind]
  const isDefaultPrice = priceCents === (cfg.price_cents || 18900)
  if (modePlan && isDefaultPrice) return modePlan
  // 2) Dynamisch erstellte Pläne (z.B. anderer Preis) aus dem Cache
  const cached = (cfg as any).plans_by_price?.[key]?.[kind]?.[cfg.mode]
  if (cached) return cached

  const modeCfg = cfg.modes[cfg.mode]
  const planBody: any = {
    product_id: modeCfg.product_id,
    name: `Mietseite ${(priceCents / 100).toFixed(0)} EUR/Monat${withTrial ? ' (14 Tage kostenlos)' : ' (sofort)'}`,
    status: 'ACTIVE',
    billing_cycles: withTrial
      ? [
          {
            tenure_type: 'TRIAL', sequence: 1, total_cycles: 1,
            pricing_scheme: { fixed_price: { value: '0', currency_code: 'EUR' } },
            frequency: { interval_unit: 'DAY', interval_count: cfg.trial_days || 14 },
          },
          {
            tenure_type: 'REGULAR', sequence: 2, total_cycles: 0,
            pricing_scheme: { fixed_price: { value: (priceCents / 100).toFixed(2), currency_code: 'EUR' } },
            frequency: { interval_unit: 'MONTH', interval_count: 1 },
          },
        ]
      : [
          {
            tenure_type: 'REGULAR', sequence: 1, total_cycles: 0,
            pricing_scheme: { fixed_price: { value: (priceCents / 100).toFixed(2), currency_code: 'EUR' } },
            frequency: { interval_unit: 'MONTH', interval_count: 1 },
          },
        ],
    payment_preferences: { auto_bill_outstanding: true, setup_fee_failure_action: 'CONTINUE', payment_failure_threshold: 2 },
  }
  const plan = await ppApi(cfg, '/v1/billing/plans', planBody)

  // Cache schreiben
  const { data: cur } = await supabaseAdmin.from('platform_settings').select('value').eq('key', 'paypal').maybeSingle()
  const val = (cur?.value || {}) as any
  val.plans_by_price = val.plans_by_price || {}
  val.plans_by_price[key] = val.plans_by_price[key] || {}
  val.plans_by_price[key][withTrial ? 'trial' : 'immediate'] = {
    ...(val.plans_by_price[key][withTrial ? 'trial' : 'immediate'] || {}),
    [cfg.mode]: plan.id,
  }
  await supabaseAdmin.from('platform_settings').upsert({ key: 'paypal', value: val }, { onConflict: 'key' })
  _cfg = null // Cache invalidieren, damit nächster Call den Plan-Cache sieht

  return plan.id
}

// ── Subscription anlegen (Server-seitig, Status APPROVAL_PENDING) ──
// custom_id trägt ALLE IDs als kompaktes JSON (PayPal hat kein Key-Value-Metadata)
export async function createSubscription(
  cfg: PayPalConfig,
  planId: string,
  ids: { slug: string; landingPageId: string; tenantId: string; email: string; tradePath: string }
): Promise<string> {
  const sub = await ppApi(cfg, '/v1/billing/subscriptions', {
    plan_id: planId,
    custom_id: JSON.stringify({ s: ids.slug, p: ids.landingPageId, t: ids.tenantId }),
    ...(ids.email ? { subscriber: { email_address: ids.email } } : {}),
    application_context: {
      brand_name: 'fachschmiede.de',
      locale: 'de-DE',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      return_url: `https://www.fachschmiede.de/mieten/erfolg/?slug=${encodeURIComponent(ids.slug)}`,
      cancel_url: `https://www.fachschmiede.de/${ids.tradePath}/`,
    },
  })
  return sub.id
}
