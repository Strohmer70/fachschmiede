import { NextResponse } from 'next/server'

// ═══════════════════════════════════════════
// SYSTEM CONFIG API — Single Source of Truth
// ═══════════════════════════════════════════
// Liefert die komplette System-Konfiguration
// Wird von Admin, Generator, Blog genutzt
// ═══════════════════════════════════════════

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Dynamisch importieren (unterstützt JS-Config)
    const configModule = await import('@/config/system-config.js')
    const { SYSTEM_CONFIG, getAllTrades, getAllCities, getTotalPossiblePages } = configModule

    return NextResponse.json({
      success: true,
      version: SYSTEM_CONFIG.version,
      lastUpdated: SYSTEM_CONFIG.lastUpdated,
      trades: getAllTrades(),
      cities: getAllCities(),
      totalPossiblePages: getTotalPossiblePages(),
      settings: SYSTEM_CONFIG.settings,
    })
  } catch (error: any) {
    console.error('System config error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to load system config',
      message: error.message,
    }, { status: 500 })
  }
}
