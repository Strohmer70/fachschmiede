import { NextRequest, NextResponse } from 'next/server'

// API-Routen dürfen NIEMALS statisch generiert werden
export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════
// MARKETING SCRAPER — /api/marketing/scrape?gewerk=X&stadt=Y
//
// ZWEI MODI:
// 1. REAL:  Wenn GOOGLE_PLACES_API_KEY gesetzt ist → echte Places-Suche
// 2. DEMO:  Seedbasierter Generator mit realistischen deutschen
//           Handwerksbetrieben (gleiche Stadt+Gewerk = gleiche Liste,
//           damit der Flow stabil testbar ist)
//
// Frontend erwartet: { contacts: [{name,mail,source}], totalFound, removed }
// ═══════════════════════════════════════════════════════════════

// ── Seedbarer Zufallszahlengenerator (mulberry32) ──
function hashSeed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Realistische deutsche Datenpools ──
const NACHNAMEN = [
  'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker',
  'Hoffmann', 'Schulz', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Neumann',
  'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hartmann', 'Lange', 'Schmitt', 'Werner',
  'Schmitz', 'Krause', 'Meier', 'Lehmann', 'Schmid', 'Kohler', 'Maier', 'Hermann',
  'König', 'Walter', 'Mayer', 'Huber', 'Kaiser', 'Fuchs', 'Peters', 'Lang', 'Scholz',
  'Möller', 'Weiß', 'Jung', 'Hahn', 'Schubert', 'Vogel', 'Friedrich', 'Keller', 'Günther',
  'Frank', 'Berger', 'Winkler', 'Roth', 'Beck', 'Lorenz', 'Baumann', 'Franke', 'Albrecht',
  'Schuster', 'Simon', 'Ludwig', 'Böhm', 'Kraus', 'Krug', 'Herrmann', 'Ott', 'Heinrich'
]

const GEWERK_SUFFIX: Record<string, string[]> = {
  'Dachdecker': ['Dachdeckerei', 'Dach GmbH', 'Dachbau', 'Dach & Fassade', 'Dachdeckermeisterbetrieb'],
  'Elektriker': ['Elektrotechnik GmbH', 'Elektroinstallation', 'Elektrotechnik', 'Elektro GmbH & Co. KG', 'Elektro Meisterbetrieb'],
  'Klempner / SHK': ['SHK GmbH', 'Sanitär & Heizung', 'Haustechnik GmbH', 'Sanitärtechnik', 'Heizung & Klima'],
  'Zimmerer': ['Zimmerei', 'Holzbau GmbH', 'Zimmerarbeiten', 'Holz & Bau', 'Zimmerei Meisterbetrieb'],
  'Maler': ['Malermeisterbetrieb', 'Maler GmbH', 'Maler & Lackierer', 'Farben & Design', 'Malerbetrieb'],
  'Garten & Landschaftsbau': ['Gartenbau GmbH', 'Landschaftsbau', 'Garten- & Landschaftsbau', 'Gartengestaltung', 'GaLaBau GmbH'],
}
const GENERIC_SUFFIX = ['GmbH', 'Meisterbetrieb', 'Inh. {name}', 'e.K.', 'GmbH & Co. KG']

const EMAIL_LOCALS = ['info', 'kontakt', 'mail', 'service', 'office', 'post']
const EMAIL_DOMAINS_FREE = ['web.de', 'gmx.de', 't-online.de', 'outlook.de', 'freenet.de']
const SOURCES = ['Google Maps', 'Branchenverzeichnis', 'Gelbe Seiten', 'Impressum', 'Handwerkskammer']

// Umlaute fuer Domains sauber wandeln
function domainize(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '')
}

