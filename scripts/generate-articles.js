#!/usr/bin/env node
/**
 * Artikel-Generierungs-Script
 * 
 * Nutzung:
 *   node scripts/generate-articles.js [trade] [city] [count]
 *   
 * Beispiele:
 *   node scripts/generate-articles.js                    # Alle Städte & Gewerke
 *   node scripts/generate-articles.js dachdecker         # Nur Dachdecker
 *   node scripts/generate-articles.js dachdecker hattingen  # Nur Hattingen
 *   node scripts/generate-articles.js all all 5          # 5 Artikel pro Kombination
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tlxlkmewbhnpzvrphcq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Trade & City Daten
const TRADES = {
  dachdecker: { name: 'Dachdecker', plural: 'Dachdecker' },
  elektriker: { name: 'Elektriker', plural: 'Elektriker' },
  shk: { name: 'Klempner', plural: 'Klempner' },
  maler: { name: 'Maler', plural: 'Maler' },
  zimmerer: { name: 'Zimmerer', plural: 'Zimmerer' },
};

const CITIES = {
  'bergkamen': { name: 'Bergkamen', state: 'Nordrhein-Westfalen' },
  'bochum': { name: 'Bochum', state: 'Nordrhein-Westfalen' },
  'castrop-rauxel': { name: 'Castrop-Rauxel', state: 'Nordrhein-Westfalen' },
  'dortmund': { name: 'Dortmund', state: 'Nordrhein-Westfalen' },
  'ennepetal': { name: 'Ennepetal', state: 'Nordrhein-Westfalen' },
  'froendenberg': { name: 'Fröndenberg', state: 'Nordrhein-Westfalen' },
  'gevelsberg': { name: 'Gevelsberg', state: 'Nordrhein-Westfalen' },
  'hagen': { name: 'Hagen', state: 'Nordrhein-Westfalen' },
  'hattingen': { name: 'Hattingen', state: 'Nordrhein-Westfalen' },
  'herne': { name: 'Herne', state: 'Nordrhein-Westfalen' },
  'holzwickede': { name: 'Holzwickede', state: 'Nordrhein-Westfalen' },
  'iserlohn': { name: 'Iserlohn', state: 'Nordrhein-Westfalen' },
  'kamen': { name: 'Kamen', state: 'Nordrhein-Westfalen' },
  'luenen': { name: 'Lünen', state: 'Nordrhein-Westfalen' },
  'schwelm': { name: 'Schwelm', state: 'Nordrhein-Westfalen' },
  'schwerte': { name: 'Schwerte', state: 'Nordrhein-Westfalen' },
  'sprockhoevel': { name: 'Sprockhövel', state: 'Nordrhein-Westfalen' },
  'unna': { name: 'Unna', state: 'Nordrhein-Westfalen' },
  'wetter-ruhr': { name: 'Wetter (Ruhr)', state: 'Nordrhein-Westfalen' },
  'witten': { name: 'Witten', state: 'Nordrhein-Westfalen' },
};

// Templates laden
const templates = require('../lib/article-templates').ARTICLE_TEMPLATES;
const fillTemplate = require('../lib/article-templates').fillTemplate;

async function generateArticles() {
  const args = process.argv.slice(2);
  const targetTrade = args[0] === 'all' ? null : args[0];
  const targetCity = args[1] === 'all' ? null : args[1];
  const articleCount = parseInt(args[2]) || 3; // Default: 3 Start-Artikel
  
  console.log('🚀 Starte Artikel-Generierung...');
  console.log(`   Trade: ${targetTrade || 'alle'}`);
  console.log(`   City: ${targetCity || 'alle'}`);
  console.log(`   Artikel pro Kombination: ${articleCount}`);
  
  const tradesToProcess = targetTrade ? [targetTrade] : Object.keys(TRADES);
  const citiesToProcess = targetCity ? [targetCity] : Object.keys(CITIES);
  
  let totalGenerated = 0;
  let totalSkipped = 0;
  
  for (const tradeSlug of tradesToProcess) {
    const trade = TRADES[tradeSlug];
    if (!trade) {
      console.warn(`⚠️ Unbekanntes Gewerk: ${tradeSlug}`);
      continue;
    }
    
    for (const citySlug of citiesToProcess) {
      const city = CITIES[citySlug];
      if (!city) {
        console.warn(`⚠️ Unbekannte Stadt: ${citySlug}`);
        continue;
      }
      
      console.log(`\n🏗️  ${trade.name} ${city.name}:`);
      
      // Prüfe, ob es schon Artikel gibt
      const { data: existing } = await supabase
        .from('articles')
        .select('slug')
        .eq('trade_id', tradeSlug)
        .eq('city_id', citySlug);
      
      const existingSlugs = new Set(existing?.map(a => a.slug) || []);
      
      // Wähle Templates für dieses Gewerk
      const availableTemplates = templates.filter(t => 
        t.category === tradeSlug || t.category === 'allgemein'
      );
      
      // Generiere fehlende Artikel
      let generated = 0;
      for (let i = 0; i < articleCount; i++) {
        const template = availableTemplates[i % availableTemplates.length];
        
        if (existingSlugs.has(template.slug)) {
          console.log(`   ⏭️  ${template.slug} existiert bereits`);
          totalSkipped++;
          continue;
        }
        
        const variables = {
          stadt: city.name,
          gewerk: trade.name,
          bundesland: city.state,
          jahr: new Date().getFullYear().toString(),
        };
        
        const article = {
          slug: template.slug,
          trade_id: tradeSlug,
          city_id: citySlug,
          title: fillTemplate(template.title_template, variables),
          h1: fillTemplate(template.h1_template || template.title_template, variables),
          meta_description: fillTemplate(template.meta_description_template, variables),
          content: fillTemplate(template.content_template, variables),
          excerpt: fillTemplate(template.excerpt_template, variables),
          status: 'published',
          is_auto_generated: true,
          published_at: new Date().toISOString(),
        };
        
        const { error } = await supabase.from('articles').insert(article);
        
        if (error) {
          console.error(`   ❌ Fehler bei ${template.slug}:`, error.message);
        } else {
          console.log(`   ✅ ${template.slug}`);
          generated++;
          totalGenerated++;
        }
      }
      
      if (generated === 0 && existingSlugs.size >= articleCount) {
        console.log(`   ℹ️  Alle ${articleCount} Artikel bereits vorhanden`);
      }
    }
  }
  
  console.log(`\n🎉 Fertig!`);
  console.log(`   Generiert: ${totalGenerated}`);
  console.log(`   Übersprungen: ${totalSkipped}`);
  console.log(`   Gesamt: ${totalGenerated + totalSkipped}`);
}

generateArticles().catch(err => {
  console.error('❌ Fehler:', err);
  process.exit(1);
});
