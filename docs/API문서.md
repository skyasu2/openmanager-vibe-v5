# V5 API 엔드포인트 문서

OpenManager Vibe V5의 API 엔드포인트에 대한 상세 설명입니다. 이 문서는 개발자가 API를 사용하여 모니터링 시스템과 상호작용하는 방법을 안내합니다.

## 목차

- [모니터링 API](#모니터링-api)
  - [서버 상태](#서버-상태)
  - [Redis 통계](#redis-통계)
  - [Supabase 통계](#supabase-통계)
  - [성능 데이터](#성능-데이터)
- [MCP 쿼리 API](#mcp-쿼리-api)
  - [쿼리 처리](#쿼리-처리)
  - [분석 요청](#분석-요청)
- [인증 및 보안](#인증-및-보안)
- [오류 처리](#오류-처리)
- [속도 제한](#속도-제한)

## 모니터링 API

### 서버 상태

**엔드포인트**: `GET /api/monitoring/servers`

**설명**: 모니터링 중인 서버 목록과 현재 상태 정보를 반환합니다.

**쿼리 파라미터**:
- `serverId` (선택): 특정 서버의 정보만 반환
- `status` (선택): 특정 상태의 서버만 필터링 (예: "healthy", "warning", "critical", "offline")

**응답 예시**:
```json
{
  "servers": [
    {
      "id": "web-server-1",
      "name": "웹 서버 1",
      "status": "healthy",
      "cpu": {
        "usage": 35.2,
        "cores": 4
      },
      "memory": {
        "total": 16384,
        "used": 8192,
        "usage": 50.0
      },
      "disk": {
        "total": 512000,
        "used": 256000,
        "usage": 50.0
      },
      "network": {
        "rx": 1024,
        "tx": 512,
        "connections": 245
      },
      "uptime": 1209600,
      "lastChecked": "2025-06-01T12:00:00Z"
    }
  ],
  "total": 1,
  "timestamp": "2025-06-01T12:05:00Z"
}
```

**사용 예시**:
```typescript
// 모든 서버 조회
const response = await fetch('/api/monitoring/servers');
const data = await response.json();

// 특정 서버 조회
const response = await fetch('/api/monitoring/servers?serverId=web-server-1');
const data = await response.json();

// 상태별 필터링
const response = await fetch('/api/monitoring/servers?status=warning,critical');
const data = await response.json();
```

### Redis 통계

**엔드포인트**: `GET /api/monitoring/redis-stats`

**설명**: Upstash Redis 인스턴스의 성능 및 사용량 통계를 반환합니다.

**쿼리 파라미터**:
- `period` (선택): 통계 기간 (기본값: "hour", 옵션: "hour", "day", "week", "month")

**응답 예시**:
```json
{
  "stats": {
    "commands_processed": 25463,
    "connected_clients": 12,
    "used_memory": 26214400,
    "used_memory_peak": 31457280,
    "used_memory_peak_human": "30MB",
    "used_memory_human": "25MB",
    "maxmemory": 104857600,
    "maxmemory_human": "100MB",
    "memory_usage_percentage": 25.0,
    "hit_rate": 92.5,
    "hits": 23553,
    "misses": 1910,
    "requests_per_second": 7.08
  },
  "limits": {
    "daily_requests": {
      "limit": 10000,
      "used": 3254,
      "remaining": 6746,
      "reset_at": "2025-06-02T00:00:00Z"
    }
  },
  "timestamp": "2025-06-01T12:05:00Z"
}
```

**사용 예시**:
```typescript
// 기본 시간 단위(1시간) 통계 조회
const response = await fetch('/api/monitoring/redis-stats');
const data = await response.json();

// 일간 통계 조회
const response = await fetch('/api/monitoring/redis-stats?period=day');
const data = await response.json();
```

### Supabase 통계

**엔드포인트**: `GET /api/monitoring/supabase-stats`

**설명**: Supabase 프로젝트의 데이터베이스 성능 및 사용량 통계를 반환합니다.

**쿼리 파라미터**:
- `period` (선택): 통계 기간 (기본값: "hour", 옵션: "hour", "day", "week", "month")

**응답 예시**:
```json
{
  "stats": {
    "database_size": 12582912,
    "database_size_human": "12MB",
    "tables_count": 8,
    "rows_count": {
      "servers": 24,
      "metrics": 156732,
      "alerts": 53
    },
    "queries": {
      "total": 87625,
      "reads": 85123,
      "writes": 2502,
      "slow_queries": 34
    },
    "avg_query_duration_ms": 42.5,
    "active_connections": 8,
    "max_connections": 100
  },
  "limits": {
    "storage": {
      "limit": 524288000,
      "used": 12582912,
      "remaining": 511705088,
      "used_percentage": 2.4
    }
  },
  "timestamp": "2025-06-01T12:05:00Z"
}
```

**사용 예시**:
```typescript
// 기본 시간 단위(1시간) 통계 조회
const response = await fetch('/api/monitoring/supabase-stats');
const data = await response.json();

// 월간 통계 조회
const response = await fetch('/api/monitoring/supabase-stats?period=month');
const data = await response.json();
```

### 성능 데이터

**엔드포인트**: `GET /api/monitoring/performance`

**설명**: 서버 성능 메트릭의 시계열 데이터를 반환합니다.

**쿼리 파라미터**:
- `serverId` (필수): 대상 서버 ID
- `metric` (선택): 조회할 메트릭 (기본값: "all", 옵션: "all", "cpu", "memory", "disk", "network")
- `from` (선택): 시작 시간 (ISO 형식)
- `to` (선택): 종료 시간 (ISO 형식)
- `interval` (선택): 데이터 포인트 간격 (기본값: "5m", 옵션: "1m", "5m", "15m", "30m", "1h", "6h", "12h", "1d")
- `limit` (선택): 반환할 최대 데이터 포인트 수 (기본값: 100, 최대: 1000)

**응답 예시**:
```json
{
  "serverId": "web-server-1",
  "metric": "cpu",
  "interval": "5m",
  "from": "2025-06-01T10:00:00Z",
  "to": "2025-06-01T12:00:00Z",
  "dataPoints": [
    {
      "timestamp": "2025-06-01T10:00:00Z",
      "value": 25.4
    },
    {
      "timestamp": "2025-06-01T10:05:00Z",
      "value": 27.2
    },
    {
      "timestamp": "2025-06-01T10:10:00Z",
      "value": 24.8
    },
    // ... 추가 데이터 포인트
  ],
  "summary": {
    "min": 20.5,
    "max": 45.2,
    "avg": 28.7,
    "current": 32.1
  }
}
```

**사용 예시**:
```typescript
// CPU 사용량 조회 (기본 설정)
const response = await fetch('/api/monitoring/performance?serverId=web-server-1&metric=cpu');
const data = await response.json();

// 특정 기간의 메모리 사용량 조회 (30분 간격)
const response = await fetch(
  '/api/monitoring/performance?serverId=web-server-1&metric=memory&from=2025-06-01T00:00:00Z&to=2025-06-01T23:59:59Z&interval=30m'
);
const data = await response.json();
```

## MCP 쿼리 API

### 쿼리 처리

**엔드포인트**: `POST /api/mcp/query`

**설명**: 자연어 쿼리를 처리하고 관련 모니터링 데이터를 반환합니다.

**요청 본문**:
```json
{
  "query": "웹서버의 CPU 사용량이 가장 높은 시간대는?",
  "context": {
    "serverId": "all",
    "timeRange": "today"
  }
}
```

**응답 예시**:
```json
{
  "response": {
    "text": "오늘 기준으로 웹 서버의 CPU 사용량이 가장 높았던 시간대는 14:30-15:00입니다. 이 시간에 CPU 사용률이 78.5%까지 상승했습니다.",
    "data": {
      "peak": {
        "timestamp": "2025-06-01T14:35:00Z",
        "value": 78.5,
        "serverId": "web-server-1",
        "serverName": "웹 서버 1"
      },
      "timeRange": {
        "start": "2025-06-01T14:30:00Z",
        "end": "2025-06-01T15:00:00Z"
      }
    },
    "visualization": {
      "type": "line-chart",
      "title": "웹 서버 CPU 사용량 (시간대별)",
      "xAxis": "시간",
      "yAxis": "CPU 사용률 (%)"
    }
  },
  "suggestions": [
    "해당 시간에 어떤 프로세스가 CPU를 많이 사용했나요?",
    "같은 시간대의 메모리 사용량은 어떤가요?",
    "지난 주 같은 요일과 비교해주세요"
  ]
}
```

**사용 예시**:
```typescript
const response = await fetch('/api/mcp/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: "웹서버의 CPU 사용량이 가장 높은 시간대는?",
    context: {
      serverId: "all",
      timeRange: "today"
    }
  }),
});
const data = await response.json();
```

### 분석 요청

**엔드포인트**: `POST /api/mcp/analyze`

**설명**: 특정 서버 또는 시스템 이슈에 대한 심층 분석을 요청합니다.

**요청 본문**:
```json
{
  "serverId": "web-server-1",
  "issue": "high_cpu",
  "timeRange": {
    "from": "2025-06-01T14:00:00Z",
    "to": "2025-06-01T15:00:00Z"
  },
  "options": {
    "includeProcesses": true,
    "includeRecommendations": true
  }
}
```

**응답 예시**:
```json
{
  "analysis": {
    "issue": "high_cpu",
    "severity": "warning",
    "summary": "웹 서버 1의 CPU 사용률이 14:30-15:00 시간대에 비정상적으로 증가했습니다. 이는 주로 Node.js 프로세스의 갑작스러운 부하 증가로 인한 것으로 보입니다.",
    "details": {
      "peak": {
        "timestamp": "2025-06-01T14:35:00Z",
        "value": 78.5
      },
      "baseline": {
        "average": 32.4,
        "percentile90": 45.2
      },
      "deviation": 142.3
    },
    "processes": [
      {
        "name": "node",
        "pid": 12456,
        "cpu": 65.2,
        "memory": 1024,
        "command": "node /app/server.js"
      },
      {
        "name": "nginx",
        "pid": 345,
        "cpu": 12.8,
        "memory": 256,
        "command": "nginx: worker process"
      }
    ]
  },
  "correlations": [
    {
      "metric": "network_in",
      "correlation": 0.92,
      "description": "네트워크 인바운드 트래픽과 높은 상관관계를 보입니다."
    },
    {
      "metric": "active_connections",
      "correlation": 0.88,
      "description": "활성 연결 수와 높은 상관관계를 보입니다."
    }
  ],
  "recommendations": [
    {
      "id": "scale_up",
      "title": "서버 규모 확장",
      "description": "현재 CPU 사용률이 지속적으로 70% 이상 유지되고 있습니다. 서버의 CPU 코어 수를 증가시키는 것을 고려해보세요.",
      "difficulty": "medium",
      "impact": "high"
    },
    {
      "id": "optimize_nodejs",
      "title": "Node.js 최적화",
      "description": "Node.js 애플리케이션의 성능 병목 현상을 확인하세요. 프로파일링을 통해 CPU 집약적인 작업을 식별하고 최적화할 수 있습니다.",
      "difficulty": "hard",
      "impact": "high"
    },
    {
      "id": "rate_limiting",
      "title": "속도 제한 구현",
      "description": "갑작스러운 트래픽 증가에 대비하여 API 엔드포인트에 속도 제한을 구현하세요.",
      "difficulty": "easy",
      "impact": "medium"
    }
  ]
}
```

**사용 예시**:
```typescript
const response = await fetch('/api/mcp/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    serverId: "web-server-1",
    issue: "high_cpu",
    timeRange: {
      from: "2025-06-01T14:00:00Z",
      to: "2025-06-01T15:00:00Z"
    },
    options: {
      includeProcesses: true,
      includeRecommendations: true
    }
  }),
});
const data = await response.json();
```

## 인증 및 보안

모든 API 요청은 인증이 필요합니다. 다음 두 가지 인증 방식을 지원합니다:

### 1. 세션 기반 인증 (브라우저)

브라우저 환경에서 사용자는 `/api/auth/signin` 엔드포인트를 통해 로그인해야 합니다. 로그인 후 세션 쿠키가 자동으로 관리됩니다.

### 2. API 키 인증 (서버-서버)

서버 간 통신의 경우 API 키를 사용하여 인증합니다. API 키는 요청 헤더에 포함되어야 합니다:

```
Authorization: Bearer your_api_key_here
```

API 키는 대시보드의 "설정 > API 키" 섹션에서 생성하고 관리할 수 있습니다.

## 오류 처리

모든 API 엔드포인트는 표준 HTTP 상태 코드와 일관된 오류 응답 형식을 사용합니다:

```json
{
  "error": {
    "code": "invalid_parameter",
    "message": "필수 파라미터 'serverId'가 누락되었습니다.",
    "details": {
      "parameter": "serverId"
    }
  }
}
```

### 일반적인 오류 코드

- `400 Bad Request`: 잘못된 요청 파라미터
- `401 Unauthorized`: 인증 실패
- `403 Forbidden`: 권한 부족
- `404 Not Found`: 리소스 없음
- `429 Too Many Requests`: 속도 제한 초과
- `500 Internal Server Error`: 서버 오류

## 속도 제한

API 남용을 방지하기 위해 속도 제한이 적용됩니다:

- 인증된 사용자: 분당 100 요청
- API 키: 분당 300 요청 (요금제에 따라 다름)

속도 제한 상태는 응답 헤더에서 확인할 수 있습니다:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1622551200
```

속도 제한에 도달하면 `429 Too Many Requests` 상태 코드와 함께 오류 응답이 반환됩니다.

---

이 API 문서는 OpenManager Vibe V5의 현재 버전을 기준으로 작성되었습니다. API는 지속적으로 개선되고 있으므로 최신 기능은 개발자 포털에서 확인하세요.