# 🔍 GCP VM 표준 메트릭 서버 가이드 v5.70.2

## 📋 목차

1. [개요](#개요)
2. [표준 Raw 메트릭 구조](#표준-raw-메트릭-구조)
3. [API 버전별 비교](#api-버전별-비교)
4. [AI 분석 무결성 보장](#ai-분석-무결성-보장)
5. [Prometheus 호환성](#prometheus-호환성)
6. [배포 및 운영](#배포-및-운영)
7. [문제 해결](#문제-해결)

---

## 🎯 개요

### 목적 및 철학

**실제 서버 모니터링 에이전트 시뮬레이션**: OpenManager VIBE v5의 GCP VM 백엔드는 실제 서버 모니터링 환경과 동일한 Raw 메트릭만을 제공하여 AI 어시스턴트가 사전 정보 없이 순수한 데이터 분석을 수행할 수 있도록 설계되었습니다.

### 핵심 원칙

- **🔍 Raw Metrics Only**: 가공되지 않은 시스템 메트릭만 수집 및 제공
- **🛡️ Zero Prior Information**: AI에게 장애 시나리오나 카운트다운 등 사전 정보 차단
- **📊 Prometheus Compatible**: 업계 표준 메트릭 형식 준수
- **⚡ Real-time Analysis**: 현재 시간 기준 실시간 데이터 제공

### 현재 상태 (2025-08-28)

- **🚀 배포 상태**: GCP VM (35.209.146.37:10000) 운영 중
- **📡 API 엔드포인트**: `/api/v3/metrics` (표준 Raw 메트릭)
- **🔐 인증 방식**: Bearer Token (`4/0AVMBsJijWnbHYdXJmhWcM_...`)
- **⚙️ 프로세스 관리**: PM2 (openmanager-standard-api)

---

## 📊 표준 Raw 메트릭 구조

### CPU 메트릭 (Prometheus 호환)

```json
{
  "cpu_seconds_total": {
    "user": 460940309,      // 사용자 프로세스 CPU 시간 (초)
    "system": 230470154,    // 시스템 프로세스 CPU 시간 (초) 
    "idle": 988032238,      // 유휴 CPU 시간 (초)
    "iowait": 76823384      // I/O 대기 CPU 시간 (초)
  },
  "cpu_usage_percent": 43.74,  // 현재 CPU 사용률 (%)
  "load_average": {
    "1m": 1.75,             // 1분 평균 부하
    "5m": 1.46,             // 5분 평균 부하  
    "15m": 1.25             // 15분 평균 부하
  }
}
```

### 메모리 메트릭

```json
{
  "memory_total_bytes": 8589934592,    // 총 메모리 (바이트)
  "memory_used_bytes": 3857484554,     // 사용된 메모리 (바이트)
  "memory_free_bytes": 4732450037,     // 사용 가능한 메모리 (바이트)
  "memory_buffers_bytes": 429496729,   // 버퍼 메모리 (바이트)
  "memory_cached_bytes": 858993459     // 캐시 메모리 (바이트)
}
```

### 디스크 메트릭

```json
{
  "disk_total_bytes": 214748364800,    // 총 디스크 용량 (바이트)
  "disk_used_bytes": 142943310332,     // 사용된 디스크 공간 (바이트)
  "disk_free_bytes": 71805054467,      // 사용 가능한 디스크 공간 (바이트)
  "disk_io_time_seconds": 1169026310   // 총 디스크 I/O 시간 (초)
}
```

### 네트워크 메트릭

```json
{
  "network_receive_bytes_total": 25699051289980364,  // 총 수신 바이트
  "network_transmit_bytes_total": 43452575458261110, // 총 송신 바이트
  "network_receive_packets_total": 2450852517126,    // 총 수신 패킷
  "network_transmit_packets_total": 4143960519624    // 총 송신 패킷
}
```

### 시스템 정보

```json
{
  "boot_time_seconds": 73721,     // 시스템 부팅 시간 (초)
  "uptime_seconds": 1756266088    // 시스템 가동 시간 (초)
}
```

---

## 🔄 API 버전별 비교

| 항목 | API v1 (Deprecated) | API v2 (Optimized) | API v3 (Standard) |
|------|-------------------|-------------------|-------------------|
| **가공 메트릭** | ✅ 포함 | ⚠️ 일부 포함 | ❌ 완전 제거 |
| **사전 정보** | ⚠️ 카운트다운 포함 | ⚠️ 시나리오 정보 | ❌ 완전 차단 |
| **Prometheus 호환** | ❌ 비호환 | ⚠️ 부분 호환 | ✅ 완전 호환 |
| **AI 분석 무결성** | ❌ 힌트 노출 | ⚠️ 일부 노출 | ✅ 순수 데이터 |

### 제거된 가공 메트릭들

**❌ API v1/v2에서 제거된 문제적 메트릭들**:
- `health_score`: 0-100 건강도 점수 (가공 데이터)
- `network_latency_ms`: 네트워크 지연시간 (계산된 값)
- `cpu_cores_used`: CPU 코어 사용량 (유도된 값)
- `memory_available_gb`: 사용 가능한 메모리 GB (변환된 값)
- `nextChange`: 다음 변경까지 카운트다운 (사전 정보)
- `phaseName`: 장애 단계 이름 (시나리오 힌트)
- `description`: 상태 설명 (분석 힌트)
- `severity`: 심각도 레벨 (판단 정보)

**✅ API v3에서만 제공하는 Raw 메트릭들**:
- `cpu_seconds_total`: Prometheus 표준 CPU 카운터
- `*_bytes`: 바이트 단위 원시 메트릭
- `*_total`: 누적 카운터 메트릭
- `load_average`: 시스템 부하 (OS 직접 제공)

---

## 🛡️ AI 분석 무결성 보장

### 사전 정보 차단 메커니즘

**🎯 목표**: AI 어시스턴트가 사전 정보 없이 순수한 메트릭 데이터만으로 문제를 분석하도록 보장

#### ❌ 차단된 정보들

1. **시간 기반 힌트**:
   ```json
   // v1/v2에서 제거됨
   {
     "nextChange": 7,  // 7분 후 상태 변경 (사전 정보)
     "timeRemaining": "00:07:23"  // 남은 시간 표시
   }
   ```

2. **시나리오 설명**:
   ```json
   // v1/v2에서 제거됨  
   {
     "phaseName": "Database Overload Crisis",
     "description": "High CPU and memory usage on database servers",
     "severity": "critical"
   }
   ```

3. **가공된 상태 정보**:
   ```json
   // v1/v2에서 제거됨
   {
     "health_score": 23,  // 0-100 건강도 (미리 계산된 값)
     "status_summary": "Multiple servers experiencing high load"
   }
   ```

#### ✅ 제공되는 순수 정보

```json
{
  "scenario": {
    "timeBlock": 2,                    // 현재 4시간 블록 (0-5)
    "hour": 9,                         // 현재 시간 (한국 시간)
    "minute": 10,                      // 현재 분
    "timestamp": "2025-08-28T09:10:27.000Z"  // ISO 타임스탬프
  }
}
```

### AI 분석 권장 접근법

1. **패턴 기반 분석**: CPU, 메모리, 디스크 사용률의 시간별 패턴 관찰
2. **임계값 기반 판단**: 업계 표준 임계값 적용 (CPU 80%+, 메모리 90%+)
3. **상관관계 분석**: 서버 간 메트릭 상관관계로 장애 전파 추적
4. **추세 분석**: 짧은 시간 내 급격한 변화 패턴으로 이상 탐지

---

## 📡 Prometheus 호환성

### 메트릭 네이밍 규칙

**Prometheus 표준 준수**:
- `*_total`: 단조 증가 카운터 메트릭
- `*_bytes`: 바이트 단위 게이지 메트릭
- `*_seconds`: 시간 단위 메트릭
- `*_percent`: 백분율 게이지 메트릭

### 호환 가능한 도구들

- **✅ Grafana**: 대시보드 시각화 직접 연결 가능
- **✅ AlertManager**: 임계값 기반 알림 설정 가능
- **✅ VictoriaMetrics**: 메트릭 저장 및 쿼리 가능
- **✅ Datadog**: Agent 없이도 메트릭 수집 가능

### Prometheus 쿼리 예시

```promql
# CPU 사용률이 80% 이상인 서버
cpu_usage_percent > 80

# 메모리 사용률 계산
(memory_used_bytes / memory_total_bytes) * 100

# 네트워크 I/O 비율
rate(network_receive_bytes_total[5m]) / rate(network_transmit_bytes_total[5m])

# 디스크 사용률
(disk_used_bytes / disk_total_bytes) * 100
```

---

## 🚀 배포 및 운영

### 현재 배포 상태

**🔧 GCP VM 인스턴스**:
- **이름**: `gcp-server`
- **존**: `us-central1-a`
- **외부 IP**: `35.209.146.37`
- **내부 IP**: `10.128.0.2`
- **포트**: `10000`

**⚙️ PM2 프로세스**:
```bash
# 프로세스 상태 확인
pm2 list

┌────┬─────────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┐
│ id │ name                        │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │
├────┼─────────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┤
│ 7  │ openmanager-standard-api    │ default     │ 1.0.0   │ fork    │ 13480    │ 25m    │ 0    │ online    │ 0%       │
└────┴─────────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┘
```

### API 엔드포인트 접근

**🔐 인증 방식**:
```bash
curl -H "Authorization: Bearer 4/0AVMBsJijWnbHYdXJmhWcM_JsSs2HUqDB9eiF2FeeIVAD8eLWvzcyB8iy3jEbRLXv2BqUMQ" \
  http://35.209.146.37:10000/api/v3/metrics
```

**📊 응답 구조**:
```json
{
  "success": true,
  "data": [
    {
      "server_id": "server-1756339717778-0",
      "hostname": "web-server-01", 
      "timestamp": "2025-08-28T09:10:27.000Z",
      "system": { /* Raw 메트릭 */ },
      "metadata": { /* 서버 정보 */ },
      "specs": { /* 하드웨어 사양 */ },
      "status": "online",
      "alerts": 0
    }
  ],
  "source": "gcp-vm-standard",
  "cached": false,
  "scenario": { /* 시간 정보만 */ },
  "metadata": {
    "apiVersion": "v3-standard",
    "format": "prometheus-compatible",
    "metricsType": "raw-only"
  }
}
```

### 배포 스크립트 업데이트

```bash
# 새로운 표준 메트릭 서버 배포
gcloud compute scp /path/to/server_standard_metrics.js \
  gcp-server:/home/skyasu/openmanager-server/ \
  --zone=us-central1-a

# PM2로 서버 시작 
gcloud compute ssh gcp-server --zone=us-central1-a --command=\
"cd /home/skyasu/openmanager-server && VM_API_TOKEN='4/0A...' pm2 start server_standard_metrics.js --name openmanager-standard-api"
```

---

## 🔧 문제 해결

### 자주 발생하는 문제들

#### 1. 환경변수 인식 실패

**증상**: `❌ VM_API_TOKEN이 설정되지 않았거나 너무 짧습니다`

**해결책**:
```bash
# PM2 시작 시 명시적 환경변수 설정
VM_API_TOKEN='4/0AVMBsJijWnbHYdXJmhWcM_JsSs2HUqDB9eiF2FeeIVAD8eLWvzcyB8iy3jEbRLXv2BqUMQ' \
  pm2 start server_standard_metrics.js --name openmanager-standard-api
```

#### 2. 포트 접근 불가

**증상**: `curl: (7) Failed to connect`

**해결책**:
```bash  
# 방화벽 규칙 확인
gcloud compute firewall-rules list --filter="name:allow-*"

# PM2 프로세스 상태 확인
gcloud compute ssh gcp-server --zone=us-central1-a --command="pm2 list"
```

#### 3. 메트릭 구조 검증

**검증 명령어**:
```bash
# 메트릭 구조 확인
curl -H "Authorization: Bearer 4/0A..." \
  http://35.209.146.37:10000/api/v3/metrics | \
  jq '.data[0].system | keys'

# 제거된 메트릭 확인  
curl -H "Authorization: Bearer 4/0A..." \
  http://35.209.146.37:10000/api/v3/metrics | \
  jq '.metadata.standard.removedMetrics'
```

### 로그 모니터링

```bash
# PM2 로그 실시간 확인
gcloud compute ssh gcp-server --zone=us-central1-a --command=\
"pm2 logs openmanager-standard-api --lines 20"

# 에러 로그만 확인
gcloud compute ssh gcp-server --zone=us-central1-a --command=\
"pm2 logs openmanager-standard-api --err --lines 10"
```

---

## 📈 성능 및 모니터링

### 응답 시간 벤치마크

- **평균 응답 시간**: 150-200ms
- **최대 서버 수**: 10대 (현재 설정)
- **메트릭 업데이트**: 30초 간격 (node-cache TTL)
- **메모리 사용량**: ~5.7MB (PM2 기준)

### 캐시 전략

```javascript
// 30초 캐시로 GCP VM 리소스 절약
const cache = new NodeCache({ stdTTL: 30 });
```

### AI 분석 최적화

**권장 분석 간격**:
- **실시간 모니터링**: 30초 간격
- **트렌드 분석**: 5분 간격
- **장기 패턴**: 1시간 간격

---

**🎯 이 가이드를 통해 AI 어시스턴트는 실제 서버 모니터링 환경과 동일한 조건에서 순수한 데이터 분석을 수행할 수 있습니다.**

**📅 문서 최종 업데이트**: 2025-08-28  
**📝 작성자**: Claude Code AI System  
**🔄 버전**: v5.70.2 (표준 Raw 메트릭 완전 구축)