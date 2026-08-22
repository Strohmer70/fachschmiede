'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PageData {
  id: string
  slug: string
  title: string
  status: string
  monthly_price: number
  trade: { name: string; slug: string }
  city: { name: string; slug: string }
}

const PRICE_BASIS = 18900
const PRICE_PRO = 28900

function getCorrectPrice(citySlug: string): number {
  return citySlug === 'muenchen' ? PRICE_PRO : PRICE_BASIS
}

export default function RentPageClient({ params }: { params: { slug: string } }) {
  const [page, setPage] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Checkout flow state
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedPlan, setSelectedPlan] = useState<'basis' | 'pro'>('basis')
  const [formData, setFormData] = useState({
    company: '',
    email: '',
    password: '',
  })
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/admin/pages?slug=${encodeURIComponent(params.slug)}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const found = data.pages?.[0]
        if (found) {
          setPage(found)
        } else {
          setError('Seite nicht gefunden')
        }
      } catch (err: any) {
        setError('Fehler beim Laden: ' + err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [params.slug])

  async function handleCheckout() {
    if (!page) return
    setCheckoutLoading(true)
    
    const correctPrice = selectedPlan === 'pro' 
      ? PRICE_PRO 
      : getCorrectPrice(page.city.slug)
    
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landing_page_id: page.id,
          slug: page.slug,
          price_cents: correctPrice,
          success_url: `${window.location.origin}/mieten/erfolg?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: window.location.href,
        }),
      })
      
      const data = await res.json()
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        setError('Checkout konnte nicht gestartet werden')
        setCheckoutLoading(false)
      }
    } catch (err: any) {
      setError('Fehler beim Checkout: ' + err.message)
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Seite wird geladen...</p>
        </div>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Fehler</h1>
          <p className="text-slate-600 mb-6">{error || 'Seite nicht gefunden'}</p>
          <Link href="/" className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition">
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    )
  }

  if (page.status !== 'available') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Bereits vermietet</h1>
          <p className="text-slate-600 mb-6">Diese Seite ist bereits an einen Handwerker vermietet.</p>
          <Link href="/" className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition">
            Andere Seiten ansehen
          </Link>
        </div>
      </div>
    )
  }

  const isMunich = page.city.slug === 'muenchen'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-black text-xl text-slate-900">
            fachschmiede.de
          </Link>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <span className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-slate-300'}`} />
            <span className={step >= 1 ? 'text-blue-600' : ''}>Konto & Miete</span>
            <span className="text-slate-300">→</span>
            <span className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-slate-300'}`} />
            <span className={step >= 2 ? 'text-blue-600' : ''}>Zahlung</span>
            <span className="text-slate-300">→</span>
            <span className={`w-2 h-2 rounded-full ${step >= 3 ? 'bg-blue-500' : 'bg-slate-300'}`} />
            <span className={step >= 3 ? 'text-blue-600' : ''}>Bestätigung</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* STEP 1: Konto & Miete */}
        {step === 1 && (
          <div>
            <div className="text-center mb-8">
              <span className="inline-block bg-blue-100 text-blue-700 text-sm font-bold px-4 py-2 rounded-full mb-4">
                Schritt 1 von 3
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
                Konto & Miete
              </h1>
              <p className="text-slate-600">
                {page.trade.name} {page.city.name} — Wählen Sie Ihren Tarif
              </p>
            </div>

            {/* Tarifwahl */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {/* Basis */}
              <div 
                onClick={() => setSelectedPlan('basis')}
                className={`cursor-pointer rounded-2xl border-2 p-6 transition ${
                  selectedPlan === 'basis' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-slate-900">Basis</h3>
                  {selectedPlan === 'basis' && (
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">✓</span>
                  )}
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-black text-slate-900">189€</span>
                  <span className="text-slate-500">/Monat</span>
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Komplette Website</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Eigenes Dashboard</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Kündbar monatlich</li>
                </ul>
              </div>

              {/* Pro */}
              <div 
                onClick={() => setSelectedPlan('pro')}
                className={`cursor-pointer rounded-2xl border-2 p-6 transition ${
                  selectedPlan === 'pro' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-slate-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-900">Pro</h3>
                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded">Bestseller</span>
                  </div>
                  {selectedPlan === 'pro' && (
                    <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm">✓</span>
                  )}
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-black text-slate-900">289€</span>
                  <span className="text-slate-500">/Monat</span>
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><span className="text-purple-500">✓</span> Alles aus Basis</li>
                  <li className="flex items-center gap-2"><span className="text-purple-500">✓</span> Priorität-Support</li>
                  <li className="flex items-center gap-2"><span className="text-purple-500">✓</span> Erweiterte Anpassungen</li>
                </ul>
              </div>
            </div>

            {/* Konto erstellen */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
              <h3 className="font-bold text-lg text-slate-900 mb-4">Konto erstellen</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Firmenname</label>
                  <input 
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                    placeholder="Ihr Unternehmen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail</label>
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                    placeholder="ihr@email.de"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Passwort</label>
                  <input 
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={() => setStep(2)}
              disabled={!formData.email || !formData.password}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-lg px-8 py-4 rounded-xl transition shadow-lg"
            >
              Weiter zur Zahlung →
            </button>
            
            <p className="text-center text-sm text-slate-500 mt-4">
              14 Tage kostenlos testen — jederzeit kündbar
            </p>
          </div>
        )}

        {/* STEP 2: Zahlung */}
        {step === 2 && (
          <div>
            <div className="text-center mb-8">
              <span className="inline-block bg-blue-100 text-blue-700 text-sm font-bold px-4 py-2 rounded-full mb-4">
                Schritt 2 von 3
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
                Zahlung
              </h1>
              <p className="text-slate-600">
                Sichere Zahlung via Stripe
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                <div>
                  <p className="font-semibold text-slate-900">{page.trade.name} in {page.city.name}</p>
                  <p className="text-sm text-slate-500">{selectedPlan === 'pro' ? 'Pro Paket' : 'Basis Paket'}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900">
                    {selectedPlan === 'pro' ? '289€' : '189€'}
                  </p>
                  <p className="text-sm text-slate-500">/Monat</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">14 Tage kostenlos testen</span>
                <span className="text-green-600 font-semibold">Danach erst {selectedPlan === 'pro' ? '289€' : '189€'}/Monat</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold text-lg px-8 py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              {checkoutLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Weiterleitung zu Stripe...
                </>
              ) : (
                <>Jetzt bezahlen →</>
              )}
            </button>
            
            <button 
              onClick={() => setStep(1)}
              className="w-full mt-4 text-slate-500 hover:text-slate-700 font-medium py-2 transition"
            >
              ← Zurück
            </button>
          </div>
        )}

        {/* STEP 3: Bestätigung */}
        {step === 3 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-black text-slate-900 mb-4">
              Fast geschafft!
            </h1>
            <p className="text-slate-600 text-lg mb-8">
              Sie werden jetzt zu Stripe weitergeleitet, um die Zahlung abzuschließen.
            </p>
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          </div>
        )}
      </main>
    </div>
  )
}
