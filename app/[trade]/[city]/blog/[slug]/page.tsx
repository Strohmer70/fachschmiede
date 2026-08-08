import { readFileSync } from 'fs'
import { join } from 'path'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface PageProps {
  params: {
    trade: string
    city: string
    slug: string
  }
}

export async function generateStaticParams() {
  const fs = require('fs')
  const path = require('path')
  
  const blogDir = path.join(process.cwd(), 'public', 'blog')
  const params = []
  
  if (!fs.existsSync(blogDir)) return params
  
  const trades = fs.readdirSync(blogDir)
  for (const trade of trades) {
    const tradeDir = path.join(blogDir, trade)
    if (!fs.statSync(tradeDir).isDirectory()) continue
    
    const cities = fs.readdirSync(tradeDir)
    for (const city of cities) {
      const cityDir = path.join(tradeDir, city)
      if (!fs.statSync(cityDir).isDirectory()) continue
      
      const articles = fs.readdirSync(cityDir)
        .filter((f: string) => f.endsWith('.html'))
        .map((f: string) => f.replace('.html', ''))
      
      for (const slug of articles) {
        params.push({ trade, city, slug })
      }
    }
  }
  
  return params
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const filePath = join(process.cwd(), 'public', 'blog', params.trade, params.city, `${params.slug}.html`)
    const html = readFileSync(filePath, 'utf-8')
    
    // Extract title
    const titleMatch = html.match(/<title>([^<]*)<\/title>/)
    const title = titleMatch ? titleMatch[1] : `${params.slug} - ${params.city}`
    
    // Extract meta description
    const descMatch = html.match(/<meta name="description" content="([^"]*)"/)
    const description = descMatch ? descMatch[1] : ''
    
    // Extract OG image
    const ogImageMatch = html.match(/<meta property="og:image" content="([^"]*)"/)
    const ogImage = ogImageMatch ? ogImageMatch[1] : ''
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: ogImage ? [ogImage] : [],
      },
    }
  } catch {
    return {
      title: 'Artikel nicht gefunden',
    }
  }
}

function extractBodyContent(html: string): string {
  // Remove DOCTYPE, html, head, body tags - keep only inner content
  let content = html
    .replace(/<!DOCTYPE[^>]*>/i, '')
    .replace(/<html[^>]*>/i, '')
    .replace(/<\/html>/i, '')
    .replace(/<head>[\s\S]*?<\/head>/i, '')
    .replace(/<body[^>]*>/i, '')
    .replace(/<\/body>/i, '')
    .trim()
  
  return content
}

function extractSchemaOrg(html: string): string[] {
  const schemas: string[] = []
  const regex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
  let match
  while ((match = regex.exec(html)) !== null) {
    schemas.push(match[1])
  }
  return schemas
}

export default async function ArticlePage({ params }: PageProps) {
  try {
    const filePath = join(process.cwd(), 'public', 'blog', params.trade, params.city, `${params.slug}.html`)
    const html = readFileSync(filePath, 'utf-8')
    
    const bodyContent = extractBodyContent(html)
    const schemas = extractSchemaOrg(html)
    
    return (
      <>
        {/* Schema.org data */}
        {schemas.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: schema }}
          />
        ))}
        <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
      </>
    )
  } catch {
    notFound()
  }
}
