// app/api/admin/seo/outreach/route.ts — SEO-Hub: Outreach-Assistent (Prospects + KI-Pitches)
// CRUD via Supabase-Tabelle outreach_prospects; POST {action:'pitch', id} → Kimi/Moonshot generiert E-Mail-Pitch
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/admin-auth'
import { assertKimiBudget, logKimiSpend } from '@/lib/kimi-budget'

export const dynamic = 'force-dynamic'
export const maxDuration = 120 // Kimi-Call braucht bis zu ~60s

const ALLOWED_TYPE = ['guestpost', 'press', 'podcast', 'blogger', 'directory', 'other']
const ALLOWED_STATUS = ['research', 'contacted', 'replied', 'approved', 'live', 'rejected']

function authed(req: NextRequest): boolean {
  return checkAdminAuth(req as unknown as Request)
}

export async function GET(req: NextRequest) {
  try {
    if (!authed(req)) return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 401 })
    const { data, error } = await supabaseAdmin
      .from('outreach_prospects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error
    return NextResponse.json({ prospects: data || [] })
  } catch (err: any) {
    console.error('[admin/seo/outreach] GET:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!authed(req)) return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 401 })
    const b = await req.json().catch(() => null)
    if (!b) return NextResponse.json({ error: 'Body fehlt' }, { status: 400 })

    // ── KI-Pitch generieren ──
    if (b.action === 'pitch') {
      if (!b.id) return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })
      const { data: p, error } = await supabaseAdmin.from('outreach_prospects').select('*').eq('id', b.id).single()
      if (error) throw error
      // 🔴 Budget-Guard: hart blockieren bei >$25/Monat (Dieter-Cap $30)
      await assertKimiBudget()
      const pitch = await generatePitch(p, b.hint || '')
      // Geschätzte Kosten buchen (~2k In + ~800 Out Tokens ≈ $0.01)
      await logKimiSpend(0.01, `Pitch für ${p.title}`)
      const { error: upErr } = await supabaseAdmin
        .from('outreach_prospects')
        .update({ pitch, updated_at: new Date().toISOString() })
        .eq('id', b.id)
      if (upErr) throw upErr
      return NextResponse.json({ ok: true, pitch })
    }

    // ── Neues Prospect anlegen ──
    if (!b.title || !String(b.title).trim()) {
      return NextResponse.json({ error: 'Titel erforderlich' }, { status: 400 })
    }
    if (b.type && !ALLOWED_TYPE.includes(b.type)) {
      return NextResponse.json({ error: `type: ${ALLOWED_TYPE.join('|')}` }, { status: 400 })
    }
    if (b.status && !ALLOWED_STATUS.includes(b.status)) {
      return NextResponse.json({ error: `status: ${ALLOWED_STATUS.join('|')}` }, { status: 400 })
    }
    const row = {
      title: String(b.title).trim(),
      url: (b.url || '').trim(),
      contact_name: (b.contact_name || '').trim(),
      contact_email: (b.contact_email || '').trim(),
      type: b.type || 'guestpost',
      status: b.status || 'research',
      notes: (b.notes || '').trim(),
    }
    const { data, error } = await supabaseAdmin.from('outreach_prospects').insert(row).select().single()
    if (error) throw error
    return NextResponse.json({ ok: true, prospect: data })
  } catch (err: any) {
    console.error('[admin/seo/outreach] POST:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!authed(req)) return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 401 })
    const b = await req.json().catch(() => null)
    if (!b || !b.id) return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })
    const patch: Record<string, any> = { updated_at: new Date().toISOString() }
    if (b.status !== undefined) {
      if (!ALLOWED_STATUS.includes(b.status)) return NextResponse.json({ error: `status: ${ALLOWED_STATUS.join('|')}` }, { status: 400 })
      patch.status = b.status
    }
    if (b.type !== undefined) {
      if (!ALLOWED_TYPE.includes(b.type)) return NextResponse.json({ error: `type: ${ALLOWED_TYPE.join('|')}` }, { status: 400 })
      patch.type = b.type
    }
    for (const k of ['title', 'url', 'contact_name', 'contact_email', 'notes']) {
      if (b[k] !== undefined) patch[k] = String(b[k]).trim()
    }
    const { data, error } = await supabaseAdmin.from('outreach_prospects').update(patch).eq('id', b.id).select().single()
    if (error) throw error
    return NextResponse.json({ ok: true, prospect: data })
  } catch (err: any) {
    console.error('[admin/seo/outreach] PATCH:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!authed(req)) return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id erforderlich (?id=)' }, { status: 400 })
    const { error } = await supabaseAdmin.from('outreach_prospects').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[admin/seo/outreach] DELETE:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── Kimi-Pitch: kurze, persönliche Outreach-Mail auf Deutsch ──
// Key: Vercel-Env MOONSHOT_API_KEY ODER Supabase app_settings (service_role-only, nie im Repo!)
async function getSetting(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.from('app_settings').select('value').eq('key', key).single()
    if (error || !data) return null
    return String(data.value)
  } catch { return null }
}

