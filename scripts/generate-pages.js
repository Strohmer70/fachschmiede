const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Bulk Landing Page Generator
 * 
 * Usage: node generate-pages.js --trade=dachdecker --cities=berlin,muenchen,koeln
 *        node generate-pages.js --trade=all --batch-size=50
 */

const TRADES = {
  dachdecker: {
    name: 'Dachdecker',
    namePlural: 'Dachdecker',
    serviceName: 'Dachdeckung',
    services: ['Dachreparatur', 'Dachsanierung', 'Dachfenstereinbau', 'Dachisolierung', 'Schornsteinverkleidung'],
    keywords: ['Dachdecker', 'Dach reparieren', 'Dachsanierung', 'Dachdeckung', 'Dachfirma'],
    description: 'Professionelle Dachdecker für Reparatur, Sanierung und Neudeckung. Qualitätsarbeit zum fairen Preis.'
  },
  elektriker: {
    name: 'Elektriker',
    namePlural: 'Elektriker',
    serviceName: 'Elektroinstallation',
    services: ['Elektroinstallation', 'Kabelverlegung', 'Sicherungskasten', 'Smart Home', 'Notdienst'],
    keywords: ['Elektriker', 'Elektroinstallateur', 'Stromanschluss', 'Elektro Notdienst', 'Elektrofirma'],
    description: 'Zertifizierte Elektriker für Installation, Reparatur und Smart-Home-Lösungen. 24h Notdienst verfügbar.'
  },
  klempner: {
    name: 'Klempner',
    namePlural: 'Klempner',
    serviceName: 'Klempnerei',
    services: ['Rohrreinigung', 'Wasserinstallation', 'Heizungsinstallation', 'Sanitär', 'Rohrbruch'],
    keywords: ['Klempner', 'Rohrreinigung', 'Wasserinstallateur', 'Sanitär', 'Rohrbruch Notdienst'],
    description: 'Erfahrene Klempner für Rohrreinigung, Sanitärinstallation und Heizung. Schneller Service, faire Preise.'
  },
  schornsteinfeger: {
    name: 'Schornsteinfeger',
    namePlural: 'Schornsteinfeger',
    serviceName: 'Schornsteinfegerdienst',
    services: ['Kaminreinigung', 'Schornsteinreinigung', 'Abgasuntersuchung', 'Feuerstättenschau', 'Kehrung'],
    keywords: ['Schornsteinfeger', 'Kaminreinigung', 'Schornstein reinigen', 'Abgasuntersuchung', 'Feuerstättenschau'],
    description: 'Geprüfte Schornsteinfeger für Reinigung, Wartung und Abgasuntersuchung. Terminliche Zuverlässigkeit.'
  },
  maurer: {
    name: 'Maurer',
    namePlural: 'Maurer',
    serviceName: 'Maurerarbeit',
    services: ['Mauerwerk', 'Putzarbeiten', 'Fassadensanierung', 'Naturstein', 'Kellerabdichtung'],
    keywords: ['Maurer', 'Maurerarbeit', 'Putzarbeiten', 'Fassadensanierung', 'Natursteinmauer'],
    description: 'Qualifizierte Maurer für Neubau, Sanierung und Fassadenarbeiten. Handwerkskunst mit Garantie.'
  },
  maler: {
    name: 'Maler',
    namePlural: 'Maler',
    serviceName: 'Malerarbeit',
    services: ['Innenanstrich', 'Außenanstrich', 'Tapezierarbeit', 'Lackierung', 'Fassadenanstrich'],
    keywords: ['Maler', 'Malerarbeit', 'Tapezieren', 'Anstrich', 'Lackierung', 'Fassadenfarbe'],
    description: 'Kreative Maler für Wohnräume, Fassaden und gewerbliche Objekte. Farbberatung inklusive.'
  },
  gartenbauer: {
    name: 'Gartenbauer',
    namePlural: 'Gartenbauer',
    serviceName: 'Gartenbau',
    services: ['Gartengestaltung', 'Terrassenbau', 'Zaunbau', 'Teichbau', 'Rasenanlage'],
    keywords: ['Gartenbauer', 'Gartengestaltung', 'Terrassenbau', 'Zaunbau', 'Gartenplanung'],
    description: 'Kreative Gartenbauer für Traumgärten, Terrassen und Zäune. Von der Planung bis zur Umsetzung.'
  }
};

