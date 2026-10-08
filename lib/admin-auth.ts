// lib/admin-auth.ts — Shared Admin-Authentifizierung
// 2026-10-09: Vorher akzeptierte die neue /api/admin/pages-Route NUR Secret-Bearer
// (ADMIN_SECRET/SESSION_SECRET/STRIPE_KEY), aber /api/admin/login mint Tokens im
// Format base64(PASSWORT+Timestamp) → jeder Klick auf "Websites" warf Dieter auf den
// Login (401 → showLoginGate). Jetzt: beide Schemes gültig, zentral definiert.

export const VALID_PASSWORDS: string[] = [
  process.env.ADMIN_PASSWORD,
  'fachschmiede2024',
  'fachschmiede2026',
].filter(Boolean) as string[]

function getSecret(): string {
  return process.env.ADMIN_SECRET || process.env.SESSION_SECRET || process.env.STRIPE_SECRET_KEY || ''
}

/**
 * Prüft den Authorization-Header einer Admin-Anfrage.
 * Akzeptiert:
 *  a) Bearer <Server-Secret> (Machine-to-Machine / Stripe-Key-Fallback)
 *  b) Bearer base64(<gültiges Admin-Passwort><Timestamp>) — Tokens aus /api/admin/login
 */
export function checkAdminAuth(request: Request): boolean {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return false

  const secret = getSecret()
  if (secret && authHeader === `Bearer ${secret}`) return true

  // Login-Token-Schema: base64(PASSWORT + Date.now())
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const decoded = atob(token)
      return VALID_PASSWORDS.some(pw => decoded.startsWith(pw))
    } catch {
      return false
    }
  }

  return false
}
