import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tlxlkmewbhnpzvrphcq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRseGxrbWV3YmhucHp2cmJwaGNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAzMzA2MSwiZXhwIjoyMDk5NjA5MDYxfQ.NfaeZ5ai8EubyA-4fVaT1WEEb2bBvj1WVpr7ZMaZvF0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data, error } = await supabase.from('landing_pages').select('slug, status').limit(3);
if (error) {
  console.error('❌ FEHLER:', error.message);
  process.exit(1);
}
console.log('✅ KEY FUNKTIONIERT!');
console.log('Daten:', JSON.stringify(data, null, 2));
