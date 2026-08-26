import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ═══════════════════════════════════════════
// API: Alle Gewerke (trades) abrufen
// ═══════════════════════════════════════════

export const dynamic = 'force-dynamic'

// Erstelle Admin-Client direkt in der Route (robuster)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      `Missing env vars: URL=${!!supabaseUrl}, SERVICE_KEY=${!!supabaseServiceKey}. ` +
      `SUPABASE_SERVICE_ROLE_KEY muss in Vercel Production gesetzt sein!`
    )
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get('active') === 'true'
    
    let query = supabaseAdmin
      .from('trades')
      .select('*')
      .order('name', { ascending: true })
    
    if (activeOnly) {
      query = query.eq('is_active', true)
    }
    
    const { data: trades, error } = await query
    
    if (error) throw error

    // Page-Counts für jedes Trade berechnen
    const tradesWithCounts = await Promise.all(
      (trades || []).map(async (trade) => {
        try {
          const { count: total, error: countErr } = await supabaseAdmin
            .from('landing_pages')
            .select('*', { count: 'exact', head: true })
            .eq('trade_id', trade.id)

          const { count: rented, error: rentedErr } = await supabaseAdmin
            .from('landing_pages')
            .select('*', { count: 'exact', head: true })
            .eq('trade_id', trade.id)
            .eq('status', 'rented')

          const totalPages = total || 0
          const rentedPages = rented || 0

          return {
            ...trade,
            total_pages: totalPages,
            rented_pages: rentedPages,
            available_pages: totalPages - rentedPages
          }
        } catch (err) {
          console.error(`[Trades] Fehler beim Zählen für ${trade.slug}:`, err)
          return {
            ...trade,
            total_pages: 0,
            rented_pages: 0,
            available_pages: 0
          }
        }
      })
    )
    
    return NextResponse.json({
      success: true,
      trades: tradesWithCounts
    })
    
  } catch (err: any) {
    console.error('Trades GET error:', err)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}
