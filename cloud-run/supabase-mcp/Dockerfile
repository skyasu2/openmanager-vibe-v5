# ============================================================================
# Supabase MCP Bridge - Cloud Run Service
# Streamable HTTP Transport with HTTP/2 Support
# ============================================================================

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies (cache layer)
COPY package.json package-lock.json* ./
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
    adduser --system --uid 1001 mcp
USER mcp

# Copy built files
COPY --from=builder --chown=mcp:nodejs /app/dist ./dist
COPY --from=builder --chown=mcp:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=mcp:nodejs /app/package.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# HTTP/2 h2c mode supported
EXPOSE 8080

CMD ["node", "dist/index.js"]
