// app/[trade]/[city]/impressum/route.ts — Mieter-Impressum für Mietseiten
// VERMIETET → echte Betreiberdaten aus DB (Mieter). FREI → Plattform-Fallback.
import { getRentalLegal, legalPageShell } from '@/lib/legal'

export const dynamic = 'force-dynamic'

function esc(s: string): string {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function row(label: string, value: string): string {
  if (!value) return ''
  return `<tr><td class="py-2 pr-4 text-ink-500 font-semibold align-top whitespace-nowrap">${esc(label)}</td><td class="py-2 text-ink-900">${esc(value)}</td></tr>`
}

function tenantImpressum(d: Awaited<ReturnType<typeof getRentalLegal>>): string {
  return `
  <div class="bg-white rounded-2xl border border-ink-200 p-7 shadow-sm space-y-8">
    <div>
      <h2 class="text-xl font-bold text-ink-900 mb-3">Angaben gemäß § 5 DDG</h2>
      <table class="text-sm">
        ${row('Firma', d.companyName)}
        ${row('Vertretungsberechtigt', d.contactName)}
        ${row('Anschrift', d.address)}
        ${row('Telefon', d.phone)}
        ${row('E-Mail', `<a href="mailto:${esc(d.email)}" class="text-brand-600 font-bold hover:underline">${esc(d.email)}</a>`)}
      </table>
      ${!d.address ? '<p class="mt-3 text-xs text-ink-400">Vollständige Ladungsfähige Anschrift auf Anfrage: <a class="text-brand-600 font-bold" href="mailto:' + esc(d.email) + '">' + esc(d.email) + '</a></p>' : ''}
    </div>
    <div>
      <h2 class="text-xl font-bold text-ink-900 mb-3">Umsatzsteuer & Aufsicht</h2>
      <p class="text-sm text-ink-600">Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG sowie zuständige Handwerkskammer/Industrie- und Handelskammer: auf Anfrage über die oben genannten Kontaktdaten.</p>
    </div>
    <div>
      <h2 class="text-xl font-bold text-ink-900 mb-3">Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)</h2>
      <p class="text-sm text-ink-900 font-semibold">${esc(d.companyName)}</p>
      <p class="text-sm text-ink-600">${esc(d.address)}</p>
    </div>
    <div class="bg-ink-50 border border-ink-200 rounded-xl p-5">
      <h2 class="text-xl font-bold text-ink-900 mb-3">Hinweis zum Mietmodell</h2>
      <p class="text-sm text-ink-600 leading-relaxed">Diese Webseite wird von <strong>${esc(d.companyName)}</strong> im Rahmen eines Website-Mietmodells betrieben. Technische Plattform, Hosting und Bereitstellung: <strong>fachschmiede.de</strong> (hallo@fachschmiede.de). Kundenanfragen aus dem Kontaktformular gehen unmittelbar an den oben genannten Betrieb.</p>
    </div>
    <div>
      <h2 class="text-xl font-bold text-ink-900 mb-3">Streitschlichtung</h2>
      <p class="text-sm text-ink-600">Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr" class="text-brand-600 hover:underline">https://ec.europa.eu/consumers/odr</a></p>
      <p class="text-sm text-ink-600 mt-2">Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
    </div>
  </div>`
}

function platformImpressum(): string {
  return `
  <div class="bg-white rounded-2xl border border-ink-200 p-7 shadow-sm space-y-8">
    <div>
      <h2 class="text-xl font-bold text-ink-900 mb-3">Angaben gemäß § 5 DDG</h2>
      <p class="text-sm text-ink-600">fachschmiede.de — Website-Mietplattform für Handwerksbetriebe</p>
      <p class="text-sm text-ink-600 mt-2">Kontakt: <a href="mailto:hallo@fachschmiede.de" class="text-brand-600 font-bold hover:underline">hallo@fachschmiede.de</a></p>
      <p class="text-xs text-ink-400 mt-3">Vollständige Betreiberangaben: siehe <a href="/impressum.html" class="text-brand-600 font-bold hover:underline">globales Impressum</a>.</p>
    </div>
    <div>
      <h2 class="text-xl font-bold text-ink-900 mb-3">Hinweis</h2>
      <p class="text-sm text-ink-600">Diese Stadtseite ist aktuell <strong>frei vermietbar</strong>. Sobald ein lokaler Betrieb die Seite mietet, erscheinen hier automatisch dessen vollständige Betreiberangaben gemäß § 5 DDG.</p>
    </div>
    <div>
      <h2 class="text-xl font-bold text-ink-900 mb-3">Streitschlichtung</h2>
      <p class="text-sm text-ink-600">Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr" class="text-brand-600 hover:underline">https://ec.europa.eu/consumers/odr</a></p>
    </div>
  </div>`
}

export async function GET(_req: Request, { params }: { params: { trade: string; city: string } }) {
  const trade = (params.trade || '').replace(/\/$/, '')
  const city = (params.city || '').replace(/\/$/, '')
  const d = await getRentalLegal(trade, city)
  const html = legalPageShell({
    title: `Impressum — ${d.tradeName} ${d.cityName}`,
    cityName: d.cityName,
    tradeName: d.tradeName,
    pageUrl: d.pageUrl,
    bodyHtml: d.rented ? tenantImpressum(d) : platformImpressum(),
  })
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
