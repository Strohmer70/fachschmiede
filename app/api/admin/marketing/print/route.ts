import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/admin-auth'

export const maxDuration = 60

// ─── POST /api/admin/marketing/print/ ───────────────────────────
// Generiert druckfertige Prospekt-Briefe (A4, DIN-5008-Anmutung) für ausgewählte
// Kontakte. Body: { ids: string[] }
// Rückgabe: { html, letters: [{id,to,subject,body,url}], skippedNoAddress }

const TRADE_LABELS: Record<string, string> = {
  dachdecker: 'Dachdecker',
  elektriker: 'Elektriker',
  klempner: 'Klempner',
  maler: 'Maler',
  zimmerer: 'Zimmerer',
  'garten-und-landschaftsbau': 'Garten- und Landschaftsbau',
}

function slugifyCity(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const esc = (s: string) =>
  String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function POST(request: Request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const ids: string[] = Array.isArray(body.ids) ? body.ids.slice(0, 50) : []
    if (!ids.length) return NextResponse.json({ error: 'ids (Array) fehlt' }, { status: 400 })

    const { data: contacts, error } = await supabaseAdmin
      .from('marketing_contacts')
      .select('id, company_name, trade, city, address, email')
      .in('id', ids)
    if (error) throw error

    const withAddr = (contacts || []).filter((c: any) => c.address)
    const skippedNoAddress = (contacts || []).length - withAddr.length

    const letters = withAddr.map((c: any) => {
      const tradeLabel = TRADE_LABELS[c.trade] || c.trade
      const url = `https://www.fachschmiede.de/${c.trade}/${slugifyCity(c.city)}/`
      const subject = `Ihre ${tradeLabel}-Website für ${c.city} – noch frei`
      const text = `Sehr geehrte Damen und Herren,

wenn Kunden in ${c.city} nach „${tradeLabel}" googeln, finden sie
Verzeichnisse und Portale – kaum einen lokalen Betrieb.

Wir haben dafür etwas gebaut: eine fertige Website für ${tradeLabel}
in ${c.city}. Kein Projekt, keine Agentur – sofort startklar.

Online ansehen (1 Minute):
${url}

Mieten statt kaufen: 99 €/Monat, monatlich kündbar.
Im Preis: komplette Pflege, Updates, Ihre Firma drauf.

Wichtig: Jede Stadt-Website wird nur an EINEN Betrieb vermietet.

Interessiert? Antworten Sie einfach auf diesen Brief oder schreiben
Sie an hello@fachschmiede.de.

Mit freundlichen Grüßen
Finn
fachschmiede.de – Websites für Handwerker

PS: Dieser Brief erreicht ${c.company_name}, weil Ihr Betrieb in
${c.city} öffentlich gelistet ist. Kein Verteiler. Wenn Sie keine
Werbung mehr wünschen, genügt ein kurzer Hinweis – wir streichen
Sie sofort und dauerhaft.`
      return { id: c.id, to: c.company_name, address: c.address, subject, body: text, url, trade: c.trade, city: c.city }
    })

    const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const pages = letters.map((L: any) => {
      const addrLines = L.address.split(',').map((x: string) => x.trim()).join('<br>')
      const qr = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(L.url)}`
      return `
<div class="page">
  <div class="sender">Finn · fachschmiede.de · Bochum — hello@fachschmiede.de</div>
  <div class="addr">
    <strong>${esc(L.to)}</strong><br>${addrLines}
  </div>
  <div class="date">${today}</div>
  <div class="subject"><strong>${esc(L.subject)}</strong></div>
  <div class="body">${esc(L.body).replace(/\n/g, '<br>')}</div>
  <div class="qrbox">
    <img src="${qr}" alt="QR-Code zur Demo-Seite" width="110" height="110">
    <div class="qrurl">${esc(L.url)}</div>
  </div>
  <div class="foot">Finn – fachschmiede.de · Impressum: https://www.fachschmiede.de/impressum/</div>
</div>`
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><title>Prospekt-Versand fachschmiede.de</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1a2b3c; }
  .page { position: relative; width: 210mm; height: 296mm; page-break-after: always; padding: 20mm 25mm 25mm 25mm; overflow: hidden; font-size: 11pt; line-height: 1.55; }
  .page:last-child { page-break-after: avoid; }
  .sender { font-size: 8pt; color: #666; border-bottom: 0; margin-bottom: 30mm; }
  .addr { position: absolute; top: 50mm; left: 25mm; font-size: 11pt; line-height: 1.4; }
  .date { text-align: right; margin-top: 8mm; }
  .subject { margin-top: 10mm; margin-bottom: 8mm; }
  .body { max-width: 155mm; }
  .qrbox { position: absolute; bottom: 30mm; right: 25mm; text-align: center; }
  .qrurl { font-size: 7.5pt; color: #444; margin-top: 2mm; max-width: 40mm; word-break: break-all; }
  .foot { position: absolute; bottom: 12mm; left: 25mm; right: 25mm; font-size: 7.5pt; color: #888; border-top: 0.5pt solid #ccc; padding-top: 2mm; }
  @media screen { .page { margin: 10px auto; box-shadow: 0 2px 10px rgba(0,0,0,.15); } body { background: #e9edf1; } }
  @media print { .page { margin: 0; box-shadow: none; } body { background: #fff; } }
</style></head><body>${pages}
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`

    return NextResponse.json({ success: true, html, letters, skippedNoAddress })
  } catch (error: any) {
    console.error('Marketing print error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
