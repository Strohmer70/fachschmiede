-- Tabelle für dynamische Artikel
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  trade_id TEXT NOT NULL,
  city_id TEXT NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT,
  h1 TEXT,
  content TEXT NOT NULL,
  excerpt TEXT,
  status TEXT DEFAULT 'draft', -- draft, published, archived
  is_auto_generated BOOLEAN DEFAULT false,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  publish_count INTEGER DEFAULT 0, -- Wie oft veröffentlicht (für Plan)
  created_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(slug, trade_id, city_id)
);

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_articles_trade_city ON articles(trade_id, city_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_tenant ON articles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);

-- Tabelle für Artikel-Templates
CREATE TABLE IF NOT EXISTS article_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- z.B. 'dachdecker', 'elektriker', 'allgemein'
  title_template TEXT NOT NULL, -- mit {stadt}, {gewerk} Platzhaltern
  h1_template TEXT,
  meta_description_template TEXT,
  content_template TEXT NOT NULL,
  excerpt_template TEXT,
  variables JSONB DEFAULT '{}', -- welche Variablen verwendet werden
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Reihenfolge
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabelle für Artikel-Generierungs-Plan
CREATE TABLE IF NOT EXISTS article_generation_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id TEXT NOT NULL,
  city_id TEXT NOT NULL,
  month INTEGER NOT NULL, -- 1-12
  year INTEGER NOT NULL,
  planned_count INTEGER DEFAULT 0,
  generated_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'planned', -- planned, in_progress, completed, failed
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(trade_id, city_id, month, year)
);

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_generation_plan ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read published articles" ON articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "Allow admin full access" ON articles
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read templates" ON article_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin full access templates" ON article_templates
  FOR ALL USING (auth.role() = 'authenticated');
