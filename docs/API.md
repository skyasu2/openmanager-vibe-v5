# 📡 OpenManager Vibe v5.44.0 - API 참조 가이드

> **📅 최종 업데이트**: 2025년 6월 15일  
> **🎯 버전**: v5.44.0  
> **✅ 상태**: 94개 API 엔드포인트 완전 문서화  
> **📝 통합 문서**: api-reference-v5.43.5.md, technical-implementation-v5.43.5.md 내용 통합

OpenManager Vibe v5.44.0의 **완전한 API 참조 문서**입니다.

## 🎯 API 개요

OpenManager Vibe v5는 RESTful API와 실시간 WebSocket API를 제공합니다.

### Base URL

- **개발**: `http://localhost:3000/api`
- **프로덕션**: `https://your-domain.com/api`

### 인증

```bash
# API 키 기반 인증
curl -H "X-API-Key: your_api_key" \
     https://your-domain.com/api/servers
```

## 🖥️ 서버 관리 API

### GET /servers

모든 서버 목록 조회

```bash
curl -X GET /api/servers
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "server-1",
      "name": "Production Server",
      "status": "online",
      "type": "web",
      "location": "Seoul",
      "metrics": {
        "cpu": 45.2,
        "memory": 67.8,
        "disk": 89.1,
        "network": {
          "rx": 1024000,
          "tx": 512000
        }
      },
      "lastUpdate": "2025-01-31T10:30:00Z"
    }
  ],
  "total": 1,
  "timestamp": "2025-01-31T10:30:00Z"
}
```

### GET /servers/{id}

특정 서버 상세 정보 조회

```bash
curl -X GET /api/servers/server-1
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "server-1",
    "name": "Production Server",
    "status": "online",
    "type": "web",
    "location": "Seoul",
    "specs": {
      "cpu": "Intel Xeon E5-2686 v4",
      "memory": "32GB DDR4",
      "disk": "1TB NVMe SSD",
      "network": "10Gbps"
    },
    "metrics": {
      "cpu": {
        "current": 45.2,
        "average": 52.1,
        "peak": 89.5
      },
      "memory": {
        "used": 21474836480,
        "total": 34359738368,
        "percentage": 67.8
      },
      "disk": {
        "used": 964689920000,
        "total": 1099511627776,
        "percentage": 89.1
      }
    },
    "health": {
      "uptime": 2592000,
      "lastReboot": "2025-01-01T00:00:00Z",
      "services": [
        {
          "name": "nginx",
          "status": "running",
          "port": 80
        },
        {
          "name": "nodejs",
          "status": "running",
          "port": 3000
        }
      ]
    }
  }
}
```

### POST /servers

새 서버 등록

```bash
curl -X POST /api/servers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Server",
    "type": "database",
    "location": "Busan",
    "endpoint": "192.168.1.100",
    "port": 22
  }'
```

### PUT /servers/{id}

서버 정보 업데이트

```bash
curl -X PUT /api/servers/server-1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Server Name",
    "location": "Incheon"
  }'
```

### DELETE /servers/{id}

서버 삭제

```bash
curl -X DELETE /api/servers/server-1
```

## 🤖 AI 분석 API

### POST /ai/predict

AI 기반 예측 분석

```bash
curl -X POST /api/ai/predict \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "server-1",
    "metrics": {
      "cpu": [45.2, 48.1, 52.3, 46.7],
      "memory": [67.8, 69.2, 71.5, 68.9],
      "timeRange": "1h"
    },
    "predictionType": "performance"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "predictions": {
      "cpu": {
        "next1h": 49.2,
        "next4h": 52.8,
        "next24h": 48.5,
        "trend": "stable",
        "confidence": 0.89
      },
      "memory": {
        "next1h": 70.1,
        "next4h": 73.2,
        "next24h": 71.8,
        "trend": "increasing",
        "confidence": 0.92
      },
      "alerts": [
        {
          "type": "warning",
          "metric": "memory",
          "threshold": 80,
          "expectedTime": "2025-01-31T14:30:00Z",
          "recommendation": "메모리 사용량 증가 추세. 불필요한 프로세스 정리 권장"
        }
      ]
    },
    "analysisId": "analysis-12345",
    "timestamp": "2025-01-31T10:30:00Z"
  }
}
```

