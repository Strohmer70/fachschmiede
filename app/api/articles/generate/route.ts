import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { ARTICLE_TEMPLATES, getTemplateForSlug } from '@/lib/article-templates-v2'

function getRandomTemplateForTrade(tradeSlug: string) {
  const templates = ARTICLE_TEMPLATES[tradeSlug as keyof typeof ARTICLE_TEMPLATES]
  if (!templates || templates.length === 0) return null
  return templates[Math.floor(Math.random() * templates.length)]
}

function getAllTemplatesForTrade(tradeSlug: string) {
  return ARTICLE_TEMPLATES[tradeSlug as keyof typeof ARTICLE_TEMPLATES] || []
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).length
}

function generateArticleContent(template: any, cityName: string, tradeName: string, tradeSlug: string): string {
  let content = ''
  
  // H1
  content += `# ${template.h1(cityName, tradeName)}\n\n`
  
  // Sections
  for (const section of template.sections) {
    content += `## ${section.h2(cityName, tradeName, tradeSlug)}\n\n`
    content += `${section.content(cityName, tradeName, tradeSlug)}\n\n`
    
    if (section.hasList && section.listItems) {
      for (const item of section.listItems(cityName, tradeName)) {
        content += `- ${item}\n`
      }
      content += '\n'
    }
  }
  
  // FAQ
  const faqs = template.faq(cityName, tradeName)
  if (faqs.length > 0) {
    content += `## Häufig gestellte Fragen\n\n`
    for (const faq of faqs) {
      content += `**Q: ${faq.q}**\n\n`
      content += `${faq.a}\n\n`
    }
  }
  
  return content
}

function generateHTMLArticle(template: any, cityName: string, tradeName: string, tradeSlug: string, citySlug: string): string {
  const title = template.title(cityName, tradeName)
  const h1 = template.h1(cityName, tradeName)
  const metaDesc = template.metaDescription(cityName, tradeName)
  const content = generateArticleContent(template, cityName, tradeName, tradeSlug)
  const wordCount = countWords(content)
  
  // Schema.org JSON-LD
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": metaDesc,
    "author": {
      "@type": "Organization",
      "name": `${tradeName} ${cityName}`,
      "url": `https://fachschmiede.de/${tradeSlug}/${citySlug}/`
    },
    "publisher": {
      "@type": "Organization",
      "name": "fachschmiede.de"
    },
    "datePublished": new Date().toISOString().split('T')[0],
    "dateModified": new Date().toISOString().split('T')[0]
  }
  
  // Generate HTML sections
  let htmlSections = ''
  for (const section of template.sections) {
    const h2 = section.h2(cityName, tradeName, tradeSlug)
    const sectionContent = section.content(cityName, tradeName, tradeSlug)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>')
    
    htmlSections += `
      <section class="mb-8">
        <h2 class="text-2xl font-bold mb-4">${h2}</h2>
        <p class="text-gray-700 leading-relaxed">${sectionContent}</p>
    `
    
    if (section.hasList && section.listItems) {
      htmlSections += '<ul class="list-disc pl-6 mt-4 space-y-2">'
      for (const item of section.listItems(cityName, tradeName)) {
        htmlSections += `<li class="text-gray-700">${item}</li>`
      }
      htmlSections += '</ul>'
    }
    
    htmlSections += '</section>'
  }
  
  // FAQ HTML
  const faqs = template.faq(cityName, tradeName)
  let faqHTML = ''
  if (faqs.length > 0) {
    faqHTML = `
      <section class="mb-8 bg-gray-50 p-6 rounded-lg">
        <h2 class="text-2xl font-bold mb-4">Häufig gestellte Fragen</h2>
        <div class="space-y-4">
    `
    for (const faq of faqs) {
      faqHTML += `
        <div class="border-b pb-4">
          <h3 class="font-bold text-lg mb-2">${faq.q}</h3>
          <p class="text-gray-700">${faq.a}</p>
        </div>
      `
    }
    faqHTML += '</div></section>'
  }
  
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${metaDesc}">
  <script type="application/ld+json">${JSON.stringify(schemaData)}</script>
</head>
<body class="bg-white">
  <article class="max-w-4xl mx-auto px-4 py-8">
    <header class="mb-8">
      <h1 class="text-4xl font-bold mb-4">${h1}</h1>
      <p class="text-gray-600">Veröffentlicht am ${new Date().toLocaleDateString('de-DE')}</p>
    </header>
    
    ${htmlSections}
    ${faqHTML}
    
    <footer class="mt-8 pt-8 border-t">
      <p class="text-gray-600">© ${new Date().getFullYear()} fachschmiede.de</p>
    </footer>
  </article>
</body>
</html>`
}

// POST /api/articles/generate - Generate article using V2 templates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { landing_page_id, template_slug, custom_title } = body
    
    if (!landing_page_id) {
      return NextResponse.json({ error: 'landing_page_id is required' }, { status: 400 })
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
    
    if (!tradeSlug || !citySlug) {
      return NextResponse.json({ error: 'Trade or city not found' }, { status: 400 })
    }
    
    // Get template
    let template
    if (template_slug) {
      template = getTemplateForSlug(template_slug)
    }
    
    // If no template specified or not found, pick random one for this trade
    if (!template) {
      template = getRandomTemplateForTrade(tradeSlug)
    }
    
    if (!template) {
      return NextResponse.json({ error: `No templates found for trade: ${tradeSlug}` }, { status: 400 })
    }
    
    // Check for existing article with same template this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const { data: existing } = await supabaseAdmin
      .from('articles')
      .select('id')
      .eq('landing_page_id', landing_page_id)
      .eq('slug', template.slug)
      .gte('created_at', startOfMonth.toISOString())
      .single()
    
    if (existing) {
      return NextResponse.json({ 
        error: 'Article already exists for this template this month',
        message: 'Ein Artikel mit diesem Template wurde diesen Monat bereits erstellt'
      }, { status: 409 })
    }
    
    // Generate content
    const title = custom_title || template.title(cityName, tradeName)
    const metaDesc = template.metaDescription(cityName, tradeName)
    const content = generateArticleContent(template, cityName, tradeName, tradeSlug)
    const htmlContent = generateHTMLArticle(template, cityName, tradeName, tradeSlug, citySlug)
    const wordCount = countWords(content)
    
    // Create article in database
    const { data: article, error: insertError } = await supabaseAdmin
      .from('articles')
      .insert({
        landing_page_id,
        title,
        slug: `${template.slug}-${Date.now()}`,
        content,
        excerpt: metaDesc,
        meta_description: metaDesc,
        meta_title: title,
        status: 'draft',
        ai_generated: true,
        word_count: wordCount,
        generated_at: new Date().toISOString(),
        category: tradeSlug,
        tags: [tradeSlug, citySlug, template.category]
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create article', message: insertError.message }, { status: 500 })
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
      message: `Artikel "${title}" mit ${wordCount} Wörtern erstellt`
    })
    
  } catch (error: any) {
    console.error('Generation error:', error)
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 })
  }
}
