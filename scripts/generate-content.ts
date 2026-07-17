// Content Generation Script for fachschmiede.de
// Generates unique content for each trade+city combination

import { trades, cities } from '../lib/data.js'
import fs from 'fs'
import path from 'path'

interface PageContent {
  slug: string
  trade: string
  tradeSlug: string
  city: string
  citySlug: string
  state: string
  district: string
  population: string
  localLandmark: string
  weatherPattern: string
  localBuildingType: string
  h1: string
  metaTitle: string
  metaDescription: string
  intro: string
  services: Array<{title: string, desc: string}>
  faq: Array<{q: string, a: string}>
  testimonials: Array<{name: string, location: string, text: string}>
  status: string
  priceMonthly: number
}

// Generate unique intro paragraph
function generateIntro(trade: any, city: any): string {
  const templates = [
    `${city.name} ist eine Stadt mit besonderen Herausforderungen für jeden ${trade.name}. Von den historischen Altbauten in ${city.district} bis zu modernen Neubauten — jedes Gebäude erfordert spezialisiertes Fachwissen. ${city.weatherPattern} setzen den Bauten der Region erheblich zu. Als lokaler ${trade.name} kennen wir die spezifischen Anforderungen der ${city.name}er Architektur und bieten maßgeschneiderte Lösungen.`,
    
    `In ${city.name} leben über ${city.population} Menschen — und jedes Gebäude brauht früher oder später einen zuverlässigen ${trade.name}. Besonders bei ${trade.buildingTypes} sind die Anforderungen hoch. Die typischen ${city.landmark}-nahen Wohngebiete zeichnen sich durch ${city.buildingTypes} aus, die spezialisiertes Know-how erfordern.`,
    
    `Als Ihr ${trade.name} in ${city.name} kennen wir die lokalen Gegebenheiten genau. ${city.weatherPattern} erfordern regelmäßige Wartung und schnelle Reaktion bei Schäden. Wir sind spezialisiert auf ${trade.buildingTypes} und bieten Lösungen, die perfekt auf ${city.name} abgestimmt sind.`,
  ]
  
  // Deterministic but varied selection based on slug
  const index = (trade.slug.length + city.slug.length) % templates.length
  return templates[index]
}

// Generate unique meta description
function generateMetaDesc(trade: any, city: any): string {
  const templates = [
    `Ihr zuverlässiger ${trade.name} in ${city.name}. Professioneller Service für ${trade.description}. Kostenlose Beratung vor Ort. Jetzt Termin vereinbaren!`,
    `${trade.name} ${city.name} ✓ Lokale Expertise ✓ Faire Preise ✓ Schneller Service. Spezialisiert auf ${trade.buildingTypes}.`,
    `Experten für ${trade.description} in ${city.name}. Vertrauen Sie auf lokale Fachkenntnis für ${city.buildingTypes}. Jetzt Angebot einholen!`,
  ]
  const index = (trade.slug.charCodeAt(0) + city.slug.charCodeAt(0)) % templates.length
  return templates[index]
}

// Generate services with local context
function generateServices(trade: any, city: any): Array<{title: string, desc: string}> {
  const baseServices = trade.services.map((service: string) => {
    const localAdditions = [
      ` — spezialisiert auf die typischen ${city.buildingTypes} in ${city.name}.`,
      ` — mit schnellem Vor-Ort-Service in ${city.district} und Umgebung.`,
      ` — angepasst an die lokalen Bauvorschriften und Gegebenheiten von ${city.name}.`,
      ` — erfahren mit über 500 Projekten in der Region ${city.name}.`,
    ]
    const idx = (service.length + city.slug.length) % localAdditions.length
    return {
      title: service,
      desc: `Professionelle Ausführung${localAdditions[idx]}`,
    }
  })
  return baseServices
}

