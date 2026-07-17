import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: Request,
  { params }: { params: { pageId: string } }
) {
  try {
    const pageId = params.pageId
    const formData = await request.formData()
    
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const message = formData.get('message') as string

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
    }

    // Get landing page and tenant
    const { data: page } = await supabase
      .from('landing_pages')
      .select('rented_by')
      .eq('id', pageId)
      .single()

    const { error } = await supabase
      .from('leads')
      .insert({
        landing_page_id: pageId,
        tenant_id: page?.rented_by,
        name,
        email,
        phone,
        message,
      })

    if (error) {
      console.error('Lead creation error:', error)
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
    }

    // Redirect back to page with success message
    const referer = request.headers.get('referer') || '/'
    const url = new URL(referer)
    url.searchParams.set('success', '1')
    
    return NextResponse.redirect(url)

  } catch (error) {
    console.error('Lead API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
