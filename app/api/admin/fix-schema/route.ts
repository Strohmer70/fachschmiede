import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// Fix Schema: Add missing columns to landing_pages
export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const results: string[] = []

    // Add missing columns via raw SQL
    const fixes = [
      `ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS description TEXT`,
      `ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS title TEXT`,
      `ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS monthly_price INTEGER DEFAULT 14900`,
      `ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true`,
    ]

    for (const sql of fixes) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql })
      if (error) {
        // Try direct query if RPC fails
        const { error: qError } = await supabaseAdmin.from('_sql').select('*').limit(1)
        results.push(`⚠️ Schema-Fix: ${error.message}`)
      } else {
        results.push(`✅ Schema-Fix: ${sql}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Schema fixes attempted',
      details: results
    })

  } catch (err: any) {
    console.error('Schema fix error:', err)
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 })
  }
}
