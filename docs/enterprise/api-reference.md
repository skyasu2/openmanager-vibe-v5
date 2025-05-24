# 🔗 Enterprise API 레퍼런스

OpenManager Vibe V5 Enterprise IDC 모드의 모든 API 엔드포인트에 대한 상세 가이드입니다.

## 📋 API 개요

| 엔드포인트 | 메서드 | 캐시 | 권한 | 설명 |
|------------|--------|------|------|------|
| `/api/enterprise` | GET | 1분 | 공개 | 30대 서버 + 장애 분석 전체 현황 |
| `/api/enterprise/seed` | POST | - | 관리자 | 초기 서버 데이터 Supabase 시딩 |
| `/api/servers` | GET | 3분 | 공개 | 서버 목록 (기업 모드 지원) |
| `/api/dashboard` | GET | 30초 | 공개 | 실시간 대시보드 데이터 |
| `/api/alerts` | GET | 15초 | 공개 | 활성 알림 및 장애 이벤트 |
| `/api/simulate` | POST | - | 관리자 | 시뮬레이터 실행 (10분 주기) |
| `/api/mcp/enterprise-query` | POST | 5분 | 공개 | AI 자연어 쿼리 처리 |
| `/api/health` | GET | 1분 | 공개 | 기본 상태 체크 |

---

## 1. 🏢 Enterprise Overview API

**`GET /api/enterprise`**

30대 서버의 전체 현황과 장애 분석 결과를 제공합니다.

### 응답 예시
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalServers": 30,
      "criticalServers": 3,
      "warningServers": 6,
      "healthyServers": 21,
      "kubernetesNodes": 15,
      "onPremiseServers": 15,
      "overallHealthScore": 70,
      "systemAvailability": 97.2,
      "currentIncidents": 9
    },
    "datacenterStatus": [
      {
        "location": "IDC-A",
        "totalServers": 3,
        "healthyServers": 2,
        "warningServers": 0,
        "criticalServers": 1
      }
    ],
    "activeIncidents": {
      "critical": [
        {
          "id": "db_master_cascade",
          "name": "데이터베이스 마스터 서버 장애",
          "origin": "db-master-01.corp.local",
          "affectedServers": 3,
          "startTime": "2024-01-01T09:20:00Z",
          "businessImpact": 9,
          "status": "active"
        }
      ],
      "warning": [...],
      "analytics": {
        "totalIncidents": 9,
        "criticalIncidents": 3,
        "averageResolutionTime": 75,
        "businessImpactScore": 6.2
      }
    },
    "correlationAnalysis": [
      {
        "primaryServer": "db-master-01.corp.local",
        "affectedServers": ["db-slave-01.corp.local", "web-app-01.corp.local"],
        "strength": 0.95,
        "propagationTime": 3,
        "impactedSystems": ["Database Layer", "Web Services"]
      }
    ],
    "operationalContext": {
      "currentTime": "2024-01-01T10:30:00Z",
      "businessHour": "morning_peak",
      "description": "업무 시작, DB 부하 증가",
      "expectedLoad": 8
    },
    "performanceMetrics": {
      "systemLoad": 7.2,
      "networkThroughput": 84.0,
      "responseTime": 280,
      "errorRate": 2.8
    },
    "aiAnalysis": {
      "priorityActions": [
        "🔴 DB 마스터 서버 긴급 쿼리 최적화 및 커넥션 풀 재설정",
        "🔴 스토리지 서버 임시 디스크 정리 및 긴급 용량 확장"
      ],
      "shortTermRecommendations": [...],
      "longTermPlanning": [...],
      "preventiveMeasures": [...]
    },
    "recoveryPriority": [
      {
        "priority": 1,
        "serverId": "db-master-01.corp.local",
        "estimatedImpact": 9,
        "dependencies": ["db-slave-01.corp.local", "web-app-01.corp.local"]
      }
    ]
  },
  "timestamp": "2024-01-01T10:30:00Z",
  "cached": false
}
```

---

## 2. 🌱 Enterprise Seed API

**`POST /api/enterprise/seed`**

30대 서버의 초기 데이터를 Supabase에 시딩합니다.

### 요청
```bash
curl -X POST http://localhost:3001/api/enterprise/seed
```

### 응답 예시
```json
{
  "success": true,
  "message": "Enterprise 서버 데이터 시딩 완료",
  "mode": "supabase",
  "seeded": 30,
  "timestamp": "2024-01-01T10:30:00Z",
  "metadata": {
    "totalServers": 30,
    "kubernetesNodes": 15,
    "onPremiseServers": 15,
    "criticalServers": 3,
    "warningServers": 6,
    "healthyServers": 21
  }
}
```

---

## 3. 🖥️ Servers API

**`GET /api/servers`**

전체 서버 목록과 메트릭을 제공합니다.

### 응답 예시
```json
{
  "success": true,
  "data": [
    {
      "id": "k8s-master-01",
      "name": "k8s-master-01.corp.local",
      "status": "error",
      "lastUpdate": "2024-01-01T10:28:00Z",
      "location": "IDC-A 랙-01 (Control Plane #1)",
      "uptime": 1728000,
      "metrics": {
        "cpu": 92.4,
        "memory": 87.8,
        "disk": 45.2,
        "network": {
          "bytesIn": 8388608,
          "bytesOut": 12582912,
          "latency": 85,
          "connections": 245
        },
        "processes": 178,
        "loadAverage": [2.15, 2.08, 1.95]
      }
    }
  ],
  "metadata": {
    "totalServers": 30,
    "healthyServers": 21,
    "warningServers": 6,
    "criticalServers": 3,
    "kubernetesNodes": 15,
    "onPremiseServers": 15
  }
}
```

---

## 4. 📊 Dashboard API

**`GET /api/dashboard`**

실시간 대시보드를 위한 핵심 지표를 제공합니다.

### 응답 예시
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalServers": 30,
      "healthyServers": 21,
      "warningServers": 6,
      "criticalServers": 3,
      "healthScore": 70,
      "systemAvailability": 97.2,
      "activeIncidents": 9
    },
    "platformStats": {
      "kubernetes": {
        "total": 15,
        "healthy": 11,
        "warning": 3,
        "critical": 1
      },
      "onPremise": {
        "total": 15,
        "healthy": 10,
        "warning": 3,
        "critical": 2
      }
    },
    "performanceMetrics": {
      "systemLoad": 7.2,
      "networkThroughput": 84.0,
      "diskIoUtilization": 67.4,
      "activeConnections": 875,
      "responseTime": 280,
      "errorRate": 2.8
    },
    "slaStatus": {
      "availability": {
        "current": 97.2,
        "target": 99.9,
        "status": "critical"
      },
      "responseTime": {
        "current": 280,
        "target": 100,
        "status": "critical"
      }
    },
    "topResourceUsage": [
      {
        "id": "db-master-01",
        "name": "db-master-01.corp.local",
        "status": "error",
        "cpu": 96.8,
        "memory": 94.2,
        "totalUsage": 92
      }
    ],
    "datacenterSummary": [
      {
        "location": "IDC-A",
        "totalServers": 3,
        "healthyServers": 2,
        "healthScore": 67
      }
    ]
  }
}
```

