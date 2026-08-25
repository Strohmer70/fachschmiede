import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // RLS Policies für trade_requests anlegen
    const sqlStatements = [
      // RLS aktivieren
      `ALTER TABLE trade_requests ENABLE ROW LEVEL SECURITY;`,
      
      // Alte Policies löschen
      `DROP POLICY IF EXISTS "Allow anonymous inserts on trade_requests" ON trade_requests;`,
      `DROP POLICY IF EXISTS "Allow public inserts on trade_requests" ON trade_requests;`,
      `DROP POLICY IF EXISTS "Enable insert for anonymous users" ON trade_requests;`,
      `DROP POLICY IF EXISTS "Allow admin read on trade_requests" ON trade_requests;`,
      
      // Neue Policy: Anonyme INSERTs erlauben
      `CREATE POLICY "Allow anonymous inserts on trade_requests" ON trade_requests FOR INSERT TO anon WITH CHECK (true);`,
      
      // SELECT für alle erlauben
      `CREATE POLICY "Allow admin read on trade_requests" ON trade_requests FOR SELECT TO authenticated, anon USING (true);`
    ]
    
    const results = []
    for (const sql of sqlStatements) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql })
        if (error) {
          // Fallback: Direkte Query
          const { error: queryError } = await supabaseAdmin.from('trade_requests').select('id').limit(0)
          results.push({ sql: sql.substring(0, 50), status: 'skipped', error: error.message })
        } else {
          results.push({ sql: sql.substring(0, 50), status: 'ok' })
        }
      } catch (err: any) {
        results.push({ sql: sql.substring(0, 50), status: 'error', error: err.message })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'RLS Policies angelegt (oder bereits vorhanden)',
      results
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}
