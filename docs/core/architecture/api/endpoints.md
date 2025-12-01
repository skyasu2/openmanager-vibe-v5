---
id: api-endpoints
title: Complete API Endpoints
keywords: [api, endpoints, rest, reference]
priority: high
ai_optimized: true
updated: '2025-11-20'
---

# 🌐 API 엔드포인트 레퍼런스 (85개)

## 📊 카테고리별 분류

### 🤖 AI 관련 (20개)

#### 통합 쿼리

```typescript
// POST /api/ai/query - 메인 AI 쿼리 엔진
interface QueryRequest {
  query: string;
  context?: {
    servers?: string[];
    timeRange?: string;
  };
}

interface QueryResponse {
  response: string;
  confidence: number;
  sources?: string[];
  cached: boolean;
}
```

#### Google AI 직접 호출

```typescript
// POST /api/ai/google-ai/generate
interface GenerateRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
}

// GET /api/ai/google-ai/status
interface StatusResponse {
  available: boolean;
  quota: {
    used: number;
    limit: number;
  };
}
```

#### 특화 기능

```typescript
// POST /api/ai/incident-report - 장애 보고서 생성
// POST /api/ai/insight-center - 인사이트 분석
// POST /api/ai/intelligent-monitoring - 지능형 모니터링
// POST /api/ai/korean-nlp - 한국어 자연어 처리
// POST /api/ai/ml-analytics - ML 분석
// POST /api/ai/performance - 성능 분석
// GET /api/ai/cache-stats - 캐시 통계
// GET /api/ai/rag/benchmark - RAG 벤치마크
// GET /api/ai/raw-metrics - 원시 메트릭
// POST /api/ai/thinking/stream-v2 - 스트리밍 응답
// POST /api/ai/ultra-fast - 초고속 라우터
```

### 🖥️ 서버 관리 (30개)

#### 기본 CRUD

```typescript
// GET /api/servers - 서버 목록
interface ServersResponse {
  servers: Server[];
  total: number;
  page: number;
}

// GET /api/servers/[id] - 서버 상세
interface ServerResponse {
  server: ServerDetail;
  metrics: ServerMetric[];
  status: 'healthy' | 'warning' | 'critical';
}

// POST /api/servers - 서버 생성 (Mock)
interface CreateServerRequest {
  name: string;
  type: 'web' | 'api' | 'database' | 'cache';
  config: ServerConfig;
}

// PUT /api/servers/[id] - 서버 업데이트
// DELETE /api/servers/[id] - 서버 삭제
```

#### 메트릭 수집

```typescript
// GET /api/servers/[id]/metrics - 서버 메트릭
interface ServerMetricsResponse {
  serverId: string;
  timeRange: string;
  metrics: {
    cpu: number[];
    memory: number[];
    disk: number[];
    network: number[];
  };
  timestamps: string[];
}

// GET /api/servers/[id]/health - 헬스 체크
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  checks: HealthCheck[];
  lastCheck: string;
}
```

#### 시나리오 관리

```typescript
// GET /api/servers/scenarios - 시나리오 목록
// POST /api/servers/scenarios/[id]/apply - 시나리오 적용
// GET /api/servers/scenarios/[id]/status - 시나리오 상태
```

### 📈 메트릭 (15개)

#### 전체 메트릭

```typescript
// GET /api/metrics - 전체 개요
interface MetricsResponse {
  overview: {
    totalServers: number;
    healthyServers: number;
    avgCpu: number;
    avgMemory: number;
  };
  servers: ServerSummary[];
  alerts: Alert[];
}

// GET /api/metrics/overview - 상세 개요
// GET /api/metrics/aggregations - 집계 데이터
```

#### 서버별 메트릭

```typescript
// GET /api/metrics/[serverId] - 서버별 메트릭
interface ServerMetricsResponse {
  serverId: string;
  current: MetricSnapshot;
  history: MetricPoint[];
  predictions?: MetricPrediction[];
}

// GET /api/metrics/[serverId]/historical - 히스토리
// GET /api/metrics/[serverId]/realtime - 실시간
```

#### 실시간 스트림

```typescript
// GET /api/metrics/stream - SSE 스트림
// Returns: Server-Sent Events
// Format: data: {"serverId": "...", "metrics": {...}}
```

### 🔐 인증 (5개)

