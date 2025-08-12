# ⚡ 5분 빠른 시작 가이드

> OpenManager VIBE v5를 5분 내에 실행하기

## 🎯 목표

개발 환경에서 모든 기능이 작동하는 상태로 빠르게 설정

## 📋 사전 요구사항

- Windows 11 + PowerShell/Git Bash
- Node.js v22.15.1
- Git 설치됨

## 🚀 1단계: 저장소 클론 및 의존성 설치 (2분)

```bash
# 저장소 클론
git clone https://github.com/your-org/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 의존성 설치
npm install

# 환경변수 설정
cp .env.local.template .env.local
# .env.local 파일을 열어서 필수 값들 설정
```

## 🔑 2단계: 필수 환경변수 설정 (2분)

`.env.local` 파일에서 다음 값들을 설정하세요:

```env
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# GitHub OAuth (필수)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google AI (선택적)
GOOGLE_AI_API_KEY=your_google_ai_key

# JWT 시크릿 (자동 생성 가능)
JWT_SECRET=your_jwt_secret_here
```

## 🏃 3단계: 개발 서버 실행 (1분)

```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 확인
# http://localhost:3000
```

## ✅ 4단계: 동작 확인

### 기본 기능 체크
- [ ] 메인 페이지 로드
- [ ] GitHub 로그인 동작
- [ ] 대시보드 접근 가능
- [ ] 서버 메트릭 표시

### MCP 서버 체크 (선택적)
```bash
# MCP 서버 상태 확인
claude mcp list

# 필수 MCP 서버들이 설치되어 있는지 확인
# - filesystem
# - memory
# - github
# - time
```

## 🛠️ 추가 설정 (필요한 경우)

### MCP 서버 설치
```bash
# 자동 설치 스크립트 실행
./scripts/install-all-mcp-servers.ps1  # PowerShell
# 또는
./scripts/install-all-mcp-servers.sh   # Git Bash
```

### 테스트 실행
```bash
# 빠른 테스트
npm run test:quick

# 전체 테스트
npm test
```

### 빌드 테스트
```bash
# 프로덕션 빌드 확인
npm run build
```

## 🚨 문제 해결

### 자주 발생하는 문제

#### 1. 의존성 설치 실패
```bash
# 캐시 정리 후 재시도
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 2. 환경변수 오류
```bash
# 환경변수 템플릿 재복사
cp .env.local.template .env.local
# 값들을 다시 설정
```

#### 3. 포트 충돌
```bash
# 다른 포트로 실행
PORT=3001 npm run dev
```

#### 4. MCP 연결 오류
```bash
# MCP 설정 리셋
bash scripts/mcp/reset.sh
```

## 📚 다음 단계

설정이 완료되면 다음 문서들을 참조하세요:

- **[시스템 아키텍처](./system-architecture.md)** - 전체 구조 이해
- **[MCP 가이드](./MCP-GUIDE.md)** - MCP 서버 완전 활용
- **[AI 시스템](./AI-SYSTEMS.md)** - AI 엔진 및 협업 설정

## 🔗 주요 링크

- **개발 서버**: http://localhost:3000
- **프로덕션 사이트**: https://your-app.vercel.app
- **Supabase 대시보드**: https://supabase.com/dashboard
- **Vercel 대시보드**: https://vercel.com/dashboard

---

> **문제가 있나요?** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)를 확인하거나 이슈를 등록해주세요.