# 🔧 OpenManager Vibe V5 API 문서

> REST API 명세, 엔드포인트, 데이터 구조 완전 가이드

## 📋 목차

1. [API 개요](#api-개요)
2. [인증 & 보안](#인증--보안)
3. [서버 관리 API](#서버-관리-api)
4. [메트릭 API](#메트릭-api)
5. [AI & 채팅 API](#ai--채팅-api)
6. [알림 API](#알림-api)
7. [헬스 체크 API](#헬스-체크-api)
8. [에러 처리](#에러-처리)

---

## 🌐 API 개요

### 기본 정보

```
Base URL: https://your-domain.vercel.app/api
Version: v1
Protocol: HTTPS
Format: JSON
Rate Limit: 1000 requests/hour
```

### 공통 헤더

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
X-API-Version: v1
User-Agent: OpenManager-Client/5.1
```

### 응답 형식

#### 성공 응답
```json
{
  "success": true,
  "data": {
    // 실제 데이터
  },
  "message": "Success",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid server ID format",
    "details": {
      "field": "serverId",
      "received": "invalid-id",
      "expected": "UUID format"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔐 인증 & 보안

### JWT 토큰 기반 인증

#### 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "사용자",
      "role": "admin"
    },
    "expiresIn": 3600
  }
}
```

#### 토큰 갱신
```http
POST /api/auth/refresh
Authorization: Bearer <refresh_token>
```

#### 로그아웃
```http
POST /api/auth/logout
Authorization: Bearer <jwt_token>
```

### API 키 인증 (서버 간 통신)

```http
GET /api/servers
X-API-Key: your-api-key-here
```

---

## 🖥️ 서버 관리 API

### 서버 목록 조회

```http
GET /api/servers
Authorization: Bearer <jwt_token>
```

**쿼리 파라미터:**
- `status` - 서버 상태 필터 (`healthy`, `warning`, `critical`)
- `type` - 서버 타입 필터 (`api`, `database`, `web`, `cache`)
- `page` - 페이지 번호 (기본: 1)
- `limit` - 페이지 크기 (기본: 20, 최대: 100)
- `search` - 서버 이름 검색

**응답:**
```json
{
  "success": true,
  "data": {
    "servers": [
      {
        "id": "server-001",
        "name": "api-useast-001",
        "status": "healthy",
        "type": "api",
        "location": "US-East",
        "metrics": {
          "cpu": 45.2,
          "memory": 67.8,
          "disk": 52.1,
          "network": 23.4
        },
        "uptime": 154,
        "lastUpdate": "2024-01-15T10:30:00Z",
        "tags": ["production", "api", "east"]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 19,
      "totalPages": 1
    }
  }
}
```

### 개별 서버 조회

```http
GET /api/servers/{serverId}
Authorization: Bearer <jwt_token>
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "server-001",
    "name": "api-useast-001",
    "status": "healthy",
    "type": "api",
    "location": "US-East",
    "metrics": {
      "cpu": 45.2,
      "memory": 67.8,
      "disk": 52.1,
      "network": 23.4
    },
    "uptime": 154,
    "lastUpdate": "2024-01-15T10:30:00Z",
    "configuration": {
      "os": "Ubuntu 22.04",
      "cores": 4,
      "ram": "8GB",
      "disk": "100GB SSD"
    },
    "tags": ["production", "api", "east"]
  }
}
```

### 서버 생성

```http
POST /api/servers
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "new-server-001",
  "type": "api",
  "location": "US-West",
  "configuration": {
    "os": "Ubuntu 22.04",
    "cores": 2,
    "ram": "4GB",
    "disk": "50GB SSD"
  },
  "tags": ["development", "api"]
}
```

### 서버 수정

```http
PUT /api/servers/{serverId}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "updated-server-name",
  "tags": ["production", "api", "updated"]
}
```

### 서버 삭제

```http
DELETE /api/servers/{serverId}
Authorization: Bearer <jwt_token>
```

---

## 📊 메트릭 API

### 실시간 메트릭 조회

```http
GET /api/metrics/{serverId}
Authorization: Bearer <jwt_token>
```

**쿼리 파라미터:**
- `from` - 시작 시간 (ISO 8601)
- `to` - 종료 시간 (ISO 8601)
- `interval` - 데이터 간격 (`1m`, `5m`, `15m`, `1h`, `1d`)
- `metrics` - 조회할 메트릭 (`cpu`, `memory`, `disk`, `network`)

**응답:**
```json
{
  "success": true,
  "data": {
    "serverId": "server-001",
    "timeRange": {
      "from": "2024-01-15T09:30:00Z",
      "to": "2024-01-15T10:30:00Z"
    },
    "interval": "5m",
    "metrics": {
      "cpu": [
        {
          "timestamp": "2024-01-15T09:30:00Z",
          "value": 45.2
        },
        {
          "timestamp": "2024-01-15T09:35:00Z",
          "value": 47.8
        }
      ],
      "memory": [
        {
          "timestamp": "2024-01-15T09:30:00Z",
          "value": 67.8
        }
      ]
    }
  }
}
```

### 메트릭 업데이트 (서버에서 전송)

```http
POST /api/metrics/{serverId}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "metrics": {
    "cpu": 45.2,
    "memory": 67.8,
    "disk": 52.1,
    "network": 23.4
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 메트릭 집계 조회

```http
GET /api/metrics/aggregate
Authorization: Bearer <jwt_token>
```

**쿼리 파라미터:**
- `period` - 집계 기간 (`1h`, `24h`, `7d`, `30d`)
- `groupBy` - 그룹 기준 (`server`, `type`, `location`)

**응답:**
```json
{
  "success": true,
  "data": {
    "period": "24h",
    "aggregates": {
      "cpu": {
        "avg": 45.2,
        "min": 12.5,
        "max": 89.1,
        "p95": 78.3
      },
      "memory": {
        "avg": 67.8,
        "min": 32.1,
        "max": 91.2,
        "p95": 85.4
      }
    },
    "breakdown": [
      {
        "type": "api",
        "count": 6,
        "avgCpu": 55.2,
        "avgMemory": 65.1
      }
    ]
  }
}
```

---

## 🤖 AI & 채팅 API

### AI 질문 처리

```http
POST /api/ai/query
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "query": "현재 CPU 사용률이 가장 높은 서버는?",
  "context": {
    "sessionId": "session-123",
    "userId": "user-456"
  }
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "response": "현재 CPU 사용률이 가장 높은 서버는 **api-useast-001**입니다. CPU 사용률이 89%로 심각한 상태입니다.",
    "actions": {
      "highlightServers": ["server-001"],
      "showChart": true,
      "actionButtons": ["서버 재시작", "로그 확인", "스케일링"]
    },
    "relatedData": {
      "servers": [
        {
          "id": "server-001",
          "name": "api-useast-001",
          "cpu": 89.0
        }
      ]
    },
    "confidence": 0.95
  }
}
```

### 채팅 세션 관리

```http
POST /api/ai/sessions
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "userId": "user-456"
}
```

```http
GET /api/ai/sessions/{sessionId}/messages
Authorization: Bearer <jwt_token>
```

```http
DELETE /api/ai/sessions/{sessionId}
Authorization: Bearer <jwt_token>
```

### AI 인사이트 조회

```http
GET /api/ai/insights
Authorization: Bearer <jwt_token>
```

**응답:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "performance_alert",
        "severity": "high",
        "title": "API 서버 성능 저하 감지",
        "description": "api-useast-001 서버의 응답 시간이 평소보다 300% 증가했습니다.",
        "recommendation": "서버 재시작 또는 스케일링을 고려해보세요.",
        "affectedServers": ["server-001"],
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

## 🔔 알림 API

### 알림 목록 조회

```http
GET /api/alerts
Authorization: Bearer <jwt_token>
```

**쿼리 파라미터:**
- `status` - 알림 상태 (`active`, `acknowledged`, `resolved`)
- `severity` - 심각도 (`low`, `medium`, `high`, `critical`)
- `serverId` - 특정 서버의 알림만 조회

**응답:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert-001",
        "title": "높은 CPU 사용률",
        "description": "서버 api-useast-001의 CPU 사용률이 90%를 초과했습니다.",
        "severity": "critical",
        "status": "active",
        "serverId": "server-001",
        "metricType": "cpu",
        "threshold": 90,
        "currentValue": 89.1,
        "createdAt": "2024-01-15T10:25:00Z",
        "acknowledgedAt": null,
        "resolvedAt": null
      }
    ]
  }
}
```

### 알림 생성

```http
POST /api/alerts
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "새로운 알림",
  "description": "사용자 정의 알림입니다.",
  "severity": "medium",
  "serverId": "server-001"
}
```

### 알림 확인

```http
PUT /api/alerts/{alertId}/acknowledge
Authorization: Bearer <jwt_token>
```

### 알림 해결

```http
PUT /api/alerts/{alertId}/resolve
Authorization: Bearer <jwt_token>
```

---

## 🏥 헬스 체크 API

### 전체 시스템 상태

```http
GET /api/health
```

**응답:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "services": {
      "database": {
        "status": "healthy",
        "responseTime": 45,
        "lastCheck": "2024-01-15T10:30:00Z"
      },
      "redis": {
        "status": "healthy",
        "responseTime": 12,
        "lastCheck": "2024-01-15T10:30:00Z"
      },
      "external_apis": {
        "status": "degraded",
        "responseTime": 2500,
        "lastCheck": "2024-01-15T10:29:00Z"
      }
    },
    "version": "5.1.0",
    "uptime": 86400
  }
}
```

