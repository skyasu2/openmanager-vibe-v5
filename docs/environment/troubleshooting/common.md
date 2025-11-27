---
id: common-issues
title: Common Issues & Solutions
keywords: [troubleshooting, errors, debugging, fixes]
priority: high
ai_optimized: true
---

# Common Issues & Solutions

## 🚨 TypeScript Errors

### "Type 'unknown' is not assignable"

```typescript
// ❌ Problem
const data: unknown = await response.json();
const server = data.server; // Error

// ✅ Solution - Type guards
function isServer(data: unknown): data is Server {
  return (
    typeof data === 'object' && data !== null && 'id' in data && 'name' in data
  );
}

if (isServer(data)) {
  const server = data.server; // OK
}
```

### "Property does not exist on type"

```typescript
// ❌ Problem
const user = req.user.id; // Error if user might be undefined

// ✅ Solution - Optional chaining
const userId = req.user?.id;
if (!userId) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## 🌐 API Issues

### Supabase Connection Timeout

```typescript
// ❌ Problem - Default timeout too long
const { data } = await supabase.from('servers').select('*');

// ✅ Solution - Add timeout
const abortController = new AbortController();
setTimeout(() => abortController.abort(), 5000); // 5s timeout

const { data, error } = await supabase
  .from('servers')
  .select('*')
  .abortSignal(abortController.signal);

if (error) {
  console.error('Query timeout or error:', error);
}
```

### CORS Issues in Development

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type,Authorization',
          },
        ],
      },
    ];
  },
};
```

## 🔧 Build & Deployment

### Vercel Build Failures

```bash
# Check build locally first
npm run build
npm run type-check
npm run lint

# Common fixes
npm run lint:fix           # Fix ESLint issues
rm -rf .next && npm run build  # Clear cache
npm install --legacy-peer-deps # Fix dependency conflicts
```

### Environment Variables Not Loading

```typescript
// ❌ Problem - Variables not available
console.log(process.env.SUPABASE_URL); // undefined

// ✅ Solution - Check file structure
// .env.local (for development)
// .env (for production)
// Restart development server after changes

// Validation helper
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

## 📊 Performance Issues

### Slow Database Queries

```sql
-- ❌ Problem - Slow query without indexes
SELECT * FROM server_metrics
WHERE server_id = 'server-001'
ORDER BY timestamp DESC
LIMIT 100;

-- ✅ Solution - Add proper index
CREATE INDEX idx_server_metrics_server_timestamp
ON server_metrics(server_id, timestamp DESC);

-- Query performance check
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM server_metrics
WHERE server_id = 'server-001'
ORDER BY timestamp DESC
LIMIT 100;
```

### React Re-render Issues

```typescript
// ❌ Problem - Unnecessary re-renders
const ServerCard = ({ server }) => {
  const handleClick = () => onServerClick(server.id) // New function every render
  return <Card onClick={handleClick}>...</Card>
}

// ✅ Solution - useCallback
const ServerCard = ({ server, onServerClick }) => {
  const handleClick = useCallback(
    () => onServerClick(server.id),
    [server.id, onServerClick]
  )
  return <Card onClick={handleClick}>...</Card>
}
```

## 🔒 Authentication Issues

### GitHub OAuth Loop

```typescript
// ❌ Problem - Infinite redirect loop
// Usually caused by misconfigured redirect URI

// ✅ Solution - Check configuration
const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email',
        },
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Prevent infinite loops
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
};
```

## 🐛 Runtime Errors

### Hydration Mismatches

```typescript
// ❌ Problem - Server/client render differently
const Component = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null // Prevents hydration mismatch

  return <ClientOnlyComponent />
}
```

### Memory Leaks

```typescript
// ❌ Problem - Subscriptions not cleaned up
useEffect(() => {
  const interval = setInterval(() => {
    fetchMetrics();
  }, 1000);
  // Missing cleanup
}, []);

// ✅ Solution - Proper cleanup
useEffect(() => {
  const interval = setInterval(() => {
    fetchMetrics();
  }, 1000);

  return () => clearInterval(interval); // Cleanup
}, []);
```

## 🔍 Debugging Tools

```bash
# Development debugging
npm run dev -- --inspect    # Enable Node.js debugging
npm run analyze             # Bundle analysis
npm run type-check -- --watch  # Watch mode type checking

# Production debugging
vercel logs --follow        # Real-time Vercel logs
npm run build -- --debug   # Debug build process
```
