import RentPageClient from './RentPageClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    slug: string
  }
}

export default function RentPage({ params }: PageProps) {
  return <RentPageClient params={{ slug: params.slug }} />
}
