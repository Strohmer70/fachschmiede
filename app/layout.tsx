import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'MietWebsites für Handwerker | Deine fertige Handwerker-Website zur Miete',
  description: 'Wir bauen professionelle Websites für Handwerker – nach Gewerk und Stadt. Du mietest selbst online, individualisierst in 5 Minuten – und deine Seite ist sofort online.',
  // 2026-10-14: Brand-Amboss (von Dieter gewählt)
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'fachschmiede.de – Handwerker-Websites zur Miete',
    description: 'Fertige, rankende Websites für Handwerker. Stadt wählen, mieten, sofort online.',
    url: 'https://www.fachschmiede.de',
    siteName: 'fachschmiede.de',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'fachschmiede.de – Handwerker-Websites zur Miete' }],
    locale: 'de_DE',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className={`${inter.variable} scroll-smooth`}>
      <body className="bg-white text-ink-800 antialiased">{children}</body>
    </html>
  )
}
