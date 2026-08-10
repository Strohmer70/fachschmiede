import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    // 1. Alle Pages mit falschem Preis finden
    const { data: pages, error: fetchError } = await supabaseAdmin
      .from('landing_pages')
      .select('id, slug, monthly_price')
      .eq('monthly_price', 14900)

    if (fetchError) throw fetchError

    if (!pages || pages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Keine Pages mit 149 € gefunden — alles korrekt!',
        updated: 0,
      })
    }

    // 2. Alle auf 18900 cents (189 €) aktualisieren
    const { error: updateError } = await supabaseAdmin
      .from('landing_pages')
      .update({ monthly_price: 18900 })
      .eq('monthly_price', 14900)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      message: `${pages.length} Pages erfolgreich auf 189 € aktualisiert`,
      updated: pages.length,
      pages: pages.map(p => p.slug),
    })

  } catch (error: any) {
    console.error('Price fix error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
