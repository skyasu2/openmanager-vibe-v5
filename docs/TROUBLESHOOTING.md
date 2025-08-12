# 🚨 문제 해결 가이드

> 주요 문제들의 빠른 해결 방법

## 🎯 자주 발생하는 문제들

### 🔧 개발 환경 문제

#### 1. 의존성 설치 실패
```bash
# 증상: npm install 실패, 패키지 충돌
# 해결방법:
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 또는 Node.js 버전 확인
node --version  # v22.15.1 필요
```

#### 2. 개발 서버 시작 실패
```bash
# 증상: npm run dev 실패, 포트 충돌
# 해결방법:
PORT=3001 npm run dev  # 다른 포트 사용

# 또는 프로세스 종료
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000   # Windows에서 PID 확인 후 종료
```

#### 3. 환경변수 오류
```bash
# 증상: .env.local 관련 오류
# 해결방법:
cp .env.local.template .env.local
# 필요한 환경변수들 설정

# 환경변수 검증
npm run env:check
```

### 🔌 MCP 서버 문제

#### 1. MCP 서버 연결 실패
```bash
# 증상: MCP 서버가 연결되지 않음
# 해결방법:
claude api restart

# MCP 서버 상태 확인
claude mcp list

# 설정 리셋
bash scripts/mcp/reset.sh
```

#### 2. MCP 서버 설치 실패
```bash
# 증상: MCP 서버 설치 중 오류
# 해결방법:
# Python MCP 서버 (time, serena)
uvx --version  # uvx 설치 확인
python --version  # Python 3.11+ 확인

# Node.js MCP 서버
npx clear-npx-cache
npm install -g @modelcontextprotocol/server-filesystem
```

#### 3. 환경변수 MCP 서버 오류
```bash
# 증상: Supabase, Tavily MCP 연결 실패
# 해결방법:
# .env.local에 다음 값들 확인:
SUPABASE_ACCESS_TOKEN=your_token
TAVILY_API_KEY=your_key

# 환경변수 로드된 상태로 Claude 시작
./scripts/start-claude-with-mcp.ps1
```

### 🤖 AI 시스템 문제

#### 1. AI 쿼리 실패
```bash
# 증상: AI API 호출 실패
# 해결방법:
# Google AI API 키 확인
GOOGLE_AI_API_KEY=your_key

# AI 엔진 상태 확인
curl http://localhost:3000/api/ai/health

# 폴백 엔진 활성화
# 자동으로 다른 AI 엔진으로 전환됨
```

#### 2. Supabase RAG 오류
```bash
# 증상: Vector search 실패
# 해결방법:
# Supabase 연결 확인
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key

# pgvector 확장 활성화 확인
# Supabase Dashboard → SQL Editor에서:
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 3. GCP Functions 연결 실패
```bash
# 증상: Korean NLP, ML Analytics 실패
# 해결방법:
# GCP 프로젝트 설정 확인
GCP_PROJECT_ID=your_project_id

# Functions 배포 상태 확인
gcloud functions list --regions=us-central1

# 필요시 재배포
bash scripts/deployment/deploy-all.sh
```

### 🗄️ 데이터베이스 문제

#### 1. Supabase 연결 오류
```bash
# 증상: Database connection failed
# 해결방법:
# 연결 정보 확인
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Supabase 프로젝트 상태 확인
# https://supabase.com/dashboard
```

#### 2. RLS 정책 오류
```bash
# 증상: Row Level Security 권한 오류
# 해결방법:
# Supabase Dashboard → Authentication → Users에서 사용자 확인
# SQL Editor에서 RLS 정책 확인:
SELECT * FROM pg_policies WHERE tablename = 'servers';
```

#### 3. pgvector 관련 오류
```bash
# 증상: Vector similarity search 실패
# 해결방법:
# pgvector 확장 설치 확인
SELECT * FROM pg_extension WHERE extname = 'vector';

# 벡터 인덱스 생성
CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops);
```

### 🚀 배포 관련 문제

#### 1. Vercel 배포 실패
```bash
# 증상: Build 또는 배포 오류
# 해결방법:
# 로컬 빌드 테스트
npm run build

