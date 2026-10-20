// lib/kimi-budget.ts — 🔴 HARTER BUDGET-GUARD (Dieter-Limit: $30/Monat)
// Blockiert Kimi-Calls bei >$25 geschätztem Monatsverbrauch. Zählt in Supabase app_settings.
// Jeder Call-Site MUSST vorher checkBudget() und nachher logSpend() aufrufen!
import { supabaseAdmin } from './supabase'

const MONTHLY_LIMIT_USD = 25 // Puffer unter Dieters $30-Hardlimit
const KEY_MONTH = 'kimi_budget_month' // Format "2026-10"
const KEY_SPEND = 'kimi_budget_spend_usd'

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

async function readBudget(): Promise<{ month: string; spend: number }> {
  const { data } = await supabaseAdmin
    .from('app_settings')
    .select('key, value')
    .in('key', [KEY_MONTH, KEY_SPEND])
  const rows = data || []
  const month = rows.find((r: any) => r.key === KEY_MONTH)?.value || ''
  const spend = parseFloat(rows.find((r: any) => r.key === KEY_SPEND)?.value || '0')
  return { month, spend }
}

/** Wirft Error wenn Budget erschöpft. VOR jedem Kimi-Call aufrufen! */
export async function assertKimiBudget(): Promise<void> {
  const { month, spend } = await readBudget()
  // Neuer Monat → Reset (kein DB-Write nötig, Vergleich reicht)
  const effective = month === currentMonth() ? spend : 0
  if (effective >= MONTHLY_LIMIT_USD) {
    throw new Error(
      `🔴 KIMI-BUDGET-LIMIT erreicht: ~$${effective.toFixed(2)} von $${MONTHLY_LIMIT_USD} (Dieter-Cap $30/Monat). ` +
      `Nächsten Monat weiter, oder Dieter bitten das Limit zu erhöhen.`
    )
  }
}

/** Bucht geschätzte Kosten. NACH jedem Kimi-Call aufrufen! */
export async function logKimiSpend(estimatedUsd: number, purpose: string): Promise<void> {
  const { month, spend } = await readBudget()
  const base = month === currentMonth() ? spend : 0
  const newSpend = Math.round((base + estimatedUsd) * 10000) / 10000
  const { error } = await supabaseAdmin
    .from('app_settings')
    .upsert(
      [
        { key: KEY_MONTH, value: currentMonth() },
        { key: KEY_SPEND, value: String(newSpend) },
      ],
      { onConflict: 'key' }
    )
  if (error) console.error('[kimi-budget] Buchung fehlgeschlagen:', error.message, purpose)
  else console.log(`[kimi-budget] +$${estimatedUsd.toFixed(4)} (${purpose}) → Monat: $${newSpend}/${MONTHLY_LIMIT_USD}`)
}

export async function kimiBudgetStatus(): Promise<{ month: string; spend: number; limit: number }> {
  const { month, spend } = await readBudget()
  const effective = month === currentMonth() ? spend : 0
  return { month: currentMonth(), spend: effective, limit: MONTHLY_LIMIT_USD }
}
