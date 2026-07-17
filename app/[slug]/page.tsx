import { notFound, redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface PageProps {
  params: {
    slug: string
  }
}

export default async function SlugRedirect({ params }: PageProps) {
  const slug = params.slug
  
  // Check if this is a valid landing page slug (e.g., "dachdecker-hattingen")
  const { data: page } = await supabase
    .from('landing_pages')
    .select('slug, trade:trades(slug), city:cities(slug)')
    .eq('slug', slug)
    .single()

  if (!page) notFound()

  const tradeSlug = page.trade?.slug || page.trade?.[0]?.slug
  const citySlug = page.city?.slug || page.city?.[0]?.slug

  if (!tradeSlug || !citySlug) notFound()

  // Redirect to the proper SEO-friendly URL
  redirect(`/${tradeSlug}/${citySlug}`)
}