```typescript
// POST /api/auth/github - GitHub OAuth
interface AuthRequest {
  code: string;
  state: string;
}

interface AuthResponse {
  user: User;
  session: Session;
  tokens: Tokens;
}

// POST /api/auth/logout - 로그아웃
// GET /api/auth/session - 세션 확인
// POST /api/auth/refresh - 토큰 갱신
// GET /api/auth/verify - 토큰 검증
```

### 🔧 유틸리티 (15개)

#### 헬스체크

```typescript
// GET /api/health - 시스템 헬스
interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  services: {
    api: boolean;
    database: boolean;
    ai: boolean;
  };
  uptime: number;
}

// GET /api/agents/health - 에이전트 헬스
```

#### A/B 테스트

```typescript
// GET /api/ab-test - A/B 테스트 설정
// POST /api/ab-test/track - 이벤트 추적
```

#### 로깅

```typescript
// POST /api/ai/logging/stream - 로그 스트림
// GET /api/logs - 로그 조회
```

## 🔄 공통 응답 형식

### 성공 응답

```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  cached?: boolean;
}
```

### 에러 응답

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}
```

## 🚀 Rate Limiting

```typescript
// 기본 제한
- 100 요청/분 (IP 기반)
- 1000 요청/시간 (사용자 기반)

// AI 엔드포인트
- 30 요청/분
- 300 요청/시간

// 헤더
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

## 🔒 인증

### GitHub OAuth + Supabase Auth

```typescript
// 헤더
Authorization: Bearer <supabase_access_token>

// 또는 쿠키
sb-access-token=<token>
```

### 권한 레벨

- **GitHub 사용자**: 인증된 사용자, 전체 기능 접근
- **게스트**: 비인증 사용자, 읽기 전용 (제한적)

## 📊 응답 시간 (평균)

| 카테고리  | 평균   | P95    | P99    |
| --------- | ------ | ------ | ------ |
| AI 쿼리   | 1000ms | 2000ms | 3000ms |
| 서버 관리 | 50ms   | 100ms  | 200ms  |
| 메트릭    | 30ms   | 60ms   | 100ms  |
| 인증      | 20ms   | 40ms   | 80ms   |

## 🔗 관련 문서

- **시스템 아키텍처**: [../SYSTEM-ARCHITECTURE-CURRENT.md](../SYSTEM-ARCHITECTURE-CURRENT.md)
- **AI 시스템**: [../../ai/README.md](../../ai/README.md)
- **테스트 가이드**: [../../environment/testing/README.md](../../environment/testing/README.md)

---

**마지막 업데이트**: 2025-11-20  
**총 엔드포인트**: 85개  
**상태**: ✅ 프로덕션

health: boolean
latency: number
lastUpdate: string
}

````

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
````

## 🔐 Authentication

```typescript
// POST /api/auth/github - GitHub OAuth
interface AuthRequest {
  code: string;
  state: string;
}

interface AuthResponse {
  user: User;
  session: Session;
  tokens: Tokens;
}

// GET /api/auth/session - Current session
interface SessionResponse {
  user: User | null;
  isAuthenticated: boolean;
  expiresAt: string;
}

// POST /api/auth/logout - Logout
interface LogoutResponse {
  success: boolean;
}
```

## 🔍 Search & Filter

```typescript
// GET /api/search - Global search
interface SearchRequest {
  q: string;
  filters?: {
    type?: string[];
    status?: string[];
    timeRange?: string;
  };
  page?: number;
  limit?: number;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  facets: SearchFacets;
}
```

## 📨 Alerts & Notifications

```typescript
// GET /api/alerts - List alerts
interface AlertsResponse {
  alerts: Alert[];
  total: number;
  unread: number;
}

// POST /api/alerts/[id]/acknowledge - Acknowledge alert
interface AcknowledgeResponse {
  success: boolean;
  alert: Alert;
}

// GET /api/notifications - Notifications
interface NotificationsResponse {
  notifications: Notification[];
  unread: number;
}
```

## 🔧 System Operations

```typescript
// GET /api/health - System health check
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  version: string;
  uptime: number;
  services: {
    database: 'up' | 'down';
    cache: 'up' | 'down';
    ai: 'up' | 'down';
  };
}

// GET /api/version - Version info
interface VersionResponse {
  version: string;
  buildDate: string;
  commitHash: string;
  environment: 'development' | 'production';
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
