import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/admin-auth'

export async function GET(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }
  try {
    // Aggregated stats
    const { count: totalContacts } = await supabaseAdmin
      .from('marketing_contacts')
      .select('*', { count: 'exact', head: true })

    const { count: sentContacts } = await supabaseAdmin
      .from('marketing_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'contacted')

    const { count: repliedContacts } = await supabaseAdmin
      .from('marketing_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'replied')

    const { count: convertedContacts } = await supabaseAdmin
      .from('marketing_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'converted')

    const { count: totalCampaigns } = await supabaseAdmin
      .from('marketing_campaigns')
      .select('*', { count: 'exact', head: true })

    const { count: sentCampaigns } = await supabaseAdmin
      .from('marketing_campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')

    const { data: campaigns } = await supabaseAdmin
      .from('marketing_campaigns')
      .select('contacts_sent, opens, replies, conversions')
      .eq('status', 'sent')

    const totalSent = campaigns?.reduce((sum, c) => sum + (c.contacts_sent || 0), 0) || 0
    const totalOpens = campaigns?.reduce((sum, c) => sum + (c.opens || 0), 0) || 0
    const totalReplies = campaigns?.reduce((sum, c) => sum + (c.replies || 0), 0) || 0
    const totalConversions = campaigns?.reduce((sum, c) => sum + (c.conversions || 0), 0) || 0

    const openRate = totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0
    const replyRate = totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0
    const conversionRate = totalSent > 0 ? Math.round((totalConversions / totalSent) * 100) : 0

    // 2026-10-13: Tageszähler für das Versand-Limit (Europe/Berlin via Server-UTC+Offset)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { count: sentToday } = await supabaseAdmin
      .from('marketing_contacts')
      .select('id', { count: 'exact', head: true })
      .gte('sent_at', todayStart.toISOString())

    return NextResponse.json({
      success: true,
      // Flatte Aliase (Admin-Dashboard liest top-level)
      totalContacts: totalContacts || 0,
      contacted: sentContacts || 0,
      replied: repliedContacts || 0,
      sentToday: sentToday || 0,
      stats: {
        totalContacts: totalContacts || 0,
        sentContacts: sentContacts || 0,
        repliedContacts: repliedContacts || 0,
        convertedContacts: convertedContacts || 0,
        totalCampaigns: totalCampaigns || 0,
        sentCampaigns: sentCampaigns || 0,
        totalSent,
        totalOpens,
        totalReplies,
        totalConversions,
        openRate,
        replyRate,
        conversionRate,
      }
    })
  } catch (error: any) {
    console.error('Marketing stats error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
