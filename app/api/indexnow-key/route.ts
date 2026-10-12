import { NextResponse } from 'next/server'

// IndexNow-Verifikations-Key (Statisch, long-lived)
const INDEXNOW_KEY = 'c7a5f6c2f404642bc65d79e57b39e6d3'

export const dynamic = 'force-static'

export function GET() {
  return new NextResponse(INDEXNOW_KEY, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  })
}
