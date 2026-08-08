import { notFound } from 'next/navigation'
import { readFileSync } from 'fs'
import { join } from 'path'

interface PageProps {
  params: {
    trade: string
    city: string
    slug: string
  }
}

export async function generateStaticParams() {
  // Nur für existierende Dateien
  return [
    { trade: 'dachdecker', city: 'hattingen', slug: 'dachdaemmung-foerderung' },
    { trade: 'dachdecker', city: 'hattingen', slug: 'e-check-sicherheit' },
    { trade: 'dachdecker', city: 'hattingen', slug: 'heizungstausch-foerderung' },
  ];
}

export default async function ArticlePage({ params }: PageProps) {
  try {
    const filePath = join(process.cwd(), 'public', 'blog', params.trade, params.city, `${params.slug}.html`);
    const html = readFileSync(filePath, 'utf-8');
    
    return (
      <div dangerouslySetInnerHTML={{ __html: html }} />
    );
  } catch (err) {
    notFound();
  }
}