// Generate FAQ with local context
function generateFAQ(trade: any, city: any): Array<{q: string, a: string}> {
  return [
    {
      q: `Wie viel kostet eine typische ${trade.name}-Leistung in ${city.name}?`,
      a: `Die Kosten variieren je nach Umfang. In ${city.name} liegen die Preise im regionalen Durchschnitt. Kleine Aufträge starten ab 150 €, größere Projekte zwischen 1.000 € und 10.000 €. Wir erstellen Ihnen gerne ein kostenloses Angebot vor Ort in ${city.district} oder Umgebung.`,
    },
    {
      q: `Wie schnell können Sie in ${city.name} vor Ort sein?`,
      a: `Dank unserer Standortnähe in ${city.district} können wir in der Regel innerhalb von 24-48 Stunden einen Termin vereinbaren. Bei Notfällen bieten wir auch einen Express-Service für ${city.name} und Umgebung an.`,
    },
    {
      q: `Sind Sie für ${city.buildingTypes} spezialisiert?`,
      a: `Absolut. Wir haben langjährige Erfahrung mit den typischen Gebäudetypen in ${city.name}, insbesondere in den Bezirken rund um ${city.district}. ${city.industryNotes}`,
    },
    {
      q: `Arbeiten Sie auch bei Notfällen in ${city.name}?`,
      a: `Ja, wir bieten einen Notdienst für ${city.name} und die umliegenden Stadtteile an. Bei akuten Problemen sind wir schnell vor Ort, um weitere Schäden zu vermeiden.`,
    },
    {
      q: `Benötige ich Genehmigungen für Arbeiten in ${city.name}?`,
      a: `Für die meisten Arbeiten ist keine Genehmigung nötig. Bei äußerlichen Veränderungen oder bei Arbeiten an denkmalgeschützten Gebäuden (häufig in ${city.name}) kann eine Genehmigung erforderlich sein. Wir beraten Sie gerne zu den aktuellen Bauvorschriften in ${city.state}.`,
    },
  ]
}

// Generate testimonials with local names
function generateTestimonials(trade: any, city: any): Array<{name: string, location: string, text: string}> {
  const firstNames = ['Michael', 'Sabine', 'Thomas', 'Anna', 'Stefan', 'Laura', 'Andreas', 'Julia', 'Markus', 'Sarah']
  const lastInitials = ['S.', 'K.', 'W.', 'M.', 'B.', 'L.', 'H.', 'G.', 'R.', 'P.']
  
  const texts = [
    `Schnelle Reaktion, faire Preise und top Qualität. Absolut empfehlenswert für jeden, der einen zuverlässigen ${trade.name} in ${city.name} sucht!`,
    `Endlich mal ein Fachbetrieb, der pünktlich kommt und sauber arbeitet. Die Zusammenarbeit verlief völlig reibungslos.`,
    `Nach dem Notfall waren sie innerhalb kürzester Zeit vor Ort. Professioneller Service, der sein Geld wert ist.`,
    `Habe bereits mehrere Projekte mit ihnen umgesetzt. Immer zufrieden, immer fair. Ein echter Geheimtipp in ${city.name}.`,
    `Die Beratung war ausführlich und ehrlich. Keine versteckten Kosten, keine Überraschungen. Genau so soll Service sein.`,
  ]
  
  const districts = [city.district, city.name + ' Nord', city.name + ' West', city.name + ' Ost', 'Innenstadt']
  
  return texts.slice(0, 3).map((text, i) => ({
    name: `${firstNames[(i + city.slug.length) % firstNames.length]} ${lastInitials[(i + trade.slug.length) % lastInitials.length]}`,
    location: districts[i % districts.length],
    text,
  }))
}

// Generate a single page
function generatePage(trade: any, city: any): PageContent {
  const slug = `${trade.slug}-${city.slug}`
  
  return {
    slug,
    trade: trade.name,
    tradeSlug: trade.slug,
    city: city.name,
    citySlug: city.slug,
    state: city.state,
    district: city.district,
    population: city.population,
    localLandmark: city.landmark,
    weatherPattern: city.weatherPattern,
    localBuildingType: city.buildingTypes,
    h1: `Professioneller ${trade.name} in ${city.name} — ${city.district} & Umland`,
    metaTitle: `${trade.name} ${city.name} | Professioneller Service vor Ort`,
    metaDescription: generateMetaDesc(trade, city),
    intro: generateIntro(trade, city),
    services: generateServices(trade, city),
    faq: generateFAQ(trade, city),
    testimonials: generateTestimonials(trade, city),
    status: 'available',
    priceMonthly: 149,
  }
}

// Generate all pages
export function generateAllPages(): PageContent[] {
  const pages: PageContent[] = []
  
  for (const trade of trades) {
    for (const city of cities) {
      pages.push(generatePage(trade, city))
    }
  }
  
  return pages
}

// Save pages as JSON for static generation
function main() {
  const pages = generateAllPages()
  const outputDir = path.join(process.cwd(), 'generated')
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'pages.json'),
    JSON.stringify(pages, null, 2)
  )
  
  console.log(`✅ Generated ${pages.length} unique pages`)
  console.log(`📁 Saved to: ${outputDir}/pages.json`)
  
  // Print sample
  console.log('\n📄 Sample page (first one):')
  const sample = pages[0]
  console.log(`   Slug: ${sample.slug}`)
  console.log(`   H1: ${sample.h1}`)
  console.log(`   Meta: ${sample.metaDescription.substring(0, 80)}...`)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
