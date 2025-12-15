# Use Node.js 22 optimized image
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Expose port (Cloud Run sets PORT env var)
EXPOSE 8080

# Start server with tsx (runtime TypeScript compilation)
CMD ["npx", "tsx", "src/server.ts"]
