#!/usr/bin/env node
/**
 * fix-sales-domains.js
 * ====================
 * Ersetzt auf den 6 Salespages die fiktiven Domain-Labels
 * "dachdecker-hagen-muster.de" → "fachschmiede.de/dachdecker/hagen/"
 * und den JS-Domain-Builder dementsprechend.
 */

const fs = require('fs')
const path = require('path')
const PUBLIC = path.join(__dirname, '..', 'public')

const TRADE_PATH = {
  dachdecker: 'dachdecker',
  elektriker: 'elektriker',
  garten: 'garten-und-landschaftsbau',
  klempner: 'klempner',
  maler: 'maler',
  zimmerei: 'zimmerer',
}

const files = fs.readdirSync(PUBLIC).filter((f) => f.startsWith('sales-') && f.endsWith('.html'))
let totalLabels = 0
let totalJs = 0

for (const file of files) {
  const fp = path.join(PUBLIC, file)
  let html = fs.readFileSync(fp, 'utf8')
  let labels = 0
  let js = 0

  // 1. Sichtbare Labels: <p class="text-sm text-ink-500 mt-0.5">PREFIX-STADT-muster.de</p>
  html = html.replace(
    /<p class="text-sm text-ink-500 mt-0\.5">(dachdecker|elektriker|garten|klempner|maler|zimmerei)-([a-z-]+)-muster\.de<\/p>/g,
    (m, prefix, city) => {
      labels++
      return `<p class="text-sm text-ink-500 mt-0.5">fachschmiede.de/${TRADE_PATH[prefix]}/${city}/</p>`
    }
  )

  // 2. JS-Domain-Builder (Onboarding-Speicher + ggf. weitere Vorkommen)
  const tradeSlug = file.replace('sales-', '').replace('.html', '')
  const tPath = TRADE_PATH[tradeSlug] || tradeSlug
  html = html.split(`DOMAIN_PREFIX + '-' + slug + '-muster.de'`).join(`'fachschmiede.de/${tPath}/' + slug + '/'`)
  js = (fs.readFileSync(fp, 'utf8').match(/DOMAIN_PREFIX \+ '-' \+ slug \+ '-muster\.de'/g) || []).length

  if (labels || js) {
    fs.writeFileSync(fp, html)
    totalLabels += labels
    totalJs += js
    console.log(`✅ ${file}: ${labels} Labels, ${js} JS-Stellen`)
  } else {
    console.log(`— ${file}: nichts zu tun`)
  }
}

console.log(`\nGesamt: ${totalLabels} Labels + ${totalJs} JS-Stellen ersetzt`)
