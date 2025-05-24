# API 문서

## 📋 개요

OpenManager Vibe v5의 REST API 엔드포인트 명세서입니다.

기본 URL: `http://localhost:3000/api`

## 🔐 인증

현재 버전에서는 별도의 인증이 필요하지 않습니다.

## 📊 서버 관리 API

### GET /api/servers
전체 서버 목록을 조회합니다.

**응답:**
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "data": [
    {
      "id": "k8s-master-01",
      "name": "k8s-master-01.corp.local",
      "status": "online",
      "lastUpdate": "2024-01-15T10:29:00Z",
      "location": "IDC-A 랙-01",
      "uptime": 1728000,
      "metrics": {
        "cpu": 45.2,
        "memory": 67.8,
        "disk": 23.1,
        "network": {
          "bytesIn": 1048576,
          "bytesOut": 2097152,
          "packetsIn": 100,
          "packetsOut": 120,
          "latency": 15,
          "connections": 50
        },
        "processes": 85,
        "loadAverage": [0.5, 0.3, 0.2]
      }
    }
  ]
}
```

### GET /api/servers/[id]
특정 서버의 상세 정보를 조회합니다.

**매개변수:**
- `id`: 서버 ID

**쿼리 매개변수:**
- `history`: `true`로 설정 시 히스토리 포함
- `hours`: 조회할 시간 범위 (기본값: 24)

**응답:**
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "data": {
    "id": "k8s-master-01",
    "name": "k8s-master-01.corp.local",
    "status": "online",
    "isOnline": true,
    "lastUpdate": "2024-01-15T10:29:00Z",
    "location": "IDC-A 랙-01",
    "uptime": 1728000,
    "metrics": { ... },
    "history": [
      {
        "timestamp": "2024-01-15T10:25:00Z",
        "metrics": { ... }
      }
    ]
  }
}
```

## 📈 대시보드 API

### GET /api/dashboard
대시보드 메인 데이터를 조회합니다.

**응답:**
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "data": {
    "serverCounts": {
      "healthy": 25,
      "warning": 3,
      "critical": 2,
      "total": 30
    },
    "clusterStatus": {
      "kubernetes": {
        "total": 10,
        "healthy": 8,
        "warning": 1,
        "critical": 1
      },
      "onpremise": {
        "total": 20,
        "healthy": 17,
        "warning": 2,
        "critical": 1
      }
    },
    "topResourceUsage": [
      {
        "id": "k8s-master-01",
        "name": "k8s-master-01.corp.local",
        "cpu": 92.4,
        "memory": 87.8,
        "status": "warning"
      }
    ],
    "recentAlerts": [
      {
        "id": "alert-001",
        "severity": "critical",
        "message": "CPU 사용률 95% 초과",
        "serverId": "k8s-master-01",
        "timestamp": "2024-01-15T10:25:00Z"
      }
    ],
    "systemMetrics": {
      "averageUptime": 20.5,
      "totalConnections": 1250,
      "totalProcesses": 5420,
      "averageCpuUsage": 65.2,
      "averageMemoryUsage": 72.1,
      "criticalThresholdBreaches": 3
    }
  }
}
```

## 🚨 알림 API

### GET /api/alerts
현재 활성 알림 목록을 조회합니다.

**응답:**
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "data": {
    "alerts": [
      {
        "id": "alert-001",
        "type": "resource_threshold",
        "severity": "critical",
        "title": "높은 CPU 사용률",
        "message": "k8s-master-01에서 CPU 사용률이 95%를 초과했습니다",
        "serverId": "k8s-master-01",
        "serverName": "k8s-master-01.corp.local",
        "timestamp": "2024-01-15T10:25:00Z",
        "acknowledged": false,
        "details": {
          "metric": "cpu",
          "currentValue": 95.2,
          "threshold": 90,
          "duration": "5분"
        }
      }
    ],
    "summary": {
      "total": 5,
      "critical": 2,
      "warning": 3,
      "acknowledged": 1
    }
  }
}
```

## 🔧 시뮬레이션 API

### POST /api/simulate
시뮬레이션 데이터를 생성합니다.

