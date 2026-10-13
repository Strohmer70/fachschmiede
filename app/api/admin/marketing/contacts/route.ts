import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/admin-auth'

export async function GET(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const city = searchParams.get('city')
    const trade = searchParams.get('trade')
    const search = searchParams.get('search')

    let query = supabaseAdmin
      .from('marketing_contacts')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (city) query = query.eq('city', city)
    if (trade) query = query.eq('trade', trade)
    if (search) {
      query = query.or(`company_name.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, contacts: data || [] })
  } catch (error: any) {
    console.error('Marketing contacts GET error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { company_name, email, phone, address, city, trade, source, notes } = body

    if (!company_name || !city || !trade) {
      return NextResponse.json({ error: 'company_name, city und trade sind Pflichtfelder' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('marketing_contacts')
      .insert({ company_name, email, phone, address, city, trade, source: source || 'manual', notes })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, contact: data })
  } catch (error: any) {
    console.error('Marketing contacts POST error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// PATCH /api/admin/marketing/contacts/ — Kontakt-Status setzen (z.B. UWG-Stopp nach Antwort)
const ALLOWED_STATUS = ['neu', 'draft', 'sent', 'replied', 'stopp', 'print_sent']
export async function PATCH(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const id = String(body.id || '')
    const status = String(body.status || '')
    if (!id || !ALLOWED_STATUS.includes(status)) {
      return NextResponse.json({ error: 'id oder ungültiger status (erlaubt: ' + ALLOWED_STATUS.join(', ') + ')' }, { status: 400 })
    }
    const { error } = await supabaseAdmin
      .from('marketing_contacts')
      .update({ status })
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
