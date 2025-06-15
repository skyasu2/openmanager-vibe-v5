# 🌐 OpenManager Vibe v5.43.5 - API Reference

> **📅 최종 업데이트**: 2025년 6월 11일 | **🎯 상태**: 프로덕션 준비 완료  
> **✅ 검증**: 94개 API 엔드포인트 빌드 성공, 실제 연동 테스트 완료

## 🎯 API 개요

OpenManager Vibe v5.43.5는 **94개 API 엔드포인트**를 제공하는 Enterprise급 AI 서버 모니터링 솔루션입니다. 모든 API는 **TypeScript 완전 검증**을 거쳤으며, **실제 운영 환경에서 테스트 완료**되었습니다.

### 🏗️ **API 아키텍처**

- **Base URL**: `http://localhost:3000/api` (개발), `https://your-domain.com/api` (프로덕션)
- **인증**: Bearer Token (선택사항)
- **응답 형식**: JSON
- **HTTP 메서드**: GET, POST, PUT, DELETE
- **에러 핸들링**: 표준 HTTP 상태 코드

---

## 🧠 AI 엔진 API

### 🎯 **예측 분석 API**

#### **POST** `/api/ai/predict`

서버 성능 예측 및 리소스 사용량 분석

**Request Body**:

```json
{
  "metrics": [
    {
      "name": "server-1",
      "cpu_usage": 75.5,
      "memory_usage": 68.2,
      "disk_usage": 45.8,
      "response_time": 250,
      "timestamp": "2025-06-11T15:30:00Z"
    }
  ],
  "predictionHorizon": 3600,
  "analysisType": "performance"
}
```

**Response**:

```json
{
  "success": true,
  "predictions": [
    {
      "server": "server-1",
      "predictedCpu": 78.3,
      "predictedMemory": 71.8,
      "predictedDisk": 47.2,
      "confidence": 0.89,
      "riskLevel": "medium",
      "timeToThreshold": 2850,
      "recommendations": [
        "메모리 사용률 모니터링 강화",
        "CPU 부하 분산 고려"
      ]
    }
  ],
  "processingTime": 85,
  "engine": "UnifiedAIEngine",
  "timestamp": "2025-06-11T15:30:01Z"
}
```

**상태 코드**:

- `200`: 성공
- `400`: 잘못된 요청 (필수 파라미터 누락)
- `500`: 내부 서버 오류

---

### 🔍 **이상 탐지 API**

#### **POST** `/api/ai/anomaly-detection`

서버 메트릭 이상 패턴 탐지 및 분석

**Request Body**:

```json
{
  "serverMetrics": [
    {
      "serverId": "server-1",
      "metrics": {
        "cpu": [75, 78, 82, 89, 95],
        "memory": [68, 70, 72, 75, 79],
        "network": [120, 125, 130, 145, 160]
      },
      "timeWindow": 1800
    }
  ],
  "sensitivity": "high",
  "algorithm": "isolation-forest"
}
```

**Response**:

```json
{
  "success": true,
  "anomalies": [
    {
      "serverId": "server-1",
      "anomalyType": "cpu_spike",
      "severity": "high",
      "detectedAt": "2025-06-11T15:28:45Z",
      "confidence": 0.94,
      "affectedMetrics": ["cpu_usage", "response_time"],
      "description": "CPU 사용률이 평소보다 40% 높음",
      "possibleCauses": [
        "백그라운드 프로세스 증가",
        "메모리 누수로 인한 CPU 부하"
      ]
    }
  ],
  "overallRisk": "medium",
  "riskScore": 0.67,
  "recommendations": [
    {
      "priority": "high",
      "action": "CPU 사용률 즉시 확인",
      "details": "top 명령어로 프로세스 분석"
    }
  ],
  "processingTime": 120,
  "analysisDepth": "comprehensive"
}
```

---

### 🤖 **통합 AI 분석 API**

#### **POST** `/api/ai/unified`

Multi-AI 엔진을 활용한 종합 분석

**Request Body**:

```json
{
  "query": "server-cluster-1의 성능 이슈를 분석해주세요",
  "context": {
    "serverGroup": "cluster-1",
    "timeRange": "last-24h",
    "includeHistorical": true
  },
  "enginePreference": ["google-ai", "unified", "rag"],
  "options": {
    "maxTokens": 4096,
    "temperature": 0.1,
    "includeRecommendations": true
  }
}
```

**Response**:

