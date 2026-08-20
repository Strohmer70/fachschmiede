import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Vercel Cron: Runs monthly on 1st at 9:00 AM
// Schedule: 0 9 1 * *

function getArticleCount(page: any): number {
  if (page.status === 'available') return 1
  if (page.rented_by) return 2 // basic plan
  return 1
}

async function needsArticles(pageId: string, required: number): Promise<boolean> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const { count } = await supabaseAdmin
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('landing_page_id', pageId)
    .gte('created_at', startOfMonth.toISOString())
  
  return (count || 0) < required
}

async function syncLandingPages(): Promise<number> {
  // Auto-create landing pages for new trade+city combinations
  const { data: trades } = await supabaseAdmin.from('trades').select('id,slug,name')
  const { data: cities } = await supabaseAdmin.from('cities').select('id,slug,name')
  
  let created = 0
  
  for (const trade of trades || []) {
    for (const city of cities || []) {
      const slug = trade.slug + '-' + city.slug
      
      const { data: existing } = await supabaseAdmin
        .from('landing_pages')
        .select('id')
        .eq('slug', slug)
        .single()
      
      if (!existing) {
        const tradeName = trade.slug === 'klempner' || trade.slug === 'shk' ? 'Klempner' : trade.name
        const { error } = await supabaseAdmin
          .from('landing_pages')
          .insert({
            slug: slug,
            trade_id: trade.id,
            city_id: city.id,
            status: 'available',
            title: tradeName + ' ' + city.name + ' | Professionelle Handwerker',
            h1: 'Ihr ' + tradeName + ' in ' + city.name + ' – Zuverlässig, Fair, Vor Ort',
            meta_description: 'Professionelle ' + tradeName + ' in ' + city.name + '. Jetzt lokale Fachbetriebe finden.',
            monthly_price: 14900
          })
        
        if (!error) {
          console.log('Auto-created landing page:', slug)
          created++
        }
      }
    }
  }
  
  return created
}

export async function GET(request: NextRequest) {
  try {
    const isCron = request.headers.get('vercel-cron') === '1'
    const isAuthorized = request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
    
    if (!isCron && !isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('🔄 Monthly article generation started:', new Date().toISOString())
    
    // Step 1: Auto-sync landing pages (creates pages for new trades/cities)
    console.log('📋 Auto-syncing landing pages...')
    const newPages = await syncLandingPages()
    if (newPages > 0) {
      console.log(`  Created ${newPages} new landing pages`)
    }
    
    // Step 2: Get all landing pages (including newly created)
    const { data: pages, error: pagesError } = await supabaseAdmin
      .from('landing_pages')
      .select(`
        *,
        trade:trades(name, slug),
        city:cities(name, slug)
      `)
    
    if (pagesError) {
      throw new Error('Failed to fetch pages: ' + pagesError.message)
    }
    
    const results = []
    let generated = 0
    const maxArticles = 50
    
    for (const page of pages || []) {
      if (generated >= maxArticles) break
      
      const required = getArticleCount(page)
      const needs = await needsArticles(page.id, required)
      
      if (!needs) {
        results.push({ page: page.slug, status: 'skipped', reason: 'quota met' })
        continue
      }
      
      try {
        const genResponse = await fetch(`${request.nextUrl.origin}/api/articles/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ landing_page_id: page.id })
        })
        
        if (genResponse.ok) {
          const data = await genResponse.json()
          generated++
          results.push({
            page: page.slug,
            status: 'generated',
            article_id: data.article?.id,
            title: data.article?.title
          })
        } else {
          const error = await genResponse.json()
          results.push({ page: page.slug, status: 'failed', error: error.message })
        }
        
        await new Promise(r => setTimeout(r, 500))
        
      } catch (err: any) {
        results.push({ page: page.slug, status: 'error', error: err.message })
      }
    }
    
    console.log(`✅ Monthly generation complete: ${generated} articles`)
    
    return NextResponse.json({
      success: true,
      generated,
      new_pages_created: newPages,
      total_pages: pages?.length || 0,
      timestamp: new Date().toISOString(),
      results: results.slice(0, 20)
    })
    
  } catch (error: any) {
    console.error('Cron error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
