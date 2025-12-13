# Use official lightweight Node.js image
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (cached if package.json unchanged)
COPY package.json ./
RUN npm install

# Build source
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Create non-root user for security (Cloud Run Best Practice)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose port (Cloud Run defaults to 8080)
EXPOSE 8080

CMD ["node", "dist/server.js"]
