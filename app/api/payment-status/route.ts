// app/api/payment-status/route.ts — Erfolgsseite fragt hier den echten Miet-Status
// GET ?slug=maler-schwerte → { status: 'available'|'rented', rented: boolean }
// Kein PII — nur öffentlicher Seitenstatus (für die Erfolgs-Poll-Logik)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') || ''
  if (!slug) return NextResponse.json({ error: 'slug fehlt' }, { status: 400 })
  const { data: page } = await supabaseAdmin
    .from('landing_pages')
    .select('status')
    .eq('slug', slug)
    .maybeSingle()
  if (!page) return NextResponse.json({ status: 'unknown', rented: false }, { status: 404 })
  return NextResponse.json({ status: page.status, rented: page.status === 'rented' })
}
