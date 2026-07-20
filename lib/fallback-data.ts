// Fallback data for static export — works even without Supabase connection
export const FALLBACK_TRADES: Record<string, any> = {
  dachdecker: {
    slug: 'dachdecker',
    name: 'Dachdecker',
    plural_name: 'Dachdecker',
    services: ['Dachreparatur', 'Dachsanierung', 'Dachneubau', 'Dachisolierung', 'Dachrinnen', 'Schornsteinverkleidung', 'Dachfenster', 'Sturmschadenbeseitigung']
  },
  elektriker: {
    slug: 'elektriker',
    name: 'Elektriker',
    plural_name: 'Elektriker',
    services: ['Elektroinstallation', 'Stromausfall-Reparatur', 'Sicherungskasten-Modernisierung', 'Smart-Home-Installation', 'Elektroprüfung nach VDE', 'Beleuchtungsplanung']
  },
  klempner: {
    slug: 'klempner',
    name: 'Klempner',
    plural_name: 'Klempner',
    services: ['Rohrreinigung', 'Heizungsinstallation', 'Sanitärinstallation', 'Wasserhahn-Reparatur', 'Rohrbruch-Reparatur', 'Toiletten-Installation', 'Duschinstallation']
  }
}

export const FALLBACK_CITIES: Record<string, any> = {
  hattingen: {
    slug: 'hattingen',
    name: 'Hattingen',
    state: 'Nordrhein-Westfalen'
  },
  muenchen: {
    slug: 'muenchen',
    name: 'München',
    state: 'Bayern'
  }
}

export const FALLBACK_PAGES: Record<string, any> = {
  'dachdecker-hattingen': {
    slug: 'dachdecker-hattingen',
    title: 'Dachdecker Hattingen | Professionelle Dacharbeiten ab €149/Monat',
    meta_description: 'Erfahrene Dachdecker in Hattingen. Reparatur, Sanierung & Neubau. Jetzt lokale Dachdeckermeister finden.',
    h1: 'Ihr Dachdecker in Hattingen – Zuverlässig, Fair, Vor Ort',
    monthly_price: 14900,
    status: 'available',
    trade_id: 'dachdecker',
    city_id: 'hattingen'
  },
  'dachdecker-muenchen': {
    slug: 'dachdecker-muenchen',
    title: 'Dachdecker München | Professionelle Dacharbeiten ab €149/Monat',
    meta_description: 'Erfahrene Dachdecker in München. Reparatur, Sanierung & Neubau. Jetzt lokale Dachdeckermeister finden.',
    h1: 'Ihr Dachdecker in München – Zuverlässig, Fair, Vor Ort',
    monthly_price: 14900,
    status: 'available',
    trade_id: 'dachdecker',
    city_id: 'muenchen'
  },
  'elektriker-hattingen': {
    slug: 'elektriker-hattingen',
    title: 'Elektriker Hattingen | Professionelle Elektroarbeiten ab €149/Monat',
    meta_description: 'Erfahrene Elektriker in Hattingen. Installation, Reparatur & Smart-Home. Jetzt lokale Elektromeister finden.',
    h1: 'Ihr Elektriker in Hattingen – Zuverlässig, Fair, Vor Ort',
    monthly_price: 14900,
    status: 'available',
    trade_id: 'elektriker',
    city_id: 'hattingen'
  },
  'elektriker-muenchen': {
    slug: 'elektriker-muenchen',
    title: 'Elektriker München | Professionelle Elektroarbeiten ab €149/Monat',
    meta_description: 'Erfahrene Elektriker in München. Installation, Reparatur & Smart-Home. Jetzt lokale Elektromeister finden.',
    h1: 'Ihr Elektriker in München – Zuverlässig, Fair, Vor Ort',
    monthly_price: 14900,
    status: 'available',
    trade_id: 'elektriker',
    city_id: 'muenchen'
  },
  'klempner-muenchen': {
    slug: 'klempner-muenchen',
    title: 'Klempner München | Professionelle Sanitärarbeiten ab €149/Monat',
    meta_description: 'Erfahrene Klempner in München. Installation, Reparatur & Rohrreinigung. Jetzt lokale Fachbetriebe finden.',
    h1: 'Ihr Klempner in München – Zuverlässig, Fair, Vor Ort',
    monthly_price: 14900,
    status: 'available',
    trade_id: 'klempner',
    city_id: 'muenchen'
  }
}
