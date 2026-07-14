# Dockerfile - Multi-stage production image
# Build context is the monorepo ROOT (see docker-compose.yml / deployment
# config), not this directory, so the pnpm workspace (root manifest +
# packages/shared) is visible for install/linking.
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.26.0 --activate

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat openssl

# Dependencies stage
FROM base AS deps

# Copy workspace manifests
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Builder stage
FROM base AS builder

# Copy workspace manifests
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Generate Prisma Client
RUN pnpm --filter @lifeos/web prisma:generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

RUN pnpm --filter @lifeos/web build

# Runner stage
FROM base AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# NOTE: assumes next.config.ts sets `output: 'standalone'`; the standalone
# bundle nests under the workspace package path (apps/web) when built from
# a monorepo root. Verify this path against the actual build output before
# relying on this image — it was not exercised in this session.
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/prisma ./apps/web/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run migrations and start server
CMD ["sh", "-c", "cd apps/web && npx prisma migrate deploy && node server.js"]
