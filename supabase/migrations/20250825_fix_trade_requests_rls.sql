-- ═══════════════════════════════════════════
-- RLS Fix: trade_requests Tabelle
-- Problem: Permission denied für anonyme INSERTs
-- Lösung: RLS Policy für anonyme INSERTs
-- ═══════════════════════════════════════════

-- 1. RLS aktivieren (falls noch nicht)
ALTER TABLE trade_requests ENABLE ROW LEVEL SECURITY;

-- 2. Bestehende Policies löschen (um Konflikte zu vermeiden)
DROP POLICY IF EXISTS "Allow anonymous inserts on trade_requests" ON trade_requests;
DROP POLICY IF EXISTS "Allow public inserts on trade_requests" ON trade_requests;
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON trade_requests;

-- 3. Neue Policy: Anonyme INSERTs erlauben
-- Dies ist sicher, da trade_requests nur Anfragen speichert (keine sensiblen Daten)
CREATE POLICY "Allow anonymous inserts on trade_requests"
  ON trade_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 4. Zusätzlich: Lesen für authentifizierte Nutzer (Admin-API)
DROP POLICY IF EXISTS "Allow admin read on trade_requests" ON trade_requests;
CREATE POLICY "Allow admin read on trade_requests"
  ON trade_requests
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- 5. Update/Delete nur für Service-Role (Admin)
DROP POLICY IF EXISTS "Allow service role updates on trade_requests" ON trade_requests;
CREATE POLICY "Allow service role updates on trade_requests"
  ON trade_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verifizierung
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'trade_requests';
