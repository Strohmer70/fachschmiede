'use client'

import { useState } from 'react'

interface Trade {
  slug: string
  name: string
  emoji: string
}

interface City {
  slug: string
  name: string
}

interface PortalSearchProps {
  trades: Trade[]
  cities: City[]
}

export default function PortalSearch({ trades, cities }: PortalSearchProps) {
  const [trade, setTrade] = useState(trades[0]?.slug || '')
  const [city, setCity] = useState(cities[0]?.slug || '')

  const go = () => {
    if (trade && city) {
      window.location.href = `/${trade}/${city}/`
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto">
      <div className="flex-1">
        <label htmlFor="gewerk" className="block text-xs font-bold uppercase tracking-wider text-ink-500 mb-1.5">
          Gewerk
        </label>
        <select
          id="gewerk"
          value={trade}
          onChange={(e) => setTrade(e.target.value)}
          className="w-full appearance-none bg-ink-50 border border-ink-200 rounded-xl px-4 py-3.5 text-ink-900 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent cursor-pointer"
        >
          {trades.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.emoji} {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label htmlFor="stadt" className="block text-xs font-bold uppercase tracking-wider text-ink-500 mb-1.5">
          Stadt
        </label>
        <select
          id="stadt"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full appearance-none bg-ink-50 border border-ink-200 rounded-xl px-4 py-3.5 text-ink-900 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent cursor-pointer"
        >
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              📍 {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:self-end">
        <label className="hidden sm:block text-xs font-bold uppercase tracking-wider text-transparent mb-1.5 select-none">
          &nbsp;
        </label>
        <button
          onClick={go}
          className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold px-8 py-3.5 rounded-xl transition shadow-lg shadow-brand-600/30 text-base whitespace-nowrap"
        >
          Betrieb finden →
        </button>
      </div>
    </div>
  )
}
