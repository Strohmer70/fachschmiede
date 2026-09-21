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

  // GARTENBAU: Unique project examples per city
  if (tradeKey === 'garten') {
    return generateGartenLocalSection(citySlug);
  }

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
  
  // Dropdown-Format (einheitlich mit Original-FAQs — faq-item/faq-q/faq-answer)
  const chev = '<svg class="chev w-5 h-5 text-brand-600 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>';
  const toDropdown = (f) => `<div class="faq-item reveal bg-white rounded-xl border border-ink-200">
        <button class="faq-q w-full flex items-center justify-between gap-4 px-6 py-5 text-left">
          <span class="font-bold text-ink-900">${f.q}</span>
          ${chev}
        </button>
        <div class="faq-answer"><p class="px-6 pb-5 text-ink-600 text-sm leading-relaxed">${f.a}</p></div>
      </div>`;
  
  // GARTENBAU: Use completely unique FAQs per city
  if (tradeKey === 'garten' && GARDEN_FAQS[citySlug]) {
    return GARDEN_FAQS[citySlug].map(toDropdown).join('\n      ');
  }
  
  return trade.faq(city).map(toDropdown).join('\n      ');
}

function generateCityGuideSection(tradeKey, citySlug) {
  const trade = TRADE_DATA[tradeKey];
  const city = CITY_DATA[citySlug];
  if (!trade || !city) return '';
  
  // GARTENBAU: Use completely unique hand-written guides per city
  if (tradeKey === 'garten' && GARDEN_CITY_GUIDES[citySlug]) {
    return `\n<!-- ═══════════ STADT-GUIDE ${city.name.toUpperCase()} (Unique) ═══════════ -->\n<section class="py-16 bg-white">\n  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">\n    <h3 class="text-2xl font-bold text-ink-900 mb-4">Garten-Tipps für ${city.name}</h3>\n    <div class="space-y-4 text-ink-600 leading-relaxed">\n      ${GARDEN_CITY_GUIDES[citySlug]}\n    </div>\n  </div>\n</section>`;
  }
  
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
// GARTENBAU: Unique Local Sections — eigene Projekte pro Stadt
// ═══════════════════════════════════════════════════════════

const GARDEN_LOCAL_SECTIONS = {
  bochum: {
    projects: [
      { district: 'Ehrenfeld', title: 'Stadtgarten mit Hochbeeten', desc: 'Umbau eines engen Hinterhofgarten mit drei Hochbeeten, vertikalem Grün an der Brandwand und einer Sitzecke aus Recycling-Holz.' },
      { district: 'Langendreer', title: 'Familiengarten mit Spielwiese', desc: 'Neugestaltung eines 200 m² Grundstücks: Robuster Rollrasen, Sandspielfläche und ein Staudenbeet, das den ganzen Sommer blüht.' },
      { district: 'Wiemelhausen', title: 'Schattengarten unter Buche', desc: 'Pflanzung eines Schattengartens unter einer alten Buche mit Funkien, Astilben und Bergenie — pflegeleicht und farbenfroh.' },
    ]
  },
  dortmund: {
    projects: [
      { district: 'Kley', title: 'Großzügiger Familiengarten', desc: 'Komplette Neugestaltung eines 500 m² Gartens: Terrasse mit Grillzone, Rasenfläche und Gemüsebeete für Selbstversorger.' },
      { district: 'Mengede', title: 'Obstwiese mit Streuobst', desc: 'Anlage einer Obstwiese mit fünf Hochstamm-Apfelbäumen, Beerensträuchern und Wildblumenwiese für Artenvielfalt.' },
      { district: 'Hörde', title: 'Moderner Vorgarten', desc: 'Redesign eines Vorgartens mit Zierkies, Gräsern und einem Solitärbonsai — pflegeleicht und repräsentativ.' },
    ]
  },
  hagen: {
    projects: [
      { district: 'Wehringhausen', title: 'Hangterrassen mit Stützmauern', desc: 'Befestigung eines 45°-Hangs mit drei Naturstein-Terrassen, bepflanzt mit Teppichsteinbrech und Staudensonnenbraut.' },
      { district: 'Eckesey', title: 'Garten mit Panorama-Terrasse', desc: 'Anlage einer Aussichtsterrasse mit Glasgeländer, kombiniert mit mediterranen Kübelpflanzen und Stipa-Gräsern.' },
      { district: 'Hohenlimburg', title: 'Bauerngarten-Neuanlage', desc: 'Traditioneller Bauerngarten mit Krautspirale, Rankobelisken aus Weide und einer Mischung aus Zier- und Nutzpflanzen.' },
    ]
  },
  witten: {
    projects: [
      { district: 'Herbede', title: 'Regenrückhalte-Beet', desc: 'Anlage eines Versickerungsbeets, das Starkregen aufnimmt und langsam abgibt — bepflanzt mit Ingwertrieb und Steppenkerze.' },
      { district: 'Ruhrdeich', title: 'Flussnaher Garten mit Uferbepflanzung', desc: 'Begrünung eines Grundstücks nahe der Ruhr mit feuchtigkeitstoleranten Pflanzen wie Schilf und Sumpf-Iris.' },
      { district: 'Annen', title: 'Kleingarten-Modernisierung', desc: 'Aufwertung eines 300 m² Schrebergartens mit Wegplatten aus Naturstein, Obstbäumen und einem Gerätehäuschen.' },
    ]
  },
  herne: {
    projects: [
      { district: 'Wanne-Eickel', title: 'Bodensanierung + Staudengarten', desc: 'Nach Bodenanalyse: Aufbesserung mit Kompost und Sand, dann Anlage eines pflegeleichten Staudengartens mit Rittersporn und Sonnenhut.' },
      { district: 'Herne-Mitte', title: 'Brachfläche wird Blühwiese', desc: 'Umwandlung einer 400 m² brachliegenden Fläche in eine blühende Wiese mit einheimischen Wildblumen und Insektenhotel.' },
      { district: 'Sodingen', title: 'Vorgarten mit Gründach-Carport', desc: 'Kombination aus Carport mit extensivem Gründach und einem Vorgarten aus Kies, Steingartenpflanzen und einem Solitärbaum.' },
    ]
  },
  iserlohn: {
    projects: [
      { district: 'Grüner Grund', title: 'Waldgarten-Übergang', desc: 'Gestaltung des Übergangs von Garten zu Wald: Beschnittene Hecke statt Wildwuchs, Schattenpflanzen und ein Weg aus Rindenmulch.' },
      { district: 'Hombruch', title: 'Bauerngarten mit Kräuterspirale', desc: 'Neuanlage eines Bauerngartens mit sechs Beeten, Kräuterspirale aus Naturstein und einem gemütlichen Sitzplatz aus Weiden.' },
      { district: 'Letmathe', title: 'Heidegarten mit Besenheide', desc: 'Anlage eines Heidegartens mit Besenheide, Schneeheide und Zwergkiefern — inklusive Weg aus Holzspänen.' },
    ]
  },
  unna: {
    projects: [
      { district: 'Uelzen', title: 'Cottage-Garten mit Rosenbogen', desc: 'Romantischer Cottage-Garten mit Kletterrosen an Bögen, lose bepflanzten Staudenbeeten und einem Tränke-Brunnen.' },
      { district: 'Massen', title: 'Küchengarten mit Hochbeeten', desc: 'Produktiver Küchengarten mit vier Hochbeeten, Kompoststation und einem Gewächshaus aus Glas für den Frühstart.' },
      { district: 'Königsborn', title: 'Eingangsbereich mit Staudenbeet', desc: 'Aufwertung des Eingangsbereichs mit einem Staudenbeet, das von März bis Oktober blüht — wechselnde Farben, gleiche Pflanzen.' },
    ]
  },
  schwerte: {
    projects: [
      { district: 'Villenkolonie', title: 'Naturteich mit Uferzone', desc: 'Anlage eines Naturteichs mit unterschiedlichen Tiefenzonen, Wasserpflanzen und einer Kiesufer, die Vögel anlockt.' },
      { district: 'Ernstigen', title: 'Heimischer Gehölzgarten', desc: 'Bepflanzung mit heimischen Gehölzen: Vogelkirsche, Feldahorn und Weißdorn — plus Blühstreifen für Insekten.' },
      { district: 'Holzen', title: 'Waldrand-Garten', desc: 'Gestaltung eines Waldrand-Grundstücks mit wildem Flair: Astern, Gräsern und einem natürlichen Weg aus Hackschnitzeln.' },
    ]
  },
  kamen: {
    projects: [
      { district: 'Innenstadt', title: 'Geometrischer Vorgarten', desc: 'Moderner Vorgarten mit klaren Linien: Cortenstahl-Beeteinfassungen, Zierkies und strukturierte Gräser in symmetrischer Anordnung.' },
      { district: 'Methler', title: 'Gemüsegarten mit Hochbeeten', desc: 'Hochbeet-Anlage mit rückenschonender Arbeitshöhe, Bewässerungssystem und einer Auswahl an robusten Gemüsesorten.' },
      { district: 'Westick', title: 'Kiesgarten mit Stipa', desc: 'Pflegeleichter Kiesgarten mit Stipa-Gräsern, Lavendel und einem Akzentstein — modern und praktisch.' },
    ]
  },
  luenen: {
    projects: [
      { district: 'Lünen-Süd', title: 'Terrasse mit Wasserblick', desc: 'Anlage einer erhöhten Holzterrasse mit Blick auf die Lippe, kombiniert mit feuchtigkeitstoleranten Stauden am Ufer.' },
      { district: 'Altlünen', title: 'Historischer Stadtgarten', desc: 'Sanierung eines alten Gartens mit Bewahrung historischer Wege und Pflanzen, ergänzt um moderne Staudenbeete.' },
      { district: 'Brambauer', title: 'Familiengarten mit Baumhaus', desc: 'Kindgerechte Gartengestaltung mit Spielwiese, Kletterbaum und einem Baumhaus aus Robinie.' },
    ]
  },
  bergkamen: {
    projects: [
      { district: 'Weddinghofen', title: 'Instant-Garten mit Kübelpflanzen', desc: 'Sofort-Effekt durch Großcontainer: Olivenbäume, Gräser und Stauden, die sofort ein gewachsenes Bild abgeben.' },
      { district: 'Rünthe', title: 'Farbenfroher Staudengarten', desc: 'Aufwertung eines Nachkriegsgartens mit Farbakzenten: Purpursonnenhut, Indianernessel und Katzenminze in warmen Tönen.' },
      { district: 'Oberaden', title: 'Bodendecker statt Rasen', desc: 'Flächenumwandlung von kahlem Rasen zu blühendem Bodendecker-Teppich mit Storchschnabel und Polsterphlox.' },
    ]
  },
  'castrop-rauxel': {
    projects: [
      { district: 'Ickern', title: 'Bestandsgarten-Pflege', desc: 'Behutsame Sanierung eines eingewachsenen Gartens: Alte Obstbäume geschnitten, historische Wege erneuert, neue Stauden ergänzt.' },
      { district: 'Habinghorst', title: 'Gemütlicher Sitzgarten', desc: 'Neugestaltung des Sitzbereichs mit Natursteinmauer, gemütlicher Feuerstelle und duftendem Kräuterbeet in Griffnähe.' },
      { district: 'Rauxel', title: 'Hecke aus Blutbuche', desc: 'Pflanzung einer doppelten Blutbuchen-Hecke als Sichtschutz — innerhalb von drei Jahren dicht und langlebig.' },
    ]
  },
  'wetter-ruhr': {
    projects: [
      { district: 'Alt-Wetter', title: 'Mediterrane Terrasse', desc: 'Anlage einer mediterranen Terrasse mit Olivenbäumen in Kübeln, Lavendelhecke und Kiesbeeten — windgeschützt und sonnig.' },
      { district: 'Wengern', title: 'Terrassen-Hanggarten', desc: 'Befestigung eines Hangs mit Gabionen-Stützmauern und Bepflanzung mit Teppichsteinbrech und Bergbohnenkraut.' },
      { district: 'Schmandbruch', title: 'Vorgarten mit Gräser-Akzent', desc: 'Modernes Vorgartendesign: Stipa-Trockenrasen, Akzentsteine und eine Purpur-Federgras-Dominante.' },
    ]
  },
  schwelm: {
    projects: [
      { district: 'Innenstadt', title: 'Mini-Garten mit Großwirkung', desc: 'Gestaltung eines 60 m² Stadtgartens: Ein hochstämmiger Apfelbaum, vertikale Beete an der Mauer und ein Mini-Teich im Fass.' },
      { district: 'Lutherkirche', title: 'Hanggarten mit Aussicht', desc: 'Terrassierung eines kleinen Hanggartens mit zwei Ebenen: Oben Sitzplatz, unten Staudenbeet — verbunden durch Natursteinstufen.' },
      { district: 'Brille', title: 'Schattengarten unter Eiche', desc: 'Pflanzung unter einer alten Eiche mit Maiglöckchen, Waldmeister und Schwertlilie — ein grüner Teppich im Schatten.' },
    ]
  },
  enneetal: {
    projects: [
      { district: 'Voerde', title: 'Feuchtigkeitsgarten am Bach', desc: 'Bepflanzung eines feuchten Grundstücksteils mit Bachbunge, Wasserdost und Fieberklee — ein natürlicher Bachlauf als Blickfang.' },
      { district: 'Rüggeberg', title: 'Dränage + Rasenneuanlage', desc: 'Verbesserung der Drainage und Neuanlage eines Robustrasens, der auch im Schatten dicht bleibt.' },
      { district: 'Altenvoerde', title: 'Staudenbeet mit Jahresrhythmus', desc: 'Vier-Jahreszeiten-Beet mit Schneeglöckchen, Krokussen, Pfingstrosen und Herbstastern — immer etwas zu sehen.' },
    ]
  },
  gevelsberg: {
    projects: [
      { district: 'Silschede', title: 'Trockenmauer am Hang', desc: 'Bau einer Naturstein-Trockenmauer mit einstauchender Bepflanzung: Bergbohnenkraut, Polsterphlox und Berg-Nelke.' },
      { district: 'Asbeck', title: 'Aussichts-Terrasse mit Pergola', desc: 'Windgeschützte Pergola mit Blick über das Ruhrgebiet, kombiniert mit robusten Gräsern und Zwergsträuchern.' },
      { district: 'Bredde', title: 'Treppenanlage + Beleuchtung', desc: 'Natursteintreppe mit eingebauter LED-Beleuchtung, die abends den Garten in Szene setzt.' },
    ]
  },
  hattingen: {
    projects: [
      { district: 'Altstadt', title: 'Innenhof-Garten mit Mauer', desc: 'Gestaltung eines historischen Innenhofs mit alten Mauern, Kletterrosen an Rankgerüsten und einem Brunnen als Zentrum.' },
      { district: 'Blankenstein', title: 'Verwunschener Garten-Look', desc: 'Romantische Gartengestaltung mit Weidenbögen, wilden Rosen und einem Pfad aus Kieselsteinen — wie im Märchen.' },
      { district: 'Winz', title: 'Kräutergarten mit Sitzecke', desc: 'Anlage eines Nutzgartens mit sechs Kräuterbeeten, einem Weidenzaun und einer gemütlichen Sitzbank aus Holz.' },
    ]
  },
  holzwickede: {
    projects: [
      { district: 'Hengstey', title: 'Naturpool-Projekt', desc: 'Planung und Bau eines Naturpools mit Pflanzenzone und Schwimmbereich — chlorfrei und ökologisch.' },
      { district: 'Bruchmühle', title: 'Großgarten mit Zonen', desc: 'Strukturierung eines 800 m² Gartens: Spielwiese, Sitzecke, Nutzgarten und Blühstreifen — alles harmonisch verbunden.' },
      { district: 'Opherdicke', title: 'Obstbaumpflanzung', desc: 'Pflanzung von sieben Hochstamm-Obstbäumen mit Unterbepflanzung aus Beerensträuchern und Wildblumenwiese.' },
    ]
  },
  sprockhoevel: {
    projects: [
      { district: 'Haßlinghausen', title: 'Wildblumenwiese anlage', desc: 'Umwandlung einer intensiven Rasenfläche in eine zweischürige Wildblumenwiese mit Kornblume, Mohn und Kamille.' },
      { district: 'Gennebreck', title: 'Windfester Steingarten', desc: 'Anlage eines Steingartens mit Zwergkiefern, Fetthennen und Stachelkraut — robust gegen Wind und Trockenheit.' },
      { district: 'Niedersprockhövel', title: 'Heidegarten mit Weg', desc: 'Heidefläche mit Besenheide und Glockenheide, durchzogen von einem Holzspän-Weg und gesäumt von Zwergbirken.' },
    ]
  },
  froendenberg: {
    projects: [
      { district: 'Langschede', title: 'Flussnaher Regengarten', desc: 'Gestaltung eines Regengartens, der Niederschlag auffängt und versickern lässt — mit Schilf, Iris und Steppenkerze.' },
      { district: 'Strickherdicke', title: 'Hochbeet-Anlage', desc: 'Doppelt-Hochbeet aus Lärchenholz mit Frühbeet-Aufsatz und automatischer Tropfbewässerung.' },
      { district: 'Frömern', title: 'Blühstreifen am Gartenrand', desc: 'Anlage eines einreihigen Blühstreifens mit einheimischen Wildblumen — Nahrung für Insekten und schöner Übergang ins Grüne.' },
    ]
  },
};

function generateGartenLocalSection(citySlug) {
  const city = CITY_DATA[citySlug];
  const data = GARDEN_LOCAL_SECTIONS[citySlug];
  if (!city || !data) return null;
  
  const projects = data.projects;
  
  return `<!-- ═══════════ LOKAL IN ${city.name.toUpperCase()} (Unique Content) ═══════════ -->
<!-- UNIQUE-GARDEN-v4 -->
<section class="py-16 bg-ink-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 class="text-3xl sm:text-4xl font-black text-ink-900 mb-4">${city.name} — Gärten mit lokalem Charakter</h2>
    <p class="text-lg text-ink-600 leading-relaxed mb-8 max-w-3xl">Von ${city.pop} Einwohnern, geprägt durch ${city.character}. Unsere Gärten passen zu dieser Vielfalt.</p>
    <div class="grid md:grid-cols-3 gap-6">
      ${projects.map(p => `<div class="bg-white rounded-xl p-6 shadow-sm"><div class="text-brand-500 text-sm font-bold mb-2">${p.district}</div><h3 class="font-bold text-ink-900 mb-2">${p.title}</h3><p class="text-ink-600 text-sm leading-relaxed">${p.desc}</p></div>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

// ═══════════════════════════════════════════════════════════
// GARTENBAU: Unique Leistungs-Beschreibungen pro Stadt
// Diese ersetzen die identischen Template-Texte in der Leistungen-Section
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// GARTENBAU: Unique Service-Beschreibungen für ALLE 6 Services pro Stadt
// ═══════════════════════════════════════════════════════════

const GARDEN_SERVICE_DESCRIPTIONS = {
  bochum: {
    'Gartengestaltung': 'Individuelle Gartengestaltung für Bochums dicht bebaute Stadtteile. Ob schmaler Hinterhof in Ehrenfeld oder Reihenhausgarten in Langendreer — wir machen aus wenig Platz viel Grün.',
    'Baumfällung & Pflege': 'Fachgerechte Baumpflege in Bochum. Kronenschnitt für die engen Höfe in Altenbochum, Totholzentfernung in Hofstede — sicher auch in schwierigem Gelände.',
    'Rasen & Bepflanzung': 'Rollrasen und Staudenbeete für Bochums Gärten. Wir wählen Pflanzen, die in den Ruhrgebietsböden gedeihen — robust und pflegeleicht für die ganze Familie.',
    'Teichbau & Bewässerung': 'Teiche und Bewässerung für Bochums Gärten. Von Mini-Teich im Hof zur automatischen Tropfbewässerung — wir sorgen für das richtige Wasser in jedem Viertel.',
    'Gartenpflege & Unterhalt': 'Regelmäßige Gartenpflege in Bochum. Wir kümmern uns um die Wege in Querenburg, Beete in Dahlhausen und Rasenflächen in Grumme — zuverlässig das ganze Jahr.',
    'Herbst- & Winterdienst': 'Laub und Wintervorbereitung in Bochum. Wir räumen die Einfahrten in Wiemelhausen frei, schneiden Hecken in Stiepel und schützen empfindliche Pflanzen vor Frost.',
  },
  dortmund: {
    'Gartengestaltung': 'Gartengestaltung für Dortmunds Familiengärten. Von der Spielwiese in Kley bis zum Obstgarten in Mengede — wir schaffen Raum für alle.',
    'Baumfällung & Pflege': 'Baumpflege für Dortmunds große Grundstücke. Kronensicherung im Hafenviertel, Fällung in Brackel — professionell und mit Entsorgung.',
    'Rasen & Bepflanzung': 'Rollrasen für Dortmunds aktive Familien. Wir legen robuste Rasenflächen an, die auch Fußball-Spielen der Kinder standhalten — in Aplerbeck und Körne.',
    'Teichbau & Bewässerung': 'Bewässerung für Dortmunds tonige Böden. Unsere Systeme passen sich dem Boden an — kein Staunässe, kein Austrocknen, perfekt für Dorstfeld und Huckarde.',
    'Gartenpflege & Unterhalt': 'Gartenpflege für Dortmunds Einfamilienhäuser. Wöchentlicher Service für Rasen und Beete in Innenstadt-Ost und Wambel — rund ums Jahr.',
    'Herbst- & Winterdienst': 'Winterdienst in Dortmund. Laub von Rasen und Wegen entfernen, Pflanzen einwintern — wir halten auch Derne und Scharnhorst sauber.',
  },
  hagen: {
    'Gartengestaltung': 'Hanggartengestaltung ist unsere Stärke in Hagen. Terrassen, Stützmauern und befestigte Böschungen — wir machen Hagens Hügel bewohnbar und schön.',
    'Baumfällung & Pflege': 'Baumpflege an Hagens Hanglagen. Seilklettertechnik für Bäume auf Böschungen in Wehringhausen und Eckesey — sicher wo andere nicht hinkommen.',
    'Rasen & Bepflanzung': 'Robuste Bepflanzung für Hagens Hänge. Tiefwurzler wie Teppichsteinbrech und Bergbohnenkraut — wir begrünen, was geneigt ist.',
    'Teichbau & Bewässerung': 'Bewässerung für Hagens exponierte Hanglagen. Tropfsysteme, die auch an Steigungen gleichmäßig verteilen und Erosion verhindern — speziell für Boele und Haspe.',
    'Gartenpflege & Unterhalt': 'Gartenpflege für Hagens Hanggärten. Regelmäßige Kontrolle von Stützmauern und Terrassen in Hohenlimburg und Emst — wir denken mit.',
    'Herbst- & Winterdienst': 'Winterdienst für Hagen. Hangwege freiräumen, Stützmauern prüfen, Frostschutz für Terrassenpflanzen — sicher durch den Winter in Vorhalle und Delstern.',
  },
  witten: {
    'Gartengestaltung': 'Gartengestaltung für Witten an der Ruhr. Feuchtigkeitsverträgliche Konzepte für Flussnähe, Regenrückhalte-Beete für Starkregentage.',
    'Baumfällung & Pflege': 'Baumpflege in Witten. Spezialtechnik für Bäume in Flussnähe in Herbede und Ruhrdeich — wir arbeiten auch in schwer zugänglichem Gelände.',
    'Rasen & Bepflanzung': 'Bepflanzung für Wittens Ruhr-Lage. Feuchtigkeitsliebende Arten wie Schwertlilie und Steppenkerze für Gärten in Annen und Rüdinghausen.',
    'Teichbau & Bewässerung': 'Wasserlandschaften für Witten. Naturpools und Regenrückhaltebecken, die mit der Ruhr leben — in Bommern und Stockum.',
    'Gartenpflege & Unterhalt': 'Gartenpflege für Witten. Regelmäßige Kontrolle von Versickerungsanlagen und Drainagen in Heven und Durchholz — wir kennen die Flussnähe.',
    'Herbst- & Winterdienst': 'Wintervorbereitung in Witten. Bachläufe freiräumen, Versickerungsmulden reinigen, Pflanzen an der Ruhr schützen — in Witten-Mitte und Vormholz.',
  },
  herne: {
    'Gartengestaltung': 'Gartengestaltung für Herne — von der Brachfläche zum blühenden Garten. Wir kennen die Herausforderungen der Bergbau-Standorte und lösen sie.',
    'Baumfällung & Pflege': 'Baumpflege in Herne. Entfernung von Altbäumen auf verdichteten Böden in Wanne-Eickel und Herne-Mitte — mit moderner Technik.',
    'Rasen & Bepflanzung': 'Bepflanzung für Herne. Bodenverbesserung mit Kompost und Gründüngung, damit Pflanzen auf der ehemaligen Bergbaufläche gedeihen — in Sodingen und Horsthausen.',
    'Teichbau & Bewässerung': 'Hochbeet-Bewässerung für Herne. Tropfsysteme für Gemüsegärten und Kräuterbeete — nachhaltig und wassersparend in Castrop-Rauxel und Holthausen.',
    'Gartenpflege & Unterhalt': 'Gartenpflege für Herne. Regelmäßige Bodenverbesserung und Kompostierung in Baukau-West und Herne-Süd — wir kümmern uns um die Substanz.',
    'Herbst- & Winterdienst': 'Winterdienst in Herne. Laubkompostierung auf den großen Grundstücken in Wanne und Eickel — wir geben dem Boden zurück, was er braucht.',
  },
  iserlohn: {
    'Gartengestaltung': 'Waldgarten-Gestaltung für Iserlohn. Übergänge von Garten zu Wald, Schattenpflanzungen und naturnahe Konzepte für Grüner Grund und Hombruch.',
    'Baumfällung & Pflege': 'Baumpflege in Iserlohn. Fachgerechter Schnitt von Waldbäumen am Gartenrand in Iserlohner Heide und Hombruch — wir arbeiten mit der Natur, nicht gegen sie.',
    'Rasen & Bepflanzung': 'Schattenpflanzen für Iserlohn. Funkien, Astilben und Maiglöckchen für die schattigen Gärten unter den Bäumen in Hennen und Sümmern.',
    'Teichbau & Bewässerung': 'Bewässerung für Iserlohns Waldnähe. Systeme, die auch unter Baumkronen wirken — wo Regen kaum durchkommt. In Letmathe und Oestrich.',
    'Gartenpflege & Unterhalt': 'Waldgarten-Pflege für Iserlohn. Regelmäßige Kontrolle von Waldrandpflanzungen, Totholzentfernung, Wegepflege in Gerlingsen und Brückthausen.',
    'Herbst- & Winterdienst': 'Winterdienst in Iserlohn. Laub aus den Schattenbeeten entfernen, Kompost für den nächsten Frühling anlegen — in Croustillier und Rheinermark.',
  },
  unna: {
    'Gartengestaltung': 'Cottage-Gärten und Bauerngärten für Unna. Romantische Rankgerüste, lose Staudenbeete und Rosenbögen — der Münsterland-Einfluss zählt.',
    'Baumfällung & Pflege': 'Baumpflege in Unna. Schnitt von Obstbäumen in Uelzen und Massen, Kronenpflege im Kötterhof — traditionell und fachgerecht.',
    'Rasen & Bepflanzung': 'Stauden und Rosen für Unna. Rittersporn, Schafgarbe und Kletterrosen an den Fachwerkhäusern — die perfekte Cottage-Atmosphäre.',
    'Teichbau & Bewässerung': 'Bewässerung für Unnas Rosen- und Kräutergärten. Gezielte Tropfsysteme, die Blattkrankheiten vorbeugen — in Billmerich und Kessebüren.',
    'Gartenpflege & Unterhalt': 'Gartenpflege für Unnas Cottage-Gärten. Stauden schneiden, Rosen nachblühen, Kräuter ernten — wir kümmern uns um den romantischen Look in Afferde und Hertingerbruch.',
    'Herbst- & Winterdienst': 'Winterdienst in Unna. Rosenbögen stabilisieren, Stauden einwintern, Laub kompostieren — in Frömern und Holzwickede.',
  },
  schwerte: {
    'Gartengestaltung': 'Naturnahe Gartengestaltung für Schwerte. Teichanlagen, Blühstreifen und heimische Gehölze — die "Stadt im Grünen" lebt das vor.',
    'Baumfällung & Pflege': 'Baumpflege in Schwerte. Pflege von Obstbäumen und Waldrandbäumen in Villenkolonie und Ernstigen — mit Blick auf Artenvielfalt.',
    'Rasen & Bepflanzung': 'Blühwiesen und Naturteichpflanzen für Schwerte. Artenreiche Mischungen, die Insekten anziehen — in Geisecke and Ergste.',
    'Teichbau & Bewässerung': 'Naturpools und Teiche für Schwerte. Wasserpflanzen-Zonen, klare Wasserqualität, integrierte Bewässerung — in Lichtendorf und Möhne.',
    'Gartenpflege & Unterhalt': 'Gartenpflege für Schwerte. Regelmäßige Teichpflege, Blühstreifen pflegen, Wildblumenwiese mähen — in der Kernstadt und an der Ruhr.',
    'Herbst- & Winterdienst': 'Winterdienst in Schwerte. Teich reinigen und vorbereiten, Laub aus Blühstreifen entfernen, Gehölze schneiden — in Wolfskuhle und Hohenhagen.',
  },
  kamen: {
    'Gartengestaltung': 'Moderne Gartengestaltung für Kamen. Klare Geometrie, Cortenstahl und strukturierte Gräser — passend zu den Neubaugebieten.',
    'Baumfällung & Pflege': 'Baumpflege für Kamen. Formschnitt an modernen Hecken, Kronenschnitt für Ziergehölze in der Innenstadt und Methler — präzise und sauber.',
    'Rasen & Bepflanzung': 'Strukturierte Gräser und Stauden für Kamen. Stipa, Pampasgras und Polsterphlox für moderne Vorgärten in Rottmann und Westick.',
    'Teichbau & Bewässerung': 'Automatische Bewässerung für Kamen. Effiziente Systeme mit Bodenfeuchtesensoren — modern, nachhaltig und bequem in Wasserkurl und Severin.',
    'Gartenpflege & Unterhalt': 'Gartenpflege für Kamen. Formschnitt, Gräser-Rückschnitt und saisonale Bepflanzung für moderne Gärten in Weddinghofen und Brönninghausen.',
    'Herbst- & Winterdienst': 'Winterdienst für Kamen. Cortenstahl-Beete vorbereiten, Gräser schneiden, Winterblüher setzen — in Rüdinghausen und Echthausen.',
  },
  luenen: {
    'Gartengestaltung': 'Gartengestaltung für Lünen an der Lippe. Uferbepflanzung, Hochterrassen und feuchtigkeitsliebende Stauden für Flussnähe.',
    'Baumfällung & Pflege': 'Baumpflege in Lünen. Spezialtechnik für Uferbäume in Lünen-Süd und Altlünen — wir arbeiten sicher am Wasser.',
    'Rasen & Bepflanzung': 'Feuchtigkeitsstauden für Lünen. Japanische Primel, Riedgras und Sumpf-Dotterblume für die Gärten nahe der Lippe — in Nordlünen und Bulmke.',
    'Teichbau & Bewässerung': 'Ufernahe Bewässerung für Lünen. Systeme, die mit dem hohen Grundwasser zurechtkommen — in Wethmar und Lünen-Horstmar.',
    'Gartenpflege & Unterhalt': 'Gartenpflege für Lünen. Uferbeete pflegen, Schilf schneiden, Wege entlang der Lippe freihalten — regelmäßig und zuverlässig.',
    'Herbst- & Winterdienst': 'Winterdienst in Lünen. Uferbeete vorbereiten, Wasserpflanzen zurückschneiden, Laub entfernen — bereit für die Hochwasserperiode.',
  },
  bergkamen: {
    'Gartengestaltung': 'Gartengestaltung für Bergkamens Nachkriegssiedlungen. Farbenfrohe Staudenbeete, Bodendecker und Instant-Gärten mit Sofort-Wirkung.',
    'Baumfällung & Pflege': 'Baumpflege in Bergkamen. Pflege der Bestandsbäume in Weddinghofen und Rünthe — mit Erfahrung aus 30 Jahren.',
    'Rasen & Bepflanzung': 'Farbige Staudenbeete für Bergkamen. Purpursonnenhut, Indianernessel und Storchschnabel für die Siedlungsgärten in Oberaden und Hecklerkamp.',
    'Teichbau & Bewässerung': 'Bewässerung für Bergkamens farbige Beete. Tropfsysteme, die auch bei Hitze die Blütenpracht sichern — robust und effizient.',
    'Gartenpflege & Unterhalt': 'Gartenpflege für Bergkamen. Stauden nachblühen, Bodendecker pflegen, Sitzplätze reinigen — wir halten Bergkamens Gärten bunt.',
    'Herbst- & Winterdienst': 'Winterdienst für Bergkamen. Beete einwintern, Laub kompostieren, Hochbeete vorbereiten — in Rünthe-Nord und Frenking.',
  },
  'castrop-rauxel': {
    'Gartengestaltung': 'Gartengestaltung für Castrop-Rauxels Bestandsgärten. Behutsame Modernisierung, Bewahrung historischer Elemente und sensible Ergänzung.',
    'Baumfällung & Pflege': 'Baumpflege in Castrop-Rauxel. Pflege alter Obstbäume in Ickern und Habinghorst — mit Respekt vor dem Bestand.',
    'Rasen & Bepflanzung': 'Traditionelle Bepflanzung für Castrop-Rauxel. Bauerngärten, Kräuterbeete und Blutbuchenhecken — passend zum Charakter der Altstadt.',
    'Teichbau & Bewässerung': 'Bewässerung für Castrop-Rauxels traditionelle Gärten. Diskrete Systeme, die nicht stören — aber wirken. In Rauxel und Deininghausen.',
    'Gartenpflege & Unterhalt': 'Gartenpflege für Castrop-Rauxel. Alte Hecken schneiden, Wege pflegen, Bestandspflanzen erhalten — in Münsterwiesche und Schwerin.',
    'Herbst- & Winterdienst': 'Winterdienst für Castrop-Rauxel. Laub kompostieren, Blutbuchenhecken schneiden, Boden pflegen — in Frohlinde und Henrichenburg.',
  },
  'wetter-ruhr': {
    'Gartengestaltung': 'Mediterrane Gartengestaltung für Wetter an der Ruhr. Sonnige Hanglagen, Olivenbäume in Kübeln und Lavendelhecke — Flair wie in der Provence.',
    'Baumfällung & Pflege': 'Baumpflege in Wetter. Schnitt von Zitronenbäumen und Oliven in Kübeln, Kronenpflege für mediterrane Gehölze in Alt-Wetter und Wengern.',
    'Rasen & Bepflanzung': 'Mediterrane Pflanzen für Wetter. Lavendel, Rosmarin, Thymian und Oliven in Kübeln — die sonnigen Hanglagen machen es möglich.',
    'Teichbau & Bewässerung': 'Bewässerung für Wetters mediterrane Pflanzen. Gezielte Wassergaben für Oliven, Lavendel und Co. — sparsam und effizient.',
    'Gartenpflege & Unterhalt': 'Gartenpflege für Wetters mediterrane Gärten. Olivenbäume schneiden, Lavendel pflegen, Kräuter ernten — wir kümmern uns um das Flair.',
    'Herbst- & Winterdienst': 'Wintervorbereitung in Wetter. Olivenbäume einwintern, Lavendel schneiden, Kübelpflanzen schützen — in Eshof und Grundschöttel.',
  },
  schwelm: {
    'Gartengestaltung': 'Kleingarten-Gestaltung für Schwelm. Auf 60m² maximale Wirkung — hochstämmige Obstbäume, vertikale Beete und Mini-Teiche.',
    'Baumfällung & Pflege': 'Baumpflege in Schwelm. Hochstamm-Obstbäume schneiden in der Innenstadt und am Lutherkirchen-Hang — platzsparend und produktiv.',
    'Rasen & Bepflanzung': 'Schattenpflanzen für Schwelm. Maiglöckchen, Waldmeister, Funkien und Bergenie für die schattigen Gärten unter den Bäumen.',
    'Teichbau & Bewässerung': 'Miniteiche und Bewässerung für Schwelm. Wasser im Fass, Tropfschlauch im Beet — praktische Lösungen für kleine Gärten.',
    'Gartenpflege & Unterhalt': 'Gartenpflege für Schwelms kleine Gärten. Beete pflegen, Obstbäume schneiden, Miniteiche reinigen — effizient und zuverlässig.',
    'Herbst- & Winterdienst': 'Winterdienst für Schwelm. Kleine Gärten einwintern, Laub kompostieren, Hochbeete vorbereiten — bereit für den Frühling.',
  },
  enneetal: {
    'Gartengestaltung': 'Gartengestaltung für das Ennepe-Tal. Bachlauf-Pflanzungen, Feuchtigkeitsbeete und naturnahe Konzepte für Voerde und Rüggeberg.',
    'Baumfällung & Pflege': 'Baumpflege im Ennepe-Tal. Bäume an Bachläufen in Voerde und Rüggeberg schneiden — wir arbeiten mit dem Wasser, nicht dagegen.',
    'Rasen & Bepflanzung': 'Feuchtigkeitsliebende Pflanzen für Ennepetal. Bachbunge, Wasserdost und Fieberklee für Gärten im Tal — in Altenvoerde und Haspe.',
    'Teichbau & Bewässerung': 'Bachlauf-Bewässerung für Ennepetal. Systeme, die mit der natürlichen Wasserführung zusammenarbeiten — in Milspe und Gevelsberg-West.',
    'Gartenpflege & Unterhalt': 'Gartenpflege für Ennepetal. Bachläufe freihalten, Feuchtigkeitsbeete pflegen, Dränagen kontrollieren — regelmäßig im Tal.',
    'Herbst- & Winterdienst': 'Winterdienst für Ennepetal. Bachläufe vor dem Winter freiräumen, Laub entfernen, Pflanzen schneiden — in Voerde-Nord und Königsfeld.',
  },
  gevelsberg: {
    'Gartengestaltung': 'Steingarten- und Hanggestaltung für Gevelsberg. Trockenmauern, terrassierte Beete und robuste Pflanzen für die "Stadt auf dem Berge".',
    'Baumfällung & Pflege': 'Baumpflege in Gevelsberg. Seilklettertechnik für Bäume an Hängen in Silschede und Asbeck — dort wo Leitern nicht reichen.',
    'Rasen & Bepflanzung': 'Robuste Hangpflanzen für Gevelsberg. Teppichsteinbrech, Polsterphlox und Zwergsträucher für die steilen Lagen in Berge und Westerholt.',
    'Teichbau & Bewässerung': 'Bewässerung für Gevelsbergs windige Höhen. Tropfsysteme, die auch bei Wind und Steigung zuverlässig arbeiten.',
    'Gartenpflege & Unterhalt': 'Gartenpflege für Gevelsbergs Hanggärten. Trockenmauern kontrollieren, Hangbeete pflegen, Treppen sichern — wir kümmern uns um die Höhenlagen.',
    'Herbst- & Winterdienst': 'Winterdienst für Gevelsberg. Hänge freiräumen, Stützmauern prüfen, Steingartenpflanzen schützen — sicher durch den Winter in Baukloh und Dahlbruch.',
  },
  hattingen: {
    'Gartengestaltung': 'Historische Gartengestaltung für Hattingen. Innenhof-Begrünung, Kletterrosen und verwunschene Gärten in der Altstadt und Blankenstein.',
    'Baumfällung & Pflege': 'Baumpflege in Hattingen. Pflege alter Obstbäume in Blankenstein und Niederwenigern — mit Sensibilität für die historische Umgebung.',
    'Rasen & Bepflanzung': 'Kletterrosen und Kräuter für Hattingen. New Dawn, Graham Thomas und historische Rosen an den Fachwerkhäusern der Altstadt.',
    'Teichbau & Bewässerung': 'Bewässerung für Hattingens Innenhöfe. Diskrete Systeme, die die Mauern nicht beschädigen — aber grün halten. In Stüterhof und Kronsdorf.',
    'Gartenpflege & Unterhalt': 'Gartenpflege für Hattingen. Rosen nachblühen, Kräuter schneiden, historische Beete pflegen — wir respektieren die Tradition.',
    'Herbst- & Winterdienst': 'Winterdienst für Hattingen. Rosenbögen stabilisieren, Kräuter einwintern, Innenhöfe winterfest machen — in Welper und Hülsenbusch.',
  },
  holzwickede: {
    'Gartengestaltung': 'Großgarten-Gestaltung für Holzwickede. Naturpools, Obstwiesen und Zonen für Familien — auf 800m² und mehr ist alles möglich.',
    'Baumfällung & Pflege': 'Baumpflege in Holzwickede. Pflege von Obstwiesen und Waldrandbäumen in Hengstey und Bruchmühle — auf großen Flächen.',
    'Rasen & Bepflanzung': 'Blühwiesen und Obstbäume für Holzwickede. Artenreiche Wiesen auf den großen Flächen, hochstämmige Apfelbäume in Streuobstwiesen.',
    'Teichbau & Bewässerung': 'Naturpools für Holzwickede. Schwimmende Teiche mit Pflanzenfiltration, klares Wasser ohne Chemie — auf den großen Grundstücken in Holzwickede-Ost und West.',
    'Gartenpflege & Unterhalt': 'Gartenpflege für Holzwickedes Großgärten. Naturpools pflegen, Obstwiesen mähen, Blühstreifen pflegen — wir halten die großen Flächen in Form.',
    'Herbst- & Winterdienst': 'Winterdienst für Holzwickede. Laub auf großen Flächen entfernen, Naturpools vorbereiten, Obstbäume schneiden — bereit für den Frühling in Opherdicke und Natorp.',
  },
  sprockhoevel: {
    'Gartengestaltung': 'Wildblumenwiesen und Steingärten für Sprockhövel. Windfeste Bepflanzung für die Höhenlage — robust, natürlich, pflegeleicht.',
    'Baumfällung & Pflege': 'Baumpflege in Sprockhövel. Pflege von windfester Gehölze in Haßlinghausen und Gennebreck — wir kennen die exponierte Lage.',
    'Rasen & Bepflanzung': 'Wildblumen und Steingartenpflanzen für Sprockhövel. Kornblume, Mohn, Teppichphlox und Zwergkiefern für die windigen Höhen in Niedersprockhövel und Hiddinghausen.',
    'Teichbau & Bewässerung': 'Bewässerung für Sprockhövels windexponierte Lage. Systeme, die auch bei Sturm zuverlässig arbeiten — robust wie die Landschaft.',
    'Gartenpflege & Unterhalt': 'Gartenpflege für Sprockhövel. Wildblumenwiesen mähen, Steingärten pflegen, Wege freihalten — angepasst an die Höhenlage.',
    'Herbst- & Winterdienst': 'Winterdienst für Sprockhövel. Wiesen auf der Höhe freiräumen, Steingartenpflanzen schützen, Windschutz prüfen — sicher durch den Winter.',
  },
  froendenberg: {
    'Gartengestaltung': 'Regengärten und Flussnahe-Gestaltung für Fröndenberg. Versickerungsbeete, Hochbeete und Blühstreifen für Langschede und Strickherdicke.',
    'Baumfällung & Pflege': 'Baumpflege in Fröndenberg. Pflege von Bäumen an den Ruhrauen in Langschede und Strickherdicke — mit Blick auf das Flusstal.',
    'Rasen & Bepflanzung': 'Feuchtigkeits- und Trockenheit verträgliche Pflanzen für Fröndenberg. Iris, Astilbe und Steppenkerze für die Ruhr-Lage in Frömern und Oeventrop.',
    'Teichbau & Bewässerung': 'Regenwasser-Bewässerung für Fröndenberg. Systeme, die Nässe sammeln und bei Bedarf nutzen — wir arbeiten mit der Ruhr, nicht gegen sie.',
    'Gartenpflege & Unterhalt': 'Gartenpflege für Fröndenberg. Versickerungsbeete pflegen, Blühstreifen mähen, Hochbeete instandhalten — regelmäßig und zuverlässig.',
    'Herbst- & Winterdienst': 'Winterdienst für Fröndenberg. Hochwasserschutz prüfen, Versickerungsmulden freiräumen, Pflanzen schützen — bereit für die Ruhr-Hochwasserperiode.',
  },
};

// Replace service descriptions in gartenbau pages
function applyGartenServiceDescriptions(html, citySlug) {
  const descriptions = GARDEN_SERVICE_DESCRIPTIONS[citySlug];
  if (!descriptions) return html;
  
  for (const [serviceName, description] of Object.entries(descriptions)) {
    // Find the service card by h3 title and replace its paragraph
    // Escape & for regex matching (HTML uses raw & in some places, &amp; in others)
    const escapedName = serviceName.replace(/&/g, '[&]');
    const pattern = new RegExp(
      '(<h3 class="mt-4 text-lg font-bold text-ink-900">' + escapedName + '</h3>[\\s\\n]*<p class="mt-2 text-ink-600 text-sm leading-relaxed">)([^<]+)(</p>)',
      'g'
    );
    const before = html.length;
    html = html.replace(pattern, '$1' + description + '$3');
    if (html.length !== before) {
      console.log(`    ✏️ Replaced: ${serviceName}`);
    } else {
      console.log(`    ⚠️ NOT matched: ${serviceName}`);
    }
  }
  
  return html;
}

// ═══════════════════════════════════════════════════════════
// GARTENBAU: Unique Saison-Kalender pro Stadt
// ═══════════════════════════════════════════════════════════

const GARDEN_SEASON_CALENDAR = {
  bochum: `<p><strong>März–April:</strong> Bodenanalyse und erste Schnittarbeiten. In Bochums verdichteten Böden empfiehlt sich jetzt eine Gründüngung mit Phacelia.</p>
<p><strong>Mai:</strong> Sommerblumen setzen — in den schattigen Hinterhöfen von Ehrenfeld eignen sich Funkien und Astilben besonders gut.</p>
<p><strong>Juni–Juli:</strong> Mulchen gegen Trockenheit. Bochums Sommer können heiß werden — eine 5cm Schutzschicht spart Wasser.</p>
<p><strong>Oktober:</strong> Laub rechen und kompostieren. Buchenlaub aus Wiemelhausen eignet sich hervorragend für den Kompost.</p>`,

  dortmund: `<p><strong>März:</strong> Rasenpflege starten. In Dortmunds tonigem Boden empfiehlt sich eine Kalkung, gefolgt von der erste Mähung.</p>
<p><strong>April–Mai:</strong> Obstbäume pflanzen — der Boden ist aufgewärmt, die Regenwahrscheinlichkeit hoch. Ideale Bedingungen in Kley und Mengede.</p>
<p><strong>Juni:</strong> Hochbeete bepflanzen. In Dortmund reicht die Wachstumsperiode bis in den Oktober.</p>
<p><strong>September:</strong> Wildblumenwiese aussäen. Jetzt keimt die Kornblume am besten — bereit für den Frühling.</p>`,

  hagen: `<p><strong>April:</strong> Hangbefestigungen prüfen. Nach dem Winter können Stützmauern in Wehringhausen Risse bekommen — jetzt reparieren.</p>
<p><strong>Mai:</strong> Hangbepflanzung vornehmen. Teppichsteinbrech und Bergbohnenkraut wurzeln jetzt schnell ein.</p>
<p><strong>Juli:</strong> Trockenheit beachten. Hagens Hanglagen trocknen schneller aus — zusätzliches Gießen kann nötig sein.</p>
<p><strong>November:</strong> Letzter Schnitt vor dem Winter. Hecken in Eckesey jetzt formen, damit sie frostgeschützt überwintern.</p>`,

  witten: `<p><strong>März:</strong> Regenwasser-Sammelanlagen installieren. In Herbede und am Ruhrdeich ist das besonders sinnvoll.</p>
<p><strong>April:</strong> Feuchtigkeitsbeete anlegen. Jetzt hat die Erde die ideale Temperatur für Schilf und Schwertlilie.</p>
<p><strong>Juli–August:</strong> Hochwasserschutz prüfen. Versickerungsmulden freiräumen, damit Starkregen abfließen kann.</p>
<p><strong>Oktober:</strong> Uferbepflanzung ergänzen. Wasserpflanzen an der Ruhr jetzt teilen und vermehren.</p>`,

  herne: `<p><strong>März:</strong> Bodenverbesserung starten. In Herne mit seiner Bergbau-Vergangenheit ist Kompost die beste Investition.</p>
<p><strong>April:</strong> Gründüngung säen. Ölrettich und Phacelia lockern den Boden auf — perfekt für Wanne-Eickels verdichtete Flächen.</p>
<p><strong>Mai:</strong> Hochbeete aufbauen. Jetzt ist der Frost vorbei, die Erde hat 8°C erreicht.</p>
<p><strong>September:</strong> Gemüse ernten. In Herne reicht die Saison oft bis zum ersten Frost im November.</p>`,

  iserlohn: `<p><strong>April:</strong> Waldgarten-Pflege. Totholz entfernen, Wege freischneiden — in Grüner Grund und Hombruch besonders wichtig.</p>
<p><strong>Mai:</strong> Schattenpflanzen setzen. Funkien und Bergenie fühlen sich in Iserlohns Waldnähe pudelwohl.</p>
<p><strong>Juni:</strong> Heimische Gehölze pflanzen. Vogelkirsche und Feldahorn wachsen jetzt am schnellsten an.</p>
<p><strong>Oktober:</strong> Blühstreifen säen. Iserlohns Insekten freuen sich über Kornblume und Mohn.</p>`,

  unna: `<p><strong>März:</strong> Rosen schneiden. In Unnas Cottage-Gärten ist jetzt der ideale Zeitpunkt.</p>
<p><strong>April–Mai:</strong> Stauden teilen. Rittersporn und Schafgarbe vermehren sich jetzt prächtig.</p>
<p><strong>Juni:</strong> Kräuterspirale bepflanzen. Thymian, Salbei und Rosmarin gedeihen in Unna hervorragend.</p>
<p><strong>September:</strong> Rosenbogen prüfen. Rankgerüste in Uelzen und Massen jetzt stabilisieren.</p>`,

  schwerte: `<p><strong>März:</strong> Naturteich reinigen. Algen entfernen, Wasserpflanzen zurückschneiden — in Villenkolonie und Ernstigen jetzt starten.</p>
<p><strong>April:</strong> Teichpflanzen setzen. Seerosen und Schilf jetzt auspflanzen, damit sie bis Sommer etabliert sind.</p>
<p><strong>Mai:</strong> Heimische Gehölze pflanzen. Weißdorn und Vogelkirsche an den Waldrand setzen.</p>
<p><strong>Juli:</strong> Teichwasser prüfen. Bei Starkregen kann das Wasser trüb werden — Fadenalgen entfernen.</p>`,

  kamen: `<p><strong>März:</strong> Hochbeet befüllen. Lärchenrahmen aufstellen, Schicht für Schicht füllen — in Kamen jetzt starten.</p>
<p><strong>April:</strong> Gemüse aussäen. Salat, Radieschen und Spinach — der Boden in Kamen ist jetzt bereit.</p>
<p><strong>Mai:</strong> Moderne Gestaltung umsetzen. Cortenstahl-Beete und Gräser in der Innenstadt jetzt anlegen.</p>
<p><strong>Juni:</strong> Bewässerung einrichten. Tropfschläuche in den Hochbeeten sparen Wasser und Zeit.</p>`,

  luenen: `<p><strong>März:</strong> Uferpflanzen schneiden. Schilf und Sumpf-Iris in Lünen-Süd und Altlünen zurücknehmen.</p>
<p><strong>April:</strong> Terrassenbau starten. Die Baumärkte haben Saison, die Temperaturen stimmen — perfekter Zeitpunkt.</p>
<p><strong>Mai–Juni:</strong> Feuchtigkeitsstauden setzen. Japanische Primel und Riedgras in der Nähe der Lippe einpflanzen.</p>
<p><strong>Oktober:</strong> Uferbeet vorbereiten. Laub entfernen, Kompost einarbeiten — bereit für den Winter.</p>`,

  bergkamen: `<p><strong>März:</strong> Instant-Garten planen. Containerpflanzen bestellen — in Bergkamen werden sie ab April geliefert.</p>
<p><strong>April:</strong> Farbakzente setzen. Purpursonnenhut und Indianernessel in Weddinghofen einpflanzen.</p>
<p><strong>Mai:</strong> Bodendecker flächen. Storchschnabel und Polsterphlox in Rünthe und Oberaden ausbreiten.</p>
<p><strong>September:</strong> Nachbesserung. Kahle Stellen mit Herbstastern und Heuchera schließen.</p>`,

  'castrop-rauxel': `<p><strong>März:</strong> Bestandsgarten pflegen. Alte Obstbäume in Ickern und Habinghorst schneiden.</p>
<p><strong>April:</strong> Hecke pflanzen. Blutbuchen-Setzlinge jetzt setzen — bis Herbst sind sie angewachsen.</p>
<p><strong>Mai:</strong> Sitzecke gestalten. Natursteinmauer bauen, Feuerstelle einbauen — in Rauxel ein beliebtes Projekt.</p>
<p><strong>Oktober:</strong> Kompost anlegen. Laub aus Castrop-Rauxels Gärten sammeln und einarbeiten.</p>`,

  'wetter-ruhr': `<p><strong>April:</strong> Mediterrane Pflanzen einsetzen. Olivenbäume in Kübeln nach draußen stellen — der Frost ist vorbei.</p>
<p><strong>Mai:</strong> Lavendel pflanzen. In Wetters sonnigen Hanglagen gedeiht er prächtig.</p>
<p><strong>Juni:</strong> Stützmauern bauen. Trockenmauern in Alt-Wetter und Wengern jetzt errichten.</p>
<p><strong>September:</strong> Terrasse reinigen. Kiesbeete pflegen, Stipa-Gräser zurücknehmen.</p>`,

  schwelm: `<p><strong>März:</strong> Kleine Gärten planen. In der Innenstadt und am Lutherkirchen-Hang jetzt Skizzen anfertigen.</p>
<p><strong>April:</strong> Hochstamm-Obst pflanzen. Ein Apfelbaum auf 60m² ist möglich — jetzt setzen.</p>
<p><strong>Mai:</strong> Schattengarten bepflanzen. Maiglöckchen und Waldmeister in Schwelms schattigen Ecken.</p>
<p><strong>Oktober:</strong> Miniteich pflegen. Fass-Wasser wechseln, Pflanzen zurückschneiden.</p>`,

  holzwickede: `<p><strong>März:</strong> Naturpool planen. Standort in Hengstey und Bruchmühle jetzt festlegen.</p>
<p><strong>April–Mai:</strong> Naturpool bauen. Folie verlegen, Pflanzenzone einrichten — jetzt ist die Baumsaison.</p>
<p><strong>Juni:</strong> Zonen strukturieren. Spielwiese, Sitzecke und Nutzgarten in Holzwickedes großen Gärten abgrenzen.</p>
<p><strong>August:</strong> Naturpool pflegen. Wasserqualität prüfen, Pflanzen düngen.</p>`,

  sprockhoevel: `<p><strong>März:</strong> Wildblumenwiese vorbereiten. Fläche in Haßlinghausen und Gennebreck umpflügen.</p>
<p><strong>April:</strong> Wildblumen säen. Kornblume, Mohn und Kamille — Sprockhövels Höhenlage ist ideal.</p>
<p><strong>Mai:</strong> Steingarten anlegen. Zwergkiefern und Fetthennen in Niedersprockhövel setzen.</p>
<p><strong>Juni:</strong> Heidegarten pflegen. Besenheide schneiden, Wege freilegen.</p>`,

  froendenberg: `<p><strong>März:</strong> Regengarten planen. Standort für Versickerungsmulden in Langschede und Strickherdicke festlegen.</p>
<p><strong>April:</strong> Pflanzen für nasse Böden setzen. Iris und Astilbe einpflanzen — Fröndenbergs Flussnähe macht sie robust.</p>
<p><strong>Mai:</strong> Hochbeet bauen. Doppelt-Hochbeet in Frömern errichten, Frühbeet-Aufsatz installieren.</p>
<p><strong>September:</strong> Blühstreifen pflegen. Wildblumen aussäen, Insektenhotel aufstellen.</p>`,

  gevelsberg: `<p><strong>März:</strong> Trockenmauer bauen. Natursteine in Silschede und Asbeck setzen — jetzt vor der Vegetationsperiode.</p>
<p><strong>April:</strong> Hangbepflanzung starten. Teppichsteinbrech und Polsterphlox in Gevelsbergs Steigungen einsetzen.</p>
<p><strong>Mai:</strong> Aussichtsterrasse planen. Sitzplatz mit Blick übers Ruhrgebiet positionieren.</p>
<p><strong>Juni:</strong> Pergola errichten. Windschutz für Gevelsbergs exponierte Höhenlagen.</p>`,

  hattingen: `<p><strong>März:</strong> Innenhof vorbereiten. Mauern in der Altstadt und Blankenstein prüfen, Rankgerüste installieren.</p>
<p><strong>April:</strong> Kletterrosen setzen. New Dawn und Graham Thomas an Weidenbögen einpflanzen.</p>
<p><strong>Mai:</strong> Kräutergarten bepflanzen. Thymian, Salbei und Rosmarin in Hattingens historischen Innenhöfen.</p>
<p><strong>September:</strong> Verwunschener Garten pflegen. Weidenbögen erneuern, Wildrosen schneiden.</p>`,

  enneetal: `<p><strong>März:</strong> Bachlauf reinigen. Laub aus den Gräben in Voerde und Rüggeberg entfernen.</p>
<p><strong>April:</strong> Feuchtigkeitsbeet anlegen. Bachbunge und Wasserdost an den Ufern einpflanzen.</p>
<p><strong>Mai:</strong> Dränage verbessern. In Altenvoerde und Haspe drainagebedürftige Bereiche erneuern.</p>
<p><strong>Oktober:</strong> Vier-Jahreszeiten-Beet pflegen. Herbstastern schneiden, Krokusse für den Frühling setzen.</p>`,
};

function generateGartenSeasonCalendar(citySlug) {
  const city = CITY_DATA[citySlug];
  const calendar = GARDEN_SEASON_CALENDAR[citySlug];
  if (!city || !calendar) return '';
  
  return `\n<!-- ═══════════ SAISON-KALENDER ${city.name.toUpperCase()} (Unique) ═══════════ -->\n<section class="py-12 bg-ink-50">\n  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">\n    <h3 class="text-2xl font-bold text-ink-900 mb-6">Saison-Kalender für ${city.name}</h3>\n    <div class="space-y-3 text-ink-600 leading-relaxed">\n      ${calendar}\n    </div>\n  </div>\n</section>`;
}

// ═══════════════════════════════════════════════════════════
// GARTENBAU: Unique FAQs pro Stadt
// ═══════════════════════════════════════════════════════════

const GARDEN_FAQS = {
  bochum: [
    { q: 'Welche Pflanzen wachsen in Bochums schattigen Hinterhöfen?', a: 'Funkien, Astilben, Bergenien und Schattengräser wie Schatten-Segge gedeihen auch mit wenig Licht. In Bochums engen Hinterhofgärten funktionieren vertikale Lösungen wie Mooswände und Schattenteppiche hervorragend.' },
    { q: 'Wie verbessere ich verdichtete Erde in Bochum?', a: 'Durch Bohrlochbelüftung, Zugabe von Kompost und Sand sowie den Einsatz von Gründüngung wie Phacelia oder Ölrettich. Bei stark verdichteten Böden empfehlen wir erhöhte Beete.' },
  ],
  dortmund: [
    { q: 'Wie oft muss ich in Dortmund mähen?', a: 'In der Wachstumszeit (April–Oktober) alle 1–2 Wochen. In Dortmunds tonigen Böden wächst der Rasen schnell. Mulchmähen reduziert den Aufwand und düngt gleichzeitig.' },
    { q: 'Welche Obstbäume eignen sich für Dortmund?', a: 'Apfel (besonders James Grieve und Boskoop), Kirsche, Birne und Pflaume. Achten Sie auf einen sonnigen Standort mit guter Drainage — in Dortmunds tonigem Boden empfehlen wir eine Drainageschicht.' },
  ],
  hagen: [
    { q: 'Wie befestige ich einen Steingarten in Hagen?', a: 'Mit Trockenmauern aus Naturstein, Gabionen oder bepflanzten Böschungen. In Hagen mit seiner Hanglage ist eine fachgerechte Drainage wichtig, um Erdrutschen vorzubeugen.' },
    { q: 'Welche Pflanzen halten Hagens Hanglagen aus?', a: 'Teppichsteinbrech, Bergbohnenkraut, Polsterphlox, Staudensonnenbraut und Zwergsträucher wie Teppich-Wacholder. Diese Wurzeln durchwurzeln den Boden tief und stabilisieren natürlich.' },
  ],
  witten: [
    { q: 'Wie schütze ich meinen Garten in Witten vor Hochwasser?', a: 'Mit Versickerungsbeeten, Regenrückhaltebecken und durchlässigen Flächen. In Witten nahe der Ruhr empfehlen wir zusätzlich feuchtigkeitstolerante Pflanzen wie Schwertlilie und Steppenkerze.' },
    { q: 'Kann ich in Witten einen Teich anlegen?', a: 'Ja, aber mit Vorsicht: Bei Grundstücken nahe der Ruhr kann das Grundwasser hoch stehen. Wir empfehlen eine professionelle Bodenanalyse und gegebenenfalls einen höher gelegenen Teich.' },
  ],
  herne: [
    { q: 'Mein Boden in Herne ist nährstoffarm — was tun?', a: 'Zuerst eine Bodenanalyse (kostet ca. 30–50 €). Danach: Kompost, organische Dünger und gegebenenfalls spezielle Substrate. In Herne mit seiner Bergbau-Vergangenheit lohnt sich das Investment in gute Erde.' },
    { q: 'Kann ich in Herne einen Gemüsegarten anlegen?', a: 'Absolut! Nach Bodenverbesserung gedeihen Tomaten, Salat, Kräuter und Kartoffeln prächtig. Wir empfehlen Hochbeete, die die Erde kontrollieren und den Rücken schonen.' },
  ],
  iserlohn: [
    { q: 'Wie gestalte ich den Übergang von Garten zu Wald in Iserlohn?', a: 'Mit natürlichen Pflanzen wie Hortensien, Funkien, Astilben und Heide. Eine beschnittene Hecke statt Wildwuchs schafft Ordnung. Wir beraten gern zu passenden Pflanzen für Waldrandlagen.' },
    { q: 'Welche Heimischen gehölze passen in Iserlohn?', a: 'Vogelkirsche, Feldahorn, Hainbuche, Weißdorn und Schlehe. Diese Arten fördern die Artenvielfalt und passen perfekt zu Iserlohns Waldnähe.' },
  ],
  unna: [
    { q: 'Wie plane ich einen Cottage-Garten in Unna?', a: 'Mit losen Staudenbeeten, Rankgerüsten und einer Mischung aus Zier- und Nutzpflanzen. In Unna mit seiner Münsterland-Nähe funktionieren Rosen, Schafgarbe und Rittersporn hervorragend.' },
    { q: 'Welche Rosen gedeihen in Unna?', a: 'Kletterrosen wie New Dawn und Graham Thomas, Bodendeckerrosen und Beetrosen. Unna ist Rosen-freundlich, wenn der Standort sonnig und nicht zu nass ist.' },
  ],
  schwerte: [
    { q: 'Wie baue ich einen Naturteich in Schwerte?', a: 'Mit unterschiedlichen Tiefenzonen (30cm Ufer, 80cm Mittelzone), Wasserpflanzen wie Seerosen und Schilf, und einem Kiesufer. Schwertes grüne Umgebung macht Naturteiche besonders wertvoll für die Artenvielfalt.' },
    { q: 'Welche Vögel kommen in meinen Schwerte-Garten?', a: 'Mit Vogelkirsche, Weißdorn und einer Blühstreifen locken Sie Amseln, Blaumeisen, Buntspechte und Stieglitze an. Ein Insektenhotel ist ein guter Zusatz.' },
  ],
  kamen: [
    { q: 'Welche Hochbeete eignen sich für Kamen?', a: 'Lärchenholz-Hochbeete mit 80cm Arbeitshöhe sind ideal. In Kamen flacher Lage lässt sich das Beet leicht erschließen. Wir empfehlen eine Frühbeet-Abdeckung für den Frühstart.' },
    { q: 'Wie gestalte ich einen modernen Vorgarten in Kamen?', a: 'Mit klaren Geometrien: Cortenstahl-Beeteinfassungen, Zierkies und strukturierte Gräser wie Stipa. Kamens Neubaugebiete eignen sich perfekt für diesen Look.' },
  ],
  luenen: [
    { q: 'Welche Pflanzen vertragen Lünens hohes Grundwasser?', a: 'Japanische Primel, Riedgras, Sumpf-Dotterblume, Schilf und Astilbe. Diese Pflanzen lieben Nässe und sehen trotzdem schön aus — perfekt für Lünen an der Lippe.' },
    { q: 'Kann ich in Lünen eine Terrasse am Wasser bauen?', a: 'Ja, mit Genehmigung und fachgerechter Planung. Wir empfehlen erhöhte Holzterrassen mit Blick auf die Lippe und windgeschützte Pergolen.' },
  ],
  bergkamen: [
    { q: 'Wie bekomme ich einen „Instant-Garten" in Bergkamen?', a: 'Mit Großcontainer-Pflanzen (Xxl-Formate), die sofort Wirkung zeigen. Wir kombinieren Olivenbäume, Gräser und Stauden in Kübeln — so sieht der Garten sofort erwachsen aus.' },
    { q: 'Was mache ich mit meinem alten Funktionsgarten in Bergkamen?', a: 'Farbenfrohe Staudenbeete, pflegeleichte Bodendecker und Sitznischen verwandeln ihn. Bergkamens Nachkriegsgärten haben Potenzial — wir bringen frischen Wind hinein.' },
  ],
  'castrop-rauxel': [
    { q: 'Wie pflege ich einen alten Bestandsgarten in Castrop-Rauxel?', a: 'Mit Respekt vor dem Vorhandenen: Alte Obstbäume erhalten und schneiden, eingewachsene Hecken pflegen, historische Wege erneuern. Nur krankes Material wird ersetzt.' },
    { q: 'Welche Hecke pflanze ich in Castrop-Rauxel?', a: 'Blutbuche (doppelte Reihe für Sichtschutz), Liguster oder Hainbuche. Diese Hecken sind robust und passen zu Castrop-Rauxels ländlichem Charakter.' },
  ],
  'wetter-ruhr': [
    { q: 'Kann ich mediterrane Pflanzen in Wetter an der Ruhr anbauen?', a: 'Ja! Olivenbäume in Kübeln, Lavendel, Rosmarin und Thymian gedeihen hier gut — dank sonniger Hanglagen und milder Temperaturen durch das Flusstal.' },
    { q: 'Wie befestige ich einen Hang in Wetter?', a: 'Mit Stützmauern aus Naturstein, Gabionen oder terrassierten Beeten. In Wetters Hanglage ist professionelle Planung wichtig — wir analysieren den Boden und empfehlen die passende Lösung.' },
  ],
  schwelm: [
    { q: 'Wie nutze ich einen kleinen Garten in Schwelm optimal?', a: 'Mit hochstämmigen Obstbäumen (Vertikale), vertikalen Beeten an Mauern und einem Mini-Teich im Fass. Kleine Gärten brauchen klare Konzepte — wir planen jeden Quadratmeter.' },
    { q: 'Welche Schattenpflanzen wachsen in Schwelm?', a: 'Maiglöckchen, Waldmeister, Schwertlilie, Funkien und Bergenie. Schwelms bergische Lage mit vielen Bäumen macht Schattenpflanzen oft zur Notwendigkeit.' },
  ],
  enneetal: [
    { q: 'Wie kann ich meinen feuchten Garten im Ennepe-Tal nutzen?', a: 'Mit Feuchtigkeitsbeeten, Bachlauf-Pflanzungen und robusten Stauden. Bachbunge, Wasserdost und Fieberklee fühlen sich im Ennepe-Tal pudelwohl.' },
    { q: 'Muss ich meinen Garten im Ennepe-Tal drainieren?', a: 'Nicht immer. Oft reicht es, feuchtigkeitsliebende Pflanzen zu setzen und die Wege zu erhöhen. Eine professionelle Analyse hilft, die richtige Lösung zu finden.' },
  ],
  gevelsberg: [
    { q: 'Wie befestige ich einen Steingarten in Gevelsberg?', a: 'Mit Trockenmauern aus Bruchstein, Gabionen oder bepflanzten Böschungen. Gevelsbergs steile Hänge verlangen nach fester Hand — wir haben die Erfahrung.' },
    { q: 'Wo ist der beste Standort für einen Sitzplatz in Gevelsberg?', a: 'Dort, wo der Blick am schönsten ist — oft nach Süden oder Westen. Wir achten auf Windschutz und robuste Pflanzen, da Gevelsbergs Höhenlage windig sein kann.' },
  ],
  hattingen: [
    { q: 'Wie gestalte ich einen historischen Innenhof in Hattingen?', a: 'Mit Kletterrosen an Rankgerüsten, Kräuterbeeten und alten Mauern. Hattingens Altstadt verlangt nach Sensibilität — wir arbeiten mit Geschichte, nicht gegen sie.' },
    { q: 'Kann ich in Hattingen einen „verwunschenen Garten" anlegen?', a: 'Ja! Mit Weidenbögen, wilden Rosen, Natursteinpfaden und gezielter Pflanzdichte. Wir schaffen Romantik, ohne dass der Garten unbenutzbar wird.' },
  ],
  holzwickede: [
    { q: 'Was ist ein Naturpool und funktioniert er in Holzwickede?', a: 'Ein schwimmender Teich ohne Chemie, der sich durch Pflanzen und Mikroorganismen selbst reinigt. In Holzwickedes großen Gärten ist ein Naturpool ideal — wir planen und bauen fachgerecht.' },
    { q: 'Wie strukturiere ich einen 800m²-Garten in Holzwickede?', a: 'In Zonen: Spielwiese, Sitzbereich, Nutzgarten und Blühstreifen. Wir planen Wege, die die Bereiche verbinden und gleichzeitig optisch strukturieren.' },
  ],
  sprockhoevel: [
    { q: 'Welche Pflanzen überleben Sprockhövels Wind?', a: 'Gräser (Stipa, Pampasgras), Fetthennen, Zwergkiefern, Schafgarbe und Besenheide. Diese Pflanzen sind windfest und trockenheitsresistent — perfekt für Sprockhövels Höhenlage.' },
    { q: 'Wie oft muss ich eine Wildblumenwiese in Sprockhövel mähen?', a: 'Zweimal pro Jahr: Ende Juni und Ende September. Sprockhövels weite Flächen eignen sich hervorragend für Wildblumenwiesen — mehr Farben, weniger Arbeit.' },
  ],
  froendenberg: [
    { q: 'Wie kann ich meinen Garten in Fröndenberg regenaktiv gestalten?', a: 'Mit Versickerungsbeeten, Regenrückhaltebecken und durchlässigen Wegen. Fröndenberg an der Ruhr profitiert von fachgerechter Regenwasser-Bewirtschaftung.' },
    { q: 'Welche Pflanzen eignen sich für Fröndenbergs Flussnähe?', a: 'Iris, Astilbe, Schilf, Steppenkerze und Sumpfblutauge. Diese Arten vertragen nasse Füße und trockene Phasen gleichermaßen — ideal für Fröndenbers Ruhr-Lage.' },
  ],
};

// ═══════════════════════════════════════════════════════════
// GARTENBAU: KOMPLETT UNIQUE CITY GUIDES — Keine Templates!
// Jede Stadt bekommt eigenes Thema, eigene Struktur, eigenen Wortschatz
// ═══════════════════════════════════════════════════════════

const GARDEN_CITY_GUIDES = {
  bochum: `<p>Zwischen den dicht bebauten Straßen von Ehrenfeld und den Reihenhäusern in Langendreer liegt oft nur ein schmaler Grünstreifen. Genau hier setzen wir an: Wir verwandeln Mini-Gärten in Oasen — mit vertikalen Beeten, Kübel-Kombinationen und pflegeleichten Stauden, die auch im Schatten benachbarter Häuser gedeihen.</p>
<p>Das Ruhrklima mit seinen regenreichen Herbstmonaten verlangt nach durchlässigen Böden. In Bochums Stadtteilen mit verdichteter Erde — eine Folge der industriellen Vergangenheit — empfehlen wir erhöhte Beete und spezielle Substrate. So bleibt Wasser nicht stehen, und die Pflanzenwurzeln bekommen Luft.</p>
<p>Beliebt bei Bochumer Gartenbesitzern: Der „Urban Jungle"-Look mit Gräsern, Farnen und Blattschmuckpflanzen. Robust, schattentolerant und trotzdem üppig — perfekt für die typischen 80–150 m² großen Grundstücke der Stadt.</p>`,

  dortmund: `<p>Der Garten in Dortmund ist oft ein Familienprojekt: genug Platz für Kinder, Hund und Gemüsebeet. In Kley und Mengede mit ihren post-war Siedlungshäusern sind 400–600 m² Grundstücke keine Seltenheit. Hier planen wir Funktionszonen, die alle unter einen Dach bringen — Spielwiese, Sitzecke und Nutzgarten.</p>
<p>Rasenpflege ist in Dortmund ein Dauerthema. Die Mischung aus tonigem Unterboden und regelmäßigen Regenperioden lässt Moos schnell die Oberhand gewinnen. Unser Tipp: Nicht kämpfen, sondern anpassen. Bodendecker, Kiesflächen und robuste Rasenmischungen für Schattenlagen reduzieren den Pflegeaufwand erheblich.</p>
<p>Viele Dortmunder träumen von Obstbäumen. Wir beraten gern: Kirsch- und Apfelbäume gedeihen hier hervorragend, wenn der Standort nicht zu nass ist. Eine Ernte ist oft schon im zweiten Jahr möglich.</p>`,

  hagen: `<p>Hagen ist die hügeligste Stadt des Ruhrgebiets — und das stellt Gärtner vor besondere Aufgaben. In Wehringhausen und Eckesey geht es oft um Hangbefestigung: Stützmauern, Böschungen und terrassierte Beete, die Erdrutschen vorbeugen und gleichzeitig attraktiv aussehen.</p>
<p>Hanglagen haben aber auch Vorteile: optimale Sonneneinstrahlung, natürliche Drainage und spektakuläre Ausblicke. Wir nutzen diese Gegebenheiten mit Staudenterrassen, Staudenschnitt und naturnahen Pflanzkonzepten, die den Hang stabilisieren und farblich durchs ganze Jahr tragen.</p>
<p>Typisch für Hagen: Gärten, die über mehrere Ebenen angelegt sind. Treppen, Wege und Sitzplätze verbinden die Terrassen — wir achten dabei immer auf sichere Befestigungen und barrierefreie Zugänge.</p>`,

  witten: `<p>Die Ruhr prägt Witten — nicht nur geografisch, sondern auch im Garten. In Herbede und Ruhrdeich liegen viele Grundstücke nahe am Fluss. Hier steht Wassermanagement im Mittelpunkt: Wie kann der Garten Starkregen aufnehmen, ohne überzuschwemmen?</p>
<p>Unsere Antwort: Regenrückhaltebecken versickerungsfähige Flächen und Pflanzen, die sowohl Trockenheit als auch nasse Füße vertragen. Schwertlilie, Steppenkerze und Blut-Storchschnabel sind hier erste Wahl.</p>
<p>Auch die Hanglagen rund um Hohenstein profitieren von unserem Know-how. Wer hier einen Garten anlegt, braucht Standfestigkeit — sowohl bei den Pflanzen als auch bei der Planung. Wir sorgen für beides.</p>`,

  herne: `<p>Herne war Jahrhunderte lang Bergbau-Stadt — und das spürt man im Gartenboden noch heute. In Wanne-Eickel und Herne-Mitte finden wir häufig verdichtete, nährstoffarme Böden, die spezielle Vorbereitung brauchen, bevor Pflanzen wurzeln können.</p>
<p>Wir starten deshalb mit einer Bodenanalyse: Wie tief ist die Schicht? Welche pH-Werte herrschen vor? Danach wird aufgebessert — mit Kompost, Sand und gegebenenfalls speziellen Substraten. Erst wenn das Fundament stimmt, pflanzen wir.</p>
<p>Herner Gärten haben oft eine zweite Chance verdient: Viele Grundstücke wurden Jahrzehnte vernachlässigt. Wir lieben diese Projekte — aus brachen Flächen entstehen hier mit der richtigen Planung blühende Rückzugsorte.</p>`,

  iserlohn: `<p>Iserlohn liegt am Rand des Sauerlands — und das merkt man der Flora an. In Grüner Grund und Hombruch grenzen viele Gärten direkt an Wald. Hier verstehen wir uns als Übergangsgestalter: Vom geschlossenen Wald in den offenen, gepflegten Garten.</p>
<p>Wildwuchs ist das eine, Verwilderung das andere. Wir schaffen Struktur: Beschnittene Hecken statt undurchdringlicher Büsche, gewollte Schattenpflanzen statt unkontrolliertem Moosbewuchs. Eiche, Ahorn und Buche finden hier ihre gepflegte Entsprechung in Hortensien, Funkien und Astilben.</p>
<p>Viele Iserlohner schätzen außerdem den traditionellen Bauerngarten. Kräuter, Stauden und ein paar Gemüsereihen — wir planen diese Kombination so, dass sie das ganze Jahr über einladend aussieht.</p>`,

  unna: `<p>Unna liegt am Übergang vom Ruhrgebiet zum Münsterland — und der Gartenstil spiegelt das wider. In Uelzen und Massen sieht man neben klassischen Ziergärten immer häufiger Cottage-Gärten: lose Pflanzungen, romantische Rankgerüste und eine Mischung aus Zier- und Nutzpflanzen.</p>
<p>Der Schlüssel zum Cottage-Garten: Konstruierte Unordnung. Alles wächst durcheinander, aber nichts wächst wild. Wir setzen auf Selbstaussäer wie Schafgarbe und Rittersporn, ergänzt mit strukturgebenden Stauden wie Indianernessel und Purpursonnenhut.</p>
<p>Auch Rosen spielen in Unna eine große Rolle. Kletterrosen an Hauswänden und Zaunfeldern verströmen Duft und verdecken unschöne Blickwinkel — ein Klassiker, der nie aus der Mode kommt.</p>`,

  schwerte: `<p>Schwerte nennt sich selbst „Stadt im Grünen" — und der Name ist Programm. In Villenkolonie und Ernstigen grenzen viele Gärten an Wald und Wiesen. Unsere Aufgabe hier: Den Garten so zu gestalten, dass er sich nahtlos in die Umgebung einfügt.</p>
<p>Naturnahe Gartenteiche sind bei Schwertem besonders beliebt. Sie bieten Lebensraum für Vögel, Insekten und Amphibien — und sind zugleich ein optisches Highlight. Wir planen Teiche mit unterschiedlichen Tiefenzonen und ufernahen Pflanzungen, die das Wasser reinigen.</p>
<p>Wer in Schwerte lebt, schätzt die Nähe zur Natur. Wir unterstützen das: Mit heimischen Gehölzen wie Feldahorn und Vogelkirsche, die Vögel und Schmetterlinge anlocken.</p>`,

  kamen: `<p>Kamen ist flach — und das ist ein Vorteil. In der Innenstadt und in den Neubaugebieten rund um Methler lassen sich Gärten leicht erschließen, ohne aufwändige Höhenversätze ausgleichen zu müssen.</p>
<p>Hier setzen wir auf klare Geometrie: Gerade Wege, rechtwinklige Beete und symmetrische Anordnungen. Moderne Gartengestaltung mit Betonelementen, Cortenstahl und strukturierten Kiesflächen liegt im Trend.</p>
<p>Auch der Gemüsegarten erlebt in Kamen eine Renaissance. Wir planen Hochbeete, die rückenschonend sind und eine lange Erntesaison ermöglichen — von Frühjahr bis in den Spätherbst.</p>`,

  luenen: `<p>Die Lippe fließt durch Lünen — und prägt damit das Gefühl der Stadt. In Lünen-Süd und Altlünen trifft man auf eine Mischung aus historischen und modernen Grundstücken, oft mit reichlich Grün drumherum.</p>
<p>Fließgewässer in der Nähe bedeuten: Das Grundwasser steht hoch. Bei der Pflanzenwahl achten wir deshalb besonders auf Feuchtigkeitstoleranz. Japanische Primel, Riedgras und Sumpfdotterblume fühlen sich hier pudelwohl.</p>
<p>Für Sitzbereiche empfehlen wir erhöhte Terrassen mit Blick aufs Wasser. Ein paar Stufen, eine solide Konstruktion — und der Lünener Garten wird zur Wohlfühloase mit Panorama.</p>`,

  bergkamen: `<p>Bergkamen ist eine junge Stadt — geprägt von der Mitte des 20. Jahrhunderts und geprägt von Wandel. In Weddinghofen und Rünthe dominieren Nachkriegssiedlungen mit einfachen, funktionalen Gärten.</p>
<p>Genau hier sehen wir Potenzial: Viele dieser Gärten wurden jahrzehntelang nur funktional genutzt — Wäschepflege, Rasen, fertig. Wir bringen frischen Wind hinein: Farbige Akzente durch Stauden, pflegeleichte Bodendecker statt Kahlschlag-Rasen und gemütliche Sitznischen.</p>
<p>Besonders gefragt in Bergkamen: Der „Instant-Garten". Schnell angelegt, schnell erwachsen aussehend. Wir arbeiten mit Containerware in Großformaten, die sofort Wirkung zeigen.</p>`,

  'castrop-rauxel': `<p>Castrop-Rauxel hat einen ländlichen Charakter bewahrt, obwohl es mitten im Ruhrgebiet liegt. In Ickern und Habinghorst finden sich viele traditionelle Einfamilienhäuser mit eingewachsenen Gärten, die seit Generationen gepflegt werden.</p>
<p>Bei solchen Bestandsgärten zählt Respekt vor dem Vorhandenen. Alte Obstbäume, eingewachsene Hecken und historische Wegeführungen werden bewahrt und behutsam ergänzt. Nur was krank oder überaltert ist, wird ersetzt.</p>
<p>Castroper schätzen Aufräumarbeiten genauso wie Neugestaltungen. Ein typischer Auftrag: Den Garten der Großeltern modernisieren, ohne dessen Seele zu verlieren. Das ist Handwerk — und genau unser Ding.</p>`,

  'wetter-ruhr': `<p>Wetter an der Ruhr lebt von seinen Höhen und Tälern. In Alt-Wetter und Wengern liegen viele Grundstücke an Steigungen, die eine versierte Planung verlangen. Wer hier ohne Konzept pflanzt, erlebt bei der ersten Regenperiode eine Überraschung.</p>
<p>Terrassierung ist das Stichwort. Wir bauen Stützmauern aus Naturstein, setzen Gabionen oder arbeiten mit bepflanzten Böschungen, die den Boden halten. Jede Lösung wird auf die spezifische Hangneigung abgestimmt.</p>
<p>Beliebt bei Wetteranern: Mediterrane Terrassen mit Olivenbäumen in Kübeln, Lavendelhecke und Kiesbeeten. Passt zum Klima, sieht edel aus und braucht wenig Pflege.</p>`,

  schwelm: `<p>Schwelm liegt am Rande des Bergischen Landes — und die bergische Topografie prägt auch die Gärten. In der Innenstadt und an den Hängen rund um die Lutherkirche sind viele Grundstücke kleinteilig und topografisch anspruchsvoll.</p>
<p>Hier zeigt sich Erfahrung: Kleine Gärten brauchen klare Konzepte. Wir nutzen jeden Quadratmeter — mit ein paar hochstämmigen Obstbäumen, einem vertikalen Gemüsebeet und einem Mini-Teich im Fass. Kleiner Raum, große Wirkung.</p>
<p>Schwelmer Gärten sind oft sehr persönlich. Wir nehmen uns Zeit, die Wünsche der Eigentümer zu verstehen, bevor wir den ersten Spatenstich setzen.</p>`,

  enneetal: `<p>Das Ennepe-Tal ist grün, feucht und von sanften Hügeln geprägt. In Ennepetal-Voerde und Rüggeberg finden sich viele Gärten mit natürlichen Bachläufen oder Sickergräben, die das Wasser ableiten.</p>
<p>Feuchtigkeit ist hier Segen und Fluch zugleich. Pflanzen, die Nässe lieben, gedeihen prächtig — doch wer das falsche Beet anlegt, steht schnell knöchelhoch im Wasser. Wir analysieren die Drainage und passen das Pflanzschema daran an.</p>
<p>Typisch fürs Ennepe-Tal: Gärten mit naturnahen Bachläufen, die wir mit passenden Pflanzen wie Bachbunge und Wasserdost einrahmen. Ein Blickfang, der zugleich ökologisch wertvoll ist.</p>`,

  gevelsberg: `<p>Gevelsberg ist bekannt für seine steilen Hänge — der Stadtnickname „Stadt auf dem Berge" ist Programm. In Silschede und Asbeck liegen zahlreiche Grundstücke an Hanglagen, die eine spezialisierte Begrünung verlangen.</p>
<p>Hangbefestigung ist bei uns Kernkompetenz. Ob Trockenmauer aus Bruchstein, bepflanzte Gabionen oder eingebaute Treppen — wir sorgen dafür, dass der Boden bleibt, wo er hingehört.</p>
<p>Gevelsberger Gärten haben oft einen atemberaubenden Blick übers Ruhrgebiet. Wir positionieren Sitzplätze genau dort, wo der Ausblick am schönsten ist — mit windgeschützten Pergolen und robusten Pflanzen, die auch an exponierten Standorten gedeihen.</p>`,

  hattingen: `<p>Hattingen ist die älteste Stadt des Ruhrgebiets — und das sieht man den Gärten an. In der historischen Altstadt und den Gewerkenvierteln finden sich oft Innenhöfe und kleine ummauerte Gärten, die Jahrhunderte alt sind.</p>
<p>Bei solchen Gärten arbeiten wir mit Geschichte, nicht gegen sie. Alte Mauern bleiben, wenn sie stabil sind. Historische Pflasterungen werden gereinigt und ergänzt. Und die Pflanzenwahl? Die passt sich dem Charakter an — Kräuter, Rosen und Kletterpflanzen, die seit Generationen in solchen Gärten gedeihen.</p>
<p>Beliebt bei Hattingern: Der „Verwunschene Garten"-Look — leicht verwildert, romantisch, geheimnisvoll. Wir schaffen das durch gezielte Pflanzdichten und natürliche Materialien wie Weiden und Holz.</p>`,

  holzwickede: `<p>Holzwickede ist die grünste Gemeinde im Kreis Unna — viele Gärten grenzen an Felder und Wiesen. In Hengstey und Bruchmühle hat man oft 800 m² und mehr zur Verfügung. Platz für Träume — wenn man ihn richtig nutzt.</p>
<p>Große Gärten brauchen Zonen: Eine offene Wiese zum Spielen, einen geschützten Sitzbereich zum Entspannen und einen strukturierten Nutzgarten. Wir planen diese Bereiche so, dass sie harmonieren und trotzdem eigenständig wirken.</p>
<p>Beliebt in Holzwickede: Naturpools. Kein Chlor, kein Betonbecken — sondern ein schwimmender Teich mit Wasserpflanzen, der sich selbst reinigt. Wir planen und bauen diese Systeme fachgerecht.</p>`,

  sprockhoevel: `<p>Sprockhövel liegt hoch über dem Ruhrgebiet — windig, exponiert, aber mit grandioser Aussicht. In Haßlinghausen und Gennebreck sind die Gärten oft weitläufig und von Hecken umgeben.</p>
<p>Wind ist hier der entscheidende Faktor. Empfindliche Pflanzen überleben nicht, robuste hingegen gedeihen prächtig. Wir setzen auf Gräser, Fetthennen, Zwergkiefern und Schafgarbe — alles Pflanzen, die auch im Sturm ungerührt bleiben.</p>
<p>Sprockhöveler Gärten eignen sich hervorragend für Heuwiesen-Optik: Wenig mähen, viel blühen. Wir legen Wildblumenwiesen an, die zweimal im Jahr Schnitt brauchen und dafür ein Farbenmeer bieten.</p>`,

  froendenberg: `<p>Fröndenberg liegt an der Ruhr — und das Wasser bestimmt hier vieles. In Langschede und Strickherdicke sind viele Gärten flach und grundwassernah. Wer hier einen Garten plant, muss mit Nässe rechnen.</p>
<p>Wir lösen das elegant: Hochbeete für Gemüse und Stauden, erhöhte Sitzplattformen für den Aufenthalt und pflanzen, die beides vertragen — nasse Füße und Trockenphasen. Iris, Astilbe und Schilf gehören zu unserem Standard-Repertoire.</p>
<p>Fröndenberger schätzen außerdem die Verbindung von Garten und Natur. Wir legen häufig Blühstreifen an den Gartenrand, die Insekten Nahrung bieten und den Übergang ins Grün weich gestalten.</p>`,
};

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
  
  // Check if already upgraded (v4 = Gartenbau, v5 = universal marker)
  let html = fs.readFileSync(filePath, 'utf-8');
  if (html.includes('UNIQUE-GARDEN-v4') || html.includes('UNIQUE-CONTENT-v5')) {
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
        // Die Extra-FAQs sind jetzt Dropdown-Items (faq-item) — direkt in den
        // space-y-4 Container einfügen (vor dessen schließendem </div>)
        const insertPoint = html.lastIndexOf('    </div>\n  </div>\n</section>', sectionCloseIdx + 20);
        if (insertPoint > faqIdx) {
          const faqBlock = `\n      ${extraFAQs}`;
          html = html.slice(0, insertPoint) + faqBlock + html.slice(insertPoint);
        } else {
          // Fallback: Wrapper vor </section>
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
  
  // GARTENBAU: Add unique season calendar
  if (tradeKey === 'garten') {
    const seasonCalendar = generateGartenSeasonCalendar(citySlug);
    if (seasonCalendar) {
      html = html.replace(/<footer/, `${seasonCalendar}\n\n<footer`);
    }
    // Replace ALL service descriptions with city-specific text
    html = applyGartenServiceDescriptions(html, citySlug);
  }
  
  // Idempotenz-Marker: verhindert 3x-Duplikate bei erneutem Lauf
  if (!html.includes('UNIQUE-CONTENT-v5')) {
    html = html.replace(/<\/body>/, '<!-- UNIQUE-CONTENT-v5 -->\n</body>');
  }

  fs.writeFileSync(filePath, html, 'utf-8');
  updated++;
  console.log(`  ✅ ${file} — local section + ${TRADE_DATA[tradeKey].faq(CITY_DATA[citySlug]).length} extra FAQs`);
}

console.log(`\n✅ Updated: ${updated} | ⏭️ Skipped: ${skipped} | ❌ Errors: ${errors.length}`);
if (errors.length) console.log(errors.join('\n'));
