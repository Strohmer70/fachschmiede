import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant')
    
    const body = await request.json()
    const { page_id, ...customizationData } = body

    if (!tenantId || !page_id) {
      return NextResponse.json({ error: 'Missing tenant or page_id' }, { status: 400 })
    }

    // Verify tenant owns this page
    const { data: page, error: pageError } = await supabaseAdmin
      .from('landing_pages')
      .select('rented_by')
      .eq('id', page_id)
      .single()

    if (pageError || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    if (page.rented_by !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Build update object from all possible fields
    const updateData: any = {
      landing_page_id: page_id,
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
    }

    // String fields
    const stringFields = [
      'custom_company_name', 'custom_address', 'custom_phone', 'custom_email',
      'custom_welcome_text', 'custom_logo_url', 'opening_hours', 'about_text',
      'whatsapp_number', 'google_maps_place_id', 'project_count', 'team_size',
      'guild_name', 'accent_color', 'hero_image_url', 'team_photo_url',
      'rechtsform', 'vertretung', 'ust_id', 'hwk_name', 'hwk_number',
      'berufsbezeichnung', 'verantwortlicher', 'datenschutz_beauftragter',
      'website_title', 'meta_description_custom'
    ]
    for (const field of stringFields) {
      if (customizationData[field] !== undefined) {
        updateData[field] = customizationData[field]
      }
    }

    // Boolean fields
    const boolFields = [
      'whatsapp_enabled', 'google_maps_enabled', 'show_founding_year',
      'show_project_count', 'show_team_size', 'is_master_company',
      'is_guild_member', 'eu_streitschlichtung'
    ]
    for (const field of boolFields) {
      if (customizationData[field] !== undefined) {
        updateData[field] = Boolean(customizationData[field])
      }
    }

    // Integer fields
    if (customizationData.founding_year !== undefined) {
      updateData.founding_year = parseInt(customizationData.founding_year) || null
    }

    // Array fields
    if (customizationData.service_areas !== undefined) {
      updateData.service_areas = Array.isArray(customizationData.service_areas) 
        ? customizationData.service_areas 
        : customizationData.service_areas.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
    if (customizationData.reference_photos !== undefined) {
      updateData.reference_photos = Array.isArray(customizationData.reference_photos)
        ? customizationData.reference_photos
        : []
    }

    // JSON fields
    if (customizationData.services_enabled !== undefined) {
      updateData.services_enabled = typeof customizationData.services_enabled === 'object'
        ? customizationData.services_enabled
        : {}
    }
    if (customizationData.modules_enabled !== undefined) {
      updateData.modules_enabled = typeof customizationData.modules_enabled === 'object'
        ? customizationData.modules_enabled
        : {}
    }
    if (customizationData.services_active !== undefined) {
      updateData.services_active = typeof customizationData.services_active === 'object'
        ? customizationData.services_active
        : {}
    }
    if (customizationData.custom_services !== undefined) {
      updateData.custom_services = Array.isArray(customizationData.custom_services)
        ? customizationData.custom_services
        : []
    }
    if (customizationData.custom_gallery_urls !== undefined) {
      updateData.custom_gallery_urls = Array.isArray(customizationData.custom_gallery_urls)
        ? customizationData.custom_gallery_urls
        : []
    }

    // Upsert customization
    const { data, error } = await supabaseAdmin
      .from('page_customizations')
      .upsert(updateData, {
        onConflict: 'landing_page_id,tenant_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: 'Update failed', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      customization: data,
      message: 'Änderungen gespeichert'
    })

  } catch (error: any) {
    console.error('Customization API error:', error)
    return NextResponse.json({ error: 'Internal error', message: error.message }, { status: 500 })
  }
}
