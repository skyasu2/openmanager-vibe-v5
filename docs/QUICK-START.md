# 🚀 OpenManager VIBE 빠른 시작 가이드

**AI 기반 실시간 서버 모니터링 플랫폼** - 5분 만에 시작하기

## 📋 필수 준비사항

- **Node.js** v22 이상
- **npm** v10 이상
- **Git**

## ⚡ 빠른 설정

### 1. 프로젝트 복제 및 설치

```bash
git clone https://github.com/your-username/openmanager-vibe-v5.git
cd openmanager-vibe-v5
npm install
```

### 2. 환경 변수 설정

```bash
# .env.local 생성
cp config/templates/env.local.template .env.local
```

**`.env.local` 필수 설정**:
```bash
# Supabase 연결 (필수)
SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI 기능 (선택 - Google AI 모드 사용 시)
GOOGLE_AI_API_KEY=your_google_ai_api_key

# 관리자 PIN (기본값: 4231)
ADMIN_PASSWORD=4231
```

### 3. 개발 서버 실행

```bash
# 안정화된 개발 서버 (권장)
npm run dev:stable

# 또는 기본 개발 서버
npm run dev
```

서버가 실행되면 http://localhost:3000 에서 확인하세요.

## 🎯 주요 기능 체험

### 1. 실시간 서버 모니터링
- 대시보드에서 10개 시뮬레이션 서버 상태 실시간 확인
- CPU, Memory, Disk 사용률 모니터링

### 2. AI 어시스턴트
- **LOCAL 모드**: 빠른 기본 응답 (무료)
- **GOOGLE_AI 모드**: 고급 자연어 질의 (API 키 필요)

### 3. PIN 인증 시스템
- 관리자 PIN: 4231 (변경 가능)
- 권한별 차등 접근 제어

## 🧪 테스트 실행

```bash
# Vercel 환경 실제 테스트 (권장)
npm run test:vercel:e2e

# 빠른 로컬 테스트
npm run test:super-fast

# 전체 검증
npm run validate:all
```

## 📊 무료 티어 최적화

이 프로젝트는 **100% 무료**로 운영 가능하도록 설계되었습니다:

- **Vercel**: 무료 호스팅 (30GB/월 대역폭)
- **Supabase**: 무료 PostgreSQL + 실시간 기능
- **모니터링**: Mock 시뮬레이션으로 실제 서버 비용 제로

## 🔧 문제 해결

### 개발 서버 오류
```bash
# segment-explorer 에러 시
npm run dev:stable

# 포트 충돌 시
killall -9 node
npm run dev
```

### 빌드 오류
```bash
# TypeScript 검사
npx tsc --noEmit

# 린트 검사
npm run lint

# 모든 검사 실행
npm run validate:all
```

## 📚 더 자세한 정보

- **[개발 환경 상세 가이드](./DEVELOPMENT.md)** - AI 도구, MCP 서버, WSL 설정
- **[전체 프로젝트 문서](./README.md)** - 아키텍처, API, 설계 문서
- **[시스템 아키텍처](./system-architecture.md)** - 기술 스택 및 구조

---

💡 **5분 만에 시작**: 설치 → `.env.local` 설정 → `npm run dev:stable` → http://localhost:3000

🎯 **즉시 체험**: PIN 4231로 관리자 로그인 → 실시간 대시보드 확인

🤖 **AI 활용**: LOCAL 모드로 서버 상태 질문 → GOOGLE_AI 모드로 고급 분석