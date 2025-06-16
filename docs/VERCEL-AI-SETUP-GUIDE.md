# 🚀 Vercel 배포 AI 자연어 질의 기능 설정 가이드

## 📋 개요

로컬 테스트에서 성공한 AI 자연어 질의 기능을 Vercel 배포 환경에서도 정상 동작하도록 설정하는 가이드입니다.

## ✅ 로컬 테스트 성공 확인

현재 로컬 환경에서 다음 기능들이 정상 동작하고 있습니다:

- ✅ 기본 헬스체크: 정상 (1ms 응답시간)
- ✅ Smart Fallback API: 405 오류 완전 해결, POST 요청 정상
- ✅ 로그 API: 10개 로그 정상 반환
- ✅ 스트림 API: 연결 성공 (200 응답)
- ✅ 자연어 질의: "CPU 사용률이 높은 서버를 찾아줘" 등 정상 처리

## 🔧 Vercel 환경변수 설정

### 1. 필수 환경변수 (로컬에서 검증된 설정)

Vercel 대시보드 → Settings → Environment Variables에서 다음 환경변수들을 설정하세요:

#### 🗄️ Supabase 설정 (필수)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU
SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8
```

#### 🔴 Redis 설정 (Upstash)

```bash
REDIS_URL=rediss://default:AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA@charming-condor-46598.upstash.io:6379
UPSTASH_REDIS_REST_URL=https://charming-condor-46598.upstash.io
UPSTASH_REDIS_REST_TOKEN=AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA
KV_REST_API_URL=https://charming-condor-46598.upstash.io
KV_REST_API_TOKEN=AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA
```

#### 🤖 AI 엔진 설정 (자연어 질의 핵심)

```bash
AI_ASSISTANT_ENABLED=true
AI_ENGINE_TIMEOUT=8000
AI_CACHE_ENABLED=true
AI_CACHE_TTL=300000
```

#### 🌍 기본 환경 설정

```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
SKIP_ENV_VALIDATION=true
```

#### 🚀 Vercel 최적화 설정

```bash
DATA_GENERATOR_ENABLED=true
MAX_SERVERS=10
UPDATE_INTERVAL=60000
SERVER_MONITORING_ENABLED=true
AUTO_REPORTING_ENABLED=true
```

### 2. 환경변수 설정 방법

1. **Vercel 대시보드 접속**: <https://vercel.com/dashboard>
2. **프로젝트 선택**: openmanager-vibe-v5
3. **Settings → Environment Variables** 메뉴 이동
4. **Add New** 버튼 클릭
5. 각 환경변수를 **Production, Preview, Development** 모든 환경에 추가

## 🧪 테스트 방법

### 1. 배포 후 테스트 페이지 접속

배포가 완료되면 다음 URL에서 테스트:

```
https://your-vercel-domain.vercel.app/test-vercel-ai-natural-query.html
```

### 2. 테스트 시나리오

1. **환경변수 확인**: 페이지 로드 시 자동으로 헬스체크 실행
2. **자연어 질의 테스트**:
   - 입력 예시: "CPU 사용률이 높은 서버를 찾아줘"
   - "자연어 질의 실행" 버튼 클릭
3. **Smart Fallback 테스트**: API 라우팅 정상 동작 확인
4. **기타 API 테스트**: 헬스체크, 로그 API, 스트림 API 확인

### 3. 성공 기준

모든 테스트가 ✅ 성공으로 표시되어야 합니다:

- 🔗 환경변수 확인: ✅ 성공
- 🧠 자연어 질의: ✅ 성공
- 🔧 Smart Fallback: ✅ 성공
- 📡 헬스체크: ✅ 성공
- 📋 로그 API: ✅ 성공
- 🌊 스트림 API: ✅ 성공

## 🔍 문제 해결

### 1. 환경변수 누락 오류

**증상**: "NEXT_PUBLIC_SUPABASE_URL is required" 오류
**해결**: Vercel 대시보드에서 모든 Supabase 환경변수 재확인

### 2. Smart Fallback 405 오류

**증상**: POST 요청 시 405 Method Not Allowed
**해결**: 이미 로컬에서 해결됨. 환경변수 설정 후 재배포

### 3. Redis 연결 오류

**증상**: Redis 관련 오류 메시지
**해결**: Upstash Redis 환경변수 모두 설정 확인

### 4. AI 엔진 타임아웃

**증상**: AI 응답 시간 초과
**해결**: `AI_ENGINE_TIMEOUT=8000` 설정 확인

## 🚀 배포 명령어

```bash
# 환경변수 설정 후 배포
git add .
git commit -m "Vercel AI 자연어 질의 기능 환경변수 설정"
git push origin main

# 또는 수동 배포
vercel --prod
```

## 📊 성능 최적화

Vercel 무료 티어에서 안정적으로 동작하도록 최적화된 설정:

- 함수 실행 시간: 8초 이내
- 메모리 사용량: 1024MB 이내
- 서버 시뮬레이션: 10개로 제한
- 업데이트 간격: 60초 (로컬 20초 → 프로덕션 60초)

## 🎯 핵심 포인트

1. **로컬 성공 설정 복사**: 로컬에서 성공한 환경변수를 그대로 Vercel에 적용
2. **모든 환경에 설정**: Production, Preview, Development 모든 환경에 환경변수 추가
3. **재배포 필수**: 환경변수 설정 후 반드시 재배포 실행
4. **테스트 페이지 활용**: 배포 후 테스트 페이지로 기능 검증

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. Vercel 대시보드에서 환경변수 설정 상태
2. 배포 로그에서 오류 메시지 확인
3. 테스트 페이지에서 구체적인 오류 내용 확인

---

**🎉 성공 시**: 로컬과 동일하게 Vercel 배포에서도 AI 자연어 질의 기능이 완벽하게 동작합니다!
