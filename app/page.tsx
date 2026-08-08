import { readFileSync } from 'fs'
import { join } from 'path'

export default function HomePage() {
  const html = readFileSync(join(process.cwd(), 'public', 'start.html'), 'utf-8')
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
