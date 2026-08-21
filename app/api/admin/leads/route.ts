import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const trade = searchParams.get('trade')
    const city = searchParams.get('city')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('leads')
      .select(`
        *,
        landing_page:landing_pages(id, slug, title, trade_id, city_id, status),
        trade:trades(name, slug),
        city:cities(name, slug)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (trade) {
      query = query.eq('landing_page.trade_id', trade)
    }

    if (city) {
      query = query.eq('landing_page.city_id', city)
    }

    const { data: leads, error, count } = await query

    if (error) throw error

    // Get summary stats
    const { count: totalCount } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })

    const { count: newCount } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new')

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo)

    return NextResponse.json({
      leads: leads || [],
      stats: {
        total: totalCount || 0,
        new: newCount || 0,
        recent30d: recentCount || 0,
      },
      pagination: {
        limit,
        offset,
        hasMore: (leads?.length || 0) === limit,
      }
    })

  } catch (error: any) {
    console.error('Admin leads error:', error)
    return NextResponse.json({
      error: 'Failed to load leads',
      message: error.message,
      leads: [],
      stats: { total: 0, new: 0, recent30d: 0 },
      pagination: { limit: 100, offset: 0, hasMore: false },
    }, { status: 500 })
  }
}

// PATCH — Lead-Status aktualisieren
export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID und Status erforderlich' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      lead: data?.[0],
    })

  } catch (error: any) {
    console.error('Lead update error:', error)
    return NextResponse.json(
      { error: 'Update fehlgeschlagen', message: error.message },
      { status: 500 }
    )
  }
}
