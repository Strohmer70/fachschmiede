#!/usr/bin/env python3
"""
Generator für Garten und Landschaftsbau Stadt-Seiten
Erstellt alle 21 stadt-garten-<stadt>.html Dateien
"""

import os

CITIES = [
    ("bergkamen", "Bergkamen"),
    ("bochum", "Bochum"),
    ("castrop-rauxel", "Castrop-Rauxel"),
    ("dortmund", "Dortmund"),
    ("ennepetal", "Ennepetal"),
    ("froendenberg", "Fröndenberg"),
    ("gevelsberg", "Gevelsberg"),
    ("hagen", "Hagen"),
    ("hattingen", "Hattingen"),
    ("herne", "Herne"),
    ("holzwickede", "Holzwickede"),
    ("iserlohn", "Iserlohn"),
    ("kamen", "Kamen"),
    ("luenen", "Lünen"),
    ("muenchen", "München"),
    ("schwelm", "Schwelm"),
    ("schwerte", "Schwerte"),
    ("sprockhoevel", "Sprockhövel"),
    ("unna", "Unna"),
    ("wetter-ruhr", "Wetter (Ruhr)"),
    ("witten", "Witten"),
]

# Lies die Dachdecker-Herne Vorlage
with open("stadt-dach-herne.html", "r", encoding="utf-8") as f:
    template = f.read()

