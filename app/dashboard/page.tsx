// app/dashboard/page.tsx — Redirect auf das funktionierende Mieter-Dashboard
// (Das React-Dashboard war nie fertig verdrahtet: Login erwartete `success`, API liefert `ok`,
// und der Save-Endpunkt war defekt. Kanonisch ist jetzt /mieter.html – 30.09.2026)
import { redirect } from 'next/navigation'

export default function DashboardPage() {
  redirect('/mieter/')
}
