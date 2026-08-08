import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { secret } = await request.json().catch(() => ({}));
  if (secret !== 'fachschmiede-seed-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify service key exists
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // 1. Insert trades
    const tradeData = [
      { name: 'Dachdecker', slug: 'dachdecker', description: 'Dachdeckung, Dachsanierung, Dachreparatur' },
      { name: 'Elektriker', slug: 'elektriker', description: 'Elektroinstallation, Wartung, Reparatur' },
      { name: 'Klempner', slug: 'klempner', description: 'Heizung, Sanitär, Wasserinstallation' },
      { name: 'Zimmerer', slug: 'zimmerer', description: 'Zimmerei, Holzbau, Dachstühle' },
      { name: 'Maler', slug: 'maler', description: 'Malerarbeiten, Fassaden, Lackierung' }
    ];
    
    // Delete existing data first
    await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tenants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('landing_pages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('trades').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('cities').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { data: trades, error: tErr } = await supabase.from('trades').insert(tradeData).select();
    if (tErr) throw tErr;

    // 2. Insert cities
    const cityData = [
      'Hattingen', 'Schwerte', 'Dortmund', 'Hagen', 'Iserlohn',
      'Unna', 'Bochum', 'Witten', 'Lünen', 'Herne',
      'Castrop-Rauxel', 'Kamen', 'Bergkamen', 'Fröndenberg', 'Holzwickede',
      'Schwelm', 'Gevelsberg', 'Ennepetal', 'Sprockhövel', 'Wetter'
    ].map((name, i) => ({
      name,
      slug: name.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),
      population: 50000 + i * 5000
    }));

    const { data: cities, error: cErr } = await supabase.from('cities').insert(cityData).select();
    if (cErr) throw cErr;

    // 3. Insert landing pages with correct UUIDs
    const pages = [];
    for (const trade of trades || []) {
      for (const city of cities || []) {
        const isRented = Math.random() > 0.8;
        pages.push({
          slug: `${trade.slug}-${city.slug}`,
          trade_id: trade.id,
          city_id: city.id,
          title: `${trade.name} ${city.name} — Jetzt online mieten`,
          description: `Professionelle ${trade.name}-Website für ${city.name}. Bereits optimiert für Google.`,
          monthly_price: 14900,
          status: isRented ? 'rented' : 'available',
          seo_score: Math.floor(Math.random() * 30) + 70,
          content: JSON.stringify({
            hero: `Ihr zuverlässiger ${trade.name} in ${city.name}`,
            services: ['Beratung', 'Planung', 'Ausführung', 'Wartung'],
            faq: [
              { q: `Wie schnell ist ein ${trade.name} vor Ort?`, a: 'In der Regel innerhalb von 24 Stunden.' },
              { q: 'Gibt es eine Garantie?', a: 'Ja, 5 Jahre auf alle Arbeiten.' }
            ]
          })
        });
      }
    }

    const { data: insertedPages, error: pErr } = await supabase.from('landing_pages').insert(pages).select();
    if (pErr) throw pErr;

    // 4. Insert sample leads
    const rentedPages = (insertedPages || []).filter((p: any) => p.status === 'rented').slice(0, 5);
    const leads = rentedPages.map((p: any, i: number) => ({
      page_id: p.id,
      name: ['Max Mustermann', 'Erika Schmidt', 'Hans Müller', 'Sabine Weber', 'Thomas Klein'][i],
      email: `kunde${i+1}@example.de`,
      phone: `02324-${123456 + i}`,
      message: `Interesse an ${p.title}`,
      status: 'new'
    }));
    
    if (leads.length > 0) {
      await supabase.from('leads').insert(leads);
    }

    // 5. Insert sample tenants
    const tenantPages = rentedPages.slice(0, 3);
    const tenants = tenantPages.map((p: any, i: number) => ({
      page_id: p.id,
      company_name: ['Bergmann Bedachungen', 'Volt Elektrotechnik', 'SHK Krämer'][i],
      email: `mieter${i+1}@example.de`,
      phone: `02324-${654321 + i}`,
      monthly_price: p.monthly_price,
      password_hash: 'demo123',
      status: 'active'
    }));
    
    if (tenants.length > 0) {
      await supabase.from('tenants').insert(tenants);
    }

    return NextResponse.json({
      success: true,
      seeded: {
        trades: trades?.length || 0,
        cities: cities?.length || 0,
        pages: insertedPages?.length || 0,
        leads: leads.length,
        tenants: tenants.length
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
