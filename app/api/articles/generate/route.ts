import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'


const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY
const MOONSHOT_API_URL = process.env.MOONSHOT_API_URL || 'https://api.moonshot.ai/v1'

function countWords(text: string): number {
  return text.trim().split(/\s+/).length
}

function buildPrompt(cityName: string, tradeName: string, tradeSlug: string): string {
  return `Schreibe einen professionellen, SEO-optimierten Artikel auf Deutsch für einen ${tradeName} in ${cityName}.

ANFORDERUNGEN:
- Mindestens 800 Wörter
- Natürlicher, professioneller Schreibstil (nicht wie AI-generiert)
- Enthält lokale Bezüge zu ${cityName}
- Praktische Tipps und Fachwissen
- Aufbau: Einleitung, Hauptteil mit H2-Überschriften, FAQ-Bereich
- Call-to-Action am Ende
- Meta-Beschreibung (max 160 Zeichen) als separater Block

STRUKTUR:
1. H1: Catchy Titel mit ${cityName} und ${tradeName}
2. Einleitung (2-3 Sätze)
3. 3-4 H2-Abschnitte mit Fachwissen
4. H2: Häufig gestellte Fragen (3-4 Fragen)
5. Kurzer Abschluss mit CTA

FORMAT:
Gib den Artikel in Markdown zurück. Beginne mit einer Meta-Beschreibung in diesem Format:
META: [Deine Meta-Beschreibung hier]

Dann der Artikel in Markdown.`
}

async function generateWithKimi(prompt: string): Promise<string> {
  if (!MOONSHOT_API_KEY) {
    throw new Error('MOONSHOT_API_KEY not configured')
  }

  const response = await fetch(`${MOONSHOT_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MOONSHOT_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'kimi-k3',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein professioneller Content-Writer für deutsche Handwerker-Websites. Du schreibst SEO-optimierte, lokale Artikel die menschlich und vertrauenswürdig klingen.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Kimi API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

function parseArticle(aiResponse: string, cityName: string, tradeName: string) {
  // Extract meta description
  const metaMatch = aiResponse.match(/^META:\s*(.+)/im)
  const metaDescription = metaMatch ? metaMatch[1].trim() : `Professioneller ${tradeName} in ${cityName}. Qualität, Erfahrung & faire Preise. Jetzt kontaktieren!`

  // Extract H1 title (first # heading)
  const h1Match = aiResponse.match(/^#\s*(.+)/m)
  const title = h1Match ? h1Match[1].trim() : `${tradeName} in ${cityName} - Ihr Experte vor Ort`

  // Clean up the content
  let content = aiResponse
    .replace(/^META:.+\n?/im, '')
    .trim()

  // Generate excerpt (first 2-3 sentences)
  const sentences = content.replace(/[#*\-_]/g, '').split(/[.!?]+/).filter(s => s.trim().length > 20)
  const excerpt = sentences.slice(0, 2).join('. ').trim() + '.'

  return { title, metaDescription, content, excerpt }
}

// POST /api/articles/generate - Generate article using Kimi AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { landing_page_id, custom_title } = body

    if (!landing_page_id) {
      return NextResponse.json({ error: 'landing_page_id is required' }, { status: 400 })
    }

    // Check API key
    if (!MOONSHOT_API_KEY) {
      return NextResponse.json({ 
        error: 'Kimi API not configured',
        message: 'MOONSHOT_API_KEY fehlt in den Umgebungsvariablen'
      }, { status: 500 })
    }

    // Get landing page details
    const { data: page, error: pageError } = await supabaseAdmin
      .from('landing_pages')
      .select(`
        *,
        trade:trades(name, slug),
        city:cities(name, slug)
      `)
      .eq('id', landing_page_id)
      .single()

    if (pageError || !page) {
      return NextResponse.json({ error: 'Landing page not found', message: pageError?.message }, { status: 404 })
    }

    const tradeSlug = page.trade?.slug
    const citySlug = page.city?.slug
    const tradeName = page.trade?.name
    const cityName = page.city?.name

    if (!tradeSlug || !citySlug || !tradeName || !cityName) {
      return NextResponse.json({ error: 'Trade or city not found' }, { status: 400 })
    }

    // Check for existing article this month (prevent duplicates)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: existing } = await supabaseAdmin
      .from('articles')
      .select('id')
      .eq('landing_page_id', landing_page_id)
      .gte('created_at', startOfMonth.toISOString())
      .single()

    if (existing) {
      return NextResponse.json({ 
        error: 'Article already exists this month',
        message: 'Ein Artikel wurde diesen Monat bereits erstellt'
      }, { status: 409 })
    }

    // Generate with Kimi AI
    const prompt = buildPrompt(cityName, tradeName, tradeSlug)
    console.log(`Generating article for ${tradeName} in ${cityName}...`)
    
    const aiResponse = await generateWithKimi(prompt)
    
    if (!aiResponse || aiResponse.length < 100) {
      return NextResponse.json({ 
        error: 'AI generation failed',
        message: 'KI hat keinen oder zu kurzen Inhalt generiert'
      }, { status: 500 })
    }

    // Parse the AI response
    const { title, metaDescription, content, excerpt } = parseArticle(aiResponse, cityName, tradeName)
    const wordCount = countWords(content)

    // Create slug
    const slug = `${tradeSlug}-${citySlug}-${Date.now()}`

    // Create article in database
    const { data: article, error: insertError } = await supabaseAdmin
      .from('articles')
      .insert({
        landing_page_id,
        title: custom_title || title,
        slug,
        content,
        excerpt,
        meta_description: metaDescription,
        meta_title: custom_title || title,
        status: 'draft',
        ai_generated: true,
        word_count: wordCount,
        generated_at: new Date().toISOString(),
        category: tradeSlug,
        tags: [tradeSlug, citySlug, 'ki-generated']
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save article', message: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        word_count: wordCount,
        status: article.status
      },
      cost_estimate: `~$${(wordCount / 1000 * 0.02).toFixed(4)}`,
      message: `KI-Artikel "${title}" mit ${wordCount} Wörtern erstellt`
    })

  } catch (error: any) {
    console.error('Generation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error.message 
    }, { status: 500 })
  }
}
