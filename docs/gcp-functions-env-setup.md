# 🚀 GCP Functions 3-Tier Router 환경 변수 설정 가이드

## 📋 개요

OpenManager AI 엔진 이전 프로젝트를 위한 환경 변수 설정 가이드입니다.

**목표:**

- 베르셀 부하 75% 감소
- AI 처리 성능 50% 향상
- 무료 티어 100% 활용

## 🔧 필수 환경 변수

### 1. 3-Tier Router 활성화

```bash
# 3-Tier Router 활성화
THREE_TIER_AI_ENABLED=true

# 3-Tier Router 전략 (performance, cost, reliability)
THREE_TIER_STRATEGY=performance

# 3-Tier Router 타임아웃 설정 (밀리초)
THREE_TIER_LOCAL_TIMEOUT=5000
THREE_TIER_GCP_TIMEOUT=8000
THREE_TIER_GOOGLE_TIMEOUT=10000

# 3-Tier Router 폴백 정책 (aggressive, conservative, adaptive)
THREE_TIER_FALLBACK_POLICY=adaptive

# 3-Tier Router 로드 밸런싱
THREE_TIER_LOAD_BALANCING=true
THREE_TIER_GCP_WEIGHT=70
THREE_TIER_LOCAL_WEIGHT=20
THREE_TIER_GOOGLE_WEIGHT=10
```

### 2. GCP Functions 엔드포인트 설정

```bash
# GCP Functions 활성화
GCP_FUNCTIONS_ENABLED=true

# GCP Functions 타임아웃 및 재시도 설정
GCP_FUNCTIONS_TIMEOUT=8000
GCP_FUNCTIONS_MAX_RETRIES=2
GCP_FUNCTIONS_FALLBACK=true

# GCP Functions 엔드포인트 (Asia Northeast 3 - 서울)
GCP_AI_GATEWAY_URL=https://asia-northeast3-openmanager-ai.cloudfunctions.net/ai-gateway
GCP_KOREAN_NLP_URL=https://asia-northeast3-openmanager-ai.cloudfunctions.net/korean-nlp
GCP_RULE_ENGINE_URL=https://asia-northeast3-openmanager-ai.cloudfunctions.net/rule-engine
GCP_BASIC_ML_URL=https://asia-northeast3-openmanager-ai.cloudfunctions.net/basic-ml
```

### 3. VM Context API 설정

```bash
# VM Context API 활성화
GCP_VM_CONTEXT_ENABLED=true

# VM Context API 엔드포인트
GCP_VM_CONTEXT_URL=http://34.64.213.108:10001
```

### 4. 성능 모니터링 및 사용량 추적

```bash
# 성능 모니터링 활성화
PERFORMANCE_MONITORING_ENABLED=true

# GCP 무료 한도 모니터링 활성화
GCP_QUOTA_MONITORING_ENABLED=true

# 베르셀 부하 감소 목표 (%)
VERCEL_LOAD_REDUCTION_TARGET=75

# AI 처리 성능 향상 목표 (%)
AI_PERFORMANCE_IMPROVEMENT_TARGET=50
```

### 5. 개발 및 디버깅 설정

```bash
# 3-Tier Router 디버그 모드
THREE_TIER_DEBUG=false

# GCP Functions 디버그 로그
GCP_FUNCTIONS_DEBUG=false

# 성능 메트릭 로깅
PERFORMANCE_METRICS_LOGGING=true

# 사용량 통계 로깅
USAGE_STATS_LOGGING=true

# 폴백 이벤트 로깅
FALLBACK_EVENTS_LOGGING=true
```

## 🎯 전략별 최적화 설정

### 성능 우선 (Performance)

```bash
THREE_TIER_STRATEGY=performance
THREE_TIER_GCP_WEIGHT=70
THREE_TIER_LOCAL_TIMEOUT=3000
THREE_TIER_GCP_TIMEOUT=5000
```

### 비용 우선 (Cost)

```bash
THREE_TIER_STRATEGY=cost
THREE_TIER_GCP_WEIGHT=80
THREE_TIER_LOCAL_WEIGHT=15
THREE_TIER_GOOGLE_WEIGHT=5
```

### 안정성 우선 (Reliability)

```bash
THREE_TIER_STRATEGY=reliability
THREE_TIER_FALLBACK_POLICY=aggressive
THREE_TIER_MAX_RETRIES=3
```

## 📊 무료 한도 모니터링

GCP Functions 무료 한도:

- **호출 수**: 월 2,000,000회
- **컴퓨팅**: 월 400,000 GB-초
- **네트워크**: 월 25GB

목표 사용량 (안전 마진 90%):

- **호출 수**: 월 90,000회 (4.5%)
- **컴퓨팅**: 월 15,000 GB-초 (3.75%)
- **네트워크**: 월 5GB (20%)

## 🔧 설정 적용 방법

1. **프로덕션 환경 (.env.production)**

```bash
# 위의 환경 변수들을 .env.production에 추가
```

2. **개발 환경 (.env.local)**

```bash
# 개발용 설정 (더 관대한 타임아웃)
THREE_TIER_LOCAL_TIMEOUT=10000
THREE_TIER_GCP_TIMEOUT=15000
THREE_TIER_DEBUG=true
```

3. **Vercel 환경 변수**

```bash
# Vercel 대시보드에서 환경 변수 추가
# 또는 Vercel CLI 사용
vercel env add THREE_TIER_AI_ENABLED
vercel env add GCP_FUNCTIONS_ENABLED
# ... 기타 환경 변수들
```

## 🚀 활성화 확인

환경 변수 설정 후 다음 명령어로 확인:

```bash
# 개발 서버 시작
npm run dev

# 로그에서 다음 메시지 확인
# "✅ 3-Tier AI Router 활성화됨 (GCP Functions 통합)"
# "✅ GCP Functions Service 초기화 완료"
```

## 🔍 문제 해결

### 1. GCP Functions 연결 실패

```bash
# 엔드포인트 URL 확인
curl https://asia-northeast3-openmanager-ai.cloudfunctions.net/ai-gateway/health

# 응답 예시:
# {"status":"healthy","service":"ai-gateway","timestamp":"..."}
```

### 2. VM Context API 연결 실패

```bash
# VM Context API 상태 확인
curl http://34.64.213.108:10001/health

# 응답 예시:
# {"status":"healthy","service":"vm-context-api","port":10001}
```

### 3. 타임아웃 문제

```bash
# 타임아웃 값 증가
THREE_TIER_GCP_TIMEOUT=15000
THREE_TIER_LOCAL_TIMEOUT=8000
```

## 📈 성능 모니터링

시스템 상태 확인:

```bash
# Next.js 앱에서 확인
GET /api/ai/status

# 응답 예시:
{
  "currentMode": "THREE_TIER",
  "architecture": "3-tier-integrated",
  "benefits": {
    "vercelLoadReduction": "75%",
    "aiPerformanceImprovement": "50%"
  }
}
```

## 🔄 마이그레이션 체크리스트

- [ ] 환경 변수 설정 완료
- [ ] GCP Functions 배포 확인
- [ ] VM Context API 동작 확인
- [ ] 3-Tier Router 활성화 확인
- [ ] 무료 한도 모니터링 설정
- [ ] 성능 메트릭 수집 활성화
- [ ] 폴백 전략 테스트
- [ ] 프로덕션 배포 준비
