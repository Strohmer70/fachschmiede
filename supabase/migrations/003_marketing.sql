-- Migration: Marketing tables for real outreach data
-- Run in Supabase SQL Editor

-- Marketing contacts (scraped / manually added prospects)
CREATE TABLE IF NOT EXISTS marketing_contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL,
  email text,
  phone text,
  address text,
  city text NOT NULL,
  trade text NOT NULL,
  source text DEFAULT 'manual',
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'replied', 'converted', 'bounced', 'unsubscribed')),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Campaigns (email or print outreach campaigns)
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  trade text,
  city text,
  channel text NOT NULL CHECK (channel IN ('email', 'print', 'whatsapp')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'paused')),
  contacts_total integer DEFAULT 0,
  contacts_sent integer DEFAULT 0,
  opens integer DEFAULT 0,
  replies integer DEFAULT 0,
  conversions integer DEFAULT 0,
  mail_subject text,
  mail_body text,
  created_at timestamp with time zone DEFAULT now(),
  sent_at timestamp with time zone
);

-- Campaign contacts junction (which contacts were in which campaign)
CREATE TABLE IF NOT EXISTS marketing_campaign_contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES marketing_contacts(id) ON DELETE CASCADE,
  sent_at timestamp with time zone,
  opened_at timestamp with time zone,
  replied_at timestamp with time zone,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'replied', 'bounced')),
  UNIQUE(campaign_id, contact_id)
);

-- Enable RLS
ALTER TABLE marketing_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaign_contacts ENABLE ROW LEVEL SECURITY;

-- Service role policies
CREATE POLICY IF NOT EXISTS "Service role full access on marketing_contacts"
  ON marketing_contacts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Service role full access on marketing_campaigns"
  ON marketing_campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Service role full access on marketing_campaign_contacts"
  ON marketing_campaign_contacts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mk_contacts_status ON marketing_contacts(status);
CREATE INDEX IF NOT EXISTS idx_mk_contacts_city ON marketing_contacts(city);
CREATE INDEX IF NOT EXISTS idx_mk_contacts_trade ON marketing_contacts(trade);
CREATE INDEX IF NOT EXISTS idx_mk_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_mk_campaign_contacts_campaign ON marketing_campaign_contacts(campaign_id);
