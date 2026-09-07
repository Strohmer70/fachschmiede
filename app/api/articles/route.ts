import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

interface ArticleJson {
  title: string
  excerpt: string
  tag: string
  gradient: string
  svg: string
  url: string
}

interface ArticleIndex {
  [trade: string]: {
    [city: string]: ArticleJson[]
  }
}

// Lies Artikel aus der verschachtelten article-index.json
function getArticlesFromFile(): any[] {
  const indexPath = join(process.cwd(), 'lib', 'article-index.json')
  if (!existsSync(indexPath)) {
    console.log('article-index.json nicht gefunden:', indexPath)
    return []
  }

  try {
    const raw = readFileSync(indexPath, 'utf-8')
    const data: ArticleIndex = JSON.parse(raw)
    const articles: any[] = []

    Object.entries(data).forEach(([tradeSlug, cities]) => {
      Object.entries(cities).forEach(([citySlug, cityArticles]) => {
        cityArticles.forEach((article, idx) => {
          // Extrahiere Slug aus URL
          // URL Format: /{trade}/{city}/blog/{slug}/
          const urlParts = article.url.replace(/\/$/, '').split('/')
          const slug = urlParts[urlParts.length - 1] || `article-${idx}`

          // Versuche Wortzahl aus HTML-Datei zu ermitteln
          const htmlPath = join(process.cwd(), 'public', article.url.replace(/\/$/, '') + '.html')
          let wordCount = 0
          let fileSize = 0

          try {
            if (existsSync(htmlPath)) {
              const html = readFileSync(htmlPath, 'utf-8')
              // Zähle Wörter im Content-Bereich (zwischen <article> oder im Body)
              const textMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
                || html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
                || html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)

              if (textMatch) {
                const text = textMatch[1]
                  .replace(/<[^>]+>/g, ' ')  // HTML-Tags entfernen
                  .replace(/\s+/g, ' ')      // Whitespace normalisieren
                  .trim()
                wordCount = text.split(/\s+/).filter(w => w.length > 2).length
              }

              const stats = statSync(htmlPath)
              fileSize = stats.size
            }
          } catch (e) {
            // Ignoriere Fehler bei einzelnen Dateien
          }

          // Wenn keine Wortzahl aus HTML, schätze aus Dateigröße (ca. 5 Bytes pro Wort)
          if (wordCount === 0 && fileSize > 0) {
            wordCount = Math.round(fileSize / 5)
          }

          // Standard: 800 Wörter wenn nichts ermittelt werden konnte
          if (wordCount === 0) {
            wordCount = 800
          }

          articles.push({
            id: `${tradeSlug}-${citySlug}-${slug}`,
            title: article.title,
            slug: slug,
            excerpt: article.excerpt,
            tag: article.tag,
            file_path: `public${article.url}index.html`,
            url_path: article.url,
            trade_slug: tradeSlug,
            city_slug: citySlug,
            word_count: wordCount,
            status: 'published',  // Alle aus JSON sind online
            ai_generated: true,    // Alle sind KI-generiert
            published_at: new Date().toISOString(), // Fallback
            created_at: new Date().toISOString(),
            month_slug: 'legacy'
          })
        })
      })
    })

    console.log(`Geladen: ${articles.length} Artikel aus article-index.json`)
    return articles

  } catch (e) {
    console.error('Fehler beim Lesen von article-index.json:', e)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const trade = searchParams.get('trade') || ''
    const city = searchParams.get('city') || ''
    const limit = parseInt(searchParams.get('limit') || '500')  // Mehr Artikel!
    const offset = parseInt(searchParams.get('offset') || '0')

    // Versuche zuerst DB
    let articles: any[] = []
    let total = 0
    let source = 'database'

    try {
      let query = supabaseAdmin
        .from('articles')
        .select('*', { count: 'exact' })

      if (status !== 'all') {
        query = query.eq('status', status)
      }
      if (trade) {
        query = query.eq('trade_slug', trade)
      }
      if (city) {
        query = query.eq('city_slug', city)
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.log('DB Fehler:', error.message)
        throw error
      }

      articles = data || []
      total = count || 0

      // Wenn DB leer, verwende Fallback
      if (articles.length === 0) {
        throw new Error('DB ist leer')
      }

    } catch (dbError) {
      // Fallback: Lies aus article-index.json
      console.log('Verwende article-index.json Fallback')
      source = 'file'
      articles = getArticlesFromFile()
      total = articles.length

      // Filtere
      if (status !== 'all' && status !== 'published') {
        // Nur published Artikel in JSON
        articles = articles.filter(a => a.status === status)
      }
      if (trade) {
        articles = articles.filter(a => a.trade_slug === trade)
      }
      if (city) {
        articles = articles.filter(a => a.city_slug === city)
      }

      // Pagination
      const paginated = articles.slice(offset, offset + limit)

      return NextResponse.json({
        success: true,
        articles: paginated,
        stats: {
          total: articles.length,
          published: articles.filter(a => a.status === 'published').length,
          draft: articles.filter(a => a.status === 'draft').length,
          ai_generated: articles.filter(a => a.ai_generated).length
        },
        pagination: {
          total: articles.length,
          limit,
          offset,
          hasMore: offset + paginated.length < articles.length
        },
        source
      })
    }

    // Statistiken berechnen
    const stats = {
      total,
      published: articles.filter((a: any) => a.status === 'published').length,
      draft: articles.filter((a: any) => a.status === 'draft').length,
      ai_generated: articles.filter((a: any) => a.ai_generated).length
    }

    return NextResponse.json({
      success: true,
      articles,
      stats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + articles.length < total
      },
      source
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
