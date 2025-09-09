---
id: vercel-deployment
title: Vercel Deployment Guide
keywords: [vercel, deployment, nextjs, free-tier]
priority: high
ai_optimized: true
---

# Vercel Deployment Guide

## 🚀 Quick Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Login and deploy
vercel login
vercel --prod

# Check deployment
vercel inspect
```

## ⚙️ vercel.json Configuration

```json
{
  "version": 2,
  "framework": "nextjs",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 8,
      "memory": 128
    }
  },
  "regions": ["icn1"],
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1",
      "TYPESCRIPT_STRICT_MODE": "true",
      "NODE_ENV": "production"
    }
  },
  "buildCommand": "npm run build && npm run validate:all"
}
```

## 🔧 Environment Variables

```bash
# Critical production variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add GOOGLE_AI_API_KEY production

# Free tier optimization
vercel env add NEXT_PUBLIC_FREE_TIER_MODE production
vercel env add VERCEL_HOBBY_PLAN production
vercel env add ENABLE_QUOTA_PROTECTION production
```

## 💰 Free Tier Optimization

```typescript
// src/config/vercel-optimization.ts
export const vercelConfig = {
  // Memory optimization (50MB limit)
  maxMemoryUsage: 40, // MB
  
  // Function timeout (10s limit)
  maxExecutionTime: 8000, // ms
  
  // Request optimization
  maxRequestSize: '1mb',
  
  // Auto garbage collection
  forceGC: process.env.NODE_ENV === 'production',
  
  // Disable file system writes
  disableFileSystem: process.env.VERCEL === '1'
}

// Apply optimizations
if (vercelConfig.disableFileSystem) {
  console.warn('🚫 File system writes disabled (Vercel)')
}
```

## 📊 Performance Monitoring

```bash
# Check deployment metrics
vercel logs --follow

# Function usage
vercel inspect --scope=functions

# Analytics
https://vercel.com/dashboard/analytics
```

## 🛡️ Security Headers

```typescript
// next.config.js security
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

## 🚨 Common Issues & Solutions

```bash
# Build failures
npm run type-check  # Fix TypeScript errors
npm run lint:fix    # Fix ESLint issues

# Memory exceeded
MEMORY_LIMIT_MB=40
FORCE_GARBAGE_COLLECTION=true

# Timeout issues  
SERVERLESS_FUNCTION_TIMEOUT=8
DISABLE_BACKGROUND_JOBS=true
```