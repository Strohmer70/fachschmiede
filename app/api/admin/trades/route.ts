import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════
// API: Alle Gewerke (trades) abrufen
// ═══════════════════════════════════════════

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get('active') === 'true'
    
    let query = supabaseAdmin
      .from('trades')
      .select('*')
      .order('name', { ascending: true })
    
    if (activeOnly) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      trades: data || []
    })
    
  } catch (err: any) {
    console.error('Trades GET error:', err)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}
