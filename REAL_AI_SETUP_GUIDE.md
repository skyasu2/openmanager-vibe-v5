# 🧠 실제 AI 서비스 설정 가이드

OpenManager Vibe v5에서 실제로 동작하는 AI 기능을 사용하기 위한 완전한 설정 가이드입니다.

## 📋 목차

1. [개요](#개요)
2. [환경 변수 설정](#환경-변수-설정)
3. [AI 모델 API 키 발급](#ai-모델-api-키-발급)
4. [Python 백엔드 배포](#python-백엔드-배포)
5. [Redis 설정](#redis-설정)
6. [실제 동작 테스트](#실제-동작-테스트)
7. [무료 운영 가이드](#무료-운영-가이드)

## 🎯 개요

이 프로젝트는 **실제로 동작하는** AI 기반 서버 모니터링 시스템입니다:

- ✅ **실제 AI 모델**: GPT-3.5, Claude 3, Gemini 등
- ✅ **실제 메트릭 수집**: 시스템 리소스 실시간 모니터링
- ✅ **실제 Python ML**: scikit-learn 기반 이상 탐지
- ✅ **실제 캐싱**: Redis 또는 메모리 캐시
- ✅ **완전 무료**: 모든 서비스를 무료 tier로 운영 가능

## 🔧 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하세요:

```bash
# 🧠 AI Services (선택적 - 하나라도 있으면 실제 AI 사용)
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-key-here

# 🐍 Python Backend (Render.com 무료 배포)
PYTHON_SERVICE_URL=https://your-python-app.onrender.com

# 📊 Redis Cache (선택적 - 없으면 메모리 캐시 사용)
REDIS_URL=redis://default:password@redis-host:port

# 📈 Prometheus (선택적 - 없으면 시스템 API 사용)
PROMETHEUS_URL=http://localhost:9090

# 🔐 Database (PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/db

# 🎛️ 기능 제어
ENABLE_REAL_AI=true
ENABLE_PYTHON_BACKEND=true
ENABLE_REDIS_CACHE=true
ENABLE_PROMETHEUS_COLLECTION=true
```

## 🤖 AI 모델 API 키 발급

### 1. OpenAI (GPT-3.5-turbo) - 권장

**무료 tier**: 월 $5 크레딧 (신규 가입시)

1. [OpenAI Platform](https://platform.openai.com/) 가입
2. API Keys 섹션에서 새 키 생성
3. `.env.local`에 `OPENAI_API_KEY` 추가

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Anthropic (Claude 3 Haiku) - 고품질

**무료 tier**: 월 $5 크레딧

1. [Anthropic Console](https://console.anthropic.com/) 가입
2. API Keys에서 새 키 생성
3. `.env.local`에 `ANTHROPIC_API_KEY` 추가

```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Google (Gemini 1.5 Flash) - 가장 관대한 무료 tier

**무료 tier**: 월 15 RPM, 일 1,500 요청

1. [Google AI Studio](https://aistudio.google.com/) 접속
2. API 키 생성
3. `.env.local`에 `GOOGLE_GENERATIVE_AI_API_KEY` 추가

```bash
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 💡 API 키 없이도 동작!

API 키가 없어도 **로컬 분석기**가 자동으로 작동합니다:
- 키워드 기반 의도 분류
- 시스템 메트릭 기반 분석
- 실제 시스템 데이터 활용

## 🐍 Python 백엔드 배포 (Render.com 무료)

### 1. Render.com 계정 생성

1. [Render.com](https://render.com/) 가입 (GitHub 연동)
2. 무료 tier: 월 750시간 (충분함)

### 2. 배포 준비

이미 프로젝트에 포함된 파일들:
- `ai-engine-py/render.yaml` - 배포 설정
- `ai-engine-py/requirements.txt` - 의존성
- `ai-engine-py/predictor.py` - 메인 ML 서비스

### 3. Render에서 서비스 생성

1. Render 대시보드에서 "New Web Service" 클릭
2. GitHub 저장소 연결
3. 설정:
   - **Root Directory**: `ai-engine-py`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 4. 환경 변수 설정

Render 서비스 설정에서 환경 변수 추가:
```bash
REDIS_URL=redis://your-redis-url (선택적)
LOG_LEVEL=info
```

### 5. 배포 URL 확인

배포 완료 후 URL을 `.env.local`에 추가:
```bash
PYTHON_SERVICE_URL=https://your-app-name.onrender.com
```

## 🗄️ Redis 설정 (선택적)

### 무료 Redis 옵션들:

#### 1. Redis Cloud (권장)
- **무료 tier**: 30MB, 월 30M 명령
- [Redis Cloud](https://redis.com/try-free/) 가입
- 데이터베이스 생성 후 연결 URL 복사

#### 2. Upstash Redis
- **무료 tier**: 10,000 요청/일
- [Upstash](https://upstash.com/) 가입
- Redis 데이터베이스 생성

#### 3. 로컬 Redis (개발용)
```bash
# Docker로 실행
docker run -d -p 6379:6379 redis:alpine

# 또는 직접 설치
brew install redis  # macOS
redis-server
```

연결 URL 설정:
```bash
REDIS_URL=redis://default:password@host:port
```

## 🏃‍♂️ 실제 동작 테스트

### 1. 개발 서버 시작

```bash
npm run dev
```

### 2. 테스트 페이지 접속

브라우저에서 `http://localhost:3000/test-ai-real` 접속

### 3. 기능 테스트

#### 시스템 상태 확인
- "새로고침" 버튼 클릭
- 모든 서비스 상태 확인

#### AI 분석 테스트
- 빠른 질문 중 하나 선택
- 또는 직접 질문 입력:
  - "현재 서버 상태가 어떤가요?"
  - "CPU 사용률이 높은 이유를 분석해주세요"
  - "메모리 최적화 방법을 알려주세요"

#### 결과 확인
- AI 분석 결과
- 성능 정보 (처리 시간, 캐시 등)
- 데이터 소스 (AI, Prometheus, Python, MCP, Redis)

## 💰 무료 운영 가이드

### 월 비용 $0으로 운영하기

1. **AI 모델**: Google Gemini 무료 tier 사용
2. **Python 백엔드**: Render.com 무료 tier
3. **Redis**: Redis Cloud 무료 tier 또는 메모리 캐시
4. **Frontend**: Vercel 무료 tier
5. **Database**: PostgreSQL (Neon, Supabase 무료 tier)

### 사용량 모니터링

- AI API 호출 수 체크
- Render 서비스 시간 확인 (월 750시간)
- Redis 메모리 사용량 모니터링

### 비용 절약 팁

1. **캐싱 활용**: Redis로 AI 응답 캐시
2. **폴백 사용**: API 한도 초과시 로컬 분석기 사용
3. **배치 처리**: 여러 요청을 묶어서 처리
4. **모델 선택**: 용도에 맞는 AI 모델 선택

## 🔍 문제 해결

### 일반적인 문제들

#### 1. AI API 오류
```
❌ AI 분석 실패: API key not found
```
**해결책**: `.env.local`에 올바른 API 키 설정

#### 2. Python 서비스 오류
```
❌ Python 분석 서버가 응답하지 않습니다
```
**해결책**: Render 서비스 상태 확인, URL 검증

#### 3. Redis 연결 오류
```
⚠️ 캐시 조회 실패: Redis connection failed
```
**해결책**: 자동으로 메모리 캐시로 폴백됨

### 로그 확인

개발자 도구 콘솔에서 상세 로그 확인:
```javascript
// 브라우저 콘솔에서
localStorage.setItem('debug', 'true')
```

## 🚀 프로덕션 배포

### Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

### 환경 변수 설정

Vercel 대시보드에서 환경 변수 추가:
- 모든 `.env.local` 변수들
- `NODE_ENV=production`

## 📊 성능 최적화

### 캐시 전략
- AI 응답: 5분 캐시
- 메트릭 데이터: 30초 캐시
- 시스템 상태: 1분 캐시

### 모니터링
- API 응답 시간 추적
- 캐시 히트율 모니터링
- 오류율 체크

## 🤝 기여하기

1. Fork 후 브랜치 생성
2. 새로운 AI 모델 통합
3. 추가 메트릭 수집기 구현
4. UI/UX 개선

## 📞 지원

문제가 있으시면:
1. GitHub Issues 등록
2. 로그와 환경 정보 첨부
3. 재현 단계 상세 기술

---

**🎉 이제 실제로 동작하는 AI 기반 서버 모니터링 시스템을 무료로 운영할 수 있습니다!** 