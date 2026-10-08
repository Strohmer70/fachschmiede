#!/usr/bin/env node
/**
 * generate-city.js — CLI für die Stadt-Generierung
 *
 * Usage:
 *   node scripts/generate-city.js --city halver                     # Dry-Run (nur Summary)
 *   node scripts/generate-city.js --city halver --write             # Dateien lokal schreiben
 *   node scripts/generate-city.js --city halver --write --db        # + DB-Zeilen anlegen (Pooler/pg)
 *   node scripts/generate-city.js --city halver --trades dachdecker --write --db
 */
const fs = require('fs')
const path = require('path')
const { generateCity, TRADES } = require('./lib/city-gen')

const ROOT = path.join(__dirname, '..')
const args = process.argv.slice(2)
const getArg = (k) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : null }
const hasFlag = (k) => args.includes('--' + k)

const citySlug = getArg('city')
if (!citySlug) { console.error('Fehlendes --city <slug>'); process.exit(1) }
const tradesArg = getArg('trades') ? getArg('trades').split(',').map(s => s.trim()) : null
const WRITE = hasFlag('write')
const DO_DB = hasFlag('db')

// Pooler-Config (IPv4-tauglich; direkter db.-Host ist IPv6-only → sandbox kann nicht)
const DB_CONF = {
  host: process.env.SUPABASE_POOLER_HOST || 'aws-0-eu-central-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.tlxlkmewbhnpzvrbphcq',
  password: process.env.SUPABASE_DB_PASSWORD || 'D.Str0Hmer70',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
}

async function withPg(fn) {
  const { Client } = require('pg')
  const c = new Client(DB_CONF)
  await c.connect()
  try { return await fn(c) } finally { await c.end() }
}

async function main() {
  const orteJson = fs.readFileSync(path.join(ROOT, 'public/data/de-orte.json'), 'utf-8')

  const templateFiles = {}
  for (const t of Object.values(TRADES)) {
    const tplPath = `stadt-${t.key}-witten.html`
    templateFiles['stadt/' + tplPath] = fs.readFileSync(path.join(ROOT, 'public', tplPath), 'utf-8')
    const blogDir = path.join(ROOT, 'public/blog', t.articleDir, 'witten')
    if (fs.existsSync(blogDir)) {
      for (const f of fs.readdirSync(blogDir)) {
        if (f.endsWith('.html')) {
          templateFiles[`blog/${t.articleDir}/witten/${f}`] = fs.readFileSync(path.join(blogDir, f), 'utf-8')
        }
      }
    }
  }

  const salesFiles = {}
  for (const fname of ['sales-dachdecker.html', 'sales-elektriker.html', 'sales-klempner.html', 'sales-maler.html', 'sales-zimmerer.html', 'sales-garten-und-landschaftsbau.html']) {
    salesFiles[fname] = fs.readFileSync(path.join(ROOT, 'public', fname), 'utf-8')
  }

  const systemConfig = fs.readFileSync(path.join(ROOT, 'config/system-config.js'), 'utf-8')
  const articleIndex = fs.readFileSync(path.join(ROOT, 'lib/article-index.json'), 'utf-8')
  const staticPages = fs.readdirSync(path.join(ROOT, 'public')).filter(f => f.endsWith('.html'))
  const stadtFiles = fs.readdirSync(path.join(ROOT, 'public')).filter(f => f.startsWith('stadt-') && f.endsWith('.html'))

  let existingSlugs = []
  if (DO_DB) {
    existingSlugs = await withPg(async (c) => {
      const r = await c.query('SELECT slug FROM public.landing_pages LIMIT 5000')
      return r.rows.map(p => p.slug)
    })
  } else {
    // Dry-Run/Write ohne DB: Slugs aus Dateinamen ableiten (stadt-{key}-{city} → {trade}-{city})
    const KEY2TRADE = { dach: 'dachdecker', elek: 'elektriker', zimm: 'zimmerer', maler: 'maler', shk: 'klempner', klempner: 'klempner', garten: 'garten-und-landschaftsbau' }
    existingSlugs = stadtFiles.map(f => {
      const m = f.match(/^stadt-([a-z]+)-(.+)\.html$/)
      return m ? `${KEY2TRADE[m[1]] || m[1]}-${m[2]}` : null
    }).filter(Boolean)
  }

  const result = generateCity(citySlug, { trades: tradesArg }, {
    orteJson, templateFiles, salesFiles, systemConfig, articleIndex, staticPages, stadtFiles, existingSlugs,
    baseUrl: 'https://www.fachschmiede.de',
  })

  console.log('\n=== GENERIERUNG: ' + citySlug + ' ===')
  result.log.forEach(l => console.log('  ' + l))
  console.log(`\n${result.files.length} Dateien, ${result.db.landingPages.length} DB-Seiten`)

  if (WRITE) {
    for (const f of result.files) {
      const p = path.join(ROOT, f.path)
      fs.mkdirSync(path.dirname(p), { recursive: true })
      fs.writeFileSync(p, f.content)
      console.log('  geschrieben: ' + f.path)
    }
  } else {
    console.log('\n(Dry-Run — kein --write, nichts geschrieben)')
  }

  if (DO_DB && result.db.landingPages.length) {
    await withPg(async (c) => {
      const cd = result.db.city
      // City anlegen/lookup
      let cityRow = (await c.query('SELECT id FROM public.cities WHERE slug=$1', [cd.slug])).rows[0]
      if (!cityRow) {
        cityRow = (await c.query(
          'INSERT INTO public.cities (name, slug, state, population) VALUES ($1,$2,$3,$4) RETURNING id',
          [cd.name, cd.slug, cd.region, cd.population || null]
        )).rows[0]
        console.log('  DB: city angelegt', cityRow.id)
      }
      // Preis-SSOT: platform_settings.pricing = {"monthly": 99} → Cent-Betrag
      const pr = await c.query("SELECT value FROM public.platform_settings WHERE key='pricing'")
      let price = 9900
      try { price = (parseInt(pr.rows[0].value.monthly) || 99) * 100 } catch (e) { /* Fallback */ }
      for (const lp of result.db.landingPages) {
        const t = (await c.query('SELECT id, name FROM public.trades WHERE slug=$1', [lp.trade_slug])).rows[0]
        if (!t) { console.warn('  SKIP trade?', lp.trade_slug); continue }
        const exists = (await c.query('SELECT id FROM public.landing_pages WHERE slug=$1', [lp.slug])).rows[0]
        if (exists) { console.log('  DB: skip (existiert)', lp.slug); continue }
        await c.query(
          `INSERT INTO public.landing_pages (trade_id, city_id, slug, title, meta_description, h1, status, monthly_price, content_json, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,'available',$7,$8, now())`,
          [t.id, cityRow.id, lp.slug, lp.title,
           `${t.name} in ${cd.name} ✓ Festpreis ✓ Kostenlose Besichtigung. Jetzt anfragen!`,
           lp.title, price, JSON.stringify({ hero_title: lp.title })]
        )
        console.log('  DB: landing_page', lp.slug)
      }
      // GRANT-Safety (siehe MEMORY.md: extern erstellte Tabellen brauchen Grants — bei INSERT irrelevant, aber sicher ist sicher)
    })
    console.log('\nDB fertig.')
  }
}

main().catch(e => { console.error('\nFEHLER:', e.message); process.exit(1) })
