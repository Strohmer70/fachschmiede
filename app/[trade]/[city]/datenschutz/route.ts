// app/[trade]/[city]/datenschutz/route.ts — Mieter-Datenschutz für Mietseiten
// VERMIETET → Mieter ist Verantwortlicher, fachschmiede.de technischer Dienstleister. FREI → Plattform-Fallback.
import { getRentalLegal, legalPageShell } from '@/lib/legal'

export const dynamic = 'force-dynamic'

function esc(s: string): string {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function section(title: string, body: string): string {
  return `<div><h2 class="text-xl font-bold text-ink-900 mb-3">${esc(title)}</h2><div class="text-sm text-ink-600 leading-relaxed space-y-2">${body}</div></div>`
}

function tenantDatenschutz(d: Awaited<ReturnType<typeof getRentalLegal>>): string {
  return `
  <div class="bg-white rounded-2xl border border-ink-200 p-7 shadow-sm space-y-8">
    ${section('1. Verantwortlicher', `
      <p><strong>${esc(d.companyName)}</strong><br>${esc(d.address)}<br>Telefon: ${esc(d.phone)}<br>E-Mail: <a class="text-brand-600 font-bold hover:underline" href="mailto:${esc(d.email)}">${esc(d.email)}</a></p>
      <p>Der Betrieb ist verantwortlich für die Verarbeitung der über dieses Kontaktformular übermittelten Daten.</p>`)}
    ${section('2. Erhebung und Verarbeitung von Anfragedaten', `
      <p>Bei Nutzung des Kontaktformulars verarbeiten wir die von dir angegebenen Daten (Name, Telefonnummer, ggf. E-Mail-Adresse und Nachricht) ausschließlich zur Bearbeitung deiner Anfrage und zur Kontaktaufnahme.</p>
      <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen auf deine Anfrage) und Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von Kundenanfragen).</p>
      <p>Deine Daten werden nicht an Dritte weitergegeben und nach abschließender Bearbeitung gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.</p>`)}
    ${section('3. Technische Umsetzung & Hosting', `
      <p>Diese Webseite wird im Rahmen eines Mietmodells über die technische Plattform <strong>fachschmiede.de</strong> (E-Mail: hallo@fachschmiede.de) bereitgestellt. Dabei werden Server-Logfiles (IP-Adresse, Zeitpunkt, aufgerufene Seite) aus Sicherheitsgründen für maximal 14 Tage gespeichert (Art. 6 Abs. 1 lit. f DSGVO).</p>
      <p>fachschmiede.de tritt hierbei als technischer Dienstleister im Auftrag des Betriebs auf und verarbeitet Formulardaten ausschließlich zur Weiterleitung an den Betrieb.</p>`)}
    ${section('4. Cookies & Tracking', `
      <p>Diese Seite setzt keine Analyse-Cookies und kein Tracking für Werbezwecke ein. Es kommen ausschließlich technisch notwendige Funktionen zum Einsatz.</p>`)}
    ${section('5. Deine Rechte', `
      <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie das Recht auf Beschwerde bei einer Aufsichtsbehörde.</p>
      <p>Wende dich hierfür an: <a class="text-brand-600 font-bold hover:underline" href="mailto:${esc(d.email)}">${esc(d.email)}</a></p>`)}
    ${section('6. Änderungen', `
      <p>Diese Erklärung wird bei Änderungen der Webseite oder der Rechtslage aktualisiert. Stand: ${new Date().toLocaleDateString('de-DE')}.</p>`)}
  </div>`
}

function platformDatenschutz(): string {
  return `
  <div class="bg-white rounded-2xl border border-ink-200 p-7 shadow-sm space-y-8">
    ${section('Verantwortlicher', `
      <p>fachschmiede.de — Website-Mietplattform für Handwerksbetriebe</p>
      <p>Kontakt: <a class="text-brand-600 font-bold hover:underline" href="mailto:hallo@fachschmiede.de">hallo@fachschmiede.de</a></p>
      <p>Vollständige Angaben: <a class="text-brand-600 font-bold hover:underline" href="/datenschutz.html">globale Datenschutzerklärung</a>.</p>`)}
    ${section('Hinweis', `
      <p>Diese Stadtseite ist aktuell <strong>frei vermietbar</strong>. Mit Vermietung erscheint hier die datenschutzrechtliche Verantwortlichkeit des jeweiligen Mietbetriebs automatisch.</p>`)}
  </div>`
}

export async function GET(_req: Request, { params }: { params: { trade: string; city: string } }) {
  const trade = (params.trade || '').replace(/\/$/, '')
  const city = (params.city || '').replace(/\/$/, '')
  const d = await getRentalLegal(trade, city)
  const html = legalPageShell({
    title: `Datenschutz — ${d.tradeName} ${d.cityName}`,
    cityName: d.cityName,
    tradeName: d.tradeName,
    pageUrl: d.pageUrl,
    bodyHtml: d.rented ? tenantDatenschutz(d) : platformDatenschutz(),
  })
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
