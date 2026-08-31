import { readFileSync } from 'fs'
import { join } from 'path'

// eslint-disable-next-line @next/next/no-img-element
export default function HomePage() {
  const html = readFileSync(join(process.cwd(), 'public', 'start.html'), 'utf-8')
  // eslint-disable-next-line react/no-danger
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
