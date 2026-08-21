import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const trade = searchParams.get('trade') || null
    const status = searchParams.get('status') || null
    
    const offset = (page - 1) * limit

    // ── PAGINIERTE ABFRAGE ──
    let query = supabaseAdmin
      .from('landing_pages')
      .select(`
        *,
        trade:trades(name, slug),
        city:cities(name, slug),
        page_customizations(*, tenant:tenants(*))
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (trade) {
      query = query.eq('trade.slug', trade)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: pages, count: totalCount, error } = await query

    if (error) {
      console.error('Pages query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      pages: pages || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      }
    })

  } catch (error: any) {
    console.error('Admin pages error:', error)
    return NextResponse.json({ 
      error: 'Failed to load pages',
      message: error.message,
      pages: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
    }, { status: 500 })
  }
}
