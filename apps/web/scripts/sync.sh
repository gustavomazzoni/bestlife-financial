#!/bin/bash
# Sync local with Docker
# Run from anywhere; resolves the monorepo root relative to this script.

set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

echo "📦 Installing dependencies locally..."
(cd "$ROOT_DIR" && pnpm install)

echo "🔄 Generating Prisma Client..."
(cd "$ROOT_DIR" && pnpm --filter @lifeos/web prisma:generate)

echo "🐳 Rebuilding Docker containers..."
(cd "$ROOT_DIR" && docker compose up -d --build)

echo "✅ All synced!"
