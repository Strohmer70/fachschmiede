// Seed: Outreach-Ziele (echte Targets aus dem Research — nur confident Quellen, keine Phantasie-Mails)
const { createClient } = require('@supabase/supabase-js');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error('❌ SUPABASE_SERVICE_ROLE_KEY fehlt'); process.exit(1); }
const sb = createClient('https://tlxlkmewbhnpzvrbphcq.supabase.co', key, { auth: { persistSession: false } });

const TARGETS = [
  // Gastartikel — echte deutsche Bau-/Handwerk-Redaktionen (aus Research verifiziert)
  { title: 'bauredakteur.de', url: 'https://www.bauredakteur.de', type: 'guestpost', notes: 'Bau-Fachredaktion, nimmt Gastbeiträge — Thema: Handwerker-Webseiten/Local SEO' },
  { title: 'heimwerker.de', url: 'https://www.heimwerker.de', type: 'guestpost', notes: 'Große Heimwerker-Community — Kooperation/Gastartikel "Webseite fürs Handwerk"' },
  // Presse — Selbstbedienung (notes erklären den Weg)
  { title: 'openPR.de — Pressemitteilung', url: 'https://www.openpr.de', type: 'press', notes: 'SELBST einreichen: Account → Pressemitteilung "fachschmiede.de startet Webseiten-Mietmodell für Handwerker"' },
  { title: 'presseportal.de — PM einreichen', url: 'https://www.presseportal.de', type: 'press', notes: 'SELBST einreichen (kostenlose Basisveröffentlichung) — gleiche PM wie openPR' },
  // Podcasts — reale deutsche Marketing/Handwerk-Podcasts (Anfrage: Gast zum Thema Local SEO/Handwerk digital)
  { title: 'Podcast-Anfragen (Marketing/Handwerk)', type: 'podcast', notes: 'Podcast-Gast werden: Podcast-Hosts per E-Mail anfragen — Pitch: "Webseiten zur Miete: Neues Geschäftsmodell für Handwerker" (3 Min-Vorstellung in Episoden-Notizen = Backlink!)' },
  // Agentur-Verzeichnisse — Profil anlegen (Selbstbedienung, authority backlink)
  { title: 'Clutch.co — Agentur-Profil', url: 'https://clutch.co', type: 'directory', notes: 'SELBST anlegen: kostenloses Firmenprofil fachschmiede.de → Kategorie "Web Design / SEO Germany"' },
  { title: 'Sortlist.de — Agentur-Profil', url: 'https://www.sortlist.de', type: 'directory', notes: 'SELBST anlegen: Profil als Web-Design-Agentur (DACH) — DoFollow in den meisten Paketen prüfen' },
  { title: 'Designer-Depot / Agenturverzeichnisse', type: 'directory', notes: 'Weitere kostenlose Agentur-Verzeichnisse sammeln (awesome-submitlist als Blaupause: github.com/alvinunreal/awesome-submitlist)' },
];

(async () => {
  const { data: existing } = await sb.from('outreach_prospects').select('title');
  const have = new Set((existing || []).map(r => r.title));
  const toAdd = TARGETS.filter(t => !have.has(t.title));
  if (!toAdd.length) { console.log('✓ Alles schon drin:', TARGETS.length, 'Ziele'); process.exit(0); }
  const { data, error } = await sb.from('outreach_prospects').insert(toAdd.map(t => ({ ...t, status: 'research' }))).select('id');
  if (error) { console.error('❌', error.message); process.exit(1); }
  console.log(`✓ ${data.length} Outreach-Ziele ergänzt (gesamt: ${have.size + data.length})`);
  data.forEach(r => console.log('  +', r.id));
})();
