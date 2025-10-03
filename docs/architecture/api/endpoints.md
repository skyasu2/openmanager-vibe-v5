---
id: api-endpoints  
title: Complete API Endpoints
keywords: [api, endpoints, rest, reference]
priority: high
ai_optimized: true
---

# Complete API Endpoints

## 📊 Server Management

```typescript
// GET /api/servers - List all servers
interface ServersResponse {
  servers: Server[]
  total: number
  page: number
}

// GET /api/servers/[id] - Get specific server
interface ServerResponse {
  server: ServerDetail
  metrics: ServerMetric[]
}

// POST /api/servers - Create server (Mock)
interface CreateServerRequest {
  name: string
  type: 'web' | 'api' | 'database' | 'cache'
  config: ServerConfig
}
```

## 📈 Metrics API

```typescript
// GET /api/metrics - Global metrics
interface MetricsResponse {
  overview: SystemOverview
  servers: ServerSummary[]
  alerts: Alert[]
}

// GET /api/metrics/[serverId] - Server-specific metrics  
interface ServerMetricsResponse {
  serverId: string
  timeRange: string
  metrics: MetricPoint[]
  aggregations: MetricAggregation
}

// GET /api/metrics/stream - Real-time metrics (SSE)
// Returns: Server-Sent Events stream
```

## 🤖 AI Analysis

```typescript
// POST /api/ai/analyze - AI analysis
interface AnalyzeRequest {
  query: string
  context: {
    servers?: string[]
    timeRange?: string
    includeMetrics?: boolean
  }
  mode: 'LOCAL' | 'GOOGLE_ONLY'
}

interface AnalyzeResponse {
  analysis: string
  confidence: number
  suggestions: Suggestion[]
  charts?: ChartData[]
}

// GET /api/ai/status - AI system status
interface AIStatusResponse {
  mode: 'LOCAL' | 'GOOGLE_ONLY'
  health: boolean
  latency: number
  lastUpdate: string
}
```

## 📊 Dashboard API

```typescript
// GET /api/dashboard - Dashboard data
interface DashboardResponse {
  overview: {
    totalServers: number
    healthyServers: number
    warningServers: number
    criticalServers: number
    avgCpu: number
    avgMemory: number
  }
  recentAlerts: Alert[]
  topServers: ServerSummary[]
}

// GET /api/dashboard/widgets/[id] - Widget data
interface WidgetResponse {
  widgetId: string
  data: any
  lastUpdated: string
}
```

## 🔐 Authentication

```typescript
// POST /api/auth/github - GitHub OAuth
interface AuthRequest {
  code: string
  state: string
}

interface AuthResponse {
  user: User
  session: Session
  tokens: Tokens
}

// GET /api/auth/session - Current session
interface SessionResponse {
  user: User | null
  isAuthenticated: boolean
  expiresAt: string
}

// POST /api/auth/logout - Logout
interface LogoutResponse {
  success: boolean
}
```

## 🔍 Search & Filter

```typescript
// GET /api/search - Global search
interface SearchRequest {
  q: string
  filters?: {
    type?: string[]
    status?: string[]
    timeRange?: string
  }
  page?: number
  limit?: number
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  facets: SearchFacets
}
```

## 📨 Alerts & Notifications

```typescript
// GET /api/alerts - List alerts
interface AlertsResponse {
  alerts: Alert[]
  total: number
  unread: number
}

// POST /api/alerts/[id]/acknowledge - Acknowledge alert
interface AcknowledgeResponse {
  success: boolean
  alert: Alert
}

// GET /api/notifications - Notifications
interface NotificationsResponse {
  notifications: Notification[]
  unread: number
}
```

## 🔧 System Operations

```typescript
// GET /api/health - System health check
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down'
  version: string
  uptime: number
  services: {
    database: 'up' | 'down'
    cache: 'up' | 'down'
    ai: 'up' | 'down'
  }
}

// GET /api/version - Version info
interface VersionResponse {
  version: string
  buildDate: string
  commitHash: string
  environment: 'development' | 'production'
}
```

## ⚡ Quick Reference

```bash
# Health check
curl /api/health

# Get all servers
curl /api/servers

# Get server metrics (1 hour)
curl "/api/metrics/server-001?range=1h"

# Search servers  
curl "/api/search?q=web&type=server"

# AI analysis
curl -X POST /api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{"query":"server performance", "mode":"LOCAL"}'
```