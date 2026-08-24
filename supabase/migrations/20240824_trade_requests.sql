-- ═══════════════════════════════════════════
-- SUPABASE SCHEMA: Autonomer Gewerk-Generator
-- ═══════════════════════════════════════════

-- Tabelle: Gewerk-Anfragen (Trade Requests)
CREATE TABLE IF NOT EXISTS trade_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,                      -- z.B. "Garten- & Landschaftsbau"
  slug TEXT NOT NULL UNIQUE,               -- z.B. "gartenbau"
  emoji TEXT DEFAULT '🆕',                  -- Icon für das Gewerk
  region TEXT,                             -- Start-Region
  priority TEXT DEFAULT 'normal',          -- normal | high | urgent
  city_count INTEGER DEFAULT 10,           -- 5 | 10 | 20
  notes TEXT,                              -- Hinweise an Redaktion
  status TEXT DEFAULT 'pending',           -- pending | generating | ready | error
  
  -- Auto-Generation Tracking
  generated_pages INTEGER DEFAULT 0,       -- Wie viele Stadtseiten erstellt
  generated_articles INTEGER DEFAULT 0,    -- Wie viele Artikel generiert
  salespage_url TEXT,                      -- URL zur Salespage
  
  -- Content-Einstellungen
  brand_color TEXT DEFAULT '#ea580c',      -- Akzentfarbe (Tailwind)
  services JSONB DEFAULT '[]',             -- Array von {icon, title, desc}
  faqs JSONB DEFAULT '[]',                 -- Array von {q, a}
  
  -- Metadaten
  created_by TEXT,                         -- Admin OpenID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index für schnelle Status-Abfragen
CREATE INDEX IF NOT EXISTS idx_trade_requests_status ON trade_requests(status);
CREATE INDEX IF NOT EXISTS idx_trade_requests_created_at ON trade_requests(created_at DESC);

-- Tabelle: Trade-Templates (Vorlagen für Generierung)
CREATE TABLE IF NOT EXISTS trade_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_slug TEXT NOT NULL UNIQUE,         -- z.B. "dachdecker"
  template_data JSONB NOT NULL,            -- Komplette Vorlage als JSON
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabelle: Generierungs-Log (für Debugging)
CREATE TABLE IF NOT EXISTS generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_request_id UUID REFERENCES trade_requests(id),
  step TEXT NOT NULL,                      -- z.B. "pages_created", "articles_generated"
  status TEXT DEFAULT 'started',           -- started | success | error
  message TEXT,                            -- Details
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS aktivieren
ALTER TABLE trade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

-- Policies (nur Admin-Zugriff)
CREATE POLICY "Admin full access on trade_requests"
  ON trade_requests FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin full access on trade_templates"
  ON trade_templates FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin full access on generation_logs"
  ON generation_logs FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
