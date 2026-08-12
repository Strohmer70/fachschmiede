'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface TenantData {
  tenant: {
    id: string
    company_name: string
    email: string
    phone?: string
    address?: string
    contact_name?: string
    logo_url?: string
    subscription_status?: string
  }
  landing_pages: any[]
  customization: any
  leads: any[]
  reviews: any[]
}

const DEFAULT_CUSTOMIZATION = {
  custom_company_name: '',
  custom_phone: '',
  custom_email: '',
  custom_address: '',
  custom_welcome_text: '',
  opening_hours: '',
  about_text: '',
  service_areas: [],
  whatsapp_number: '',
  whatsapp_enabled: false,
  google_maps_place_id: '',
  google_maps_enabled: false,
  founding_year: '',
  show_founding_year: false,
  project_count: '',
  show_project_count: false,
  team_size: '',
  show_team_size: false,
  is_master_company: false,
  is_guild_member: false,
  guild_name: '',
  accent_color: '#ea580c',
  hero_image_url: '',
  team_photo_url: '',
  reference_photos: [],
  services_enabled: {},
  modules_enabled: {},
  rechtsform: '',
  vertretung: '',
  ust_id: '',
  hwk_name: '',
  hwk_number: '',
  berufsbezeichnung: '',
  verantwortlicher: '',
  eu_streitschlichtung: true,
  datenschutz_beauftragter: '',
}

const ACCENT_COLORS = [
  { hex: '#ea580c', name: 'Orange' },
  { hex: '#2563eb', name: 'Blau' },
  { hex: '#059669', name: 'Grün' },
  { hex: '#dc2626', name: 'Rot' },
  { hex: '#7c3aed', name: 'Violett' },
  { hex: '#0f172a', name: 'Anthrazit' },
]

