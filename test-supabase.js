const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tlxlkmewbhnpzvrphcq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRseGxrbWV3YmhucHp2cmJwaGNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAzMzA2MSwiZXhwIjoyMDk5NjA5MDYxfQ.NfaeZ5ai8EubyA-4fVaT1WEEb2bBvj1WVpr7ZMaZvF0';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function test() {
  // Test 1: trades Tabelle
  const { data: trades, error: tradesErr } = await supabase.from('trades').select('*').limit(1);
  console.log('Trades:', tradesErr ? 'ERROR: ' + tradesErr.message : 'OK (' + (trades?.length || 0) + ' rows)');
  if (trades?.[0]) console.log('  Columns:', Object.keys(trades[0]).join(', '));

  // Test 2: cities Tabelle
  const { data: cities, error: citiesErr } = await supabase.from('cities').select('*').limit(1);
  console.log('Cities:', citiesErr ? 'ERROR: ' + citiesErr.message : 'OK (' + (cities?.length || 0) + ' rows)');
  if (cities?.[0]) console.log('  Columns:', Object.keys(cities[0]).join(', '));

  // Test 3: landing_pages Tabelle
  const { data: pages, error: pagesErr } = await supabase.from('landing_pages').select('*').limit(1);
  console.log('Landing Pages:', pagesErr ? 'ERROR: ' + pagesErr.message : 'OK (' + (pages?.length || 0) + ' rows)');
  if (pages?.[0]) console.log('  Columns:', Object.keys(pages[0]).join(', '));

  // Test 4: trade_requests Tabelle
  const { data: reqs, error: reqsErr } = await supabase.from('trade_requests').select('*').limit(1);
  console.log('Trade Requests:', reqsErr ? 'ERROR: ' + reqsErr.message : 'OK (' + (reqs?.length || 0) + ' rows)');
  if (reqs?.[0]) console.log('  Columns:', Object.keys(reqs[0]).join(', '));

  // Test 5: articles Tabelle
  const { data: articles, error: artErr } = await supabase.from('articles').select('*').limit(1);
  console.log('Articles:', artErr ? 'ERROR: ' + artErr.message : 'OK (' + (articles?.length || 0) + ' rows)');
  if (articles?.[0]) console.log('  Columns:', Object.keys(articles[0]).join(', '));

  // Test 6: generation_logs Tabelle
  const { data: logs, error: logsErr } = await supabase.from('generation_logs').select('*').limit(1);
  console.log('Generation Logs:', logsErr ? 'ERROR: ' + logsErr.message : 'OK (' + (logs?.length || 0) + ' rows)');
  if (!logsErr && logs?.[0]) console.log('  Columns:', Object.keys(logs[0]).join(', '));
}

test().catch(console.error);
