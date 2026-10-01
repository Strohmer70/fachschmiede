// app/api/tenant/reviews/route.ts — Mieter moderiert eigene Kundenbewertungen
// GET   → alle Reviews des Tenants (pending zuerst, dann approved, dann rejected)
// PATCH → { id, action: 'approve' | 'reject' | 'delete' } — nur EIGENE Reviews
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const json = (data: any, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'X-Canary': new Date().toISOString() },
  })

function getSecret(): string {
  return process.env.SESSION_SECRET || process.env.STRIPE_SECRET_KEY || 'dev-secret-nur-lokal'
}

async function authTenant(request: Request): Promise<{ tenantId: string } | { error: string; status: number }> {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  if (!token) return { error: 'Nicht eingeloggt.', status: 401 }
  const payload = verifyToken<{ tid: string }>(token, getSecret())
  if (!payload?.tid) return { error: 'Session ungültig oder abgelaufen.', status: 401 }
  return { tenantId: payload.tid }
}

export async function GET(request: Request) {
  const auth = await authTenant(request)
  if ('error' in auth) return json({ error: auth.error }, auth.status)

  const { data: reviews, error } = await supabaseAdmin
    .from('reviews')
    .select('id, author_name, rating, title, text, status, created_at, moderated_at')
    .eq('tenant_id', auth.tenantId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return json({ error: 'DB-Fehler: ' + error.message }, 500)

  const counts = { pending: 0, approved: 0, rejected: 0 }
  for (const r of reviews || []) {
    const s = String((r as any).status)
    if (s in counts) (counts as any)[s]++
  }
  // pending zuerst
  const sorted = [...(reviews || [])].sort((a: any, b: any) => {
    const rank = (s: string) => (s === 'pending' ? 0 : s === 'approved' ? 1 : 2)
    return rank(String(a.status)) - rank(String(b.status)) || String(b.created_at).localeCompare(String(a.created_at))
  })
  return json({ ok: true, reviews: sorted, counts })
}

export async function PATCH(request: Request) {
  const auth = await authTenant(request)
  if ('error' in auth) return json({ error: auth.error }, auth.status)

  const body = await request.json().catch(() => ({}))
  const id = String(body.id || '')
  const action = String(body.action || '')
  if (!id) return json({ error: 'id fehlt.' }, 400)
  if (!['approve', 'reject', 'delete'].includes(action)) return json({ error: 'action muss approve|reject|delete sein.' }, 400)

  // Sicherheit: Review gehört wirklich diesem Tenant?
  const { data: own } = await supabaseAdmin
    .from('reviews').select('id').eq('id', id).eq('tenant_id', auth.tenantId).maybeSingle()
  if (!own) return json({ error: 'Bewertung nicht gefunden.' }, 404)

  if (action === 'delete') {
    const { error } = await supabaseAdmin.from('reviews').delete().eq('id', id)
    if (error) return json({ error: 'Löschen fehlgeschlagen: ' + error.message }, 500)
    return json({ ok: true, action })
  }
  const { error } = await supabaseAdmin
    .from('reviews')
    .update({ status: action === 'approve' ? 'approved' : 'rejected', moderated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return json({ error: 'Update fehlgeschlagen: ' + error.message }, 500)
  return json({ ok: true, action })
}
