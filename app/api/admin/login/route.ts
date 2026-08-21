import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'


const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'fachschmiede2024'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    
    if (!password) {
      return NextResponse.json(
        { error: 'Passwort erforderlich' },
        { status: 400 }
      )
    }
    
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Falsches Passwort' },
        { status: 401 }
      )
    }
    
    // Einfacher Token (in Produktion wäre JWT besser)
    const token = btoa(ADMIN_PASSWORD + Date.now())
    
    return NextResponse.json({
      success: true,
      token,
      message: 'Login erfolgreich'
    })
    
  } catch (error: any) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Login fehlgeschlagen' },
      { status: 500 }
    )
  }
}