### 개별 서비스 상태

```http
GET /api/health/{service}
```

### 상세 시스템 정보

```http
GET /api/health/detailed
Authorization: Bearer <jwt_token>
```

---

## ❌ 에러 처리

### HTTP 상태 코드

| 코드 | 의미 | 설명 |
|------|------|------|
| 200 | OK | 성공 |
| 201 | Created | 리소스 생성 성공 |
| 400 | Bad Request | 잘못된 요청 |
| 401 | Unauthorized | 인증 실패 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 리소스 충돌 |
| 422 | Unprocessable Entity | 검증 실패 |
| 429 | Too Many Requests | 요청 한도 초과 |
| 500 | Internal Server Error | 서버 오류 |
| 503 | Service Unavailable | 서비스 일시 불가 |

### 에러 코드

```typescript
enum ErrorCode {
  // 인증 관련
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // 검증 관련
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // 리소스 관련
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // 외부 서비스 관련
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  REDIS_ERROR = 'REDIS_ERROR',
  
  // 비즈니스 로직 관련
  SERVER_LIMIT_EXCEEDED = 'SERVER_LIMIT_EXCEEDED',
  INVALID_SERVER_STATE = 'INVALID_SERVER_STATE',
  METRIC_PROCESSING_ERROR = 'METRIC_PROCESSING_ERROR'
}
```

