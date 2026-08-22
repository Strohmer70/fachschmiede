'use client'

import { useState, useEffect, useCallback } from 'react'
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

const CITY_NAMES: Record<string, string> = {
  'schwerte': 'Schwerte',
  'dortmund': 'Dortmund',
  'hagen': 'Hagen',
  'iserlohn': 'Iserlohn',
  'unna': 'Unna',
  'bochum': 'Bochum',
  'witten': 'Witten',
  'luenen': 'Lünen',
  'herne': 'Herne',
  'castrop-rauxel': 'Castrop-Rauxel',
  'kamen': 'Kamen',
  'bergkamen': 'Bergkamen',
  'froendenberg': 'Fröndenberg',
  'holzwickede': 'Holzwickede',
  'schwelm': 'Schwelm',
  'gevelsberg': 'Gevelsberg',
  'ennepetal': 'Ennepetal',
  'sprockhoevel': 'Sprockhövel',
  'hattingen': 'Hattingen',
  'wetter-ruhr': 'Wetter (Ruhr)',
  'muenchen': 'München',
}

const TRADE_NAMES: Record<string, string> = {
  'dachdecker': 'Dachdecker',
  'elektriker': 'Elektriker',
  'klempner': 'Klempner',
  'maler': 'Maler',
  'zimmerer': 'Zimmerer',
  'shk': 'Klempner',
}