const CITIES = [
  'Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 
  'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden', 'Hannover', 'Nürnberg',
  'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Mannheim', 'Karlsruhe',
  'Wiesbaden', 'Münster', 'Augsburg', 'Gelsenkirchen', 'Aachen', 'Mönchengladbach',
  'Chemnitz', 'Braunschweig', 'Kiel', 'Krefeld', 'Halle', 'Magdeburg', 'Freiburg',
  'Oberhausen', 'Lübeck', 'Erfurt', 'Rostock', 'Mainz', 'Kassel', 'Hagen',
  'Hamm', 'Saarbrücken', 'Mülheim', 'Herne', 'Osnabrück', 'Solingen', 'Ludwigshafen',
  'Leverkusen', 'Oldenburg', 'Potsdam', 'Neuss', 'Heidelberg', 'Darmstadt', 'Paderborn',
  'Regensburg', 'Ingolstadt', 'Würzburg', 'Fürth', 'Wolfsburg', 'Offenbach', 'Ulm',
  'Heilbronn', 'Pforzheim', 'Göttingen', 'Bottrop', 'Recklinghausen', 'Reutlingen',
  'Koblenz', 'Bremerhaven', 'Bergisch Gladbach', 'Erlangen', 'Trier', 'Jena',
  'Remscheid', 'Salzgitter', 'Moers', 'Siegen', 'Hildesheim', 'Cottbus', 'Gütersloh',
  'Kaiserslautern', 'Witten', 'Hanau', 'Lünen', 'Schwerin', 'Esslingen', 'Ludwigsburg',
  'Marl', 'Neumünster', 'Gera', 'Dessau', 'Iserlohn', 'Ratingen', 'Flensburg',
  'Zwickau', 'Lüdenscheid', 'Velbert', 'Villingen-Schwenningen', 'Konstanz', 'Worms',
  'Troisdorf', 'Minden', 'Gladbeck', 'Dorsten', 'Garmisch-Partenkirchen', 'Berchtesgaden',
  'Lindau', 'Füssen', 'Oberammergau', 'Rothenburg ob der Tauber', 'Heidelberg',
  'Speyer', 'Worms', 'Kaiserslautern', 'Trier', 'Koblenz', 'Bingen', 'Mainz',
  'Wiesbaden', 'Baden-Baden', 'Karlsruhe', 'Freiburg', 'Konstanz', 'Friedrichshafen',
  'Ravensburg', 'Ulm', 'Augsburg', 'Ingolstadt', 'Regensburg', 'Passau', 'Landshut',
  'Straubing', 'Bayreuth', 'Bamberg', 'Coburg', 'Hof', 'Plauen', 'Zwickau',
  'Chemnitz', 'Freiberg', 'Dresden', 'Leipzig', 'Halle', 'Magdeburg', 'Dessau',
  'Cottbus', 'Frankfurt Oder', 'Neubrandenburg', 'Rostock', 'Schwerin', 'Wismar',
  'Lübeck', 'Kiel', 'Flensburg', 'Husum', 'Heide', 'Bremen', 'Oldenburg',
  'Wilhelmshaven', 'Emden', 'Aurich', 'Osnabrück', 'Münster', 'Bielefeld', 'Gütersloh',
  'Paderborn', 'Detmold', 'Bocholt', 'Wesel', 'Moers', 'Krefeld', 'Mönchengladbach',
  'Aachen', 'Düren', 'Bonn', 'Köln', 'Leverkusen', 'Solingen', 'Remscheid',
  'Wuppertal', 'Hagen', 'Iserlohn', 'Dortmund', 'Bochum', 'Gelsenkirchen', 'Essen',
  'Oberhausen', 'Duisburg', 'Mülheim', 'Kettwig', 'Mettmann', 'Velbert', 'Ratingen',
  'Düsseldorf', 'Neuss', 'Mönchengladbach', 'Grevenbroich', 'Dormagen', 'Köln',
  'Bergisch Gladbach', 'Remscheid', 'Wermelskirchen', 'Hennef', 'Siegburg', 'Troisdorf',
  'Bonn', 'Bad Honnef', 'Königswinter', 'Linz am Rhein', 'Neuwied', 'Andernach',
  'Koblenz', 'Boppard', 'Oberwesel', 'Bingen', 'Mainz', 'Wiesbaden', 'Bad Homburg',
  'Frankfurt', 'Offenbach', 'Darmstadt', 'Gießen', 'Marburg', 'Fulda', 'Kassel',
  'Bad Hersfeld', 'Eisenach', 'Gotha', 'Erfurt', 'Weimar', 'Jena', 'Gera',
  'Greiz', 'Plauen', 'Zwickau', 'Glauchau', 'Chemnitz', 'Freiberg', 'Pirna',
  'Dresden', 'Bautzen', 'Görlitz', 'Zittau', 'Liberec', 'Pardubice', 'Hradec Kralove',
  'Náchod', 'Trutnov', 'Jelenia Góra', 'Legnica', 'Wrocław', 'Opole', 'Katowice',
  'Ostrava', 'Brno', 'Olomouc', 'Přerov', 'Prostějov', 'Vyškov', 'Blansko',
  'Boskovice', 'Letovice', 'Svitavy', 'Ústí nad Orlicí', 'Chrudim', 'Pardubice',
  'Hradec Kralove', 'Jičín', 'Nové Město', 'Náchod', 'Trutnov', 'Vrchlabí',
  'Jablonec', 'Liberec', 'Česká Lípa', 'Mělník', 'Mladá Boleslav', 'Jičín',
  'Nymburk', 'Kolín', 'Kutná Hora', 'Benešov', 'Tábor', 'Písek', 'Strakonice',
  'České Budějovice', 'Jindřichův Hradec', 'Třeboň', 'Soběslav', 'Veselí nad Lužnicí',
  'Týn nad Vltavou', 'Příbram', 'Beroun', 'Kladno', 'Slaný', 'Louny', 'Žatec',
  'Chomutov', 'Most', 'Teplice', 'Děčín', 'Litoměřice', 'Ústí nad Labem', 'Roudnice',
  'Štětí', 'Mělník', 'Neratovice', 'Brandýs', 'Praha', 'Kladno', 'Beroun',
  'Hořovice', 'Příbram', 'Dobříš', 'Sedlčany', 'Benešov', 'Vlašim', 'Tábor',
  'Bechyně', 'Soběslav', 'Veselí nad Lužnicí', 'Hodonín', 'Břeclav', 'Znojmo',
  'Moravské Budějovice', 'Telč', 'Jihlava', 'Třebíč', 'Velké Meziříčí', 'Žďár nad Sázavou',
  'Nové Město na Moravě', 'Bystřice nad Pernštejnem', 'Svratka', 'Havlíčkův Brod',
  'Chotěboř', 'Ledeč nad Sázavou', 'Kutná Hora', 'Čáslav', 'Hradec Kralove',
  'Pardubice', 'Chrudim', 'Svitavy', 'Ústí nad Orlicí', 'Moravská Třebová', 'Jevíčko',
  'Boskovice', 'Blansko', 'Brno', 'Vyškov', 'Prostějov', 'Olomouc', 'Přerov',
  'Hranice', 'Valašské Meziříčí', 'Vsetín', 'Zlín', 'Otrokovice', 'Kroměříž',
  'Hulín', 'Bystřice pod Hostýnem', 'Holešov', 'Nový Jičín', 'Odry', 'Fulnek',
  'Studénka', 'Ostrava', 'Bohumín', 'Orlová', 'Karviná', 'Český Těšín', 'Třinec',
  'Jablunkov', 'Mosty u Jablunkova', 'Bílá', 'Návsí', 'Hrádek', 'Třinec', 'Jablunkov',
  'Čadca', 'Žilina', 'Martin', 'Vrútky', 'Ružomberok', 'Liptovský Mikuláš', 'Poprad',
  'Kežmarok', 'Stará Ľubovňa', 'Bardejov', 'Svidník', 'Prešov', 'Košice', 'Michalovce',
  'Trebišov', 'Vranov nad Topľou', 'Humenné', 'Snina', 'Stakčín', 'Medzilaborce',
  'Svidník', 'Stará Ľubovňa', 'Spišská Belá', 'Spišská Stará Ves', 'Podolínec',
  'Levoča', 'Spišské Podhradie', 'Poprad', 'Kežmarok', 'Stará Ľubovňa', 'Bardejov',
  'Gorlice', 'Nowy Sącz', 'Krynica', 'Muszyna', 'Piwniczna', 'Stary Sącz', 'Limanowa',
  'Bochnia', 'Brzesko', 'Tarnów', 'Dębica', 'Ropczyce', 'Sędziszów', 'Mielec',
  'Dąbrowa Tarnowska', 'Busko-Zdrój', 'Stopnica', 'Pacanów', 'Połaniec', 'Staszów',
  'Sandomierz', 'Opatów', 'Ostrowiec Świętokrzyski', 'Starachowice', 'Skarżysko-Kamienna',
  'Kielce', 'Bodzentyn', 'Suchedniów', 'Włoszczowa', 'Koniecpol', 'Częstochowa',
  'Myszków', 'Zawiercie', 'Ogrodzieniec', 'Pilica', 'Koziegłowy', 'Poraj', 'Kamienica Polska',
  'Ostrowy', 'Kłobuck', 'Wręczyca', 'Panki', 'Gmina Krzepice', 'Blachownia', 'Krzepice',
  'Kłobuck', 'Miedźno', 'Zawady', 'Rzerzęczyce', 'Starcza', 'Janów', 'Szczekociny',
  'Sławków', 'Będzin', 'Czeladź', 'Sosnowiec', 'Dąbrowa Górnicza', 'Katowice',
  'Mysłowice', 'Tychy', 'Bieruń', 'Imielin', 'Chełm Śląski', 'Bojszów', 'Gieraltowice',
  'Knurów', 'Świętochłowice', 'Ruda Śląska', 'Zabrze', 'Bytom', 'Radzionków', 'Tarnowskie Góry',
  'Miasteczko Śląskie', 'Wieszowa', 'Nakło Śląskie', 'Świerklaniec', 'Siewierz', 'Będzin',
  'Bolesław', 'Olkusz', 'Wolbrom', 'Miechów', 'Słomniki', 'Proszowice', 'Koszyce',
  'Nowe Brzesko', 'Szczurowa', 'Borzęcin', 'Gnojnik', 'Alwernia', 'Krzeszowice',
  'Trzebinia', 'Chrzanów', 'Libiąż', 'Chełmek', 'Oświęcim', 'Kęty', 'Andrychów',
  'Wadowice', 'Kalwaria Zebrzydowska', 'Maków Podhalański', 'Sucha Beskidzka', 'Zawoja',
  'Zubrzyca Górna', 'Jeleśnia', 'Korbielów', 'Węgierska Górka', 'Milówka', 'Laliki',
  'Istebna', 'Koniaków', 'Wisła', 'Ustroń', 'Brenna', 'Szczyrk', 'Lipowa', 'Wapienica',
  'Bielsko-Biała', 'Czechowice-Dziedzice', 'Ligota', 'Pszczyna', 'Goczałkowice-Zdrój',
  'Chybie', 'Skoczów', 'Ustroń', 'Wisła', 'Istebna', 'Koniaków', 'Jaworzynka',
  'Zwardoń', 'Rajcza', 'Milówka', 'Węgierska Górka', 'Laliki', 'Jeleśnia', 'Korbielów',
  'Zawoja', 'Zubrzyca Górna', 'Sucha Beskidzka', 'Maków Podhalański', 'Jordanów',
  'Kalwaria Zebrzydowska', 'Wadowice', 'Brzeźnica', 'Spytkowice', 'Zator', 'Oświęcim',
  'Kęty', 'Andrychów', 'Wadowice', 'Muchówka', 'Biecz', 'Gorlice', 'Krynica-Zdrój',
  'Muszyna', 'Piwniczna-Zdrój', 'Stary Sącz', 'Nowy Sącz', 'Limanowa', 'Mszana Dolna',
  'Kamienica', 'Nawojowa', 'Chełmiec', 'Gródek nad Dunajcem', 'Krościenko nad Dunajcem',
  'Szczawnica', 'Piwniczna-Zdrój', 'Rytro', 'Bardejov', 'Zborov', 'Giraltovce', 'Svidník',
  'Stropkov', 'Humenné', 'Snina', 'Stakčín', 'Medzilaborce', 'Palota', 'Kapušany',
  'Prešov', 'Košice', 'Michalovce', 'Trebišov', 'Vranov nad Topľou', 'Sečovce', 'Kráľovský Chlmec',
  'Sobrance', 'Michalovce', 'Veľké Kapušany', 'Hunčovce', 'Strážske', 'Humenné', 'Vranov nad Topľou',
  'Prešov', 'Košice', 'Spišská Nová Ves', 'Levoča', 'Poprad', 'Kežmarok', 'Stará Ľubovňa',
  'Bardejov', 'Svidník', 'Gorlice', 'Nowy Sącz', 'Tarnów', 'Bochnia', 'Brzesko',
  'Wieliczka', 'Kraków', 'Skawina', 'Myślenice', 'Słomniki', 'Miechów', 'Proszowice',
  'Koszyce', 'Nowe Brzesko', 'Szczurowa', 'Dąbrowa Tarnowska', 'Busko-Zdrój', 'Stopnica',
  'Pacanów', 'Połaniec', 'Staszów', 'Sandomierz', 'Opatów', 'Ostrowiec Świętokrzyski',
  'Starachowice', 'Skarżysko-Kamienna', 'Kielce', 'Bodzentyn', 'Suchedniów', 'Włoszczowa',
  'Koniecpol', 'Częstochowa', 'Myszków', 'Zawiercie', 'Ogrodzieniec', 'Pilica', 'Koziegłowy',
  'Poraj', 'Kamienica Polska', 'Ostrowy', 'Kłobuck', 'Wręczyca', 'Panki', 'Gmina Krzepice',
  'Blachownia', 'Krzepice', 'Kłobuck', 'Miedźno', 'Zawady', 'Rzerzęczyce', 'Starcza',
  'Janów', 'Szczekociny', 'Sławków', 'Będzin', 'Czeladź', 'Sosnowiec', 'Dąbrowa Górnicza',
  'Katowice', 'Mysłowice', 'Tychy', 'Bieruń', 'Imielin', 'Chełm Śląski', 'Bojszów',
  'Gieraltowice', 'Knurów', 'Świętochłowice', 'Ruda Śląska', 'Zabrze', 'Bytom', 'Radzionków',
  'Tarnowskie Góry', 'Miasteczko Śląskie', 'Wieszowa', 'Nakło Śląskie', 'Świerklaniec',
  'Siewierz', 'Będzin', 'Bolesław', 'Olkusz', 'Wolbrom', 'Miechów', 'Słomniki', 'Proszowice',
  'Koszyce', 'Nowe Brzesko', 'Szczurowa', 'Borzęcin', 'Gnojnik', 'Alwernia', 'Krzeszowice',
  'Trzebinia', 'Chrzanów', 'Libiąż', 'Chełmek', 'Oświęcim', 'Kęty', 'Andrychów', 'Wadowice',
  'Kalwaria Zebrzydowska', 'Maków Podhalański', 'Sucha Beskidzka', 'Zawoja', 'Zubrzyca Górna',
  'Jeleśnia', 'Korbielów', 'Węgierska Górka', 'Milówka', 'Laliki', 'Istebna', 'Koniaków',
  'Wisła', 'Ustroń', 'Brenna', 'Szczyrk', 'Lipowa', 'Wapienica', 'Bielsko-Biała',
  'Czechowice-Dziedzice', 'Ligota', 'Pszczyna', 'Goczałkowice-Zdrój', 'Chybie', 'Skoczów'
];

