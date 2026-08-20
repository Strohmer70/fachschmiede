import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

// Mapping: Datei-Kürzel → Trade-Slug
const TRADE_MAP: Record<string, string> = {
  'dach': 'dachdecker',
  'elek': 'elektriker',
  'shk': 'shk',
  'zimm': 'zimmerer',
  'maler': 'maler',
}

// Zählt statische HTML-Dateien im public-Ordner
function countStaticPages(): Record<string, number> {
  const publicDir = path.join(process.cwd(), 'public')
  const files = fs.readdirSync(publicDir)
  
  const counts: Record<string, number> = {}
  
  for (const file of files) {
    if (!file.startsWith('stadt-') || !file.endsWith('.html')) continue
    
    const parts = file.replace('.html', '').split('-')
    const tradeKey = parts[1]
    const tradeSlug = TRADE_MAP[tradeKey]
    
    if (tradeSlug) {
      counts[tradeSlug] = (counts[tradeSlug] || 0) + 1
    }
  }
  
  return counts
}

export async function GET() {
  try {
    // Get all trades from database
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

    // Get landing pages from database
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

    // Zähle statische Dateien (Quelle der Wahrheit)
    const staticCounts = countStaticPages()

    // Aggregate counts per trade
    const tradeStats = (trades || []).map((trade) => {
      const tradePages = pages?.filter((p) => p.trade_id === trade.id) || []
      
      // Verwende statische Zählung als Quelle der Wahrheit
      // (da die statischen HTML-Dateien existieren müssen)
      const staticCount = staticCounts[trade.slug] || tradePages.length
      
      return {
        id: trade.id,
        name: trade.name,
        slug: trade.slug,
        description: trade.description,
        emoji: trade.slug === 'dachdecker' ? '🏠' :
               trade.slug === 'elektriker' ? '⚡' :
               trade.slug === 'shk' || trade.slug === 'klempner' ? '🔥' :
               trade.slug === 'maler' ? '🎨' :
               trade.slug === 'zimmerer' ? '🔨' : '🏠',
        icon: null,
        total_pages: staticCount,
        rented_pages: tradePages.filter((p) => p.status === 'rented').length,
        available_pages: staticCount - tradePages.filter((p) => p.status === 'rented').length,
        status: staticCount > 0 ? 'live' : 'planned',
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
