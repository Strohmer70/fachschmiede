import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    // 2026-10-02: Data-Cache-Bug Fix — jeder Fetch no-store (vgl. lib/supabase.ts)
    global: { fetch: ((url: any, init: any = {}) => fetch(url, { ...init, cache: 'no-store' as any })) as typeof fetch }
  })
}

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // Lese eine existierende Seite um das Schema zu verstehen
    const { data: page } = await supabaseAdmin
      .from('landing_pages')
      .select('*')
      .limit(1)
      .single()

    return NextResponse.json({
      schema: page ? Object.keys(page) : 'no pages found',
      example: page
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
