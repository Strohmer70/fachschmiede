import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return NextResponse.json({
    status: 'debug',
    url_set: !!supabaseUrl,
    url_value: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING',
    key_set: !!supabaseKey,
    key_value: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'MISSING',
    all_env_keys: Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('PUBLIC'))
  })
}
