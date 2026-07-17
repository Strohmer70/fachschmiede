#!/bin/bash
# Deploy script for fachschmiede.de
set -e
echo "🚀 Building fachschmiede.de..."
echo "📄 Generating page content..."
npx tsx scripts/generate-content.ts
echo "🏗️ Building static site..."
npm run build
echo "✅ Build complete! Upload 'dist/' folder to your host."
