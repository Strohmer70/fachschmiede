import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Update all except Munich to 189€
    const { data: updated1, error: err1 } = await supabaseAdmin
      .from('landing_pages')
      .update({ monthly_price: 18900 })
      .neq('city_id', '3e06da46-0a2a-415d-a6bf-2b65a1d169ae')
      .select('slug, monthly_price')

    if (err1) throw err1

    // 2. Update Munich to 289€
    const { data: updated2, error: err2 } = await supabaseAdmin
      .from('landing_pages')
      .update({ monthly_price: 28900 })
      .eq('city_id', '3e06da46-0a2a-415d-a6bf-2b65a1d169ae')
      .select('slug, monthly_price')

    if (err2) throw err2

    // 3. Verify
    const { data: all, error: err3 } = await supabaseAdmin
      .from('landing_pages')
      .select('slug, monthly_price')

    if (err3) throw err3

    const price149 = all?.filter(p => p.monthly_price === 14900).length || 0
    const price189 = all?.filter(p => p.monthly_price === 18900).length || 0
    const price289 = all?.filter(p => p.monthly_price === 28900).length || 0

    return NextResponse.json({
      success: true,
      updated: (updated1?.length || 0) + (updated2?.length || 0),
      breakdown: {
        '149€ (old)': price149,
        '189€ (Basis)': price189,
        '289€ (Pro/Munich)': price289,
      },
      total: all?.length || 0,
      message: price149 === 0 ? '✅ All prices fixed!' : `⚠️ ${price149} pages still have 149€`
    })

  } catch (error: any) {
    console.error('Fix prices error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
