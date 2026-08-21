import RentPageClient from './RentPageClient'

interface PageProps {
  params: {
    slug: string
  }
}

export default function RentPage({ params }: PageProps) {
  return <RentPageClient params={{ slug: params.slug }} />
}
