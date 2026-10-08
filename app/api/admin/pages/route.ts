import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'
// Side-effect-Imports: Dateien physikalisch ins Serverless-Bundle ziehen
// (Vercel nft-Trace), damit die Engine sie per fs.readFileSync lesen kann.
import '../../../../config/system-config.js'
import articleIndexJson from '../../../../lib/article-index.json'
// @ts-ignore — CJS-Engine (scripts/lib), allowJs aktiv
import { generateCity, TRADES } from '../../../../scripts/lib/city-gen.js'

export const maxDuration = 60 // GitHub-Commit + Generierung brauchen Luft

const GITHUB_REPO = 'Strohmer70/fachschmiede'
const BASE_URL = 'https://www.fachschmiede.de'
const SALES_FILES = ['sales-dachdecker.html', 'sales-elektriker.html', 'sales-klempner.html', 'sales-maler.html', 'sales-zimmerer.html', 'sales-garten-und-landschaftsbau.html']

// ─── Auth (wie gehabt) ───────────────────────────────────────────
function getSecret(): string {
  return process.env.ADMIN_SECRET || process.env.SESSION_SECRET || process.env.STRIPE_SECRET_KEY || ''
}

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const adminToken = request.headers.get('x-admin-token')
  const secret = getSecret()
  if (authHeader === `Bearer ${secret}`) return true
  if (adminToken && adminToken === secret) return true
  return false
}