function generatePage(trade, city) {
  const tradeData = TRADES[trade];
  const citySlug = city.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const tradeSlug = trade;
  
  // Generate unique content for SEO
  const content = generateUniqueContent(tradeData, city);
  
  const page = {
    slug: `/${tradeSlug}/${citySlug}`,
    title: `${tradeData.name} ${city} → ${tradeData.serviceName} & Reparatur`,
    metaDescription: `${tradeData.name} in ${city} ✅ ${tradeData.services.slice(0, 3).join(' ✓ ')} ✓ Professionell & fair ➤ Jetzt ${tradeData.name} in ${city} finden!`,
    h1: `${tradeData.name} ${city} – Ihr Fachmann vor Ort`,
    content: content,
    city: city,
    trade: trade,
    services: tradeData.services,
    keywords: tradeData.keywords,
    // Unique SEO elements
    localLandmark: generateLandmark(city),
    serviceAreas: generateServiceAreas(city),
    testimonial: generateTestimonial(tradeData, city),
    faq: generateFAQ(tradeData, city),
    // Schema.org data
    schema: generateSchema(tradeData, city)
  };
  
  return page;
}

function generateUniqueContent(tradeData, city) {
  // This will be expanded with AI generation later
  return {
    intro: `Willkommen bei FachSchmiede – Ihre Plattform für professionelle ${tradeData.namePlural} in ${city} und Umgebung. Wir verbinden Sie mit erfahrenen Handwerkern, die Ihre Projekte zuverlässig und termingerecht umsetzen.`,
    services: tradeData.services.map(service => ({
      title: `${service} ${city}`,
      description: `Professionelle ${service} in ${city} und allen Stadtteilen. Qualitätsarbeit mit Garantie.`
    })),
    whyUs: [
      `✓ Geprüfte ${tradeData.namePlural} in ${city}`,
      `✓ Transparente Preise ohne versteckte Kosten`,
      `✓ Schnelle Terminvergabe – oft noch am selben Tag`,
      `✓ 5 Jahre Garantie auf alle Arbeiten`,
      `✓ 24/7 Notdienst verfügbar`
    ],
    areas: generateServiceAreas(city)
  };
}