export default function CheckoutFlow({ page }: { page: PageData }) {
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState<'miete' | 'test'>('miete')
  const [tarif, setTarif] = useState<'Basis' | 'Pro'>('Basis')
  const [color, setColor] = useState('#ea580c')
  const [pwStrength_, setPwStrength] = useState({ width: '0%', color: '#e2e8f0', label: '–', labelColor: '#94a3b8' })
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    pw1: '',
    pw2: '',
    firma: '',
    tel: '',
    mail: '',
    adresse: '',
    whatsapp: '',
    gmaps: '',
  })
  const [pwError, setPwError] = useState(false)
  const [payMethod, setPayMethod] = useState('card')
  const [agb, setAgb] = useState(false)

  const cityName = CITY_NAMES[page.city.slug] || page.city.name
  const tradeName = TRADE_NAMES[page.trade.slug] || page.trade.name
  const isMunich = page.city.slug === 'muenchen'

  // Preis basierend auf Tarif
  const price = tarif === 'Pro' ? 289 : 189

  function checkPwStrength(pw: string) {
    let s = 0
    if (pw.length >= 8) s++
    if (pw.length >= 12) s++
    if (/[0-9]/.test(pw) && /[a-zA-Z]/.test(pw)) s++
    if (/[^a-zA-Z0-9]/.test(pw)) s++
    if (pw.length > 0 && pw.length < 8) s = 1
    const conf = [
      ['0%', '#e2e8f0', '–', '#94a3b8'],
      ['30%', '#dc2626', 'schwach', '#dc2626'],
      ['55%', '#f59e0b', 'okay', '#d97706'],
      ['80%', '#84cc16', 'gut', '#65a30d'],
      ['100%', '#16a34a', 'stark', '#16a34a']
    ][pw ? s : 0]
    setPwStrength({ width: conf[0], color: conf[1], label: conf[2], labelColor: conf[3] })
  }

  function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault()
    if (formData.pw1.length >= 8 && formData.pw1 === formData.pw2) {
      setPwError(false)
      setStep(2)
    } else {
      setPwError(true)
    }
  }

  function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault()
    setStep(3)
  }

  function handlePublish() {
    // Demo: Nur localStorage
    const miete = {
      gewerk: tradeName,
      stadt: cityName,
      slug: page.city.slug,
      tarif,
      farbe: color,
      firma: formData.firma,
      tel: formData.tel,
      mail: formData.mail,
      modus: mode,
      testEnde: mode === 'test' ? new Date(Date.now() + 14 * 86400000).toISOString() : null,
    }
    localStorage.setItem('mw_miete', JSON.stringify(miete))
    setStep(4)
  }

  const trialEnd = new Date(Date.now() + 14 * 86400000).toLocaleDateString('de-DE')

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-black text-xl text-slate-900">
            fachschmiede.de
          </Link>
          <a href={`/${page.trade.slug}/${page.city.slug}/`} className="text-sm font-semibold text-slate-600 hover:text-orange-600 transition">
            ← Zurück zur Seite
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Fortschritt */}
        <div className="mb-8">
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {step > 1 ? '✓' : '1'}
            </div>
            <div className="flex-1 h-1 rounded bg-slate-200">
              <div className="h-1 rounded bg-orange-600 transition-all duration-500" style={{ width: step >= 2 ? '100%' : '0%' }} />
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? (step > 2 ? 'bg-orange-600 text-white' : 'bg-orange-600 text-white') : 'bg-slate-200 text-slate-500'}`}>
              {step > 2 ? '✓' : '2'}
            </div>
            <div className="flex-1 h-1 rounded bg-slate-200">
              <div className="h-1 rounded bg-orange-600 transition-all duration-500" style={{ width: step >= 3 ? '100%' : '0%' }} />
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              3
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-400 uppercase tracking-widest text-center">
            {step === 1 && 'Schritt 1 von 3 · Konto & Miete'}
            {step === 2 && 'Schritt 2 von 3 · Individualisierung'}
            {step === 3 && 'Schritt 3 von 3 · Prüfen & Veröffentlichen'}
            {step === 4 && 'Fertig · Website veröffentlicht'}
          </p>
        </div>

        {/* SCHRITT 1: Konto & Miete */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-8">
              <h3 className="text-2xl font-black text-slate-900">„{tradeName} {cityName}" anmieten</h3>
              <p className="mt-2 text-sm text-slate-600">
                Lege dein Konto an und starte die Miete. 0 € Einrichtung, monatlich kündbar – die Stadt ist danach für dich reserviert.
              </p>

              <form onSubmit={handleStep1Submit} className="mt-6 space-y-4">
                {/* Start-Modus */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Wie möchtest du starten? *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label 
                      onClick={() => setMode('miete')}
                      className={`cursor-pointer border-2 rounded-xl p-4 block transition ${mode === 'miete' ? 'border-orange-600 bg-orange-50' : 'border-slate-200 hover:border-orange-400'}`}
                    >
                      <input type="radio" name="mode" className="sr-only" checked={mode === 'miete'} readOnly />
                      <span className="font-bold text-slate-900 text-sm">🚀 Sofort mieten</span>
                      <span className="mt-1 block text-[11px] text-slate-500 leading-snug">
                        Website sofort online · Zahlung via Stripe/PayPal · monatlich kündbar
                      </span>
                    </label>
                    <label 
                      onClick={() => setMode('test')}
                      className={`cursor-pointer border-2 rounded-xl p-4 block transition ${mode === 'test' ? 'border-orange-600 bg-orange-50' : 'border-slate-200 hover:border-orange-400'}`}
                    >
                      <input type="radio" name="mode" className="sr-only" checked={mode === 'test'} readOnly />
                      <span className="font-bold text-slate-900 text-sm">🎁 14 Tage kostenlos testen</span>
                      <span className="mt-1 block text-[11px] text-slate-500 leading-snug">
                        Voller Funktionsumfang · keine Zahlungsdaten nötig · endet automatisch
                      </span>
                    </label>
                  </div>
                </div>

                {/* Test-Info */}
                {mode === 'test' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm font-bold text-amber-800">🎁 So läuft deine Testphase</p>
                    <ul className="mt-2 text-xs text-amber-800 space-y-1.5 leading-relaxed">
                      <li>✓ 14 Tage voller Funktionsumfang – Website live, Dashboard, alles inklusive</li>
                      <li>✓ Keine Zahlungsdaten nötig, keine automatische Abbuchung</li>
                      <li>✓ Endet am <strong>{trialEnd}</strong> – danach entscheidest du: mieten oder die Stadt geht zurück in den freien Pool</li>
                    </ul>
                  </div>
                )}

                {/* Name & Email */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <input 
                    type="text" required placeholder="Vor- und Nachname"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <input 
                    type="email" required placeholder="E-Mail-Adresse"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Passwort */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-bold text-slate-800">🔒 Dein Dashboard-Zugang</p>
                  <input 
                    type="password" required placeholder="Passwort wählen (min. 8 Zeichen)" minLength={8}
                    value={formData.pw1}
                    onChange={e => { setFormData({...formData, pw1: e.target.value}); checkPwStrength(e.target.value) }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded bg-slate-200 overflow-hidden">
                      <div className="h-full rounded transition-all duration-300" style={{ width: pwStrength_.width, background: pwStrength_.color }} />
                    </div>
                    <span className="text-[11px] font-bold w-16 text-right shrink-0" style={{ color: pwStrength_.labelColor }}>{pwStrength_.label}</span>
                  </div>
                  <input 
                    type="password" required placeholder="Passwort wiederholen" minLength={8}
                    value={formData.pw2}
                    onChange={e => setFormData({...formData, pw2: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {pwError && <p className="text-xs font-bold text-red-600">⚠ Die Passwörter stimmen nicht überein oder sind zu kurz.</p>}
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Mit deiner E-Mail und diesem Passwort loggst du dich später in dein Dashboard ein.
                  </p>
                </div>

                {/* Tarif */}
                {mode === 'miete' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">Dein Tarif *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label 
                        onClick={() => setTarif('Basis')}
                        className={`cursor-pointer border-2 rounded-xl p-4 block transition ${tarif === 'Basis' ? 'border-orange-600 bg-orange-50' : 'border-slate-200 hover:border-orange-400'}`}
                      >
                        <input type="radio" name="tarif" className="sr-only" checked={tarif === 'Basis'} readOnly />
                        <span className="flex justify-between items-baseline">
                          <strong className="text-slate-900">Basis</strong>
                          <span className="font-black text-slate-900">189 €<span className="text-xs font-semibold text-slate-500">/M.</span></span>
                        </span>
                        <span className="mt-1.5 block text-xs text-slate-600 leading-snug">Website + Blog + E-Mail-Leads</span>
                      </label>
                      <label 
                        onClick={() => setTarif('Pro')}
                        className={`cursor-pointer border-2 rounded-xl p-4 block transition ${tarif === 'Pro' ? 'border-orange-600 bg-orange-50' : 'border-slate-200 hover:border-orange-400'}`}
                      >
                        <input type="radio" name="tarif" className="sr-only" checked={tarif === 'Pro'} readOnly />
                        <span className="flex justify-between items-baseline">
                          <strong className="text-slate-900">Pro</strong>
                          <span className="font-black text-slate-900">289 €<span className="text-xs font-semibold text-slate-500">/M.</span></span>
                        </span>
                        <span className="mt-1.5 block text-xs text-slate-600 leading-snug">+ SMS, Terminbuchung, Google-Bewertungen</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Zahlungsmethode */}
                {mode === 'miete' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">Zahlungsmethode *</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['💳 Kreditkarte', '🏦 SEPA', '🅿️ PayPal'].map((label, i) => (
                        <label 
                          key={i}
                          onClick={() => setPayMethod(['card', 'sepa', 'paypal'][i])}
                          className={`cursor-pointer border-2 rounded-xl p-3 block transition text-center ${payMethod === ['card', 'sepa', 'paypal'][i] ? 'border-orange-600 bg-orange-50' : 'border-slate-200 hover:border-orange-400'}`}
                        >
                          <input type="radio" name="pay" className="sr-only" checked={payMethod === ['card', 'sepa', 'paypal'][i]} readOnly />
                          <span className="font-bold text-slate-900 text-xs">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* AGB */}
                <label className="flex items-start gap-3 text-xs text-slate-600">
                  <input 
                    type="checkbox" required checked={agb} onChange={e => setAgb(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-orange-600"
                  />
                  <span>Ich akzeptiere die Mietbedingungen und die <a href="/datenschutz/" className="underline font-semibold">Datenschutzerklärung</a>.</span>
                </label>

                <button 
                  type="submit" 
                  disabled={!agb}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl transition"
                >
                  {mode === 'test' ? 'Weiter zur Individualisierung →' : 'Weiter zur Individualisierung →'}
                </button>

                <p className="text-xs text-slate-400 text-center">
                  {mode === 'test' 
                    ? '14 Tage kostenlos testen – keine Zahlungsdaten nötig.' 
                    : 'Monatlich kündbar · 0 € Einrichtung · Demo: keine echte Zahlung.'}
                </p>
              </form>
            </div>
          </div>
        )}

        {/* SCHRITT 2: Individualisierung */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-8">
              <h3 className="text-2xl font-black text-slate-900">Deine Seite individualisieren</h3>
              <p className="mt-2 text-sm text-slate-600">
                Diese Angaben erscheinen sofort auf deiner Website – und machen sie für Google einzigartig.
              </p>

              <form onSubmit={handleStep2Submit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">Firmenname *</label>
                  <input 
                    type="text" required placeholder="z. B. Müller Bedachungen"
                    value={formData.firma}
                    onChange={e => setFormData({...formData, firma: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1.5">Telefon *</label>
                    <input 
                      type="tel" required placeholder="02331 / …"
                      value={formData.tel}
                      onChange={e => setFormData({...formData, tel: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1.5">E-Mail (öffentlich) *</label>
                    <input 
                      type="email" required placeholder="info@…"
                      value={formData.mail}
                      onChange={e => setFormData({...formData, mail: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">Adresse *</label>
                  <input 
                    type="text" required placeholder="Straße, PLZ, Ort"
                    value={formData.adresse}
                    onChange={e => setFormData({...formData, adresse: e.target.value})}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Akzentfarbe */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">Akzentfarbe</label>
                  <div className="flex gap-3">
                    {['#ea580c', '#2563eb', '#059669', '#7c3aed', '#0f172a'].map(c => (
                      <span 
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-10 h-10 rounded-lg cursor-pointer border-2 flex items-center justify-center transition hover:scale-105 ${color === c ? 'border-slate-900' : 'border-transparent hover:border-slate-400'}`}
                        style={{ background: c }}
                      >
                        {color === c && (
                          <svg className="w-5 h-5 text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Ausgewählt: <strong className="font-mono">{color}</strong>
                  </p>
                  <span 
                    className="mt-2 inline-block text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                    style={{ background: color }}
                  >
                    Vorschau: So sieht dein Button aus
                  </span>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="px-6 py-3.5 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    ← Zurück
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition"
                  >
                    Vorschau erzeugen →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SCHRITT 3: Prüfen & Veröffentlichen */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-8 text-center">
              <span className="inline-flex w-16 h-16 rounded-full bg-green-100 text-green-600 items-center justify-center text-3xl">🎉</span>
              <h3 className="mt-4 text-2xl font-black text-slate-900">Deine Vorschau ist fertig!</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                So sieht deine Website „{tradeName} {cityName}" aus. Prüfe alles in Ruhe – danach geht sie mit einem Klick unter deinem Namen online.
              </p>

              <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-5 text-left text-sm space-y-2.5">
                <p className="flex gap-3"><span className="text-green-600 font-bold">✓</span> Startseite mit deinem Firmennamen & Stadt</p>
                <p className="flex gap-3"><span className="text-green-600 font-bold">✓</span> Deine Leistungen in eigener Textfassung</p>
                <p className="flex gap-3"><span className="text-green-600 font-bold">✓</span> FAQ & Über-uns stadtindividuell formuliert</p>
                <p className="flex gap-3"><span className="text-green-600 font-bold">✓</span> Kontaktformular → Anfragen direkt an deine E-Mail</p>
                <p className="flex gap-3"><span className="text-green-600 font-bold">✓</span> Ratgeber-Blog startet mit 3 Artikeln</p>
              </div>

              {mode === 'test' && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                  <p className="text-sm font-bold text-amber-800">🎁 So läuft deine Testphase</p>
                  <ul className="mt-2 text-xs text-amber-800 space-y-1.5 leading-relaxed">
                    <li>✓ 14 Tage voller Funktionsumfang – Website live, Dashboard, alles inklusive</li>
                    <li>✓ Keine Zahlungsdaten nötig, keine automatische Abbuchung</li>
                    <li>✓ Endet am <strong>{trialEnd}</strong> – danach entscheidest du: mieten oder die Stadt geht zurück in den Pool</li>
                  </ul>
                </div>
              )}

              {mode === 'miete' && (
                <div className="mt-6 text-left">
                  <p className="text-sm font-bold text-slate-800 mb-2">💳 Zahlungsmethode für die Monatsmiete *</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { id: 'card', label: '💳 Kreditkarte', desc: 'Visa · Mastercard · Amex' },
                      { id: 'sepa', label: '🏦 SEPA-Lastschrift', desc: 'Monatliche Abbuchung' },
                      { id: 'paypal', label: '🅿️ PayPal', desc: 'Direkt über PayPal' },
                    ].map(p => (
                      <label 
                        key={p.id}
                        onClick={() => setPayMethod(p.id)}
                        className={`cursor-pointer border-2 rounded-xl p-4 block transition ${payMethod === p.id ? 'border-orange-600 bg-orange-50' : 'border-slate-200 hover:border-orange-400'}`}
                      >
                        <span className="font-bold text-slate-900 text-sm">{p.label}</span>
                        <span className="mt-1 block text-[11px] text-slate-500 leading-snug">{p.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setStep(2)}
                  className="px-6 py-3.5 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  ← Zurück
                </button>
                <button 
                  onClick={handlePublish}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-black text-lg py-4 rounded-xl transition shadow-lg"
                >
                  {mode === 'test' ? '🎁 Testphase starten & veröffentlichen' : '🚀 Jetzt veröffentlichen & Miete starten'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCHRITT 4: Erfolg */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
            <span className="inline-flex w-20 h-20 rounded-full bg-green-500 text-white items-center justify-center text-4xl shadow-lg">✓</span>
            <h3 className="mt-5 text-3xl font-black text-slate-900">Du bist online!</h3>
            <p className="mt-3 text-slate-600 leading-relaxed max-w-md mx-auto">
              {mode === 'test'
                ? `„${tradeName} ${cityName}" ist ab sofort unter deinem Namen online – 14 Tage kostenlos, ohne Zahlungsdaten. Dein Dashboard-Login ist aktiviert.`
                : `„${tradeName} ${cityName}" ist ab sofort unter deinem Namen erreichbar. Anfragen kommen direkt zu dir – dein Dashboard-Login ist aktiviert.`}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/${page.trade.slug}/${page.city.slug}/`} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-7 py-3.5 rounded-xl transition">
                Meine Website ansehen
              </Link>
              <Link href="/dashboard/" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-7 py-3.5 rounded-xl transition">
                Zum Dashboard
              </Link>
            </div>
            <p className="mt-5 text-xs text-slate-400 italic">Demo: Es wurde nichts gebucht, gespeichert oder veröffentlicht.</p>
          </div>
        )}
      </main>
    </div>
  )
}
