-- fachschmiede.de database schema — Extended for Tenant & Admin System
-- Run this in Supabase SQL Editor

-- ==========================================
-- 1. CORE TABLES (no dependencies)
-- ==========================================

-- Trades table (Dachdecker, Elektriker, etc.)
create table if not exists trades (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  plural_name text not null,
  description text,
  keywords text[],
  services text[],
  created_at timestamp with time zone default now()
);

-- Cities table
create table if not exists cities (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  state text not null,
  population integer,
  lat numeric,
  lng numeric,
  created_at timestamp with time zone default now()
);

-- Tenants (Mieter / Handwerker)
create table if not exists tenants (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  password_hash text not null,
  company_name text not null,
  contact_name text,
  phone text,
  address text,
  logo_url text,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'inactive' check (subscription_status in ('active', 'inactive', 'cancelled', 'past_due')),
  created_at timestamp with time zone default now()
);

-- Admin users (wir / Betreiber)
create table if not exists admin_users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  password_hash text not null,
  created_at timestamp with time zone default now()
);

-- ==========================================
-- 2. LANDING PAGES (depends on trades + cities + tenants)
-- ==========================================

-- Landing pages table
create table if not exists landing_pages (
  id uuid default gen_random_uuid() primary key,
  trade_id uuid references trades(id) on delete cascade,
  city_id uuid references cities(id) on delete cascade,
  slug text unique not null,
  title text not null,
  meta_description text,
  h1 text not null,
  content_json jsonb default '{}',
  status text default 'available' check (status in ('available', 'rented', 'reserved')),
  rented_by uuid references tenants(id) on delete set null,
  rented_at timestamp with time zone,
  stripe_price_id text,
  monthly_price integer default 14900, -- in cents (€149)
  page_views integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(trade_id, city_id)
);

-- Tenant customisations for each rented page
create table if not exists page_customizations (
  id uuid default gen_random_uuid() primary key,
  landing_page_id uuid references landing_pages(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  custom_logo_url text,
  custom_company_name text,
  custom_address text,
  custom_phone text,
  custom_email text,
  custom_welcome_text text,
  custom_services jsonb default '[]',
  custom_gallery_urls text[],
  is_active boolean default true,
  updated_at timestamp with time zone default now(),
  unique(landing_page_id, tenant_id)
);

-- Lead inquiries (Anfragen von Kunden auf Landing Pages)
create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  landing_page_id uuid references landing_pages(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete set null,
  name text not null,
  email text,
  phone text,
  message text,
  status text default 'new' check (status in ('new', 'contacted', 'won', 'lost')),
  created_at timestamp with time zone default now()
);

-- ==========================================
-- 3. RLS POLICIES
-- ==========================================

-- Enable Row Level Security
alter table trades enable row level security;
alter table cities enable row level security;
alter table landing_pages enable row level security;
alter table tenants enable row level security;
alter table page_customizations enable row level security;
alter table leads enable row level security;
alter table admin_users enable row level security;

-- Public read policies
-- create policy "Public can read trades" on trades for select using (true);
-- create policy "Public can read cities" on cities for select using (true);
-- create policy "Public can read landing_pages" on landing_pages for select using (true);

-- ==========================================
-- 4. SEED DATA
-- ==========================================

-- Insert sample trade: Dachdecker
insert into trades (slug, name, plural_name, description, keywords, services)
values (
  'dachdecker',
  'Dachdecker',
  'Dachdecker',
  'Professionelle Dachdecker für Reparaturen, Neubau und Sanierung.',
  array['dachdecker', 'dach reparatur', 'dachsanierung', 'dachneubau', 'dachziegel'],
  array['Dachreparatur', 'Dachsanierung', 'Dachneubau', 'Dachisolierung', 'Dachrinnen', 'Schornsteinverkleidung', 'Dachfenster', 'Sturmschadenbeseitigung']
)
on conflict (slug) do nothing;

-- Insert sample trade: Elektriker
insert into trades (slug, name, plural_name, description, keywords, services)
values (
  'elektriker',
  'Elektriker',
  'Elektriker',
  'Elektroinstallation, Reparatur und Smart-Home-Lösungen.',
  array['elektriker', 'elektroinstallation', 'strom', 'sicherung', 'smart home'],
  array['Elektroinstallation', 'Stromausfall-Reparatur', 'Sicherungskasten-Modernisierung', 'Smart-Home-Installation', 'Elektroprüfung nach VDE', 'Beleuchtungsplanung']
)
on conflict (slug) do nothing;

-- Insert sample city: Hattingen
insert into cities (slug, name, state, population, lat, lng)
values (
  'hattingen',
  'Hattingen',
  'Nordrhein-Westfalen',
  54000,
  51.3989,
  7.1726
)
on conflict (slug) do nothing;

-- Insert sample city: München
insert into cities (slug, name, state, population, lat, lng)
values (
  'muenchen',
  'München',
  'Bayern',
  1488202,
  48.1351,
  11.5820
)
on conflict (slug) do nothing;

-- Create the landing page for Hattingen (Dachdecker)
insert into landing_pages (trade_id, city_id, slug, title, meta_description, h1, monthly_price)
select 
  t.id as trade_id,
  c.id as city_id,
  'dachdecker-hattingen',
  'Dachdecker Hattingen | Professionelle Dacharbeiten ab €149/Monat',
  'Erfahrene Dachdecker in Hattingen. Reparatur, Sanierung & Neubau. Jetzt lokale Dachdeckermeister finden.',
  'Ihr Dachdecker in Hattingen – Zuverlässig, Fair, Vor Ort',
  14900
from trades t, cities c
where t.slug = 'dachdecker' and c.slug = 'hattingen'
on conflict (slug) do nothing;

-- Create the landing page for München (Dachdecker)
insert into landing_pages (trade_id, city_id, slug, title, meta_description, h1, monthly_price)
select 
  t.id as trade_id,
  c.id as city_id,
  'dachdecker-muenchen',
  'Dachdecker München | Professionelle Dacharbeiten ab €149/Monat',
  'Erfahrene Dachdecker in München. Reparatur, Sanierung & Neubau. Jetzt lokale Dachdeckermeister finden.',
  'Ihr Dachdecker in München – Zuverlässig, Fair, Vor Ort',
  14900
from trades t, cities c
where t.slug = 'dachdecker' and c.slug = 'muenchen'
on conflict (slug) do nothing;

-- Create the landing page for Hattingen (Elektriker)
insert into landing_pages (trade_id, city_id, slug, title, meta_description, h1, monthly_price)
select 
  t.id as trade_id,
  c.id as city_id,
  'elektriker-hattingen',
  'Elektriker Hattingen | Professionelle Elektroarbeiten ab €149/Monat',
  'Erfahrene Elektriker in Hattingen. Installation, Reparatur & Smart-Home. Jetzt lokale Elektromeister finden.',
  'Ihr Elektriker in Hattingen – Zuverlässig, Fair, Vor Ort',
  14900
from trades t, cities c
where t.slug = 'elektriker' and c.slug = 'hattingen'
on conflict (slug) do nothing;
