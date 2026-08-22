import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import CheckoutFlow from './CheckoutFlow'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    slug: string
  }
}

// Statische Seiten zur Build-Zeit generieren
export async function generateStaticParams() {
  try {
    const { data: pages } = await supabase
      .from('landing_pages')
      .select('slug')
      .limit(200)
    
    return (pages || []).map((p: { slug: string }) => ({
      slug: p.slug,
    }))
  } catch {
    // Fallback: bekannte Slugs
    return [
      { slug: 'elektriker-bochum' },
      { slug: 'dachdecker-dortmund' },
      { slug: 'klempner-hagen' },
    ]
  }
}

export default async function RentPage({ params }: PageProps) {
  const { data: page } = await supabase
    .from('landing_pages')
    .select(`*, trade:trades(*), city:cities(*)`)
    .eq('slug', params.slug)
    .single()

  if (!page) {
    notFound()
  }

  if (page.status !== 'available') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Bereits vermietet</h1>
          <p className="text-slate-600 mb-6">Diese Seite ist bereits an einen Handwerker vermietet.</p>
          <a href="/" className="inline-flex items-center bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl transition">
            Andere Seiten ansehen
          </a>
        </div>
      </div>
    )
  }

  return <CheckoutFlow page={page} />
}
