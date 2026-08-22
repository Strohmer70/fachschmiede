'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ErfolgPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    // Check for session_id in URL
    const url = new URL(window.location.href)
    const sessionId = url.searchParams.get('session_id')
    
    if (sessionId) {
      setStatus('success')
    } else {
      setStatus('error')
    }
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Bestätigung wird verarbeitet...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Fehler bei der Bestätigung</h1>
          <p className="text-slate-600 mb-6">Die Zahlung konnte nicht bestätigt werden.</p>
          <Link href="/" className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition">
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Zahlung erfolgreich!</h1>
        <p className="text-slate-600 mb-6">
          Vielen Dank für Ihre Buchung. Sie erhalten in Kürze eine Bestätigungs-E-Mail mit Ihren Zugangsdaten zum Dashboard.
        </p>
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Sie können sich jetzt in Ihr Dashboard einloggen und Ihre Seite anpassen.
          </p>
          <Link href="/dashboard" className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition">
            Zum Dashboard →
          </Link>
        </div>
      </div>
    </div>
  )
}
