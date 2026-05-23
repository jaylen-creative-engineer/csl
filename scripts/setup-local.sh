#!/usr/bin/env bash
# CSL local setup script
# Usage: bash scripts/setup-local.sh
set -euo pipefail

echo ""
echo "=== CSL Local Setup ==="
echo ""

# ── 1. Node version check ─────────────────────────────────────
NODE_MAJOR=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1 || echo "0")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "WARNING: Node.js >= 18 is required. Detected: $(node --version 2>/dev/null || echo 'not found')"
  echo "         Install from https://nodejs.org or use a version manager like fnm/nvm."
  echo ""
fi

# ── 2. Copy .env.example → .env.local (if not already present) ─
if [ -f ".env.local" ]; then
  echo "  .env.local already exists — skipping copy."
else
  cp .env.example .env.local
  echo "  Created .env.local from .env.example."
fi

# ── 3. Install dependencies ───────────────────────────────────
echo ""
echo "  Installing dependencies..."
npm install
echo ""

# ── 4. Next steps ─────────────────────────────────────────────
echo "==================================="
echo "  Setup complete!"
echo ""
echo "  Next steps:"
echo "    1. Open .env.local"
echo "    2. Fill in Supabase credentials (URL, publishable key, service-role key)"
echo "    3. Set ANTHROPIC_API_KEY for AI features"
echo "    4. Apply database migrations: npm run db:push"
echo "    5. Run: npm run cli"
echo "==================================="
echo ""
