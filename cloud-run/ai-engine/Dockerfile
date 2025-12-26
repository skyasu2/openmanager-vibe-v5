# ============================================================================
# AI Engine - Cloud Run Service (Multi-stage Build)
# Optimized for Cloud Run cold start & minimal image size
# ============================================================================

# Stage 1: Dependencies (cached layer)
FROM node:22-alpine AS deps

WORKDIR /app

# Install dependencies only (maximize cache hit)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --ignore-scripts && \
    npm cache clean --force

# Stage 2: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# Stage 3: Production (minimal)
FROM node:22-alpine AS runner

WORKDIR /app

# Production environment
ENV NODE_ENV=production
ENV PORT=8080

# Security: non-root user first
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy package files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev --legacy-peer-deps --ignore-scripts && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/cache/apk/*

# Copy built files
COPY --from=builder /app/dist ./dist

# Set ownership and switch to non-root
RUN chown -R appuser:nodejs /app
USER appuser

# Health check (lightweight)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=2 \
    CMD wget -q --spider http://localhost:8080/health || exit 1

EXPOSE 8080

# Direct node execution (fastest startup)
CMD ["node", "dist/server.js"]