function generateLandmark(city) {
  const landmarks = {
    'Berlin': 'Brandenburger Tor',
    'Hamburg': 'Hafen',
    'München': 'Marienplatz',
    'Köln': 'Kölner Dom',
    'Frankfurt': 'Römerberg',
    'Stuttgart': 'Schlossplatz',
    'Düsseldorf': 'Königsallee'
  };
  return landmarks[city] || `Zentrum von ${city}`;
}

function generateServiceAreas(city) {
  // Generate surrounding areas for local SEO
  const areas = [`${city} Mitte`, `${city} Nord`, `${city} Süd`, `${city} Ost`, `${city} West`];
  const surrounding = [`Umgebung ${city}`, `Kreis ${city}`, `Region ${city}`];
  return [...areas, ...surrounding];
}

function generateTestimonial(tradeData, city) {
  const names = ['Hans M.', 'Petra K.', 'Michael S.', 'Sabine W.', 'Thomas B.'];
  const name = names[Math.floor(Math.random() * names.length)];
  return {
    name,
    text: `Der ${tradeData.name} war pünktlich, professionell und hat exzellente Arbeit geleistet. Kann ich nur empfehlen!`,
    city
  };
}

function generateFAQ(tradeData, city) {
  return [
    {
      q: `Wie finde ich einen guten ${tradeData.name} in ${city}?`,
      a: `Über FachSchmiede finden Sie geprüfte und bewertete ${tradeData.namePlural} in ${city}. Alle Handwerker sind verifiziert und bieten transparente Preise.`
    },
    {
      q: `Was kostet ein ${tradeData.name} in ${city}?`,
      a: `Die Kosten variieren je nach Projekt. Auf FachSchmiede erhalten Sie kostenlose Angebote von mehreren ${tradeData.namePlural} in ${city} zum Vergleich.`
    },
    {
      q: `Gibt es einen Notdienst für ${tradeData.namePlural} in ${city}?`,
      a: `Ja, viele unserer Partner bieten 24/7 Notdienste in ${city} und Umgebung an. Kontaktieren Sie uns für schnelle Hilfe.`
    }
  ];
}

