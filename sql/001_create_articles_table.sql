-- ============================================================
-- ARTIKEL-MANAGEMENT-SYSTEM für fachschmiede.de
-- ============================================================
-- Diese Tabelle verbindet generierte Artikel mit dem Dashboard,
-- den Stadt-Seiten und dem Generator.

-- Zuerst alte Tabelle löschen falls existiert (für sauberen Start)
DROP TABLE IF EXISTS articles CASCADE;

-- Artikel-Tabelle erstellen
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifikation
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  file_path TEXT NOT NULL, -- z.B. "/blog/dachdecker/bochum/dachdaemmung-2026-09.html"
  url_path TEXT NOT NULL,  -- z.B. "/dachdecker/bochum/blog/dachdaemmung-2026-09/"
  
  -- Zuordnung
  trade_slug TEXT NOT NULL,    -- z.B. "dachdecker"
  city_slug TEXT NOT NULL,     -- z.B. "bochum"
  landing_page_id UUID,        -- Optional: Link zur landing_pages Tabelle
  
  -- Inhalt & SEO
  excerpt TEXT,                -- Kurzbeschreibung für Vorschau
  meta_description TEXT,       -- SEO Meta Description
  word_count INTEGER DEFAULT 0,
  
  -- Status & Quelle
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  ai_generated BOOLEAN DEFAULT true,
  
  -- Timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Monat für Planung (YYYY-MM)
  month_slug TEXT,             -- z.B. "2026-09"
  
  -- Eindeutigkeit: Ein Artikel-Slug pro Trade/City/Monat
  UNIQUE(trade_slug, city_slug, slug, month_slug)
);

-- Indexe für schnelle Queries
CREATE INDEX idx_articles_trade ON articles(trade_slug);
CREATE INDEX idx_articles_city ON articles(city_slug);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_month ON articles(month_slug);
CREATE INDEX idx_articles_landing_page ON articles(landing_page_id);

-- Updated-at Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (Admin hat vollen Zugriff, anonym nur lesen bei published)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Policy: Jeder kann published Artikel lesen
CREATE POLICY "Allow public read published articles"
  ON articles FOR SELECT
  USING (status = 'published');

-- Policy: Admin kann alles (Service Role bypassed RLS anyway)
CREATE POLICY "Allow admin full access"
  ON articles FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- BESTEHENDE ARTIKEL MIGRIEREN (optional, manuell ausführen)
-- ============================================================
-- Diese Daten werden vom Migrationsscript befüllt.

-- Beispiel-Check:
-- SELECT trade_slug, city_slug, COUNT(*) FROM articles GROUP BY trade_slug, city_slug;
