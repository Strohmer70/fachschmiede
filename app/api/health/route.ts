import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test 1: Supabase connection
    const { data: pages, error } = await supabase
      .from('landing_pages')
      .select('slug, status')
      .limit(5)

    if (error) {
      return NextResponse.json({
        status: 'error',
        step: 'supabase_query',
        message: error.message,
        hint: 'Check Supabase URL and Anon Key in Vercel Environment Variables'
      }, { status: 500 })
    }

    // Test 2: Check if data exists
    if (!pages || pages.length === 0) {
      return NextResponse.json({
        status: 'warning',
        step: 'data_exists',
        message: 'Supabase connected but no landing_pages found',
        hint: 'Run the schema.sql in Supabase SQL Editor to seed data'
      }, { status: 200 })
    }

    return NextResponse.json({
      status: 'ok',
      pages_found: pages.length,
      pages: pages.map(p => p.slug),
      message: 'Everything is working!'
    })

  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      step: 'unknown',
      message: err.message,
      hint: 'Unexpected error occurred'
    }, { status: 500 })
  }
}
