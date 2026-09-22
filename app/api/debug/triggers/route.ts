// app/api/debug/triggers/route.ts — TEMPORÄR: Row-Zustand + updated_timestamp
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: rows, error } = await supabaseAdmin
    .from('landing_pages')
    .select('id, slug, status, rented_by, created_at, updated_at')
    .eq('slug', 'dachdecker-herne')
  return NextResponse.json({ rows: rows || null, error: error?.message || null, now: new Date().toISOString() })
}
