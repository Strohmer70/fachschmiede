import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function AdminDashboard() {
  // Get all landing pages
  const { data: pages } = await supabase
    .from('landing_pages')
    .select(`
      *,
      trade:trades(name),
      city:cities(name),
      tenant:tenants(company_name, email, subscription_status)
    `)
    .order('status', { ascending: false })

  // Get all tenants
  const { data: tenants } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  // Get all leads
  const { data: leads } = await supabase
    .from('leads')
    .select(`
      *,
      landing_page:landing_pages(slug, trade:trades(name), city:cities(name))
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  const allPages = pages || []
  const allTenants = tenants || []
  const allLeads = leads || []

  const rentedPages = allPages.filter(p => p.status === 'rented')
  const availablePages = allPages.filter(p => p.status === 'available')
  const monthlyRevenue = rentedPages.reduce((sum, p) => sum + (p.monthly_price || 0), 0)
  const yearlyRevenue = monthlyRevenue * 12

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold">fachschmiede.de</Link>
            <span className="text-slate-400">|</span>
            <span>Admin</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-6">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-500">Gesamtseiten</p>
            <p className="text-3xl font-bold">{allPages.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-500">Vermietet</p>
            <p className="text-3xl font-bold text-green-600">{rentedPages.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-500">Verfügbar</p>
            <p className="text-3xl font-bold text-blue-600">{availablePages.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-500">MRR</p>
            <p className="text-3xl font-bold text-orange-600">€{(monthlyRevenue / 100).toFixed(0)}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-500">Jährlicher Umsatz (ARR)</p>
            <p className="text-4xl font-bold">€{(yearlyRevenue / 100).toFixed(0)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-500">Gesamtanfragen</p>
            <p className="text-4xl font-bold">{allLeads.length}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Pages List */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">Landing Pages</h2>
              <span className="text-sm text-slate-400">{allPages.length} total</span>
            </div>
            <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
              {allPages.map((page: any) => (
                <div key={page.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {page.trade?.name} {page.city?.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      /{page.slug}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        page.status === 'rented' ? 'bg-green-50 text-green-700' :
                        page.status === 'available' ? 'bg-blue-50 text-blue-700' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {page.status === 'rented' ? 'Vermietet' : 
                         page.status === 'available' ? 'Verfügbar' : 'Reserviert'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {page.page_views || 0} Views
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {page.tenant?.company_name && (
                      <p className="text-sm font-medium">{page.tenant.company_name}</p>
                    )}
                    <p className="text-sm font-bold">
                      €{(page.monthly_price / 100).toFixed(0)}/Monat
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tenants List */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">Mieter</h2>
              <span className="text-sm text-slate-400">{allTenants.length} total</span>
            </div>
            <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
              {allTenants.map((t: any) => (
                <div key={t.id} className="p-4">
                  <p className="font-medium">{t.company_name}</p>
                  <p className="text-sm text-slate-500">{t.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      t.subscription_status === 'active' ? 'bg-green-50 text-green-700' :
                      t.subscription_status === 'cancelled' ? 'bg-red-50 text-red-700' :
                      'bg-slate-50 text-slate-700'
                    }`}>
                      {t.subscription_status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(t.created_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-8">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold">Kundenanfragen</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-sm font-medium text-slate-500">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Seite</th>
                  <th className="px-6 py-3">Kontakt</th>
                  <th className="px-6 py-3">Nachricht</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Datum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {allLeads.map((lead: any) => (
                  <tr key={lead.id} className="text-sm">
                    <td className="px-6 py-4 font-medium">{lead.name}</td>
                    <td className="px-6 py-4">
                      {lead.landing_page?.trade?.name} {lead.landing_page?.city?.name}
                    </td>
                    <td className="px-6 py-4">
                      {lead.phone && <p>📞 {lead.phone}</p>}
                      {lead.email && <p>✉️ {lead.email}</p>}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">{lead.message || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        lead.status === 'new' ? 'bg-yellow-50 text-yellow-700' :
                        lead.status === 'contacted' ? 'bg-blue-50 text-blue-700' :
                        lead.status === 'won' ? 'bg-green-50 text-green-700' :
                        'bg-slate-50 text-slate-700'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(lead.created_at).toLocaleDateString('de-DE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
