#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const PUBLIC_DIR = path.join(__dirname, '..', 'public')

const tradeMap = {
  'dach': 'dachdecker',
  'elek': 'elektriker',
  'shk': 'shk',
  'maler': 'maler',
  'zimm': 'zimmerer',
}

function extractTradeCity(filename) {
  // stadt-dach-hagen.html -> trade=dach, city=hagen
  // stadt-elek-wetter-ruhr.html -> trade=elek, city=wetter-ruhr
  const match = filename.match(/^stadt-([^-]+)-(.+)\.html$/)
  if (!match) return null
  
  const tradeKey = match[1]
  const citySlug = match[2]
  const trade = tradeMap[tradeKey]
  
  if (!trade) return null
  
  return { trade, city: citySlug }
}

function updateHtmlFile(filepath) {
  const filename = path.basename(filepath)
  const info = extractTradeCity(filename)
  
  if (!info) {
    console.log(`Skipping ${filename} - not a city page`)
    return
  }
  
  const blogUrl = `/${info.trade}/${info.city}/blog/`
  
  let content = fs.readFileSync(filepath, 'utf-8')
  
  // Replace the "Alle Beiträge" link
  const oldLink = /href="\/ratgeber[^"]*"/g
  const newLink = `href="${blogUrl}"`
  
  if (content.includes('/ratgeber')) {
    content = content.replace(oldLink, newLink)
    fs.writeFileSync(filepath, content)
    console.log(`✅ Updated ${filename} -> ${blogUrl}`)
  } else {
    console.log(`⏭️  Skipped ${filename} - no ratgeber link found`)
  }
}

// Find all stadt-*.html files
const files = fs.readdirSync(PUBLIC_DIR)
  .filter(f => f.startsWith('stadt-') && f.endsWith('.html'))
  .map(f => path.join(PUBLIC_DIR, f))

console.log(`Found ${files.length} city pages to update\n`)

files.forEach(updateHtmlFile)

console.log('\n✨ Done!')
