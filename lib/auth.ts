// lib/auth.ts — Passwort-Hashing (scrypt, node:crypto, keine Dependencies)
// Format: scrypt$N$salt$hash (base64)
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'

const N = 16384, r = 8, p = 1, KEYLEN = 64

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('base64')
  const hash = scryptSync(plain, salt, KEYLEN, { N, r, p }).toString('base64')
  return `scrypt$${N}$${salt}$${hash}`
}

export function verifyPassword(plain: string, stored: string): boolean {
  try {
    const [algo, nStr, salt, hash] = stored.split('$')
    if (algo !== 'scrypt') return false
    const computed = scryptSync(plain, salt, KEYLEN, { N: parseInt(nStr, 10), r, p })
    const expected = Buffer.from(hash, 'base64')
    return computed.length === expected.length && timingSafeEqual(computed, expected)
  } catch {
    return false
  }
}

// Einfacher HMAC-Token für Mieter-Sessions (stateless, kein JWT-Dep nötig)
import { createHmac } from 'crypto'

export function signToken(payload: object, secret: string, maxAgeSec = 60 * 60 * 24 * 30): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + maxAgeSec })).toString('base64url')
  const sig = createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyToken<T = any>(token: string, secret: string): T | null {
  try {
    const [body, sig] = token.split('.')
    const expected = createHmac('sha256', secret).update(body).digest('base64url')
    const a = Buffer.from(sig), b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    const data = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null
    return data as T
  } catch {
    return null
  }
}
