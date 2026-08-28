import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const trade = searchParams.get('trade') || null
    const status = searchParams.get('status') || null
    const slug = searchParams.get('slug') || null
    
    const offset = (page - 1) * limit

    // ── PAGINIERTE ABFRAGE ──
    let query = supabaseAdmin
      .from('landing_pages')
      .select(`
        *,
        trade:trades(name, slug),
        city:cities(name, slug),
        page_customizations(*, tenant:tenants(*))
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (slug) {
      query = query.eq('slug', slug)
    } else {
      query = query.range(offset, offset + limit - 1)
    }

    if (trade) {
      query = query.eq('trade.slug', trade)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: pages, count: totalCount, error } = await query

    if (error) {
      console.error('Pages query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      pages: pages || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      }
    })

  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { trade_slug, city_name, region } = body

    if (!trade_slug || !city_name) {
      return NextResponse.json({ 
        success: false, 
        error: 'trade_slug und city_name sind erforderlich' 
      }, { status: 400 })
    }

    // Trade laden
    const { data: trade, error: tradeError } = await supabaseAdmin
      .from('trades')
      .select('id, name, slug')
      .eq('slug', trade_slug)
      .single()

    if (tradeError || !trade) {
      return NextResponse.json({ 
        success: false, 
        error: 'Gewerk nicht gefunden' 
      }, { status: 404 })
    }

    // City slug generieren
    const citySlug = city_name.toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Prüfen ob Stadt schon existiert
    const { data: existingCity } = await supabaseAdmin
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single()

    let cityId = existingCity?.id

    // Stadt anlegen falls nicht existiert
    if (!cityId) {
      const { data: newCity, error: cityError } = await supabaseAdmin
        .from('cities')
        .insert({
          name: city_name,
          slug: citySlug,
          region: region || null,
        })
        .select('id')
        .single()
      
      if (cityError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Fehler beim Anlegen der Stadt: ' + cityError.message 
        }, { status: 500 })
      }
      cityId = newCity.id
    }

    // Prüfen ob Landing Page schon existiert
    const pageSlug = `${trade_slug}-${citySlug}`
    const { data: existingPage } = await supabaseAdmin
      .from('landing_pages')
      .select('id')
      .eq('slug', pageSlug)
      .single()

    if (existingPage) {
      return NextResponse.json({ 
        success: false, 
        error: 'Diese Stadt-Website existiert bereits' 
      }, { status: 409 })
    }

    // Content JSON generieren
    const contentJson = generateContentJson(trade_slug, city_name)

    // Landing Page anlegen
    const { data: newPage, error: pageError } = await supabaseAdmin
      .from('landing_pages')
      .insert({
        trade_id: trade.id,
        city_id: cityId,
        slug: pageSlug,
        title: `${trade.name} ${city_name}`,
        meta_description: `Ihr ${trade.name} in ${city_name} ✓ Professionelle Leistungen ✓ Kostenlose Beratung ✓ Festpreis-Garantie. Jetzt anrufen!`,
        h1: `${trade.name} in ${city_name}`,
        content_json: contentJson,
        status: 'available',
        monthly_price: 18900,
      })
      .select('*')
      .single()

    if (pageError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Fehler beim Anlegen der Seite: ' + pageError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      page: newPage,
      message: `${trade.name} ${city_name} wurde erfolgreich gelistet!`
    })

  } catch (error: any) {
    console.error('Admin pages POST error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Server-Fehler',
      message: error.message
    }, { status: 500 })
  }
}

function generateContentJson(tradeSlug: string, city: string) {
  const tradeNames: Record<string, string> = {
    dachdecker: 'Dachdecker',
    elektriker: 'Elektriker',
    klempner: 'Klempner',
    maler: 'Maler',
    zimmerer: 'Zimmerer',
  }

  const trade = tradeNames[tradeSlug] || tradeSlug

  const templates: Record<string, any> = {
    dachdecker: {
      hero_title: `${trade} in ${city}. Festpreis. Feste Termine.`,
      hero_subtitle: `Ein Dach zeigt seine Schwächen meist erst, wenn es zu spät ist – undichte Stellen, lose Ziegel, verstopfte Rinnen. In ${city} schauen wir uns Ihr Dach kostenlos an und sagen Ihnen ehrlich, was nötig ist und was warten kann.`,
      faq: [
        { q: `Was kostet eine Dachreparatur in ${city}?`, a: 'Die Kosten hängen vom Umfang der Schäden ab. Nach der kostenlosen Besichtigung erhalten Sie einen verbindlichen Festpreis – ohne versteckte Kosten.' },
        { q: 'Wie lange dauert eine Dachsanierung?', a: 'Die Dauer hängt vom Projekt ab. Eine typische Sanierung dauert zwischen einer Woche und drei Wochen.' },
        { q: 'Gibt es eine Garantie auf Dacharbeiten?', a: 'Ja, wir gewährleisten auf alle Dacharbeiten eine umfassende Garantie.' },
        { q: 'Bieten Sie kostenlose Besichtigungen an?', a: 'Ja, wir bieten eine kostenlose und unverbindliche Erstbesichtigung vor Ort an.' },
      ],
    },
    elektriker: {
      hero_title: `${trade} in ${city}. Sicher. Kompetent. Vor Ort.`,
      hero_subtitle: `Ob Stromausfall, neue Elektroinstallation oder Smart-Home-Umstellung – in ${city} sind wir Ihr zuverlässiger Partner für alle elektrischen Arbeiten. Kostenlose Erstberatung vor Ort.`,
      faq: [
        { q: `Was kostet eine Elektroinstallation in ${city}?`, a: 'Die Kosten hängen vom Umfang ab. Wir erstellen Ihnen ein kostenloses Angebot vor Ort.' },
        { q: 'Wie schnell sind Sie bei einem Stromausfall vor Ort?', a: `Bei Notfällen sind wir in der Regel innerhalb von 1-2 Stunden in ${city} vor Ort.` },
        { q: 'Erhalten Sie auch Elektro-Gutachten?', a: 'Ja, wir erstellen Elektro-Gutachten für Versicherungen und Behörden.' },
        { q: 'Sind Sie für Smart-Home-Installationen zertifiziert?', a: 'Ja, wir sind auf Smart-Home-Systeme spezialisiert und beraten Sie gerne kostenlos.' },
      ],
    },
    klempner: {
      hero_title: `${trade} in ${city}. Schnell. Sauber. Fair.`,
      hero_subtitle: `Rohrbruch, Heizungsausfall oder neue Sanitärinstallation – in ${city} sind wir Ihr zuverlässiger Klempner. 24h-Notdienst, transparente Preise, feste Termine.`,
      faq: [
        { q: `Was kostet ein Klempner in ${city}?`, a: 'Wir berechnen transparente Festpreise. Nach der kostenlosen Besichtigung erhalten Sie ein verbindliches Angebot.' },
        { q: 'Bieten Sie einen 24h-Notdienst an?', a: 'Ja, unser Notdienst ist rund um die Uhr für Sie da – auch an Wochenenden und Feiertagen.' },
        { q: 'Wie lange dauert eine Heizungsinstallation?', a: 'Eine komplette Heizungsinstallation dauert in der Regel 1-3 Tage, je nach Umfang.' },
        { q: 'Reparieren Sie auch Rohrbrüche?', a: 'Ja, Rohrbrüche gehören zu unseren Kernkompetenzen. Wir finden die Leckage und reparieren sie fachgerecht.' },
      ],
    },
    maler: {
      hero_title: `${trade} in ${city}. Farbe, die hält.`,
      hero_subtitle: `Ob Neuanstrich, Renovierung oder kreative Wandgestaltung – in ${city} bringen wir Farbe in Ihr Leben. Kostenlose Beratung, Festpreis-Garantie, saubere Arbeit.`,
      faq: [
        { q: `Was kostet ein Maler in ${city}?`, a: 'Die Kosten hängen von der Fläche und den Anforderungen ab. Wir erstellen Ihnen ein kostenloses Angebot vor Ort.' },
        { q: 'Wie lange dauert ein Raum streichen?', a: 'Ein durchschnittlicher Raum (20m²) dauert etwa 1-2 Tage inklusive Trocknungszeit.' },
        { q: 'Verwenden Sie ökologische Farben?', a: 'Ja, wir bieten eine große Auswahl an umweltfreundlichen und lösemittelfreien Farben an.' },
        { q: 'Übernehmen Sie auch Tapezierarbeiten?', a: 'Ja, wir sind auch auf Tapezierarbeiten spezialisiert – von Vliestapete bis zu exklusiven Designer-Tapeten.' },
      ],
    },
    zimmerer: {
      hero_title: `${trade} in ${city}. Solide. Traditionell. Innovativ.`,
      hero_subtitle: `Vom Carport bis zur Dachkonstruktion – in ${city} realisieren wir Ihre Holzprojekte mit Handwerkskunst und moderner Technik. Kostenlose Beratung vor Ort.`,
      faq: [
        { q: `Was kostet ein Carport in ${city}?`, a: 'Die Kosten hängen von Größe und Material ab. Wir erstellen Ihnen ein kostenloses Angebot mit Festpreis-Garantie.' },
        { q: 'Wie lange hält eine Holzkonstruktion?', a: 'Mit fachgerechter Behandlung halten unsere Holzkonstruktionen 30-50 Jahre und länger.' },
        { q: 'Arbeiten Sie auch mit Fichtenholz?', a: 'Ja, wir verarbeiten alle gängigen Holzarten – von Fichte über Lärche bis zur Eiche.' },
        { q: 'Bieten Sie auch Reparaturen an?', a: 'Ja, wir reparieren und sanieren bestehende Holzkonstruktionen fachgerecht.' },
      ],
    },
  }

  return templates[tradeSlug] || null
}
