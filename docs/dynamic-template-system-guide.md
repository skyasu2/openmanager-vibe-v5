# 🚀 동적 템플릿 시스템 사용 가이드

> **OpenManager VIBE v5 - 유연한 메트릭 관리 및 Supabase 백업 시스템**

## 📋 개요

동적 템플릿 시스템은 기존 정적 템플릿의 한계를 극복하고, 메트릭을 유연하게 추가/삭제하며, Supabase에 자동 백업하는 고급 기능을 제공합니다.

## 🎯 주요 기능

### 1. **동적 메트릭 관리**

- 런타임에 새로운 메트릭 추가/삭제
- 커스텀 필드 지원
- 스키마 버전 관리

### 2. **Supabase 자동 백업**

- 5분마다 자동 백업
- 장애 시 자동 복원
- 30일간 백업 보관

### 3. **AI 엔진 완벽 호환**

- 기존 AI 엔진과 100% 호환
- 추가 메트릭도 AI 분석 가능

## 🔧 사용 방법

### 1. 동적 템플릿 모드 활성화

```bash
# API를 통한 활성화
curl -X POST http://localhost:3000/api/servers-optimized \
  -H "Content-Type: application/json" \
  -d '{"action": "enable_dynamic_templates"}'
```

**응답:**

```json
{
  "success": true,
  "message": "동적 템플릿 모드 활성화",
  "features": ["커스텀 메트릭 지원", "Supabase 자동 백업", "유연한 스키마 관리"]
}
```

### 2. 커스텀 메트릭 추가

```bash
# GPU 사용률 메트릭 추가
curl -X POST http://localhost:3000/api/servers-optimized \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add_custom_metric",
    "metricName": "gpu_usage",
    "defaultValue": 45
  }'

# 네트워크 지연 메트릭 추가
curl -X POST http://localhost:3000/api/servers-optimized \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add_custom_metric",
    "metricName": "network_latency",
    "defaultValue": 12
  }'
```

### 3. 수동 Supabase 백업

```bash
# 즉시 백업 실행
curl -X POST http://localhost:3000/api/servers-optimized \
  -H "Content-Type: application/json" \
  -d '{"action": "backup_to_supabase"}'
```

### 4. 캐시 상태 확인

```bash
# 현재 템플릿 시스템 상태 조회
curl http://localhost:3000/api/servers-optimized \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"action": "cache_status"}'
```

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "isInitialized": true,
    "currentScenario": "mixed",
    "serverKeysCount": 15,
    "dynamicTemplatesEnabled": true,
    "lastBackupTime": "2025-01-16T12:30:00Z",
    "templateVersion": "2.0-dynamic",
    "metadata": {
      "customMetrics": ["gpu_usage", "network_latency"],
      "totalFields": 10
    }
  }
}
```

## 📊 사용 시나리오

### 시나리오 1: GPU 서버 모니터링 추가

```javascript
// 1. GPU 메트릭 추가
await fetch('/api/servers-optimized', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'add_custom_metric',
    metricName: 'gpu_temperature',
    defaultValue: 70,
  }),
});

// 2. GPU 메모리 사용률 추가
await fetch('/api/servers-optimized', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'add_custom_metric',
    metricName: 'gpu_memory',
    defaultValue: 80,
  }),
});

// 3. 데이터 조회
const response = await fetch('/api/servers-optimized');
const data = await response.json();

// GPU 메트릭이 포함된 서버 데이터
console.log(data.data[0].metrics.gpu_temperature); // 70±변동
console.log(data.data[0].metrics.gpu_memory); // 80±변동
```

### 시나리오 2: 데이터베이스 전용 메트릭

```javascript
// 데이터베이스 관련 메트릭 추가
const dbMetrics = [
  { name: 'query_per_second', default: 1000 },
  { name: 'connection_pool_size', default: 100 },
  { name: 'replication_lag', default: 50 },
  { name: 'cache_hit_ratio', default: 85 },
];