---

## 5. 🚨 Alerts API

**`GET /api/alerts`**

활성 알림과 장애 이벤트를 제공합니다.

### 응답 예시
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "critical-db_master_cascade",
        "severity": "critical",
        "title": "데이터베이스 마스터 서버 장애",
        "description": "PostgreSQL 마스터 서버의 CPU/메모리 과부하로 인한 전체 데이터베이스 계층 영향",
        "server": {
          "id": "db-master-01",
          "name": "db-master-01.corp.local",
          "location": "IDC-F 랙-01 (PostgreSQL Master)"
        },
        "metrics": {
          "cpu": 96.8,
          "memory": 94.2,
          "disk": 89.7,
          "latency": 350
        },
        "startTime": "2024-01-01T09:20:00Z",
        "duration": 70,
        "impact": 9,
        "affectedSystems": ["db-slave-01.corp.local", "web-app-01.corp.local"],
        "estimatedResolution": "45-60분 (쿼리 최적화 및 커넥션 풀 재설정 필요)",
        "rootCause": "장시간 실행 쿼리 누적, 커넥션 풀 고갈, 인덱스 최적화 부족",
        "status": "active",
        "actions": [
          "즉시 해당 서버 점검",
          "연관 서버 상태 모니터링",
          "비즈니스 영향 평가",
          "복구 절차 시작"
        ]
      }
    ],
    "statistics": {
      "total": 15,
      "critical": 3,
      "warning": 12,
      "info": 0,
      "acknowledged": 0,
      "unacknowledged": 15,
      "averageDuration": 45,
      "highImpactAlerts": 3
    },
    "urgentAlerts": [
      {
        "id": "critical-db_master_cascade",
        "severity": "critical",
        "duration": 70,
        "acknowledgedBy": null
      }
    ],
    "timeline": [
      {
        "time": "02:30 KST",
        "event": "야간 배치 작업으로 인한 DB 부하 증가",
        "severity": "info",
        "servers": ["db-master-01.corp.local"]
      }
    ]
  }
}
```

---

## 6. 🔄 Simulator API

**`POST /api/simulate`**

서버 메트릭을 시뮬레이션하여 업데이트합니다.

### 요청
```bash
curl -X POST http://localhost:3001/api/simulate
```

### 응답 예시
```json
{
  "success": true,
  "message": "시뮬레이터 실행 완료",
  "mode": "supabase",
  "updated": 30,
  "stats": {
    "totalUpdated": 30,
    "healthyServers": 21,
    "warningServers": 6,
    "criticalServers": 3,
    "averageCpuUsage": 65,
    "averageMemoryUsage": 68,
    "businessHours": true,
    "timestamp": "2024-01-01T10:30:00Z"
  },
  "performanceMetrics": {
    "systemLoad": 7.2,
    "networkThroughput": 84.0,
    "responseTime": 280
  },
  "metadata": {
    "nextRun": "2024-01-01T10:40:00Z",
    "environment": "development",
    "simulationCycle": 14526
  }
}
```

---

## 7. 🤖 MCP Enterprise Query API

**`POST /api/mcp/enterprise-query`**

자연어 질문을 분석하여 시스템 상태를 응답합니다.

### 요청 예시
```json
{
  "query": "전체 인프라 상태 어때?"
}
```

### 응답 예시
```json
{
  "success": true,
  "data": {
    "query": "전체 인프라 상태 어때?",
    "intent": "infrastructure_overview",
    "entities": ["infrastructure"],
    "response": "🏢 **전체 인프라 현황**\n\n📊 **서버 상태 요약:**\n- 전체 서버: 30대 (K8s 15대 + 온프레미스 15대)\n- 🟢 정상: 21대 (70%)\n- 🟡 경고: 6대 (20%)\n- 🔴 심각: 3대 (10%)\n\n🚨 **현재 주요 이슈:**\n- 3건의 심각한 장애 발생 중\n- 6건의 경고 상황 진행 중\n\n💡 **권장 조치:** 즉시 장애 대응 필요",
    "confidence": 0.9,
    "relatedServers": ["db-master-01", "k8s-master-01", "storage-server-01"],
    "actionItems": [
      "🔴 DB 마스터 서버 긴급 점검 및 쿼리 최적화",
      "🔴 스토리지 서버 디스크 정리 및 용량 확장",
      "🔴 K8s Control Plane etcd 상태 점검"
    ]
  },
  "timestamp": "2024-01-01T10:30:00Z",
  "cached": false
}
```

### 지원되는 쿼리 패턴
- **인프라 전체**: "전체 인프라 상태 어때?"
- **데이터베이스**: "데이터베이스 서버 문제 있어?"
- **쿠버네티스**: "쿠버네티스 클러스터 상태는?"
- **스토리지**: "스토리지 용량 부족해?"
- **장애 분석**: "심각한 장애 몇 개 발생 중?"
- **복구 계획**: "복구 우선순위 알려줘"
- **성능 지표**: "현재 성능 지표 어때?"

---

## 8. ❤️ Health Check API

**`GET /api/health`**

시스템의 기본 상태를 확인합니다.

### 응답 예시
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-01T10:30:00Z",
  "environment": "development",
  "version": "5.0.0",
  "uptime": 86400,
  "services": {
    "database": "connected",
    "redis": "connected",
    "api": "healthy"
  }
}
```

---

## 🔧 오류 처리

모든 API는 일관된 오류 형식을 사용합니다:

```json
{
  "success": false,
  "error": "Failed to fetch enterprise infrastructure status",
  "timestamp": "2024-01-01T10:30:00Z",
  "details": "Database connection timeout"
}
```

### HTTP 상태 코드
- **200**: 성공
- **400**: 잘못된 요청
- **401**: 인증 필요
- **403**: 권한 없음
- **404**: 리소스 없음
- **500**: 서버 오류

---

## 📊 성능 고려사항

### 캐싱 정책
- **실시간 데이터**: 15-30초 캐시
- **분석 데이터**: 1-5분 캐시
- **정적 데이터**: 1시간 캐시

### Rate Limiting
- **일반 API**: 분당 100 요청
- **시뮬레이터**: 분당 6 요청
- **쿼리 API**: 분당 30 요청

### 응답 시간 목표
- **Dashboard**: <200ms
- **Enterprise**: <500ms
- **Query**: <1000ms

이 API 레퍼런스는 OpenManager Vibe V5의 Enterprise IDC 모드를 효과적으로 활용하기 위한 완전한 가이드를 제공합니다. 