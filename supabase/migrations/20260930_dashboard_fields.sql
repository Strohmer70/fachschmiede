-- Migration 2026-09-30: Dashboard-Felder vollständig verdrahten
-- Vorher: page_customizations hatte nur 13 Spalten → die meisten Dashboard-Felder
-- wurden still verworfen. Diese Migration macht ALLE Dashboard-Felder speicherbar.

ALTER TABLE public.page_customizations
  ADD COLUMN IF NOT EXISTS opening_hours text,
  ADD COLUMN IF NOT EXISTS about_text text,
  ADD COLUMN IF NOT EXISTS service_areas jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS google_maps_place_id text,
  ADD COLUMN IF NOT EXISTS google_maps_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS founding_year integer,
  ADD COLUMN IF NOT EXISTS show_founding_year boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS project_count text,
  ADD COLUMN IF NOT EXISTS show_project_count boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS team_size text,
  ADD COLUMN IF NOT EXISTS show_team_size boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_master_company boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_guild_member boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guild_name text,
  ADD COLUMN IF NOT EXISTS accent_color text,
  ADD COLUMN IF NOT EXISTS services_active jsonb,
  ADD COLUMN IF NOT EXISTS modules_enabled jsonb,
  ADD COLUMN IF NOT EXISTS rechtsform text,
  ADD COLUMN IF NOT EXISTS vertretung text,
  ADD COLUMN IF NOT EXISTS ust_id text,
  ADD COLUMN IF NOT EXISTS hwk_name text,
  ADD COLUMN IF NOT EXISTS hwk_number text,
  ADD COLUMN IF NOT EXISTS berufsbezeichnung text,
  ADD COLUMN IF NOT EXISTS verantwortlicher text,
  ADD COLUMN IF NOT EXISTS eu_streitschlichtung boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS datenschutz_beauftragter text;