```json
{
  "success": true,
  "content": "server-cluster-1 분석 결과:\n\n**현재 상태**:\n- CPU 평균 사용률: 78% (정상 범위)\n- 메모리 사용률: 85% (주의 필요)\n- 디스크 I/O: 높은 부하 감지\n\n**주요 이슈**:\n1. 메모리 사용률이 지속적으로 증가\n2. 디스크 I/O 병목 현상\n\n**권장사항**:\n1. 메모리 누수 점검\n2. 디스크 성능 최적화",
  "confidence": 0.92,
  "contributingEngines": [
    {
      "engine": "GoogleAIService",
      "contribution": 0.6,
      "responseTime": 2340
    },
    {
      "engine": "LocalRAGEngine", 
      "contribution": 0.3,
      "responseTime": 45
    },
    {
      "engine": "UnifiedAIEngine",
      "contribution": 0.1,
      "responseTime": 120
    }
  ],
  "processingTime": 2505,
  "metadata": {
    "analysisType": "comprehensive",
    "dataPoints": 1247,
    "contextRelevance": 0.88
  }
}
```

---

### 📊 **AI 엔진 상태 API**

#### **GET** `/api/ai/engines/status`

모든 AI 엔진의 현재 상태 조회

**Response**:

```json
{
  "timestamp": "2025-06-11T15:30:00Z",
  "masterEngine": {
    "status": "healthy",
    "version": "v4.0.0",
    "uptime": 3600,
    "totalRequests": 1247,
    "avgResponseTime": 95,
    "memoryUsage": "70MB",
    "cpuUsage": "12%"
  },
  "engines": [
    {
      "name": "GoogleAIService",
      "status": "active",
      "availability": 99.9,
      "lastResponseTime": 2340,
      "rateLimit": {
        "rpm": 15,
        "daily": 1500,
        "current": {
          "minute": 8,
          "day": 234
        }
      },
      "cacheHitRate": 0.75
    },
    {
      "name": "UnifiedAIEngine",
      "status": "active", 
      "components": 11,
      "activeComponents": 11,
      "avgConfidence": 0.87,
      "fusionSuccess": 0.94
    },
    {
      "name": "LocalRAGEngine",
      "status": "active",
      "documentCount": 3,
      "indexSize": "2.4MB",
      "queryResponseTime": 10
    }
  ],
  "degradationManager": {
    "tier1Health": "healthy",
    "tier2Health": "healthy", 
    "tier3Health": "standby",
    "fallbackCount": 0
  }
}
```

---

### 🔄 **AI 엔진 헬스 체크**

#### **GET** `/api/ai/health`

AI 시스템 전체 건강 상태 점검

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2025-06-11T15:30:00Z",
  "checks": {
    "masterEngine": {
      "status": "pass",
      "responseTime": 5,
      "details": "MasterAIEngine v4.0.0 정상 동작"
    },
    "googleAI": {
      "status": "pass",
      "responseTime": 2340,
      "details": "Google AI Studio 베타 연결 정상"
    },
    "unifiedEngine": {
      "status": "pass",
      "componentHealth": 11,
      "details": "모든 컴포넌트 정상"
    },
    "ragEngine": {
      "status": "pass",
      "indexHealth": "optimal",
      "details": "문서 인덱스 최신 상태"
    }
  },
  "overallHealth": "pass",
  "recommendedActions": []
}
```

---

## 📊 모니터링 및 메트릭 API

### 📈 **성능 메트릭 API**

#### **GET** `/api/metrics/performance`

시스템 성능 메트릭 조회

**Query Parameters**:

- `timeRange`: `1h`, `6h`, `24h`, `7d` (기본값: `1h`)
- `aggregation`: `avg`, `max`, `min` (기본값: `avg`)
- `metrics`: `cpu,memory,disk,network` (기본값: 모든 메트릭)

**Response**:

```json
{
  "timeRange": "1h",
  "aggregation": "avg",
  "data": {
    "timestamp": "2025-06-11T15:30:00Z",
    "system": {
      "cpu": {
        "average": 23.5,
        "peak": 78.2,
        "trend": "stable"
      },
      "memory": {
        "used": "70MB",
        "total": "8GB",
        "percentage": 0.9,
        "trend": "increasing"
      },
      "responseTime": {
        "ai": 95,
        "database": 35,
        "cache": 36
      }
    },
    "aiEngines": {
      "totalRequests": 1247,
      "successRate": 0.994,
      "avgProcessingTime": 120,
      "cacheHitRate": 0.78
    }
  }
}
```

---

### 🔍 **실시간 로그 스트림 API**

#### **GET** `/api/ai/logging/stream`

Server-Sent Events를 통한 실시간 로그 스트림

**Headers**:

```
Accept: text/event-stream
Cache-Control: no-cache
```

**Response Stream**:

```
data: {"id":"ai-log-1749656321679","timestamp":"2025-06-11T15:30:00Z","level":"info","category":"ai_engine","engine":"MasterAIEngine","message":"✅ 요청 처리 완료","metadata":{"responseTime":95}}

