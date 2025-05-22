# API 문서

OpenManager Vibe V5는 다양한 API 엔드포인트를 제공하여 서버 모니터링 및 AI 기반 분석 기능을 접근할 수 있게 합니다.

## 🔑 인증

모든 API 요청은 API 키 또는 세션 토큰을 통한 인증이 필요합니다.

```typescript
// API 키 인증 예시
fetch('/api/servers/status', {
  headers: {
    'Authorization': `Bearer ${API_KEY}`
  }
});

// 세션 인증 예시
fetch('/api/user/preferences', {
  headers: {
    'Cookie': `session=${SESSION_TOKEN}`
  }
});
```

## 📊 기본 API 응답 형식

모든 API 응답은 다음과 같은 일관된 형식을 사용합니다:

```typescript
{
  success: boolean;           // 요청 성공 여부
  data?: any;                 // 성공 시 반환 데이터
  error?: {                   // 실패 시 오류 정보
    code: string;             // 오류 코드
    message: string;          // 오류 메시지
    details?: any;            // 추가 디버깅 정보
  };
  timestamp: string;          // 응답 생성 시간 (ISO 형식)
}
```

## 🛠 API 엔드포인트

### 상태 확인

#### `GET /api/health`
시스템 상태를 확인합니다.

**응답:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "5.0.1",
    "uptime": "3d 4h 12m",
    "services": {
      "redis": "connected",
      "supabase": "connected",
      "mcp": "active"
    }
  },
  "timestamp": "2024-12-29T12:30:45Z"
}
```

### 서버 모니터링

#### `GET /api/monitoring/servers`
모든 서버의 현재 상태를 조회합니다.

**쿼리 파라미터:**
- `limit` (선택): 반환할 최대 서버 수 (기본값: 10)
- `status` (선택): 필터링할 상태 ('running', 'error', 'warning', 'stopped')

**응답:**
```json
{
  "success": true,
  "data": {
    "servers": [
      {
        "id": "srv-001",
        "name": "메인 웹서버",
        "status": "running",
        "cpu": 32,
        "memory": 45,
        "lastUpdate": "2024-12-29T12:25:30Z"
      }
    ],
    "total": 1
  },
  "timestamp": "2024-12-29T12:30:00Z"
}
```

#### `GET /api/monitoring/servers/{serverId}`
특정 서버의 상세 정보를 조회합니다.

**URL 파라미터:**
- `serverId`: 서버 ID

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "srv-001",
    "name": "메인 웹서버",
    "status": "running",
    "cpu": 32,
    "memory": 45,
    "diskUsage": 68,
    "network": {
      "in": 120,
      "out": 45
    },
    "processes": [
      {
        "name": "nginx",
        "cpu": 2.5,
        "memory": 120
      }
    ],
    "lastUpdate": "2024-12-29T12:25:30Z"
  },
  "timestamp": "2024-12-29T12:30:00Z"
}
```

### MCP 자연어 처리

#### `POST /api/mcp/query`
자연어 쿼리를 처리합니다.

**요청 본문:**
```json
{
  "query": "서버 CPU 사용량이 높은 이유는 무엇인가요?",
  "context": {
    "serverId": "srv-001"
  }
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "response": "현재 서버 srv-001의 CPU 사용량이 높은 주요 원인은 다수의 Node.js 프로세스입니다. 특히 'worker.js'가 CPU의 15%를 사용하고 있습니다. 작업 대기열을 확인하고 필요하지 않은 작업을 중지하거나 리소스 제한을 설정하는 것이 좋겠습니다.",
    "category": "performance_analysis",
    "confidence": 0.92,
    "timestamp": "2024-12-29T12:32:10Z"
  },
  "timestamp": "2024-12-29T12:32:10Z"
}
```

### 성능 메트릭

#### `GET /api/monitoring/performance`
시스템 성능 메트릭을 조회합니다.

**쿼리 파라미터:**
- `period` (선택): 메트릭 기간 ('1h', '6h', '24h', '7d') (기본값: '1h')
- `interval` (선택): 데이터 포인트 간격 (초) (기본값: 300)

**응답:**
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "timestamp": "2024-12-29T11:30:00Z",
        "serverCount": 5,
        "avgCpu": 28.5,
        "avgMemory": 42.1,
        "alertCount": 2
      },
      {
        "timestamp": "2024-12-29T12:00:00Z",
        "serverCount": 5,
        "avgCpu": 30.2,
        "avgMemory": 45.6,
        "alertCount": 3
      },
      {
        "timestamp": "2024-12-29T12:30:00Z",
        "serverCount": 5,
        "avgCpu": 32.4,
        "avgMemory": 46.8,
        "alertCount": 3
      }
    ],
    "period": "1h",
    "interval": 1800
  },
  "timestamp": "2024-12-29T12:32:15Z"
}
```

### 관리 API

#### `POST /api/servers`
새로운 서버를 등록합니다.

**요청 본문:**
```json
{
  "name": "데이터베이스 서버",
  "location": "서울",
  "type": "database",
  "credentials": {
    "apiKey": "sk_server_xxxxx"
  }
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "srv-002",
    "name": "데이터베이스 서버",
    "status": "pending",
    "message": "서버 등록 완료. 초기 상태 수집 중..."
  },
  "timestamp": "2024-12-29T12:35:00Z"
}
```

## 🚨 오류 코드

| 코드 | 설명 |
|------|------|
| `AUTH_REQUIRED` | 인증이 필요합니다 |
| `INVALID_CREDENTIALS` | 잘못된 인증 정보 |
| `RESOURCE_NOT_FOUND` | 요청한 리소스를 찾을 수 없음 |
| `RATE_LIMIT_EXCEEDED` | API 요청 한도 초과 |
| `SERVER_ERROR` | 내부 서버 오류 |
| `VALIDATION_ERROR` | 요청 데이터 유효성 검증 오류 |

## 📌 API 버전 관리

현재 API 버전은 v1입니다. 모든 엔드포인트는 다음과 같이 접근할 수 있습니다:

```
https://openmanager-vibe-v5.vercel.app/api/v1/{endpoint}
```

버전이 명시되지 않은 경우 기본적으로 최신 버전을 사용합니다. 