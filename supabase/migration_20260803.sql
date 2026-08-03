-- Migration: Complete Schema for fachschmiede.de
-- Created: 2026-08-03

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Landing Pages table
CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  trade_type TEXT NOT NULL,
  city TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance')),
  monthly_price INTEGER NOT NULL DEFAULT 149,
  seo_score INTEGER DEFAULT 0,
  google_ranking INTEGER,
  rented_by UUID,
  rented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  address TEXT,
  whatsapp TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Page Customizations table
CREATE TABLE IF NOT EXISTS page_customizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landing_page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  custom_company_name TEXT,
  custom_address TEXT,
  custom_phone TEXT,
  custom_email TEXT,
  custom_whatsapp TEXT,
  custom_place_id TEXT,
  custom_welcome_text TEXT,
  custom_about_text TEXT,
  custom_services JSONB DEFAULT '[]',
  custom_reviews JSONB DEFAULT '[]',
  custom_gallery JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(landing_page_id, tenant_id)
);

-- Leads table (contact form submissions)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landing_page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_landing_pages_status ON landing_pages(status);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_trade ON landing_pages(trade_type);
CREATE INDEX IF NOT EXISTS idx_landing_pages_city ON landing_pages(city);
CREATE INDEX IF NOT EXISTS idx_leads_page ON leads(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_customizations_tenant ON page_customizations(tenant_id);

-- Insert sample landing pages for testing
INSERT INTO landing_pages (slug, trade_type, city, title, description, monthly_price, status)
VALUES 
  ('dachdecker-berlin', 'Dachdecker', 'Berlin', 'Dachdecker Berlin | Fachschmiede', 'Professionelle Dachdeckerarbeiten in Berlin', 149, 'available'),
  ('elektriker-muenchen', 'Elektriker', 'München', 'Elektriker München | Fachschmiede', 'Elektroinstallationen in München', 149, 'available'),
  ('klempner-hamburg', 'Klempner', 'Hamburg', 'Klempner Hamburg | Fachschmiede', 'Klempnerarbeiten in Hamburg', 149, 'available'),
  ('schornsteinfeger-koeln', 'Schornsteinfeger', 'Köln', 'Schornsteinfeger Köln | Fachschmiede', 'Schornsteinreinigung in Köln', 149, 'available')
ON CONFLICT (slug) DO NOTHING;

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (email, password_hash, role)
VALUES ('admin@fachschmiede.de', 'admin123', 'superadmin')
ON CONFLICT (email) DO NOTHING;
