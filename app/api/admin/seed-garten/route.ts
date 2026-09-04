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
  { name: 'Bergkamen', slug: 'bergkamen', region: 'Nordrhein-Westfalen' },
  { name: 'Bochum', slug: 'bochum', region: 'Nordrhein-Westfalen' },
  { name: 'Castrop-Rauxel', slug: 'castrop-rauxel', region: 'Nordrhein-Westfalen' },
  { name: 'Dortmund', slug: 'dortmund', region: 'Nordrhein-Westfalen' },
  { name: 'Ennepetal', slug: 'ennepetal', region: 'Nordrhein-Westfalen' },
  { name: 'Fröndenberg', slug: 'froendenberg', region: 'Nordrhein-Westfalen' },
  { name: 'Gevelsberg', slug: 'gevelsberg', region: 'Nordrhein-Westfalen' },
  { name: 'Hagen', slug: 'hagen', region: 'Nordrhein-Westfalen' },
  { name: 'Hattingen', slug: 'hattingen', region: 'Nordrhein-Westfalen' },
  { name: 'Herne', slug: 'herne', region: 'Nordrhein-Westfalen' },
  { name: 'Holzwickede', slug: 'holzwickede', region: 'Nordrhein-Westfalen' },
  { name: 'Iserlohn', slug: 'iserlohn', region: 'Nordrhein-Westfalen' },
  { name: 'Kamen', slug: 'kamen', region: 'Nordrhein-Westfalen' },
  { name: 'Lünen', slug: 'luenen', region: 'Nordrhein-Westfalen' },
  { name: 'München', slug: 'muenchen', region: 'Bayern' },
  { name: 'Schwelm', slug: 'schwelm', region: 'Nordrhein-Westfalen' },
  { name: 'Schwerte', slug: 'schwerte', region: 'Nordrhein-Westfalen' },
  { name: 'Sprockhövel', slug: 'sprockhoevel', region: 'Nordrhein-Westfalen' },
  { name: 'Unna', slug: 'unna', region: 'Nordrhein-Westfalen' },
  { name: 'Wetter (Ruhr)', slug: 'wetter-ruhr', region: 'Nordrhein-Westfalen' },
  { name: 'Witten', slug: 'witten', region: 'Nordrhein-Westfalen' }
]

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const results: string[] = []

    // 1. Trade anlegen oder finden
    const { data: existingTrade } = await supabaseAdmin
      .from('trades')
      .select('id')
      .eq('slug', 'garten-und-landschaftsbau')
      .single()

    let tradeId: string
    if (existingTrade?.id) {
      tradeId = existingTrade.id
      results.push(`✅ Trade existiert: ${tradeId}`)
    } else {
      const { data: newTrade, error } = await supabaseAdmin
        .from('trades')
        .insert({
          name: 'Garten und Landschaftsbau',
          slug: 'garten-und-landschaftsbau',
          plural_name: 'Garten und Landschaftsbau',
          description: 'Professionelle Garten- und Landschaftsbau-Leistungen'
        })
        .select()
        .single()
      if (error) throw error
      tradeId = newTrade.id
      results.push(`✅ Trade angelegt: ${tradeId}`)
    }

    // 2. Cities
    const cityMap: Record<string, string> = {}
    for (const city of CITIES) {
      const { data: existing } = await supabaseAdmin
        .from('cities')
        .select('id')
        .eq('slug', city.slug)
        .single()

      if (existing?.id) {
        cityMap[city.slug] = existing.id
      } else {
        const { data: newCity, error } = await supabaseAdmin
          .from('cities')
          .insert(city)
          .select()
          .single()
        if (error) {
          results.push(`❌ City-Fehler ${city.name}: ${error.message}`)
          continue
        }
        cityMap[city.slug] = newCity.id
      }
    }
    results.push(`✅ ${Object.keys(cityMap).length} Cities bereit`)

    // 3. Landing Pages — nur bekannte Spalten (schema-sicher)
    let created = 0
    let existed = 0
    const errors: string[] = []
    
    for (const city of CITIES) {
      const cityId = cityMap[city.slug]
      if (!cityId) continue

      const slug = `garten-und-landschaftsbau-${city.slug}`
      const { data: existing } = await supabaseAdmin
        .from('landing_pages')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existing?.id) {
        existed++
        continue
      }

      // Nur Felder die garantiert existieren
      const insertData: any = {
        slug,
        trade_id: tradeId,
        city_id: cityId,
        status: 'available',
      }

      const { error } = await supabaseAdmin
        .from('landing_pages')
        .insert(insertData)

      if (error) {
        errors.push(`${slug}: ${error.message}`)
      } else {
        created++
      }
    }

    results.push(`✅ ${created} Pages angelegt, ${existed} existierten bereits`)

    return NextResponse.json({
      success: true,
      summary: `Garten-Seed: ${created} neu, ${existed} existing`,
      details: results
    })

  } catch (err: any) {
    console.error('Seed error:', err)
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 })
  }
}
