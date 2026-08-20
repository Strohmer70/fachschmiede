#!/usr/bin/env node
/**
 * Migration: shk → klempner
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

// Read env from .env.local
const envContent = readFileSync(join(rootDir, '.env.local'), 'utf8')
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`${key}=([^\\n]+)`))
  return match ? match[1].trim() : null
}

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function migrate() {
  console.log('🔄 Migrating shk → klempner...\n')

  // 1. Update trades table
  console.log('1️⃣ Updating trades table...')
  const { error: tradeError } = await supabase
    .from('trades')
    .update({ slug: 'klempner' })
    .eq('slug', 'shk')
  
  if (tradeError) {
    console.error('❌ Trade update failed:', tradeError.message)
  } else {
    console.log('✅ Trades updated')
  }

  // 2. Update landing_pages slugs
  console.log('2️⃣ Updating landing_pages slugs...')
  const { data: pages, error: fetchError } = await supabase
    .from('landing_pages')
    .select('id, slug')
    .like('slug', 'shk-%')
  
  if (fetchError) {
    console.error('❌ Fetch failed:', fetchError.message)
    return
  }

  console.log(`   Found ${pages?.length || 0} pages to update`)

  for (const page of pages || []) {
    const newSlug = page.slug.replace(/^shk-/, 'klempner-')
    const { error } = await supabase
      .from('landing_pages')
      .update({ slug: newSlug })
      .eq('id', page.id)
    
    if (error) {
      console.error(`   ❌ Failed to update ${page.slug}:`, error.message)
    } else {
      console.log(`   ✅ ${page.slug} → ${newSlug}`)
    }
  }

  console.log('\n🎉 Migration complete!')
}

migrate().catch(console.error)
