# ============================================================================
# AI Engine - Cloud Run Service (Multi-stage Build)
# Optimized for Cloud Run cold start
# ============================================================================

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies (cache layer)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS runner

WORKDIR /app

# Production environment
ENV NODE_ENV=production
ENV PORT=8080

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser
USER appuser

# Copy built files only
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/package.json ./

# Install production dependencies only
RUN npm ci --only=production --ignore-scripts

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080

# Direct node execution (faster than npx tsx)
CMD ["node", "dist/server.js"]
