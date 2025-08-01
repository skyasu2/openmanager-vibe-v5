# MCP 메트릭 처리기 (GCP Functions)

10개 MCP 서버의 실시간 메트릭 수집 및 처리를 위한 서버리스 시스템

## 🎯 개요

OpenManager VIBE v5의 MCP (Model Context Protocol) 서버 모니터링을 위한 고성능 Python 3.11 기반 GCP Functions입니다.

### 주요 특징

- **실시간 메트릭 수집**: 10개 MCP 서버 동시 모니터링
- **Circuit Breaker 패턴**: 시스템 안정성 보장
- **무료 티어 최적화**: 256MB 메모리, <100ms 응답시간
- **고성능**: 99.5% 성공률, 비동기 처리
- **포괄적 분석**: 상태 분류, 알림 생성, 트렌드 분석

## 🏗️ 아키텍처

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   HTTP Request  │───▶│  Circuit Breaker │───▶│  Main Handler   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Collector     │◀───│   Async Tasks    │◀───│  Request Router │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ MCP Servers (10)│    │   Processor      │───▶│  JSON Response  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📊 모니터링 대상 MCP 서버

| 서버명 | 타입 | 우선순위 | 런타임 | 임계값 (ms) |
|--------|------|----------|--------|-------------|
| filesystem | core | critical | node | 100 |
| memory | core | critical | node | 150 |
| supabase | core | critical | node | 300 |
| github | core | high | node | 200 |
| serena | analysis | high | python | 600 |
| tavily-mcp | utility | medium | node | 500 |
| sequential-thinking | analysis | medium | node | 400 |
| playwright | utility | medium | node | 800 |
| context7 | utility | medium | node | 300 |
| time | utility | low | python | 200 |

## 🚀 배포

### 1. 사전 요구사항

```bash
# GCP CLI 인증
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Python 3.11 및 의존성
python3.11 --version
pip install -r requirements.txt
```

### 2. 배포 실행

```bash
# 개별 배포
./deploy.sh

# 전체 배포에 포함
cd ../deployment
./deploy-all.sh
```

### 3. 배포 검증

```bash
# 헬스 체크
curl "https://REGION-PROJECT.cloudfunctions.net/mcp-metrics-processor-health"

# 메트릭 수집 테스트
curl "https://REGION-PROJECT.cloudfunctions.net/mcp-metrics-processor?operation=health_check"
```

## 📡 API 엔드포인트

### GET /mcp-metrics-processor

#### 1. 전체 메트릭 수집

```bash
curl "https://REGION-PROJECT.cloudfunctions.net/mcp-metrics-processor?operation=collect_all"
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_servers": 10,
      "healthy_count": 8,
      "degraded_count": 1,
      "unhealthy_count": 1,
      "overall_health_score": 85.2,
      "average_response_time_ms": 142.5,
      "total_error_rate": 2.1
    },
    "servers": {
      "filesystem": {
        "name": "filesystem",
        "status": "healthy",
        "response_time_ms": 89.5,
        "error_rate": 0.0,
        "uptime_percentage": 99.9,
        "consecutive_failures": 0
      }
    },
    "alerts": [
      {
        "severity": "warning",
        "server_name": "github",
        "metric_type": "response_time",
        "current_value": 250.0,
        "threshold_value": 200.0,
        "message": "High response time: 250.0ms > 200ms"
      }
    ],
    "recommendations": [
      {
        "priority": "medium",
        "category": "performance",
        "title": "1개 서버의 응답 시간 개선 필요",
        "action": "리소스 할당 검토 또는 최적화를 고려하세요.",
        "affected_servers": ["github"]
      }
    ]
  },
  "metadata": {
    "processing_time_ms": 95.2,
    "timestamp": "2025-07-31T10:30:00Z"
  }
}
```

#### 2. 특정 서버 메트릭

```bash
curl "https://REGION-PROJECT.cloudfunctions.net/mcp-metrics-processor?operation=collect_specific&servers=filesystem&servers=memory"
```

#### 3. 헬스 체크

```bash
curl "https://REGION-PROJECT.cloudfunctions.net/mcp-metrics-processor?operation=health_check"
```

#### 4. 성능 요약

```bash
curl "https://REGION-PROJECT.cloudfunctions.net/mcp-metrics-processor?operation=performance_summary"
```

### POST /mcp-metrics-processor

```bash
curl -X POST "https://REGION-PROJECT.cloudfunctions.net/mcp-metrics-processor" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "collect_specific",
    "servers": ["filesystem", "memory", "github"],
    "include_history": true
  }'
```

## ⚡ 성능 최적화

### 무료 티어 설정

- **메모리**: 256MB (최소)
- **타임아웃**: 60초
- **동시성**: 80 요청
- **최대 인스턴스**: 10개
- **콜드 스타트**: 허용 (비용 절약)

### 캐싱 전략

```python
# 15초 메트릭 캐시
cache_ttl = 15

# 30초 CDN 캐시
'Cache-Control': 'public, max-age=30, s-maxage=60'
```

### 병렬 처리

```python
# Critical 서버 우선 처리
critical_tasks = [collect_server_metrics(server) for server in critical_servers]
critical_results = await asyncio.gather(*critical_tasks)

# 나머지 서버 병렬 처리
other_tasks = [collect_server_metrics(server) for server in other_servers]
other_results = await asyncio.gather(*other_tasks)
```

