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

## MCP 서버 구성

- MCP 서버는 **Next.js API Routes** 기반으로 동작하며 `/api/mcp`에서 요청을 처리합니다.
- Node.js 20 런타임에서 실행되며 **Vercel SDK** 없이 Route Handler만 사용합니다.
- Python 엔진 호출 주소는 `FASTAPI_BASE_URL` 환경변수로 지정합니다.

## 컨텍스트 사용 방식

- 모든 AI 요청은 `sessionId`를 기준으로 컨텍스트를 로드합니다.
- 단기 컨텍스트는 메모리 Map으로 관리하고, 장기 컨텍스트는 Redis에 저장됩니다.
- 프론트엔드에서 전달한 `context` 값과 병합해 MCP 서버에 전달합니다.

## Render 기반 Python 엔진 위치

- Python ML 엔진은 Render에서 운영되며 기본 URL은 `https://openmanager-ai-engine.onrender.com` 입니다.
- 로컬 테스트 시 위 주소 대신 로컬 FastAPI 서버 주소를 `FASTAPI_BASE_URL`에 설정합니다.

## 🛠️ 기술 스택

- Next.js 15 API Routes (Node.js)
- FastAPI
- Scikit-learn
- Transformers.js
- Redis
