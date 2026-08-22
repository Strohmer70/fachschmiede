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

// KORREKTE PREISE - unabhängig von DB-Fehler
const PRICE_BASIS = 18900 // €189
const PRICE_PRO = 28900   // €289 (München)

function getCorrectPrice(citySlug: string): number {
  return citySlug === 'muenchen' ? PRICE_PRO : PRICE_BASIS
}

export default function RentPageClient({ params }: { params: { slug: string } }) {
  const [page, setPage] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/pages?page=1&limit=105')
        const data = await res.json()
        const found = data.pages?.find((p: PageData) => p.slug === params.slug)
        if (found) {
          setPage(found)
        } else {
          setError('Seite nicht gefunden')
        }
      } catch (err) {
        setError('Fehler beim Laden')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [params.slug])

  async function handleCheckout() {
    if (!page) return
    setCheckoutLoading(true)
    
    // KORREKTER PREIS - nicht aus DB, sondern berechnet
    const correctPrice = getCorrectPrice(page.city.slug)
    
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landing_page_id: page.id,
          slug: page.slug,
          price_cents: correctPrice, // ⭐ KORREKTER PREIS!
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
    } catch (err) {
      setError('Fehler beim Checkout')
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Laden...</p>
        </div>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Seite nicht verfügbar</h1>
          <p className="text-slate-600 mb-6">{error || 'Diese Seite konnte nicht gefunden werden.'}</p>
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

  // KORREKTER PREIS - nicht aus DB!
  const correctPrice = getCorrectPrice(page.city.slug)
  const priceEuro = (correctPrice / 100).toFixed(0)
  const isPro = correctPrice === PRICE_PRO

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-black text-xl text-slate-900">
            fachschmiede.de
          </Link>
          <a href={`/${page.trade.slug}/${page.city.slug}/`} className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
            ← Zurück zur Seite
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm font-bold px-4 py-2 rounded-full mb-4">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Noch verfügbar
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
            {page.trade.name} in {page.city.name}
          </h1>
          <p className="text-slate-600 text-lg">
            Diese Seite ist zur Miete verfügbar
          </p>
        </div>

        {/* Preis-Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-8">
          <div className="flex items-baseline justify-center gap-2 mb-2">
            <span className="text-5xl font-black text-slate-900">€{priceEuro}</span>
            <span className="text-slate-500 font-medium">/Monat</span>
          </div>
          <p className="text-center text-slate-600 mb-2">
            Inklusive Hosting, Updates & Support
          </p>
          {isPro && (
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
                ⭐ PRO Paket
              </span>
            </div>
          )}
          <ul className="space-y-3 text-slate-700 mb-8">
            <li className="flex items-center gap-3">
              <span className="text-green-500 text-xl">✓</span>
              Komplette Website mit Ihrem Branding
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-500 text-xl">✓</span>
              Sofort online – keine Wartezeit
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-500 text-xl">✓</span>
              Eigenes Dashboard zur Anpassung
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-500 text-xl">✓</span>
              Kündbar monatlich
            </li>
            {isPro && (
              <>
                <li className="flex items-center gap-3">
                  <span className="text-purple-500 text-xl">✓</span>
                  <strong>Priorität-Support</strong>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-purple-500 text-xl">✓</span>
                  <strong>Erweiterte Anpassungen</strong>
                </li>
              </>
            )}
          </ul>
          <button 
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold text-lg px-8 py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
          >
            {checkoutLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Weiterleitung...
              </>
            ) : (
              <>Jetzt mieten →</>
            )}
          </button>
        </div>

        {/* Verfügbarkeit */}
        <div className="text-center text-sm text-slate-500">
          <p>Seite: <strong className="text-slate-700">{page.slug}</strong></p>
          <p className="mt-1">Status: <span className="text-green-600 font-semibold">Verfügbar</span></p>
        </div>
      </main>
    </div>
  )
}
