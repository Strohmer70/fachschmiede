import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ═══════════════════════════════════════════
// API: Auto-Generator für neue Gewerke
// Build: v2.1 - emoji-Spalte entfernt
// ═══════════════════════════════════════════

// API-Routen dürfen NIEMALS statisch generiert werden
export const dynamic = 'force-dynamic'

// Erstelle Admin-Client direkt in der Route
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY fehlt!')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function POST(req: NextRequest) {
  // request_id vor try Block extrahieren für Fehler-Logging
  let requestId: string | null = null
  
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await req.json()
    const { request_id } = body
    requestId = request_id

    if (!request_id) {
      return NextResponse.json(
        { success: false, error: 'request_id ist erforderlich' },
        { status: 400 }
      )
    }

    // 1. Trade Request laden
    const { data: request, error: reqError } = await supabaseAdmin
      .from('trade_requests')
      .select('*')
      .eq('id', request_id)
      .single()

    if (reqError || !request) {
      return NextResponse.json(
        { success: false, error: 'Trade Request nicht gefunden' },
        { status: 404 }
      )
    }

    console.log(`🚀 Starte Generierung für: ${request.name} (${request.slug})`)

    // 2. Trade in 'trades' Tabelle anlegen (falls noch nicht existiert)
    const { data: existingTrade } = await supabaseAdmin
      .from('trades')
      .select('id')
      .eq('slug', request.slug)
      .single()

    let tradeId = existingTrade?.id

    if (!tradeId) {
      const { data: newTrade, error: tradeError } = await supabaseAdmin
        .from('trades')
        .insert({
          name: request.name,
          slug: request.slug,
          plural_name: request.name,
          description: `Professionelle ${request.name}-Leistungen`,
          is_active: true
        })
        .select()
        .single()

      if (tradeError) throw tradeError
      tradeId = newTrade.id
      console.log(`✅ Trade angelegt: ${request.name}`)
    }

    // 3. Städte laden (die ersten 'city_count' Städte)
    const { data: cities } = await supabaseAdmin
      .from('cities')
      .select('*')
      .limit(request.city_count || 10)

    if (!cities || cities.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keine Städte in der Datenbank gefunden' },
        { status: 400 }
      )
    }

    // 4. Landing Pages für jede Stadt erstellen
    const createdPages = []
    for (const city of cities) {
      const slug = `${request.slug}-${city.slug}`
      
      // Prüfen ob Page schon existiert
      const { data: existingPage } = await supabaseAdmin
        .from('landing_pages')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existingPage) {
        console.log(`  ⚠️ Page existiert bereits: ${slug}`)
        continue
      }

      // Stadt-spezifische Inhalte generieren
      const cityContent = generateCityContent(request, city)

      const { data: page, error: pageError } = await supabaseAdmin
        .from('landing_pages')
        .insert({
          slug: slug,
          trade_id: tradeId,
          city_id: city.id,
          title: `${request.name} ${city.name}`,
          meta_description: cityContent.metaDescription,
          monthly_price: 18900, // 189 € in Cent
          status: 'available',
          content: cityContent.content,
          is_active: true
        })
        .select()
        .single()

      if (pageError) {
        console.error(`  ❌ Fehler bei ${slug}:`, pageError)
        continue
      }

      createdPages.push(page)
      console.log(`  ✅ Landing Page erstellt: ${slug}`)
    }

    // 5. Artikel-Platzhalter erstellen
    const createdArticles = []
    const articleTopics = generateArticleTopics(request.name)
    
    for (const topic of articleTopics) {
      for (const city of cities.slice(0, 3)) { // Nur für erste 3 Städte
        const { data: article, error: articleError } = await supabaseAdmin
          .from('articles')
          .insert({
            title: `${topic.title} in ${city.name}`,
            slug: `${request.slug}-${city.slug}-${topic.slug}`,
            excerpt: topic.excerpt.replace('{city}', city.name),
            content: `<!-- Platzhalter - wird von KI generiert -->\n\nThema: ${topic.title} in ${city.name}\nStadt: ${city.name}\nGewerk: ${request.name}\n\nDieser Artikel wird automatisch generiert...`,
            status: 'draft',
            ai_generated: true,
            word_count: 0,
            city_id: city.id,
            trade_id: tradeId
          })
          .select()
          .single()

        if (!articleError) {
          createdArticles.push(article)
        }
      }
    }

    // 6. Status aktualisieren
    await supabaseAdmin
      .from('trade_requests')
      .update({
        status: 'ready',
        generated_pages: createdPages.length,
        generated_articles: createdArticles.length,
        salespage_url: `/sales-${request.slug}.html`,
        completed_at: new Date().toISOString()
      })
      .eq('id', request_id)

    // 7. Log-Eintrag
    await supabaseAdmin
      .from('generation_logs')
      .insert({
        trade_request_id: request_id,
        step: 'generation_complete',
        status: 'success',
        message: `${createdPages.length} Seiten, ${createdArticles.length} Artikel erstellt`
      })

    return NextResponse.json({
      success: true,
      trade_name: request.name,
      trade_slug: request.slug,
      pages_created: createdPages.length,
      articles_created: createdArticles.length,
      salespage_url: `/sales-${request.slug}.html`,
      message: `✅ ${request.name} erfolgreich generiert! ${createdPages.length} Seiten, ${createdArticles.length} Artikel.`
    })

  } catch (err: any) {
    console.error('Generate trade error:', err)
    
    // Fehler loggen
    if (requestId) {
      await supabaseAdmin
        .from('generation_logs')
        .insert({
          trade_request_id: requestId,
          step: 'generation_error',
          status: 'error',
          message: err.message
        })
    }

    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}

