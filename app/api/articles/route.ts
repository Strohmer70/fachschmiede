import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

// Fallback: Lies Artikel aus article-index.json wenn DB leer
function getArticlesFromFile() {
  const indexPath = join(process.cwd(), 'lib', 'article-index.json')
  if (!existsSync(indexPath)) return []
  
  try {
    const data = JSON.parse(readFileSync(indexPath, 'utf-8'))
    return data.articles || []
  } catch (e) {
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const trade = searchParams.get('trade') || ''
    const city = searchParams.get('city') || ''
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Prüfe ob articles Tabelle existiert
    let articles = []
    let total = 0
    
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
      
      if (error) throw error
      
      articles = data || []
      total = count || 0
    } catch (dbError) {
      // Fallback: Lies aus article-index.json
      console.log('DB nicht verfügbar, verwende article-index.json Fallback')
      const fileArticles = getArticlesFromFile()
      
      // Filtere nach Status
      let filtered = fileArticles
      if (status !== 'all') {
        const statusMap: Record<string, string> = {
          'published': 'online',
          'draft': 'draft',
          'archived': 'archived'
        }
        filtered = fileArticles.filter((a: any) => 
          status === 'all' || a.status === statusMap[status] || a.status === status
        )
      }
      
      if (trade) filtered = filtered.filter((a: any) => a.tradeSlug === trade)
      if (city) filtered = filtered.filter((a: any) => a.citySlug === city)
      
      // Konvertiere zum DB-Format
      articles = filtered.map((a: any) => ({
        id: a.id || a.slug,
        title: a.title,
        slug: a.slug,
        file_path: a.filePath || a.path,
        url_path: a.urlPath || `/blog/${a.tradeSlug}/${a.citySlug}/${a.slug}/`,
        trade_slug: a.tradeSlug,
        city_slug: a.citySlug,
        word_count: a.wordCount || a.word_count || 0,
        status: a.status === 'online' ? 'published' : (a.status || 'published'),
        ai_generated: a.aiGenerated !== false,
        published_at: a.publishedAt || a.created_at,
        created_at: a.createdAt || new Date().toISOString(),
        month_slug: a.monthSlug
      }))
      
      total = articles.length
      articles = articles.slice(offset, offset + limit)
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
      }
    })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
