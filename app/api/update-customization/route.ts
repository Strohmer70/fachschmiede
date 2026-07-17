import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant')
    
    const formData = await request.formData()
    const pageId = formData.get('page_id') as string
    const welcomeText = formData.get('welcome_text') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const address = formData.get('address') as string

    if (!tenantId || !pageId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Verify tenant owns this page
    const { data: page } = await supabase
      .from('landing_pages')
      .select('rented_by')
      .eq('id', pageId)
      .single()

    if (page?.rented_by !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Upsert customization
    const { error } = await supabase
      .from('page_customizations')
      .upsert({
        landing_page_id: pageId,
        tenant_id: tenantId,
        custom_welcome_text: welcomeText,
        custom_phone: phone,
        custom_email: email,
        custom_address: address,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'landing_page_id,tenant_id'
      })

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    return NextResponse.redirect(new URL(`/dashboard?tenant=${tenantId}&updated=1`, request.url))

  } catch (error) {
    console.error('Customization API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
