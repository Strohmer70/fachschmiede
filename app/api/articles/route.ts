import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/articles - Liste aller Artikel (mit Filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const landingPageId = searchParams.get('landing_page_id')
    const status = searchParams.get('status') || 'published'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')
    
    let query = supabaseAdmin
      .from('articles')
      .select(`
        *,
        landing_page:landing_pages(id, slug, title, trade:trades(name, slug), city:cities(name, slug))
      `)
      .order('published_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1)
    
    if (landingPageId) {
      query = query.eq('landing_page_id', landingPageId)
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Error fetching articles:', error)
      return NextResponse.json({ error: 'Failed to fetch articles', message: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      articles: data || [], 
      count: count || 0,
      limit,
      offset
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 })
  }
}

// POST /api/articles - Neuen Artikel erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { 
      landing_page_id, 
      title, 
      content, 
      excerpt, 
      meta_description, 
      meta_title,
      status = 'draft',
      featured_image,
      category,
      tags,
      ai_generated = false
    } = body
    
    if (!landing_page_id || !title || !content) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        message: 'landing_page_id, title, and content are required' 
      }, { status: 400 })
    }
    
    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 60)
    
    const wordCount = content.split(/\s+/).length
    
    const { data, error } = await supabaseAdmin
      .from('articles')
      .insert({
        landing_page_id,
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        meta_description: meta_description || excerpt || content.substring(0, 160),
        meta_title: meta_title || title,
        status,
        published_at: status === 'published' ? new Date().toISOString() : null,
        featured_image,
        category,
        tags: tags || [],
        ai_generated,
        word_count: wordCount
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating article:', error)
      return NextResponse.json({ error: 'Failed to create article', message: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ article: data, message: 'Article created successfully' })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 })
  }
}
