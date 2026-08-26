# fachschmiede.de — Projekt-Grundsätze

> **Diese Regeln sind nicht verhandelbar.** Jede Änderung an Landing Pages muss diese Prinzipien einhalten.

---

## 1. EINZIGARTIGER CONTENT PRO GEWERK & STADT (Anti-Duplicate-Content)

### Problem
Google straft Duplicate Content (DC) ab. Wenn 50 Städte den identischen Text haben, rankt keine Seite.

### Lösung
**Jede Landing Page hat eigenen Content in `landing_pages.content_json`:**

```json
{
  "hero_title": "Gartenpflege in Bergkamen – Ihr Partner für Grünflächen",
  "hero_subtitle": "Professionelle Garten- und Landschaftspflege aus einer Hand",
  "intro_text": "In Bergkamen und dem Kreis Recklinghausen...",
  "about_text": "Wir kennen die Böden im Ruhrgebiet...",
  "services_intro": "Unser Leistungsspektrum für Bergkamen:",
  "cta_banner_text": "Schnelle Hilfe für Bergkamen und Umgebung",
  "faq": [
    {"q": "Was kostet Gartenpflege in Bergkamen?", "a": "..."}
  ],
  "article_titles": [
    "5 Tipps für den pflegeleichten Garten in Bergkamen",
    "Hecke schneiden: Der beste Zeitpunkt im Ruhrgebiet"
  ]
}
```

### Regel
- **NEVER** generischen Platzhalter-Text verwenden ("Zuverlässig, Fair, Vor Ort")
- **ALWAYS** `content_json` aus der DB lesen
- **FALLBACK** nur bei fehlendem `content_json`: Gewerkespezifische Template-Texte (nicht identisch pro Stadt!)

---

## 2. GEWERKESPEZIFISCHE BILDER

### Problem
Gartenbau-Seite zeigt Dachdecker-Bild = verwirrend für User, schlecht für Conversion.

### Lösung
**Jedes Gewerk hat eigenes Hero-Bild und Team-Bild:**

| Gewerk | Hero-Bild | Team-Bild |
|--------|-----------|-----------|
| Dachdecker | `/images/dachdecker-hero.jpg` | `/images/dachdecker-team.jpg` |
| Elektriker | `/images/elektriker-hero.jpg` | `/images/elektriker-team.jpg` |
| Garten- & Landschaftsbau | `/images/garten-hero.jpg` | `/images/garten-team.jpg` |
| Bestatter | `/images/bestatter-hero.jpg` | `/images/bestatter-team.jpg` |

### Regel
- **NEVER** generisches `/images/hero.jpg` verwenden
- **ALWAYS** `/{trade-slug}-hero.jpg` oder `/{trade-slug}-team.jpg`
- **DB-Feld:** `trades.hero_image` speichert den Pfad

---

## 3. GEWERKESPEZIFISCHE LEISTUNGEN

### Regel
- Services kommen aus `trades.services[]`
- Jede Service-Beschreibung enthält den Stadtnamen
- NIEMALS identische Service-Texte für verschiedene Städte

---

## 4. LOKALE SEO-ANPASSUNGEN

### Pflichtfelder pro Seite
- `title`: `{Gewerk} {Stadt} | Professionelle {Leistungen} ab €149/Monat`
- `meta_description`: Enthält Stadt- und Gewerk-Name + Haupt-Keyword
- `h1`: Enthält Stadt- und Gewerk-Name
- `content_json`: Einzigartiger Text mit Stadt-Bezug

### Verboten
- Identische Titles für verschiedene Städte
- Identische Meta-Descriptions
- Generische Texte ohne Stadt-Bezug

---

## 5. TECHNISCHE ARCHITEKTUR

### Route: `app/[trade]/[city]/page.tsx`
- `dynamic = 'force-dynamic'` — SSR für aktuelle Daten
- Liest aus `landing_pages` + `trades` + `cities`
- Verwendet `content_json` für einzigartigen Content
- Fallback auf gewerkespezifische Templates (niemals generisch)

### Bilder
- Hero: `/{trade-slug}-hero.jpg`
- Team/About: `/{trade-slug}-team.jpg`
- Logo: Aus `trades.logo_url` oder generisch

---

## 6. CONTENT-GENERIERUNG (Automatisch)

### Monatlicher Artikel-Generator
- Generiert einzigartige Artikel pro Gewerk/Stadt
- Speichert in `articles` Tabelle
- Verwendet Kimi API mit Stadt- + Gewerk-Kontext

### Landing Page Content
- Kann manuell in `landing_pages.content_json` gepflegt werden
- Oder automatisch generiert werden (zukünftig)

---

## 7. CHECKLISTE: NEUE LANDING PAGE

- [ ] `trades` Eintrag mit `hero_image`, `team_image`, `services`
- [ ] `cities` Eintrag mit `name`, `state`
- [ ] `landing_pages` Eintrag mit `content_json` (einzigartiger Content!)
- [ ] Bilder hochgeladen: `/{trade-slug}-hero.jpg`, `/{trade-slug}-team.jpg`
- [ ] SEO-Daten geprüft: Title, Meta, H1 enthalten Stadt + Gewerk
- [ ] Kein Duplicate Content mit anderen Städten

---

**Letzte Aktualisierung:** 2026-08-26
**Verantwortlich:** Finn (AI) + Dieter (Product)
