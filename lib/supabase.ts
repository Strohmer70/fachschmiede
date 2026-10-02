import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Validate env vars
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// ═══ SINGLE-POINT CACHE-FIX (2026-10-02) ═══
// Next.js 14 cached Supabase-GETs im Data Cache (auch auf Vercel persistent!)
// → Admin-Übersicht zeigte wochenalte Mieten/Leads trotz frischer DB.
// Fix: JEDER Fetch der Supabase-Clients mit cache:'no-store' → gilt für ALLE API-Routen.
const noStoreFetch = ((url: any, init: any = {}) =>
  fetch(url, { ...init, cache: 'no-store' as any })) as typeof fetch

// Client for public/anon operations (RLS respected)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: noStoreFetch }
})

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { fetch: noStoreFetch }
    })
  : supabase // Fallback to anon key (will fail on RLS-protected tables)
