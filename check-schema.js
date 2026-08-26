const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tlxlkmewbhnpzvrphcq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRseGxrbWV3YmhucHp2cmJwaGNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAzMzA2MSwiZXhwIjoyMDk5NjA5MDYxfQ.NfaeZ5ai8EubyA-4fVaT1WEEb2bBvj1WVpr7ZMaZvF0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function check() {
  const { data: lp } = await supabase.from('landing_pages').select('*').limit(1);
  console.log('LANDING_PAGES columns:', lp?.[0] ? Object.keys(lp[0]).join(', ') : 'no data');

  const { data: art } = await supabase.from('articles').select('*').limit(1);
  console.log('ARTICLES columns:', art?.[0] ? Object.keys(art[0]).join(', ') : 'no data');

  const { data: tr } = await supabase.from('trades').select('*').limit(1);
  console.log('TRADES columns:', tr?.[0] ? Object.keys(tr[0]).join(', ') : 'no data');
}

check().catch(console.error);
