# 🌍 OpenManager Vibe v5 환경 설정 가이드

## 📋 목차

1. [환경 개요](#환경-개요)
2. [로컬 개발 환경](#로컬-개발-환경)
3. [Vercel 배포 환경](#vercel-배포-환경)
4. [환경 변수 설정](#환경-변수-설정)
5. [데이터베이스 설정](#데이터베이스-설정)
6. [AI 엔진 설정](#ai-엔진-설정)
7. [테스트 환경](#테스트-환경)
8. [문제 해결](#문제-해결)

---

## 🌍 환경 개요

OpenManager Vibe v5는 3가지 주요 환경에서 동작합니다:

### 환경 분류

- **🏠 로컬 개발환경** (`NODE_ENV=development`)
  - 모든 기능 활성화
  - 목업 데이터 사용
  - 디버그 로깅 활성화
  - 무제한 리소스

- **🌐 Vercel 배포환경** (`VERCEL=1`)
  - 메모리 1024MB 제한
  - 타임아웃 30초
  - GCP 실제 데이터만 사용
  - WebSocket 비활성화

- **🧪 테스트 환경** (`NODE_ENV=test`)
  - 모든 외부 연결 차단
  - 완전한 모킹 시스템
  - Redis/Database 연결 비활성화

---

## 🏠 로컬 개발 환경

### 1. 필수 요구사항

```bash
# Node.js 버전 확인
node --version  # v20.0.0 이상 필요

# npm 버전 확인
npm --version   # v10.0.0 이상 권장
```

### 2. 프로젝트 설정

```bash
# 저장소 클론
git clone https://github.com/your-org/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 의존성 설치
npm ci

# 환경 변수 파일 생성
cp .env.local.example .env.local
```

### 3. 로컬 환경 변수 설정

```bash
# .env.local 파일 내용
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development

# 데이터베이스 설정
SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Redis 설정 (로컬에서는 목업 사용)
REDIS_CONNECTION_DISABLED=true
UPSTASH_REDIS_DISABLED=true

# AI 엔진 설정
GOOGLE_AI_ENABLED=true
GOOGLE_AI_QUOTA_PROTECTION=true
GOOGLE_AI_TEST_LIMIT_PER_DAY=5

# 개발 도구 활성화
DISABLE_HEALTH_CHECK=false
HEALTH_CHECK_CONTEXT=true
```

### 4. 개발 서버 실행

```bash
# 개발 서버 시작
npm run dev

# 또는 디버그 모드로 실행
npm run dev:debug

# 테스트 실행
npm test

# 빌드 테스트
npm run build
```

---

## 🌐 Vercel 배포 환경

### 1. Vercel CLI 설치

```bash
# Vercel CLI 전역 설치
npm install -g vercel

# Vercel 로그인
vercel login

# 프로젝트 연결
vercel link
```

### 2. Vercel 환경 변수 설정

```bash
# 환경 변수 추가
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add GOOGLE_AI_API_KEY

# 환경 변수 가져오기
vercel env pull .env.local
```

### 3. Vercel 최적화 설정

```javascript
// vercel.json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

### 4. 배포 실행

```bash
# 프로덕션 배포
vercel --prod

# 프리뷰 배포
vercel

# 배포 상태 확인
vercel ls
```

---

## 🔧 환경 변수 설정

### 필수 환경 변수

#### 데이터베이스 (Supabase)

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@host:5432/db
```

#### AI 엔진

```bash
# Google AI 설정
GOOGLE_AI_API_KEY=your-google-ai-key
GOOGLE_AI_ENABLED=true
GOOGLE_AI_QUOTA_PROTECTION=true
GOOGLE_AI_NATURAL_LANGUAGE_ONLY=true

# AI 엔진 모드 설정
AI_ENGINE_MODE=AUTO  # AUTO | LOCAL | GOOGLE_ONLY
```

#### Redis 캐시

```bash
# Upstash Redis 설정
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# 로컬 개발시 Redis 비활성화
REDIS_CONNECTION_DISABLED=true
UPSTASH_REDIS_DISABLED=true
```

#### 시스템 설정

```bash
# 환경 감지
NODE_ENV=development|production|test
VERCEL=1  # Vercel 환경에서 자동 설정
VERCEL_ENV=development|preview|production

# 기능 토글
DISABLE_HEALTH_CHECK=false
HEALTH_CHECK_CONTEXT=true
FORCE_MOCK_GOOGLE_AI=false
```

### 선택적 환경 변수

#### 모니터링 및 로깅

```bash
# 로깅 설정
LOG_LEVEL=info|debug|warn|error
ENABLE_PERFORMANCE_MONITORING=true

# 외부 서비스
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

#### 보안 설정

```bash
# API 보안
API_SECRET_KEY=your-secret-key
CORS_ORIGIN=http://localhost:3000,https://your-domain.com

# 암호화
ENCRYPTION_KEY=your-32-char-encryption-key
```

---

## 🗄️ 데이터베이스 설정

### Supabase 설정

#### 1. 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 새 프로젝트 생성
3. 데이터베이스 비밀번호 설정

#### 2. 테이블 생성

```sql
-- infra/database/supabase-quick-setup.sql 실행
-- 주요 테이블: servers, metrics, alerts, logs
```

#### 3. RLS (Row Level Security) 설정

```sql
-- 보안 정책 활성화
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
```

#### 4. API 키 확인

```bash
# 프로젝트 설정 > API에서 확인
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Redis 설정 (Upstash)

#### 1. Upstash 계정 생성

1. [Upstash Console](https://console.upstash.com/) 접속
2. Redis 데이터베이스 생성
3. REST API 정보 복사

#### 2. 연결 정보 설정

```bash
UPSTASH_REDIS_REST_URL=https://your-redis-id.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

---

## 🤖 AI 엔진 설정

### Google AI Studio 설정

#### 1. API 키 발급

1. [Google AI Studio](https://aistudio.google.com/) 접속
2. API 키 생성
3. 할당량 확인 (일일 1,500회)

#### 2. 환경 변수 설정

```bash
GOOGLE_AI_API_KEY=AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM
GOOGLE_AI_ENABLED=true
GOOGLE_AI_QUOTA_PROTECTION=true
```

### AI 엔진 모드

#### AUTO 모드 (기본값)

- Supabase RAG (50%) → MCP+하위AI (30%) → 하위AI (18%) → Google AI (2%)
- 응답 시간: ~850ms

#### LOCAL 모드

- Supabase RAG (80%) → MCP+하위AI (20%)
- Google AI 제외, 응답 시간: ~620ms

#### GOOGLE_ONLY 모드

- Google AI (80%) → Supabase RAG (15%) → 하위AI (5%)
- 고급 추론, 응답 시간: ~1200ms

```bash
# 모드 설정
AI_ENGINE_MODE=AUTO  # 또는 LOCAL, GOOGLE_ONLY
```

---

## 🧪 테스트 환경

### Jest 설정

#### 1. 테스트 환경 변수

```bash
# tests/scripts/.env.test
NODE_ENV=test
REDIS_CONNECTION_DISABLED=true
UPSTASH_REDIS_DISABLED=true
DISABLE_HEALTH_CHECK=true
FORCE_MOCK_GOOGLE_AI=true
```

#### 2. 테스트 실행

```bash
# 단위 테스트
npm test

# 통합 테스트
npm run test:integration

# E2E 테스트
npm run test:e2e

# 커버리지 리포트
npm run test:coverage
```

### 모킹 시스템

#### 완전 모킹 활성화

```typescript
// tests/setup.ts
process.env.REDIS_CONNECTION_DISABLED = 'true';
process.env.UPSTASH_REDIS_DISABLED = 'true';
process.env.FORCE_MOCK_GOOGLE_AI = 'true';
```

---

## 🔧 문제 해결

### 일반적인 문제들

#### 1. TypeScript 컴파일 오류

```bash
# 타입 체크
npx tsc --noEmit

# 캐시 삭제
rm -rf .next node_modules/.cache

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

#### 2. 환경 변수 인식 안됨

```bash
# 환경 변수 확인
npm run env:check

# .env.local 파일 존재 확인
ls -la .env*

# 환경 변수 형식 확인 (따옴표 없이)
SUPABASE_URL=https://example.supabase.co  # ✅ 올바름
SUPABASE_URL="https://example.supabase.co"  # ❌ 잘못됨
```

#### 3. 데이터베이스 연결 실패

```bash
# Supabase 연결 테스트
npm run test:db

# 네트워크 연결 확인
ping vnswjnltnhpsueosfhmw.supabase.co

# 방화벽 설정 확인 (포트 5432, 6543)
```

#### 4. Redis 연결 문제

```bash
# Redis 연결 테스트
npm run test:redis

# 로컬에서는 Redis 비활성화
REDIS_CONNECTION_DISABLED=true
```

#### 5. Google AI API 할당량 초과

```bash
# 할당량 보호 활성화
GOOGLE_AI_QUOTA_PROTECTION=true
GOOGLE_AI_TEST_LIMIT_PER_DAY=5

# 목업 모드 강제 활성화
FORCE_MOCK_GOOGLE_AI=true
```

### 환경별 디버깅

#### 로컬 환경

```bash
# 디버그 모드 실행
DEBUG=* npm run dev

# 로그 레벨 설정
LOG_LEVEL=debug npm run dev
```

#### Vercel 환경

```bash
# 배포 로그 확인
vercel logs

# 함수 로그 실시간 확인
vercel logs --follow
```

#### 테스트 환경

```bash
# 테스트 디버그 모드
npm run test -- --verbose

# 특정 테스트 파일 실행
npm test -- --testPathPattern=server
```

---

## 📊 환경 검증

### 자동 검증 스크립트

```bash
# 환경 설정 검증
npm run validate:env

# 시스템 상태 확인
npm run health:check

# 모든 서비스 테스트
npm run test:services
```

### 수동 검증 체크리스트

#### ✅ 로컬 개발 환경

- [ ] Node.js v20+ 설치됨
- [ ] npm ci 성공
- [ ] .env.local 파일 존재
- [ ] npm run dev 정상 실행
- [ ] <http://localhost:3000> 접속 가능
- [ ] 테스트 통과 (npm test)

#### ✅ Vercel 배포 환경

- [ ] vercel login 완료
- [ ] vercel link 완료
- [ ] 환경 변수 설정 완료
- [ ] vercel --prod 배포 성공
- [ ] 배포된 URL 접속 가능
- [ ] API 엔드포인트 정상 동작

#### ✅ 데이터베이스 연결

- [ ] Supabase 프로젝트 생성
- [ ] 테이블 생성 완료
- [ ] 연결 테스트 성공
- [ ] RLS 정책 설정

#### ✅ AI 엔진 설정

- [ ] Google AI API 키 발급
- [ ] 할당량 보호 활성화
- [ ] AI 응답 테스트 성공

---

## 🚀 빠른 시작 가이드

### 1분 설정 (로컬 개발)

```bash
git clone <repository>
cd openmanager-vibe-v5
npm ci
cp .env.local.example .env.local
npm run dev
```

### 5분 설정 (전체 환경)

```bash
# 1. 프로젝트 설정
git clone <repository>
cd openmanager-vibe-v5
npm ci

# 2. 환경 변수 설정
cp .env.local.example .env.local
# .env.local 파일 편집하여 실제 값 입력

# 3. 데이터베이스 설정
# Supabase 프로젝트 생성 및 테이블 생성

# 4. 테스트 실행
npm test

# 5. 개발 서버 시작
npm run dev
```

---

## 📞 지원 및 문의

- **문서**: `docs/` 폴더의 추가 가이드 참조
- **이슈 리포팅**: GitHub Issues
- **개발팀 연락**: 프로젝트 관리자에게 문의

---

*마지막 업데이트: 2025년 7월 2일*
*버전: v5.44.3*
