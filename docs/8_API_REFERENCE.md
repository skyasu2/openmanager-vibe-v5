# 📡 OpenManager v5 - API 레퍼런스

**버전**: v5.13.5  
**최종 업데이트**: 2025-05-31  
**Base URL**: `http://localhost:3001` (개발) / `https://your-app.vercel.app` (프로덕션)  

---

## 🎯 API 개요

OpenManager v5는 **RESTful API**와 **WebSocket** 기반의 실시간 통신을 제공합니다. 모든 API는 JSON 형식으로 데이터를 주고받으며, Prometheus 표준 메트릭을 지원합니다.

### 인증
```bash
# 관리자 API는 PIN 기반 인증 필요
Authorization: Bearer <admin_token>

# 일반 API는 인증 불필요 (개발 환경)
```

### 응답 형식
```json
{
  "success": true,
  "data": { /* 응답 데이터 */ },
  "message": "성공 메시지",
  "timestamp": "2025-05-31T10:00:00Z",
  "version": "v5.13.5"
}
```

---

## 🔧 시스템 제어 API

### 시스템 상태 관리

#### GET /api/system/status
시스템 전체 상태 조회

```bash
curl http://localhost:3001/api/system/status
```

**응답:**
```json
{
  "success": true,
  "data": {
    "system_running": true,
    "timers_active": 4,
    "memory_usage": "80MB",
    "cpu_usage": "12%",
    "uptime": "2h 30m",
    "active_connections": 15,
    "last_update": "2025-05-31T10:00:00Z"
  }
}
```

#### POST /api/system/start
시스템 시작

```bash
curl -X POST http://localhost:3001/api/system/start
```

#### POST /api/system/stop
시스템 종료

```bash
curl -X POST http://localhost:3001/api/system/stop
```

#### POST /api/system/pause
시스템 일시정지

```bash
curl -X POST http://localhost:3001/api/system/pause
```

### 타이머 관리

#### GET /api/system/timers
활성 타이머 목록 조회

```bash
curl http://localhost:3001/api/system/timers
```

**응답:**
```json
{
  "success": true,
  "data": {
    "active_timers": [
      {
        "id": "unified-metrics-generation",
        "interval": 15000,
        "next_execution": "2025-05-31T10:00:15Z",
        "status": "running"
      },
      {
        "id": "unified-ai-analysis", 
        "interval": 30000,
        "next_execution": "2025-05-31T10:00:30Z",
        "status": "running"
      }
    ],
    "total_count": 4
  }
}
```

---

## 📊 메트릭 API

### 통합 메트릭 관리

#### GET /api/unified-metrics
통합 메트릭 데이터 조회

**쿼리 파라미터:**
- `action`: `servers` | `summary` | `detailed`
- `limit`: 반환할 서버 수 (기본값: 20)
- `format`: `json` | `prometheus`

```bash
# 서버 목록 조회
curl "http://localhost:3001/api/unified-metrics?action=servers&limit=10"

# 요약 정보 조회
curl "http://localhost:3001/api/unified-metrics?action=summary"

# Prometheus 형식
curl "http://localhost:3001/api/unified-metrics?format=prometheus"
```

**응답 (servers):**
```json
{
  "success": true,
  "data": {
    "servers": [
      {
        "id": "web-server-01",
        "name": "Web Server 01",
        "type": "web",
        "status": "healthy",
        "metrics": {
          "cpu": 75.3,
          "memory": 68.7,
          "disk": 45.2,
          "network": {
            "in": 1234567,
            "out": 987654
          }
        },
        "alerts": [],
        "last_update": "2025-05-31T10:00:00Z"
      }
    ],
    "total_count": 20,
    "healthy_count": 18,
    "warning_count": 2,
    "critical_count": 0
  }
}
```

#### POST /api/unified-metrics
메트릭 데이터 업데이트

```bash
curl -X POST http://localhost:3001/api/unified-metrics \
  -H "Content-Type: application/json" \
  -d '{
    "action": "update_server",
    "server_id": "web-server-01",
    "metrics": {
      "cpu": 80.5,
      "memory": 72.1
    }
  }'
```

### Prometheus 호환 API

#### GET /api/prometheus/metrics
Prometheus 표준 메트릭 엔드포인트

```bash
curl http://localhost:3001/api/prometheus/metrics
```

**응답 (Prometheus 형식):**
```prometheus
# HELP openmanager_cpu_usage_percent CPU usage percentage
# TYPE openmanager_cpu_usage_percent gauge
openmanager_cpu_usage_percent{server="web-01"} 75.3

# HELP openmanager_memory_usage_percent Memory usage percentage  
# TYPE openmanager_memory_usage_percent gauge
openmanager_memory_usage_percent{server="web-01"} 68.7

# HELP openmanager_disk_usage_percent Disk usage percentage
# TYPE openmanager_disk_usage_percent gauge
openmanager_disk_usage_percent{server="web-01"} 45.2
```

