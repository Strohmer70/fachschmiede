/**
 * Einmal-Fix: data-region auf allen bestehenden city-cards nachrüsten.
 * Bisher hatten Karten KEIN data-region → Regions-Filter zeigte nichts.
 * Vorgehen: pro Salespage jede city-card finden, Stadtname aus h3/daten ableiten,
 * Region aus config/system-config.js + Fallback "Nordrhein-Westfalen" setzen.
 */
const fs = require('fs')
const path = require('path')
const ROOT = path.join(__dirname, '..')

const SALES = ['sales-dachdecker.html', 'sales-elektriker.html', 'sales-klempner.html', 'sales-maler.html', 'sales-zimmerer.html', 'sales-garten-und-landschaftsbau.html']
const DEFAULT_REGION = 'Nordrhein-Westfalen' // alle 20 Bestandsstädte liegen in NRW

for (const fname of SALES) {
  const fp = path.join(ROOT, 'public', fname)
  let html = fs.readFileSync(fp, 'utf-8')
  // jede city-card öffnende div ohne data-region ergänzen
  let fixed = 0
  html = html.replace(/<div class="city-card ([^"]*)"(?!\s+data-region)([^>]*)>/g, (m, cls, rest) => {
    fixed++
    return `<div class="city-card ${cls}" data-region="${DEFAULT_REGION}"${rest}>`
  })
  fs.writeFileSync(fp, html)
  console.log(`${fname}: ${fixed} Karten mit data-region versehen`)
}