### POST /ai/anomaly-detection

이상 탐지 분석

```bash
curl -X POST /api/ai/anomaly-detection \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "server-1",
    "timeRange": "24h",
    "sensitivity": 0.8
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "anomalies": [
      {
        "timestamp": "2025-01-31T08:15:00Z",
        "metric": "cpu",
        "value": 95.2,
        "expectedRange": [40, 60],
        "severity": "high",
        "duration": 300,
        "description": "CPU 사용률이 정상 범위를 초과했습니다",
        "possibleCauses": [
          "높은 트래픽 증가",
          "백그라운드 프로세스 실행",
          "메모리 부족으로 인한 스와핑"
        ]
      }
    ],
    "summary": {
      "totalAnomalies": 1,
      "severityDistribution": {
        "low": 0,
        "medium": 0,
        "high": 1,
        "critical": 0
      },
      "affectedMetrics": ["cpu"],
      "overallScore": 0.85
    }
  }
}
```

### POST /ai/recommendations

AI 추천 시스템

```bash
curl -X POST /api/ai/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "server-1",
    "context": "performance_optimization"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "rec-1",
        "type": "performance",
        "priority": "high",
        "title": "메모리 최적화",
        "description": "현재 메모리 사용률이 높습니다. 다음 조치를 권장합니다.",
        "actions": [
          {
            "action": "restart_service",
            "target": "nginx",
            "impact": "메모리 사용량 15% 감소 예상"
          },
          {
            "action": "clear_cache",
            "target": "application_cache",
            "impact": "메모리 사용량 8% 감소 예상"
          }
        ],
        "estimatedImpact": {
          "performance": "+15%",
          "reliability": "+10%",
          "cost": "No change"
        },
        "confidence": 0.92
      }
    ],
    "totalRecommendations": 1,
    "timestamp": "2025-01-31T10:30:00Z"
  }
}
```

## 📊 메트릭 API

### GET /metrics/{serverId}

서버 메트릭 히스토리 조회

```bash
curl -X GET "/api/metrics/server-1?timeRange=24h&interval=1h"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "serverId": "server-1",
    "timeRange": "24h",
    "interval": "1h",
    "metrics": [
      {
        "timestamp": "2025-01-31T09:00:00Z",
        "cpu": 45.2,
        "memory": 67.8,
        "disk": 89.1,
        "network": {
          "rx": 1024000,
          "tx": 512000
        }
      }
    ],
    "aggregations": {
      "cpu": {
        "min": 32.1,
        "max": 78.9,
        "avg": 48.5,
        "current": 45.2
      },
      "memory": {
        "min": 62.3,
        "max": 71.2,
        "avg": 67.1,
        "current": 67.8
      }
    }
  }
}
```

### POST /metrics/{serverId}

메트릭 데이터 추가

```bash
curl -X POST /api/metrics/server-1 \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2025-01-31T10:30:00Z",
    "cpu": 48.5,
    "memory": 69.2,
    "disk": 89.3,
    "network": {
      "rx": 1126400,
      "tx": 563200
    },
    "processes": [
      {
        "name": "nginx",
        "cpu": 5.2,
        "memory": 128000000
      }
    ]
  }'
```

## 🔔 알림 API

### GET /notifications

알림 목록 조회

```bash
curl -X GET "/api/notifications?status=unread&limit=10"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "notif-1",
      "type": "alert",
      "severity": "warning",
      "title": "높은 CPU 사용률 감지",
      "message": "server-1의 CPU 사용률이 90%를 초과했습니다",
      "serverId": "server-1",
      "status": "unread",
      "createdAt": "2025-01-31T10:25:00Z",
      "metadata": {
        "metric": "cpu",
        "value": 92.5,
        "threshold": 90
      }
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "hasMore": true
  }
}
```

