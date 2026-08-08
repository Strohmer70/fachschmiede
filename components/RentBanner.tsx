'use client'

import Link from 'next/link'

interface RentBannerProps {
  tradeName: string
  cityName: string
  price: number
  slug: string
}

export function RentBanner({ tradeName, cityName, price, slug }: RentBannerProps) {
  const priceEuro = (price / 100).toFixed(0)

  return (
    <div className="bg-gradient-to-r from-accent-600 to-accent-500 text-white py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏗️</span>
          <div>
            <p className="font-bold text-base sm:text-lg">
              💡 Diese Seite steht zur Miete!
            </p>
            <p className="text-sm text-white/90">
              Sind Sie {tradeName} in {cityName}? Ranken Sie sofort auf Google — ohne Website-Bauen.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-white/80">ab</p>
            <p className="text-xl sm:text-2xl font-bold">€{priceEuro}/Monat</p>
          </div>
          <Link
            href={`/mieten/${slug}`}
            className="bg-white text-accent-700 font-bold py-2.5 px-6 rounded-xl hover:bg-ink-50 transition shadow-lg whitespace-nowrap"
          >
            🚀 Jetzt mieten
          </Link>
        </div>
      </div>
    </div>
  )
}