def make_garten_page(slug, name):
    content = template
    
    # === METADATEN & TITEL ===
    content = content.replace(
        "Dachdecker Herne | Miet-Website zum Anmieten – DEMO",
        f"Garten und Landschaftsbau {name} | Miet-Website – DEMO"
    )
    content = content.replace(
        'content="Miet-Website (Demo): Dachdecker Herne',
        f'content="Miet-Website (Demo): Garten und Landschaftsbau {name}'
    )
    content = content.replace(
        "Dachsanierung, Reparatur, Dämmung & Notdienst",
        "Gartengestaltung, Pflege, Rasen & Baumfällung"
    )
    
    # === NAVIGATION ===
    # Gewerk-Links
    content = content.replace('>🏠 Gewerk Dachdecker<', '>🌳 Gewerk Garten<')
    content = content.replace('href="/sales-dachdecker.html"', 'href="/sales-garten-und-landschaftsbau.html"')
    content = content.replace('href="/index.html"', 'href="/garten-und-landschaftsbau.html"')
    content = content.replace('Musterseite Dachdecker', 'Musterseite Garten')
    content = content.replace('Blog Dachdecker', 'Blog Garten')
    content = content.replace('Blog Elektriker', 'Blog Garten')
    content = content.replace('Blog SHK', 'Blog Garten')
    content = content.replace('Blog Zimmerer', 'Blog Garten')
    content = content.replace('Blog Maler', 'Blog Garten')
    
    # === HEADER ===
    content = content.replace(
        '<span class="block font-extrabold text-lg text-ink-900">Dachdecker Herne</span>',
        f'<span class="block font-extrabold text-lg text-ink-900">Garten {name}</span>'
    )
    content = content.replace(
        'href="/sales-dachdecker.html?stadt=herne"',
        f'href="/sales-garten-und-landschaftsbau.html?stadt={slug}"'
    )
    content = content.replace('Diese Seite mieten</a>', 'Diese Seite mieten</a>')
    
    # === HERO ===
    content = content.replace(
        '<span class="w-2 h-2 rounded-full bg-green-400"></span> Dachdecker in Herne – kostenlose Besichtigung',
        f'<span class="w-2 h-2 rounded-full bg-green-400"></span> Gartenbauer in {name} – kostenlose Beratung'
    )
    content = content.replace(
        'Dachdecker in Herne.<br>\n        <span class="text-brand-400">Festpreis. Feste Termine.</span>',
        f'Gartenbau in {name}.<br>\n        <span class="text-brand-400">Ihr Traumgarten. Unsere Leidenschaft.</span>'
    )
    content = content.replace(
        'Sturm, Regen und die typische Wetterlage zwischen Ruhr und Sauerland setzen jedem Dach zu – in Herne ganz besonders. Genau hier sind wir im Einsatz: Wir sanieren, reparieren und dämmen Dächer aller Baujahre und begleiten Sie von der ersten Besichtigung bis zur sauberen Übergabe. Unser Versprechen: ein Festpreis-Angebot, ein fester Ansprechpartner und ein Ergebnis, das Jahrzehnte hält.',
        f'Ob kleiner Vorgarten, großzügige Gartenanlage oder pflegeleichter Firmengarten – in {name} und Umgebung verwandeln wir Ihre grüne Oase in einen Ort zum Wohlfühlen. Von der ersten Beratung bis zur fertigen Anlage begleiten wir Sie professionell und zuverlässig. Unser Versprechen: transparente Kosten, fachgerechte Ausführung und ein Garten, der Freude macht.'
    )
    content = content.replace(
        'Kostenlose Besichtigung anfragen',
        'Kostenlose Beratung anfragen'
    )
    
    # === VERFÜGBARKEITS-BANNER ===
    content = content.replace(
        'Dachdecker Herne',
        f'Garten und Landschaftsbau {name}'
    )
    content = content.replace(
        'Sie steht heute neutral im Netz und kann sofort angemietet werden: Dein Firmenname, deine Kontaktdaten, deine Leistungen – fertig individualisiert in wenigen Minuten. Alle Texte auf dieser Seite sind für <strong>Herne</strong> individuell formuliert',
        f'Sie steht heute neutral im Netz und kann sofort angemietet werden: Dein Firmenname, deine Kontaktdaten, deine Leistungen – fertig individualisiert in wenigen Minuten. Alle Texte auf dieser Seite sind für <strong>{name}</strong> individuell formuliert'
    )
    content = content.replace(
        'href="/sales-dachdecker.html?stadt=herne"',
        f'href="/sales-garten-und-landschaftsbau.html?stadt={slug}"'
    )
    content = content.replace(
        'Jetzt für Herne sichern →',
        f'Jetzt für {name} sichern →'
    )
    
    # === LEISTUNGEN ===
    content = content.replace(
        'Alles rund ums Thema Dach in Herne',
        f'Alles rund ums Thema Garten in {name}'
    )
    content = content.replace(
        'Dachsanierung, Dachreparatur, Dachdämmung, Flachdach und Sturm-Notdienst – mit kostenloser Besichtigung und Festpreis-Angebot.',
        'Gartengestaltung, Rasenpflege, Baumfällung, Teichbau und Gartenpflege – mit kostenloser Beratung und transparentem Angebot.'
    )
    
    # Service-Boxen
    content = content.replace('🏠</span>\n        <h3 class="mt-4 text-lg font-bold text-ink-900">Dachsanierung</h3>\n        <p class="mt-2 text-ink-600 text-sm leading-relaxed">Komplettsanierung vom Sparren bis zum Ziegel – inklusive Unterspannbahn, Lattung und Eindeckung. Auf Wunsch direkt mit Dämmung und Solar-Vorbereitung.</p>', '🌳</span>\n        <h3 class="mt-4 text-lg font-bold text-ink-900">Gartengestaltung</h3>\n        <p class="mt-2 text-ink-600 text-sm leading-relaxed">Individuelle Gartenplanung und -umsetzung: Beete, Wege, Sitzplätze und mehr. Wir gestalten Ihren Garten nach Ihren Wünschen und dem vorhandenen Gelände.</p>')
    content = content.replace('🔧</span>\n        <h3 class="mt-4 text-lg font-bold text-ink-900">Dachreparatur</h3>\n        <p class="mt-2 text-ink-600 text-sm leading-relaxed">Lose Ziegel, undichte Kehlen, defekte Rinnen: Wir beheben Schäden schnell und dauerhaft – inklusive Ursachenanalyse statt Kosmetik.</p>', '✂️</span>\n        <h3 class="mt-4 text-lg font-bold text-ink-900">Baumfällung & Pflege</h3>\n        <p class="mt-2 text-ink-600 text-sm leading-relaxed">Fachgerechte Baumfällung, Kronenpflege und Heckenschnitt. Sicher, sauber und mit professioneller Entsorgung des Grünschnitts.</p>')
    content = content.replace('🌡️</span>\n        <h3 class="mt-4 text-lg font-bold text-ink-900">Dachdämmung</h3>\n        <p class="mt-2 text-ink-600 text-sm leading-relaxed">Auf-, Zwischen- oder Untersparrendämmung nach EnEV/GEG. Wir beraten zu Förderung und bringen Ihr Dach auf heutigen Energiestandard.</p>', '🌱</span>\n        <h3 class="mt-4 text-lg font-bold text-ink-900">Rasen & Bepflanzung</h3>\n        <p class="mt-2 text-ink-600 text-sm leading-relaxed">Rollrasen-Verlegung, Saatgut-Auswahl, Blumenbeete und Staudenpflanzung. Wir sorgen für grüne Flächen, die das ganze Jahr über schön aussehen.</p>')
    content = content.replace('▭</span>\n        <h3 class="mt-4 text-lg font-bold text-ink-900">Flachdach</h3>\n        <p class="mt-2 text-ink-600 text-sm leading-relaxed">Abdichtung und Sanierung von Flachdächern – Garage, Anbau oder Gewerbehalle. Mit mehrschichtiger Sicherung und langer Gewährleistung.</p>', '💧</span>\n        <h3 class="mt-4 text-lg font-bold text-ink-900">Teichbau & Bewässerung</h3>\n        <p class="mt-2 text-ink-600 text-sm leading-relaxed">Gartenteiche, Wasserspiele und automatische Bewässerungssysteme. Wir planen und bauen Ihre Wasserlandschaft fachgerecht und dicht.</p>')
    content = content.replace('☀️</span>\n        <h3 class="mt-4 text-lg font-bold text-ink-900">Solar-Vorbereitung</h3>\n        <p class="mt-2 text-ink-600 text-sm leading-relaxed">Wir machen Ihr Dach fit für Photovoltaik: tragfähige Konstruktion, Dachhaken, Leerrohre – sauber abgestimmt mit dem Solarteur.</p>', '🏡</span>\n        <h3 class="mt-4 text-lg font-bold text-ink-900">Gartenpflege & Unterhalt</h3>\n        <p class="mt-2 text-ink-600 text-sm leading-relaxed">Regelmäßige Pflege, saisonale Arbeiten, Unkrautbekämpfung und Düngung. Wir halten Ihren Garten das ganze Jahr über in Form.</p>')
    content = content.replace('⚠️</span>\n        <h3 class="mt-4 text-lg font-bold text-ink-900">Sturm- & Notdienst</h3>\n        <p class="mt-2 text-ink-600 text-sm leading-relaxed">Sturmschaden? Wir sichern schnell ab, dokumentieren für die Versicherung und reparieren zuverlässig – auch am Wochenende erreichbar.</p>', '🍂</span>\n        <h3 class="mt-4 text-lg font-bold text-ink-900">Herbst- & Winterdienst</h3>\n        <p class="mt-2 text-ink-600 text-sm leading-relaxed">Laubentfernung, Wintervorbereitung, Schneeräumung und Eisfrei-Strategien. Wir sorgen dafür, dass Ihr Garten auch in der kalten Jahreszeit gut aussieht.</p>')
    
    # === ÜBER UNS ===
    content = content.replace(
        '<p class="text-4xl font-black text-brand-400">Herne</p>',
        f'<p class="text-4xl font-black text-brand-400">{name}</p>'
    )
    content = content.replace(
        'Ein Betrieb, auf den Sie sich verlassen können',
        'Ihr Partner für Grünflächen und Gärten'
    )
    content = content.replace(
        'Ein Dachdeckerbetrieb aus Herne, auf den Sie sich verlassen können. Wir kennen die Dächer in der Region – vom Fachwerkhaus bis zum Neubau.',
        f'Ein Gartenbau-Betrieb aus {name}, der weiß, was im Grünen zählt. Wir kennen die Böden, das Klima und die Anforderungen der Region.'
    )
    content = content.replace(
        'Wir wissen, welche Materialien sich in Herne bewähren und worauf es bei den typischen Wetterlagen ankommt.',
        f'Wir wissen, welche Pflanzen in {name} gedeihen und wie wir Ihren Garten optimal auf die örtlichen Bedingungen abstimmen.'
    )
    content = content.replace(
        'Lernen Sie uns kennen – kostenlose Erstberatung',
        'Lernen Sie uns kennen – kostenlose Gartenberatung'
    )
    
    # === RATGEBER ===
    content = content.replace(
        'Aktuelle Artikel für Herne',
        f'Aktuelle Artikel für {name}'
    )
    content = content.replace(
        'href="/dachdecker/herne/blog/"',
        f'href="/garten-und-landschaftsbau/{slug}/blog/"'
    )
    content = content.replace(
        'Praxisnahe Ratgeber für Eigentümer in Herne',
        f'Praxisnahe Ratgeber für Gartenbesitzer in {name}'
    )
    
    # Blog-Artikel
    content = content.replace('Dachdecker · Herne', f'Garten · {name}')
    content = content.replace(
        'href="/blog/dachdecker/herne/sturmschaden-dach.html"',
        f'href="/blog/garten-und-landschaftsbau/{slug}/gartengestaltung-planen.html"'
    )
    content = content.replace(
        'Sturmschaden am Dach: Was Sie sofort tun sollten',
        'Gartengestaltung: Von der Idee zum Traumgarten'
    )
    content = content.replace(
        'href="/blog/dachdecker/herne/5-anzeichen-dachsanierung.html"',
        f'href="/blog/garten-und-landschaftsbau/{slug}/rasen-pflegen.html"'
    )
    content = content.replace(
        '5 Anzeichen, dass Ihr Dach saniert werden muss',
        'Rasenpflege im Frühling: Der perfekte Start'
    )
    content = content.replace(
        'href="/blog/dachdecker/herne/dachdaemmung-foerderung.html"',
        f'href="/blog/garten-und-landschaftsbau/{slug}/baumfällung-sicherheit.html"'
    )
    content = content.replace(
        'Dachdämmung fördern lassen: Diese Zuschüsse gibt es',
        'Baumfällung: Sicherheit und Rechtliches'
    )
    
    # === FAQ ===
    content = content.replace(
        'Das fragen Kunden aus Herne',
        f'Das fragen Kunden aus {name}'
    )
    content = content.replace(
        'Bauen Sie auch Dächer für PV-Anlagen vor?',
        'Können Sie auch kleine Gärten gestalten?'
    )
    content = content.replace(
        'Ja. Wir verstärken tragende Bereiche, setzen Dachhaken und Unterspannbahn solartechnik-gerecht und stimmen uns mit Ihrem Solarteur ab – oder bringen Partnerbetriebe aus der Region mit.',
        'Absolut. Egal ob Balkon, kleiner Hinterhof oder Dachterrasse – wir finden für jeden Raum die passende Lösung und machen aus wenig Fläche viel Grün.'
    )
    content = content.replace(
        'Was kostet die Reparatur einer undichten Stelle?',
        'Was kostet eine Gartengestaltung?'
    )
    content = content.replace(
        'Kleinreparaturen beginnen meist im dreistelligen Bereich. Wichtig ist die Ursache: Wir reparieren nicht nur die Stelle, sondern beheben den Grund – sonst kommt der Schaden wieder.',
        'Das hängt von Größe und Umfang ab. Eine erste Beratung ist bei uns kostenlos – danach erhalten Sie ein transparentes Angebot ohne versteckte Kosten.'
    )
    content = content.replace(
        'Sind Sie auch nach dem Projekt erreichbar?',
        'Bieten Sie auch regelmäßige Gartenpflege an?'
    )
    content = content.replace(
        'Selbstverständlich. Wir geben Gewährleistung nach BGB und bleiben Ihr Ansprechpartner – auch für Wartung und regelmäßige Dachinspektionen.',
        'Ja, das ist sogar einer unserer Schwerpunkte. Viele Kunden buchen uns für saisonale Pflegearbeiten oder jährliche Garten-Checks.'
    )
    content = content.replace(
        'Arbeiten Sie auch im Winter?',
        'Wann ist die beste Jahreszeit für Gartenumgestaltung?'
    )
    content = content.replace(
        'Ja. Viele Arbeiten sind ganzjährig möglich; wetterabhängige Gewerke planen wir in Trockenperioden. Notdienst-Reparaturen machen wir bei jedem Wetter.',
        'Herbst und Frühling sind ideal für größere Umgestaltungen. Pflanzarbeiten machen wir je nach Art von Frühjahr bis Herbst – wir beraten Sie gerne zum besten Zeitpunkt.'
    )
    
    # === CTA-BANNER ===
    content = content.replace(
        'Sturmschaden? Wir helfen schnell.',
        'Gartenprojekt? Wir beraten kostenlos.'
    )
    content = content.replace(
        'Schnelle Hilfe für Herne und Umgebung – rufen Sie uns einfach an.',
        f'Professionelle Beratung für {name} und Umgebung – rufen Sie uns einfach an.'
    )
    
    # === KONTAKT ===
    content = content.replace(
        'Kostenlose Besichtigung in Herne anfragen',
        f'Kostenlose Gartenberatung in {name} anfragen'
    )
    content = content.replace(
        'Beschreiben Sie kurz Ihr Anliegen – Sie erhalten zeitnah einen Terminvorschlag und danach ein schriftliches Festpreis-Angebot.',
        'Beschreiben Sie kurz Ihr Vorhaben – Sie erhalten zeitnah einen Terminvorschlag und danach ein transparentes Angebot.'
    )
    content = content.replace(
        'Dachdecker aus Herne oder Umgebung?',
        f'Gartenbauer aus {name} oder Umgebung?'
    )
    content = content.replace(
        'href="/sales-dachdecker.html?stadt=herne"',
        f'href="/sales-garten-und-landschaftsbau.html?stadt={slug}"'
    )
    
    # Formular-Optionen
    content = content.replace(
        '<option>Dachsanierung</option><option>Dachreparatur</option><option>Dachdämmung</option><option>Flachdach</option><option>Solar-Vorbereitung</option><option>Sturm- & Notdienst</option>',
        '<option>Gartengestaltung</option><option>Rasen & Bepflanzung</option><option>Baumfällung</option><option>Teichbau</option><option>Gartenpflege</option><option>Herbst-/Winterdienst</option>'
    )
    
    # Karte
    content = content.replace(
        'Einsatzgebiet Herne',
        f'Einsatzgebiet {name}'
    )
    content = content.replace(
        'src="https://www.google.com/maps?q=Herne&z=12&output=embed"',
        f'src="https://www.google.com/maps?q={name}&z=12&output=embed"'
    )
    
    # === FOOTER ===
    content = content.replace(
        '<span class="block font-extrabold text-white">Dachdecker Herne</span>',
        f'<span class="block font-extrabold text-white">Garten {name}</span>'
    )
    content = content.replace(
        'Dachdecker Herne – Dachsanierung, Reparatur, Dämmung & Notdienst – Ruhrgebiet, zwischen Bochum und Gelsenkirchen.',
        f'Garten und Landschaftsbau {name} – Gartengestaltung, Pflege & Baumfällung – Ruhrgebiet und Umgebung.'
    )
    
    # Footer-Leistungen
    content = content.replace(
        '<li><a href="#leistungen" class="hover:text-brand-400 transition">Dachsanierung</a></li><li><a href="#leistungen" class="hover:text-brand-400 transition">Dachreparatur</a></li><li><a href="#leistungen" class="hover:text-brand-400 transition">Dachdämmung</a></li><li><a href="#leistungen" class="hover:text-brand-400 transition">Flachdach</a></li><li><a href="#leistungen" class="hover:text-brand-400 transition">Solar-Vorbereitung</a></li><li><a href="#leistungen" class="hover:text-brand-400 transition">Sturm- & Notdienst</a></li>',
        '<li><a href="#leistungen" class="hover:text-brand-400 transition">Gartengestaltung</a></li><li><a href="#leistungen" class="hover:text-brand-400 transition">Rasen & Bepflanzung</a></li><li><a href="#leistungen" class="hover:text-brand-400 transition">Baumfällung</a></li><li><a href="#leistungen" class="hover:text-brand-400 transition">Teichbau</a></li><li><a href="#leistungen" class="hover:text-brand-400 transition">Gartenpflege</a></li><li><a href="#leistungen" class="hover:text-brand-400 transition">Herbst-/Winterdienst</a></li>'
    )
    
    content = content.replace(
        'href="/sales-dachdecker.html?stadt=herne"',
        f'href="/sales-garten-und-landschaftsbau.html?stadt={slug}"'
    )
    content = content.replace(
        'href="/dachdecker/herne/blog/"',
        f'href="/garten-und-landschaftsbau/{slug}/blog/"'
    )
    
    content = content.replace(
        'dachdecker-herne-muster.de',
        f'garten-{slug}-muster.de'
    )
    
    # === DEMO-MIETE SCRIPT ===
    content = content.replace(
        "'stadt-' + m.gkey + '-' + m.slug + '.html'",
        "'stadt-' + m.gkey + '-' + m.slug + '.html'"
    )
    # gkey für garten ist "garten"
    
    # === DATEINAME & URL in der Seite selbst ===
    # Ersetze Herne durch Stadtname (vorsichtig, nicht alles)
    # Die meisten "Herne" sind bereits oben ersetzt
    
    return content

# Generiere alle Seiten
output_dir = "."
os.makedirs(output_dir, exist_ok=True)

for slug, name in CITIES:
    filename = f"stadt-garten-{slug}.html"
    filepath = os.path.join(output_dir, filename)
    
    page_content = make_garten_page(slug, name)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(page_content)
    
    print(f"✅ {filename} erstellt")

print(f"\n🔥 {len(CITIES)} Stadt-Seiten für Garten und Landschaftsbau generiert!")