### POST /notifications

새 알림 생성

```bash
curl -X POST /api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "type": "maintenance",
    "severity": "info",
    "title": "예정된 서버 점검",
    "message": "2025-02-01 02:00-04:00 서버 점검 예정",
    "serverId": "server-1",
    "scheduledFor": "2025-02-01T02:00:00Z"
  }'
```

### PUT /notifications/{id}/read

알림 읽음 처리

```bash
curl -X PUT /api/notifications/notif-1/read
```

## 🔄 실시간 WebSocket API

### 연결 설정

```javascript
// WebSocket 연결
const ws = new WebSocket('wss://your-domain.com/api/websocket');

ws.onopen = () => {
  console.log('WebSocket 연결됨');

  // 구독 설정
  ws.send(
    JSON.stringify({
      type: 'subscribe',
      channel: 'server-metrics',
      serverId: 'server-1',
    })
  );
};

ws.onmessage = event => {
  const data = JSON.parse(event.data);
  console.log('실시간 데이터:', data);
};
```

### 메시지 형식

#### 구독 요청

```json
{
  "type": "subscribe",
  "channel": "server-metrics",
  "serverId": "server-1",
  "interval": 5000
}
```

#### 실시간 메트릭 데이터

```json
{
  "type": "metrics",
  "serverId": "server-1",
  "timestamp": "2025-01-31T10:30:00Z",
  "data": {
    "cpu": 48.5,
    "memory": 69.2,
    "disk": 89.3,
    "network": {
      "rx": 1126400,
      "tx": 563200
    }
  }
}
```

#### 알림 데이터

```json
{
  "type": "alert",
  "serverId": "server-1",
  "severity": "warning",
  "message": "CPU 사용률이 임계값을 초과했습니다",
  "timestamp": "2025-01-31T10:30:00Z"
}
```

## 🔧 관리 API

### GET /admin/health

시스템 헬스 체크

```bash
curl -X GET /api/admin/health
```

**Response:**

```json
{
  "status": "healthy",
  "version": "v5.43.4",
  "timestamp": "2025-01-31T10:30:00Z",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 15,
      "connections": 8
    },
    "redis": {
      "status": "healthy",
      "responseTime": 3,
      "memory": "45MB"
    },
    "ai": {
      "status": "healthy",
      "model": "gemini-1.5-flash",
      "responseTime": 1200
    }
  },
  "metrics": {
    "uptime": 86400,
    "requestCount": 15420,
    "errorRate": 0.02
  }
}
```

### GET /admin/stats

시스템 통계

```bash
curl -X GET /api/admin/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "servers": {
      "total": 25,
      "online": 23,
      "offline": 1,
      "maintenance": 1
    },
    "metrics": {
      "totalDataPoints": 1250000,
      "dailyAverage": 52000,
      "retentionDays": 90
    },
    "ai": {
      "totalQueries": 8420,
      "averageResponseTime": 1.2,
      "successRate": 0.998
    },
    "alerts": {
      "total": 145,
      "resolved": 142,
      "pending": 3
    }
  }
}
```

## 📝 에러 코드

### HTTP 상태 코드

| 코드 | 의미                  | 설명        |
| ---- | --------------------- | ----------- |
| 200  | OK                    | 성공        |
| 201  | Created               | 생성 성공   |
| 400  | Bad Request           | 잘못된 요청 |
| 401  | Unauthorized          | 인증 필요   |
| 403  | Forbidden             | 권한 없음   |
| 404  | Not Found             | 리소스 없음 |
| 429  | Too Many Requests     | 요청 초과   |
| 500  | Internal Server Error | 서버 오류   |

### 에러 응답 형식

```json
{
  "success": false,
  "error": {
    "code": "INVALID_SERVER_ID",
    "message": "서버 ID가 유효하지 않습니다",
    "details": {
      "serverId": "invalid-id",
      "validFormat": "server-{number}"
    },
    "timestamp": "2025-01-31T10:30:00Z",
    "requestId": "req-12345"
  }
}
```

