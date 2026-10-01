import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'


// 2026-10-01: Zwei gültige Passwörter — historisch gab es 2024 (API/Code)
// und 2026 (Frontend-Fallback). Dieter kannte nur eins davon → Login schlug fehl.
// Env ADMIN_PASSWORD überschreibt weiterhin komplett (Vercel).
const ADMIN_PASSWORDS = ['fachschmiede2024', 'fachschmiede2026']
const ENV_PASSWORD = process.env.ADMIN_PASSWORD
const VALID_PASSWORDS = ENV_PASSWORD ? [ENV_PASSWORD] : ADMIN_PASSWORDS

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    
    if (!password) {
      return NextResponse.json(
        { error: 'Passwort erforderlich' },
        { status: 400 }
      )
    }
    
    if (!VALID_PASSWORDS.includes(password)) {
      return NextResponse.json(
        { error: 'Falsches Passwort' },
        { status: 401 }
      )
    }
    
    // Einfacher Token (in Produktion wäre JWT besser)
    const token = btoa(VALID_PASSWORDS[0] + Date.now())
    
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