data: {"id":"ai-log-1749656321680","timestamp":"2025-06-11T15:30:01Z","level":"debug","category":"google_ai","engine":"GoogleAIService","message":"API 요청 전송","metadata":{"model":"gemini-1.5-flash"}}
```

**JavaScript 클라이언트 예제**:

```javascript
const eventSource = new EventSource('/api/ai/logging/stream');

eventSource.onmessage = function(event) {
  const logEntry = JSON.parse(event.data);
  console.log('실시간 로그:', logEntry);
};

eventSource.onerror = function(event) {
  console.error('로그 스트림 오류:', event);
};
```

---

## 🗄️ 데이터베이스 API

### 📊 **Supabase 연결 테스트**

#### **GET** `/api/test-context-db`

Supabase PostgreSQL 연결 상태 확인

**Response**:

```json
{
  "success": true,
  "connection": {
    "status": "connected",
    "host": "db.vnswjnltnhpsueosfhmw.supabase.co",
    "region": "ap-southeast-1",
    "responseTime": 35,
    "ssl": true
  },
  "database": {
    "version": "PostgreSQL 15.1",
    "extensions": ["pgvector", "uuid-ossp"],
    "tables": ["servers", "metrics", "ai_logs"],
    "storageUsed": "15.2MB"
  },
  "timestamp": "2025-06-11T15:30:00Z"
}
```

---

### ⚡ **Redis 캐시 테스트**

#### **GET** `/api/test-redis`

Upstash Redis 연결 및 성능 테스트

**Response**:

```json
{
  "success": true,
  "connection": {
    "status": "connected",
    "host": "charming-condor-46598.upstash.io",
    "port": 6379,
    "ssl": true,
    "responseTime": 36
  },
  "performance": {
    "setOperation": 12,
    "getOperation": 8,
    "pingLatency": 36
  },
  "memory": {
    "used": "2.1KB",
    "maxMemory": "100MB",
    "usage": 0.0003
  },
  "info": {
    "version": "6.2.6",
    "uptime": 86400,
    "connectedClients": 1
  }
}
```

---

## 🔔 알림 시스템 API

### 📱 **Slack 웹훅 테스트**

#### **POST** `/api/test/slack`

Slack 웹훅 연동 테스트

**Request Body**:

```json
{
  "message": "OpenManager Vibe v5 - 테스트 알림",
  "level": "info",
  "includeSystemStatus": true
}
```

**Response**:

```json
{
  "success": true,
  "webhook": {
    "status": "sent",
    "responseTime": 450,
    "slackResponse": "ok"
  },
  "message": {
    "title": "OpenManager Vibe v5 - 테스트 알림",
    "timestamp": "2025-06-11T15:30:00Z",
    "delivered": true
  }
}
```

---

### 🔄 **알림 상태 조회**

#### **GET** `/api/notifications/status`

알림 시스템 전체 상태 확인

**Response**:

```json
{
  "status": "active",
  "channels": {
    "slack": {
      "enabled": true,
      "webhook": "configured",
      "lastSent": "2025-06-11T15:25:00Z",
      "successRate": 0.998,
      "avgResponseTime": 420
    },
    "email": {
      "enabled": false,
      "smtp": "not_configured"
    }
  },
  "recentAlerts": [
    {
      "id": "alert-001",
      "type": "info",
      "message": "시스템 테스트 완료",
      "sentAt": "2025-06-11T15:25:00Z",
      "delivered": true
    }
  ],
  "statistics": {
    "totalSent": 156,
    "successfulDeliveries": 155,
    "failedDeliveries": 1,
    "deliveryRate": 0.994
  }
}
```

---

## 🌐 시스템 관리 API

### 🔧 **시스템 상태 조회**

#### **GET** `/api/status`

전체 시스템 상태 종합 조회

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2025-06-11T15:30:00Z",
  "version": "5.43.5",
  "environment": "production",
  "uptime": 3600,
  "services": {
    "aiEngine": {
      "status": "healthy",
      "engines": 11,
      "activeEngines": 11,
      "avgResponseTime": 95
    },
    "database": {
      "supabase": {
        "status": "connected",
        "responseTime": 35
      },
      "redis": {
        "status": "connected", 
        "responseTime": 36
      }
    },
    "notifications": {
      "slack": "active",
      "email": "disabled"
    },
    "mcp": {
      "status": "fallback_mode",
      "servers": ["filesystem", "github", "openmanager-docs"]
    }
  },
  "metrics": {
    "totalRequests": 1247,
    "errorRate": 0.006,
    "avgResponseTime": 125,
    "memoryUsage": "70MB",
    "cpuUsage": "15%"
  }
}
```

---

### 🏥 **헬스 체크**

#### **GET** `/api/health`

