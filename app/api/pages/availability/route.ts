import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════════════
// GET /api/pages/availability — ÖFFENTLICH, kein Auth nötig.
// Liefert die Slugs aller vermieteten Seiten (status='rented').
// Wird von den Salespages genutzt, um Karten/Badges/Checkout LIVE
// aus der DB (SSOT) zu rendern — statische Karten sonst veralten!
// 2026-10-16: Bugfix "vermietete Seite auf Salespage weiter mietbar".
// ═══════════════════════════════════════════════════════════════════
export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('landing_pages')
    .select('slug')
    .eq('status', 'rented')

  if (error) {
    // Fail-open: bei DB-Fehler nichts sperren (Checkout-API blockt final ohnehin per 409)
    console.error('[availability] DB-Fehler:', error.message)
    return NextResponse.json({ rented: [] })
  }

  return NextResponse.json(
    { rented: (data || []).map((r: { slug: string }) => r.slug) },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
  )
}