#### GET /api/prometheus/query
Prometheus 쿼리 실행

**쿼리 파라미터:**
- `query`: PromQL 쿼리
- `time`: 조회 시점 (Unix timestamp)

```bash
curl "http://localhost:3001/api/prometheus/query?query=openmanager_cpu_usage_percent&time=1640995200"
```

---

## 🤖 AI 에이전트 API

### MCP 기반 AI 분석

#### POST /api/ai/mcp
MCP 오케스트레이터를 통한 AI 분석

```bash
curl -X POST http://localhost:3001/api/ai/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "query": "CPU 사용률이 높은 서버들을 분석해주세요",
    "parameters": {
      "metrics": {
        "cpu": [75, 80, 85, 90, 95],
        "memory": [60, 65, 70, 75, 80]
      }
    },
    "context": {
      "session_id": "analysis_session_123",
      "urgency": "medium"
    }
  }'
```

**응답:**
```json
{
  "success": true,
  "data": {
    "analysis_id": "mcp_analysis_456",
    "tools_used": ["statistical_analysis", "anomaly_detection"],
    "execution_time": 1.2,
    "results": {
      "summary": "CPU 사용률이 평상시 대비 40% 증가했습니다.",
      "findings": [
        {
          "tool": "statistical_analysis",
          "result": "평균 CPU: 85%, 표준편차: 7.9",
          "confidence": 0.95
        }
      ],
      "recommendations": [
        "워크로드 분산 검토 필요",
        "메모리 누수 가능성 확인"
      ]
    }
  }
}
```

### AI 에이전트 계층별 API

#### POST /api/ai-agent/optimized
최적화된 AI 엔진 (1차)

```bash
curl -X POST http://localhost:3001/api/ai-agent/optimized \
  -H "Content-Type: application/json" \
  -d '{
    "query": "서버 성능 분석",
    "data": { /* 메트릭 데이터 */ }
  }'
```

#### POST /api/ai-agent/pattern-query
패턴 매칭 시스템 (2차)

```bash
curl -X POST http://localhost:3001/api/ai-agent/pattern-query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "이상 패턴 탐지",
    "pattern_type": "anomaly"
  }'
```

#### POST /api/ai-agent/integrated
통합 시스템 (3차 폴백)

```bash
curl -X POST http://localhost:3001/api/ai-agent/integrated \
  -H "Content-Type: application/json" \
  -d '{
    "query": "전체 시스템 분석",
    "fallback_mode": true
  }'
```

### 실시간 사고 과정 스트리밍

#### GET /api/ai-agent/thinking-process
Server-Sent Events (SSE) 스트림

```bash
curl -N http://localhost:3001/api/ai-agent/thinking-process \
  -H "Accept: text/event-stream"
```

**응답 (SSE 스트림):**
```
data: {"step": "tool_selection", "message": "분석 도구 선택 중..."}

data: {"step": "data_processing", "message": "메트릭 데이터 처리 중..."}

data: {"step": "pattern_analysis", "message": "패턴 분석 실행 중..."}

data: {"step": "complete", "result": {...}}
```

---

## 📊 데이터 생성 API

### 서버 데이터 시뮬레이터

#### GET /api/data-generator/status
데이터 생성기 상태 조회

```bash
curl http://localhost:3001/api/data-generator/status
```

#### POST /api/data-generator/start
데이터 생성 시작

```bash
curl -X POST http://localhost:3001/api/data-generator/start \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "normal",
    "duration": 3600,
    "servers": 20
  }'
```

#### POST /api/data-generator/scenario
특정 시나리오 실행

```bash
curl -X POST http://localhost:3001/api/data-generator/scenario \
  -H "Content-Type: application/json" \
  -d '{
    "type": "cpu_spike",
    "target_servers": ["web-01", "web-02"],
    "duration": 300,
    "intensity": "high"
  }'
```

### 순차 서버 생성

#### POST /api/servers/next
다음 서버 생성

```bash
curl -X POST http://localhost:3001/api/servers/next \
  -H "Content-Type: application/json" \
  -d '{
    "currentCount": 5,
    "reset": false
  }'
```

**응답:**
```json
{
  "success": true,
  "data": {
    "server": {
      "id": "database-server-01",
      "name": "Database Server 01",
      "type": "database",
      "status": "healthy"
    },
    "currentCount": 6,
    "isComplete": false,
    "progress": 30,
    "nextServerType": "API Server"
  }
}
```

---

## 🔔 알림 및 웹소켓 API

### WebSocket 연결

#### WS /api/websocket/servers
실시간 서버 메트릭 스트림

```javascript
const ws = new WebSocket('ws://localhost:3001/api/websocket/servers');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('실시간 메트릭:', data);
};
```

### 알림 API

#### GET /api/alerts
활성 알림 목록

```bash
curl http://localhost:3001/api/alerts
```

#### POST /api/notifications/slack
Slack 알림 전송