**응답:**
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "data": {
    "message": "시뮬레이션 데이터가 생성되었습니다",
    "serversUpdated": 30,
    "recordsGenerated": 90
  }
}
```

## 🏢 기업 데이터 API

### GET /api/enterprise
기업 환경 통합 데이터를 조회합니다.

**쿼리 매개변수:**
- `view`: `overview` | `infrastructure` | `performance` | `security`
- `serverIds`: 쉼표로 구분된 서버 ID 목록

**응답:**
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "data": {
    "overview": {
      "servers": {
        "critical": [],
        "warning": [],
        "healthy": []
      },
      "infrastructure": {
        "servers": [],
        "summary": {
          "totalServers": 30,
          "healthyServers": 25,
          "warningServers": 3,
          "criticalServers": 2
        }
      }
    }
  }
}
```

### POST /api/enterprise/seed
기업 환경 시드 데이터를 생성합니다.

**응답:**
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "data": {
    "message": "기업 환경 데이터가 시드되었습니다",
    "summary": {
      "totalServers": 30,
      "kubernetesNodes": 10,
      "onPremiseServers": 20,
      "criticalServers": 2,
      "warningServers": 3,
      "healthyServers": 25
    }
  }
}
```

## 🤖 AI 분석 API

### POST /api/mcp/enterprise-query
AI 기반 기업 환경 분석을 실행합니다.

**요청 본문:**
```json
{
  "query": "현재 인프라 상태를 분석해주세요",
  "context": {
    "serverIds": ["k8s-master-01", "db-server-01"],
    "timeRange": "1h"
  }
}
```

**응답:**
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "data": {
    "query": "현재 인프라 상태를 분석해주세요",
    "analysis": {
      "type": "infrastructure_analysis",
      "severity": "warning",
      "summary": "현재 인프라에서 몇 가지 주의사항이 발견되었습니다",
      "details": "k8s-master-01에서 높은 CPU 사용률이 감지되었습니다...",
      "recommendations": [
        "CPU 사용률이 높은 프로세스를 확인하세요",
        "워커 노드로 부하를 분산시키는 것을 고려하세요"
      ],
      "relatedServers": ["k8s-master-01", "k8s-worker-01"]
    }
  }
}
```

## 🏥 상태 확인 API

### GET /api/health
시스템 전반적인 상태를 확인합니다.

**응답:**
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "data": {
    "status": "healthy",
    "services": {
      "database": "connected",
      "redis": "connected",
      "collectors": "running"
    },
    "environment": {
      "mode": "production",
      "collectors": ["prometheus", "cloudwatch"]
    }
  }
}
```

### GET /api/ping
간단한 응답 확인을 위한 핑 엔드포인트입니다.

**응답:**
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "data": {
    "message": "pong",
    "uptime": 3600,
    "environment": "production"
  }
}
```

### GET /api/status
상세한 시스템 상태를 확인합니다.

**응답:**
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "data": {
    "system": {
      "uptime": 3600,
      "memory": {
        "used": "256MB",
        "free": "768MB",
        "total": "1024MB"
      },
      "cpu": {
        "usage": "15%",
        "loadAverage": [0.5, 0.3, 0.2]
      }
    },
    "database": {
      "status": "connected",
      "responseTime": "5ms"
    },
    "collectors": {
      "active": 3,
      "lastCollection": "2024-01-15T10:29:00Z"
    }
  }
}
```

## ⚠️ 오류 응답

모든 API는 오류 발생 시 다음 형식으로 응답합니다:

```json
{
  "success": false,
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "error": {
    "code": "SERVER_NOT_FOUND",
    "message": "요청한 서버를 찾을 수 없습니다",
    "details": {
      "serverId": "invalid-server-id"
    }
  }
}
```

### 주요 오류 코드

- `400 Bad Request`: 잘못된 요청 매개변수
- `404 Not Found`: 리소스를 찾을 수 없음
- `500 Internal Server Error`: 서버 내부 오류
- `503 Service Unavailable`: 서비스 이용 불가

## 📝 참고사항

- 모든 타임스탬프는 ISO 8601 형식입니다
- 메트릭 값은 백분율(%)로 표시됩니다
- 네트워크 데이터는 바이트 단위입니다
- 업타임은 초 단위입니다

## 🔄 버전 관리

현재 API 버전: `v1.0.0`

모든 응답에 `version` 필드가 포함되어 있으며, 호환성 변경 시 버전이 업데이트됩니다. 