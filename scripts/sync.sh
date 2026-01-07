#!/bin/bash
# Sync local with Docker

echo "📦 Installing dependencies locally..."
pnpm install

echo "🔄 Generating Prisma Client..."
pnpm prisma generate

echo "🐳 Rebuilding Docker containers..."
docker-compose up -d --build

echo "✅ All synced!"