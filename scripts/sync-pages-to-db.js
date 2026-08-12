const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tlxlkmewbhnpzvrbphcq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRseGxrbWV3YmhucHp2cmJwaGNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAzMzA2MSwiZXhwIjoyMDk5NjA5MDYxfQ.NfaeZ5ai8EubyA-4fVaT1WEEb2bBvj1WVpr7ZMaZvF0'
);

async function sync() {
  console.log('🚀 Starte Landing Pages Sync...');
  
  // Get all trades and cities
  const { data: trades } = await supabase.from('trades').select('id,slug,name');
  const { data: cities } = await supabase.from('cities').select('id,slug,name');
  
  console.log('Trades:', trades?.length || 0);
  console.log('Cities:', cities?.length || 0);
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const trade of trades || []) {
    for (const city of cities || []) {
      const slug = trade.slug + '-' + city.slug;
      
      // Check if exists
      const { data: existing } = await supabase
        .from('landing_pages')
        .select('id')
        .eq('slug', slug)
        .single();
      
      if (!existing) {
        const tradeName = trade.slug === 'shk' ? 'Klempner' : trade.name;
        const { error: insertError } = await supabase
          .from('landing_pages')
          .insert({
            slug: slug,
            trade_id: trade.id,
            city_id: city.id,
            status: 'available',
            title: tradeName + ' ' + city.name + ' | Professionelle Handwerker',
            h1: 'Ihr ' + tradeName + ' in ' + city.name + ' – Zuverlässig, Fair, Vor Ort',
            meta_description: 'Professionelle ' + tradeName + ' in ' + city.name + '. Jetzt lokale Fachbetriebe finden.',
            monthly_price: 14900
          });
        
        if (insertError) {
          console.log('  ERROR ' + slug + ': ' + insertError.message);
          errors++;
        } else {
          console.log('  + ' + slug);
          created++;
        }
      } else {
        skipped++;
      }
    }
  }
  
  console.log('\n✅ Fertig!');
  console.log('  Erstellt: ' + created);
  console.log('  Übersprungen: ' + skipped);
  console.log('  Fehler: ' + errors);
}

sync().catch(console.error);
