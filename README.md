# fachschmiede.de — Rank & Rent Empire

> Wir schmieden deine lokale Präsenz.

AI-generated, hyper-local landing pages for German tradespeople. Rank on Google. Rent to locals. Passive income.

## 🎯 Business Model

1. **Generate** unique local pages for trades × cities (e.g., `dachdecker-berlin`)
2. **Rank** them on Google via local SEO + unique content
3. **Rent** to local tradespeople via self-service Stripe checkout
4. **Collect** €99-499/month per page. Fully automated.

## 🏗️ Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Framework | Next.js 14 (Static Export) | Free |
| Hosting | Vercel | Free (Hobby) |
| Database | Supabase (Postgres) | Free (500MB) |
| Payments | Stripe | Pay per transaction |
| Email | Zoho Mail | Free (5 users) |
| Analytics | Plausible or GA4 | Free |

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd fachschmiede
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase dashboard
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase dashboard
- `STRIPE_SECRET_KEY` — from Stripe dashboard
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — from Stripe dashboard

### 3. Database Setup

Run the SQL in `scripts/schema.sql` in your Supabase SQL Editor.

### 4. Generate Pages

```bash
npm run generate-pages
```

This creates unique content for all trade+city combinations.

### 5. Build & Deploy

```bash
npm run build
```

Upload the `dist/` folder to Vercel, or connect GitHub for auto-deploy.

## 📁 Project Structure

```
fachschmiede/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   ├── [slug]/
│   │   └── page.tsx        # Local landing page template
│   └── globals.css         # Styles
├── components/             # Shared components
├── lib/
│   └── data.ts             # Trades & cities data
├── scripts/
│   ├── schema.sql          # Database schema
│   └── generate-content.ts # Content generation
├── generated/              # Generated page content JSON
└── dist/                   # Static build output
```

## 📝 Content Strategy

Each page is **unique** through:
- AI-generated intro with local landmarks & weather
- City-specific services descriptions
- Local testimonials with district names
- FAQ with local regulations
- Unique meta titles & descriptions
- Schema.org LocalBusiness markup

## 💰 Revenue Targets

| Pages Rented | Monthly | Daily |
|-------------|---------|-------|
| 10 × €150 | €1,500 | €50 |
| 25 × €200 | €5,000 | €167 |
| **45 × €200** | **€9,000** | **€300** ✅ |
| 100 × €250 | €25,000 | €833 |

## 📧 Support

Email: hello@fachschmiede.de
