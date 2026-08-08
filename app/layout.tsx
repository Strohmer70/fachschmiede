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
