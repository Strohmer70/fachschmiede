'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// Verifiziert den Miet-Status ECHT über /api/payment-status (Slug aus der Rent-Flow URL)
// statt nur auf session_id zu prüfen (alter Bug: zeigte Fehler obwohl Zahlung lief!)
export default function ErfolgPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading')
  const [slug, setSlug] = useState('')
  const [dashMail, setDashMail] = useState('')

  useEffect(() => {
    const url = new URL(window.location.href)
    const s = url.searchParams.get('slug') || ''
    setSlug(s)
    setDashMail(url.searchParams.get('email') || '')
    const sessionId = url.searchParams.get('session_id')

    // Alt-Flow (checkout route mit session_id) → direkt grün (Stripe hat weitergeleitet = bezahlt)
    if (sessionId && !s) { setStatus('success'); return }
    if (!s) { setStatus('error'); return }

    // Rent-Flow: echte DB-Verifikation mit Polling (Webhook braucht bis zu ~30s)
    let attempts = 0
    const check = async () => {
      try {
        const r = await fetch(`/api/payment-status/?slug=${encodeURIComponent(s)}`, { cache: 'no-store' })
        const d = await r.json()
        if (d.rented) { setStatus('success'); return true }
      } catch { /* transient — weiter pollen */ }
      attempts++
      if (attempts >= 15) { setStatus('pending'); return true } // bezahlt, Einrichtung läuft — kein Fehler!
      return false
    }
    check().then(done => { if (!done) { const iv = setInterval(async () => { if (await check()) clearInterval(iv) }, 2000) } })
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Zahlung wird bestätigt…</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Keine Buchungsdaten gefunden</h1>
          <p className="text-slate-600 mb-6">Der Link enthält keine Seiten-Information. Bitte starte den Mietvorgang erneut – bereits getätigte Zahlungen sind sicher.</p>
          <Link href="/" className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition">Zurück zur Startseite</Link>
        </div>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Zahlung eingegangen!</h1>
          <p className="text-slate-600 mb-2">Deine Seite <strong>{slug}</strong> wird gerade eingerichtet — das dauert maximal 1–2 Minuten.</p>
          <p className="text-sm text-slate-500 mb-6">Deine Zugangsdaten kommen automatisch per E-Mail.</p>
          <Link href="/mieter.html" className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition">Zum Dashboard →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Zahlung erfolgreich!</h1>
        <p className="text-slate-600 mb-4">
          Deine Seite <strong className="text-blue-700">{slug}</strong> ist jetzt gemietet und wird mit deinen Daten live geschaltet.
        </p>
        <p className="text-sm text-slate-500 mb-6">Die Bestätigungs-E-Mail mit deinen Zugangsdaten ist unterwegs.</p>
        <div className="space-y-3">
          <Link href="/mieter.html" className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition">
            Zum Dashboard – Seite anpassen →
          </Link>
          <p className="text-xs text-slate-400">Login: {dashMail || 'deine E-Mail'} + dein gewähltes Passwort</p>
        </div>
      </div>
    </div>
  )
}
