'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Stats {
  total: number; rented: number; available: number; leads: number
  tenants: number; mrr: number; arr: number
}

interface Lead {
  id: string; name: string; email: string; phone: string | null
  message: string; status: string; created_at: string
  landing_page: { slug: string; title: string } | null
}

interface Page {
  id: string; slug: string; title: string; status: string
  monthly_price: number; created_at: string
  trade: { name: string } | null; city: { name: string } | null
  page_customizations: any[]
}

interface Tenant {
  id: string; company_name: string; email: string; phone: string
  created_at: string; landing_page: { slug: string } | null
}

interface Article {
  id: string; title: string; slug: string; status: string
  excerpt: string; meta_description: string; word_count: number
  created_at: string; published_at: string | null
  ai_generated: boolean; featured_image: string | null
  landing_page: { 
    slug: string; 
    trade: { name: string } | null; 
    city: { name: string } | null 
  } | null
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState<Stats | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [pages, setPages] = useState<Page[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Blog state
  const [blogFilter, setBlogFilter] = useState('all')
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState('')
  const [selectedPageForArticle, setSelectedPageForArticle] = useState('')
  const [articleTitle, setArticleTitle] = useState('')

  // Marketing state
  const [seoKeyword, setSeoKeyword] = useState('')
  const [marketingMessage, setMarketingMessage] = useState('')

  useEffect(() => { if (isLoggedIn) loadData() }, [isLoggedIn])
  useEffect(() => { if (isLoggedIn && activeTab === 'blog') loadArticles() }, [activeTab, isLoggedIn])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      if (data.error) setError(data.message || 'Fehler')
      else {
        setStats(data.stats)
        setLeads(data.recentLeads || [])
        setPages(data.pages || [])
        setTenants(data.tenants || [])
      }
    } catch (err: any) { setError(err.message) }
    setLoading(false)
  }

  async function loadArticles() {
    setLoading(true)
    try {
      const res = await fetch(`/api/articles?status=${blogFilter === 'all' ? 'all' : blogFilter}&limit=100`)
      const data = await res.json()
      if (data.error) setError(data.message || 'Fehler beim Laden der Artikel')
      else setArticles(data.articles || [])
    } catch (err: any) { setError(err.message) }
    setLoading(false)
  }

  async function generateArticle() {
    if (!selectedPageForArticle) {
      setError('Bitte wählen Sie eine Seite aus')
      return
    }
    
    setGenerating(true)
    setGenerateResult('')
    setError('')
    
    try {
      const res = await fetch('/api/articles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landing_page_id: selectedPageForArticle,
          custom_title: articleTitle || undefined
        })
      })
      
      const data = await res.json()
      
      if (data.error) {
        setError(data.message || 'Generierung fehlgeschlagen')
      } else {
        setGenerateResult(`✅ Artikel generiert: "${data.article.title}" (${data.wordCount} Wörter)`)
        loadArticles()
        setArticleTitle('')
      }
    } catch (err: any) {
      setError(err.message)
    }
    
    setGenerating(false)
  }

  async function runScheduledGeneration() {
    setGenerating(true)
    setGenerateResult('')
    setError('')
    
    try {
      const res = await fetch('/api/articles/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      const data = await res.json()
      
      if (data.error) {
        setError(data.message || 'Scheduling fehlgeschlagen')
      } else {
        const successCount = data.results?.filter((r: any) => r.status === 'generated').length || 0
        setGenerateResult(`✅ ${successCount} von ${data.total_pages} Artikeln generiert`)
        loadArticles()
      }
    } catch (err: any) {
      setError(err.message)
    }
    
    setGenerating(false)
  }

  async function updateArticleStatus(articleId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (res.ok) {
        loadArticles()
      } else {
        const data = await res.json()
        setError(data.message || 'Update fehlgeschlagen')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function deleteArticle(articleId: string) {
    if (!confirm('Artikel wirklich löschen?')) return
    
    try {
      const res = await fetch(`/api/articles/${articleId}`, { method: 'DELETE' })
      
      if (res.ok) {
        loadArticles()
      } else {
        const data = await res.json()
        setError(data.message || 'Löschen fehlgeschlagen')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (password === 'admin123') setIsLoggedIn(true)
    else setError('Falsches Passwort')
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <span className="inline-flex w-14 h-14 rounded-2xl bg-orange-600 items-center justify-center text-white font-black text-2xl">F</span>
            <p className="mt-3 font-extrabold text-white text-xl">fachschmiede.de</p>
          </div>
          <form onSubmit={handleLogin} className="bg-white rounded-2xl p-8 shadow-2xl">
            <h1 className="text-xl font-black text-slate-900">Admin-Login</h1>
            <div className="mt-5 space-y-3">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Passwort" />
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <button type="submit" className="mt-4 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition">Anmelden</button>
            <p className="mt-3 text-xs text-slate-400">Demo: Passwort = admin123</p>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 shrink-0">
        <div className="p-6 border-b border-slate-800">
          <p className="font-extrabold text-white">fachschmiede.de</p>
          <p className="text-xs text-slate-400">Admin-Bereich</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 text-sm font-semibold">
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'websites', label: '🌐 Websites' },
            { id: 'blog', label: '📝 Blog' },
            { id: 'leads', label: '📥 Leads' },
            { id: 'tenants', label: '👤 Mieter' },
            { id: 'invoices', label: '📄 Rechnungen' },
            { id: 'marketing', label: '📢 Marketing' },
            { id: 'settings', label: '⚙️ Einstellungen' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-left ${
                activeTab === tab.id ? 'bg-orange-600 text-white' : 'hover:bg-slate-800'
              }`}>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={() => location.reload()} className="text-sm text-slate-400 hover:text-white">🔒 Abmelden</button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-300 flex justify-around p-2 z-50 text-xs">
        {['dashboard','websites','blog','leads','tenants','invoices','marketing'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`p-2 rounded ${activeTab === t ? 'bg-orange-600 text-white' : ''}`}>
            {t === 'dashboard' && '📊'}
            {t === 'websites' && '🌐'}
            {t === 'blog' && '📝'}
            {t === 'leads' && '📥'}
            {t === 'tenants' && '👤'}
            {t === 'invoices' && '📄'}
            {t === 'marketing' && '📢'}
          </button>
        ))}
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-black text-slate-900">
            {activeTab === 'dashboard' && 'Dashboard'}
            {activeTab === 'websites' && 'Websites'}
            {activeTab === 'blog' && 'Blog-Verwaltung'}
            {activeTab === 'leads' && 'Leads'}
            {activeTab === 'tenants' && 'Mieter'}
            {activeTab === 'invoices' && 'Rechnungen'}
            {activeTab === 'marketing' && 'Marketing'}
            {activeTab === 'settings' && 'Einstellungen'}
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="text-sm text-orange-600 font-bold hover:text-orange-700">
              🔄 Aktualisieren
            </button>
            {loading && <span className="text-sm text-slate-400">Lade...</span>}
          </div>
        </div>

        <div className="p-6 max-w-7xl">
          {error && <p className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">{error}</p>}
          {generateResult && <p className="mb-4 p-4 bg-green-50 text-green-600 rounded-lg">{generateResult}</p>}

          {/* ═════ DASHBOARD ═════ */}
          {activeTab === 'dashboard' && stats && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Websites gesamt" value={stats.total} color="text-blue-600" />
                <StatCard label="Vermietet" value={stats.rented} color="text-green-600" />
                <StatCard label="Verfügbar" value={stats.available} color="text-orange-600" />
                <StatCard label="Leads (30 Tage)" value={stats.leads} color="text-purple-600" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard label="Mieter" value={stats.tenants} color="text-slate-700" />
                <StatCard label="MRR" value={`€${stats.mrr}`} color="text-emerald-600" />
                <StatCard label="ARR" value={`€${stats.arr}`} color="text-teal-600" />
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-sm text-slate-500">Konversionsrate</p>
                  <p className="text-2xl font-black text-slate-900">
                    {stats.leads > 0 && stats.total > 0 ? ((stats.leads / stats.total) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="font-bold mb-4">Miet-Umsatz</h2>
                {stats.mrr > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-bold text-green-800">Monatlich wiederkehrend (MRR)</span>
                      <span className="text-2xl font-black text-green-600">€{stats.mrr}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-bold text-blue-800">Jährlich (ARR)</span>
                      <span className="text-2xl font-black text-blue-600">€{stats.arr}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    Noch keine Einnahmen — Sobald Mieter vorhanden sind, wird hier der Umsatz angezeigt.
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═════ BLOG ═════ */}
          {activeTab === 'blog' && (
            <div className="space-y-6">
              {/* Generate Article Section */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="font-bold mb-4">🤖 Artikel generieren</h2>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Seite auswählen</label>
                    <select 
                      value={selectedPageForArticle}
                      onChange={(e) => setSelectedPageForArticle(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    >
                      <option value="">-- Seite wählen --</option>
                      {pages.map(page => (
                        <option key={page.id} value={page.id}>
                          {page.trade?.name} {page.city?.name} ({page.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Titel (optional)</label>
                    <input 
                      type="text"
                      value={articleTitle}
                      onChange={(e) => setArticleTitle(e.target.value)}
                      placeholder="Leer lassen für automatischen Titel"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={generateArticle}
                    disabled={generating || !selectedPageForArticle}
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white font-bold px-6 py-3 rounded-xl transition"
                  >
                    {generating ? '⏳ Generiere...' : '📝 Einzelnen Artikel generieren'}
                  </button>
                  
                  <button 
                    onClick={runScheduledGeneration}
                    disabled={generating}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold px-6 py-3 rounded-xl transition"
                  >
                    {generating ? '⏳ Läuft...' : '🚀 Automatisches Scheduling (1-2-4)'}
                  </button>
                </div>
                
                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                  <p className="font-medium">📋 Automatisches Scheduling:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Freie Seiten: 1 Artikel/Monat</li>
                    <li>• Basis-Mieter: 2 Artikel/Monat</li>
                    <li>• Pro-Mieter: 4 Artikel/Monat</li>
                  </ul>
                </div>
              </div>

              {/* Articles List */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h2 className="font-bold">Artikel ({articles.length})</h2>
                  <div className="flex gap-2">
                    <select 
                      value={blogFilter}
                      onChange={(e) => { setBlogFilter(e.target.value); loadArticles(); }}
                      className="text-sm border border-slate-300 rounded-lg px-3 py-2"
                    >
                      <option value="all">Alle</option>
                      <option value="published">Veröffentlicht</option>
                      <option value="draft">Entwurf</option>
                      <option value="archived">Archiviert</option>
                    </select>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold">Titel</th>
                        <th className="px-6 py-3 text-left font-semibold">Seite</th>
                        <th className="px-6 py-3 text-left font-semibold">Status</th>
                        <th className="px-6 py-3 text-left font-semibold">Wörter</th>
                        <th className="px-6 py-3 text-left font-semibold">KI</th>
                        <th className="px-6 py-3 text-left font-semibold">Datum</th>
                        <th className="px-6 py-3 text-left font-semibold">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articles.map(article => (
                        <tr key={article.id} className="border-t border-slate-100">
                          <td className="px-6 py-3">
                            <p className="font-medium">{article.title}</p>
                            <p className="text-xs text-slate-400 truncate max-w-xs">{article.excerpt}</p>
                          </td>
                          <td className="px-6 py-3 text-slate-500">
                            {article.landing_page ? (
                              <span>{article.landing_page.trade?.name} {article.landing_page.city?.name}</span>
                            ) : '—'}
                          </td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                              article.status === 'published' ? 'bg-green-100 text-green-700' :
                              article.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {article.status === 'published' ? 'Live' : 
                               article.status === 'draft' ? 'Entwurf' : 'Archiviert'}
                            </span>
                          </td>
                          <td className="px-6 py-3">{article.word_count || 0}</td>
                          <td className="px-6 py-3">
                            {article.ai_generated ? (
                              <span className="text-purple-600">🤖</span>
                            ) : (
                              <span className="text-slate-400">✍️</span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-slate-500">
                            {new Date(article.created_at).toLocaleDateString('de-DE')}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex gap-2">
                              {article.status === 'draft' && (
                                <button 
                                  onClick={() => updateArticleStatus(article.id, 'published')}
                                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                                >
                                  Veröffentlichen
                                </button>
                              )}
                              {article.status === 'published' && (
                                <button 
                                  onClick={() => updateArticleStatus(article.id, 'draft')}
                                  className="text-xs bg-yellow-600 text-white px-2 py-1 rounded hover:bg-yellow-700"
                                >
                                  Zurückziehen
                                </button>
                              )}
                              <button 
                                onClick={() => deleteArticle(article.id)}
                                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                              >
                                Löschen
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {articles.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                            <div className="text-4xl mb-2">📝</div>
                            <p>Noch keine Artikel vorhanden</p>
                            <p className="text-sm mt-1">Generieren Sie Ihren ersten Artikel oben</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═════ WEBSITES ═════ */}
          {activeTab === 'websites' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="font-bold">Alle Websites</h2>
                <span className="text-sm text-slate-500">{pages.length} total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">Slug</th>
                      <th className="px-6 py-3 text-left font-semibold">Gewerk</th>
                      <th className="px-6 py-3 text-left font-semibold">Stadt</th>
                      <th className="px-6 py-3 text-left font-semibold">Status</th>
                      <th className="px-6 py-3 text-left font-semibold">Preis</th>
                      <th className="px-6 py-3 text-left font-semibold">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map(page => (
                      <tr key={page.id} className="border-t border-slate-100">
                        <td className="px-6 py-3 font-medium">{page.slug}</td>
                        <td className="px-6 py-3 text-slate-500">{page.trade?.name || '—'}</td>
                        <td className="px-6 py-3 text-slate-500">{page.city?.name || '—'}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                            page.status === 'rented' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {page.status === 'rented' ? 'Vermietet' : 'Verfügbar'}
                          </span>
                        </td>
                        <td className="px-6 py-3">€{(page.monthly_price / 100).toFixed(0)}/Mon</td>
                        <td className="px-6 py-3">
                          <a href={`https://fachschmiede.vercel.app/${page.slug}`} target="_blank" rel="noopener"
                            className="text-orange-600 hover:text-orange-700 font-bold text-xs">Öffnen ↗</a>
                        </td>
                      </tr>
                    ))}
                    {pages.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Noch keine Landing Pages</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═════ LEADS ═════ */}
          {activeTab === 'leads' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="font-bold">Anfragen (30 Tage)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">Name</th>
                      <th className="px-6 py-3 text-left font-semibold">E-Mail</th>
                      <th className="px-6 py-3 text-left font-semibold">Telefon</th>
                      <th className="px-6 py-3 text-left font-semibold">Seite</th>
                      <th className="px-6 py-3 text-left font-semibold">Nachricht</th>
                      <th className="px-6 py-3 text-left font-semibold">Datum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => (
                      <tr key={lead.id} className="border-t border-slate-100">
                        <td className="px-6 py-3 font-medium">{lead.name}</td>
                        <td className="px-6 py-3"><a href={`mailto:${lead.email}`} className="text-orange-600">{lead.email}</a></td>
                        <td className="px-6 py-3">{lead.phone || '—'}</td>
                        <td className="px-6 py-3 text-slate-500">{lead.landing_page?.slug || '—'}</td>
                        <td className="px-6 py-3 text-slate-600 max-w-xs truncate">{lead.message}</td>
                        <td className="px-6 py-3 text-slate-500">{new Date(lead.created_at).toLocaleDateString('de-DE')}</td>
                      </tr>
                    ))}
                    {leads.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Keine Anfragen</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═════ TENANTS ═════ */}
          {activeTab === 'tenants' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h2 className="font-bold">Mieter ({tenants.length})</h2>
                  <button className="bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-lg opacity-50 cursor-not-allowed" title="Coming soon">
                    + Mieter hinzufügen
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold">Firma</th>
                        <th className="px-6 py-3 text-left font-semibold">E-Mail</th>
                        <th className="px-6 py-3 text-left font-semibold">Telefon</th>
                        <th className="px-6 py-3 text-left font-semibold">Seite</th>
                        <th className="px-6 py-3 text-left font-semibold">Seit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenants.map(tenant => (
                        <tr key={tenant.id} className="border-t border-slate-100">
                          <td className="px-6 py-3 font-medium">{tenant.company_name}</td>
                          <td className="px-6 py-3">{tenant.email}</td>
                          <td className="px-6 py-3">{tenant.phone || '—'}</td>
                          <td className="px-6 py-3 text-slate-500">{tenant.landing_page?.slug || '—'}</td>
                          <td className="px-6 py-3 text-slate-500">{new Date(tenant.created_at).toLocaleDateString('de-DE')}</td>
                        </tr>
                      ))}
                      {tenants.length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Noch keine Mieter</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═════ RECHNUNGEN ═════ */}
          {activeTab === 'invoices' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="font-bold mb-4">Rechnungsübersicht</h2>
                {stats && stats.mrr > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <p className="text-2xl font-black text-green-600">€{stats.mrr}</p>
                        <p className="text-sm text-green-700">MRR</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <p className="text-2xl font-black text-blue-600">€{stats.arr}</p>
                        <p className="text-sm text-blue-700">ARR</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg text-center">
                        <p className="text-2xl font-black text-purple-600">{stats.tenants}</p>
                        <p className="text-sm text-purple-700">Aktive Mieter</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-lg mb-2">Noch keine Rechnungen</p>
                    <p className="text-sm">Rechnungen werden automatisch erstellt, sobald Mieter über Stripe zahlen.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════ MARKETING ═════ */}
          {activeTab === 'marketing' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="font-bold mb-4">SEO-Status</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-black text-blue-600">{pages.length}</p>
                    <p className="text-sm text-blue-700">Indexierte Seiten</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-black text-green-600">{pages.filter(p => p.status === 'rented').length}</p>
                    <p className="text-sm text-green-700">Vermietet</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg text-center">
                    <p className="text-2xl font-black text-orange-600">{pages.filter(p => p.status === 'available').length}</p>
                    <p className="text-sm text-orange-700">Noch verfügbar</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <p className="text-2xl font-black text-purple-600">{stats?.leads || 0}</p>
                    <p className="text-sm text-purple-700">Leads (30 Tage)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════ SETTINGS ═════ */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="font-bold mb-4">Plattform-Einstellungen</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-bold">Standard-Mietpreis</p>
                      <p className="text-sm text-slate-500">Monatliche Gebühr für Mieter</p>
                    </div>
                    <span className="font-bold text-slate-900">€149/Monat</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${color}`}>{value}</p>
    </div>
  )
}
