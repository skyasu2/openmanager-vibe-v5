# AI Engine Setup Guide

## 개요

OpenManager Vibe v5는 하이브리드 AI 엔진 아키텍처를 사용합니다:
- **내부 AI 엔진 (v3)**: 주요 분석 엔진 (`/api/v3/ai`)
- **외부 Python AI 엔진**: FastAPI 기반 백업 엔진

## 환경변수 설정

### 필수 환경변수

```bash
# AI 엔진 기본 URL
FASTAPI_BASE_URL=https://openmanager-ai-engine.onrender.com

# AI 엔진 타임아웃 (밀리초)
AI_ENGINE_TIMEOUT=30000

# AI 엔진 재시도 횟수
AI_ENGINE_RETRY_COUNT=3
```

### 선택적 환경변수

```bash
# 내부 AI 엔진 활성화
INTERNAL_AI_ENGINE_ENABLED=true

# 내부 AI 엔진 실패 시 외부 엔진 사용
INTERNAL_AI_ENGINE_FALLBACK=true

# Python 서비스 웜업 설정
PYTHON_SERVICE_WARMUP_ENABLED=true
PYTHON_SERVICE_MAX_WARMUPS=4
PYTHON_SERVICE_WARMUP_INTERVAL=480000
```

## AI 엔진 아키텍처

### 1. 내부 AI 엔진 (v3)
- **경로**: `/api/v3/ai`
- **장점**: 낮은 레이턴시, 높은 안정성
- **용도**: 주요 분석 작업

### 2. 외부 Python AI 엔진
- **경로**: `${FASTAPI_BASE_URL}/analyze`
- **장점**: 고급 ML 모델, 확장성
- **용도**: 복잡한 분석, 백업

## 웜업 시스템

### 제한된 웜업 (권장)
```typescript
const warmupService = PythonWarmupService.getInstance();
warmupService.startLimitedWarmupSystem(); // 최대 4회
```

### 무제한 웜업 (개발용)
```typescript
warmupService.startWarmupSystem(); // 무제한
```

## 모니터링

### AI 엔진 상태 확인
```bash
curl http://localhost:3000/api/analyze
```

### 웜업 상태 확인
```bash
curl http://localhost:3000/api/system/python-warmup
```

## 트러블슈팅

### 1. AI 엔진 연결 실패
- 환경변수 `FASTAPI_BASE_URL` 확인
- 네트워크 연결 상태 확인
- 내부 AI 엔진 상태 확인

### 2. 웜업 실패
- Python 서비스 상태 확인
- 웜업 카운터 리셋: `warmupService.resetWarmupCounter()`

### 3. 성능 저하
- 내부 AI 엔진 우선 사용 확인
- 웜업 시스템 활성화 확인
- 모니터링 메트릭 확인

## 최적화 팁

1. **내부 AI 엔진 우선 사용**: 더 빠른 응답시간
2. **제한된 웜업 사용**: 리소스 절약
3. **모니터링 활성화**: 성능 추적
4. **적절한 타임아웃 설정**: 안정성 확보

## 개발 환경 설정

```bash
# .env.local 파일 생성
FASTAPI_BASE_URL=http://localhost:8000
INTERNAL_AI_ENGINE_ENABLED=true
PYTHON_SERVICE_WARMUP_ENABLED=false
DEBUG_MODE=true
```

## 프로덕션 환경 설정

```bash
# .env.production 파일
FASTAPI_BASE_URL=https://your-production-ai-service.com
INTERNAL_AI_ENGINE_ENABLED=true
INTERNAL_AI_ENGINE_FALLBACK=true
PYTHON_SERVICE_WARMUP_ENABLED=true
PYTHON_SERVICE_MAX_WARMUPS=4
``` 