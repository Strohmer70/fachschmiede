// app/api/legal/route.ts — Öffentlicher Endpunkt: Betreiber-Rechtsangaben
// Befüllt impressum.html + datenschutz.html (statischer Export → Client-Side-Fill,
// Fallback = statische Datei-Inhalte, die bereits stimmen).
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from('platform_settings')
      .select('value')
      .eq('key', 'legal')
      .maybeSingle()
    return NextResponse.json({ ok: true, legal: data?.value || {} })
  } catch (e: any) {
    return NextResponse.json({ ok: false, legal: {}, error: e.message }, { status: 500 })
  }
}
