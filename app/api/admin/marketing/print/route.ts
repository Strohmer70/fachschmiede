import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/admin-auth'

export const maxDuration = 60

// ─── POST /api/admin/marketing/print/ ───────────────────────────
// Generiert druckfertige Prospekt-Briefe (A4, 2 Seiten pro Empfänger):
//   Seite 1 = Angebot mit echten Website-/Dashboard-Screenshots, Preis, QR
//   Seite 2 = DIN-5008-Anschreiben (Self-Check-in-CTA, echtes Impressum)
// Body: { ids: string[] }  →  { html, letters: [{id,to,subject,body,url}], skippedNoAddress }

const TRADE_LABELS: Record<string, string> = {
  dachdecker: 'Dachdecker',
  elektriker: 'Elektriker',
  klempner: 'Klempner',
  maler: 'Maler',
  zimmerer: 'Zimmerer',
  'garten-und-landschaftsbau': 'Garten- und Landschaftsbau',
}

// Gewerk-Bilder (public/images) — echte Screenshots der Muster-Seiten
const HERO_IMG: Record<string, string> = {
  dachdecker: 'hero.jpg',
  elektriker: 'hero-elektro.jpg',
  klempner: 'hero-shk.jpg',
  maler: 'hero-maler.jpg',
  zimmerer: 'hero-zimmerer.jpg',
  'garten-und-landschaftsbau': 'hero-garten.jpg',
}
const WEB_PREFIX: Record<string, string> = {
  dachdecker: 'web-dach',
  elektriker: 'web-elek',
  klempner: 'web-shk',
  maler: 'web-maler',
  zimmerer: 'web-zimm',
  'garten-und-landschaftsbau': 'web-garten',
}

// ⚖️ Echtes Betreiber-Impressum (§ 5 DDG) — Pflichtangabe in Geschäftsbriefen!
const IMPRESSUM = {
  name: 'Dieter Strohm',
  brand: 'fachschmiede.de',
  street: 'Am Waldesrand 5',
  zip: '58285',
  city: 'Gevelsberg',
  email: 'hello@fachschmiede.de',
}
const PRICE = 99 // €/Monat — einheitlicher Tarif (vgl. Salespages dynPrice)

