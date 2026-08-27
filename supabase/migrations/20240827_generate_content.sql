-- Content Migration SQL
-- Ausführen im Supabase SQL Editor

-- dachdecker - Hattingen
UPDATE pages SET content_json = '{"hero_title":"Dachdecker in Hattingen. Festpreis. Feste Termine.","hero_subtitle":"Ein Dach zeigt seine Schwächen meist erst, wenn es zu spät ist – undichte Stellen, lose Ziegel, verstopfte Rinnen. In Hattingen schauen wir uns Ihr Dach kostenlos an und sagen Ihnen ehrlich, was nötig ist und was warten kann.","faq":[{"q":"Was kostet eine Dachreparatur in Hattingen?","a":"Die Kosten hängen vom Umfang der Schäden ab. Nach der kostenlosen Besichtigung erhalten Sie einen verbindlichen Festpreis – ohne versteckte Kosten."},{"q":"Wie lange dauert eine Dachsanierung?","a":"Die Dauer hängt vom Projekt ab. Eine typische Sanierung dauert zwischen einer Woche und drei Wochen."},{"q":"Gibt es eine Garantie auf Dacharbeiten?","a":"Ja, wir gewährleisten auf alle Dacharbeiten eine umfassende Garantie."},{"q":"Bieten Sie kostenlose Besichtigungen an?","a":"Ja, wir bieten eine kostenlose und unverbindliche Erstbesichtigung vor Ort an."}]}'
WHERE slug LIKE 'dachdecker-%';

-- elektriker - Bochum
UPDATE pages SET content_json = '{"hero_title":"Elektriker in Bochum. Sicher. Kompetent. Vor Ort.","hero_subtitle":"Ob Stromausfall, neue Elektroinstallation oder Smart-Home-Umstellung – in Bochum sind wir Ihr zuverlässiger Partner für alle elektrischen Arbeiten. Kostenlose Erstberatung vor Ort.","faq":[{"q":"Was kostet eine Elektroinstallation in Bochum?","a":"Die Kosten hängen vom Umfang ab. Wir erstellen Ihnen ein kostenloses Angebot vor Ort."},{"q":"Wie schnell sind Sie bei einem Stromausfall vor Ort?","a":"Bei Notfällen sind wir in der Regel innerhalb von 1-2 Stunden in Bochum vor Ort."},{"q":"Erhalten Sie auch Elektro-Gutachten?","a":"Ja, wir erstellen Elektro-Gutachten für Versicherungen und Behörden."},{"q":"Sind Sie für Smart-Home-Installationen zertifiziert?","a":"Ja, wir sind auf Smart-Home-Systeme spezialisiert und beraten Sie gerne kostenlos."}]}'
WHERE slug LIKE 'elektriker-%';

-- klempner - Dortmund
UPDATE pages SET content_json = '{"hero_title":"Klempner in Dortmund. Schnell. Sauber. Fair.","hero_subtitle":"Rohrbruch, Heizungsausfall oder neue Sanitärinstallation – in Dortmund sind wir Ihr zuverlässiger Klempner. 24h-Notdienst, transparente Preise, feste Termine.","faq":[{"q":"Was kostet ein Klempner in Dortmund?","a":"Wir berechnen transparente Festpreise. Nach der kostenlosen Besichtigung erhalten Sie ein verbindliches Angebot."},{"q":"Bieten Sie einen 24h-Notdienst an?","a":"Ja, unser Notdienst ist rund um die Uhr für Sie da – auch an Wochenenden und Feiertagen."},{"q":"Wie lange dauert eine Heizungsinstallation?","a":"Eine komplette Heizungsinstallation dauert in der Regel 1-3 Tage, je nach Umfang."},{"q":"Reparieren Sie auch Rohrbrüche?","a":"Ja, Rohrbrüche gehören zu unseren Kernkompetenzen. Wir finden die Leckage und reparieren sie fachgerecht."}]}'
WHERE slug LIKE 'klempner-%';

-- maler - Hagen
UPDATE pages SET content_json = '{"hero_title":"Maler in Hagen. Farbe, die hält.","hero_subtitle":"Ob Neuanstrich, Renovierung oder kreative Wandgestaltung – in Hagen bringen wir Farbe in Ihr Leben. Kostenlose Beratung, Festpreis-Garantie, saubere Arbeit.","faq":[{"q":"Was kostet ein Maler in Hagen?","a":"Die Kosten hängen von der Fläche und den Anforderungen ab. Wir erstellen Ihnen ein kostenloses Angebot vor Ort."},{"q":"Wie lange dauert ein Raum streichen?","a":"Ein durchschnittlicher Raum (20m²) dauert etwa 1-2 Tage inklusive Trocknungszeit."},{"q":"Verwenden Sie ökologische Farben?","a":"Ja, wir bieten eine große Auswahl an umweltfreundlichen und lösemittelfreien Farben an."},{"q":"Übernehmen Sie auch Tapezierarbeiten?","a":"Ja, wir sind auch auf Tapezierarbeiten spezialisiert – von Vliestapete bis zu exklusiven Designer-Tapeten."}]}'
WHERE slug LIKE 'maler-%';

-- zimmerer - Herne
UPDATE pages SET content_json = '{"hero_title":"Zimmerer in Herne. Solide. Traditionell. Innovativ.","hero_subtitle":"Vom Carport bis zur Dachkonstruktion – in Herne realisieren wir Ihre Holzprojekte mit Handwerkskunst und moderner Technik. Kostenlose Beratung vor Ort.","faq":[{"q":"Was kostet ein Carport in Herne?","a":"Die Kosten hängen von Größe und Material ab. Wir erstellen Ihnen ein kostenloses Angebot mit Festpreis-Garantie."},{"q":"Wie lange hält eine Holzkonstruktion?","a":"Mit fachgerechter Behandlung halten unsere Holzkonstruktionen 30-50 Jahre und länger."},{"q":"Arbeiten Sie auch mit Fichtenholz?","a":"Ja, wir verarbeiten alle gängigen Holzarten – von Fichte über Lärche bis zur Eiche."},{"q":"Bieten Sie auch Reparaturen an?","a":"Ja, wir reparieren und sanieren bestehende Holzkonstruktionen fachgerecht."}]}'
WHERE slug LIKE 'zimmerer-%';

-- Verifizierung
SELECT slug, content_json->>'hero_title' as hero_title FROM pages WHERE content_json IS NOT NULL LIMIT 5;
