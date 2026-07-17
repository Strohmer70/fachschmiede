# Fachschmiede Automation Framework

## Overview
This directory contains all automation scripts for the rank & rent empire.

## Structure
- `deploy/` — Vercel deployment scripts
- `generate/` — Landing page generation
- `seo/` — SEO optimization tools
- `config/` — API keys & configuration

## Quick Start
1. Set up API keys in `.env`
2. Run scripts via `npm run deploy:city` or `npm run generate:batch`

## Commands
- `generate-pages.js` — Bulk generate landing pages for trades/cities
- `deploy-batch.js` — Deploy generated pages to Vercel
- `update-content.js` — Mass-update content across all pages
- `create-trade.js` — Add new trade category with template
- `add-city.js` — Add new city to existing trade pages

## API Keys Required
- VERCEL_TOKEN — From Vercel dashboard → Settings → Tokens
- SUPABASE_URL & SUPABASE_KEY — From Supabase project settings
- STRIPE_SECRET_KEY — From Stripe dashboard
- CLOUDFLARE_API_TOKEN — From Cloudflare → My Profile → API Tokens
- OPENAI_API_KEY or KIMI_API_KEY — For content generation
