import { Header } from '@/components/Header'

export const metadata = {
  title: 'Datenschutz | fachschmiede.de',
  description: 'Datenschutzerklärung von fachschmiede.de',
}

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-900 mb-8">Datenschutzerklärung</h1>
        
        <div className="prose prose-ink max-w-none">
          <h2 className="text-xl font-bold text-ink-900 mt-8 mb-4">1. Datenschutz auf einen Blick</h2>
          <h3 className="text-lg font-semibold text-ink-800 mt-6 mb-3">Allgemeine Hinweise</h3>
          <p className="text-ink-600 mb-4">
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten 
            passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie 
            persönlich identifiziert werden können.
          </p>

          <h3 className="text-lg font-semibold text-ink-800 mt-6 mb-3">Datenerfassung auf dieser Website</h3>
          <p className="text-ink-600 mb-4">
            <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />
            Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten 
            können Sie dem Impressum dieser Website entnehmen.
          </p>

          <h2 className="text-xl font-bold text-ink-900 mt-8 mb-4">2. Hosting</h2>
          <p className="text-ink-600 mb-4">
            Diese Website wird bei einem externen Dienstleister gehostet (Hoster). Die personenbezogenen Daten, 
            die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert.
          </p>

          <h2 className="text-xl font-bold text-ink-900 mt-8 mb-4">3. Allgemeine Hinweise und Pflichtinformationen</h2>
          <h3 className="text-lg font-semibold text-ink-800 mt-6 mb-3">Datenschutz</h3>
          <p className="text-ink-600 mb-4">
            Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln 
            Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften 
            sowie dieser Datenschutzerklärung.
          </p>

          <h3 className="text-lg font-semibold text-ink-800 mt-6 mb-3">Hinweis zur verantwortlichen Stelle</h3>
          <p className="text-ink-600 mb-4">
            Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:<br /><br />
            fachschmiede.de<br />
            [Ihr Name]<br />
            [Straße und Hausnummer]<br />
            [PLZ Ort]<br /><br />
            E-Mail: hello@fachschmiede.de
          </p>

          <h3 className="text-lg font-semibold text-ink-800 mt-6 mb-3">Speicherdauer</h3>
          <p className="text-ink-600 mb-4">
            Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, 
            verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt.
          </p>

          <h2 className="text-xl font-bold text-ink-900 mt-8 mb-4">4. Datenerfassung auf dieser Website</h2>
          <h3 className="text-lg font-semibold text-ink-800 mt-6 mb-3">Cookies</h3>
          <p className="text-ink-600 mb-4">
            Unsere Internetseiten verwenden so genannte „Cookies". Cookies sind kleine Textdateien und richten 
            auf Ihrem Endgerät keinen Schaden an. Sie werden entweder vorübergehend für die Dauer einer Sitzung 
            (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem Endgerät gespeichert.
          </p>

          <h3 className="text-lg font-semibold text-ink-800 mt-6 mb-3">Kontaktformular</h3>
          <p className="text-ink-600 mb-4">
            Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular 
            inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall 
            von Anschlussfragen bei uns gespeichert.
          </p>

          <h2 className="text-xl font-bold text-ink-900 mt-8 mb-4">5. Newsletter</h2>
          <p className="text-ink-600 mb-4">
            Wenn Sie den auf der Website angebotenen Newsletter beziehen möchten, benötigen wir von Ihnen eine 
            E-Mail-Adresse sowie Informationen, welche uns die Überprüfung gestatten, dass Sie der Inhaber der 
            angegebenen E-Mail-Adresse sind und mit dem Empfang des Newsletters einverstanden sind.
          </p>

          <h2 className="text-xl font-bold text-ink-900 mt-8 mb-4">6. Plugins und Tools</h2>
          <h3 className="text-lg font-semibold text-ink-800 mt-6 mb-3">Google Fonts</h3>
          
          <p className="text-ink-600 mb-4">
            Diese Seite nutzt zur einheitlichen Darstellung von Schriftarten so genannte Google Fonts, die von 
            Google bereitgestellt werden. Beim Aufruf einer Seite lädt Ihr Browser die benötigten Fonts in Ihren 
            Browsercache, um Texte und Schriftarten korrekt anzuzeigen.
          </p>

          <h2 className="text-xl font-bold text-ink-900 mt-8 mb-4">7. Zahlungsanbieter</h2>
          <h3 className="text-lg font-semibold text-ink-800 mt-6 mb-3">Stripe</h3>
          <p className="text-ink-600 mb-4">
            Wir bieten die Möglichkeit, Zahlungen über den Zahlungsdienstleister Stripe zu verarbeiten. 
            Anbieter ist die Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, 
            Dublin, Irland. Weitere Informationen finden Sie in der Datenschutzerklärung von Stripe: 
            <a href="https://stripe.com/de/privacy" className="text-brand-600 hover:underline" target="_blank" rel="noopener noreferrer">https://stripe.com/de/privacy</a>
          </p>

          <h2 className="text-xl font-bold text-ink-900 mt-8 mb-4">8. Ihre Rechte</h2>
          <p className="text-ink-600 mb-4">
            Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer 
            gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung 
            oder Löschung dieser Daten zu verlangen.
          </p>
        </div>
      </main>

      <footer className="bg-ink-900 text-ink-400 py-8 px-4 sm:px-6 lg:px-8 text-center text-sm">
        <p>© 2026 fachschmiede.de — Alle Rechte vorbehalten.</p>
      </footer>
    </div>
  )
}
