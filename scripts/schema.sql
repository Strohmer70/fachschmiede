-- FachSchmiede Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Landing Pages table
CREATE TABLE IF NOT EXISTS pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  trade TEXT NOT NULL,
  city TEXT NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT,
  h1 TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  schema_data JSONB DEFAULT '{}',
  is_rented BOOLEAN DEFAULT FALSE,
  rented_by UUID REFERENCES customers(id),
  rented_at TIMESTAMP WITH TIME ZONE,
  monthly_price INTEGER DEFAULT 149,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trade, city)
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  company TEXT,
  phone TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) NOT NULL,
  page_id UUID REFERENCES pages(id) NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT DEFAULT 'active', -- active, canceled, past_due, unpaid
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact/Leads table (for people who inquire before renting)
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_id UUID REFERENCES pages(id),
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'new', -- new, contacted, converted, lost
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waitlist (for pages that get interest but aren't rented yet)
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_id UUID REFERENCES pages(id) NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Pages: anyone can read, only admin can write
CREATE POLICY "Pages are viewable by everyone" 
  ON pages FOR SELECT USING (true);

-- Customers: only own records
CREATE POLICY "Customers can view own record" 
  ON customers FOR SELECT USING (auth.uid() = id);

-- Subscriptions: only own records
CREATE POLICY "Customers can view own subscriptions" 
  ON subscriptions FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE auth.uid() = id)
  );

-- Leads: admin only (for now)
CREATE POLICY "Leads are insertable by anyone" 
  ON leads FOR INSERT WITH CHECK (true);

-- Waitlist: anyone can insert, admin can view
CREATE POLICY "Waitlist is insertable by anyone" 
  ON waitlist FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_pages_trade ON pages(trade);
CREATE INDEX idx_pages_city ON pages(city);
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_rented ON pages(is_rented);
CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_page ON subscriptions(page_id);
CREATE INDEX idx_leads_page ON leads(page_id);
CREATE INDEX idx_leads_status ON leads(status);

-- Seed data: a few sample pages
INSERT INTO pages (slug, trade, city, title, h1, content, monthly_price)
VALUES 
  ('/dachdecker/berlin', 'dachdecker', 'Berlin', 'Dachdecker Berlin', 'Dachdecker Berlin – Ihr Fachmann vor Ort', 
   '{"intro": "Professionelle Dachdecker in Berlin...", "services": [{"title": "Dachreparatur Berlin", "description": "Schnelle Reparatur"}]}', 149),
  ('/elektriker/muenchen', 'elektriker', 'München', 'Elektriker München', 'Elektriker München – Ihr Fachmann vor Ort', 
   '{"intro": "Zertifizierte Elektriker in München...", "services": [{"title": "Elektroinstallation München", "description": "Neuinstallation"}]}', 149)
ON CONFLICT (slug) DO NOTHING;
