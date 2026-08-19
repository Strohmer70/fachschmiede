import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Get all trades with their landing page counts
    const { data: trades, error: tradesError } = await supabaseAdmin
      .from('trades')
      .select('id, name, slug, description, emoji, icon')
      .order('name')

    if (tradesError) {
      console.error('Error fetching trades:', tradesError)
      return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 })
    }

    // Get landing page counts per trade
    const { data: pages, error: pagesError } = await supabaseAdmin
      .from('landing_pages')
      .select('trade_id, status')

    if (pagesError) {
      console.error('Error fetching pages:', pagesError)
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
    }

    // Aggregate counts per trade
    const tradeStats = (trades || []).map((trade) => {
      const tradePages = pages?.filter((p) => p.trade_id === trade.id) || []
      const totalPages = tradePages.length
      const rentedPages = tradePages.filter((p) => p.status === 'rented').length
      const availablePages = tradePages.filter((p) => p.status === 'available').length

      return {
        id: trade.id,
        name: trade.name,
        slug: trade.slug,
        description: trade.description,
        emoji: trade.emoji || '🏠',
        icon: trade.icon,
        total_pages: totalPages,
        rented_pages: rentedPages,
        available_pages: availablePages,
        status: totalPages > 0 ? 'live' : 'planned',
      }
    })

    // Get trade requests (from support/leads that mention new trades)
    const { data: requests, error: reqError } = await supabaseAdmin
      .from('leads')
      .select('id, message, created_at, status')
      .ilike('message', '%gewerk%')
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      trades: tradeStats,
      requests: requests || [],
    })
  } catch (err) {
    console.error('Trades API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
