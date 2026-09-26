// lib/legal.ts — Mieter-Rechtsdaten für Impressum/Datenschutz auf Mietseiten
// Liest NUR echte DB-Daten (keine Phantasie). Unvermietet → rented:false → Plattform-Fallback.
import { supabaseAdmin } from './supabase'

export interface RentalLegalData {
  slug: string
  rented: boolean
  companyName: string
  contactName: string
  phone: string
  email: string
  address: string
  cityName: string
  tradeName: string
  pageUrl: string
}

const TRADE_NAMES: Record<string, string> = {
  dachdecker: 'Dachdecker',
  elektriker: 'Elektriker',
  klempner: 'Klempner',
  zimmerer: 'Zimmerer',
  maler: 'Maler',
  'garten-und-landschaftsbau': 'Garten- und Landschaftsbau',
}

function esc(s: string): string {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function getRentalLegal(tradeSlug: string, citySlug: string): Promise<RentalLegalData> {
  const slug = `${tradeSlug}-${citySlug}`
  const base: RentalLegalData = {
    slug,
    rented: false,
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    cityName: citySlug.replace(/-/g, ' '),
    tradeName: TRADE_NAMES[tradeSlug] || tradeSlug,
    pageUrl: `/${tradeSlug}/${citySlug}/`,
  }

  // Stadtname für Anzeige (echter Name aus DB, Fallback: Slug aufgehübscht)
  const { data: city } = await supabaseAdmin.from('cities').select('name').eq('slug', citySlug).maybeSingle()
  if (city?.name) base.cityName = city.name

  const { data: lp } = await supabaseAdmin
    .from('landing_pages')
    .select('id, status, rented_by')
    .eq('slug', slug)
    .maybeSingle()
  if (!lp || !lp.rented_by) return base

  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('company_name, contact_name, phone, address, email')
    .eq('id', lp.rented_by)
    .maybeSingle()
  if (!tenant) return base

  const { data: cust } = await supabaseAdmin
    .from('page_customizations')
    .select('custom_company_name, custom_address, custom_phone, custom_email')
    .eq('landing_page_id', lp.id)
    .eq('tenant_id', lp.rented_by)
    .maybeSingle()

  // Customization schlägt Registrierungsdaten (Mieter hat im Dashboard bewusst geändert)
  base.rented = true
  base.companyName = cust?.custom_company_name || tenant.company_name || ''
  base.contactName = tenant.contact_name || ''
  base.phone = cust?.custom_phone || tenant.phone || ''
  base.email = cust?.custom_email || tenant.email || ''
  base.address = cust?.custom_address || tenant.address || ''
  return base
}

export function legalPageShell(opts: {
  title: string
  cityName: string
  tradeName: string
  pageUrl: string
  bodyHtml: string
}): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(opts.title)}</title>
<meta name="robots" content="noindex, follow">
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = { theme: { extend: { colors: {
  brand: {50:'#fff7ed',100:'#ffedd5',200:'#fed7aa',300:'#fdba74',400:'#fb923c',500:'#f97316',600:'#ea580c',700:'#c2410c',800:'#9a3412',900:'#7c2d12'},
  ink: {50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a'}
}, fontFamily: { sans: ['Inter','system-ui','sans-serif'] } } } }
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>body{font-family:'Inter',system-ui,sans-serif}</style>
</head>
<body class="bg-ink-50 min-h-screen">
  <header class="bg-ink-900 text-white">
    <div class="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
      <a href="${esc(opts.pageUrl)}" class="inline-flex items-center gap-2 font-black text-lg">
        <span class="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">⚒</span>
        fachschmiede<span class="text-brand-500">.de</span>
      </a>
      <a href="${esc(opts.pageUrl)}" class="text-sm text-ink-300 hover:text-white transition">← Zurück zu ${esc(opts.tradeName)} ${esc(opts.cityName)}</a>
    </div>
  </header>
  <main class="max-w-3xl mx-auto px-5 py-10">
    <h1 class="text-3xl font-black text-ink-900">${esc(opts.title)}</h1>
    <p class="text-sm text-ink-500 mt-1 mb-8">${esc(opts.tradeName)} · ${esc(opts.cityName)}</p>
    ${opts.bodyHtml}
    <div class="mt-12 pt-6 border-t border-ink-200 text-center text-xs text-ink-400">
      <a href="${esc(opts.pageUrl)}" class="text-brand-600 font-bold hover:underline">${esc(opts.tradeName)} ${esc(opts.cityName)}</a>
      · <a href="https://www.fachschmiede.de/" class="hover:underline">fachschmiede.de</a>
      · hallo@fachschmiede.de
    </div>
  </main>
</body>
</html>`
}
