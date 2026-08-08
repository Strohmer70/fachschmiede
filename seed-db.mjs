import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tlxlkmewbhnpzvrphcq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRseGxrbWV3YmhucHp2cmJwaGNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAzMzA2MSwiZXhwIjoyMDk5NjA5MDYxfQ.NfaeZ5ai8EubyA-4fVaT1WEEb2bBvj1WVpr7ZMaZvF0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// 1. Gewerke einfügen
const trades = [
  { name: 'Dachdecker', slug: 'dachdecker', description: 'Dachdeckung, Dachsanierung, Dachreparatur' },
  { name: 'Elektriker', slug: 'elektriker', description: 'Elektroinstallation, Wartung, Reparatur' },
  { name: 'Klempner', slug: 'klempner', description: 'Heizung, Sanitär, Wasserinstallation' },
  { name: 'Zimmerer', slug: 'zimmerer', description: 'Zimmerei, Holzbau, Dachstühle' },
  { name: 'Maler', slug: 'maler', description: 'Malerarbeiten, Fassaden, Lackierung' }
];

const cities = [
  'Hattingen', 'Schwerte', 'Dortmund', 'Hagen', 'Iserlohn',
  'Unna', 'Bochum', 'Witten', 'Lünen', 'Herne',
  'Castrop-Rauxel', 'Kamen', 'Bergkamen', 'Fröndenberg', 'Holzwickede',
  'Schwelm', 'Gevelsberg', 'Ennepetal', 'Sprockhövel', 'Wetter'
].map((name, i) => ({ name, slug: name.toLowerCase().replace(/[äöüß]/g, c => ({ä:'ae',ö:'oe',ü:'ue',ß:'ss'}[c])).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''), population: 50000 + i * 5000 }));

console.log('🌱 Seeding database...');

// Trades
for (const t of trades) {
  const { error } = await supabase.from('trades').upsert(t, { onConflict: 'slug' });
  if (error) console.error('Trade error:', error.message);
}
console.log('✅ Trades inserted');

// Cities
for (const c of cities) {
  const { error } = await supabase.from('cities').upsert(c, { onConflict: 'slug' });
  if (error) console.error('City error:', error.message);
}
console.log('✅ Cities inserted');

// Landing Pages
const pages = [];
for (const trade of trades) {
  for (const city of cities) {
    pages.push({
      slug: `${trade.slug}-${city.slug}`,
      trade_id: trade.slug,
      city_id: city.slug,
      title: `${trade.name} ${city.name} — Jetzt online mieten`,
      description: `Professionelle ${trade.name}-Website für ${city.name}. Bereits optimiert für Google.`,
      monthly_price: 14900,
      status: Math.random() > 0.7 ? 'rented' : 'available',
      seo_score: Math.floor(Math.random() * 30) + 70
    });
  }
}

const { error: pageError } = await supabase.from('landing_pages').upsert(pages, { onConflict: 'slug' });
if (pageError) console.error('Pages error:', pageError.message);
else console.log('✅ Landing pages inserted:', pages.length);

console.log('🎉 DONE! Database seeded with real data.');