### 에러 응답 예시

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "서버 이름은 필수 항목입니다.",
    "details": {
      "field": "name",
      "rule": "required",
      "received": null
    },
    "suggestions": [
      "서버 이름을 입력해주세요.",
      "이름은 3-50자 사이여야 합니다."
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req-123456789"
}
```

---

## 📝 TypeScript 타입 정의

### 공통 타입

```typescript
// 기본 응답 타입
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
}

// 에러 타입
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  suggestions?: string[];
}

// 페이지네이션 타입
interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

### 서버 관련 타입

```typescript
interface Server {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  type: 'api' | 'database' | 'web' | 'cache';
  location: string;
  metrics: ServerMetrics;
  uptime: number;
  lastUpdate: string;
  configuration?: ServerConfiguration;
  tags: string[];
}

interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

interface ServerConfiguration {
  os: string;
  cores: number;
  ram: string;
  disk: string;
}
```

---

## 🔧 SDK 사용 예시

### JavaScript/TypeScript SDK

```typescript
import { OpenManagerAPI } from '@openmanager/sdk';

const api = new OpenManagerAPI({
  baseUrl: 'https://your-domain.vercel.app/api',
  token: 'your-jwt-token'
});

// 서버 목록 조회
const servers = await api.servers.list({
  status: 'healthy',
  limit: 10
});

// AI 질문
const response = await api.ai.query({
  query: '현재 가장 문제가 있는 서버는?'
});

// 메트릭 조회
const metrics = await api.metrics.get('server-001', {
  from: '2024-01-15T09:00:00Z',
  to: '2024-01-15T10:00:00Z',
  interval: '5m'
});
```

---

**작성자**: 개인 프로젝트 (바이브 코딩)  
**API 버전**: v1  
**문서 버전**: v5.1  
**마지막 업데이트**: 2024년 현재 