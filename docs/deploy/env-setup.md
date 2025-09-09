---
id: environment-setup
title: Environment Setup
keywords: [env, variables, configuration, setup]
priority: high
ai_optimized: true
---

# Environment Setup

## 📁 Environment Files Structure

```
.env.example        # Template (Git tracked)
.env.local          # Local development (Git ignored)
.env.test           # Test environment
.env.production     # Production environment
```

## 🔧 Required Variables (.env.local)

```bash
# Core Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Upstash Redis Cache
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=AY0lASQ...

# Google AI (Optional)
GOOGLE_AI_API_KEY=AIzaSy...
GOOGLE_AI_MODEL=gemini-1.5-flash

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

## 🚀 Production Variables

```bash
# Production optimizations
NEXT_PUBLIC_FREE_TIER_MODE=true
VERCEL_HOBBY_PLAN=true
ENABLE_QUOTA_PROTECTION=true

# Performance tuning
MEMORY_LIMIT_MB=40
SERVERLESS_FUNCTION_TIMEOUT=8
FORCE_GARBAGE_COLLECTION=true
DISABLE_BACKGROUND_JOBS=true

# Security
DISABLE_FILE_UPLOADS=true
DISABLE_LOG_SAVING=true
MEMORY_BASED_CONFIG=true
```

## 🔍 Environment Validation

```typescript
// src/lib/env-validation.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  GOOGLE_AI_API_KEY: z.string().min(1).optional(),
})

export const validateEnv = () => {
  try {
    envSchema.parse(process.env)
    console.log('✅ Environment variables validated')
  } catch (error) {
    console.error('❌ Environment validation failed:', error)
    process.exit(1)
  }
}
```

## 🛠️ Setup Scripts

```bash
# Quick environment setup
npm run env:setup    # Copy .env.example to .env.local
npm run env:check    # Validate environment variables
npm run env:test     # Test all connections

# Development helpers
npm run dev:setup    # Full development setup
npm run dev:reset    # Reset development environment
```

## 🔐 Security Best Practices

```typescript
// Environment security
const secureMethods = {
  // Never log sensitive variables
  safePrint: (key: string) => {
    const value = process.env[key]
    return value ? `${key}=${value.substring(0, 8)}...` : `${key}=undefined`
  },
  
  // Validate required variables
  requireEnv: (key: string) => {
    const value = process.env[key]
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
    return value
  }
}
```

## 📊 Free Tier Monitoring

```typescript
// Monitor usage within free limits
export const freetierLimits = {
  supabase: {
    database: '500MB',
    requests: '50,000/month',
    realtime: '2 concurrent'
  },
  vercel: {
    memory: '50MB per function',
    execution: '10s timeout',
    requests: '100,000/month'
  },
  upstash: {
    memory: '256MB',
    commands: '500,000/month'
  }
}
```