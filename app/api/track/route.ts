// app/api/track/route.ts — DSGVO-schlanke Besucherzählung
// KEINE Cookies, KEINE IPs in der DB — nur Tages-Hash (ip+ua+datum+salt).
// GET /api/track/?p=/dachdecker/iserlohn/&_=<cachebuster> → 204 no-store
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const BOT_UA = /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|twitterbot|linkedinbot|discordbot|preview|lighthouse|pagespeed|gtmetrix|curl|wget|python-requests|go-http-client|headless|uptime|pingdom|statuscake|checkly|synthetics/i

function trackingSalt(): string {
  return process.env.TRACKING_SALT || process.env.SESSION_SECRET || process.env.STRIPE_SECRET_KEY || 'dev-salt-nur-lokal'
}

function dayString(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString().slice(0, 10)
}

function noStore204(debug = ''): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store, max-age=0', 'X-Track-Debug': debug.slice(0, 180) },
  })
}

// PFAD → landing_pages.slug (best-effort, gleiche Auflösung wie /api/leads)
async function resolveSlug(trade: string, city: string): Promise<string | null> {
  try {
    const [{ data: cityRow }, { data: tradeRow }] = await Promise.all([
      supabaseAdmin.from('cities').select('id').eq('slug', city).maybeSingle(),
      supabaseAdmin.from('trades').select('id').eq('slug', trade).maybeSingle(),
    ])
    if (cityRow && tradeRow) {
      const { data } = await supabaseAdmin
        .from('landing_pages')
        .select('slug')
        .eq('trade_id', tradeRow.id)
        .eq('city_id', cityRow.id)
        .maybeSingle()
      if (data?.slug) return data.slug
    }
    const candidates = [`${trade}-${city}`]
    // gartenbau-URL → DB-Slug garten-und-landschaftsbau-{city}
    if (trade === 'gartenbau') candidates.unshift(`garten-und-landschaftsbau-${city}`)
    for (const slug of candidates) {
      const { data } = await supabaseAdmin
        .from('landing_pages')
        .select('slug')
        .eq('slug', slug)
        .maybeSingle()
      if (data?.slug) return data.slug
    }
  } catch (e) {
    console.error('[track] slug-resolution failed:', e)
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    const p = (req.nextUrl.searchParams.get('p') || '/').slice(0, 200)
    const ua = (req.headers.get('user-agent') || '').slice(0, 200)

    // Bots & Preview-Crawler nicht zählen
    if (!ua || BOT_UA.test(ua)) return noStore204('bot-or-no-ua')

    // /dachdecker/castrop-rauxel/ → trade=dachdecker, city=castrop-rauxel
    const seg = p.split('/').filter(Boolean)
    if (seg.length < 2) return noStore204('bad-path')
    const trade = seg[0].toLowerCase()
    const city = seg.slice(1).join('-').toLowerCase()

    const slug = await resolveSlug(trade, city)
    if (!slug) return noStore204(`no-slug:${trade}/${city}`)

    // IP NUR als Tages-Hash — wird nirgendwo roh gespeichert
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.ip || '0.0.0.0'
    const d = dayString()
    const vh = createHash('sha256')
      .update(`${ip}|${ua}|${d}|${trackingSalt()}`)
      .digest('hex')
      .slice(0, 32)

    const { error } = await supabaseAdmin.from('page_views').insert({ slug, d, vh })
    if (error) {
      console.error('[track] insert failed:', error.message)
      return noStore204('insert:' + error.message)
    }

    // Selbstreinigung: ~0,3 % der Hits löschen Einträge älter 90 Tage
    if (Math.random() < 0.003) {
      const cutoff = dayString(-90 * 24 * 60 * 60 * 1000)
      supabaseAdmin.from('page_views').delete().lt('d', cutoff).then(({ error }) => {
        if (error) console.error('[track] cleanup failed:', error.message)
      })
    }

    return noStore204('ok:' + slug)
  } catch (e) {
    console.error('[track] error:', e)
    return noStore204('catch:' + (e as Error)?.message)
  }
}
