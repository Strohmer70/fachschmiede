// app/api/cron/gsc-sync/route.ts — Täglicher Google-Position-Sync (Vercel Cron)
// Auth: Bearer CRON_SECRET (Vercel-Env) ODER Admin-Login-Token (manueller Sync aus Admin)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/admin-auth'
import { getGscConfig, gscQueryPagePosition } from '@/lib/gsc'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 Min. erlaubt (Pro-Plan-Fallback: 60s, reicht für ~120 Seiten)

const BASE_URL = 'https://www.fachschmiede.de'

// Ziel-Keywords fürs Ranking: "gewerk stadt" (Dieter 2026-10-15).
// Suchverhalten-optimiert: zimmere matcht zimmerer+zimmerei, gartenbau = galab-Kurzform
const TRADE_KEYWORD: Record<string, string> = {
  dachdecker: 'dachdecker',
  elektriker: 'elektriker',
  klempner: 'klempner',
  maler: 'maler',
  zimmerer: 'zimmere',
  'garten-und-landschaftsbau': 'gartenbau',
}

export async function GET(req: NextRequest) {
  // Auth: Bearer CRON_SECRET (Vercel-Env) ODER Bearer gsc_sync_secret (platform_settings)
  // ODER Admin-Login-Token (manueller Sync aus dem Admin-Dashboard)
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  let authorized = checkAdminAuth(req as unknown as Request)
  if (!authorized && token) {
    if (process.env.CRON_SECRET && token === process.env.CRON_SECRET) authorized = true
    if (!authorized) {
      const { data } = await supabaseAdmin.from('platform_settings').select('value').eq('key', 'gsc_sync_secret').maybeSingle()
      if (data?.value && token === data.value) authorized = true
    }
  }
  if (!authorized) return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 401 })

  const cfg = await getGscConfig()
  if (!cfg?.refresh_token || !cfg?.property) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'GSC nicht verbunden' })
  }

  // ALLE Seiten (frei + vermietet) — Admin will das volle Ranking-Bild,
  // auch freie Seiten mit guter Position sind Verkaufsargumente!
  const { data: pages, error } = await supabaseAdmin
    .from('landing_pages')
    .select('id, slug, status, trade:trades(slug, name), city:cities(slug, name)')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const list: any[] = (pages || []).filter((p: any) => p?.trade?.slug && p?.city?.slug)

  let updated = 0
  const failures: { slug: string; error: string }[] = []
  for (const p of list) {
    const url = `${BASE_URL}/${p.trade.slug}/${p.city.slug}/`
    // Haupt-Keyword "gewerk stadt" (erster Wortteil der Stadt — "Mülheim an der Ruhr" → "mülheim")
    const tradeKw = TRADE_KEYWORD[p.trade.slug] || p.trade.slug
    const cityKw = (p.city?.name || p.city?.slug || '').toLowerCase().split(' ')[0]
    const mainKw = `${tradeKw} ${cityKw}`
    try {
      const pos = await gscQueryPagePosition(cfg, url, mainKw)
      const row = {
        landing_page_id: p.id,
        keyword: mainKw, // IMMER das Ziel-Keyword zeigen, auch bei 0 Impressionen
        position: pos?.position ?? null,
        clicks_30d: pos?.clicks ?? 0,
        impressions_30d: pos?.impressions ?? 0,
        checked_at: new Date().toISOString(),
      }
      const { error: upErr } = await supabaseAdmin
        .from('page_positions')
        .upsert(row, { onConflict: 'landing_page_id' })
      if (upErr) failures.push({ slug: p.slug, error: upErr.message })
      else updated++
    } catch (e: any) {
      failures.push({ slug: p.slug, error: e.message })
    }
  }

  console.log(`[gsc-sync] ${updated}/${list.length} aktualisiert, ${failures.length} Fehler`)
  return NextResponse.json({ ok: true, total: list.length, updated, failures: failures.slice(0, 10) })
}
