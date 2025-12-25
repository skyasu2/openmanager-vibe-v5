# ============================================================================
# AI Engine - Cloud Run Service (Multi-stage Build)
# Optimized for Cloud Run cold start
# ============================================================================

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies (cache layer)
# v4: @langfuse/langchain natively supports @langchain/core >=0.3.0
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

# Copy package files and install dependencies (as root for permissions)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy built files
COPY --from=builder /app/dist ./dist

# Security: non-root user (switch after npm install)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser && \
    chown -R appuser:nodejs /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080

# Direct node execution (faster than npx tsx)
CMD ["node", "dist/server.js"]