## 🔐 보안

### API 키 관리

```bash
# API 키 헤더
X-API-Key: your_api_key_here

# 또는 Bearer 토큰
Authorization: Bearer your_jwt_token
```

### 요청 제한

| 엔드포인트     | 제한      | 기간 |
| -------------- | --------- | ---- |
| `/api/servers` | 100 요청  | 1분  |
| `/api/ai/*`    | 20 요청   | 1분  |
| `/api/metrics` | 1000 요청 | 1분  |

## 📚 SDK 및 라이브러리

### JavaScript/TypeScript SDK

```bash
npm install @openmanager/sdk
```

```typescript
import { OpenManagerClient } from '@openmanager/sdk';

const client = new OpenManagerClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://your-domain.com/api',
});

// 서버 목록 조회
const servers = await client.servers.list();

// AI 분석 요청
const analysis = await client.ai.predict({
  serverId: 'server-1',
  metrics: { cpu: [45, 48, 52] },
});
```

### Python SDK

```bash
pip install openmanager-sdk
```

```python
from openmanager import Client

client = Client(
    api_key='your_api_key',
    base_url='https://your-domain.com/api'
)

# 서버 목록 조회
servers = client.servers.list()

# AI 분석 요청
analysis = client.ai.predict(
    server_id='server-1',
    metrics={'cpu': [45, 48, 52]}
)
```

## 🧪 API 테스트

### Postman Collection

```json
{
  "info": {
    "name": "OpenManager Vibe v5 API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "apikey",
    "apikey": [
      {
        "key": "key",
        "value": "X-API-Key",
        "type": "string"
      },
      {
        "key": "value",
        "value": "{{api_key}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "https://your-domain.com/api"
    },
    {
      "key": "api_key",
      "value": "your_api_key_here"
    }
  ]
}
```

### curl 스크립트

```bash
#!/bin/bash
# test-api.sh

API_KEY="your_api_key"
BASE_URL="https://your-domain.com/api"

# 서버 목록 조회
echo "Testing GET /servers..."
curl -s -H "X-API-Key: $API_KEY" "$BASE_URL/servers" | jq .

# AI 분석 테스트
echo "Testing POST /ai/predict..."
curl -s -X POST \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"serverId":"server-1","metrics":{"cpu":[45,48,52]}}' \
  "$BASE_URL/ai/predict" | jq .

echo "API 테스트 완료"
```

## 📖 변경 로그

### v5.43.4 (2025-01-31)

- AI 분석 API 성능 개선
- 새로운 이상 탐지 알고리즘 추가
- WebSocket 안정성 향상

### v5.43.0 (2025-01-15)

- AI 아키텍처 완전 리팩토링
- Google AI Studio 통합
- MCP 프로토콜 지원 추가

## 🔗 관련 링크

- [🚀 Quick Start](QUICK_START.md)
- [🛠️ Development Guide](DEVELOPMENT.md)
- [🤖 AI Setup](AI_SETUP.md)
- [☁️ Deployment](DEPLOYMENT.md)


## 🖥️ 서버 모니터링 API

### GET /api/servers/realtime
실시간 서버 데이터 조회

**설정 정보:**
- 총 서버 수: 15개
- 업데이트 간격: 30초
- 심각 상태: 15% (2개)
- 경고 상태: 30% (4개)

**응답 예시:**
```json
{
  "servers": [
    {
      "id": "server-1",
      "name": "웹서버-1",
      "status": "running",
      "cpu": 45.2,
      "memory": 67.8,
      "disk": 23.1,
      "network": 12.5
    }
  ],
  "summary": {
    "total": 15,
    "running": 9,
    "warning": 4,
    "critical": 2
  },
  "lastUpdated": "2025-01-29T10:30:00Z"
}
```

*마지막 갱신: 2025. 6. 18. (5.44.2)*