// Hilfsfunktion: Stadt-spezifische Inhalte generieren
function generateCityContent(request: any, city: any) {
  const tradeName = request.name
  const cityName = city.name
  
  // Einzigartige Meta-Description pro Stadt
  const metaDescription = `Ihr ${tradeName} in ${cityName} ✓ Professionelle Leistungen ✓ Kostenlose Beratung ✓ Festpreis-Garantie. Jetzt anrufen!`
  
  // Einzigartiger Content (später durch KI ersetzt)
  const content = {
    hero: {
      headline: `Ihr ${tradeName} in ${cityName}`,
      subheadline: `Professionelle Leistungen aus einer Hand – persönlich, sauber und zuverlässig. Für Privat- und Geschäftskunden in ${cityName} und Umgebung.`
    },
    about: {
      text: `${cityName} mit seinen ${city.einwohner?.toLocaleString() || 'vielen'} Einwohnern hat einen besonderen Bedarf an qualifizierten ${tradeName}. Wir kennen die Region und bieten maßgeschneiderte Lösungen.`
    }
  }

  return {
    metaDescription,
    content: JSON.stringify(content)
  }
}

// Hilfsfunktion: Artikel-Themen generieren
function generateArticleTopics(tradeName: string): Array<{title: string, slug: string, excerpt: string}> {
  return [
    {
      title: `5 Tipps zur Wahl des richtigen ${tradeName}`,
      slug: '5-tipps-wahl',
      excerpt: 'Worauf Sie bei der Auswahl eines professionellen {city} achten sollten.'
    },
    {
      title: `Kosten für ${tradeName}-Leistungen in {city}`,
      slug: 'kosten-leistungen',
      excerpt: 'Was kosten typische Leistungen eines {city}? Ein Preis-Leistungs-Überblick.'
    },
    {
      title: `Notfall: Wann Sie einen ${tradeName} brauchen`,
      slug: 'notfall-wann',
      excerpt: 'Die wichtigsten Anzeichen, dass Sie professionelle Hilfe benötigen.'
    }
  ]
}
