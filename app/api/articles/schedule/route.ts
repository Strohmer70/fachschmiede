import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface ScheduleConfig {
  free_plan: number      // Articles per month for free pages (default: 1)
  basic_plan: number     // Articles per month for basic rented pages (default: 2)
  pro_plan: number       // Articles per month for pro rented pages (default: 4)
  max_articles_per_run: number  // Maximum articles to generate in one run
}

const DEFAULT_CONFIG: ScheduleConfig = {
  free_plan: 1,
  basic_plan: 2,
  pro_plan: 4,
  max_articles_per_run: 50
}

// Determine article count based on page plan
function getArticleCountForPage(page: any, config: ScheduleConfig): number {
  if (page.status === 'available') {
    return config.free_plan
  }
  
  // Check tenant plan
  if (page.rented_by) {
    return config.basic_plan
  }
  
  return config.free_plan
}

// Check if page needs new articles this month
async function needsArticlesThisMonth(pageId: string, requiredCount: number): Promise<boolean> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const { count, error } = await supabaseAdmin
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('landing_page_id', pageId)
    .gte('created_at', startOfMonth.toISOString())
  
  if (error) {
    console.error('Error checking article count:', error)
    return true // Assume needs articles if check fails
  }
  
  return (count || 0) < requiredCount
}

// POST /api/articles/schedule - Run scheduled article generation with KI
export async function POST(request: NextRequest) {
  try {
    let body: any = {}
    try {
      body = await request.json()
    } catch {
      // No body provided, use defaults
    }
    
    const config: ScheduleConfig = { ...DEFAULT_CONFIG, ...(body.config || {}) }
    
    // Get all landing pages
    const { data: pages, error: pagesError } = await supabaseAdmin
      .from('landing_pages')
      .select(`
        *,
        trade:trades(name, slug),
        city:cities(name, slug)
      `)
    
    if (pagesError) {
      return NextResponse.json({ error: 'Failed to fetch pages', message: pagesError.message }, { status: 500 })
    }
    
    const results = []
    let generatedCount = 0
    let totalCost = 0
    
    for (const page of (pages || [])) {
      if (generatedCount >= config.max_articles_per_run) {
        break
      }
      
      const requiredCount = getArticleCountForPage(page, config)
      const needsArticles = await needsArticlesThisMonth(page.id, requiredCount)
      
      if (!needsArticles) {
        results.push({
          page_id: page.id,
          page_slug: page.slug,
          status: 'skipped',
          reason: 'Monthly quota already met'
        })
        continue
      }
      
      try {
        // Call KI generate API
        const generateResponse = await fetch(`${request.nextUrl.origin}/api/articles/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            landing_page_id: page.id
          })
        })
        
        if (generateResponse.ok) {
          const data = await generateResponse.json()
          generatedCount++
          totalCost += parseFloat(data.cost_estimate?.replace('$', '') || '0')
          results.push({
            page_id: page.id,
            page_slug: page.slug,
            status: 'generated',
            article_id: data.article?.id,
            word_count: data.article?.word_count,
            cost: data.cost_estimate
          })
        } else {
          const error = await generateResponse.json()
          results.push({
            page_id: page.id,
            page_slug: page.slug,
            status: 'failed',
            error: error.message || 'Generation failed'
          })
        }
        
        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error: any) {
        results.push({
          page_id: page.id,
          page_slug: page.slug,
          status: 'failed',
          error: error.message
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      generated: generatedCount,
      total_cost_estimate: `~$${totalCost.toFixed(4)}`,
      total_pages: pages?.length || 0,
      results,
      config
    })
    
  } catch (error: any) {
    console.error('Scheduling error:', error)
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 })
  }
}

// GET /api/articles/schedule - Get scheduling status
export async function GET(request: NextRequest) {
  try {
    // Get article counts per page for current month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const { data: articles, error } = await supabaseAdmin
      .from('articles')
      .select('landing_page_id, created_at')
      .gte('created_at', startOfMonth.toISOString())
    
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch stats', message: error.message }, { status: 500 })
    }
    
    // Count per page
    const counts: Record<string, number> = {}
    for (const article of (articles || [])) {
      counts[article.landing_page_id] = (counts[article.landing_page_id] || 0) + 1
    }
    
    return NextResponse.json({
      month: startOfMonth.toISOString().slice(0, 7),
      total_articles_this_month: articles?.length || 0,
      articles_per_page: counts
    })
    
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 })
  }
}
