import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { trade: string; city: string; slug: string } }
) {
  try {
    const filePath = join(
      process.cwd(),
      'public',
      'blog',
      params.trade,
      params.city,
      `${params.slug}.html`
    )
    
    const html = readFileSync(filePath, 'utf-8')
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch {
    return new NextResponse('Not Found', { status: 404 })
  }
}