async function generatePitch(p: any, hint: string): Promise<string> {
  const apiKey = process.env.MOONSHOT_API_KEY || await getSetting('MOONSHOT_API_KEY')
  if (!apiKey) throw new Error('MOONSHOT_API_KEY nicht konfiguriert (Vercel-Env oder app_settings)')
  const TYPE_LABEL: Record<string, string> = {
    guestpost: 'einen Gastartikel',
    press: 'eine Pressemitteilung / einen redaktionellen Beitrag',
    podcast: 'einen Podcast-Auftritt',
    blogger: 'eine Kooperation mit einem Blog',
    directory: 'einen Eintrag in ein Verzeichnis',
    other: 'eine Zusammenarbeit',
  }
  const prompt = `Du bist Finn, Assistent der deutschen Agentur fachschmiede.de. fachschmiede.de baut professionelle, suchmaschinenoptimierte Webseiten für Handwerksbetriebe (Dachdecker, Elektriker, Klempner, Maler, Zimmerer, Gartenbau) an, die es monatlich vermietet — damit Handwerker ohne eigenen Online-Auftritt gefunden werden.

Schreibe eine kurze, sympathische Outreach-E-Mail auf Deutsch an: ${p.title}${p.url ? ' (' + p.url + ')' : ''}.
Ziel: ${TYPE_LABEL[p.type] || 'eine Zusammenarbeit'} anbieten.
${p.contact_name ? 'Ansprechpartner: ' + p.contact_name : ''}
${p.notes ? 'Kontext zu uns / zur Zielseite: ' + p.notes : ''}
${hint ? 'Wichtig: ' + hint : ''}

Regeln:
- Max. 180 Wörter, deutscher Geschäftston — professionell, aber menschlich (kein Marketing-Kitsch)
- Konkreter Nutzen für die GEGENSEITE in 1–2 Sätzen
- Genau EIN klarer nächster Schritt (z.B. kurzes Telefonat vermeiden — Dieter hasst Calls → lieber E-Mail-Antwort oder Terminlink)
- Betreff-Zeile mit "Betreff:" beginnen, dann Leerzeile, dann Mailtext
- Keine Platzhalter wie [Name] — wenn kein Ansprechpartner bekannt, neutral an "Hallo zusammen" oder "Guten Tag" adressieren`

  const res = await fetch('https://api.moonshot.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'kimi-k2-0905-preview',
      messages: [
        { role: 'system', content: 'Du schreibst exzellente, knappe Outreach-E-Mails auf Deutsch.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 900,
    }),
  })
  const j = await res.json().catch(() => ({}))
  if (!res.ok) {
    // Fallback: Kimi-Guthaben leer/API-Fehler → sauberer Template-Pitch statt hartem Fehler
    console.warn('[outreach] Kimi nicht verfügbar (' + (j.error?.message || res.status) + ') — Template-Fallback')
    return templatePitch(p)
  }
  const content = j.choices?.[0]?.message?.content?.trim()
  if (!content) return templatePitch(p)
  return content
}

// Lokaler Fallback-Pitch (wenn Kimi-Guthaben aufgebraucht ist) — immer verfügbar, 0 Kosten
function templatePitch(p: any): string {
  const ANGEBOT: Record<string, string> = {
    guestpost: 'einen Gastartikel zum Thema „Online-Marketing für Handwerksbetriebe" anbieten — mit praxisnahem Fachwert für Ihre Leser',
    press: 'eine Pressemitteilung zu unserem neuen Mietmodell für Handwerker-Webseiten anbieten',
    podcast: 'mich als Gesprächsgast zum Thema „Handwerk digital: Webseiten zur Miete" anbieten',
    blogger: 'eine Kooperation anbieten: wir erstellen kostenlos eine Analyse, wie Handwerker in Ihrer Region online gefunden werden',
    directory: 'einen Eintrag unserer Plattform in Ihr Verzeichnis anbieten — bzw. fragen, welche Konditionen für einen Firmeneintrag gelten',
    other: 'eine Zusammenarbeit mit fachschmiede.de anbieten',
  }
  const hello = p.contact_name ? `Guten Tag ${p.contact_name},` : 'Guten Tag,'
  return `Betreff: Kooperation: Fachwissen für ${String(p.title || '').replace(/^https?:\/\//, '')}

${hello}

ich schreibe Ihnen von fachschmiede.de — wir bauen professionelle, suchmaschinenoptimierte Webseiten für Handwerksbetriebe (Dachdecker, Elektriker, Klempner, Maler, Zimmerer, Gartenbau), die unsere Kunden monatlich mieten können, statt sie zu kaufen.

Gerne würde ich Ihnen ${ANGEBOT[p.type] || ANGEBOT.other}.

Für Ihre Seite bedeutet das: frischer, redaktioneller Fachcontent ohne Aufwand für Ihre Redaktion — und für uns die Möglichkeit, unser Projekt kurz vorzustellen (mit Link auf fachschmiede.de).

Passt das grundsätzlich? Dann schicke ich Ihnen gern ein konkretes Themen-Konzept zur Freigabe. Rückfragen beantworte ich selbstverständlich jederzeit per E-Mail.

Mit freundlichen Grüßen
Dieter Strohmer
fachschmiede.de — Webseiten für Handwerker`
}
