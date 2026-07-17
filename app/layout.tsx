import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'fachschmiede.de — Wir schmieden deine lokale Präsenz',
  description: 'Professionelle lokale Webseiten für Handwerker und Dienstleister. Mieten Sie eine bereits rankende Seite in Ihrer Stadt.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
