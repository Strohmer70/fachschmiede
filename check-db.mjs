import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tlxlkmewbhnpzvrphcq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRseGxrbWV3YmhucHp2cmJwaGNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAzMzA2MSwiZXhwIjoyMDk5NjA5MDYxfQ.NfaeZ5ai8EubyA-4fVaT1WEEb2bBvj1WVpr7ZMaZvF0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const tables = ['landing_pages', 'leads', 'tenants', 'trades', 'cities'];
for (const t of tables) {
  const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
  console.log(`${t}: ${error ? '❌ ' + error.message : count + ' rows'}`);
}
