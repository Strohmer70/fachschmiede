import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'


// POST /api/setup/articles-table - One-time setup for articles table
export async function POST(request: NextRequest) {
  try {
    // Check if articles table already exists
    const { error: checkError } = await supabaseAdmin
      .from('articles')
      .select('id')
      .limit(1)
    
    if (!checkError) {
      return NextResponse.json({ 
        success: true, 
        message: 'Articles table already exists',
        alreadyExists: true 
      })
    }
    
    // Table doesn't exist, create it using raw SQL via RPC
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS articles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        landing_page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL,
        excerpt TEXT,
        meta_description TEXT,
        meta_title TEXT,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
        published_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ai_generated BOOLEAN DEFAULT TRUE,
        featured_image TEXT,
        word_count INTEGER DEFAULT 0,
        generated_at TIMESTAMP WITH TIME ZONE,
        generation_prompt TEXT,
        category TEXT,
        tags TEXT[] DEFAULT '{}',
        seo_score INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_articles_landing_page ON articles(landing_page_id);
      CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
      CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
      CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);

      ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Allow public read published articles" ON articles;
      CREATE POLICY "Allow public read published articles" 
        ON articles FOR SELECT 
        USING (status = 'published');

      DROP POLICY IF EXISTS "Allow service role full access" ON articles;
      CREATE POLICY "Allow service role full access" 
        ON articles FOR ALL 
        TO service_role 
        USING (true) WITH CHECK (true);
    `
    
    // Try to execute SQL via pgexec or similar
    // Since we can't execute raw SQL directly via REST API, 
    // let's try creating the table via the Supabase JS client by inserting a test record
    // which will fail but might trigger table creation... no that won't work.
    
    // Alternative: Try using the exec_sql function if it exists
    const { error: rpcError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createTableSQL
    })
    
    if (rpcError) {
      // exec_sql doesn't exist, we need manual setup
      return NextResponse.json({
        success: false,
        message: 'Automatic table creation not available. Please run SQL manually.',
        sql: createTableSQL,
        error: rpcError.message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Articles table created successfully!'
    })
    
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json({ 
      error: 'Setup failed', 
      message: error.message 
    }, { status: 500 })
  }
}

// GET /api/setup/articles-table - Check if table exists
export async function GET() {
  try {
    const { error } = await supabaseAdmin
      .from('articles')
      .select('id')
      .limit(1)
    
    if (error) {
      return NextResponse.json({
        exists: false,
        message: 'Articles table does not exist',
        error: error.message
      })
    }
    
    return NextResponse.json({
      exists: true,
      message: 'Articles table exists'
    })
  } catch (error: any) {
    return NextResponse.json({
      exists: false,
      message: error.message
    })
  }
}
