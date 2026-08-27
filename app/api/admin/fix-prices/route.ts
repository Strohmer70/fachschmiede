import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Update ALL pages to 189€ (vereinfachtes Preismodell)
    const { data: updated, error: err1 } = await supabaseAdmin
      .from('landing_pages')
      .update({ monthly_price: 18900 })
      .select('slug, monthly_price')

    if (err1) throw err1

    // Verify
    const { data: all, error: err2 } = await supabaseAdmin
      .from('landing_pages')
      .select('slug, monthly_price')

    if (err2) throw err2

    const price189 = all?.filter(p => p.monthly_price === 18900).length || 0
    const otherPrices = all?.filter(p => p.monthly_price !== 18900).length || 0

    return NextResponse.json({
      success: true,
      updated: updated?.length || 0,
      breakdown: {
        '189€ (Standard)': price189,
        'Andere Preise': otherPrices,
      },
      total: all?.length || 0,
      message: otherPrices === 0 ? '✅ Alle Preise vereinheitlicht auf 189€!' : `⚠️ ${otherPrices} Seiten haben noch abweichende Preise`
    })

  } catch (error: any) {
    console.error('Fix prices error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
