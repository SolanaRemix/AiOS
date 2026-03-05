#!/usr/bin/env bash
set -euo pipefail

echo "=== AiOS Bootstrap Script ==="
echo ""

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null || echo "not installed")
echo "Node.js: $NODE_VERSION"

# Check npm
NPM_VERSION=$(npm --version 2>/dev/null || echo "not installed")
echo "npm: $NPM_VERSION"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Copy env file
if [ ! -f ".env" ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo "NOTE: Please update .env with your actual credentials"
fi

echo ""
echo "=== Bootstrap complete! ==="
echo ""
echo "Next steps:"
echo "  1. Update .env with your database and API credentials"
echo "  2. Run: npm run db:migrate  (to set up database)"
echo "  3. Run: npm run db:seed     (to seed development data)"
echo "  4. Run: npm run dev         (to start development servers)"
