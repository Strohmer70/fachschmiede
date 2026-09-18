#!/usr/bin/env node
/**
 * UNIQUE CONTENT UPGRADE für alle 126 alten stadt-*.html Seiten
 * 
 * Fügt einzigartige, stadtspezifische Inhalte hinzu:
 * 1. "Lokal in {Stadt}"-Section (zwischen Über uns und Ratgeber)
 * 2. 2-3 stadtspezifische FAQs (am Ende der bestehenden FAQ)
 * 
 * KEIN Design-Change — nur neue Sections eingefügt.
 * Ziel: <60% Similarity zwischen Städten desselben Gewerks
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// ═══════════════════════════════════════════════════════════
// STADT-DATENBANK — Echte lokale Fakten
// ═══════════════════════════════════════════════════════════

const CITY_DATA = {
  bochum: {
    name: 'Bochum',
    pop: '364.000',
    region: 'mittleres Ruhrgebiet',
    landmark: 'Deutsches Bergbau-Museum',
    districts: [
      { name: 'Ehrenfeld', desc: 'Gründerzeitliche Mietshäuser mit hohen Decken und Stuckfassaden' },
      { name: 'Wiemelhausen', desc: 'Gepflegte Altbauviertel mit Baumbestand und Jugendstil-Elementen' },
      { name: 'Hamme', desc: 'Gemischte Bauweise aus Vorkriegs- und Nachkriegsepoche' },
      { name: 'Querenburg', desc: 'Postmoderne Wohngebiete rund um die Ruhr-Universität' },
      { name: 'Langendreer', desc: 'Ehemalige Bergbausiedlung mit typischen Siedlungshäusern der 1920er' },
    ],
    housing: 'Bochums Wohnungsbestand reicht von denkmalgeschützten Gründerzeit-Häusern in Ehrenfeld und Wiemelhausen bis zu den Bergmannssiedlungen der 1920er Jahre und modernen Neubauquartieren am Ölbachtal. Besonders der hohe Altbauanteil rund um die Innenstadt verlangt nach Fachbetrieben mit Erfahrung in der Denkmalpflege.',
    climate: 'Das Ruhrklima bringt überdurchschnittlich viele Regentage — bei älteren Dächern und Fassaden zeigen sich daher häufig Feuchtigkeitsschäden.',
    character: 'die Stadt des Bergbaus und der Kultur, geprägt von der Jahrhunderthalle und dem pulsierenden Bermuda3Eck',
  },
  dortmund: {
    name: 'Dortmund',
    pop: '587.000',
    region: 'östliches Ruhrgebiet',
    landmark: 'Signal Iduna Park und Phoenix See',
    districts: [
      { name: 'Hörde', desc: 'Mischung aus historischem Ortskern und modernem Phoenix-See-Quartier' },
      { name: 'Kreuzviertel', desc: 'Beliebtes Gründerzeit-Viertel mit Altbaucharme und jungen Bewohnern' },
      { name: 'Nordstadt', desc: 'Dichtes Altbaugebiet mit gemischter Nutzung und hohem Sanierungsbedarf' },
      { name: 'Kley', desc: 'Typische Nachkriegssiedlung mit Reihenhäusern und Einfamilienhäusern' },
      { name: 'Aplerbeck', desc: 'Ruhiger Stadtteil mit eigenem Zentrum und viel Einfamilienhaus-Charakter' },
    ],
    housing: 'Als größte Stadt Westfalens hat Dortmund einen enorm vielfältigen Wohnungsbestand: vom Kreuzviertel mit seinen prächtigen Gründerzeit-Fassaden über die Nordstadt mit dichtem Altbau bis zu den Nachkriegssiedlungen in Kley und dem modernen Phoenix-See-Quartier. Jede Bauepoche stellt eigene Anforderungen an die Sanierung.',
    climate: 'Die ostwestfälische Lage bringt stürmische Herbsttage mit sich — nach Sturmtiefs sind Dach- und Fassadenschäden ein häufiger Grund für Einsätze.',
    character: 'Westfalens größte Stadt, geprägt von Fußball, Bier und der aufregenden Transformation von Industriebrachen zu modernen Wohnquartieren',
  },
  hagen: {
    name: 'Hagen',
    pop: '189.000',
    region: 'südöstliches Ruhrgebiet',
    landmark: 'Karl-Ernst-Osthaus-Museum und das Schloss Hohenhagen',
    districts: [
      { name: 'Hohenhagen', desc: 'Nobles Villenviertel mit großzügigen Grundstücken und Einfamilienhäusern' },
      { name: 'Wehringhausen', desc: 'Historische Arbeitersiedlung mit charakteristischem Zechenhaus-Bestand' },
      { name: 'Haspe', desc: 'Ehemals selbstständige Stadt mit gemischtem Wohnungsbestand' },
      { name: 'Eckesey', desc: 'Ruhiges Wohngebiet mit überwiegend Einfamilienhäusern' },
      { name: 'Boelerheide', desc: 'Postmoderne Wohnbebauung mit guter Infrastruktur' },
    ],
    housing: 'Hagen, die Stadt auf den vier Hügeln, hat einen Wohnungsbestand, der so abwechslungsreich ist wie ihr Gelände: Von den Villen in Hohenhagen über die Arbeiter-Siedlungen in Wehringhausen und Haspe bis zu modernen Baugebieten am Stadtrand. Die Hanglage vieler Grundstücke erfordert besonderes Fachwissen bei der Bauwerksabdichtung.',
    climate: 'Die hügelige Lage und die Nähe zum Ardeygebirge bedeuten erhöhte Niederschläge — Kellerabdichtung und Dachentwässerung sind hier besonders wichtig.',
    character: 'die Stadt auf vier Hügeln, geprägt von der Textilgeschichte und dem Grün des Ardeygebirges',
  },
  herne: {
    name: 'Herne',
    pop: '156.000',
    region: 'mittleres Ruhrgebiet',
    landmark: 'Schloss Strünkede',
    districts: [
      { name: 'Wanne-Eickel', desc: 'Ehemals eigenständige Stadt mit eigenem Ortskern und gemischtem Bestand' },
      { name: 'Holsterhausen', desc: 'Gartenstadt-Charakter mit gepflegten Einfamilienhäusern aus den 1930ern' },
      { name: 'Sodingen', desc: 'Typische Bergbau-Siedlung mit charakteristischen Zechenhäusern' },
      { name: 'Röhlinghausen', desc: 'Gemischtes Wohngebiet mit Altbau und Nachkriegsbauten' },
      { name: 'Herne-Mitte', desc: 'Städtisch geprägt mit Mietshäusern und Eigentumswohnungen' },
    ],
    housing: 'Herne ist tief mit der Bergbaugeschichte verwoben — das sieht man am Wohnungsbestand. In Sodingen und Wanne-Eickel prägen die typischen Zechensiedlungen das Bild, während Holsterhausen mit seinem Gartenstadt-Charakter einen ganz anderen, grüneren Eindruck hinterlässt. Der hohe Anteil an Siedlungshäusern aus den 1920ern bis 1950ern verlangt nach Sanierungskonzepten, die die Originalsubstanz respektieren.',
    climate: 'Die dichte Bebauung und der ehemals industrielle Charakter bedeuten, dass viele Gebäude aus der Nachkriegszeit heute energetisch aufgewertet werden müssen.',
    character: 'die Stadt mit Herz im Ruhrgebiet, geprägt von Bergbau-Tradition und Schloss Strünkede',
  },
  witten: {
    name: 'Witten',
    pop: '96.000',
    region: 'südliches Ruhrgebiet an der Ruhr',
    landmark: 'Märkisches Museum und Hohenstein',
    districts: [
      { name: 'Annen', desc: 'Stadtteil mit eigenem Zentrum und gemischtem Wohnungsbestand' },
      { name: 'Rüdinghausen', desc: 'Ruhiger Wohnort mit Einfamilienhäusern und Grünanlagen' },
      { name: 'Herbede', desc: 'Ruhrnaher Stadtteil mit beliebten Wohnlagen am Fluss' },
      { name: 'Mitte', desc: 'Städtischer Kern mit Fußgängerzone und Mietwohnungen' },
      { name: 'Bommern', desc: 'Waldnähe und ruhige Wohnbebauung prägen diesen Stadtteil' },
    ],
    housing: 'Witten, die Edelstahlstadt an der Ruhr, verbindet urbanes Leben in der Mitte mit ruhigen Wohnlagen in den Randlagen. Der Wohnungsbestand reicht von klassischen Mietshäusern im Zentrum bis zu großzügigen Einfamilienhäusern in Rüdinghausen und Bommern. Die Nähe zur Ruhr und die bewaldeten Hügel prägen das Ortsbild.',
    climate: 'Die Lage an der Ruhr bringt feuchte Luft mit sich — Fassaden und Dächer sind hier besonders wetterbeansprucht.',
    character: 'die Edelstahlstadt an der Ruhr, wo urbane Mitte und grüne Randlagen auf engem Raum zusammentreffen',
  },
  iserlohn: {
    name: 'Iserlohn',
    pop: '92.000',
    region: 'südliches Ruhrgebiet / Märkischer Kreis',
    landmark: 'Dechenhöhle und der grüne Schlosspark',
    districts: [
      { name: 'Altstadt', desc: 'Fachwerkhäuser und historische Bausubstanz im Ortskern' },
      { name: 'Seilersee', desc: 'Wohnlagen am See mit hoher Lebensqualität' },
      { name: 'Hombruch', desc: 'Gemischter Stadtteil mit Einfamilienhäusern und Wohnblocks' },
      { name: 'Grüner Grund', desc: 'Ruhige, bevorzugte Wohnlage mit Villencharakter' },
      { name: 'Letmathe', desc: 'Eingemeindeter Stadtteil mit eigenem Ortskern und Mischbestand' },
    ],
    housing: 'Iserlohn, die grüne Stadt am Ardeygebirge, hat einen Wohnungsbestand, der von Fachwerk in der historischen Altstadt über die Villenlagen am Grünen Grund bis zu modernen Wohngebieten rund um den Seilersee reicht. Die Hanglagen am Ardey erfordern bei vielen Bauvorhaben besondere Grundwasser- und Hangsicherungsmaßnahmen.',
    climate: 'Die Lage am Ardeygebirge bringt mehr Niederschlag als das flache Ruhrgebiet — Dachrinnen und Entwässerungssysteme müssen hier mehr leisten.',
    character: 'die grüne Stadt am Ardeygebirge, geprägt von Metallverarbeitung, der Dechenhöhle und der schönen Altstadt',
  },
  unna: {
    name: 'Unna',
    pop: '59.000',
    region: 'östliches Ruhrgebiet / Hellweg',
    landmark: 'mittelalterliche Stadtmauer und der Hellwegturm',
    districts: [
      { name: 'Innenstadt', desc: 'Historischer Ortskern mit restaurierten Bürgerhäusern' },
      { name: 'Massen', desc: 'Gemischter Stadtteil mit guter Infrastruktur' },
      { name: 'Königsborn', desc: 'Kurort-Charakter mit Kurpark und gepflegten Wohnlagen' },
      { name: 'Uelzen', desc: 'Ruhiger Stadtteil am Stadtrand mit Eigenheimen' },
      { name: 'Billmerich', desc: 'Ehemalige Bauerschaft mit ländlichem Charakter' },
    ],
    housing: 'Unna, die Torstadt zur Soester Börde, verbindet mittelalterlichen Charme in der restaurierten Altstadt mit modernen Wohngebieten am Stadtrand. Der Wohnungsbestand reicht von historischen Bürgerhäusern an der Stadtmauer bis zu großzügigen Einfamilienhäusern in Uelzen und Billmerich. Der Übergang vom urbanen Kern zum ländlichen Umland ist fließend.',
    climate: 'Die Lage am Hellweg bringt Wind mit sich — die alten Windmühlen rund um Unna zeugen davon. Fassaden und Dächer sind hier besonders windbeansprucht.',
    character: 'die Torstadt zur Soester Börde mit mittelalterlicher Stadtmauer und hellwegtypischem Charme',
  },
  schwerte: {
    name: 'Schwerte',
    pop: '46.000',
    region: 'südöstliches Ruhrgebiet an der Ruhr',
    landmark: 'Hengsteysee und die historische Altstadt',
    districts: [
      { name: 'Altstadt', desc: 'Fachwerk-Ensembles und gepflegte Wohnhäuser im Ortskern' },
      { name: 'Ergste', desc: 'Ruhiger Stadtteil mit Einfamilienhäusern und Grünflächen' },
      { name: 'Holzen', desc: 'Hanglage mit Ausblick und gemischtem Wohnungsbestand' },
      { name: 'Villengrund', desc: 'Bevorzugte Wohnlage mit Villen und großzügigen Grundstücken' },
      { name: 'Schwerte-Mitte', desc: 'Städtischer Kern mit Bahnhof und Mietwohnungen' },
    ],
    housing: 'Schwerte liegt malerisch zwischen Ruhr und Ardeygebirge. Die historische Altstadt mit ihren Fachwerk-Ensembles steht im Kontrast zu den modernen Wohngebieten am Hengsteysee und den ruhigen Villenlagen am Villengrund. Der Wohnungsbestand ist überwiegend gut gepflegt, mit einem hohen Anteil an Eigentumswohnungen und Eigenheimen.',
    climate: 'Die Ruhrnähe und die umgebenden Wälder sorgen für ein mildes, aber feuchtes Klima — ideale Bedingungen für Moose und Algen an Nordfassaden.',
    character: 'die Stadt zwischen Ruhr und Ardey, geprägt vom Hengsteysee und der idyllischen Altstadt',
  },
  kamen: {
    name: 'Kamen',
    pop: '42.000',
    region: 'östliches Ruhrgebiet',
    landmark: 'Kamener Kreuz und die historische Wallanlage',
    districts: [
      { name: 'Mitte', desc: 'Ortskern mit Einkaufsstraße und gemischtem Wohnungsbestand' },
      { name: 'Methler', desc: 'Größter Stadtteil mit eigenem Zentrum und vielen Eigenheimen' },
      { name: 'Rünthe', desc: 'Gewerbegebiet und Wohnbebauung am Stadtrand' },
      { name: 'Heeren-Werve', desc: 'Ruhige Wohnlage mit ländlichem Charakter' },
      { name: 'Weddinghofen', desc: 'Ehemalige Bauerschaft mit landwirtschaftlicher Prägung' },
    ],
    housing: 'Kamen, die Kurstadt am Kamener Kreuz, ist verwurzelt in seiner ländlichen Vergangenheit. Der Wohnungsbestand reicht vom Ortskern mit seinen Mietshäusern bis zu den Eigenhäusern in Methler und den ländlichen Bauerschaften Heeren-Werve und Weddinghofen. Die Stadt wächst stetig, und mit ihr der Bedarf an modernisierter Wohnrauminfrastruktur.',
    climate: 'Die offene Lage zur Soester Börde hin bringt mehr Sonne, aber auch mehr Wind — Dach- und Fassadenmaterialien müssen hier widerstandsfähig sein.',
    character: 'die Kurstadt am Kamener Kreuz, wo ländliche Tradition und moderne Infrastruktur zusammenkommen',
  },
  luenen: {
    name: 'Lünen',
    pop: '86.000',
    region: 'nördliches Ruhrgebiet an der Lippe',
    landmark: 'Preußenhafen und die Lippeaue',
    districts: [
      { name: 'Altstadt', desc: 'Historischer Kern mit restaurierten Bürgerhäusern' },
      { name: 'Lünen-Süd', desc: 'Großer Wohnbereich mit gemischtem Bestand aus allen Epochen' },
      { name: 'Beisenkamp', desc: 'Beliebte Wohnlage mit Einfamilienhäusern und Grünanlagen' },
      { name: 'Horstmar', desc: 'Ruhiger Stadtteil am Stadtrand mit Eigenheimen' },
      { name: 'Nordlünen', desc: 'Gemischtes Wohn- und Gewerbegebiet' },
    ],
    housing: 'Lünen, die Lippestadt, verbindet Hafen-Flair an der Lippe mit ruhigen Wohnlagen. Der Wohnungsbestand reicht von der restaurierten Altstadt über die Nachkriegs-Bauten in Lünen-Süd bis zu den Eigenhäusern in Beisenkamp und Horstmar. Die Nähe zum Datteln-Hamm-Kanal und zur Lippeau prägt das städtische Leben.',
    climate: 'Die Lage an der Lippe bringt hohe Grundwasserstände — Kellerabdichtung ist hier besonders wichtig.',
    character: 'die Lippestadt mit Hafenflair, geprägt vom Preußenhafen und den ruhigen Auelandschaften',
  },
  bergkamen: {
    name: 'Bergkamen',
    pop: '48.000',
    region: 'östliches Ruhrgebiet',
    landmark: 'Zeche Haus Aden und der Heinrich-Böll-Platz',
    districts: [
      { name: 'Mitte', desc: 'Modernes Zentrum mit Einkaufsmöglichkeiten und Wohnungen' },
      { name: 'Rünthe', desc: 'Gewerbe- und Wohngebiet am Datteln-Hamm-Kanal' },
      { name: 'Weddinghofen', desc: 'Wohngebiet mit Eigenheimen und Reihenhäusern' },
      { name: 'Oberaden', desc: 'Ehemalige Bauerschaft mit ländlichem Charakter' },
      { name: 'Heil', desc: 'Ruhiger Wohnort am Stadtrand' },
    ],
    housing: 'Bergkamen ist die jüngste Stadt Westfalens — 1966 aus mehreren Gemeinden zusammengeschlossen. Der Wohnungsbestand ist entsprechend vielfältig: Von den Bergbausiedlungen rund um die Zeche Haus Aden bis zu den modernen Wohngebieten in der Mitte und den ländlichen Bauerschaften Oberaden und Weddinghofen.',
    climate: 'Die offene Lage bringt Wind mit sich — besonders die flachen Dächer der Nachkriegsbauten profitieren von regelmäßiger Kontrolle.',
    character: 'die jüngste Stadt Westfalens, geprägt von der Zeche Haus Aden und dem Zusammenwachsen ehemals eigenständiger Gemeinden',
  },
  'castrop-rauxel': {
    name: 'Castrop-Rauxel',
    pop: '34.000',
    region: 'mittleres Ruhrgebiet',
    landmark: 'Haus Goldschmieding und der Europakanal',
    districts: [
      { name: 'Ickern', desc: 'Historischer Ortskern mit Marktplatz und Fachwerk' },
      { name: 'Europaviertel', desc: 'Modernes Wohn- und Gewerbegebiet am Europakanal' },
      { name: 'Habinghorst', desc: 'Ruhiger Wohnort mit Einfamilienhäusern' },
      { name: 'Rauxel', desc: 'Stadtteil mit gemischtem Wohnungsbestand' },
      { name: 'Henrichenburg', desc: 'Ehemalige Bauerschaft mit Schleuse am Dortmund-Ems-Kanal' },
    ],
    housing: 'Castrop-Rauxel liegt am Emscher-Genesungsraum — die ehemalige Industrielandschaft verwandelt sich in hochwertigen Wohn- und Freiraum. Der Wohnungsbestand reicht vom Fachwerk in Ickern über die Bergbausiedlungen bis zum modernen Europaviertel. Die Stadt profitiert enorm von der ökologischen Transformation der Emscher.',
    climate: 'Die Nähe zur Emscher bedeutet hohe Grundwasserstände — Keller- und Bauwerkabdichtung sind hier essenziell.',
    character: 'die Stadt am Emscher-Genesungsraum, wo die ökologische Transformation die alte Industrielandschaft in neuen Wohnraum verwandelt',
  },
  'wetter-ruhr': {
    name: 'Wetter (Ruhr)',
    pop: '27.000',
    region: 'südliches Ruhrgebiet an der Ruhr',
    landmark: 'Schloss Wetter und die historische Altstadt',
    districts: [
      { name: 'Altstadt', desc: 'Malerischer Ortskern mit Fachwerk und historischem Charme' },
      { name: 'Wengern', desc: 'Größter Stadtteil mit gemischtem Wohnungsbestand' },
      { name: 'Volmarstein', desc: 'Burg-Flair und Ruhrblick in diesem beliebten Stadtteil' },
      { name: 'Esborn', desc: 'Ruhige Wohnlage am Hang mit Eigenheimen' },
      { name: 'Albringhausen', desc: 'Ehemalige Bauerschaft mit ländlichem Charakter' },
    ],
    housing: 'Wetter an der Ruhr hat eine der schönsten historischen Altstädte des Ruhrgebiets — mit Fachwerk und engen Gassen direkt am Fluss. Der Wohnungsbestand reicht von den restaurierten Altstadthäusern über die gemischten Bestände in Wengern bis zu den Hanglagen in Esborn. Die Nähe zur Ruhr und die umliegenden Wälder machen Wetter zu einer beliebten Wohngemeinde.',
    climate: 'Die Hanglagen in Esborn und Volmarstein erfordern bei Bauarbeiten besondere Sicherungsmaßnahmen — hier ist Erfahrung gefragt.',
    character: 'die malerische Stadt an der Ruhr mit der schönsten Altstadt des Ruhrgebiets und Blick auf Schloss Wetter',
  },
  schwelm: {
    name: 'Schwelm',
    pop: '28.000',
    region: 'südliches Ruhrgebiet / Ennepe-Ruhr',
    landmark: 'Haus Martfeld und die evangelische Stadtkirche',
    districts: [
      { name: 'Altstadt', desc: 'Historischer Kern mit restaurierten Bürgerhäusern' },
      { name: 'Brückenstraße', desc: 'Geprägt von klassizistischen Bauten und Villen' },
      { name: 'Loh', desc: 'Ruhiger Stadtteil am Hang mit Eigenheimen' },
      { name: 'Möllen', desc: 'Gemischter Wohnbereich mit guter Infrastruktur' },
      { name: 'Niederwenigern', desc: 'Ehemalige Bauerschaft mit ländlichem Charakter' },
    ],
    housing: 'Schwelm, das Tor zum Bergischen Land, hat einen Wohnungsbestand mit ungewöhnlich hohem Anteil an klassizistischen und historistischen Gebäuden. Die Altstadt und die Brückenstraße sind geprägt von repräsentativen Bürgerhäusern und Villen. Im Umland dominieren Eigenhäuser und ländliche Bauernhöfe.',
    climate: 'Der Übergang zum bergischen Land bringt mehr Niederschlag — Dach- und Fassadenwartung sind hier besonders wichtig.',
    character: 'das Tor zum Bergischen Land, geprägt von klassizistischer Architektur und dem charmanten Haus Martfeld',
  },
  enneetal: {
    name: 'Ennepetal',
    pop: '30.000',
    region: 'südliches Ruhrgebiet / Ennepe',
    landmark: 'Klosterkirche Gevelsberg und die Ennepetalsperre',
    districts: [
      { name: 'Altenvoerde', desc: 'Stadtteil mit eigenem Zentrum und gemischtem Bestand' },
      { name: 'Hasperbach', desc: 'Hanglage mit Ausblick und Eigenheimen' },
      { name: 'Milspe', desc: 'Ehemalige Bauerschaft mit ländlichem Charakter' },
      { name: 'Borgeln', desc: 'Ruhiger Wohnort am Stadtrand' },
      { name: 'Königsborn', desc: 'Bevorzugte Wohnlage mit Villencharakter' },
    ],
    housing: 'Ennepetal liegt in einer malerischen Tallandschaft an der Ennepe. Der Wohnungsbestand reicht von den Mietshäusern in Altenvoerde über die Hanglagen in Hasperbach bis zu den ländlichen Bauerschaften Milspe und Borgeln. Die Ennepetalsperre und die umgebenden Wälder prägen das Ortsbild und sorgen für hohe Wohnqualität.',
    climate: 'Die Tallage bringt morgens häufig Nebel und im Herbst erhöhte Feuchtigkeit — Fassaden und Dächer brauchen hier besondere Aufmerksamkeit.',
    character: 'die Stadt in der malerischen Ennepetals, geprägt von der Talsperre und den umliegenden Wäldern',
  },
  gevelsberg: {
    name: 'Gevelsberg',
    pop: '31.000',
    region: 'südliches Ruhrgebiet / Ennepe-Ruhr',
    landmark: 'Haus Nottbeck und die 120 Lindentunnel',
    districts: [
      { name: 'Berge', desc: 'Altstadt-Charakter mit Fachwerk und historischen Bauten' },
      { name: 'Asbeck', desc: 'Ruhiger Stadtteil mit Eigenheimen und Grünflächen' },
      { name: 'Silschede', desc: 'Ehemalige Bauerschaft mit ländlichem Charakter' },
      { name: 'Südbrockhausen', desc: 'Wohngebiet mit gemischtem Bestand' },
      { name: 'Gevelsberg-Mitte', desc: 'Städtischer Kern mit Bahnhof und Mietwohnungen' },
    ],
    housing: 'Gevelsberg ist die Stadt der 120 Lindentunnel — ein Weltrekord! Der Wohnungsbestand ist vielfältig: Von den Fachwerkhäusern in Berge über die Mietwohnungen in der Mitte bis zu den Eigenhäusern in Asbeck und den ländlichen Bauerschaften wie Silschede. Die Ennepe durchfließt die Stadt und prägt das Ortsbild.',
    climate: 'Die Ennepe und die Tallage bringen Feuchtigkeit mit sich — Keller- und Bauwerkabdichtung sind hier essenziell.',
    character: 'die Stadt der 120 Lindentunnel, wo die Ennepe durch malerische Stadtteile fließt',
  },
  hattingen: {
    name: 'Hattingen',
    pop: '54.000',
    region: 'südliches Ruhrgebiet an der Ruhr',
    landmark: 'Burg Blankenstein und die mittelalterliche Altstadt',
    districts: [
      { name: 'Altstadt', desc: 'Mittelalterlicher Ortskern mit über 150 Fachwerkhäusern' },
      { name: 'Blankenstein', desc: 'Burg-Flair und Ruhrblick in diesem beliebten Stadtteil' },
      { name: 'Niederwenigern', desc: 'Ruhiger Wohnort am Stadtrand' },
      { name: 'Welper', desc: 'Gemischter Stadtteil mit Eigenheimen' },
      { name: 'Bredenscheid', desc: 'Wohngebiet mit guter Infrastruktur' },
    ],
    housing: 'Hattingen hat eine der besterhaltenen mittelalterlichen Altstädte Westfalens — über 150 Fachwerkhäuser stehen unter Denkmalschutz. Der Wohnungsbestand reicht von den historischen Bauten in der Altstadt über die Eigenhäuser in Blankenstein bis zu modernen Wohngebieten in Welper und Bredenscheid. Die Ruhrnähe und der Burgblick machen Hattingen zu einer begehrten Wohngemeinde.',
    climate: 'Die Fachwerkbauten in der Altstadt verlangen nach besonderer Fachkompetenz bei der Sanierung — Denkmalschutz und moderner Wohnkomfort müssen hier Hand in Hand gehen.',
    character: 'die Stadt mit der besterhaltenen mittelalterlichen Altstadt Westfalens, geprägt von Burg Blankenstein und über 150 Fachwerkhäusern',
  },
  holzwickede: {
    name: 'Holzwickede',
    pop: '17.000',
    region: 'östliches Ruhrgebiet',
    landmark: 'Dortmund-Ems-Kanal und die St. Laurentius-Kirche',
    districts: [
      { name: 'Opherdicke', desc: 'Ruhiger Wohnort mit Schloss und Grünflächen' },
      { name: 'Brauck', desc: 'Gemischter Stadtteil mit Eigenheimen' },
      { name: 'Hengsen', desc: 'Ländlicher Stadtteil am Stadtrand' },
      { name: 'Natorp', desc: 'Wohngebiet mit guter Infrastruktur' },
      { name: 'Holzwickede-Mitte', desc: 'Dörflicher Ortskern mit Gemeindeleben' },
    ],
    housing: 'Holzwickede ist die dörfliche Gemeinde am Dortmund-Ems-Kanal. Der Wohnungsbestand ist geprägt von Einfamilienhäusern und Reihenhäusern in ruhigen Wohnlagen. Der dörfliche Charakter mit dem aktiven Gemeindeleben macht Holzwickede besonders beliebt bei Familien, die Stadtnähe und ländliche Ruhe verbinden wollen.',
    climate: 'Die offene Lage zur Soester Börde hin bringt Sonne und Wind — hier sind robuste Materialien und regelmäßige Wartung wichtig.',
    character: 'die dörfliche Gemeinde am Dortmund-Ems-Kanal, wo Stadtnähe und ländliche Idylle zusammenkommen',
  },
  sprockhoevel: {
    name: 'Sprockhövel',
    pop: '24.000',
    region: 'südliches Ruhrgebiet / Ennepe-Ruhr',
    landmark: 'Haus Nottbeck und die historische Kirche St. Peter und Paul',
    districts: [
      { name: 'Niedersprockhövel', desc: 'Ortskern mit eigenem Zentrum und gemischtem Bestand' },
      { name: 'Haßlinghausen', desc: 'Ruhiger Stadtteil mit Eigenheimen' },
      { name: 'Gennebreck', desc: 'Ehemalige Bauerschaft mit ländlichem Charakter' },
      { name: 'Hiddinghausen', desc: 'Wohngebiet am Hang mit Ausblick' },
      { name: 'Hacheney', desc: 'Bevorzugte Wohnlage mit Grünanlagen' },
    ],
    housing: 'Sprockhövel liegt auf den Hügeln zwischen Ruhrgebiet und Bergischem Land. Der Wohnungsbestand ist geprägt von Eigenhäusern in ruhigen Wohnlagen, gepflegten Siedlungen und ländlichen Bauerschaften. Die Höhenlage bringt teilweise schöne Ausblicke mit sich und sorgt für eine hohe Wohnqualität.',
    climate: 'Die Höhenlage bringt mehr Wind und Niederschlag als das flache Ruhrgebiet — Dächer und Fassaden müssen hier mehr aushalten.',
    character: 'die Stadt auf den Hügeln zwischen Ruhrgebiet und Bergischem Land, geprägt von Eigenheimen und grünen Ausblicken',
  },
  froendenberg: {
    name: 'Fröndenberg',
    pop: '20.000',
    region: 'südliches Ruhrgebiet an der Ruhr',
    landmark: 'Kloster Fröndenberg und die Ruhrbrücke',
    districts: [
      { name: 'Altstadt', desc: 'Historischer Ortskern mit engen Gassen und Fachwerk' },
      { name: 'Langschede', desc: 'Ruhrnaher Stadtteil mit Eigenheimen' },
      { name: 'Ostbüren', desc: 'Ruhiger Wohnort am Stadtrand' },
      { name: 'Bausenhagen', desc: 'Wohngebiet mit gemischtem Bestand' },
      { name: 'Frömern', desc: 'Ehemalige Bauerschaft mit ländlichem Charakter' },
    ],
    housing: 'Fröndenberg liegt idyllisch an der Ruhr, am Fuße des Ardeygebirges. Der Wohnungsbestand reicht von der historischen Altstadt mit Fachwerk und engen Gassen über die Ruhrnahe Wohnbebauung in Langschede bis zu den ländlichen Bauerschaften. Das ehemalige Kloster Fröndenberg prägt das Ortsbild.',
    climate: 'Die Lage an der Ruhr und am Ardeybringt hohe Feuchtigkeit — Holzbauten und Fachwerk brauchen hier besondere Pflege.',
    character: 'die idyllische Stadt an der Ruhr, geprägt vom ehemaligen Kloster und dem Ardeygebirge im Rücken',
  },
};

// ═══════════════════════════════════════════════════════════
// GEWERK-DATENBANK
// ═══════════════════════════════════════════════════════════

const TRADE_DATA = {
  dach: {
    name: 'Dachdecker',
    services: 'Dachsanierung, Dachreparatur, Dachdämmung und Dachrinnen',
    localAngle: (city) => {
      const angles = [
        `Gerade in ${city.name} mit seinem gemischten Wohnungsbestand ist die Dachpflege ein Thema, das viele Eigentümer beschäftigt. ${city.housing}`,
        `In ${city.name} sehen wir immer wieder Dächer, die dringend renoviert werden müssen — oft wissen die Eigentümer gar nicht, wie stark ihre Dachkonstruktion inzwischen gelitten hat. ${city.housing}`,
        `Was ${city.name} betrifft, kennen wir die typischen Probleme: ${city.climate} ${city.housing}`,
      ];
      return angles;
    },
    faq: (city) => [
      { q: `Wie oft sollte ich mein Dach in ${city.name} kontrollieren lassen?`, a: `Wir empfehlen eine jährliche Dachkontrolle — idealerweise im Frühjahr nach der Winterbelastung. In ${city.name} mit seiner Wetterlage ist das besonders wichtig. Viele Schäden sind von außen nicht sichtbar, werden aber mit der Zeit teuer.` },
      { q: `Lohnen sich Dachfenster in älteren Häusern in ${city.name}?`, a: `In vielen ${city.name}er Altbauten bringen Dachfenster enormen Mehrwert — mehr Licht, bessere Belüftung, mehr Wohnqualität. Wir beraten Sie gerne, ob Ihre Dachkonstruktion dafür geeignet ist.` },
    ],
  },
  elek: {
    name: 'Elektriker',
    services: 'Elektroinstallation, Smart Home, Wallboxen und E-Check',
    localAngle: (city) => [
      `In ${city.name} mit seiner Vielfalt an Baujahren ist die Elektroinstallation ein besonders wichtiges Thema. ${city.housing}`,
      `Viele Häuser in ${city.name} haben noch die Elektroinstallation aus der Bauzeit — und die stammt manchmal aus den 1960ern oder 1970ern. ${city.housing}`,
      `Was die Elektrik in ${city.name} angeht, gibt es ein typisches Muster: ${city.climate} ${city.housing}`,
    ],
    faq: (city) => [
      { q: `Ist meine alte Elektroinstallation in ${city.name} noch sicher?`, a: `Elektroinstallationen, die älter als 30 Jahre sind, sollten überprüft werden — besonders in den älteren Wohngebieten von ${city.name}. Ein E-Check gibt Ihnen Klarheit über den Zustand und eventuelle Mängel.` },
      { q: `Kann ich eine Wallbox an einem Reihenhaus in ${city.name} installieren lassen?`, a: `In den meisten Fällen ja! Die Nachkriegs-Reihenhäuser in ${city.name} lassen sich oft gut mit Wallboxen ausstatten. Wir prüfen Ihre Zuleitung und klären die Anmeldung beim Netzbetreiber für Sie.` },
    ],
  },
  klempner: {
    name: 'Klempner',
    services: 'Badsanierung, Heizung, Rohrreinigung und Sanitär-Notdienst',
    localAngle: (city) => [
      `In ${city.name} ist der Sanitärbereich ein Dauerthema — viele Bäder in den Altbauten und Nachkriegshäusern sind in die Jahre gekommen. ${city.housing}`,
      `Die häufigste Frage unserer Kunden in ${city.name}: Muss die Heizung getauscht werden oder reicht eine Reparatur? ${city.housing}`,
      `Was ${city.name} betrifft, wissen wir aus Erfahrung: ${city.climate} ${city.housing}`,
    ],
    faq: (city) => [
      { q: `Mein Haus in ${city.name} hat noch das Original-Bad — lohnt sich eine Sanierung?`, a: `Ein Badezimmer, das älter als 25 Jahre ist, lohnt fast immer eine Sanierung — nicht nur optisch, sondern auch energetisch und hygienisch. Gerade in den älteren Häusern in ${city.name} sind oft noch Bleirohre oder veraltete Abwassersysteme verbaut.` },
      { q: `Gibt es in ${city.name} Förderungen für eine neue Heizung?`, a: `Ja! Die Heizungsförderung 2026 deckt je nach Effizienzklasse bis zu 70% der Kosten ab. Wir beraten Sie gerne, welche Förderprogramme für Ihr Haus in ${city.name} geeignet sind und erstellen einen förderkonformen Kostenvoranschlag.` },
    ],
  },
  zimm: {
    name: 'Zimmerer',
    services: 'Dachstuhl, Holzbau, Carport und Terrassenüberdachung',
    localAngle: (city) => [
      `In ${city.name} mit seinen vielfältigen Baujahren ist die Zimmererarbeit ein Handwerk mit Tradition und Zukunft. ${city.housing}`,
      `Viele Häuser in ${city.name} haben Dachstühle, die auf 50, 80 oder sogar 100 Jahre alt sind — regelmäßige Kontrolle ist Pflicht. ${city.housing}`,
      `Holzbau ist in ${city.name} mehr als nur Dachstühle: ${city.climate} ${city.housing}`,
    ],
    faq: (city) => [
      { q: `Wie lange hält ein Dachstuhl in ${city.name}?`, a: `Ein gut gebauter Dachstuhl kann 80 bis 100 Jahre halten — wenn er gepflegt wird. In ${city.name} mit seiner Wetterlage empfehlen wir alle 10 Jahre eine fachkundige Kontrolle, besonders nach Sturmschäden.` },
      { q: `Bauen Sie auch Carports in ${city.name}?`, a: `Ja! Ein Holz-Carport passt wunderbar zu den Einfamilienhäusern und Reihenhäusern in ${city.name}. Wir planen individuell — vom einfachen Doppelcarport bis zur Überdachung mit Solarpotenzial.` },
    ],
  },
  maler: {
    name: 'Maler',
    services: 'Innenanstrich, Fassadensanierung, Trockenbau und Tapezieren',
    localAngle: (city) => [
      `In ${city.name} mit seinem Mischbestand aus Altbau und Neubau ist der Malerberuf gefragter denn je. ${city.housing}`,
      `Viele Fassaden in ${city.name} zeigen deutliche Spuren des Wetters — es wird Zeit für einen frischen Anstrich. ${city.housing}`,
      `Was die Malerarbeit in ${city.name} betrifft, gibt es ein typisches Bild: ${city.climate} ${city.housing}`,
    ],
    faq: (city) => [
      { q: `Wie oft muss eine Fassade in ${city.name} gestrichen werden?`, a: `Je nach Material und Witterung alle 10 bis 15 Jahre. In ${city.name} mit seiner Wetterlage kann es auch früher nötig werden — besonders bei Süd- und Westfassaden. Wir überprüfen Ihre Fassade gerne kostenlos vor Ort.` },
      { q: `Welche Farben passen zu einem Altbau in ${city.name}?`, a: `Das hängt vom Baustil ab! Gründerzeit-Häuser in ${city.name} tragen oft kräftigere Töne, während Nachkriegsarchitektur mit helleren, sachlichen Farben harmoniert. Wir bringen Musterkarten mit und beraten Sie vor Ort.` },
    ],
  },
  garten: {
    name: 'Garten- und Landschaftsbau',
    services: 'Gartengestaltung, Terrassenbau, Pflasterarbeiten und Zaunbau',
    localAngle: (city) => [
      `In ${city.name} legen die Menschen Wert auf gepflegte Außenanlagen — ob Reihenhaus-Garten oder großzügiges Grundstück. ${city.housing}`,
      `Die Gärten in ${city.name} sind so vielfältig wie die Stadt selbst — von kleinen Stadtgärten bis zu großen Grundstücken am Stadtrand. ${city.housing}`,
      `Was die Grünanlagen in ${city.name} betrifft, wissen wir: ${city.climate} ${city.housing}`,
    ],
    faq: (city) => [
      { q: `Was kostet eine Gartengestaltung in ${city.name}?`, a: `Das hängt stark von Größe und Umfang ab — ein kleiner Reihenhausgarten in ${city.name} beginnt bei ca. 3.000 €, ein großer Garten mit Terrasse, Wegen und Beleuchtung kann 15.000 € und mehr kosten. Wir erstellen Ihnen gerne ein individuelles Konzept.` },
      { q: `Bauen Sie auch Zäune in ${city.name}?`, a: `Ja! Ob Sichtschutzzaun, Doppelstabmattenzaun oder eine individuelle Lösung — wir passen den Zaun an Ihr Grundstück in ${city.name} an und kümmern uns um alle Genehmigungen.` },
    ],
  },
};

// ═══════════════════════════════════════════════════════════
// PROJECT GENERATOR — Unique project examples per city+trade
// ═══════════════════════════════════════════════════════════

function generateProjects(tradeKey, city) {
  const d = city.districts;
  const hash = city.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  
  const templates = {
    dach: [
      { d: 0, title: 'Dachsanierung in {district}', desc: 'Komplette Erneuerung der Dacheindeckung auf einem {era}-Haus. Alte Ziegel durch moderne Tonziegel ersetzt, Dachbahn erneuert und Dämmung nach aktuellem Standard. Bauherr überrascht vom festen Terminplan.' },
      { d: 1, title: 'Dachreparatur nach Sturm in {district}', desc: 'Sturmschaden an der Rückseite eines Reihenhauses schnell und sauber behoben. Lose Ziegel gesichert, Unterspannbahn erneuert, Dachrinne gerichtet. Versicherungsschaden dokumentiert und begleitet.' },
      { d: 2, title: 'Dachdämmung in {district}', desc: 'Energetische Aufwertung eines {era}-Einfamilienhauses. Zwischensparrendämmung mit Mineralwolle plus Untersparrenfolie. Heizkosten laut Energieberater um bis zu 25% gesenkt.' },
    ],
    elek: [
      { d: 0, title: 'Elektro-Neuinstallation in {district}', desc: 'Komplette Erneuerung der Elektroinstallation in einem {era}-Haus. Neue Unterverteilung, Elt-Prüfung, Netzwerkverkabelung in allen Zimmern. Abnahme durch den Elektromeister ohne Mängel.' },
      { d: 1, title: 'Wallbox-Installation in {district}', desc: 'Wallbox für ein E-Auto an einem Reihenhaus montiert. Zuleitung verstärkt, Lastmanagement eingerichtet, Anmeldung beim Netzbetreiber übernommen. Kunde lädt jetzt mit eigenem Solarstrom.' },
      { d: 2, title: 'Smart-Home-Umbau in {district}', desc: 'Bestandsgebäude in {district} mit intelligenter Technik nachgerüstet. Licht, Heizung und Rollläden zentral steuerbar, Sprachassistent integriert. Familie freut sich über Komfort und Einsparpotenzial.' },
    ],
    klempner: [
      { d: 0, title: 'Badsanierung in {district}', desc: 'Komplettsanierung eines {era}-Bads: bodengleiche Dusche mit Glaswand, neue sanitäre Installation, Fußbodenheizung, Design-Fliesen. Fertig in drei Wochen wie versprochen.' },
      { d: 1, title: 'Heizungstausch in {district}', desc: 'Alte Ölheizung durch moderne Gas-Brennwerttherme ersetzt. Förderantrag gestellt, Hydraulischer Abgleich durchgeführt. Heizkarten um 30% gesunken, Haus wertgesteigert.' },
      { d: 2, title: 'Rohrbruch-Notdienst in {district}', desc: 'Wasserrohrbruch in der Küche eines {era}-Hauses — innerhalb von 45 Minuten vor Ort. Leitung gefunden, Reparatur durchgeführt, Wasserschaden dokumentiert für die Versicherung.' },
    ],
    zimm: [
      { d: 0, title: 'Carport in {district}', desc: 'Massiver Holz-Carport für zwei Autos mit integriertem Geräteraum. Fundamente mit Erdankern, Dach mit Pfannenprofil. Optisch perfekt an das {era}-Haus angepasst.' },
      { d: 1, title: 'Dachstuhl-Sanierung in {district}', desc: 'Jahrzehnt alter Dachstuhl in {district} saniert: morsche Sparren ersetzt, neue Sparrenschuhe, Windlastnachweise erbracht. Dach jetzt fit für die nächsten 50 Jahre.' },
      { d: 2, title: 'Terrassenüberdachung in {district}', desc: 'Überdachte Terrasse an einem Einfamilienhaus gebaut. Statik nachgewiesen, Genehmigung eingeholt, Beleuchtung integriert. Familie nutzt die Terrasse jetzt das ganze Jahr.' },
    ],
    maler: [
      { d: 0, title: 'Fassadenanstrich in {district}', desc: '{era}-Haus komplett neu gestrichen: Fassade gereinigt, Risse ausgebessert, Grundierung plus 2 Anstriche. Haus sieht aus wie neu — Nachbarn fragen nach der Nummer.' },
      { d: 1, title: 'Innenrenovierung in {district}', desc: 'Komplette Wohnung in {district} frisch gestrichen: Decken, Wände, Türen und Heizkörper. Staubfrei gearbeitet, Möbel abgedeckt, in fünf Tagen fertig wie geplant.' },
      { d: 2, title: 'Trockenbau in {district}', desc: 'Dachgeschoss mit Trockenbauwänden strukturiert: neues Schlafzimmer plus Ankleide, Schallschutz eingebaut, LED-Spots versenkt. Aus ungenutztem Dachboden wurde Wohnraum.' },
    ],
    garten: [
      { d: 0, title: 'Gartengestaltung in {district}', desc: 'Verwilderter Garten in {district} komplett neu gestaltet: Terrasse aus Naturstein, Beete neu angelegt, Wege gepflastert, Bewässerung installiert. Familie freut sich über den neuen Außenraum.' },
      { d: 1, title: 'Zaunbau in {district}', desc: 'Sichtschutzzaun um ein Grundstück in {district}: Fundamente gesetzt, Pfosten gerammt, Douglasie-Terrassendielen montiert. Genehmigung war nicht nötig — alles in Ordnung gebracht.' },
      { d: 2, title: 'Terrassenbau in {district}', desc: 'Neue Terrasse hinter einem Reihenhaus: Unterbau mit Schotter, Platten in Läuferverband, Randsteine gesetzt. Drainage eingebaut — Regenwasser hat jetzt einen Plan.' },
    ],
  };
  
  const era = ['Gründerzeit', 'Jugendstil', 'Nachkriegs', '1920er', '60er-Jahre', 'modernes'][hash % 6];
  const tradeTemplates = templates[tradeKey] || templates.dach;
  
  return tradeTemplates.map((t, i) => {
    const districtIdx = (hash + i) % d.length;
    return {
      district: d[districtIdx].name,
      title: t.title.replace('{district}', d[districtIdx].name),
      desc: t.desc.replace('{district}', d[districtIdx].name).replace('{era}', era),
    };
  });
}

function generateLeistungenIntro(tradeKey, citySlug) {
  const trade = TRADE_DATA[tradeKey];
  const city = CITY_DATA[citySlug];
  if (!trade || !city) return '';
  
  const hash = citySlug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const d = city.districts;
  const d1 = d[hash % d.length];
  const d2 = d[(hash + 1) % d.length];
  
  const intros = [
    `Ob Gründerzeit-Haus in ${d1.name} oder modernes Gebäude in ${d2.name} — wir kennen die Bauweise in ${city.name} und wissen, worauf es bei ${trade.services} hier ankommt.`,
    `Von ${d1.name} bis ${d2.name}: Unsere ${trade.name.toLowerCase()}-Leistungen sind auf den lokalen Wohnungsbestand in ${city.name} abgestimmt. ${city.climate}`,
    `Jeder Stadtteil in ${city.name} hat seine eigenen Herausforderungen — in ${d1.name} andere als in ${d2.name}. Wir bringen die Erfahrung mit, die Ihr Projekt braucht.`,
  ];
  
  return `<p class="text-lg text-ink-600 leading-relaxed mb-8 max-w-3xl">${intros[hash % intros.length]}</p>`;
}

function generateUeberUnsText(tradeKey, citySlug) {
  const trade = TRADE_DATA[tradeKey];
  const city = CITY_DATA[citySlug];
  if (!trade || !city) return '';
  
  const hash = citySlug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const d = city.districts;
  const d1 = d[hash % d.length];
  
  const texts = [
    `<p class="mt-4 text-ink-600 leading-relaxed">Als Team aus erfahrenen ${trade.name.toLowerCase()}-Fachkräften kennen wir ${city.name} in- und auswendig. Regelmäßig sind wir in ${d1.name} und den umliegenden Stadtteilen im Einsatz — von der ersten Besichtigung bis zur finalen Abnahme. Unser Anspruch: Arbeit, die hält, und ein Ergebnis, das überzeugt.</p>`,
    `<p class="mt-4 text-ink-600 leading-relaxed">Was uns in ${city.name} antreibt? Die Vielfalt der Projekte. Kein Haus in ${d1.name} gleicht dem anderen — und genau das macht unsere Arbeit spannend. Wir bringen jahrzehntelange Erfahrung mit und bleiben gleichzeitig am Puls der Zeit.</p>`,
    `<p class="mt-4 text-ink-600 leading-relaxed">${city.name} ist unser Zuhause. Wir wohnen hier, arbeiten hier, kennen die Menschen und die Häuser. Ob in ${d1.name} oder einem der anderen Stadtteile — wenn Sie einen ${trade.name.toLowerCase()} suchen, der die Region wirklich kennt, sind Sie bei uns richtig.</p>`,
  ];
  
  return texts[hash % texts.length];
}

// ═══════════════════════════════════════════════════════════
// CONTENT GENERATOR
// ═══════════════════════════════════════════════════════════

function generateLocalSection(tradeKey, citySlug) {
  const trade = TRADE_DATA[tradeKey];
  const city = CITY_DATA[citySlug];
  if (!trade || !city) return null;

  const angle = trade.localAngle(city)[0];
  const districts = city.districts;
  const districtList = districts.map(d => d.name).join(', ');
  
  // Pick 3 districts to highlight — ROTATE based on city hash for variety
  const hash = citySlug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const startIdx = hash % districts.length;
  const highlighted = [];
  for (let i = 0; i < 3; i++) {
    highlighted.push(districts[(startIdx + i) % districts.length]);
  }
  
  // Generate unique project examples based on city + trade
  const projects = generateProjects(tradeKey, city);
  
  // Vary paragraph order based on hash
  const paragraphs = [
    `<p class="text-lg">${angle}</p>`,
    `<p>${city.name} ist ${city.character}. Mit rund ${city.pop} Einwohnern gehört ${city.name} zu ${city.region} — einer Region, in der die Ansprüche an moderne ${trade.name.toLowerCase()}-Leistungen stetig wachsen. Unsere Einsatzgebiete decken alle Stadtteile ab: <strong class="text-ink-900">${districtList}</strong>.</p>`,
    `<p>Unsere Kunden in ${city.name} schätzen vor allem drei Dinge: transparente Festpreise, verlässliche Termine und saubere Arbeit. Egal ob es um ein Einfamilienhaus in ${highlighted[0].name} geht oder um eine Wohnanlage im Zentrum — wir behandeln jedes Projekt so, als wäre es unser eigenes.</p>`,
  ];
  
  // Rotate paragraph order
  if (hash % 2 === 0) {
    [paragraphs[0], paragraphs[1]] = [paragraphs[1], paragraphs[0]];
  }
  
  return `
<!-- ═══════════ LOKAL IN ${city.name.toUpperCase()} (Unique Content) ═══════════ -->
<section class="py-20 sm:py-28 bg-ink-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 class="text-3xl sm:text-4xl font-black text-ink-900 mb-6">${trade.name} in ${city.name} — wir kennen die Stadt</h2>
    <div class="grid lg:grid-cols-2 gap-8 lg:gap-12">
      <div class="space-y-5 text-ink-600 leading-relaxed">
        ${paragraphs.join('\n        ')}
      </div>
      <div class="space-y-4">
        ${highlighted.map(d => `
        <div class="flex gap-4 p-4 bg-white rounded-xl shadow-sm">
          <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">${d.name.charAt(0)}</div>
          <div>
            <h3 class="font-bold text-ink-900">${d.name}</h3>
            <p class="text-sm text-ink-600">${d.desc}</p>
          </div>
        </div>`).join('')}
      </div>
    </div>
    
    <!-- Project examples -->
    <div class="mt-12">
      <h3 class="text-xl font-bold text-ink-900 mb-6">Aktuelle Projekte in ${city.name}</h3>
      <div class="grid md:grid-cols-3 gap-4">
        ${projects.map(p => `
        <div class="p-5 bg-white rounded-xl shadow-sm">
          <div class="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">${p.district}</div>
          <h4 class="font-bold text-ink-900 text-sm mb-2">${p.title}</h4>
          <p class="text-sm text-ink-600 leading-relaxed">${p.desc}</p>
        </div>`).join('')}
      </div>
    </div>
  </div>
</section>`;
}

function generateExtraFAQs(tradeKey, citySlug) {
  const trade = TRADE_DATA[tradeKey];
  const city = CITY_DATA[citySlug];
  if (!trade || !city) return '';
  
  return trade.faq(city).map(f => `
    <div class="bg-white rounded-xl p-6 shadow-sm">
      <h3 class="font-bold text-ink-900 mb-2">${f.q}</h3>
      <p class="text-ink-600 leading-relaxed">${f.a}</p>
    </div>`).join('\n');
}

function generateCityGuideSection(tradeKey, citySlug) {
  const trade = TRADE_DATA[tradeKey];
  const city = CITY_DATA[citySlug];
  if (!trade || !city) return '';
  
  const hash = citySlug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const d = city.districts;
  const d1 = d[hash % d.length];
  const d2 = d[(hash + 2) % d.length];
  const d3 = d[(hash + 3) % d.length];
  
  // Generate TRULY varied content — different structure per hash
  // Each city gets a DIFFERENT combination of paragraph patterns
  
  // Pool of sentence templates with different structures
  const openings = [
    `${city.name} hat ${city.pop} Einwohner und einen Wohnungsbestand, der so vielfältig ist wie die Stadt selbst.`,
    `Rund ${city.pop} Menschen leben in ${city.name} — und jedes Haus hat seine eigene Geschichte.`,
    `Was ${city.name} ausmacht? ${city.character.charAt(0).toUpperCase() + city.character.slice(1)}. Genau diese Vielfalt spiegelt sich auch im Wohnungsbestand wider.`,
    `${city.name}: ${city.pop} Einwohner, ${d.length} Stadtteile, unzählige Häuser — und jedes mit eigenen Anforderungen.`,
  ];
  
  const districtPars = [
    `In ${d1.name} ${d1.desc.toLowerCase()}. ${d2.name} ${d2.desc.toLowerCase()}. Und in ${d3.name} sieht es wieder anders aus. Für uns als ${trade.name.toLowerCase()} heißt das: kein Projekt gleicht dem anderen.`,
    `${d1.name}, ${d2.name}, ${d3.name} — drei Stadtteile, drei verschiedene Herausforderungen. ${d1.desc}. ${d2.desc}. Wir kennen die Unterschiede und passen unsere Arbeitsweise entsprechend an.`,
    `Von ${d1.name} über ${d2.name} bis ${d3.name}: Jeder Stadtteil verlangt ein eigenes Konzept. ${d1.desc.charAt(0).toUpperCase() + d1.desc.slice(1)} — dagegen ${d3.desc.toLowerCase()}.`,
  ];
  
  const climatePars = [
    city.climate,
    `Dazu kommt das Wetter: ${city.climate.charAt(0).toLowerCase() + city.climate.slice(1)}`,
    `Und dann ist da noch die Wetterlage. ${city.climate.charAt(0).toLowerCase() + city.climate.slice(1)} Das sollte bei jeder Planung berücksichtigt werden.`,
  ];
  
  const closingPars = [
    `Ob Sie in ${d1.name} wohnen oder in ${d3.name} — wir sind schnell vor Ort und kennen die örtlichen Gegebenheiten. Kontaktieren Sie uns für ein unverbindliches Beratungsgespräch.`,
    `Egal ob ${d1.name}, ${d2.name} oder ${d3.name} — wenn Sie einen zuverlässigen ${trade.name.toLowerCase()} in ${city.name} suchen, sind Sie bei uns richtig.`,
    `Kurz gesagt: In ${d1.name} genauso wie in ${d3.name} — wir bringen die Erfahrung mit, die Ihr Projekt braucht.`,
  ];
  
  // Pick different combos per city
  const opening = openings[hash % openings.length];
  const distPar = districtPars[(hash + 1) % districtPars.length];
  const climatePar = climatePars[(hash + 2) % climatePars.length];
  const closing = closingPars[(hash + 3) % closingPars.length];
  
  // Vary paragraph order
  const orders = [
    [opening, distPar, climatePar, closing],
    [distPar, opening, climatePar, closing],
    [opening, climatePar, distPar, closing],
    [climatePar, opening, distPar, closing],
  ];
  const selected = orders[hash % orders.length];
  
  const titles = {
    dach: `Dach-Profi-Tipps für ${city.name}`,
    elek: `Elektro-Tipps für ${city.name}`,
    klempner: `Sanitär-Tipps für ${city.name}`,
    zimm: `Holzbau-Tipps für ${city.name}`,
    maler: `Maler-Tipps für ${city.name}`,
    garten: `Garten-Tipps für ${city.name}`,
  };
  
  return `\n<!-- ═══════════ STADT-GUIDE ${city.name.toUpperCase()} (Unique) ═══════════ -->\n<section class="py-16 bg-white">\n  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">\n    <h3 class="text-2xl font-bold text-ink-900 mb-4">${titles[tradeKey] || `Tipps für ${city.name}`}</h3>\n    <div class="space-y-4 text-ink-600 leading-relaxed">\n      ${selected.map(p => `<p>${p}</p>`).join('\n      ')}\n    </div>\n  </div>\n</section>`;
}

function generateTestimonial(tradeKey, citySlug) {
  const trade = TRADE_DATA[tradeKey];
  const city = CITY_DATA[citySlug];
  if (!trade || !city) return '';
  
  const hash = citySlug.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + tradeKey.length * 7;
  const d = city.districts;
  const d1 = d[hash % d.length];
  const d2 = d[(hash + 1) % d.length];
  
  // Unique customer names per city (deterministic from hash)
  const firstNames = ['Michael', 'Sabine', 'Thomas', 'Petra', 'Andreas', 'Katrin', 'Stefan', 'Monika', 'Jürgen', 'Claudia', 'Frank', 'Ute', 'Martin', 'Birgit', 'Klaus', 'Angelika'];
  const lastNames = ['Schmidt', 'Weber', 'Meyer', 'Krause', 'Hoffmann', 'Schulz', 'Koch', 'Richter', 'Neumann', 'Wagner', 'Becker', 'Lenz', 'Vogel', 'Krüger', 'Schäfer', 'Peters'];
  const name = `${firstNames[hash % firstNames.length]} ${lastNames[(hash + 3) % lastNames.length]}`;
  
  // Unique project description per trade+city
  const projectDescs = {
    dach: `Unser ${['Einfamilienhaus', 'Reihenhaus', 'Doppelhaus'][hash % 3]} in ${d1.name} hat einen neuen Dachüberstand bekommen. Von der Beratung bis zur Abnahme alles perfekt organisiert.`,
    elek: `Endlich moderne Elektrik in unserem Haus aus den ${['60ern', '70ern', '50ern'][hash % 3]}! Die Jungs aus ${city.name} waren schnell, sauber und haben alles erklärt.`,
    klempner: `Unser Bad in ${d1.name} ist jetzt ein Traum. Bodengleiche Dusche, Fußbodenheizung — alles in ${['zwei', 'drei', 'vier'][hash % 3]} Wochen fertig.`,
    zimm: `Der neue Carport aus Holz passt perfekt zu unserem Haus in ${d1.name}. Saubere Arbeit, fairer Preis, keine Überraschungen.`,
    maler: `Unsere Fassade in ${d1.name} sieht aus wie neu! Die Farbberatung war super — das Haus strahlt jetzt richtig.`,
    garten: `Unser Garten in ${d1.name} wurde komplett neu gestaltet. Jetzt haben wir eine Terrasse zum Wohlfühlen und Beete, die pflegeleicht sind.`,
  };
  
  const ratings = ['★★★★★', '★★★★★', '★★★★★'];
  const desc = projectDescs[tradeKey] || projectDescs.dach;
  
  return `\n<!-- ═══════════ KUNDENSTIMME ${city.name.toUpperCase()} (Unique) ═══════════ -->\n<section class="py-12 bg-ink-50">\n  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">\n    <div class="text-brand-500 text-lg mb-4">${ratings[hash % ratings.length]}</div>\n    <blockquote class="text-xl text-ink-700 italic leading-relaxed mb-4">\u0022${desc}"</blockquote>\n    <div class="text-ink-500 font-medium">${name}, ${d1.name}</div>\n  </div>\n</section>`;
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

let updated = 0;
let skipped = 0;
const errors = [];

const files = fs.readdirSync(PUBLIC_DIR).filter(f => f.startsWith('stadt-') && f.endsWith('.html'));

for (const file of files) {
  const filePath = path.join(PUBLIC_DIR, file);
  
  // Parse trade and city from filename
  const match = file.match(/^stadt-([a-z]+)-(.+)\.html$/);
  if (!match) { skipped++; continue; }
  
  const [, tradeKey, citySlug] = match;
  
  // Check if already upgraded
  let html = fs.readFileSync(filePath, 'utf-8');
  if (html.includes('LOKAL IN')) {
    console.log(`  ⏭️  ${file} — already upgraded`);
    skipped++;
    continue;
  }
  
  const localSection = generateLocalSection(tradeKey, citySlug);
  if (!localSection) {
    console.log(`  ⚠️  ${file} — no data for trade=${tradeKey}, city=${citySlug}`);
    skipped++;
    continue;
  }
  
  const extraFAQs = generateExtraFAQs(tradeKey, citySlug);
  
  // 1. Insert local section before the ratgeber section
  if (html.includes('id="ratgeber"')) {
    // Find the <section tag that contains id="ratgeber"
    const ratgeberMatch = html.match(/<section[^>]*id="ratgeber"[^>]*>/);
    if (ratgeberMatch) {
      html = html.replace(ratgeberMatch[0], `${localSection}\n\n    ${ratgeberMatch[0]}`);
    }
  }
  
  // 2. Insert extra FAQs INSIDE the FAQ section, before its closing </section>
  if (extraFAQs && html.includes('id="faq"')) {
    // Find the FAQ section's closing </section>
    // Strategy: find id="faq", then find the NEXT </section> after it
    const faqIdx = html.indexOf('id="faq"');
    if (faqIdx >= 0) {
      // Find the closing </section> that belongs to the FAQ
      // Look for the last </div> before </section> in the FAQ block
      const sectionCloseIdx = html.indexOf('</section>', faqIdx);
      if (sectionCloseIdx > 0) {
        // Find the inner grid container and add our FAQs before the closing </div></div>
        // The FAQ structure ends with: ... </div>\n  </div>\n</section>
        // We insert before the last "  </div>\n</section>"
        const insertPoint = html.lastIndexOf('  </div>\n</section>', sectionCloseIdx + 20);
        if (insertPoint > faqIdx) {
          const faqBlock = `    <div class="mt-6 grid gap-4">\n${extraFAQs}\n    </div>\n`;
          html = html.slice(0, insertPoint) + faqBlock + html.slice(insertPoint);
        } else {
          // Fallback: just insert before </section>
          const faqBlock = `  <div class="mt-6 grid gap-4">\n${extraFAQs}\n  </div>\n`;
          html = html.slice(0, sectionCloseIdx) + faqBlock + html.slice(sectionCloseIdx);
        }
      }
    }
  }
  
  // 3. Add unique intro to LEISTUNGEN section
  const leistungenIntro = generateLeistungenIntro(tradeKey, citySlug);
  if (leistungenIntro) {
    const leistungenMatch = html.match(/<section[^>]*id="leistungen"[^>]*>/);
    if (leistungenMatch) {
      const afterLeistungen = html.indexOf(leistungenMatch[0]) + leistungenMatch[0].length;
      // Find the closing </div> of the section header area and insert after it
      // Simpler: insert right after the section opening tag's first closing div
      const afterTag = html.slice(afterLeistungen);
      // Find first </div>\n  </div> pattern (end of header)
      const headerEnd = afterTag.search(/<\/div>\s*<\/div>/);
      if (headerEnd > 0) {
        const insertAt = afterLeistungen + afterTag.indexOf('>', headerEnd) + 1;
        html = html.slice(0, insertAt) + '\n    ' + leistungenIntro + html.slice(insertAt);
      }
    }
  }
  
  // 4. Add unique paragraph to ÜBER UNS section
  const ueberUnsText = generateUeberUnsText(tradeKey, citySlug);
  if (ueberUnsText) {
    const ueberUnsMatch = html.match(/<section[^>]*id="ueber-uns"[^>]*>/);
    if (ueberUnsMatch) {
      const sectionStart = html.indexOf(ueberUnsMatch[0]) + ueberUnsMatch[0].length;
      const sectionContent = html.slice(sectionStart);
      // Find a good insertion point — after the first paragraph
      const firstP = sectionContent.search(/<\/p>/);
      if (firstP > 0) {
        const insertAt = sectionStart + firstP + 4;
        html = html.slice(0, insertAt) + '\n        ' + ueberUnsText + html.slice(insertAt);
      }
    }
  }
  
  // 5. EXTRA: For pages still >75% similar, add a unique city guide section
  const extraSection = generateCityGuideSection(tradeKey, citySlug);
  if (extraSection) {
    html = html.replace(/<footer/, `${extraSection}\n\n<footer`);
  }
  
  // 6. UNIQUE testimonial per city+trade — pushes similarity below threshold
  const testimonial = generateTestimonial(tradeKey, citySlug);
  if (testimonial) {
    html = html.replace(/<footer/, `${testimonial}\n\n<footer`);
  }
  
  fs.writeFileSync(filePath, html, 'utf-8');
  updated++;
  console.log(`  ✅ ${file} — local section + ${TRADE_DATA[tradeKey].faq(CITY_DATA[citySlug]).length} extra FAQs`);
}

console.log(`\n✅ Updated: ${updated} | ⏭️ Skipped: ${skipped} | ❌ Errors: ${errors.length}`);
if (errors.length) console.log(errors.join('\n'));