const TABS = [
  { id: 'profil', label: '🏢 Firmenprofil' },
  { id: 'module', label: '🧩 Leistungen' },
  { id: 'design', label: '🎨 Design' },
  { id: 'bewertungen', label: '⭐ Bewertungen' },
  { id: 'leads', label: '📥 Anfragen' },
  { id: 'rechtliches', label: '⚖️ Rechtliches' },
]

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [data, setData] = useState<TenantData | null>(null)
  const [activeTab, setActiveTab] = useState('profil')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [formData, setFormData] = useState<any>(DEFAULT_CUSTOMIZATION)
  const [selectedPage, setSelectedPage] = useState<string>('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch('/api/tenant-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      const result = await res.json()
      if (result.success) {
        setData(result)
        setIsLoggedIn(true)
        // Merge customization with defaults
        setFormData({ ...DEFAULT_CUSTOMIZATION, ...(result.customization || {}) })
        if (result.landing_pages?.length > 0) {
          setSelectedPage(result.landing_pages[0].id)
        }
        showToast('✅ Login erfolgreich!')
      } else {
        showToast('❌ ' + (result.error || 'Login fehlgeschlagen'))
      }
    } catch (err) {
      showToast('❌ Netzwerkfehler')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!data?.tenant?.id || !selectedPage) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/update-customization?tenant=${data.tenant.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id: selectedPage,
          ...formData,
          service_areas: Array.isArray(formData.service_areas) ? formData.service_areas : formData.service_areas?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
        })
      })
      const result = await res.json()
      if (result.success) {
        showToast('✅ Änderungen gespeichert!')
      } else {
        showToast('❌ Fehler: ' + (result.error || 'Speichern fehlgeschlagen'))
      }
    } catch (err) {
      showToast('❌ Netzwerkfehler beim Speichern')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleToggle = (field: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: !prev[field] }))
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <span className="inline-flex w-14 h-14 rounded-2xl bg-orange-600 items-center justify-center text-white font-black text-2xl shadow-lg">M</span>
            <p className="mt-3 font-extrabold text-white text-xl">fachschmiede.de</p>
            <p className="text-slate-400 text-sm">Mieter-Dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="bg-white rounded-2xl p-8 shadow-2xl space-y-4">
            <h1 className="text-xl font-black text-slate-900">🔒 Mieter-Login</h1>
            <p className="text-sm text-slate-500">Dein Dashboard ist passwortgeschützt.</p>
            <input
              type="email"
              placeholder="E-Mail-Adresse"
              required
              value={loginForm.email}
              onChange={e => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="password"
              placeholder="Passwort"
              required
              minLength={4}
              value={loginForm.password}
              onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition"
            >
              {isLoading ? 'Lade...' : 'Anmelden'}
            </button>
          </form>
        </div>
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-xl z-50">
            {toast}
          </div>
        )}
      </div>
    )
  }

  const tenant = data?.tenant
  const pages = data?.landing_pages || []
  const currentPage = pages.find(p => p.id === selectedPage)
  const leads = data?.leads || []
  const reviews = data?.reviews || []
  const monthlyCost = pages.reduce((sum, p) => sum + (p.monthly_price || 18900), 0)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-8 9 8M5 10v10h14V10"/></svg>
            </span>
            <div>
              <p className="font-extrabold text-slate-900">{tenant?.company_name || 'Mein Betrieb'}</p>
              <p className="text-xs text-slate-500">{pages.length} Seite{pages.length !== 1 ? 'n' : ''} · {currentPage?.trade?.name} {currentPage?.city?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pages.length > 1 && (
              <select
                value={selectedPage}
                onChange={e => setSelectedPage(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2"
              >
                {pages.map(p => (
                  <option key={p.id} value={p.id}>{p.trade?.name} {p.city?.name}</option>
                ))}
              </select>
            )}
            <Link href={currentPage ? `/${currentPage.trade?.slug}/${currentPage.city?.slug}` : '/'} target="_blank" className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold px-4 py-2 rounded-lg transition">
              👁 Website ansehen
            </Link>
            <button onClick={handleSave} disabled={isLoading} className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition">
              {isLoading ? 'Speichert...' : '💾 Speichern'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase">Gemietete Seiten</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{pages.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase">Neue Anfragen</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{leads.filter(l => l.status === 'new').length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase">Monatliche Kosten</p>
            <p className="text-2xl font-black text-slate-900 mt-1">€{(monthlyCost / 100).toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase">Status</p>
            <p className="text-sm font-bold text-green-600 mt-1 bg-green-50 inline-block px-2 py-1 rounded-full">✓ Aktiv</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-slate-200 text-sm font-bold text-slate-500">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-4 whitespace-nowrap border-b-2 transition ${activeTab === tab.id ? 'border-orange-600 text-slate-900' : 'border-transparent hover:text-slate-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 sm:p-8">
            {/* TAB: Firmenprofil */}
            {activeTab === 'profil' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Firmenprofil</h2>
                  <p className="text-sm text-slate-500">Diese Angaben erscheinen auf Ihrer Website.</p>
                </div>
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-1">Firmenname</label>
                      <input type="text" value={formData.custom_company_name || ''} onChange={e => handleChange('custom_company_name', e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">Telefon</label>
                        <input type="text" value={formData.custom_phone || ''} onChange={e => handleChange('custom_phone', e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">E-Mail</label>
                        <input type="email" value={formData.custom_email || ''} onChange={e => handleChange('custom_email', e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-1">Adresse</label>
                      <input type="text" value={formData.custom_address || ''} onChange={e => handleChange('custom_address', e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-1">Öffnungszeiten</label>
                      <textarea rows={2} value={formData.opening_hours || ''} onChange={e => handleChange('opening_hours', e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-1">„Über uns"-Text</label>
                      <textarea rows={4} value={formData.about_text || ''} onChange={e => handleChange('about_text', e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-1">Einsatzgebiete (Komma-getrennt)</label>
                      <textarea rows={2} value={Array.isArray(formData.service_areas) ? formData.service_areas.join(', ') : formData.service_areas || ''} onChange={e => handleChange('service_areas', e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    {/* WhatsApp */}
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-slate-900">💬 WhatsApp-Nummer</p>
                          <p className="text-xs text-slate-500">Schwebender WhatsApp-Button auf der Website</p>
                        </div>
                        <button onClick={() => handleToggle('whatsapp_enabled')} className={`w-11 h-6 rounded-full relative transition ${formData.whatsapp_enabled ? 'bg-orange-600' : 'bg-slate-300'}`}>
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${formData.whatsapp_enabled ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>
                      {formData.whatsapp_enabled && (
                        <input type="text" placeholder="+49 151 23456789" value={formData.whatsapp_number || ''} onChange={e => handleChange('whatsapp_number', e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                      )}
                    </div>
                    {/* Google Maps */}
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-slate-900">📍 Google Maps</p>
                          <p className="text-xs text-slate-500">Karte im Kontaktbereich</p>
                        </div>
                        <button onClick={() => handleToggle('google_maps_enabled')} className={`w-11 h-6 rounded-full relative transition ${formData.google_maps_enabled ? 'bg-orange-600' : 'bg-slate-300'}`}>
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${formData.google_maps_enabled ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>
                      {formData.google_maps_enabled && (
                        <input type="text" placeholder="Google Place ID" value={formData.google_maps_place_id || ''} onChange={e => handleChange('google_maps_place_id', e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500" />
                      )}
                    </div>
                  </div>

                  {/* Experience & Qualifications */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
                    <h3 className="font-bold text-slate-900">Erfahrung & Qualifikationen</h3>
                    <p className="text-xs text-slate-500">Optional – wird nur angezeigt wenn aktiviert.</p>
                    
                    {[
                      { key: 'show_founding_year', label: 'Gründungsjahr', sub: 'z.B. „Seit 2015 für Sie da"', input: 'founding_year', placeholder: '2015', type: 'number' },
                      { key: 'show_project_count', label: 'Anzahl Projekte', sub: 'z.B. „Über 300 Projekte"', input: 'project_count', placeholder: '300+' },
                      { key: 'show_team_size', label: 'Teamgröße', sub: 'z.B. „5 Mitarbeiter"', input: 'team_size', placeholder: '5' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
                        <div>
                          <p className="font-bold text-sm text-slate-900">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.sub}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <input type={item.type || 'text'} placeholder={item.placeholder} value={formData[item.input] || ''} onChange={e => handleChange(item.input, e.target.value)} className="w-20 text-sm rounded-lg border border-slate-200 px-3 py-2 text-center" />
                          <button onClick={() => handleToggle(item.key)} className={`w-11 h-6 rounded-full relative transition ${formData[item.key] ? 'bg-orange-600' : 'bg-slate-300'}`}>
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${formData[item.key] ? 'left-6' : 'left-1'}`} />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
                      <div><p className="font-bold text-sm text-slate-900">Meisterbetrieb</p><p className="text-xs text-slate-500">Badge auf der Website</p></div>
                      <button onClick={() => handleToggle('is_master_company')} className={`w-11 h-6 rounded-full relative transition ${formData.is_master_company ? 'bg-orange-600' : 'bg-slate-300'}`}>
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${formData.is_master_company ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
                      <div><p className="font-bold text-sm text-slate-900">Innungsmitgliedschaft</p></div>
                      <div className="flex items-center gap-3">
                        <input type="text" placeholder="Innung..." value={formData.guild_name || ''} onChange={e => handleChange('guild_name', e.target.value)} className="w-32 text-sm rounded-lg border border-slate-200 px-3 py-2" />
                        <button onClick={() => handleToggle('is_guild_member')} className={`w-11 h-6 rounded-full relative transition ${formData.is_guild_member ? 'bg-orange-600' : 'bg-slate-300'}`}>
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${formData.is_guild_member ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Leistungen & Module */}
            {activeTab === 'module' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Leistungen & Module</h2>
                  <p className="text-sm text-slate-500">Schalten Sie Bausteine Ihrer Website ein oder aus.</p>
                </div>
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-4">Leistungskarten</h3>
                    <div className="space-y-3">
                      {(currentPage?.trade?.services || ['Dachreparatur', 'Dachsanierung', 'Dachneubau', 'Dachisolierung', 'Dachrinnen', 'Sturmschadenbeseitigung']).map((service: string) => (
                        <div key={service} className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
                          <span className="font-semibold text-sm text-slate-800">{service}</span>
                          <button onClick={() => handleChange('services_enabled', { ...formData.services_enabled, [service]: !formData.services_enabled?.[service] })} className={`w-11 h-6 rounded-full relative transition ${formData.services_enabled?.[service] !== false ? 'bg-orange-600' : 'bg-slate-300'}`}>
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${formData.services_enabled?.[service] !== false ? 'left-6' : 'left-1'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-4">Seiten-Module</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'emergency', label: '⚡ Notdienst-Modul', desc: 'Banner für Sturmschaden etc.' },
                        { key: 'reviews', label: '⭐ Bewertungen', desc: 'Kundenstimmen-Sektion' },
                        { key: 'blog', label: '📝 Blog / Ratgeber', desc: 'Automatisch gepflegte Artikel' },
                        { key: 'faq', label: '❓ FAQ-Bereich', desc: 'Rich Snippets für Google' },
                        { key: 'stats', label: '📊 Kennzahlen-Leiste', desc: 'Erfahrung & Qualifikationen' },
                      ].map(mod => (
                        <div key={mod.key} className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
                          <div>
                            <p className="font-semibold text-sm text-slate-800">{mod.label}</p>
                            <p className="text-xs text-slate-500">{mod.desc}</p>
                          </div>
                          <button onClick={() => handleChange('modules_enabled', { ...formData.modules_enabled, [mod.key]: !formData.modules_enabled?.[mod.key] })} className={`w-11 h-6 rounded-full relative transition ${formData.modules_enabled?.[mod.key] !== false ? 'bg-orange-600' : 'bg-slate-300'}`}>
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${formData.modules_enabled?.[mod.key] !== false ? 'left-6' : 'left-1'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Design & Bilder */}
            {activeTab === 'design' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Design & Bilder</h2>
                  <p className="text-sm text-slate-500">Passen Sie Farben und Bildmaterial an.</p>
                </div>
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-4">Akzentfarbe</h3>
                    <div className="flex flex-wrap gap-3">
                      {ACCENT_COLORS.map(c => (
                        <button
                          key={c.hex}
                          onClick={() => handleChange('accent_color', c.hex)}
                          title={c.name}
                          className={`w-12 h-12 rounded-xl border-2 transition ${formData.accent_color === c.hex ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-105'}`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                    <div className="mt-6">
                      <h3 className="font-bold text-slate-900 mb-4">Logo</h3>
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-orange-400 transition cursor-pointer">
                        <p className="text-2xl">⬆️</p>
                        <p className="mt-2 font-bold text-slate-700 text-sm">Logo hochladen</p>
                        <p className="text-xs text-slate-400">PNG oder SVG</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-4">Bildmaterial</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'hero_image_url', label: '🖼 Hero-Bild', desc: 'Startseite oben' },
                        { key: 'team_photo_url', label: '👥 Team- / Inhaberfoto', desc: 'Über-uns-Bereich' },
                      ].map(img => (
                        <div key={img.key} className="bg-white rounded-xl border border-slate-200 p-4">
                          <p className="font-bold text-sm text-slate-900">{img.label}</p>
                          <p className="text-xs text-slate-500">{img.desc}</p>
                          <input type="text" placeholder="Bild-URL" value={formData[img.key] || ''} onChange={e => handleChange(img.key, e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Bewertungen */}
            {activeTab === 'bewertungen' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Bewertungen</h2>
                  <p className="text-sm text-slate-500">Echte Kundenstimmen sind das stärkste Verkaufsargument.</p>
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900">Neue Bewertung einreichen</h3>
                    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                      <input type="text" placeholder="Name des Kunden" className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm" />
                      <input type="text" placeholder="Projekt (z.B. Dachsanierung)" className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm" />
                      <textarea rows={3} placeholder="Zitat des Kunden..." className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm" />
                      <button onClick={() => showToast('Bewertung zur Prüfung eingereicht (Demo)')} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm py-3 rounded-lg transition">
                        Zur Prüfung einreichen
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-4">Ihre Bewertungen</h3>
                    {reviews.length === 0 ? (
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center text-slate-400">
                        <p>Noch keine Bewertungen vorhanden.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reviews.map((review: any) => (
                          <div key={review.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="font-bold text-slate-900">{review.customer_name} · {review.project_type}</p>
                              <p className="text-xs text-slate-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${review.status === 'approved' ? 'bg-green-100 text-green-700' : review.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                              {review.status === 'approved' ? 'Online' : review.status === 'pending' ? 'In Prüfung' : 'Abgelehnt'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Anfragen */}
            {activeTab === 'leads' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Kunden-Anfragen</h2>
                  <p className="text-sm text-slate-500">Alle Kontaktformular-Anfragen Ihrer Website.</p>
                </div>
                <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-100">
                        <th className="px-5 py-3 font-bold">Datum</th>
                        <th className="px-5 py-3 font-bold">Name</th>
                        <th className="px-5 py-3 font-bold">Anliegen</th>
                        <th className="px-5 py-3 font-bold">Kontakt</th>
                        <th className="px-5 py-3 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leads.length === 0 ? (
                        <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Noch keine Anfragen</td></tr>
                      ) : (
                        leads.map((lead: any) => (
                          <tr key={lead.id} className="hover:bg-slate-50">
                            <td className="px-5 py-4 text-slate-500">{new Date(lead.created_at).toLocaleDateString('de-DE')}</td>
                            <td className="px-5 py-4 font-bold text-slate-900">{lead.name}</td>
                            <td className="px-5 py-4 text-slate-600">{lead.message?.substring(0, 50)}...</td>
                            <td className="px-5 py-4 text-slate-600">{lead.phone || lead.email}</td>
                            <td className="px-5 py-4">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                lead.status === 'new' ? 'bg-red-100 text-red-700' :
                                lead.status === 'contacted' ? 'bg-amber-100 text-amber-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {lead.status === 'new' ? 'Neu' : lead.status === 'contacted' ? 'Kontaktiert' : 'Beantwortet'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: Rechtliches */}
            {activeTab === 'rechtliches' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Impressum & Datenschutz</h2>
                    <p className="text-sm text-slate-500">Pflichtangaben für Ihre Website.</p>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">✓ Vollständig</span>
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-black text-slate-900">📄 Impressum</h3>
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-1">Firmenname (vollständig) *</label>
                      <input type="text" value={formData.custom_company_name || ''} onChange={e => handleChange('custom_company_name', e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">Rechtsform *</label>
                        <select value={formData.rechtsform || ''} onChange={e => handleChange('rechtsform', e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm bg-white">
                          <option value="">Bitte wählen</option>
                          <option>Einzelunternehmen</option>
                          <option>GbR</option>
                          <option>OHG</option>
                          <option>KG</option>
                          <option>GmbH</option>
                          <option>UG (haftungsbeschränkt)</option>
                          <option>AG</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">Vertretungsberechtigt *</label>
                        <input type="text" value={formData.vertretung || ''} onChange={e => handleChange('vertretung', e.target.value)} placeholder="Inhaber / GF" className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-1">Anschrift (ladungsfähig) *</label>
                      <input type="text" value={formData.custom_address || ''} onChange={e => handleChange('custom_address', e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">Telefon *</label>
                        <input type="text" value={formData.custom_phone || ''} onChange={e => handleChange('custom_phone', e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">E-Mail *</label>
                        <input type="email" value={formData.custom_email || ''} onChange={e => handleChange('custom_email', e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-1">USt-ID</label>
                      <input type="text" value={formData.ust_id || ''} onChange={e => handleChange('ust_id', e.target.value)} placeholder="DE ..." className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">Handwerkskammer *</label>
                        <input type="text" value={formData.hwk_name || ''} onChange={e => handleChange('hwk_name', e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">Handwerksrolle-Nr. *</label>
                        <input type="text" value={formData.hwk_number || ''} onChange={e => handleChange('hwk_number', e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-1">Berufsbezeichnung *</label>
                      <input type="text" value={formData.berufsbezeichnung || ''} onChange={e => handleChange('berufsbezeichnung', e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-1">Verantwortlich i.S.d. § 18 Abs. 2 MStV *</label>
                      <input type="text" value={formData.verantwortlicher || ''} onChange={e => handleChange('verantwortlicher', e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-black text-slate-900">🔒 Datenschutz</h3>
                    <div>
                      <label className="block text-sm font-bold text-slate-800 mb-1">Datenschutzbeauftragter</label>
                      <input type="text" value={formData.datenschutz_beauftragter || ''} onChange={e => handleChange('datenschutz_beauftragter', e.target.value)} placeholder="Nur falls bestellt" className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="font-bold text-sm text-slate-900">✓ Immer enthalten</p>
                      <ul className="mt-2 text-xs text-slate-600 space-y-1 list-disc list-inside">
                        <li>Hosting & Server-Logfiles (Art. 6 Abs. 1 lit. f DSGVO)</li>
                        <li>SSL-/TLS-Verschlüsselung</li>
                        <li>Betroffenenrechte, Widerruf & Beschwerderecht</li>
                        <li>„Kein Tracking, keine Analyse-Cookies"</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-xl z-50 animate-bounce">
          {toast}
        </div>
      )}
    </div>
  )
}
