import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/admin-auth'

export const maxDuration = 60

// ─── POST /api/admin/marketing/generate ─────────────────────────
// Generiert personalisierte Outreach-Mails (Variante A — EINE Mail, kein Follow-up!)
// für ausgewählte Kontakte und speichert Betreff/Text als Entwurf (status='draft').
// Body: { ids: string[] } — max 50

const TRADE_LABELS: Record<string, string> = {
  dachdecker: 'Dachdecker',
  elektriker: 'Elektriker',
  klempner: 'Klempner',
  maler: 'Maler',
  zimmerer: 'Zimmerer',
  'garten-und-landschaftsbau': 'Garten- und Landschaftsbau',
}

// Stadt aus der System-Config (SSOT) — kanonischer Name + Slug ("Spandau" → Berlin-Spandau/berlin-spandau!)
let citiesCache: { name: string; slug: string }[] | null = null
async function resolveCity(name: string): Promise<{ name: string; slug: string }> {
  if (!citiesCache) {
    try {
      const mod = await import('@/config/system-config.js')
      citiesCache = mod.getAllCities() as { name: string; slug: string }[]
    } catch {
      citiesCache = []
    }
  }
  const hit = citiesCache.find((c) => c.name.toLowerCase() === name.toLowerCase())
  if (hit) return hit
  return {
    name: name.replace(/\b\w/g, (ch) => ch.toUpperCase()),
    slug: name
      .toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[()]/g, ' ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''),
  }
}


function buildMail(company: string, trade: string, cityName: string, citySlug: string) {
  const tradeLabel = TRADE_LABELS[trade] || trade
  const url = `https://www.fachschmiede.de/${trade}/${citySlug}/`
  const subject = `${cityName}: Ihre ${tradeLabel}-Website ist noch frei`
  const body = `Guten Tag,

wenn jemand in ${cityName} nach „${tradeLabel}" googelt, landet man auf
Verzeichnissen und Portalen — nicht bei einem lokalen Betrieb.

Wir haben dafür etwas gebaut: eine fertige Website für ${tradeLabel}
in ${cityName}. Keine Agentur, kein Projekt — sofort startklar.

Hier die Demo (1 Minute):
${url}

Mieten statt kaufen: 99 €/Monat, monatlich kündbar.
Im Preis: komplette Pflege, Updates, Ihre Firma drauf.

Wichtig: Wir vermieten jede Seite nur an EINEN Betrieb pro Stadt.

Mieten Sie einfach online: Demo öffnen, mit Ihren Daten starten und
14 Tage kostenlos testen — ganz ohne Anruf, ohne Verkaufstermin.
Oder antworten Sie einfach auf diese Mail.

Mit freundlichen Grüßen
Finn — fachschmiede.de
(Agentur für Handwerker-Websites)

---
Impressum: https://www.fachschmiede.de/impressum/
Sie erhalten diese Mail, weil ${company} in ${cityName} öffentlich
im Impressum gelistet ist. Kein Verteiler. Wenn Sie keine
Nachrichten mehr wünschen: kurze Antwort „Stopp" genügt.`
  return { subject, body }
}

export async function POST(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const ids: string[] = Array.isArray(body.ids) ? body.ids.slice(0, 50) : []
    if (!ids.length) {
      return NextResponse.json({ error: 'ids (Array) fehlt' }, { status: 400 })
    }

    const { data: contacts, error } = await supabaseAdmin
      .from('marketing_contacts')
      .select('id, company_name, trade, city, email, status, sent_at')
      .in('id', ids)

    if (error) throw error
    if (!contacts?.length) {
      return NextResponse.json({ error: 'Keine Kontakte gefunden' }, { status: 404 })
    }

    const drafts = []
    for (const c of contacts) {
      // UWG-Sicherheit: Stopp/Antwort/Bounce/Gesendet → NIEMALS neu anschreiben
      if (c.sent_at || ['stopp', 'replied', 'bounced', 'sent'].includes(c.status)) continue
      // Ohne E-Mail kein Mail-Entwurf (Print-Kontakte dürfen nicht in den Mail-Flow!)
      if (!c.email || !String(c.email).includes('@')) continue
      const cityInfo = await resolveCity(c.city)
      const mail = buildMail(c.company_name, c.trade, cityInfo.name, cityInfo.slug)
      const { error: upErr } = await supabaseAdmin
        .from('marketing_contacts')
        .update({ mail_subject: mail.subject, mail_body: mail.body, status: 'draft' })
        .eq('id', c.id)
      if (upErr) throw upErr
      drafts.push({ id: c.id, to: c.email, name: c.company_name, trade: c.trade, city: c.city, ...mail })
    }

    return NextResponse.json({ success: true, drafts, skipped: contacts.length - drafts.length })
  } catch (error: any) {
    console.error('Marketing generate error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
