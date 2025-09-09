---
id: api-routes
title: API Routes Reference
keywords: [api, routes, endpoints, rest]
priority: high
ai_optimized: true
---

# API Routes Reference

## 📊 Server Metrics API

```typescript
// GET /api/servers
interface ServersResponse {
  servers: ServerBasic[]
  total: number
}

// GET /api/servers/[id]/metrics
interface MetricsResponse {
  metrics: ServerMetric[]
  timeRange: string
}

// GET /api/dashboard/data
interface DashboardResponse {
  overview: SystemOverview
  servers: ServerSummary[]
  alerts: Alert[]
}
```

## 🤖 AI Analysis API

```typescript
// POST /api/ai/analyze
interface AnalyzeRequest {
  query: string
  context: Record<string, any>
  mode: 'LOCAL' | 'GOOGLE_ONLY'
}

// GET /api/ai/status
interface AIStatusResponse {
  mode: string
  health: boolean
  latency: number
}
```

## 🔐 Auth API

```typescript
// POST /api/auth/github
interface AuthRequest {
  code: string
  state: string
}

// GET /api/auth/session
interface SessionResponse {
  user: User | null
  isAuthenticated: boolean
}
```

## ⚡ Quick Usage

```bash
# Health check
curl /api/health

# Get all servers
curl /api/servers

# Get server metrics
curl /api/servers/server-001/metrics?range=1h
```