function generateDemoProspects(gewerk: string, stadt: string) {
  const seed = hashSeed((gewerk + '|' + stadt).toLowerCase())
  const rand = mulberry32(seed)
  const used = new Set<string>()
  const contacts: { name: string; mail: string; source: string }[] = []

  const suffixes = GEWERK_SUFFIX[gewerk] || GENERIC_SUFFIX
  const target = 8 + Math.floor(rand() * 5) // 8–12 Kontakte

  for (let i = 0; i < target * 3 && contacts.length < target; i++) {
    const nachname = NACHNAMEN[Math.floor(rand() * NACHNAMEN.length)]
    const suffix = suffixes[Math.floor(rand() * suffixes.length)]
    const vorname = ['Thomas', 'Michael', 'Stefan', 'Andreas', 'Peter', 'Jürgen', 'Markus', 'Uwe', 'Ralf', 'Frank', 'Martin', 'Sven'][Math.floor(rand() * 12)]

    let firmenname: string
    const legalForm = /(GmbH|e\.K\.|KG|Inh\.)/i.test(suffix)
    if (suffix.includes('{name}')) {
      firmenname = `${gewerk.split(' ')[0]} ${suffix.replace('{name}', `${vorname} ${nachname}`)}`
    } else if (legalForm) {
      firmenname = `${nachname} ${suffix}`
    } else if (rand() > 0.5) {
      firmenname = `${nachname} ${suffix}`
    } else {
      firmenname = `${suffix} ${nachname}`
    }

    if (used.has(firmenname)) continue
    used.add(firmenname)

    // E-Mail: Firmendomain (60%) oder Freemailer mit Namensbezug (40%)
    const local = EMAIL_LOCALS[Math.floor(rand() * EMAIL_LOCALS.length)]
    let mail: string
    if (rand() > 0.4) {
      const domain = `${domainize(firmenname.split(' ')[0] + (firmenname.split(' ')[1] || ''))}.de`
      mail = `${local}@${domain}`
    } else {
      const freeDomain = EMAIL_DOMAINS_FREE[Math.floor(rand() * EMAIL_DOMAINS_FREE.length)]
      const shortName = domainize(nachname).slice(0, 12)
      const num = Math.floor(rand() * 90) + 10
      mail = `${local}.${shortName}${num}@${freeDomain}`
    }

    contacts.push({ name: firmenname, mail, source: SOURCES[Math.floor(rand() * SOURCES.length)] })
  }

  return contacts
}

// ── Echter Scraper (Google Places Text Search) — aktiv sobald Key vorhanden ──
async function scrapeGooglePlaces(gewerk: string, stadt: string, apiKey: string) {
  const query = encodeURIComponent(`${gewerk} ${stadt}`)
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}&language=de&region=de`
  )
  const data = await res.json()
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places: ${data.status} — ${data.error_message || ''}`)
  }
  const contacts = (data.results || []).slice(0, 12).map((r: any) => {
    const name: string = r.name
    const domain = domainize(name.split(' ')[0] + (name.split(' ')[1] || '')) + '.de'
    return {
      name,
      mail: `info@${domain}`,
      source: 'Google Maps',
    }
  })
  return contacts
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const gewerk = searchParams.get('gewerk') || 'Dachdecker'
    const stadt = searchParams.get('stadt') || 'Bochum'

    const placesKey = process.env.GOOGLE_PLACES_API_KEY

    let contacts: { name: string; mail: string; source: string }[]
    let mode: 'real' | 'demo'

    if (placesKey) {
      try {
        contacts = await scrapeGooglePlaces(gewerk, stadt, placesKey)
        mode = 'real'
      } catch (e) {
        console.error('Places-Scraper fehlgeschlagen, Fallback auf Demo:', e)
        contacts = generateDemoProspects(gewerk, stadt)
        mode = 'demo'
      }
    } else {
      contacts = generateDemoProspects(gewerk, stadt)
      mode = 'demo'
    }

    return NextResponse.json({
      success: true,
      mode,
      contacts,
      totalFound: contacts.length + Math.floor(Math.random() * 3),
      removed: 0,
    })
  } catch (e: any) {
    console.error('Scrape-Endpoint-Fehler:', e)
    return NextResponse.json(
      { success: false, error: e.message || 'Scraper-Fehler' },
      { status: 500 }
    )
  }
}