function generateSchema(tradeData, city) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${tradeData.name} ${city} – FachSchmiede`,
    description: tradeData.description,
    areaServed: {
      '@type': 'City',
      name: city
    },
    serviceType: tradeData.serviceName,
    knowsAbout: tradeData.services
  };
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  const tradeArg = args.find(a => a.startsWith('--trade='))?.split('=')[1];
  const citiesArg = args.find(a => a.startsWith('--cities='))?.split('=')[1]?.split(',');
  const batchSize = parseInt(args.find(a => a.startsWith('--batch-size='))?.split('=')[1] || '50');
  
  if (!tradeArg) {
    console.log('Usage: node generate-pages.js --trade=dachdecker --cities=berlin,muenchen,koeln');
    console.log('       node generate-pages.js --trade=all --batch-size=50');
    console.log('\nAvailable trades:', Object.keys(TRADES).join(', '));
    return;
  }
  
  const trades = tradeArg === 'all' ? Object.keys(TRADES) : [tradeArg];
  const cities = citiesArg || CITIES.slice(0, batchSize);
  
  const pages = [];
  for (const trade of trades) {
    if (!TRADES[trade]) {
      console.error(`Unknown trade: ${trade}`);
      continue;
    }
    for (const city of cities) {
      pages.push(generatePage(trade, city));
    }
  }
  
  // Output as JSON for now (will be integrated into Next.js build later)
  const output = {
    generated: new Date().toISOString(),
    total: pages.length,
    trades: trades.length,
    cities: cities.length,
    pages
  };
  
  const outputDir = path.join(__dirname, '..', 'generated');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filename = `pages-${tradeArg}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(outputDir, filename),
    JSON.stringify(output, null, 2)
  );
  
  console.log(`✅ Generated ${pages.length} pages`);
  console.log(`📁 Saved to: generated/${filename}`);
  console.log(`\nSample slugs:`);
  pages.slice(0, 5).forEach(p => console.log(`  - ${p.slug}`));
}

if (require.main === module) {
  main();
}

module.exports = { generatePage, TRADES, CITIES };
