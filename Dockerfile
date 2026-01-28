# Backend Dockerfile - Multi-stage build for NestJS
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Build the source code
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure TypeScript and NestJS config files are present
RUN ls -la && echo "Checking for config files..." && \
    test -f tsconfig.json && echo "✓ tsconfig.json found" || echo "✗ tsconfig.json missing" && \
    test -f nest-cli.json && echo "✓ nest-cli.json found" || echo "✗ nest-cli.json missing"

# Regenerate Prisma Client in builder stage (needed for NestJS build)
RUN npx prisma generate

# Build the application
RUN npm run build

# Verify build output
RUN echo "Verifying build output..." && ls -la dist/ && echo "Build verification complete"

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app

# Verify dist folder exists in final image
RUN echo "Verifying dist folder in final image..." && ls -la /app && ls -la /app/dist && echo "Verification complete"

USER nestjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main"]