시스템 헬스 체크 (Kubernetes readiness/liveness)

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2025-06-11T15:30:00Z",
  "checks": {
    "ai_engine": "pass",
    "database": "pass", 
    "cache": "pass",
    "external_apis": "pass"
  },
  "details": {
    "ai_engine": {
      "masterEngine": "healthy",
      "engines": 11,
      "degradationLevel": 0
    },
    "database": {
      "supabase": "connected",
      "redis": "connected"
    },
    "cache": {
      "hitRate": 0.78,
      "avgLatency": 36
    }
  }
}
```

---

## 🔧 유틸리티 API

### 🏓 **핑 테스트**

#### **GET** `/api/ping`

기본 연결 테스트

**Response**:

```json
{
  "success": true,
  "message": "pong",
  "timestamp": "2025-06-11T15:30:00Z",
  "responseTime": 1,
  "version": "5.43.5"
}
```

---

### 📋 **버전 정보**

#### **GET** `/api/version/status`

상세 버전 및 빌드 정보

**Response**:

```json
{
  "version": "5.43.5",
  "buildDate": "2025-06-11T15:00:00Z",
  "gitCommit": "abc123def456",
  "environment": "production",
  "features": {
    "aiEngines": 11,
    "multiAI": true,
    "realTimeMonitoring": true,
    "slackIntegration": true
  },
  "dependencies": {
    "nextjs": "15.3.3",
    "typescript": "5.x",
    "node": "18.x"
  },
  "buildInfo": {
    "pages": 94,
    "apis": 94,
    "bundleSize": "70MB",
    "buildTime": "10s"
  }
}
```

---

## 📊 에러 응답 형식

### 🚨 **표준 에러 응답**

모든 API는 일관된 에러 형식을 사용합니다:

```json
{
  "success": false,
  "error": {
    "code": "AI_ENGINE_ERROR",
    "message": "AI 엔진 처리 중 오류가 발생했습니다",
    "details": {
      "engine": "GoogleAIService",
      "reason": "API rate limit exceeded",
      "retryAfter": 60
    },
    "timestamp": "2025-06-11T15:30:00Z",
    "requestId": "req-123456789"
  }
}
```

### 📋 **에러 코드 목록**

| 코드 | HTTP 상태 | 설명 |
|------|-----------|------|
| `VALIDATION_ERROR` | 400 | 요청 데이터 검증 실패 |
| `AUTH_ERROR` | 401 | 인증 실패 |
| `PERMISSION_DENIED` | 403 | 권한 부족 |
| `NOT_FOUND` | 404 | 리소스를 찾을 수 없음 |
| `RATE_LIMIT_EXCEEDED` | 429 | 요청 한도 초과 |
| `AI_ENGINE_ERROR` | 500 | AI 엔진 처리 오류 |
| `DATABASE_ERROR` | 500 | 데이터베이스 연결 오류 |
| `EXTERNAL_API_ERROR` | 502 | 외부 API 호출 실패 |
| `SERVICE_UNAVAILABLE` | 503 | 서비스 일시 중단 |

---

## 🔒 인증 및 보안

### 🛡️ **API 키 인증** (선택사항)

일부 관리용 API는 인증이 필요할 수 있습니다:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/api/admin/monitoring
```

### 🔐 **CORS 설정**

개발 환경에서는 모든 오리진을 허용하며, 프로덕션에서는 허용된 도메인만 접근 가능합니다.

---

## 📞 지원 및 문제 해결

### 🔧 **API 테스트 도구**

#### **cURL 예제**

```bash
# AI 예측 API 테스트
curl -X POST http://localhost:3000/api/ai/predict \
  -H "Content-Type: application/json" \
  -d '{"metrics":[{"name":"server-1","cpu_usage":75.5}],"predictionHorizon":3600}'

# 실시간 로그 스트림
curl -N http://localhost:3000/api/ai/logging/stream

# 시스템 상태 확인
curl http://localhost:3000/api/status
```

#### **JavaScript 예제**

```javascript
// AI 예측 API 호출
const response = await fetch('/api/ai/predict', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    metrics: [{
      name: 'server-1',
      cpu_usage: 75.5,
      memory_usage: 68.2
    }],
    predictionHorizon: 3600
  })
});

const result = await response.json();
console.log('예측 결과:', result);
```

### 🆘 **지원 채널**

- **실시간 상태**: `/api/status`
- **헬스 체크**: `/api/health`
- **로그 스트림**: `/api/ai/logging/stream`
- **문제 리포트**: GitHub Issues

---

> 📝 **API 문서 정보**  
> **작성일**: 2025년 6월 11일  
> **버전**: v5.43.5 API Reference  
> **상태**: 94개 엔드포인트 프로덕션 준비 완료  
> **다음 업데이트**: v5.44.0 GraphQL API 추가 예정
