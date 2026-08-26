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
  let requestId: string | null = null
  let supabaseAdmin: any = null
  
  try {
    supabaseAdmin = getSupabaseAdmin()
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
    console.log(`[Generate] Lade Trade Request: ${request_id}`)
    const { data: request, error: reqError } = await supabaseAdmin
      .from('trade_requests')
      .select('*')
      .eq('id', request_id)
      .single()

    if (reqError || !request) {
      console.error('[Generate] Trade Request nicht gefunden:', reqError)
      return NextResponse.json(
        { success: false, error: 'Trade Request nicht gefunden' },
        { status: 404 }
      )
    }

    console.log(`[Generate] Starte Generierung für: ${request.name} (${request.slug})`)

    // 2. Trade in 'trades' Tabelle anlegen
    let tradeId: string | null = null
    try {
      const { data: existingTrade } = await supabaseAdmin
        .from('trades')
        .select('id')
        .eq('slug', request.slug)
        .single()

      if (existingTrade?.id) {
        tradeId = existingTrade.id
        console.log(`[Generate] Trade existiert bereits: ${tradeId}`)
      } else {
        const { data: newTrade, error: tradeError } = await supabaseAdmin
          .from('trades')
          .insert({
            name: request.name,
            slug: request.slug,
            plural_name: request.name,
            description: `Professionelle ${request.name}-Leistungen`
          })
          .select()
          .single()

        if (tradeError) {
          console.error('[Generate] Fehler beim Trade-Insert:', tradeError)
          throw new Error(`Trade-Insert fehlgeschlagen: ${tradeError.message}`)
        }
        tradeId = newTrade.id
        console.log(`[Generate] Trade angelegt: ${request.name} (${tradeId})`)
      }
    } catch (tradeErr: any) {
      console.error('[Generate] Trade-Fehler:', tradeErr)
      throw new Error(`Trade-Erstellung fehlgeschlagen: ${tradeErr.message}`)
    }

    if (!tradeId) {
      throw new Error('Konnte kein Trade erstellen oder finden')
    }

    // 3. Städte laden
    const { data: cities, error: citiesError } = await supabaseAdmin
      .from('cities')
      .select('*')
      .limit(request.city_count || 10)

    if (citiesError) {
      console.error('[Generate] Fehler beim Laden der Städte:', citiesError)
      throw new Error(`Städte laden fehlgeschlagen: ${citiesError.message}`)
    }

    if (!cities || cities.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keine Städte in der Datenbank gefunden' },
        { status: 400 }
      )
    }

    console.log(`[Generate] ${cities.length} Städte geladen`)

    // 4. Landing Pages erstellen
    const createdPages = []
    for (const city of cities) {
      const slug = `${request.slug}-${city.slug}`
      
      try {
        // Prüfen ob Page schon existiert
        const { data: existingPage } = await supabaseAdmin
          .from('landing_pages')
          .select('id')
          .eq('slug', slug)
          .single()

        if (existingPage) {
          console.log(`[Generate] Page existiert bereits: ${slug}`)
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
            monthly_price: 18900,
            status: 'available'
          })
          .select()
          .single()

        if (pageError) {
          console.error(`[Generate] Fehler bei ${slug}:`, pageError)
          continue
        }

        createdPages.push(page)
        console.log(`[Generate] Landing Page erstellt: ${slug}`)
      } catch (pageErr) {
        console.error(`[Generate] Exception bei ${slug}:`, pageErr)
        continue
      }
    }

    // 5. Artikel-Platzhalter erstellen
    const createdArticles = []
    try {
      const articleTopics = generateArticleTopics(request.name)
      
      for (const topic of articleTopics) {
        for (const city of cities.slice(0, 3)) {
          try {
            const { data: article, error: articleError } = await supabaseAdmin
              .from('articles')
              .insert({
                title: `${topic.title} in ${city.name}`,
                slug: `${request.slug}-${city.slug}-${topic.slug}`,
                excerpt: topic.excerpt.replace('{city}', city.name),
                content: `Platzhalter - wird von KI generiert. Thema: ${topic.title} in ${city.name}`,
                status: 'draft',
                ai_generated: true
              })
              .select()
              .single()

            if (!articleError && article) {
              createdArticles.push(article)
            } else if (articleError) {
              console.error(`[Generate] Artikel-Fehler:`, articleError)
            }
          } catch (artErr) {
            console.error(`[Generate] Artikel-Exception:`, artErr)
          }
        }
      }
    } catch (articlesErr) {
      console.error('[Generate] Artikel-Generierung Fehler:', articlesErr)
      // Nicht fatal - Artikel sind optional
    }

    // 6. Status aktualisieren
    try {
      const updateData: any = {
        status: 'ready',
        generated_pages: createdPages.length,
        generated_articles: createdArticles.length,
        completed_at: new Date().toISOString()
      }
      
      // Nur updaten wenn Spalten existieren
      const { error: updateError } = await supabaseAdmin
        .from('trade_requests')
        .update(updateData)
        .eq('id', request_id)

      if (updateError) {
        console.error('[Generate] Status-Update Fehler:', updateError)
      }
    } catch (updateErr) {
      console.error('[Generate] Status-Update Exception:', updateErr)
    }

    // 7. Log-Eintrag (optional)
    try {
      await supabaseAdmin
        .from('generation_logs')
        .insert({
          trade_request_id: request_id,
          step: 'generation_complete',
          status: 'success',
          message: `${createdPages.length} Seiten, ${createdArticles.length} Artikel erstellt`
        })
    } catch (logErr) {
      console.log('[Generate] Log nicht geschrieben (Tabelle evtl. nicht vorhanden):', logErr)
      // Nicht fatal
    }

    return NextResponse.json({
      success: true,
      trade_name: request.name,
      trade_slug: request.slug,
      pages_created: createdPages.length,
      articles_created: createdArticles.length,
      message: `✅ ${request.name} erfolgreich generiert! ${createdPages.length} Seiten, ${createdArticles.length} Artikel.`
    })

  } catch (err: any) {
    console.error('[Generate] UNEXPECTED ERROR:', err)
    
    // Fehler loggen (optional)
    if (requestId && supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('generation_logs')
          .insert({
            trade_request_id: requestId,
            step: 'generation_error',
            status: 'error',
            message: err.message || 'Unbekannter Fehler'
          })
      } catch (logErr) {
        console.error('[Generate] Konnte Fehler nicht loggen:', logErr)
      }
    }

    return NextResponse.json(
      { success: false, error: err.message || 'Unbekannter Fehler bei der Generierung' },
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
