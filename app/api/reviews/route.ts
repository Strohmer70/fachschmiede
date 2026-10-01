// app/api/reviews/route.ts — Öffentliche Bewertungs-Einreichung (Kunden → pending)
// POST /api/reviews/ { page_slug, author_name, rating, title?, text }
// Prüft: Seite vermietet? Duplikat? → INSERT pending + E-Mail an Mieter (Brevo)
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMail } from '@/lib/mailer'

export const dynamic = 'force-dynamic'
const json = (data: any, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } })

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const pageSlug = String(body.page_slug || '').trim().slice(0, 120)
    const author = String(body.author_name || '').trim().slice(0, 80)
    const title = body.title ? String(body.title).trim().slice(0, 120) : null
    const text = String(body.text || '').trim().slice(0, 2000)
    const rating = Math.round(Number(body.rating))

    if (!pageSlug || !author || !text) return json({ error: 'Bitte Name und Bewertungstext ausfüllen.' }, 400)
    if (!(rating >= 1 && rating <= 5)) return json({ error: 'Bitte 1–5 Sterne wählen.' }, 400)
    if (text.length < 10) return json({ error: 'Der Text sollte mindestens 10 Zeichen haben.' }, 400)

    const { data: page } = await supabaseAdmin
      .from('landing_pages').select('id, rented_by, status').eq('slug', pageSlug).maybeSingle()
    if (!page || page.status !== 'rented' || !page.rented_by) {
      return json({ error: 'Diese Seite nimmt aktuell keine Bewertungen an.' }, 404)
    }

    // Duplikat-Schutz (gleicher Name + gleicher Text)
    const { data: dup } = await supabaseAdmin
      .from('reviews').select('id')
      .eq('landing_page_id', page.id).ilike('author_name', author).eq('text', text)
      .in('status', ['pending', 'approved']).limit(1)
    if (dup && dup.length) return json({ error: 'Diese Bewertung wurde bereits eingereicht.' }, 409)

    const { error } = await supabaseAdmin.from('reviews').insert({
      landing_page_id: page.id, tenant_id: page.rented_by,
      author_name: author, rating, title, text, status: 'pending',
    })
    if (error) return json({ error: 'Speichern fehlgeschlagen. Bitte später erneut versuchen.' }, 500)

    // Mieter benachrichtigen (fire & forget)
    const { data: tenant } = await supabaseAdmin
      .from('tenants').select('email, company_name').eq('id', page.rented_by).maybeSingle()
    if (tenant?.email) {
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
      const name = author + (title ? ` — „${title}"` : '')
      sendMail({
        to: tenant.email,
        subject: `⭐ Neue Bewertung (${rating}/5) – Freigabe im Dashboard erforderlich`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">
          <h2 style="color:#1a1a1a">Neue Kundenbewertung auf fachschmiede.de</h2>
          <p><strong>${name}</strong><br><span style="color:#f59e0b;font-size:18px">${stars}</span></p>
          <p style="background:#f5f5f4;border-radius:8px;padding:16px">${text.replace(/</g, '&lt;')}</p>
          <p>Die Bewertung ist erst sichtbar, wenn du sie im <a href="https://www.fachschmiede.de/mieter.html">Mieter-Dashboard</a> freigibst.</p>
          <p style="color:#6b7280;font-size:12px">Seite: ${pageSlug}</p>
        </div>`,
      }).catch(() => false)
    }

    return json({ ok: true })
  } catch {
    return json({ error: 'Ungültige Anfrage.' }, 400)
  }
}
