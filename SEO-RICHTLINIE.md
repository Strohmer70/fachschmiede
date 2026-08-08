# SEO-Richtlinie für fachschmiede.de Artikel

> **Verbindlich für alle Artikel — keine Ausnahmen**

## 1. Länge: 1.000–1.500 Wörter

| Abschnitt | Ziel-Wörter | Inhalt |
|-----------|-------------|--------|
| Einleitung | ~150 | Haken setzen, Problem beschreiben, Stadt nennen |
| H2: Warum ist das wichtig? | ~200 | Relevanz für die Region (Klima, Bausubstanz, Förderung) |
| H2: Die 5 wichtigsten Punkte | ~300 | 5 Bullet Points mit Erklärung, regional bezogen |
| H2: Was kostet es in [Stadt]? | ~200 | Konkrete Preise, Kostenfaktoren, Förderung |
| H2: FAQ | ~200 | 4–5 Fragen mit ausführlichen Antworten |
| H2: Fazit + CTA | ~150 | Zusammenfassung + Call-to-Action |
| **Gesamt** | **1.200–1.500** | |

## 2. Interne Links (3–5 pro Artikel)

- Links zu **anderen Artikeln derselben Stadt** (z. B. Sturmschaden → Dachsanierung)
- Link zur **Haupt-Landingpage** der Stadt (`/[gewerk]/[stadt]/`)
- Link zur **Kontaktseite** oder Anfrage-Formular

## 3. Bilder

- **Quelle:** Unsplash (kostenlos, lizenzfrei)
- **Anzahl:** 1–2 Bilder pro Artikel
- **Alt-Text:** Keyword + Stadt, z. B. "Dachdämmung in Hattingen - Förderung und Kosten 2026"
- **Bildunterschrift:** Mit Stadt-Bezug, z. B. "Moderne Dachdämmung in Hattingen und dem Ruhrgebiet"

## 4. Strukturierte Daten (Schema.org)

Jeder Artikel MUSS enthalten:

### 4.1 Article Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "...",
  "description": "...",
  "image": "...",
  "datePublished": "...",
  "author": { "@type": "Organization", "name": "..." },
  "publisher": { "@type": "Organization", "name": "fachschmiede.de" }
}
```

### 4.2 FAQPage Schema
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Frage?",
      "acceptedAnswer": { "@type": "Answer", "text": "Antwort" }
    }
  ]
}
```

### 4.3 HowTo Schema
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "...",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Schritt-Name",
      "text": "Schritt-Beschreibung"
    }
  ]
}
```

## 5. Meta-Tags

Jeder Artikel benötigt:
- `<title>` mit Keyword + Stadt
- `<meta name="description">` mit USPs (✓ Checkmarks)
- `<link rel="canonical">`
- OG-Tags (Open Graph)
- Twitter Card Tags

## 6. CTA (Call-to-Action)

Am Ende jedes Artikels:
- Gelbe Box mit Kontrastfarbe
- Button: "Kostenloses Angebot anfordern"
- Link zur Kontaktseite der Stadt

---

**Erstellt:** 2026-08-08
**Gilt für:** Alle bestehenden und zukünftigen Artikel
**Verantwortlich:** Finn (AI-Partner)
