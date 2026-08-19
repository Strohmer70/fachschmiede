import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Simple test - no database
    return NextResponse.json({
      success: true,
      message: 'Trades API is working',
      env: {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    })
  } catch (err) {
    return NextResponse.json({ 
      error: 'Failed', 
      details: err instanceof Error ? err.message : 'Unknown' 
    }, { status: 500 })
  }
}
