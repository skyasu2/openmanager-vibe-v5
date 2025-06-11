# 🔧 Installation Guide

OpenManager Vibe v5의 **완전한 설치 가이드**입니다.

## 📋 시스템 요구사항

### 필수 요구사항

- **Node.js**: 18.0 이상 (권장: 20.x LTS)
- **npm**: 9.0 이상 (또는 yarn 1.22+, pnpm 8.0+)
- **Git**: 최신 버전
- **메모리**: 최소 4GB RAM (권장: 8GB+)

### 선택사항

- **Docker**: 컨테이너 배포용
- **PostgreSQL**: 로컬 데이터베이스 (Supabase 대신)
- **Redis**: 로컬 캐시 (Upstash 대신)

## 🚀 설치 방법

### 방법 1: 표준 설치 (권장)

```bash
# 1. Repository 클론
git clone https://github.com/your-username/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp vercel.env.template .env.local
```

### 방법 2: 개발자 설치 (고급)

```bash
# 1. Fork 후 클론
git clone https://github.com/YOUR_USERNAME/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 2. Upstream 설정
git remote add upstream https://github.com/original/openmanager-vibe-v5.git

# 3. 의존성 설치 (개발 도구 포함)
npm run install:dev

# 4. 개발 환경 완전 설정
npm run setup:dev:complete
```

## 🔑 환경 변수 설정

### 1️⃣ Google AI Studio API

```bash
# Google AI Studio에서 API 키 발급
# https://aistudio.google.com/

# .env.local에 추가
GOOGLE_AI_API_KEY=your_actual_api_key_here
GOOGLE_AI_MODEL=gemini-1.5-flash
```

### 2️⃣ 데이터베이스 설정 (Supabase)

```bash
# Supabase 프로젝트 생성 후
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3️⃣ Redis 설정 (Upstash)

```bash
# Upstash Redis 인스턴스 생성 후
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

### 4️⃣ 기타 설정

```bash
# 애플리케이션 설정
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=http://localhost:3000

# 모니터링 설정 (선택사항)
PROMETHEUS_ENABLED=true
MONITORING_WEBHOOK_URL=your_webhook_url
```

## 🤖 MCP (Model Context Protocol) 설정

### 자동 설정 (권장)

```bash
# MCP 완벽 설정 (원클릭)
npm run mcp:perfect:setup

# 설정 확인
npm run mcp:validate
```

### 수동 설정

```bash
# 1. MCP 서버 설치
npm install -g @modelcontextprotocol/server

# 2. MCP 설정 파일 생성
mkdir -p mcp-config/cursor-dev

# 3. 설정 파일 편집
# mcp-config/cursor-dev/mcp-config.json 파일 수정

# 4. MCP 서버 시작
npm run mcp:start
```

## 🐳 Docker 설치 (선택사항)

### Docker Compose로 전체 스택 실행

```bash
# 1. Docker 이미지 빌드
docker-compose build

# 2. 서비스 시작
docker-compose up -d

# 3. 로그 확인
docker-compose logs -f app
```

### 개별 서비스 Docker 실행

```bash
# 1. 애플리케이션만 Docker로 실행
docker build -t openmanager-vibe-v5 .
docker run -p 3000:3000 --env-file .env.local openmanager-vibe-v5

# 2. 개발 모드로 실행
docker run -p 3000:3000 -v $(pwd):/app openmanager-vibe-v5 npm run dev
```

## ✅ 설치 검증

### 기본 검증

```bash
# 1. 빌드 테스트
npm run build

# 2. 타입 체크
npm run type-check

# 3. 린트 검사
npm run lint

# 4. 테스트 실행
npm run test
```

### 고급 검증

```bash
# 1. 전체 검증 스위트
npm run validate:all

# 2. 성능 테스트
npm run test:performance

# 3. E2E 테스트
npm run test:e2e

# 4. 보안 검사
npm audit
```

## 🔧 문제 해결

### 일반적인 문제들

#### Node.js 버전 문제

```bash
# Node.js 버전 확인
node --version

# nvm으로 버전 관리 (권장)
nvm install 20
nvm use 20
```

#### 의존성 설치 실패

```bash
# npm 캐시 정리
npm cache clean --force

# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

#### 환경 변수 문제

```bash
# 환경 변수 로드 확인
npm run env:check

# 환경 변수 템플릿 다시 복사
cp vercel.env.template .env.local.backup
```

#### 포트 충돌

```bash
# 포트 사용 프로세스 확인
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# 다른 포트로 실행
PORT=3001 npm run dev
```

### Google AI API 문제

#### API 키 검증

```bash
# API 키 테스트
curl -H "Authorization: Bearer $GOOGLE_AI_API_KEY" \
  https://generativelanguage.googleapis.com/v1beta/models
```

#### 할당량 초과

- [Google AI Studio Console](https://aistudio.google.com/)에서 할당량 확인
- 필요시 유료 플랜 업그레이드

### MCP 설정 문제

#### MCP 서버 연결 실패

```bash
# MCP 서버 상태 확인
npm run mcp:status

# MCP 로그 확인
npm run mcp:logs

# MCP 서버 재시작
npm run mcp:restart
```

## 📚 다음 단계

설치가 완료되었다면:

1. [⚡ Quick Start](QUICK_START.md) - 5분 안에 시작하기
2. [🛠️ Development Guide](DEVELOPMENT.md) - 개발 워크플로우
3. [🤖 AI Setup](AI_SETUP.md) - AI 기능 심화 설정
4. [☁️ Deployment](DEPLOYMENT.md) - 프로덕션 배포

## 🆘 도움말

설치 중 문제가 발생하면:

- [GitHub Issues](https://github.com/your-username/openmanager-vibe-v5/issues)
- [Discord Community](https://discord.gg/openmanager)
- [Documentation](https://docs.openmanager.dev)
