import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════
// API: Gewerk-Anfragen verwalten
// ═══════════════════════════════════════════

// API-Routen dürfen NIEMALS statisch generiert werden
export const dynamic = 'force-dynamic'

// GET: Alle Anfragen abrufen
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    
    let query = supabaseAdmin
      .from('trade_requests')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Trade requests GET error:', error)
      throw new Error(`Datenbank-Fehler: ${error.message}`)
    }
    
    return NextResponse.json({
      success: true,
      requests: data || []
    })
    
  } catch (err: any) {
    console.error('Trade requests GET error:', err)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}

// POST: Neue Anfrage erstellen
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Trade request POST body:', JSON.stringify(body, null, 2))
    
    // Validierung
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Gewerk-Name ist erforderlich' },
        { status: 400 }
      )
    }
    
    // Slug generieren aus Name
    const slug = body.slug || generateSlug(body.name)
    
    // Prüfen ob Slug schon existiert
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('trade_requests')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    
    if (existingError) {
      console.error('Error checking existing trade:', existingError)
    }
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Dieses Gewerk existiert bereits' },
        { status: 409 }
      )
    }
    
    // Minimale Daten — nur die Spalten die definitiv existieren
    const insertData: any = {
      name: body.name,
      slug: slug,
      status: 'pending'
    }
    
    // Optionale Felder nur hinzufügen wenn sie existieren
    if (body.emoji) insertData.emoji = body.emoji
    if (body.region) insertData.region = body.region
    if (body.priority) insertData.priority = body.priority
    if (body.city_count) insertData.city_count = body.city_count
    if (body.notes) insertData.notes = body.notes
    if (body.brand_color) insertData.brand_color = body.brand_color
    if (body.created_by) insertData.created_by = body.created_by
    
    // Arrays nur wenn sie nicht leer sind
    if (body.services && body.services.length > 0) insertData.services = body.services
    if (body.faqs && body.faqs.length > 0) insertData.faqs = body.faqs
    
    console.log('Insert data:', JSON.stringify(insertData, null, 2))
    
    // Anfrage speichern
    const { data, error } = await supabaseAdmin
      .from('trade_requests')
      .insert(insertData)
      .select()
      .single()
    
    if (error) {
      console.error('Supabase insert error:', error)
      throw new Error(`Datenbank-Fehler: ${error.message} (Code: ${error.code})`)
    }
    
    return NextResponse.json({
      success: true,
      request: data,
      message: `Gewerk "${body.name}" angefordert. Status: Ausstehend.`
    })
    
  } catch (err: any) {
    console.error('Trade request POST error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Unbekannter Server-Fehler' },
      { status: 500 }
    )
  }
}

// PATCH: Anfrage aktualisieren (z.B. Status auf "generating")
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, ...updates } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID ist erforderlich' },
        { status: 400 }
      )
    }
    
    const updateData: any = { ...updates }
    if (status) updateData.status = status
    if (status === 'ready') updateData.completed_at = new Date().toISOString()
    
    // Salespage-Build Tracking
    if (updates.salespage_build_requested !== undefined) {
      updateData.salespage_build_requested = updates.salespage_build_requested
    }
    if (updates.salespage_requested_at) {
      updateData.salespage_requested_at = updates.salespage_requested_at
    }
    if (updates.salespage_built_at) {
      updateData.salespage_built_at = updates.salespage_built_at
    }
    
    const { data, error } = await supabaseAdmin
      .from('trade_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      request: data
    })
    
  } catch (err: any) {
    console.error('Trade request PATCH error:', err)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}

// DELETE: Anfrage löschen
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID ist erforderlich' },
        { status: 400 }
      )
    }
    
    const { error } = await supabaseAdmin
      .from('trade_requests')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      message: 'Anfrage gelöscht'
    })
    
  } catch (err: any) {
    console.error('Trade request DELETE error:', err)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}

// Hilfsfunktion: Slug generieren
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'und')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
