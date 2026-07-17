import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: pages, error } = await supabase
      .from('landing_pages')
      .select('slug, status')
      .limit(5)

    if (error) {
      return NextResponse.json({
        status: 'error',
        step: 'supabase_query',
        message: error.message,
      }, { status: 500 })
    }

    if (!pages || pages.length === 0) {
      return NextResponse.json({
        status: 'warning',
        message: 'Supabase connected but no landing_pages found',
      })
    }

    return NextResponse.json({
      status: 'ok',
      pages_found: pages.length,
      pages: pages.map(p => p.slug),
    })

  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      message: err.message,
    }, { status: 500 })
  }
}
