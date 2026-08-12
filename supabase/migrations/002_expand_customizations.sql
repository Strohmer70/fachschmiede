-- Migration: Expand page_customizations for full tenant dashboard
-- Run in Supabase SQL Editor

ALTER TABLE page_customizations 
  ADD COLUMN IF NOT EXISTS opening_hours text,
  ADD COLUMN IF NOT EXISTS about_text text,
  ADD COLUMN IF NOT EXISTS service_areas text[],
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_maps_place_id text,
  ADD COLUMN IF NOT EXISTS google_maps_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS founding_year integer,
  ADD COLUMN IF NOT EXISTS show_founding_year boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS project_count text,
  ADD COLUMN IF NOT EXISTS show_project_count boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS team_size text,
  ADD COLUMN IF NOT EXISTS show_team_size boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_master_company boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_guild_member boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS guild_name text,
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#ea580c',
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS team_photo_url text,
  ADD COLUMN IF NOT EXISTS reference_photos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS services_enabled jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS modules_enabled jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rechtsform text,
  ADD COLUMN IF NOT EXISTS vertretung text,
  ADD COLUMN IF NOT EXISTS ust_id text,
  ADD COLUMN IF NOT EXISTS hwk_name text,
  ADD COLUMN IF NOT EXISTS hwk_number text,
  ADD COLUMN IF NOT EXISTS berufsbezeichnung text,
  ADD COLUMN IF NOT EXISTS verantwortlicher text,
  ADD COLUMN IF NOT EXISTS eu_streitschlichtung boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS datenschutz_beauftragter text,
  ADD COLUMN IF NOT EXISTS services_active jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS website_title text,
  ADD COLUMN IF NOT EXISTS meta_description_custom text;

-- Add reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  landing_page_id uuid REFERENCES landing_pages(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  project_type text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY IF NOT EXISTS "Service role full access on reviews"
  ON reviews FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_tenant ON reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_page ON reviews(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
