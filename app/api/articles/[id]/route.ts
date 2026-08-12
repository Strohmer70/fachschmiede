import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/articles/[id] - Einzelnen Artikel abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select(`
        *,
        landing_page:landing_pages(id, slug, title, trade:trades(name, slug), city:cities(name, slug))
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching article:', error)
      return NextResponse.json({ error: 'Article not found', message: error.message }, { status: 404 })
    }
    
    return NextResponse.json({ article: data })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 })
  }
}

// PATCH /api/articles/[id] - Artikel aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const updateData: any = { ...body, updated_at: new Date().toISOString() }
    
    // If status changed to published, set published_at
    if (body.status === 'published' && !body.published_at) {
      updateData.published_at = new Date().toISOString()
    }
    
    // Recalculate word count if content changed
    if (body.content) {
      updateData.word_count = body.content.split(/\s+/).length
    }
    
    const { data, error } = await supabaseAdmin
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating article:', error)
      return NextResponse.json({ error: 'Failed to update article', message: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ article: data, message: 'Article updated successfully' })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 })
  }
}

// DELETE /api/articles/[id] - Artikel löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const { error } = await supabaseAdmin
      .from('articles')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting article:', error)
      return NextResponse.json({ error: 'Failed to delete article', message: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Article deleted successfully' })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 })
  }
}
