-- Migration: hero_image Spalte hinzufügen und befüllen
-- Ausführen im Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. Spalte hinzufügen (falls noch nicht vorhanden)
ALTER TABLE trades ADD COLUMN IF NOT EXISTS hero_image text;

-- 2. Hero-Bilder für existierende Gewerke setzen
UPDATE trades SET hero_image = '/images/dachdecker-hero.jpg' WHERE slug = 'dachdecker';
UPDATE trades SET hero_image = '/images/elektriker-hero.jpg' WHERE slug = 'elektriker';
UPDATE trades SET hero_image = '/images/klempner-hero.jpg' WHERE slug = 'klempner';
UPDATE trades SET hero_image = '/images/zimmerer-hero.jpg' WHERE slug = 'zimmerer';
UPDATE trades SET hero_image = '/images/maler-hero.jpg' WHERE slug = 'maler';
UPDATE trades SET hero_image = '/images/garten-hero.jpg' WHERE slug = 'garten-und-landschaftsbau';
UPDATE trades SET hero_image = '/images/shk-hero.jpg' WHERE slug = 'shk';

-- 3. Verifizierung
SELECT slug, name, hero_image FROM trades ORDER BY name;