# TypeScript 오류 확인
npm run type-check

# Vercel 환경변수 확인
# Vercel Dashboard → Settings → Environment Variables
```

#### 2. GitHub Actions CI/CD 실패
```bash
# 증상: CI/CD 파이프라인 실패
# 해결방법:
# 로컬에서 같은 명령 실행
npm run validate:all

# Git hooks 비활성화 (테스트용)
HUSKY=0 git commit -m "test commit"

# Fast track 배포
git commit -m "fix: 긴급 수정 [skip ci]"
```

#### 3. 환경변수 누락
```bash
# 증상: 배포 후 기능 동작 안함
# 해결방법:
# Vercel에서 환경변수 설정 확인
# GitHub에서 Secrets 설정 확인
# .env.local.template과 비교
```

### 🧪 테스트 관련 문제

#### 1. 테스트 실행 실패
```bash
# 증상: npm test 실패
# 해결방법:
# 빠른 테스트만 실행
npm run test:quick

# 테스트 환경 변수 확인
NODE_ENV=test npm test

# 특정 테스트 파일만 실행
npm test -- src/services/ai/__tests__/SimplifiedQueryEngine.test.ts
```

#### 2. E2E 테스트 실패
```bash
# 증상: Playwright 테스트 실패
# 해결방법:
# 브라우저 설치 확인
npx playwright install

# 개발 서버 실행 상태 확인
npm run dev  # 다른 터미널에서

# 헤드리스 모드 비활성화
npm run test:e2e -- --headed
```

### 💾 캐시 관련 문제

#### 1. 메모리 캐시 오류
```bash
# 증상: 캐시 관련 메모리 오류
# 해결방법:
# 캐시 초기화
npm run cache:clear

# 메모리 사용량 확인
node --max-old-space-size=8192 npm run dev
```

#### 2. 브라우저 캐시 문제
```bash
# 증상: 이전 버전 코드가 로드됨
# 해결방법:
# 하드 리프레시
Ctrl+F5 (Windows)
Cmd+Shift+R (macOS)

# 또는 시크릿 모드에서 테스트
```

## 🔍 진단 도구

### 시스템 상태 확인
```bash
# 전체 시스템 헬스 체크
npm run health:check

# Claude Code 환경 확인
bash scripts/check-claude-environment.sh

# Git 상태 확인
npm run git:status
```

### 로그 확인
```bash
# 개발 서버 로그
npm run dev  # 콘솔 출력 확인

# AI 시스템 로그
npm run logs:ai

# Vercel 배포 로그
vercel logs
```

### 성능 진단
```bash
# 성능 벤치마크
npm run test:performance

# 빌드 성능 분석
npm run build:analyze

# 메모리 사용량 프로파일링
npm run profile:memory
```

## 📞 추가 도움

### 문서 참조
- **[빠른 시작](./QUICK-START.md)** - 기본 설정
- **[MCP 가이드](./MCP-GUIDE.md)** - MCP 서버 문제
- **[AI 시스템](./AI-SYSTEMS.md)** - AI 관련 문제
- **[시스템 아키텍처](./system-architecture.md)** - 전체 구조

### 기술 문서
- **[개발 가이드](./guides/development/)** - 개발 환경 설정
- **[보안 가이드](./security/)** - 보안 관련 설정
- **[성능 최적화](./performance/)** - 성능 관련 문제

### 이슈 보고
문제가 계속 발생하면 다음 정보와 함께 이슈를 등록해주세요:

1. **환경 정보**:
   - OS: Windows 11 / macOS / Linux
   - Node.js 버전: `node --version`
   - npm 버전: `npm --version`

2. **오류 정보**:
   - 정확한 오류 메시지
   - 오류 발생 단계
   - 재현 방법

3. **로그**:
   - 콘솔 출력
   - 브라우저 개발자 도구 오류
   - 관련 로그 파일

---

> **여전히 문제가 해결되지 않나요?** GitHub 이슈를 등록하거나 팀에 문의해주세요.