---
id: build-issues
title: Build & Deployment Issues
keywords: [build, deployment, vercel, errors]
priority: high
ai_optimized: true
---

# Build & Deployment Issues

## 🚨 TypeScript Build Errors

### Type Errors in Production Build

```bash
# ❌ Problem: Build fails with type errors
Type 'string | undefined' is not assignable to type 'string'

# ✅ Solution: Add type guards
const serverId = params.id
if (!serverId) {
  return Response.json({ error: 'Server ID required' }, { status: 400 })
}
// Now serverId is guaranteed to be string
```

### Module Resolution Issues

```typescript
// ❌ Problem: Cannot find module '@/components/ui/button'
import { Button } from '@/components/ui/button'

// ✅ Solution: Check tsconfig.json paths
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"]
    }
  }
}
```

## 🌐 Vercel Deployment Issues

### Function Timeout Errors

```bash
# ❌ Problem: Function exceeded timeout (10s)
Error: Function execution timed out

# ✅ Solution: Optimize function performance
export const maxDuration = 8 // Set lower timeout
export const dynamic = 'force-dynamic'

// Add timeout handling
const controller = new AbortController()
setTimeout(() => controller.abort(), 5000)

const response = await fetch(url, {
  signal: controller.signal
})
```

### Memory Limit Exceeded

```javascript
// vercel.json optimization
{
  "functions": {
    "src/app/api/**/*.ts": {
      "memory": 128,
      "maxDuration": 8
    }
  }
}

// Force garbage collection in production
if (process.env.NODE_ENV === 'production') {
  if (global.gc) {
    global.gc()
  }
}
```

### Environment Variables Not Loading

```bash
# ❌ Problem: process.env.VARIABLE is undefined

# ✅ Solution: Check environment setup
# 1. Verify .env.local exists
cat .env.local

# 2. Check Vercel environment variables
vercel env ls

# 3. Add missing variables
vercel env add SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# 4. Redeploy
vercel --prod
```

## 📦 Dependency Issues

### Package Installation Errors

```bash
# ❌ Problem: npm install fails with conflicts
npm ERR! peer dep missing

# ✅ Solution: Use legacy peer deps
npm install --legacy-peer-deps

# Or fix specific conflicts
npm install @types/react@^18.0.0 --legacy-peer-deps
```

### Import/Export Errors

```typescript
// ❌ Problem: Module not found or circular dependency
import { ServerCard } from './ServerCard';

// ✅ Solution: Use index files for clean imports
// components/index.ts
export { ServerCard } from './ServerCard';
export { Dashboard } from './Dashboard';

// Usage
import { ServerCard, Dashboard } from '@/components';
```

## 🎨 Style Build Issues

### Tailwind CSS Not Working

```bash
# ❌ Problem: Tailwind classes not applied
# Check if PostCSS is configured

# ✅ Solution: Verify tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

# Check postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### CSS Import Errors

```typescript
// ❌ Problem: Cannot import CSS files
import './globals.css';

// ✅ Solution: Check Next.js CSS imports
// Only in pages/_app.tsx or app/layout.tsx
import './globals.css'; // ✅ Global CSS
import styles from './component.module.css'; // ✅ CSS Modules
```

## 🔧 Build Optimization

### Large Bundle Size

```bash
# Analyze bundle size
npm run build
npm run analyze

# Optimize imports
# ❌ Import entire library
import _ from 'lodash'

# ✅ Import specific functions
import { debounce } from 'lodash'
```

### Slow Build Times

```javascript
// next.config.js optimizations
module.exports = {
  // Reduce build time
  swcMinify: true,

  // Skip type checking during build (use separate command)
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  // Optimize images
  images: {
    domains: ['example.com'],
    formats: ['image/webp', 'image/avif'],
  },
};
```

## 🐛 Runtime Errors After Build

### Hydration Mismatches

```typescript
// ❌ Problem: Hydration failed
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

if (!mounted) {
  return <div>Loading...</div> // Prevent hydration mismatch
}

return <ClientSideComponent />
```

### API Route Errors

```typescript
// ❌ Problem: API route not found in production
// pages/api/servers.ts (Pages Router)

// ✅ Solution: Use App Router structure
// src/app/api/servers/route.ts (App Router)
export async function GET(request: Request) {
  return Response.json({ servers: [] });
}
```

## 🔍 Debugging Build Issues

```bash
# Local build debugging
npm run build 2>&1 | tee build.log
npm run start # Test production build locally

# Vercel build debugging
vercel logs --follow # Real-time logs
vercel inspect # Deployment details

# Type checking
npm run type-check -- --noEmit --watch

# Lint checking
npm run lint -- --fix
```

## 🚀 Build Success Checklist

```bash
# Pre-deployment checklist
✅ npm run type-check    # No TypeScript errors
✅ npm run lint          # No linting errors
✅ npm run test          # All tests pass
✅ npm run build         # Build succeeds
✅ npm run start         # Production build works locally
✅ vercel env ls         # Environment variables set
✅ git push              # Code pushed to repository
```
