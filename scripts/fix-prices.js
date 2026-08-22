// Fix prices in database: Set all to 189€ (Basis) 
// Munich = 289€ (Pro), others = 189€ (Basis)

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixPrices() {
  // Update Munich to Pro (289€)
  await supabase
    .from('landing_pages')
    .update({ monthly_price: 28900 })
    .like('city_id', '%3e06da46%') // Munich
  
  // Update all others to Basis (189€)
  await supabase
    .from('landing_pages')
    .update({ monthly_price: 18900 })
    .neq('city_id', '3e06da46-0a2a-415d-a6bf-2b65a1d169ae')
  
  console.log('✅ Prices updated: Munich=289€, Others=189€')
}

fixPrices().catch(console.error)