for (const metric of dbMetrics) {
  await fetch('/api/servers-optimized', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'add_custom_metric',
      metricName: metric.name,
      defaultValue: metric.default,
    }),
  });
}
```

## 🔄 Supabase 백업 및 복원

### 백업 데이터 구조

```sql
-- Supabase에 저장되는 데이터 예시
{
  "id": "server-01",
  "name": "Web Server 01",
  "type": "Web",
  "status": "online",
  "metrics": {
    "cpu": { "value": 45, "unit": "%", "timestamp": "2025-01-16T12:00:00Z" },
    "memory": { "value": 62, "unit": "%", "timestamp": "2025-01-16T12:00:00Z" },
    "gpu_usage": { "value": 38, "unit": "custom", "timestamp": "2025-01-16T12:00:00Z" }
  },
  "customFields": {
    "port": 80,
    "protocol": "HTTP/2",
    "ssl": true
  },
  "version": "2.0"
}
```

### 복원 프로세스

Redis 데이터가 손실된 경우, 시스템이 자동으로 Supabase에서 복원:

1. Redis 데이터 없음 감지
2. Supabase에서 최신 백업 조회
3. 템플릿 데이터 복원
4. AI 호환 형식으로 변환
5. 서비스 정상 제공

## 🎨 고급 사용법

### 1. 스키마 버전 관리

```javascript
// 현재 스키마 버전 확인
const status = await fetch('/api/servers-optimized', {
  method: 'POST',
  body: JSON.stringify({ action: 'cache_status' }),
});

const { templateVersion } = await status.json();
console.log('현재 버전:', templateVersion); // "2.0-dynamic"
```

### 2. 시나리오별 동적 조정

```javascript
// 위험 상황 시뮬레이션 + 커스텀 메트릭
await fetch('/api/servers-optimized', {
  method: 'POST',
  body: JSON.stringify({
    action: 'set_scenario',
    scenario: 'critical',
  }),
});

// 위험 상황에서 추가 모니터링
await fetch('/api/servers-optimized', {
  method: 'POST',
  body: JSON.stringify({
    action: 'add_custom_metric',
    metricName: 'emergency_response_time',
    defaultValue: 500,
  }),
});
```

## 📊 성능 영향

| 기능          | 정적 템플릿 | 동적 템플릿 | 차이   |
| ------------- | ----------- | ----------- | ------ |
| 응답 시간     | 1-3ms       | 2-5ms       | +1-2ms |
| 메트릭 유연성 | ❌          | ✅          | -      |
| 백업/복원     | ❌          | ✅          | -      |
| 메모리 사용   | 낮음        | 보통        | +10%   |
| 확장성        | 제한적      | 무제한      | -      |

## ⚠️ 주의사항

1. **메트릭 이름 규칙**
   - 영문 소문자와 언더스코어만 사용
   - 예: `cpu_usage`, `network_latency`

2. **성능 고려사항**
   - 메트릭이 50개 이상이면 성능 저하 가능
   - 필요한 메트릭만 추가 권장

3. **백업 관리**
   - Supabase 용량 모니터링 필요
   - 30일 이상 된 백업은 자동 삭제

## 🚀 마이그레이션 가이드

### 정적 → 동적 템플릿 전환

```bash
# 1. 동적 템플릿 모드 활성화
curl -X POST http://localhost:3000/api/servers-optimized \
  -d '{"action": "enable_dynamic_templates"}'

# 2. 필요한 커스텀 메트릭 추가
# (위 예시 참조)

# 3. 첫 백업 실행
curl -X POST http://localhost:3000/api/servers-optimized \
  -d '{"action": "backup_to_supabase"}'

# 4. 성능 테스트
curl http://localhost:3000/api/performance-test?action=benchmark
```

## 📚 관련 문서

- [API 최적화 가이드](./api-optimization-guide.md)
- [GCP API 마이그레이션](./gcp-api-migration-guide.md)
- [Supabase 설정 가이드](./supabase-setup.md)

---

**동적 템플릿 시스템으로 더욱 유연하고 안정적인 모니터링 시스템을 구축하세요! 🎉**
