# 📝 Blog-Artikel-System Setup

## Was wurde gebaut

Automatisches Blog-Artikel-System für fachschmiede.de mit:

- **KI-Generierung** von SEO-optimierten Artikeln
- **1-2-4 Logik**: Freie Seiten (1), Basis-Mieter (2), Pro-Mieter (4) Artikel/Monat
- **Admin Dashboard** mit Blog-Verwaltung
- **Automatisches Scheduling**

## Schritt 1: Supabase Tabelle erstellen

1. Gehe zu [Supabase Dashboard](https://app.supabase.com)
2. Wähle dein Projekt: `tlxlmkewbhnpzvrphcq`
3. Gehe zu **SQL Editor**
4. Führe folgendes SQL aus:

```sql
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

CREATE INDEX IF NOT EXISTS idx_articles_landing_page ON articles(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read published articles" 
  ON articles FOR SELECT 
  USING (status = 'published');

CREATE POLICY "Allow service role full access" 
  ON articles FOR ALL 
  TO service_role 
  USING (true) WITH CHECK (true);
```

## Schritt 2: Environment Variables prüfen

Stelle sicher, dass diese Variablen in Vercel gesetzt sind:

```
NEXT_PUBLIC_SUPABASE_URL=https://tlxlmkewbhnpzvrphcq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
KIMI_API_KEY=dein-kimi-api-key
```

> **Wichtig**: Der `SUPABASE_SERVICE_ROLE_KEY` ist für Admin-Operationen nötig. Finde ihn in Supabase unter Project Settings > API.

## Schritt 3: Deployen

```bash
vercel --prod
```

## API Endpunkte

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/api/articles` | Liste aller Artikel |
| POST | `/api/articles` | Neuen Artikel erstellen |
| GET | `/api/articles/[id]` | Einzelnen Artikel abrufen |
| PATCH | `/api/articles/[id]` | Artikel aktualisieren |
| DELETE | `/api/articles/[id]` | Artikel löschen |
| POST | `/api/articles/generate` | KI-Artikel generieren |
| POST | `/api/articles/schedule` | Automatisches Scheduling |
| GET | `/api/articles/schedule` | Scheduling-Status |

## Admin Dashboard

Gehe zu `/admin` und logge dich ein (Passwort: `admin123`)

Neuer Tab: **📝 Blog**

- Einzelne Artikel generieren
- Automatisches Scheduling starten
- Artikel veröffentlichen/archivieren
- Artikel löschen

## 1-2-4 Logik

Das automatische Scheduling generiert:

- **1 Artikel/Monat** für freie (nicht vermietete) Seiten
- **2 Artikel/Monat** für Basis-Mieter
- **4 Artikel/Monat** für Pro-Mieter

## Cron-Job (optional)

Für vollständige Automation, erstelle einen Cron-Job, der monatlich `/api/articles/schedule` aufruft.
