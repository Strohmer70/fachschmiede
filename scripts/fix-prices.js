const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Fehlende Umgebungsvariablen: NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function fixPrices() {
  console.log('🔧 Korrigiere Preise in der Datenbank...')
  console.log('   Von: 149 € (14900 cents)')
  console.log('   Nach: 189 € (18900 cents)')
  console.log('')

  // 1. Alle Pages mit 14900 cents finden
  const { data: pages, error: fetchError } = await supabaseAdmin
    .from('landing_pages')
    .select('id, slug, monthly_price')
    .eq('monthly_price', 14900)

  if (fetchError) {
    console.error('❌ Fehler beim Laden:', fetchError.message)
    process.exit(1)
  }

  if (!pages || pages.length === 0) {
    console.log('✅ Keine Pages mit 149 € gefunden — alles korrekt!')
    return
  }

  console.log(`📋 ${pages.length} Pages mit falschem Preis gefunden:`)
  pages.forEach(p => console.log(`   - ${p.slug}: ${p.monthly_price} cents`))
  console.log('')

  // 2. Alle auf 18900 cents aktualisieren
  const { error: updateError } = await supabaseAdmin
    .from('landing_pages')
    .update({ monthly_price: 18900 })
    .eq('monthly_price', 14900)

  if (updateError) {
    console.error('❌ Fehler beim Aktualisieren:', updateError.message)
    process.exit(1)
  }

  console.log(`✅ ${pages.length} Pages erfolgreich auf 189 € aktualisiert!`)
  console.log('')

  // 3. Prüfen, ob noch falsche Preise existieren
  const { data: check, error: checkError } = await supabaseAdmin
    .from('landing_pages')
    .select('slug, monthly_price')
    .eq('monthly_price', 14900)

  if (checkError) {
    console.error('❌ Fehler bei der Prüfung:', checkError.message)
    return
  }

  if (check && check.length > 0) {
    console.log(`⚠️  WARNUNG: ${check.length} Pages haben immer noch 149 €:`)
    check.forEach(p => console.log(`   - ${p.slug}`))
  } else {
    console.log('✅ Alle Preise sind jetzt korrekt (189 €)!')
  }
}

fixPrices().catch(err => {
  console.error('❌ Unerwarteter Fehler:', err)
  process.exit(1)
})
