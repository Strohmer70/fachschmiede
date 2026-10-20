// app/api/admin/seo/rankings/route.ts — SEO-Hub: Google-Rankings (GSC, page_positions)
// GET: GSC-Positionen aller Landpages + KPI-Aggregation (letzter Sync)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

function authed(req: NextRequest): boolean {
  return checkAdminAuth(req as unknown as Request)
}

export async function GET(req: NextRequest) {
  try {
    if (!authed(req)) return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 401 })
    const { data, error } = await supabaseAdmin
      .from('page_positions')
      .select('keyword, position, clicks_30d, impressions_30d, checked_at, page:landing_pages(slug, title, status, trade:trades(slug, name), city:cities(slug, name))')
    if (error) throw error

    const rows = (data || []).map((r: any) => {
      const p = r.page || {}
      const url = p?.trade?.slug && p?.city?.slug
        ? `https://www.fachschmiede.de/${p.trade.slug}/${p.city.slug}/`
        : null
      return {
        keyword: r.keyword,
        position: r.position != null ? Math.round(r.position * 10) / 10 : null,
        clicks_30d: r.clicks_30d || 0,
        impressions_30d: r.impressions_30d || 0,
        checked_at: r.checked_at,
        page_title: p?.title || null,
        page_slug: p?.slug || null,
        page_status: p?.status || null,
        trade: p?.trade?.name || null,
        city: p?.city?.name || null,
        url,
      }
    })

    // Sichtbar = Impressionen > 0 (nur die fließen in Ø-Position ein)
    const visible = rows
      .filter(r => r.impressions_30d > 0 && r.position != null)
      .map(r => ({ ...r, position: r.position as number }))
    const top10 = visible.filter(r => r.position <= 10)
    const top30 = visible.filter(r => r.position <= 30)
    const sumImp = visible.reduce((s, r) => s + r.impressions_30d, 0)
    const avgPos = sumImp > 0
      ? Math.round(visible.reduce((s, r) => s + r.position * r.impressions_30d, 0) / sumImp * 10) / 10
      : null
    const lastSync = rows.reduce((m: string | null, r) =>
      r.checked_at && (!m || r.checked_at > m) ? r.checked_at : m, null)

    // Sortierung: Top-Positionen zuerst, dann Impressionen
    const sorted = [...rows].sort((a, b) => {
      const pa = a.position ?? 9999, pb = b.position ?? 9999
      if (a.impressions_30d > 0 || b.impressions_30d > 0) {
        if (pa !== pb) return pa - pb
        return b.impressions_30d - a.impressions_30d
      }
      return b.impressions_30d - a.impressions_30d
    })

    return NextResponse.json({
      ok: true,
      kpis: {
        tracked: rows.length,
        visible: visible.length,
        top10: top10.length,
        top30: top30.length,
        avg_position: avgPos,
        clicks_30d: rows.reduce((s, r) => s + r.clicks_30d, 0),
        impressions_30d: rows.reduce((s, r) => s + r.impressions_30d, 0),
        last_sync: lastSync,
      },
      rankings: sorted.slice(0, 150),
    })
  } catch (err: any) {
    console.error('[admin/seo/rankings] GET:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