```bash
curl -X POST http://localhost:3001/api/notifications/slack \
  -H "Content-Type: application/json" \
  -d '{
    "message": "CPU 사용률 경고",
    "severity": "warning",
    "server": "web-01"
  }'
```

---

## 🛠️ 관리자 API

### 시스템 관리

#### GET /api/admin/logs
시스템 로그 조회

**쿼리 파라미터:**
- `level`: `debug` | `info` | `warn` | `error`
- `component`: 컴포넌트 이름
- `limit`: 로그 수 (기본값: 100)

```bash
curl "http://localhost:3001/api/admin/logs?level=error&limit=50" \
  -H "Authorization: Bearer <admin_token>"
```

#### GET /api/admin/metrics
시스템 성능 메트릭

```bash
curl http://localhost:3001/api/admin/metrics \
  -H "Authorization: Bearer <admin_token>"
```

#### POST /api/admin/backup
데이터 백업 생성

```bash
curl -X POST http://localhost:3001/api/admin/backup \
  -H "Authorization: Bearer <admin_token>"
```

### AI 에이전트 관리

#### GET /api/ai-agent/admin/status
AI 에이전트 상태 조회

```bash
curl http://localhost:3001/api/ai-agent/admin/status \
  -H "Authorization: Bearer <admin_token>"
```

#### POST /api/ai-agent/admin/retrain
AI 모델 재훈련

```bash
curl -X POST http://localhost:3001/api/ai-agent/admin/retrain \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "force_update": true,
    "clear_cache": true
  }'
```

---

## 📈 성능 및 헬스체크 API

### 헬스체크

#### GET /api/health
기본 헬스체크

```bash
curl http://localhost:3001/api/health
```

**응답:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": "2h 30m",
    "memory": "80MB",
    "cpu": "12%",
    "timestamp": "2025-05-31T10:00:00Z"
  }
}
```

#### GET /api/health/detailed
상세 헬스체크

```bash
curl http://localhost:3001/api/health/detailed
```

### 성능 메트릭

#### GET /api/system/performance
시스템 성능 지표

```bash
curl http://localhost:3001/api/system/performance
```

#### GET /api/system/memory
메모리 사용량 상세

```bash
curl http://localhost:3001/api/system/memory
```

---

## 🔧 유틸리티 API

### 캐시 관리

#### DELETE /api/cache/clear
전체 캐시 정리

```bash
curl -X DELETE http://localhost:3001/api/cache/clear
```

#### GET /api/cache/stats
캐시 통계

```bash
curl http://localhost:3001/api/cache/stats
```

### 설정 관리

#### GET /api/config
현재 설정 조회

```bash
curl http://localhost:3001/api/config
```

#### POST /api/config/adaptive
적응형 설정 업데이트

```bash
curl -X POST http://localhost:3001/api/config/adaptive \
  -H "Content-Type: application/json" \
  -d '{
    "auto_scaling": true,
    "performance_mode": "optimized"
  }'
```

---

## 📚 SDK 및 클라이언트 라이브러리

### JavaScript/TypeScript SDK

```typescript
import { OpenManagerClient } from '@openmanager/sdk';

const client = new OpenManagerClient({
  baseUrl: 'http://localhost:3001',
  apiKey: 'your-api-key' // 선택사항
});

// 시스템 상태 조회
const status = await client.system.getStatus();

// AI 분석 실행
const analysis = await client.ai.analyze({
  query: 'CPU 사용률 분석',
  data: metricsData
});

// 실시간 메트릭 구독
client.metrics.subscribe((data) => {
  console.log('실시간 메트릭:', data);
});
```

### Python SDK

```python
from openmanager_sdk import OpenManagerClient

client = OpenManagerClient(
    base_url='http://localhost:3001',
    api_key='your-api-key'  # 선택사항
)

# 시스템 상태 조회
status = client.system.get_status()

# AI 분석 실행
analysis = client.ai.analyze(
    query='CPU 사용률 분석',
    data=metrics_data
)
```

---

## 🚨 에러 코드

### HTTP 상태 코드
- `200`: 성공
- `400`: 잘못된 요청
- `401`: 인증 필요
- `403`: 권한 없음
- `404`: 리소스 없음
- `429`: 요청 제한 초과
- `500`: 서버 내부 오류

### 커스텀 에러 코드
```json
{
  "success": false,
  "error": {
    "code": "AI_ENGINE_TIMEOUT",
    "message": "AI 엔진 응답 시간 초과",
    "details": "Python 엔진 연결 실패, TypeScript 폴백으로 전환됨"
  }
}
```

---

**이전 문서**: [7_TROUBLESHOOTING.md](./7_TROUBLESHOOTING.md) - 문제해결 가이드  
**다음 문서**: [9_MCP_ENGINE_REFERENCE.md](./9_MCP_ENGINE_REFERENCE.md) - MCP 엔진 레퍼런스 