// Stadt-Slug aus der System-Config (SSOT) — berlin-spandau statt "spandau"!
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
    name: name.replace(/\b\w/g, (ch) => ch.toUpperCase()), // Pascal-Case-Fallback
    slug: name
      .toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[()]/g, ' ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''),
  }
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

    // Posttauglich = Adresse MIT Straße (Komma-Separator) UND 5-stellige PLZ
    const isMailable = (c: any) =>
      !!c.address && c.address.includes(',') && /\b\d{5}\b/.test(c.address)
    const withAddr = (contacts || []).filter(isMailable)
    const skippedNoAddress = (contacts || []).length - withAddr.length

    const letters = []
    for (const c of withAddr) {
      const tradeLabel = TRADE_LABELS[c.trade] || c.trade
      const cityInfo = await resolveCity(c.city)
      const cityName: string = cityInfo.name
      const url = `https://www.fachschmiede.de/${c.trade}/${cityInfo.slug}/`
      const subject = `Ihre ${tradeLabel}-Website für ${cityName} – noch frei`
      const text = `Sehr geehrte Damen und Herren,

wenn Kunden in ${cityName} nach „${tradeLabel}“ googeln, finden sie
Verzeichnisse und Portale – kaum einen lokalen Betrieb.

Wir haben dafür etwas gebaut: eine fertige Website für ${tradeLabel}
in ${cityName}. Kein Projekt, keine Agentur – sofort startklar.

Auf der beiliegenden ersten Seite sehen Sie den kompletten Aufbau als
echten Screenshot – und Ihr Dashboard, mit dem Sie Name, Fotos,
Leistungen und Farben jederzeit selbst pflegen. Ganz ohne Programmieren.

Online ansehen (1 Minute):
${url}

Mieten statt kaufen: ${PRICE} €/Monat, monatlich kündbar.
Im Preis: komplette Pflege, Updates, Ihre Firma drauf.

Wichtig: Jede Stadt-Website wird nur an EINEN Betrieb vermietet.

Mieten Sie einfach online: QR-Code scannen oder die Seite aufrufen –
dort in wenigen Minuten mit Ihren Daten starten und 14 Tage kostenlos
testen. Ganz ohne Anruf, ohne Verkaufstermin.
Oder antworten Sie einfach auf diesen Brief.

Mit freundlichen Grüßen
Finn
fachschmiede.de – Websites für Handwerker

PS: Dieser Brief erreicht ${c.company_name}, weil Ihr Betrieb in
${c.city} öffentlich gelistet ist. Kein Verteiler. Wenn Sie keine
Werbung mehr wünschen, genügt ein kurzer Hinweis – wir streichen
Sie sofort und dauerhaft.`
      letters.push({ id: c.id, to: c.company_name, address: c.address, subject, body: text, url, trade: c.trade, city: cityName })
    }

    const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const img = (f: string) => `https://www.fachschmiede.de/images/${f}`
    const foot = `${IMPRESSUM.name} · ${IMPRESSUM.brand} · ${IMPRESSUM.street} · ${IMPRESSUM.zip} ${IMPRESSUM.city} · ${IMPRESSUM.email} · Impressum: https://www.fachschmiede.de/impressum/`

    const pages = letters.map((L: any) => {
      const addrLines = L.address.split(',').map((x: string) => x.trim()).join('<br>')
      const qr = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(L.url)}`
      const tradeLabel = TRADE_LABELS[L.trade] || L.trade
      const hero = HERO_IMG[L.trade]
      const webP = WEB_PREFIX[L.trade]

      // ── Seite 1: Angebot & Website-Vorschau ──
      const webShots = webP
        ? [1, 2, 3].map((k) => `<img src="${img(`${webP}-${k}.png`)}" style="width:100%;height:64mm;object-fit:cover;object-fit:top;border:0.4pt solid #d7dee6;">`).join('')
        : ''
      const page1 = `
<div class="page p1">
  <div class="p1-top"><strong>fachschmiede.de</strong><span>${esc(L.url.replace('https://www.', ''))}</span><em>MUSTER-VORSCHAU</em></div>
  <div class="p1-hero">
    ${hero ? `<img src="${img(hero)}" alt="">` : ''}
    <div class="p1-hero-grad"></div>
    <div class="p1-hero-txt">
      <p class="k">Miet-Website · noch frei</p>
      <h1>${esc(tradeLabel)} in ${esc(L.city)}</h1>
      <p>Fertig gebaut, lokal optimiert, mit Ihrem Namen online.</p>
    </div>
  </div>
  <div class="p1-steps">
    <div><b>1</b><strong>Stadt wählen</strong><span>nur 1× pro Stadt</span></div>
    <div><b>2</b><strong>Daten eintragen</strong><span>in wenigen Minuten</span></div>
    <div><b>3</b><strong>Veröffentlichen</strong><span>sofort online</span></div>
  </div>
  ${webShots ? `<div class="p1-label">So sieht Ihre Website aus – kompletter echter Screenshot</div><div class="p1-web">${webShots}</div>` : ''}
  <div class="p1-label">Ihr Dashboard – das ändern Sie jederzeit selbst</div>
  <div class="p1-dash">
    <div><img src="${img('dash-profil.png')}"><strong>Firmenprofil</strong><span>Name, Telefon, E-Mail, Zeiten</span></div>
    <div><img src="${img('dash-module.png')}"><strong>Leistungen &amp; Module</strong><span>Bausteine anpassen</span></div>
    <div><img src="${img('dash-design.png')}"><strong>Design &amp; Bilder</strong><span>Farben, Logo, Fotos</span></div>
  </div>
  <div class="p1-offer">
    <div class="p1-price"><span>Website mieten</span><strong>${PRICE} €<small>/Monat</small></strong><span>Website · Leads · Dashboard · Blog</span></div>
    <div class="p1-qr"><img src="${qr}" width="92" height="92"><span>${esc(L.url.replace('https://www.', ''))}</span></div>
  </div>
  <div class="p1-note">✏️ Alles individualisierbar: Firmenname, Logo, Farben, Leistungen, Texte, Fotos &amp; Rechtliches – im eigenen Dashboard, ohne Programmieren. <strong>14 Tage kostenlos testen.</strong></div>
  <div class="foot">${esc(foot)}</div>
</div>`

      // ── Seite 2: Anschreiben ──
      const page2 = `
<div class="page p2">
  <div class="sender">${IMPRESSUM.name} · ${IMPRESSUM.brand} · ${IMPRESSUM.street} · ${IMPRESSUM.zip} ${IMPRESSUM.city} — ${IMPRESSUM.email}</div>
  <div class="addr">
    <strong>${esc(L.to)}</strong><br>${addrLines}
  </div>
  <div class="date">${IMPRESSUM.city}, ${today}</div>
  <div class="subject"><strong>${esc(L.subject)}</strong></div>
  <div class="body">${esc(L.body).replace(/\n/g, '<br>')}</div>
  <div class="qrbox">
    <img src="${qr}" alt="QR-Code zur Website" width="100" height="100">
    <div class="qrurl">${esc(L.url)}</div>
  </div>
  <div class="foot">${esc(foot)}</div>
</div>`
      return page1 + page2
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><title>Prospekt-Versand fachschmiede.de</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1a2b3c; }
  .page { position: relative; width: 210mm; height: 296mm; page-break-after: always; overflow: hidden; background: #fff; }
  .page:last-child { page-break-after: avoid; }
  .foot { position: absolute; bottom: 10mm; left: 14mm; right: 14mm; font-size: 6.8pt; color: #8a97a5; border-top: 0.4pt solid #d7dee6; padding-top: 1.6mm; }

  /* ── Seite 1 ── */
  .p1 { padding: 12mm 14mm 30mm 14mm; }
  .p1-top { display: flex; align-items: center; justify-content: space-between; font-size: 8pt; color: #5c6b7a; border-bottom: 0.6pt solid #d7dee6; padding-bottom: 2.5mm; }
  .p1-top strong { color: #0f766e; font-size: 10pt; }
  .p1-top span { font-family: monospace; font-size: 7pt; }
  .p1-top em { font-style: normal; background: #f59e0b; color: #111; font-size: 6.4pt; font-weight: bold; padding: 0.8mm 2mm; border-radius: 2mm; }
  .p1-hero { position: relative; height: 52mm; margin-top: 4mm; border-radius: 3mm; overflow: hidden; }
  .p1-hero img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .p1-hero-grad { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(8,20,30,.92) 0%, rgba(8,20,30,.62) 55%, rgba(8,20,30,.18) 100%); }
  .p1-hero-txt { position: absolute; left: 7mm; top: 50%; transform: translateY(-50%); color: #fff; }
  .p1-hero-txt .k { font-size: 6.6pt; letter-spacing: 1.4pt; text-transform: uppercase; color: #b8c6d2; font-weight: bold; }
  .p1-hero-txt h1 { font-size: 17pt; margin: 1.5mm 0; }
  .p1-hero-txt p { font-size: 8.6pt; }
  .p1-steps { display: flex; gap: 4mm; margin-top: 4.5mm; }
  .p1-steps div { flex: 1; background: #f2f6f9; border-radius: 2.5mm; padding: 3mm; text-align: center; }
  .p1-steps b { display: inline-block; width: 6.5mm; height: 6.5mm; line-height: 6.5mm; border-radius: 50%; background: #0f766e; color: #fff; font-size: 8.5pt; }
  .p1-steps strong { display: block; font-size: 8pt; margin-top: 1.4mm; }
  .p1-steps span { display: block; font-size: 6.6pt; color: #7b8a99; margin-top: 0.6mm; }
  .p1-label { font-size: 6.8pt; font-weight: bold; letter-spacing: 1pt; text-transform: uppercase; color: #0f766e; margin: 5mm 0 2mm; }
  .p1-web { display: flex; gap: 3mm; }
  .p1-web img { border-radius: 2mm; }
  .p1-dash { display: flex; gap: 3mm; }
  .p1-dash div { flex: 1; }
  .p1-dash img { width: 100%; height: 30mm; object-fit: cover; object-position: top; border: 0.4pt solid #d7dee6; border-radius: 2mm; }
  .p1-dash strong { display: block; font-size: 7.2pt; margin-top: 1.2mm; }
  .p1-dash span { display: block; font-size: 6.4pt; color: #7b8a99; }
  .p1-offer { display: flex; align-items: center; justify-content: space-between; margin-top: 5mm; border: 1.2pt solid #0f766e; border-radius: 3mm; padding: 4mm 6mm; }
  .p1-price span { display: block; font-size: 7pt; color: #5c6b7a; }
  .p1-price strong { font-size: 19pt; color: #111; }
  .p1-price small { font-size: 8pt; color: #7b8a99; font-weight: normal; }
  .p1-qr { text-align: center; }
  .p1-qr img { border: 0.4pt solid #d7dee6; border-radius: 2mm; padding: 1mm; background: #fff; }
  .p1-qr span { display: block; font-family: monospace; font-size: 6.4pt; color: #0f766e; margin-top: 1mm; max-width: 42mm; word-break: break-all; }
  .p1-note { margin-top: 4mm; background: #ecfdf9; border-left: 1.6pt solid #0f766e; padding: 2.6mm 4mm; font-size: 7.4pt; color: #134e4a; border-radius: 0 2mm 2mm 0; }

  /* ── Seite 2 ── */
  .p2 { padding: 20mm 25mm 25mm 25mm; font-size: 10.6pt; line-height: 1.55; }
  .sender { font-size: 8pt; color: #666; margin-bottom: 30mm; }
  .addr { position: absolute; top: 50mm; left: 25mm; font-size: 10.6pt; line-height: 1.4; }
  .date { text-align: right; margin-top: 8mm; }
  .subject { margin-top: 10mm; margin-bottom: 7mm; }
  .body { max-width: 155mm; }
  .qrbox { position: absolute; bottom: 28mm; right: 25mm; text-align: center; }
  .qrurl { font-size: 7pt; color: #444; margin-top: 1.6mm; max-width: 42mm; word-break: break-all; }

  @media screen { .page { margin: 10px auto; box-shadow: 0 2px 10px rgba(0,0,0,.15); } body { background: #e9edf1; } }
  @media print { .page { margin: 0; box-shadow: none; } body { background: #fff; } }
</style></head><body>${pages}
<script>window.onload = function(){ setTimeout(function(){ window.print(); }, 600); };</script>
</body></html>`

    return NextResponse.json({ success: true, html, letters, skippedNoAddress })
  } catch (error: any) {
    console.error('Marketing print error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
