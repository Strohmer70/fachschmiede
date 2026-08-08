-- =====================================================
-- FACHSCHMIEDE.DE - DATABASE SEED SCRIPT
-- Ausführen in: Supabase → SQL Editor → New Query
-- =====================================================

-- 1. Clean existing data
DELETE FROM leads;
DELETE FROM tenants;
DELETE FROM landing_pages;
DELETE FROM trades;
DELETE FROM cities;

-- 2. Insert trades
INSERT INTO trades (name, slug, description) VALUES
  ('Dachdecker', 'dachdecker', 'Dachdeckung, Dachsanierung, Dachreparatur'),
  ('Elektriker', 'elektriker', 'Elektroinstallation, Wartung, Reparatur'),
  ('Klempner', 'klempner', 'Heizung, Sanitär, Wasserinstallation'),
  ('Zimmerer', 'zimmerer', 'Zimmerei, Holzbau, Dachstühle'),
  ('Maler', 'maler', 'Malerarbeiten, Fassaden, Lackierung');

-- 3. Insert cities
INSERT INTO cities (name, slug, population) VALUES
  ('Hattingen', 'hattingen', 50000),
  ('Schwerte', 'schwerte', 55000),
  ('Dortmund', 'dortmund', 60000),
  ('Hagen', 'hagen', 65000),
  ('Iserlohn', 'iserlohn', 70000),
  ('Unna', 'unna', 75000),
  ('Bochum', 'bochum', 80000),
  ('Witten', 'witten', 85000),
  ('Lünen', 'luenen', 90000),
  ('Herne', 'herne', 95000),
  ('Castrop-Rauxel', 'castrop-rauxel', 100000),
  ('Kamen', 'kamen', 105000),
  ('Bergkamen', 'bergkamen', 110000),
  ('Fröndenberg', 'froendenberg', 115000),
  ('Holzwickede', 'holzwickede', 120000),
  ('Schwelm', 'schwelm', 125000),
  ('Gevelsberg', 'gevelsberg', 130000),
  ('Ennepetal', 'ennepetal', 135000),
  ('Sprockhövel', 'sprockhoevel', 140000),
  ('Wetter', 'wetter', 145000);

-- 4. Insert landing pages (5 trades × 20 cities = 100 pages)
-- Note: This uses the UUIDs generated above. In practice, you'd run this after trades/cities are inserted.
-- For simplicity, we'll use a PL/pgSQL block to handle the IDs dynamically.

DO $$
DECLARE
  trade_record RECORD;
  city_record RECORD;
  page_count INT := 0;
  is_rented BOOLEAN;
BEGIN
  FOR trade_record IN SELECT id, name, slug FROM trades LOOP
    FOR city_record IN SELECT id, name, slug FROM cities LOOP
      is_rented := random() > 0.75;
      
      INSERT INTO landing_pages (slug, trade_id, city_id, title, description, monthly_price, status, seo_score, content)
      VALUES (
        trade_record.slug || '-' || city_record.slug,
        trade_record.id,
        city_record.id,
        trade_record.name || ' ' || city_record.name || ' — Jetzt online mieten',
        'Professionelle ' || trade_record.name || '-Website für ' || city_record.name || '. Bereits optimiert für Google.',
        14900,
        CASE WHEN is_rented THEN 'rented' ELSE 'available' END,
        floor(random() * 30 + 70)::int,
        jsonb_build_object(
          'hero', 'Ihr zuverlässiger ' || trade_record.name || ' in ' || city_record.name,
          'services', ARRAY['Beratung', 'Planung', 'Ausführung', 'Wartung'],
          'faq', jsonb_build_array(
            jsonb_build_object('q', 'Wie schnell ist ein ' || trade_record.name || ' vor Ort?', 'a', 'In der Regel innerhalb von 24 Stunden.'),
            jsonb_build_object('q', 'Gibt es eine Garantie?', 'a', 'Ja, 5 Jahre auf alle Arbeiten.')
          )
        )
      );
      
      page_count := page_count + 1;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Inserted % landing pages', page_count;
END $$;

-- 5. Insert sample leads for rented pages
INSERT INTO leads (page_id, name, email, phone, message, status)
SELECT 
  lp.id,
  CASE row_number() OVER () 
    WHEN 1 THEN 'Max Mustermann'
    WHEN 2 THEN 'Erika Schmidt'
    WHEN 3 THEN 'Hans Müller'
    WHEN 4 THEN 'Sabine Weber'
    WHEN 5 THEN 'Thomas Klein'
  END,
  'kunde' || row_number() OVER () || '@example.de',
  '02324-' || (123456 + row_number() OVER ()),
  'Interesse an ' || lp.title,
  'new'
FROM landing_pages lp
WHERE lp.status = 'rented'
LIMIT 5;

-- 6. Insert sample tenants for first 3 rented pages
INSERT INTO tenants (page_id, company_name, email, phone, monthly_price, password_hash, status)
SELECT 
  lp.id,
  CASE row_number() OVER ()
    WHEN 1 THEN 'Bergmann Bedachungen'
    WHEN 2 THEN 'Volt Elektrotechnik'
    WHEN 3 THEN 'SHK Krämer'
  END,
  'mieter' || row_number() OVER () || '@example.de',
  '02324-' || (654321 + row_number() OVER ()),
  lp.monthly_price,
  'demo123',
  'active'
FROM landing_pages lp
WHERE lp.status = 'rented'
LIMIT 3;

-- 7. Verify counts
SELECT 'trades' as table_name, count(*) as count FROM trades
UNION ALL
SELECT 'cities', count(*) FROM cities
UNION ALL
SELECT 'landing_pages', count(*) FROM landing_pages
UNION ALL
SELECT 'leads', count(*) FROM leads
UNION ALL
SELECT 'tenants', count(*) FROM tenants;
