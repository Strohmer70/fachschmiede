import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

// Hilfsfunktion: Rekursiv alle HTML-Dateien im Blog-Verzeichnis finden
function scanBlogDirectory(dir: string, basePath: string = ''): any[] {
  const articles: any[] = []
  
  if (!existsSync(dir)) return articles
  
  const items = readdirSync(dir, { withFileTypes: true })
  
  for (const item of items) {
    const fullPath = join(dir, item.name)
    const relativePath = join(basePath, item.name)
    
    if (item.isDirectory()) {
      articles.push(...scanBlogDirectory(fullPath, relativePath))
    } else if (item.name.endsWith('.html')) {
      // Parse Pfad: dachdecker/bochum/slug.html
      const parts = relativePath.split('/')
      if (parts.length >= 3) {
        const tradeSlug = parts[0]
        const citySlug = parts[1]
        const fileName = parts[parts.length - 1]
        const slug = fileName.replace('.html', '')
        
        // Lies Metadaten aus der HTML-Datei
        let title = slug.replace(/-/g, ' ')
        let excerpt = ''
        let wordCount = 0
        
        try {
          const content = readFileSync(fullPath, 'utf-8')
          const titleMatch = content.match(/<title>(.*?)<\/title>/)
          const descMatch = content.match(/<meta name="description" content="(.*?)">/)
          
          if (titleMatch) title = titleMatch[1]
          if (descMatch) excerpt = descMatch[1]
          
          // Wörter zählen (Text zwischen Tags)
          const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
          wordCount = textContent.split(' ').length
        } catch (e) {
          // Ignoriere Lesefehler
        }
        
        articles.push({
          title,
          slug,
          file_path: `/blog/${tradeSlug}/${citySlug}/${fileName}`,
          url_path: `/${tradeSlug}/${citySlug}/blog/${slug}/`,
          trade_slug: tradeSlug,
          city_slug: citySlug,
          excerpt,
          word_count: wordCount,
          status: 'published',
          ai_generated: true,
          published_at: new Date().toISOString()
        })
      }
    }
  }
  
  return articles
}

// Lies auch article-index.json für bessere Metadaten
function getArticlesFromIndex(): any[] {
  const indexPath = join(process.cwd(), 'lib', 'article-index.json')
  if (!existsSync(indexPath)) return []
  
  try {
    const data = JSON.parse(readFileSync(indexPath, 'utf-8'))
    return (data.articles || []).map((a: any) => ({
      title: a.title,
      slug: a.slug,
      file_path: a.filePath || a.path,
      url_path: a.urlPath || `/blog/${a.tradeSlug}/${a.citySlug}/${a.slug}.html`,
      trade_slug: a.tradeSlug,
      city_slug: a.citySlug,
      excerpt: a.excerpt || '',
      word_count: a.wordCount || 0,
      status: a.status === 'online' ? 'published' : (a.status || 'published'),
      ai_generated: a.aiGenerated !== false,
      published_at: a.publishedAt || new Date().toISOString(),
      month_slug: a.monthSlug
    }))
  } catch (e) {
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dryRun = true } = body

    // Sammle Artikel aus beiden Quellen
    const fromFiles = scanBlogDirectory(join(process.cwd(), 'public', 'blog'))
    const fromIndex = getArticlesFromIndex()
    
    // Merge: Index hat Priorität für Metadaten, Files für Vollständigkeit
    const articleMap = new Map()
    
    for (const a of fromFiles) {
      const key = `${a.trade_slug}/${a.city_slug}/${a.slug}`
      articleMap.set(key, a)
    }
    
    for (const a of fromIndex) {
      const key = `${a.trade_slug}/${a.city_slug}/${a.slug}`
      if (articleMap.has(key)) {
        // Merge: Index-Metadaten haben Priorität
        const existing = articleMap.get(key)
        articleMap.set(key, { ...existing, ...a, title: a.title || existing.title })
      } else {
        articleMap.set(key, a)
      }
    }
    
    const articles = Array.from(articleMap.values())
    
    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        message: `${articles.length} Artikel gefunden (Simulation)`,
        sample: articles.slice(0, 5),
        total: articles.length
      })
    }

    // Tabelle erstellen falls nicht existiert
    try {
      await supabaseAdmin.rpc('exec_sql', {
        query: `
          CREATE TABLE IF NOT EXISTS articles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            slug TEXT NOT NULL,
            file_path TEXT NOT NULL,
            url_path TEXT NOT NULL,
            trade_slug TEXT NOT NULL,
            city_slug TEXT NOT NULL,
            landing_page_id UUID,
            excerpt TEXT,
            meta_description TEXT,
            word_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
            ai_generated BOOLEAN DEFAULT true,
            published_at TIMESTAMPTZ DEFAULT now(),
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            month_slug TEXT,
            UNIQUE(trade_slug, city_slug, slug, month_slug)
          );
          CREATE INDEX IF NOT EXISTS idx_articles_trade ON articles(trade_slug);
          CREATE INDEX IF NOT EXISTS idx_articles_city ON articles(city_slug);
          CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
          ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
        `
      })
    } catch (e) {
      console.log('Tabelle existiert möglicherweise bereits:', e)
    }

    // Artikel einfügen (upsert)
    const { data, error } = await supabaseAdmin
      .from('articles')
      .upsert(articles, { 
        onConflict: 'trade_slug,city_slug,slug,month_slug',
        ignoreDuplicates: false 
      })
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `${articles.length} Artikel migriert`,
      migrated: articles.length,
      sample: data?.slice(0, 5)
    })
  } catch (error: any) {
    console.error('Migration Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
