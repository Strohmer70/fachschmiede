import { Header } from '@/components/Header'

export const metadata = {
  title: 'Impressum | fachschmiede.de',
  description: 'Impressum von fachschmiede.de',
}

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-900 mb-8">Impressum</h1>
        
        <div className="prose prose-ink max-w-none">
          <h2 className="text-xl font-bold text-ink-900 mt-8 mb-4">Angaben gemäß § 5 TMG</h2>
          <p className="text-ink-600 mb-4">
            fachschmiede.de<br />
            [Ihr Name]<br />
            [Straße und Hausnummer]<br />
            [PLZ Ort]<br />
            Deutschland
          </p>

          <h2 className="text-xl font-bold text-ink-900 mt-8 mb-4">Kontakt</h2>
          <p className="text-ink-600 mb-4">
            E-Mail: hello@fachschmiede.de<br />
            Telefon: [Ihre Telefonnummer]
          </p>

          <h2 className="text-xl font-bold text-ink-900 mt-8 mb-4">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <p className="text-ink-600 mb-4">
            [Ihr Name]<br />
            [Adresse]
          </p>

          <h2 className="text-xl font-bold text-ink-900 mt-8 mb-4">Haftung für Inhalte</h2>
          <p className="text-ink-600 mb-4">
            Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den 
            allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht 
            verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen 
            zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          </p>

          <h2 className="text-xl font-bold text-ink-900 mt-8 mb-4">Haftung für Links</h2>
          <p className="text-ink-600 mb-4">
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. 
            Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der 
            verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
          </p>

          <h2 className="text-xl font-bold text-ink-900 mt-8 mb-4">Urheberrecht</h2>
          <p className="text-ink-600 mb-4">
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen 
            Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der 
            Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
          </p>
        </div>
      </main>

      <footer className="bg-ink-900 text-ink-400 py-8 px-4 sm:px-6 lg:px-8 text-center text-sm">
        <p>© 2026 fachschmiede.de — Alle Rechte vorbehalten.</p>
      </footer>
    </div>
  )
}
