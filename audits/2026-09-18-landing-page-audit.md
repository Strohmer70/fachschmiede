# Landing Page Audit — fachschmiede.de (2026-09-18)

## Scope
- **NEW pages:** `public/{gewerk}/{stadt}.html` — 100 pages (5 trades × 20 cities), sampled 10 (2/trade, distinct cities)
- **OLD pages:** `public/stadt-*.html` — 126 pages (6 trades × 21 cities incl. Zimmerer), sample: `stadt-dach-bochum.html`
- Generator of current new pages: `scripts/auto-sync.js` (simple template). NOTE: `scripts/generate-pages.js` (richer template w/ LocalBusiness JSON-LD, FAQ, testimonials) exists but its output is NOT what's on disk.

---

## NEW pages — audit results (all 10 samples identical in structure)

| # | Check | Result | Detail |
|---|-------|--------|--------|
| 1 | Images | ❌ **NONE** | 0 `<img>` tags, 0 background-image on ALL 10 pages. Meanwhile `/images/` has 15+ ready assets (hero-{dach,elektro,maler,shk,zimmerer}.jpg, team-*.jpg, projekt-*.jpg) sitting unused |
| 2 | Über uns | ❌ **NO** | No about section whatsoever |
| 3 | Footer | ⚠️ **PARTIAL** | `<footer>` exists but contains ONLY "© 2026 fachschmiede.de" — **no Impressum link, no Datenschutz link** (legal compliance risk!) |
| 4 | JSON-LD | ❌ **ZERO** | No structured data at all (no LocalBusiness, no FAQ schema, no Breadcrumb) |
| 5 | Rental CTA | ❌ **NO** | No "Jetzt mieten" anywhere. Only lead-gen CTA "Kostenlose {Trade}-Inspektion anfragen" → anchors to #kontakt → mailto. Pure lead-gen page, no rental funnel |
| 6 | Unique content | ❌ **100% TEMPLATE** | Body text is **byte-identical after city-name normalization** within each trade (verified programmatically for all 5 trades Bochum vs Dortmund). All 6 service cards per page carry the same sentence: "Fachgerechte Ausführung in {City} und Umgebung. Qualität garantiert." Meta description = one template with {Trade} + {City} swapped. Massive duplicate-content risk for SEO |
| 7 | Contact | ❌ **mailto only** | 0 forms. Single `mailto:hello@fachschmiede.de` button |
| 8 | Article links | ❌ **ZERO** | No links to /artikel-*.html, /blog/, or /ratgeber-*.html — despite 14+ articles existing in public/ root |
| 9 | Broken links | ❌ **YES** | Every page's portal nav links to **`/start.html` which does not exist** (404). Verified on all 10 samples |
| 10 | Depth | ❌ **VERY THIN** | **121–133 words**, 2 sections, 2 H2s, ~4.6 KB per page. Structure: hero → 6 service cards → mailto contact. That's it |

**New page anatomy (dachdecker/bochum.html, complete):**
- H1 "Dachdecker in Bochum", 1 hero sentence, 1 CTA button
- H2 "Unsere Leistungen" + 6 identical-description cards
- H2 "Kontaktieren Sie uns" + mailto button
- Footer: copyright line only

---

## OLD pages (stadt-dach-bochum.html) — comparison

| # | Feature | OLD page | NEW page |
|---|---------|----------|----------|
| 1 | Images | ✅ 2 imgs (hero.jpg, team.jpg) | ❌ none |
| 2 | Über uns | ✅ `id="ueber-uns"` section w/ team image | ❌ none |
| 3 | Footer | ✅ Impressum + Datenschutz links | ❌ copyright only |
| 4 | JSON-LD | ❌ none (old pages also lack it) | ❌ none |
| 5 | Rental CTA | ⚠️ demo-style text ("kann sofort angemietet werden… Pro Stadt nur einmal") + lead form | ❌ lead-gen only |
| 6 | Unique content | ✅ ~941–1220 words, city-customized copy ("Alle Texte auf dieser Seite sind für Bochum individuell formuliert") | ❌ 121–133 words template |
| 7 | Contact | ✅ Real `<form>` (Name/Email/Nachricht, JS success state) | ❌ mailto only |
| 8 | Articles | ✅ 6 blog links + 1 ratgeber link | ❌ none |
| 9 | Broken links | ⚠️ `/dachdecker/bochum/blog/` → 404 (blog dir doesn't exist); also `/start.html` | ❌ `/start.html` → 404 |
| 10 | Depth | ✅ 8 sections, 5 H2s, 40–44 KB, ~1200 words | ❌ 2 sections, 4.6 KB |

Old page sections: hero → rental-explanation banner → Leistungen → Über uns → Ratgeber/Artikel → FAQ → CTA banner → contact form.

---

## Key findings

1. **The new 100-page set is a skeleton, not a product.** Compared to the old hand-built pages (which the customer-facing demo still shows), the auto-generated pages lost: images, about section, legal footer links, contact form, article integration, FAQ, unique copy, and ~90% of the word count (1200 → 125 words).

2. **Legal exposure:** No Impressum/Datenschutz links in footers of 100 public commercial pages — this is mandatory in Germany (§ 5 DDG/TMG, DSGVO). Highest-priority fix.

3. **SEO non-starter in current state:** 100 near-duplicate 125-word pages = classic thin/duplicate content. Google will either ignore or penalize the cluster. The unique-content generator (`generate-pages.js` w/ landmarks, testimonials, FAQ, LocalBusiness schema) exists in scripts/ but was never applied to disk — its output would be a big step up.

4. **Broken portal nav sitewide:** `/start.html` (linked from all 100+ pages) is a 404. Old pages additionally link `/dachdecker/bochum/blog/` which doesn't exist.

5. **No rental conversion path on new pages:** The business model is "rent the city page," but new pages have zero "Jetzt mieten" CTA, no price anchor, no Stripe link — they only collect generic leads via mailto.

6. **Unused assets:** /images/ already contains per-trade hero/team/project photos (hero-elektro.jpg, team-shk.jpg, etc.) — the new template simply doesn't reference them.

7. **Nav leaks admin panel:** Portal nav on all public pages links `/admin.html` (publicly accessible admin page) — should be noindexed/removed from public nav.

8. **Trade coverage regression:** Old set covered 6 trades (incl. Zimmerer) × 21 cities = 126; new set covers 5 × 20 = 100. Zimmerer pages only exist as old stadt-* files.

## Recommended fix priority
1. Footer: add Impressum + Datenschutz links (legal) — trivial template fix, 100 pages
2. Fix or remove `/start.html` nav link (sitewide 404)
3. Inject per-trade hero images from existing /images/ assets
4. Re-run/upgrade content generator: apply `generate-pages.js`-level content (unique intro, FAQ, testimonials, LocalBusiness JSON-LD) — ideally AI-per-city via the existing monthly-generator infrastructure
5. Add contact form (old template has working one to copy)
6. Add "Jetzt mieten" CTA + article/ratgeber link sections
7. Remove /admin.html from public nav; noindex admin
