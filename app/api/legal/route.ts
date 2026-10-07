// app/api/legal/route.ts — Öffentlicher Endpunkt: Betreiber-Rechtsangaben + System-Preis
// Befüllt impressum.html + datenschutz.html (statischer Export → Client-Side-Fill,
// Fallback = statische Datei-Inhalte, die bereits stimmen).
// 2026-10-07: liefert zusätzlich pricing (Admin-Einstellungen) — SSOT für Salespages/Startseite.
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const [{ data: legalRow }, { data: pricingRow }] = await Promise.all([
      supabaseAdmin.from('platform_settings').select('value').eq('key', 'legal').maybeSingle(),
      supabaseAdmin.from('platform_settings').select('value').eq('key', 'pricing').maybeSingle(),
    ])
    return NextResponse.json({
      ok: true,
      legal: legalRow?.value || {},
      pricing: pricingRow?.value || { monthly: 189 },
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, legal: {}, pricing: { monthly: 189 }, error: e.message }, { status: 500 })
  }
}
