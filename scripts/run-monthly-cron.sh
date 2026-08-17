#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  Monatlicher Artikel-Generator — Cron-Job Script
#  Läuft auf dem OpenClaw Server automatisch monatlich
# ═══════════════════════════════════════════════════════════════

set -e  # Exit bei Fehlern

REPO_DIR="/root/.openclaw/workspace/fachschmiede"
LOG_FILE="/root/.openclaw/workspace/logs/monthly-generator.log"
DATE=$(date +%Y-%m-%d_%H-%M)

# Logging
mkdir -p "$(dirname "$LOG_FILE")"
echo "═════════════════════════════════════════════════" >> "$LOG_FILE"
echo "🚀 Artikel-Generator gestartet: $DATE" >> "$LOG_FILE"

# Ins Repo wechseln
cd "$REPO_DIR"

# 1. Aktuellen Stand pullen
echo "📥 Pulling latest changes..." >> "$LOG_FILE"
git pull origin main >> "$LOG_FILE" 2>&1 || true

# 2. Dependencies installieren (falls neue dazu kamen)
echo "📦 Installing dependencies..." >> "$LOG_FILE"
npm ci >> "$LOG_FILE" 2>&1

# 3. node-fetch installieren (für den Generator)
echo "📦 Installing node-fetch..." >> "$LOG_FILE"
npm install node-fetch@2 >> "$LOG_FILE" 2>&1 || true

# 4. Generator ausführen
echo "🤖 Running article generator..." >> "$LOG_FILE"
node scripts/monthly-generator.js >> "$LOG_FILE" 2>&1

# 5. Änderungen committen und pushen
echo "💾 Committing and pushing..." >> "$LOG_FILE"
git add public/blog/ lib/article-index.json public/images/articles/ 2>/dev/null || true

if git diff --cached --quiet; then
    echo "⚠️  Keine neuen Artikel generiert (oder bereits vorhanden)" >> "$LOG_FILE"
else
    git config user.email "finn@fachschmiede.de"
    git config user.name "Finn Bot"
    git commit -m "feat: Neue monatliche Artikel $(date +%Y-%m)"
    git push origin main >> "$LOG_FILE" 2>&1
    echo "✅ Artikel erfolgreich gepusht!" >> "$LOG_FILE"
fi

echo "🏁 Fertig: $(date +%Y-%m-%d_%H-%M)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
