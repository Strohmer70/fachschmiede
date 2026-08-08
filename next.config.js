/** @type {import('next').NextConfig} */

// Mapping: Datei-Kürzel → URL-Slug
const TRADE_MAP = {
  dach: 'dachdecker',
  elek: 'elektriker',
  zimm: 'zimmerer',
  maler: 'maler',
  shk: 'shk',
}

// Generiere Rewrites für alle Stadt-HTML-Dateien
function generateCityRewrites() {
  const fs = require('fs')
  const path = require('path')
  
  const publicDir = path.join(__dirname, 'public')
  const files = fs.readdirSync(publicDir)
    .filter(f => f.startsWith('stadt-') && f.endsWith('.html'))
    .map(f => f.replace('.html', ''))
  
  const rewrites = []
  
  for (const file of files) {
    const parts = file.split('-')
    const tradeKey = parts[1]
    const citySlug = parts.slice(2).join('-')
    const tradeSlug = TRADE_MAP[tradeKey]
    
    if (tradeSlug && citySlug) {
      rewrites.push({
        source: `/${tradeSlug}/${citySlug}/`,
        destination: `/${file}.html`,
      })
    }
  }
  
  console.log(`✅ Generated ${rewrites.length} city rewrites`)
  return rewrites
}

// Generiere Rewrites für Blog-Artikel
function generateBlogRewrites() {
  const fs = require('fs')
  const path = require('path')
  
  const blogDir = path.join(__dirname, 'public', 'blog')
  const rewrites = []
  
  if (!fs.existsSync(blogDir)) {
    console.log('⚠️ No blog directory found')
    return rewrites
  }
  
  const trades = fs.readdirSync(blogDir)
  
  for (const tradeSlug of trades) {
    const tradeDir = path.join(blogDir, tradeSlug)
    if (!fs.statSync(tradeDir).isDirectory()) continue
    
    const cities = fs.readdirSync(tradeDir)
    
    for (const citySlug of cities) {
      const cityDir = path.join(tradeDir, citySlug)
      if (!fs.statSync(cityDir).isDirectory()) continue
      
      const articles = fs.readdirSync(cityDir)
        .filter(f => f.endsWith('.html'))
        .map(f => f.replace('.html', ''))
      
      for (const slug of articles) {
        rewrites.push({
          source: `/${tradeSlug}/${citySlug}/blog/${slug}/`,
          destination: `/blog/${tradeSlug}/${citySlug}/${slug}.html`,
        })
      }
    }
  }
  
  console.log(`✅ Generated ${rewrites.length} blog rewrites`)
  return rewrites
}

const nextConfig = {
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  
  async rewrites() {
    const cityRewrites = generateCityRewrites()
    const blogRewrites = generateBlogRewrites()
    
    return {
      beforeFiles: [
        // Blog-Artikel (statische HTML) - HÖCHSTE PRIORITÄT
        ...blogRewrites,
        
        // Portal-Startseite
        { source: '/', destination: '/start.html' },
        
        // Gewerk-Salespages
        { source: '/dachdecker/', destination: '/sales-dachdecker.html' },
        { source: '/elektriker/', destination: '/sales-elektriker.html' },
        { source: '/shk/', destination: '/sales-shk.html' },
        { source: '/maler/', destination: '/sales-maler.html' },
        { source: '/zimmerer/', destination: '/sales-zimmerer.html' },
        
        // Statische Seiten
        { source: '/impressum/', destination: '/impressum.html' },
        { source: '/datenschutz/', destination: '/datenschutz.html' },
        { source: '/admin/', destination: '/admin.html' },
        { source: '/mieter/', destination: '/mieter.html' },
        
        // Ratgeber/Blog
        { source: '/ratgeber/', destination: '/ratgeber.html' },
        { source: '/ratgeber-elektriker/', destination: '/ratgeber-elektriker.html' },
        { source: '/ratgeber-shk/', destination: '/ratgeber-shk.html' },
        { source: '/ratgeber-zimmerer/', destination: '/ratgeber-zimmerer.html' },
        { source: '/ratgeber-maler/', destination: '/ratgeber-maler.html' },
        
        // Artikel (Blogposts)
        { source: '/artikel-5-anzeichen-dachsanierung/', destination: '/artikel-5-anzeichen-dachsanierung.html' },
        { source: '/artikel-carport-bauen/', destination: '/artikel-carport-bauen.html' },
        { source: '/artikel-dachdaemmung-foerderung/', destination: '/artikel-dachdaemmung-foerderung.html' },
        { source: '/artikel-dachstuhl-sanieren/', destination: '/artikel-dachstuhl-sanieren.html' },
        { source: '/artikel-e-check-sicherheitspruefung/', destination: '/artikel-e-check-sicherheitspruefung.html' },
        { source: '/artikel-farben-raumwirkung/', destination: '/artikel-farben-raumwirkung.html' },
        { source: '/artikel-fassade-streichen-kosten/', destination: '/artikel-fassade-streichen-kosten.html' },
        { source: '/artikel-heizungs-check-winter/', destination: '/artikel-heizungs-check-winter.html' },
        { source: '/artikel-heizungstausch-foerderung/', destination: '/artikel-heizungstausch-foerderung.html' },
        { source: '/artikel-holzterrasse-pflegen/', destination: '/artikel-holzterrasse-pflegen.html' },
        { source: '/artikel-rohrbruch-sofortmassnahmen/', destination: '/artikel-rohrbruch-sofortmassnahmen.html' },
        { source: '/artikel-schimmel-wohnung/', destination: '/artikel-schimmel-wohnung.html' },
        { source: '/artikel-smart-home-nachruesten/', destination: '/artikel-smart-home-nachruesten.html' },
        { source: '/artikel-sturmschaden-sofortmassnahmen/', destination: '/artikel-sturmschaden-sofortmassnahmen.html' },
        { source: '/artikel-wallbox-zuhause/', destination: '/artikel-wallbox-zuhause.html' },
        
        // Musterseiten (Fallback für alte Links)
        { source: '/muster-dachdecker/', destination: '/index.html' },
        { source: '/muster-elektriker/', destination: '/elektriker.html' },
        { source: '/muster-shk/', destination: '/shk.html' },
        { source: '/muster-zimmerer/', destination: '/zimmerer.html' },
        { source: '/muster-maler/', destination: '/maler.html' },
        
        // City pages (dynamisch generiert)
        ...cityRewrites,
      ],
    }
  },
}

module.exports = nextConfig
