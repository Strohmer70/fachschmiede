// lib/gsc.ts — Google Search Console API (2026-10-14)
// Credentials liegen in platform_settings key 'gsc': { client_id, client_secret, refresh_token, property }
// OAuth-Flow: /api/admin/gsc/connect → Google → /api/admin/gsc/callback
import { supabaseAdmin } from '@/lib/supabase'

export interface GscConfig {
  client_id: string
  client_secret: string
  refresh_token: string
  property: string // z.B. 'sc-domain:fachschmiede.de' oder 'https://www.fachschmiede.de/'
  connected_email?: string
}

export async function getGscConfig(): Promise<GscConfig | null> {
  const { data, error } = await supabaseAdmin.from('platform_settings').select('value').eq('key', 'gsc').maybeSingle()
  if (error) throw new Error('gsc config read: ' + error.message)
  const v = (data as any)?.value
  if (!v || !v.client_id || !v.client_secret) return null
  return v as GscConfig
}

export async function saveGscConfig(patch: Partial<GscConfig>): Promise<GscConfig> {
  const cur = (await getGscConfig()) || ({ client_id: '', client_secret: '', refresh_token: '', property: '' } as GscConfig)
  const next = { ...cur, ...patch }
  const { error } = await supabaseAdmin.from('platform_settings').upsert({ key: 'gsc', value: next }, { onConflict: 'key' })
  if (error) throw new Error('gsc config save: ' + error.message)
  return next
}

// ── Access-Token via Refresh-Token (client_credentials im Body) ──
export async function gscAccessToken(cfg: GscConfig): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: cfg.client_id,
      client_secret: cfg.client_secret,
      refresh_token: cfg.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  const j = await res.json().catch(() => ({}))
  if (!res.ok || !j.access_token) throw new Error('GSC token: ' + (j.error_description || j.error || res.status))
  return j.access_token
}

// ── Verifizierte Properties listen ──
export async function gscListSites(cfg: GscConfig): Promise<{ siteUrl: string; permissionLevel: string }[]> {
  const token = await gscAccessToken(cfg)
  const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const j = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error('GSC sites: ' + (j.error?.message || res.status))
  return j.siteEntry || []
}

// ── Position einer einzelnen Seite (letzte 30 Tage, bester Query nach Impressionen) ──
export async function gscQueryPagePosition(
  cfg: GscConfig,
  pageUrl: string
): Promise<{ keyword: string; position: number; clicks: number; impressions: number } | null> {
  const token = await gscAccessToken(cfg)
  const end = new Date()
  const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(cfg.property)}/searchAnalytics/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startDate: fmt(start),
      endDate: fmt(end),
      dimensions: ['query'],
      dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'equals', expression: pageUrl }] }],
      rowLimit: 25,
      dataState: 'all',
    }),
  })
  const j = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error('GSC query: ' + (j.error?.message || res.status))
  const rows = j.rows || []
  if (rows.length === 0) return null
  // Bester Keyword = meiste Impressionen
  const best = rows.reduce((a: any, b: any) => (b.impressions > a.impressions ? b : a))
  return {
    keyword: best.keys?.[0] || '',
    position: Math.round(best.position * 10) / 10,
    clicks: best.clicks || 0,
    impressions: best.impressions || 0,
  }
}
