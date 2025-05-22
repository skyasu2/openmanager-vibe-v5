# OpenManager Vibe V5

AI 기반 서버 모니터링 및 분석 플랫폼

## 🚀 배포 상태
- **배포 URL**: https://openmanager-vibe-v5.vercel.app
- **상태**: 🔄 개발 중
- **마지막 업데이트**: 2024년 7월 23일

## 📋 개발 진행상황

### ✅ 완료된 작업
- [x] Next.js 15 + TypeScript 기본 구조 설정
- [x] Vercel 자동 배포 파이프라인 구축
- [x] TypeScript ESLint 에러 수정

### 🔄 진행 중인 작업
- [ ] Redis (Upstash) 연결 설정
- [ ] Supabase 데이터베이스 연결
- [ ] 기본 API 엔드포인트 구현

### 📅 예정된 작업
- [ ] MCP 자연어 처리 엔진
- [ ] 성능 모니터링 시스템
- [ ] AI 에이전트 기능
- [ ] 모니터링 대시보드

## 🛠 기술 스택
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Vercel Functions
- **Database**: Supabase (PostgreSQL)
- **Cache**: Upstash Redis
- **Deployment**: Vercel

## 🔧 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드 테스트
npm run build
```

## 📝 환경변수

```.env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

---
*마지막 업데이트: TypeScript 타입 에러 수정 및 빌드 안정화*