## 🔒 Circuit Breaker 패턴

### 설정

```python
CircuitBreaker(
    failure_threshold=5,    # 5회 연속 실패 시 차단
    reset_timeout=60,       # 60초 후 재시도
    half_open_max_calls=3,  # Half-Open에서 최대 3회 호출
    success_threshold=2     # 2회 성공 시 정상 복구
)
```

### 상태 전환

```
Closed ──5회 실패──▶ Open ──60초 후──▶ Half-Open ──2회 성공──▶ Closed
   ▲                     │                 │
   └─────────────────────┘                 └──1회 실패──▶ Open
```

## 🧪 테스트

### 로컬 테스트

```bash
# 단위 테스트
python -m pytest test_metrics_processor.py -v

# 커버리지 포함
python -m pytest test_metrics_processor.py --cov=. --cov-report=html

# 특정 테스트
python -m pytest test_metrics_processor.py::TestMCPMetricsCollector::test_collect_all_metrics_mock -v
```

### 로컬 서버 실행

```bash
# Functions Framework로 로컬 실행
python main.py

# 테스트 요청
curl "http://localhost:8080?operation=health_check"
curl "http://localhost:8080/health"
```

## 📊 모니터링 및 알림

### 알림 유형

1. **Critical**: 즉시 대응 필요
   - 서버 다운 (연속 5회 실패)
   - 응답 시간 > 500ms
   - 에러율 > 10%

2. **Warning**: 주의 필요
   - 응답 시간 > 임계값
   - 에러율 > 5%
   - 연속 3회 실패

3. **Info**: 정보성
   - 상태 변경
   - 성능 개선

### GCP 로그 모니터링

```bash
# 실시간 로그
gcloud functions logs tail mcp-metrics-processor --region=us-central1

# 에러 로그 필터
gcloud logging read 'resource.type="cloud_function" AND resource.labels.function_name="mcp-metrics-processor" AND severity>=ERROR' --limit=50

# 성능 메트릭
gcloud logging read 'resource.type="cloud_function" AND resource.labels.function_name="mcp-metrics-processor" AND textPayload:"processing_time"' --limit=20
```

## 🛠️ 개발 가이드

### 파일 구조

```
mcp-metrics-processor/
├── main.py                 # HTTP 엔트리포인트
├── collector.py            # 메트릭 수집기
├── processor.py            # 데이터 처리기
├── circuit_breaker.py      # Circuit Breaker 패턴
├── requirements.txt        # Python 의존성
├── deploy.sh              # 배포 스크립트
├── test_metrics_processor.py # 테스트 스위트
└── README.md              # 문서
```

### 새로운 메트릭 추가

1. `collector.py`에서 `_load_server_configs()` 수정
2. `processor.py`에서 임계값 설정 추가
3. 테스트 케이스 추가

### 새로운 알림 타입 추가

1. `processor.py`의 `_generate_performance_alerts()` 수정
2. 알림 심각도 및 메시지 정의
3. 추천사항 로직 추가

## 🚨 문제 해결

### 일반적인 문제

1. **배포 실패**
   ```bash
   # 권한 확인
   gcloud auth list
   gcloud projects get-iam-policy PROJECT_ID
   
   # API 활성화 확인
   gcloud services list --enabled | grep cloudfunctions
   ```

2. **메모리 부족**
   ```bash
   # 메모리 사용량 확인
   gcloud functions logs read mcp-metrics-processor --filter="severity>=WARNING"
   
   # 메모리 증설 (비용 주의)
   gcloud functions deploy mcp-metrics-processor --memory=512MB
   ```

3. **타임아웃**
   ```bash
   # 타임아웃 로그 확인
   gcloud logging read 'resource.type="cloud_function" AND textPayload:"timeout"'
   
   # 비동기 처리 최적화 필요
   ```

### 성능 튜닝

1. **응답 시간 개선**
   - 캐시 TTL 조정 (15초 → 30초)
   - 병렬 처리 최적화
   - 불필요한 메트릭 제거

2. **메모리 최적화**
   - 히스토리 크기 제한 (100 → 50)
   - 무거운 라이브러리 제거
   - 가비지 컬렉션 강제 실행

3. **오류율 감소**
   - Circuit Breaker 임계값 조정
   - 재시도 로직 개선
   - 타임아웃 최적화

## 📈 성능 지표

### 목표 성능

- **응답 시간**: < 100ms (평균)
- **성공률**: > 99.5%
- **메모리 사용량**: < 256MB
- **콜드 스타트**: < 2초

### 실제 성능 (측정 예시)

- **평균 응답시간**: 95ms
- **성공률**: 99.8%
- **메모리 피크**: 180MB
- **콜드 스타트**: 1.2초

## 🔗 관련 링크

- [GCP Functions 문서](https://cloud.google.com/functions/docs)
- [Python 3.11 가이드](https://docs.python.org/3.11/)
- [Circuit Breaker 패턴](https://martinfowler.com/bliki/CircuitBreaker.html)
- [OpenManager VIBE v5 문서](/docs/)

## 📄 라이센스

MIT License - OpenManager VIBE v5 프로젝트의 일부

---

💡 **성능 최적화 팁**: 무료 티어 한도 내에서 최대 성능을 위해 캐싱과 비동기 처리를 적극 활용하세요.