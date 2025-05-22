# OpenManager Vibe V5

🤖 AI 기반 서버 모니터링 및 분석 플랫폼

## 🚀 배포 정보
- **배포 주소**: https://openmanager-vibe-v5.vercel.app
- **개발 상태**: 🔄 진행 중
- **마지막 업데이트**: 2024년 12월 29일

## 📋 개발 현황

### ✅ 완료된 작업
- [x] Next.js 15 + TypeScript 기본 구조 설정
- [x] Vercel 자동 배포 파이프라인 구축
- [x] 프로젝트 문서 한글화

### 🔄 진행 중인 작업
- [ ] TypeScript 타입 에러 수정
- [ ] Redis (Upstash) 연결 설정
- [ ] Supabase 데이터베이스 연결

### 📅 예정된 작업
- [ ] MCP 자연어 처리 엔진 구현
- [ ] 실시간 성능 모니터링 시스템
- [ ] AI 에이전트 기능 개발
- [ ] 관리자 대시보드 구축

## 🛠 기술 스택
- **프론트엔드**: Next.js 15, TypeScript, Tailwind CSS
- **백엔드**: Vercel Functions (서버리스)
- **데이터베이스**: Supabase (PostgreSQL)
- **캐시**: Upstash Redis
- **배포**: Vercel 자동 배포

## 🔧 로컬 개발 환경

### 설치 및 실행
```bash
# 프로젝트 클론
git clone https://github.com/username/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드 테스트
npm run build
```

### 환경변수 설정
```.env.local
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=여러분의_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=여러분의_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=여러분의_service_role_key

# Redis 설정
UPSTASH_REDIS_REST_URL=여러분의_redis_url
UPSTASH_REDIS_REST_TOKEN=여러분의_redis_token
```

## 📚 문서 구조
- `docs/개발가이드.md` - 개발 방법 및 가이드라인
- `docs/배포가이드.md` - 배포 과정 및 설정
- `docs/API문서.md` - API 엔드포인트 문서
- `docs/시스템구조.md` - 전체 아키텍처 설명
- `docs/할일목록.md` - 개발 진행 상황

## 🤝 기여 방법
1. 이슈 생성 또는 기존 이슈 확인
2. 브랜치 생성 (`feature/새기능-이름`)
3. 변경사항 커밋
4. 풀 리퀘스트 생성

---
*마지막 업데이트: 프로젝트 문서 한글화 및 구조 정리*
