CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  meta_description TEXT,
  meta_title TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ai_generated BOOLEAN DEFAULT TRUE,
  featured_image TEXT,
  word_count INTEGER DEFAULT 0,
  generated_at TIMESTAMP WITH TIME ZONE,
  generation_prompt TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  seo_score INTEGER DEFAULT 0
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_articles_landing_page ON articles(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);

-- RLS Policies
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Allow read access to published articles (for public)
CREATE POLICY "Allow public read published articles" 
  ON articles FOR SELECT 
  USING (status = 'published');

-- Allow full access via service role
CREATE POLICY "Allow service role full access" 
  ON articles FOR ALL 
  TO service_role 
  USING (true) WITH CHECK (true);
