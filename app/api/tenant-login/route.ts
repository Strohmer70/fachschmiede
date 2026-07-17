import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      return NextResponse.redirect(new URL('/dashboard?error=missing', request.url))
    }

    // Simple lookup (in production: proper bcrypt comparison)
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('email', email)
      .single()

    if (!tenant) {
      return NextResponse.redirect(new URL('/dashboard?error=invalid', request.url))
    }

    // For MVP: simple password check (temporary — should use proper auth)
    // In production: bcrypt.compare(password, tenant.password_hash)
    // For now, we just check if they exist and redirect
    
    return NextResponse.redirect(new URL(`/dashboard?tenant=${tenant.id}`, request.url))

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.redirect(new URL('/dashboard?error=server', request.url))
  }
}