// ─── GitHub: alle generierten Dateien in EINEM Commit ────────────
async function ghApi(path: string, opts: { method?: string; body?: any } = {}) {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN nicht konfiguriert (Vercel Env fehlt)')
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/${path}`, {
    method: opts.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`GitHub ${opts.method || 'GET'} ${path}: ${res.status} ${t.slice(0, 200)}`)
  }
  return res.json()
}

async function commitFilesToGitHub(files: { path: string; content: string }[], message: string) {
  // 1) aktueller Branch-Stand
  const ref = await ghApi('git/ref/heads/main')
  const baseCommit = await ghApi(`git/commits/${ref.object.sha}`)
  // 2) Blobs erzeugen (sequentiell, serverless-sicher)
  const treeItems = []
  for (const f of files) {
    const blob = await ghApi('git/blobs', { method: 'POST', body: { content: f.content, encoding: 'utf-8' } })
    treeItems.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha })
  }
  // 3) Tree auf Basis des aktuellen Commits
  const tree = await ghApi('git/trees', { method: 'POST', body: { base_tree: baseCommit.tree.sha, tree: treeItems } })
  // 4) Commit + Ref-Update
  const commit = await ghApi('git/commits', {
    method: 'POST',
    body: { message, tree: tree.sha, parents: [ref.object.sha] },
  })
  await ghApi('git/ref/heads/main', { method: 'PATCH', body: { sha: commit.sha, force: false } })
  return commit.sha
}

// ─── ctx für die Engine aufbauen (fs-reads laufen auf Vercel) ────
function buildEngineCtx(existingSlugs: string[]) {
  const pub = join(process.cwd(), 'public')
  const orteJson = readFileSync(join(pub, 'data', 'de-orte.json'), 'utf-8')

  const templateFiles: Record<string, string> = {}
  for (const t of Object.values(TRADES) as any[]) {
    const tpl = join(pub, `stadt-${t.key}-witten.html`)
    if (existsSync(tpl)) templateFiles[`stadt/stadt-${t.key}-witten.html`] = readFileSync(tpl, 'utf-8')
    const blogDir = join(pub, 'blog', t.articleDir, 'witten')
    if (existsSync(blogDir)) {
      for (const f of readdirSync(blogDir)) {
        if (f.endsWith('.html')) templateFiles[`blog/${t.articleDir}/witten/${f}`] = readFileSync(join(blogDir, f), 'utf-8')
      }
    }
  }
  const salesFiles: Record<string, string> = {}
  for (const f of SALES_FILES) salesFiles[f] = readFileSync(join(pub, f), 'utf-8')

  const systemConfig = readFileSync(join(process.cwd(), 'config', 'system-config.js'), 'utf-8')
  const articleIndex = JSON.stringify(articleIndexJson)
  const staticPages = readdirSync(pub).filter((f: string) => f.endsWith('.html'))
  const stadtFiles = readdirSync(pub).filter((f: string) => f.startsWith('stadt-') && f.endsWith('.html'))

  return { orteJson, templateFiles, salesFiles, systemConfig, articleIndex, staticPages, stadtFiles, existingSlugs, baseUrl: BASE_URL }
}

// ─── GET: Liste aller Pages ──────────────────────────────────────
export async function GET(request: Request) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ success: false, error: 'Nicht authentifiziert' }, { status: 401 })
    }
    const { data: pages, error } = await supabaseAdmin
      .from('landing_pages')
      .select('id, slug, title, status, monthly_price, rented_by, created_at, page_views, trades(name, slug), cities(name, slug, state)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ success: true, pages })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// ─── POST: Stadt + alle Gewerke erzeugen (DB + Dateien + Deploy) ─
export async function POST(request: Request) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ success: false, error: 'Nicht authentifiziert' }, { status: 401 })
    }
    const body = await request.json()
    const { city_slug, city_name, trades, region } = body

    if (!city_slug) {
      return NextResponse.json({ success: false, error: 'city_slug ist erforderlich ( aus dem Orte-Dropdown wählen )' }, { status: 400 })
    }
    // Slug hardening (nur erlaubte Zeichen)
    const citySlug = String(city_slug).toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-|-$/g, '')
    if (!citySlug) {
      return NextResponse.json({ success: false, error: 'Ungültiger city_slug' }, { status: 400 })
    }

    const tradesWanted: string[] = Array.isArray(trades) && trades.length ? trades : Object.keys(TRADES)
    for (const t of tradesWanted) {
      if (!TRADES[t as keyof typeof TRADES]) {
        return NextResponse.json({ success: false, error: `Unbekanntes Gewerk: ${t}` }, { status: 400 })
      }
    }

    // existierende Slugs (für Skip-Logik + 409-Early-Exit)
    const { data: existingPages } = await supabaseAdmin.from('landing_pages').select('slug').limit(5000)
    const existingSlugs = (existingPages || []).map((p: any) => p.slug)
    const wantedSlugs = tradesWanted.map(t => `${t}-${citySlug}`)
    if (wantedSlugs.every(s => existingSlugs.includes(s))) {
      return NextResponse.json({ success: false, error: 'Diese Stadt-Websites existieren bereits (alle gewählten Gewerke)' }, { status: 409 })
    }

    // ── Engine: Dateien generieren ──
    let result
    try {
      result = generateCity(citySlug, { trades: tradesWanted }, buildEngineCtx(existingSlugs))
    } catch (e: any) {
      return NextResponse.json({ success: false, error: 'Generierung fehlgeschlagen: ' + e.message }, { status: 400 })
    }
    if (!result.files.length && !result.db.landingPages.length) {
      return NextResponse.json({ success: false, error: 'Nichts zu tun — alle Seiten existieren bereits' }, { status: 409 })
    }

    // ── DB: City + Landing Pages ──
    const cd = result.db.city
    let cityRow = null
    const { data: foundCity } = await supabaseAdmin.from('cities').select('id, name').eq('slug', citySlug).maybeSingle()
    cityRow = foundCity
    if (!cityRow) {
      const { data: newCity, error: cityError } = await supabaseAdmin
        .from('cities')
        .insert({ name: cd.name, slug: cd.slug, state: cd.region, population: cd.population || null })
        .select('id')
        .single()
      if (cityError) throw new Error('Stadt anlegen: ' + cityError.message)
      cityRow = newCity
    }

    // Preis-SSOT
    const { data: pricingRow } = await supabaseAdmin.from('platform_settings').select('value').eq('key', 'pricing').maybeSingle()
    let monthlyPrice = 9900
    try { monthlyPrice = (parseInt(pricingRow?.value?.monthly) || 99) * 100 } catch { /* Fallback 99 € */ }

    const createdPages: string[] = []
    for (const lp of result.db.landingPages) {
      const { data: tradeRow } = await supabaseAdmin.from('trades').select('id, name').eq('slug', lp.trade_slug).single()
      if (!tradeRow) continue
      const { error: pageError } = await supabaseAdmin.from('landing_pages').insert({
        trade_id: tradeRow.id,
        city_id: cityRow.id,
        slug: lp.slug,
        title: lp.title,
        meta_description: `${tradeRow.name} in ${cd.name} ✓ Festpreis ✓ Kostenlose Besichtigung. Jetzt anfragen!`,
        h1: lp.title,
        content_json: generateContentJson(lp.trade_slug, cd.name),
        status: 'available',
        monthly_price: monthlyPrice,
      })
      if (pageError) {
        if (pageError.code === '23505') continue // Duplicate → skip
        throw new Error('Landing Page ' + lp.slug + ': ' + pageError.message)
      }
      createdPages.push(lp.slug)
    }

    // ── GitHub: alle Dateien in EINEM Commit → Vercel-Deploy ──
    let deploy = { committed: false, sha: null as string | null, error: null as string | null }
    if (result.files.length && process.env.GITHUB_TOKEN) {
      try {
        const sha = await commitFilesToGitHub(
          result.files,
          `feat: Stadt ${cd.name} — ${result.db.landingPages.length || tradesWanted.length} Gewerkseiten + Blog + Salespage-Verlinkung`
        )
        deploy = { committed: true, sha, error: null }
      } catch (e: any) {
        deploy = { committed: false, sha: null, error: e.message }
      }
    } else if (result.files.length && !process.env.GITHUB_TOKEN) {
      deploy = { committed: false, sha: null, error: 'GITHUB_TOKEN fehlt — Dateien nicht committed (Vercel Env setzen!)' }
    }

    return NextResponse.json({
      success: true,
      city: cd,
      pages_created: createdPages,
      files_planned: result.files.length,
      skipped: result.log.filter(l => l.startsWith('SKIP')),
      log: result.log,
      deploy,
      message: deploy.committed
        ? `${cd.name}: ${createdPages.length} Seiten in der DB, ${result.files.length} Dateien committed (${deploy.sha?.slice(0, 7)}). Deploy läuft — in ~3 Minuten live!`
        : `${cd.name}: ${createdPages.length} Seiten in der DB angelegt. HINWEIS: ${deploy.error || 'kein Deploy ausgelöst'}`,
    })
  } catch (error: any) {
    console.error('Admin pages POST error:', error)
    return NextResponse.json({ success: false, error: 'Server-Fehler', message: error.message }, { status: 500 })
  }
}

// ─── Content-JSON (alle 6 Gewerke + korrekte Labels) ─────────────
function generateContentJson(tradeSlug: string, city: string) {
  const names: Record<string, string> = {
    dachdecker: 'Dachdecker', elektriker: 'Elektriker', klempner: 'Klempner / SHK',
    maler: 'Maler', zimmerer: 'Zimmerer', 'garten-und-landschaftsbau': 'Garten- & Landschaftsbau',
  }
  const trade = names[tradeSlug] || tradeSlug
  const templates: Record<string, any> = {
    dachdecker: {
      hero_title: `${trade} in ${city}. Festpreis. Feste Termine.`,
      hero_subtitle: `Ein Dach zeigt seine Schwächen meist erst, wenn es zu spät ist – undichte Stellen, lose Ziegel, verstopfte Rinnen. In ${city} schauen wir uns Ihr Dach kostenlos an und sagen Ihnen ehrlich, was nötig ist und was warten kann.`,
    },
    elektriker: {
      hero_title: `${trade} in ${city}. Sicher. Kompetent. Vor Ort.`,
      hero_subtitle: `Ob Stromausfall, neue Elektroinstallation oder Smart-Home-Umstellung – in ${city} sind wir Ihr zuverlässiger Partner für alle elektrischen Arbeiten. Kostenlose Erstberatung vor Ort.`,
    },
    klempner: {
      hero_title: `${trade} in ${city}. Schnell. Sauber. Zuverlässig.`,
      hero_subtitle: `Rohrbruch, Heizungsausfall oder Badsanierung – in ${city} sind wir Ihr Ansprechpartner für alle Arbeiten rund um Wasser, Wärme und Bad. Schnelle Hilfe, faire Festpreise.`,
    },
    maler: {
      hero_title: `${trade} in ${city}. Farbe mit Charakter.`,
      hero_subtitle: `Ob Fassade, Wohnraum oder Bodenbelag – in ${city} bringen wir Farbe in Ihr Projekt. Kostenlose Farbberatung und Festpreis-Garantie inklusive.`,
    },
    zimmerer: {
      hero_title: `${trade} in ${city}. Handwerk in Holz.`,
      hero_subtitle: `Vom Carport bis zur Dachkonstruktion – in ${city} planen und bauen wir nach Maß. Kostenlose Beratung und verbindliche Festpreise.`,
    },
    'garten-und-landschaftsbau': {
      hero_title: `Garten- & Landschaftsbau in ${city}. Gärten zum Wohlfühlen.`,
      hero_subtitle: `Ob neue Terrasse, Zaun oder komplette Gartengestaltung – in ${city} verwandeln wir Ihren Außenbereich in einen Wohlfühlort. Kostenlose Beratung vor Ort.`,
    },
  }
  return templates[tradeSlug] || { hero_title: `${trade} in ${city}` }
}
