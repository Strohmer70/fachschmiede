// scripts/seo-seed-partner-links.js — Fachbetrieb-/Partner-Link-Strategie 2026-10-20 (Finn)
// Seedet ~24 hochwertige Link-Ziele in den Backlink-Tracker (Status: geplant).
// Fokus: Hersteller-Fachbetrieb-Verzeichnisse (thematisch stärkste Links fürs Gewerk),
// PR-Portale (kostenlose PMs), Gastartikel-Ziele, Agentur-Verzeichnisse.
// IDEMPOTENT: überspringt existierende source_url.
// Aufruf: node scripts/seo-seed-partner-links.js
const { createClient } = require('@supabase/supabase-js');

// Aufruf (lokal, Env-Var setzen):
//   SUPABASE_SERVICE_ROLE_KEY=sb_... node scripts/seo-seed-partner-links.js
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) { console.error('❌ SUPABASE_SERVICE_ROLE_KEY fehlt (Env-Var setzen!)'); process.exit(1); }
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tlxlkmewbhnpzvrbphcq.supabase.co',
  key,
  { auth: { persistSession: false } }
);

const TARGET = 'https://www.fachschmiede.de/';
const ANCHOR = 'fachschmiede.de — Webseiten für Handwerker';

// type: directory | press | guestpost | backlink
const SEEDS = [
  // ── Hersteller-Fachbetrieb-Verzeichnisse (Dach) ──
  { source_url: 'https://www.braas.de', type: 'directory', notes: 'Braas Fachpartner-Suche: als Fachbetrieb/Dienstleister eintragen lassen → Profil-Link. Themenstark: Dach. Anfrage über Kontaktformular.' },
  { source_url: 'https://www.creaton.de', type: 'directory', notes: 'Creaton Fachbetrieb werden — Verzeichnis-Eintrag mit Website-Link.' },
  { source_url: 'https://www.erlus.com', type: 'directory', notes: 'Erlus Fachbetriebs-Suche — Eintrag mit Link.' },
  { source_url: 'https://www.velux.de', type: 'directory', notes: 'Velux Fachpartner-Programm (Dachfenster) — Partner-Profil mit Backlink.' },
  // ── SHK / Klempner ──
  { source_url: 'https://www.geberit.de', type: 'directory', notes: 'Geberit Fachpartner-Suche — SHK-Thema, hohe Autorität.' },
  { source_url: 'https://www.viega.de', type: 'directory', notes: 'Viega Fachbetriebs-Verzeichnis.' },
  { source_url: 'https://www.uponor.de', type: 'directory', notes: 'Uponor Fachpartner-Liste.' },
  { source_url: 'https://www.hansgrohe.de', type: 'directory', notes: 'Hansgrohe Fachhandels-Finder — Eintrag als Fachpartner.' },
  // ── Elektro ──
  { source_url: 'https://www.gira.de', type: 'directory', notes: 'Gira Elektrofachkraft-Finder — Partner-Eintrag mit Website.' },
  { source_url: 'https://www.jung.de', type: 'directory', notes: 'Jung Fachpartner-Verzeichnis.' },
  { source_url: 'https://www.hager.de', type: 'directory', notes: 'Hager Fachpartner-Suche (Elektroinstallation).' },
  // ── Maler ──
  { source_url: 'https://www.caparol.de', type: 'directory', notes: 'Caparol FarbenPartner — Fachbetriebs-Suche mit Profil-Link.' },
  { source_url: 'https://www.brillux.de', type: 'directory', notes: 'Brillux Fachbetrieb werden — Verzeichnis + Link.' },
  { source_url: 'https://www.sto.de', type: 'directory', notes: 'Sto Fachpartner-Systeme — Partner-Eintrag.' },
  // ── PR-Portale (kostenlos, eigener Link in der PM) ──
  { source_url: 'https://www.openpr.de', type: 'press', notes: 'Pressemitteilungen KOSTENLOS veröffentlichen — Link im Text erlaubt. Taktik: 1× Quartal PM (z.B. „Neue Stadt online").' },
  { source_url: 'https://www.presseportal.de', type: 'press', notes: 'ots/presseportal — kostenlose Registrierung, PM mit Unternehmens-Link.' },
  // ── Gastartikel-Ziele (Handwerk/Bau-Thema) ──
  { source_url: 'https://www.hausjournal.net', type: 'guestpost', notes: 'Gastartikel zu Handwerks-Themen möglich, dofollow. Redaktion kontaktieren.' },
  { source_url: 'https://www.heimwerker.de', type: 'guestpost', notes: 'Heimwerker-Redaktion — Gastbeitrag/Expertenbeitrag anbieten.' },
  { source_url: 'https://www.bauredakteur.de', type: 'guestpost', notes: 'Baustoff-Redaktion — Fachbeitrag pitchern (siehe Outreach-Tab).' },
  // ── Agentur-/Business-Verzeichnisse ──
  { source_url: 'https://clutch.co', type: 'directory', notes: 'Clutch-Agenturprofil — dofollow, Review-getrieben. Als Web-Agency registrieren.' },
  { source_url: 'https://www.sortlist.de', type: 'directory', notes: 'Sortlist Agentur-Verzeichnis — kostenloses Profil mit Link.' },
  { source_url: 'https://www.brownbook.net', type: 'directory', notes: 'Brownbook — free dofollow NAP-Directory.' },
  { source_url: 'https://www.hotfrog.de', type: 'directory', notes: 'Hotfrog — kostenloser Firmeneintrag mit Link.' },
];

(async () => {
  const { data: existing, error } = await sb.from('backlinks').select('source_url');
  if (error) throw new Error('backlinks lesen: ' + error.message);
  const have = new Set((existing || []).map(b => b.source_url));
  let added = 0, skipped = 0;
  for (const s of SEEDS) {
    if (have.has(s.source_url)) { skipped++; console.log('⊘ schon da:', s.source_url); continue; }
    const { error: ins } = await sb.from('backlinks').insert({
      landing_page_id: null,
      target_url: TARGET,
      source_url: s.source_url,
      anchor: ANCHOR,
      type: s.type,
      status: 'planned',
      dr: null,
      cost: 0,
      notes: s.notes,
    });
    if (ins) { console.error('✗ Fehler bei', s.source_url, '→', ins.message); process.exitCode = 1; }
    else { added++; console.log('✓ geplant:', s.source_url); }
  }
  const { count } = await sb.from('backlinks').select('*', { count: 'exact', head: true });
  console.log(`\nFERTIG: ${added} neue Ziele, ${skipped} übersprungen. Backlink-Tracker jetzt: ${count} Einträge.`);
})();
