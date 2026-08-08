export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Zahlung erfolgreich!</h1>
        <p className="mt-4 text-slate-600">
          Vielen Dank für deine Buchung. Wir haben deine Zahlung erhalten und aktivieren deine Landing Page innerhalb von 24 Stunden.
        </p>
        <div className="mt-8 space-y-3">
          <p className="text-sm text-slate-500">
            Du erhältst in Kürze eine E-Mail mit deinen Zugangsdaten zum Mieter-Dashboard.
          </p>
          <a 
            href="/" 
            className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl transition w-full"
          >
            Zurück zur Startseite
          </a>
        </div>
      </div>
    </div>
  )
}
