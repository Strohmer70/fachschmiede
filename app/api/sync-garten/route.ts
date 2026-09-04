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

const CITIES = [
  { name: 'Bergkamen', slug: 'bergkamen' },
  { name: 'Bochum', slug: 'bochum' },
  { name: 'Castrop-Rauxel', slug: 'castrop-rauxel' },
  { name: 'Dortmund', slug: 'dortmund' },
  { name: 'Ennepetal', slug: 'ennepetal' },
  { name: 'Fröndenberg', slug: 'froendenberg' },
  { name: 'Gevelsberg', slug: 'gevelsberg' },
  { name: 'Hagen', slug: 'hagen' },
  { name: 'Hattingen', slug: 'hattingen' },
  { name: 'Herne', slug: 'herne' },
  { name: 'Holzwickede', slug: 'holzwickede' },
  { name: 'Iserlohn', slug: 'iserlohn' },
  { name: 'Kamen', slug: 'kamen' },
  { name: 'Lünen', slug: 'luenen' },
  { name: 'Schwelm', slug: 'schwelm' },
  { name: 'Schwerte', slug: 'schwerte' },
  { name: 'Sprockhövel', slug: 'sprockhoevel' },
  { name: 'Unna', slug: 'unna' },
  { name: 'Wetter (Ruhr)', slug: 'wetter-ruhr' },
  { name: 'Witten', slug: 'witten' }
]

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Trade
    const { data: trade } = await supabaseAdmin
      .from('trades')
      .select('id')
      .eq('slug', 'garten-und-landschaftsbau')
      .single()

    if (!trade?.id) {
      return NextResponse.json({ error: 'Trade nicht gefunden' }, { status: 404 })
    }

    // Cities laden
    const { data: allCities } = await supabaseAdmin
      .from('cities')
      .select('id, slug')

    const cityMap: Record<string, string> = {}
    for (const c of allCities || []) {
      cityMap[c.slug] = c.id
    }

    // Neue Pages einfügen (NUR slug, trade_id, city_id, status)
    let created = 0
    let existed = 0
    const errors: string[] = []

    for (const city of CITIES) {
      const cityId = cityMap[city.slug]
      if (!cityId) {
        errors.push(`${city.slug}: City nicht gefunden`)
        continue
      }

      const slug = `garten-und-landschaftsbau-${city.slug}`
      
      // Prüfen ob existiert
      const { data: existing } = await supabaseAdmin
        .from('landing_pages')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existing?.id) {
        existed++
        continue
      }

      const { error } = await supabaseAdmin
        .from('landing_pages')
        .insert({ 
          slug, 
          trade_id: trade.id, 
          city_id: cityId, 
          status: 'available',
          title: `Garten und Landschaftsbau ${city.name}`
        })

      if (error) {
        errors.push(`${slug}: ${error.message}`)
      } else {
        created++
      }
    }

    return NextResponse.json({
      success: true,
      created,
      existed,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (err: any) {
    console.error('Sync error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
