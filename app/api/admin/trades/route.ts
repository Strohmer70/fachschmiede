import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Get all trades
    const { data: trades, error: tradesError } = await supabaseAdmin
      .from('trades')
      .select('id, name, slug, description')
      .order('name')

    if (tradesError) {
      console.error('Error fetching trades:', tradesError)
      return NextResponse.json({ 
        error: 'Failed to fetch trades', 
        details: tradesError.message 
      }, { status: 500 })
    }

    // Get landing pages
    const { data: pages, error: pagesError } = await supabaseAdmin
      .from('landing_pages')
      .select('trade_id, status')

    if (pagesError) {
      console.error('Error fetching pages:', pagesError)
      return NextResponse.json({ 
        error: 'Failed to fetch pages', 
        details: pagesError.message 
      }, { status: 500 })
    }

    // Aggregate counts per trade
    const tradeStats = (trades || []).map((trade) => {
      const tradePages = pages?.filter((p) => p.trade_id === trade.id) || []
      return {
        id: trade.id,
        name: trade.name,
        slug: trade.slug,
        description: trade.description,
        emoji: '🏠',
        icon: null,
        total_pages: tradePages.length,
        rented_pages: tradePages.filter((p) => p.status === 'rented').length,
        available_pages: tradePages.filter((p) => p.status === 'available').length,
        status: tradePages.length > 0 ? 'live' : 'planned',
      }
    })

    return NextResponse.json({
      success: true,
      trades: tradeStats,
      requests: [],
    })

  } catch (err) {
    console.error('Trades API error:', err)
    return NextResponse.json({ 
      error: 'Failed to fetch trades', 
      details: err instanceof Error ? err.message : 'Unknown error' 
    }, { status: 500 })
  }
}
