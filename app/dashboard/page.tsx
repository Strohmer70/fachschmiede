import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { redirect } from 'next/navigation'

interface DashboardProps {
  searchParams: { tenant?: string }
}

export default async function TenantDashboard({ searchParams }: DashboardProps) {
  const tenantId = searchParams.tenant

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold mb-4">Mieter-Dashboard</h1>
          <p className="text-slate-600 mb-6">Bitte loggen Sie sich ein.</p>
          {/* Simple login form for MVP */}
          <form action="/api/tenant-login" method="POST" className="max-w-sm mx-auto space-y-4">
            <input 
              type="email" 
              name="email"
              placeholder="E-Mail"
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg"
            />
            <input 
              type="password" 
              name="password"
              placeholder="Passwort"
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg"
            />
            <button 
              type="submit"
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition"
            >
              Einloggen
            </button>
          </form>
          <p className="text-sm text-slate-400 mt-4">
            Passwort vergessen? Kontaktieren Sie uns unter 
            <a href="mailto:hello@fachschmiede.de" className="text-orange-500">hello@fachschmiede.de</a>
          </p>
        </div>
      </div>
    )
  }

  // Get tenant data
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (!tenant) {
    redirect('/dashboard')
  }

  // Get rented pages with customizations
  const { data: pages } = await supabase
    .from('landing_pages')
    .select(`
      *,
      trade:trades(*),
      city:cities(*),
      page_customizations(*)
    `)
    .eq('rented_by', tenantId)

  // Get leads for this tenant
  const { data: leads } = await supabase
    .from('leads')
    .select(`
      *,
      landing_page:landing_pages(slug, trade:trades(name), city:cities(name))
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  const rentedPages = pages || []
  const tenantLeads = leads || []

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold">fachschmiede.de</Link>
            <span className="text-slate-400">|</span>
            <span>Mieter-Dashboard</span>
          </div>
          <div className="text-sm text-slate-400">
            {tenant.company_name}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto py-8 px-6">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-500">Gemietete Seiten</p>
            <p className="text-3xl font-bold">{rentedPages.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-500">Neue Anfragen</p>
            <p className="text-3xl font-bold">{tenantLeads.filter(l => l.status === 'new').length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-500">Monatliche Kosten</p>
            <p className="text-3xl font-bold">
              €{rentedPages.reduce((sum, p) => sum + (p.monthly_price / 100), 0).toFixed(0)}/Monat
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Pages Section */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold">Ihre Seiten</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {rentedPages.map((page: any) => {
                const customization = page.page_customizations?.[0]
                return (
                  <div key={page.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">
                          {page.trade?.name} {page.city?.name}
                        </h3>
                        <Link 
                          href={`/${page.trade?.slug}/${page.city?.slug}`}
                          className="text-sm text-orange-500 hover:text-orange-600"
                          target="_blank"
                        >
                          Seite ansehen →
                        </Link>
                      </div>
                      <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                        Aktiv
                      </span>
                    </div>

                    <form action={`/api/update-customization?tenant=${tenantId}`} method="POST" className="space-y-3">
                      <input type="hidden" name="page_id" value={page.id} />
                      
                      <div>
                        <label className="text-sm font-medium text-slate-700">Willkommenstext</label>
                        <textarea 
                          name="welcome_text"
                          defaultValue={customization?.custom_welcome_text || ''}
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          placeholder="Willkommen bei..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-slate-700">Telefon</label>
                          <input 
                            type="tel" 
                            name="phone"
                            defaultValue={customization?.custom_phone || ''}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700">E-Mail</label>
                          <input 
                            type="email" 
                            name="email"
                            defaultValue={customization?.custom_email || ''}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700">Adresse</label>
                        <input 
                          type="text" 
                          name="address"
                          defaultValue={customization?.custom_address || ''}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="bg-orange-500 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-orange-600 transition"
                      >
                        💾 Speichern
                      </button>
                    </form>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Leads Section */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold">Kunden-Anfragen</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {tenantLeads.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <div className="text-4xl mb-2">📭</div>
                  <p>Noch keine Anfragen</p>
                </div>
              ) : (
                tenantLeads.map((lead: any) => (
                  <div key={lead.id} className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{lead.name}</p>
                        <p className="text-sm text-slate-500">
                          {lead.landing_page?.trade?.name} {lead.landing_page?.city?.name}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        lead.status === 'new' ? 'bg-yellow-50 text-yellow-700' :
                        lead.status === 'contacted' ? 'bg-blue-50 text-blue-700' :
                        lead.status === 'won' ? 'bg-green-50 text-green-700' :
                        'bg-slate-50 text-slate-700'
                      }`}>
                        {lead.status === 'new' ? 'Neu' :
                         lead.status === 'contacted' ? 'Kontaktiert' :
                         lead.status === 'won' ? 'Gewonnen' : 'Verloren'}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      {lead.phone && <p>📞 {lead.phone}</p>}
                      {lead.email && <p>✉️ {lead.email}</p>}
                      {lead.message && <p className="text-slate-600 mt-2">{lead.message}</p>}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(lead.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
