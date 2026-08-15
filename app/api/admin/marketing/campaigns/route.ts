import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('marketing_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, campaigns: data || [] })
  } catch (error: any) {
    console.error('Marketing campaigns GET error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, trade, city, channel, mail_subject, mail_body, contact_ids } = body

    if (!name || !channel) {
      return NextResponse.json({ error: 'name und channel sind Pflichtfelder' }, { status: 400 })
    }

    // Insert campaign
    const { data: campaign, error: campError } = await supabaseAdmin
      .from('marketing_campaigns')
      .insert({ name, trade, city, channel, mail_subject, mail_body, contacts_total: contact_ids?.length || 0 })
      .select()
      .single()

    if (campError) {
      return NextResponse.json({ error: campError.message }, { status: 500 })
    }

    // Link contacts to campaign
    if (contact_ids && contact_ids.length > 0 && campaign) {
      const junctionData = contact_ids.map((cid: string) => ({
        campaign_id: campaign.id,
        contact_id: cid,
      }))
      await supabaseAdmin.from('marketing_campaign_contacts').insert(junctionData)

      // Mark contacts as contacted
      await supabaseAdmin
        .from('marketing_contacts')
        .update({ status: 'contacted', updated_at: new Date().toISOString() })
        .in('id', contact_ids)
    }

    return NextResponse.json({ success: true, campaign })
  } catch (error: any) {
    console.error('Marketing campaigns POST error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
