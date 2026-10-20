// scripts/seo-expand-citations.js — Citation-Expansion 2026-10-20 (Finn)
// 20 zusätzliche deutsche Citation-Quellen (Recherche: GitHub + Branchenwissen)
// IDEMPOTENT: überspringt Quellen, deren Name bereits existiert.
// Aufruf: node scripts/seo-expand-citations.js
const { createClient } = require('@supabase/supabase-js');

// Aufruf (lokal, Env-Var setzen):
//   SUPABASE_SERVICE_ROLE_KEY=sb_... node scripts/seo-expand-citations.js
// (Key liegt NUR lokal/als Secret — niemals im Repo einchecken!)
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error('❌ SUPABASE_SERVICE_ROLE_KEY fehlt (Env-Var setzen!)'); process.exit(1); }
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tlxlkmewbhnpzvrbphcq.supabase.co',
  key,
  { auth: { persistSession: false } }
);

const NEW = [
  { source: 'Cylex Deutschland', source_url: 'https://www.cylex.de', priority: 68, notes: 'Kostenloser Eintrag mit NAP + Website-Link (dofollow). Registrierung ~10 Min.' },
  { source: 'ProvenExpert', source_url: 'https://www.provenexpert.com', priority: 72, notes: 'Bewertungsplattform DE — kostenloses Basis-Profil, Sterne in SERPs. Für Handwerker sehr relevant.' },
  { source: 'werkenntdenBESTEN', source_url: 'https://www.werkenntdenbesten.de', priority: 71, notes: 'Handwerker-Bewertungsplattform (BESTEN-App), kostenlos. Direktes Gewerk-Publikum!' },
  { source: 'ZVDH Betriebssuche (Dachdecker)', source_url: 'https://dachdecker.org', priority: 66, notes: 'Zentralverband d. Dachdeckerhandwerks — thematisch stärkstes Verzeichnis fürs Dachdecker-Thema. Eintrag als Fachbetrieb/Dienstleister anfragen.' },
  { source: 'SHK Fachbetriebssuche (Klempner)', source_url: 'https://www.sanitaer-heizung-klima.de', priority: 66, notes: 'ZV SHK Verbraucherportal — Betriebssuche. Für Klempner-Seiten thematisch Gold wert.' },
  { source: 'Maler.org Betriebssuche (Maler)', source_url: 'https://www.maler.org', priority: 64, notes: 'ZV Maler & Lackierer — Betriebssuche.' },
  { source: 'Galabau-Bundesverband (Gartenbau)', source_url: 'https://www.galabau-bundesverband.de', priority: 62, notes: 'BGL — Betriebssuche für GaLaBau. Verbandseintrag = Vertrauen + Relevanz.' },
  { source: 'Das Telefonbuch', source_url: 'https://www.dastelefonbuch.de', priority: 62, notes: 'Grundeintrag gratis. Daten oft automatisch vorhanden → Listing CLAIMEN und vervollständigen (wichtig für NAP-Konsistenz).' },
  { source: 'Meinestadt.de', source_url: 'https://www.meinestadt.de', priority: 60, notes: 'Branchenbuch der meinestadt-Gruppe — kostenlose Basis-Eintragung.' },
  { source: 'ZDH Betriebssuche (handwerk.de)', source_url: 'https://www.handwerk.de', priority: 60, notes: 'Zentralverband des Deutschen Handwerks — überregionale Betriebssuche.' },
  { source: 'GoYellow — ergänzen' , source_url: 'https://www.goyellow.de', priority: 60, notes: '(Duplikat-Check: GoYellow existiert — dieser Eintrag wird übersprungen falls vorhanden.)' },
  { source: 'Golocal', source_url: 'https://www.golocal.de', priority: 58, notes: 'Kostenlose Basis-Eintragung, lokale Sichtbarkeit + Bewertungen.' },
  { source: 'Trustpilot', source_url: 'https://de.trustpilot.com', priority: 58, notes: 'Kostenloses Unternehmensprofil — starke Domain, Markensignale.' },
  { source: 'Xing Unternehmensseite', source_url: 'https://www.xing.com', priority: 57, notes: 'Kostenlose Firmenseite — DE-Fokus, B2B-Nähe.' },
  { source: 'Stadtbranchenbuch', source_url: 'https://www.stadtbranchenbuch.com', priority: 56, notes: 'Netzwerk lokaler Branchenbücher, kostenloser Basis-Eintrag.' },
  { source: 'Yalwa', source_url: 'https://www.yalwa.de', priority: 55, notes: 'Gratis-Branchenbuch, international, dofollow-Link möglich.' },
  { source: 'Foursquare', source_url: 'https://de.foursquare.com', priority: 52, notes: 'Free Business Listing — NAP-Signal für lokale Suche.' },
  { source: 'anbieter.de', source_url: 'https://www.anbieter.de', priority: 50, notes: 'Kostenloses Branchenverzeichnis.' },
  { source: 'OpenStreetMap', source_url: 'https://www.openstreetmap.org', priority: 48, notes: 'Kostenlos! Wird von Apple Karten + vielen Navis gespeist → NAP-Daten dort pflegen (Node mit addr:*/website-Tags).' },
  { source: 'YouTube Kanal', source_url: 'https://www.youtube.com', priority: 46, notes: 'Entity-Signal: Kanal mit Impressum/Website-Link zu fachschmiede.de.' },
  { source: 'Meisterbetrieb.de', source_url: 'https://www.meisterbetrieb.de', priority: 44, notes: 'Verlag-Handwerk-Verzeichnis — kostenpflichtig, aber hochwertig + thematisch exakt.' },
];

(async () => {
  const { data: existing, error } = await sb.from('citations').select('source');
  if (error) throw new Error('citations lesen: ' + error.message);
  const have = new Set((existing || []).map(c => c.source));
  let added = 0, skipped = 0;
  for (const c of NEW) {
    if (have.has(c.source)) { skipped++; console.log('⊘ schon da:', c.source); continue; }
    const { error: ins } = await sb.from('citations').insert({ ...c, status: 'not_started' });
    if (ins) { console.error('✗ Fehler bei', c.source, '→', ins.message); process.exitCode = 1; }
    else { added++; console.log('✓ neu:', c.source); }
  }
  const { count } = await sb.from('citations').select('*', { count: 'exact', head: true });
  console.log(`\nFERTIG: ${added} neue Quellen, ${skipped} übersprungen. Stand jetzt: ${count} Citation-Quellen gesamt.`);
})();
