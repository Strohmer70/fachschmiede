#!/usr/bin/env node
/**
 * Fix: Ersetze {city} Platzhalter durch tatsächliche Stadtnamen
 * in allen Blog-Artikeln
 */

const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, '..', 'public', 'blog');

function capitalizeCity(citySlug) {
  return citySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

let fixed = 0;

const trades = fs.readdirSync(blogDir);
for (const trade of trades) {
  const tradeDir = path.join(blogDir, trade);
  if (!fs.statSync(tradeDir).isDirectory()) continue;
  
  const cities = fs.readdirSync(tradeDir);
  for (const city of cities) {
    const cityDir = path.join(tradeDir, city);
    if (!fs.statSync(cityDir).isDirectory()) continue;
    
    const cityName = capitalizeCity(city);
    
    const articles = fs.readdirSync(cityDir).filter(f => f.endsWith('.html'));
    for (const article of articles) {
      const filePath = path.join(cityDir, article);
      let content = fs.readFileSync(filePath, 'utf-8');
      
      // Ersetze {city} durch Stadtnamen
      if (content.includes('{city}')) {
        content = content.replace(/{city}/g, cityName);
        fs.writeFileSync(filePath, content, 'utf-8');
        fixed++;
      }
    }
  }
}

console.log(`✅ ${fixed} Artikel gefixed`);
