import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!key) {
    return NextResponse.json({ error: 'Key not set' }, { status: 500 });
  }
  
  // Test direct REST API call
  try {
    const res = await fetch('https://tlxlkmewbhnpzvrphcq.supabase.co/rest/v1/trades?limit=1', {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    
    if (res.status === 200) {
      const data = await res.json();
      return NextResponse.json({ 
        keyWorks: true, 
        keyPrefix: key.substring(0, 20) + '...',
        sampleData: data 
      });
    } else {
      const text = await res.text();
      return NextResponse.json({ 
        keyWorks: false, 
        status: res.status,
        error: text 
      });
    }
  } catch (e: any) {
    return NextResponse.json({ 
      keyWorks: false, 
      error: e.message 
    });
  }
}
