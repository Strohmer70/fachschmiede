'use client'

import Link from 'next/link'

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-ink-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
        <Link href="/" className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center text-white font-black text-lg">M</span>
          <span className="leading-tight">
            <span className="block font-extrabold text-lg text-ink-900">MietWebsites</span>
            <span className="block text-xs text-ink-500 font-medium">für Handwerker</span>
          </span>
        </Link>
        <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-ink-600">
          <a href="/#so-funktionierts" className="hover:text-brand-600 transition">So funktioniert's</a>
          <a href="/#leistungen" className="hover:text-brand-600 transition">Alles inklusive</a>
          <a href="/dachdecker/" className="hover:text-brand-600 transition">Gewerke</a>
          <a href="/admin" className="hover:text-brand-600 transition">Admin</a>
        </nav>
        <Link href="/dachdecker/" className="hidden sm:inline-flex bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition shadow-sm">
          Stadt sichern
        </Link>
      </div>
    </header>
  )
}
