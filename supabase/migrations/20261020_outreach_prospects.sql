-- 2026-10-20: Outreach-Prospects für SEO-Hub (Finn)
-- Kimi-Assistent erzeugt Pitches, Fortschritt wird hier getrackt.
CREATE TABLE IF NOT EXISTS public.outreach_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text,
  contact_name text,
  contact_email text,
  type text NOT NULL DEFAULT 'guestpost',
  status text NOT NULL DEFAULT 'research',
  pitch text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- DB-GRANT-REGEL (MEMORY.md): sofort Grants, sonst 42501!
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outreach_prospects TO service_role;
GRANT SELECT ON public.outreach_prospects TO anon;
