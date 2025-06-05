# 🛠️ OpenManager v5 - 설치 및 설정 가이드

**버전**: v5.13.5  
**최종 업데이트**: 2025-05-31  
**대상**: 개발자, DevOps, 시스템 관리자  

---

## 🚀 빠른 시작 (5분 설치)

### 기본 설치
```bash
# 1. 저장소 클론
git clone https://github.com/your-org/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local

# 4. 개발 서버 시작
npm run dev

# 5. 브라우저에서 접속
http://localhost:3001
```

### 빠른 검증
- **홈페이지**: http://localhost:3001
- **대시보드**: http://localhost:3001/dashboard
- **AI 에이전트**: 우상단 "AI 에이전트" 버튼
- **관리자**: PIN 입력 후 관리자 모드

---

## 🔧 시스템 요구사항

### 개발 환경
```bash
# 필수 요구사항
Node.js: 18.17.0 이상
npm: 9.0.0 이상
Python: 3.9.0 이상 (AI 엔진용, 선택사항)

# 권장 요구사항
메모리: 8GB 이상
디스크: 10GB 여유 공간
OS: Windows 10/11, macOS 12+, Ubuntu 20.04+
```

### 프로덕션 환경
```bash
# Vercel 배포
메모리: 1GB (Hobby) / 3GB (Pro)
빌드 시간: 10분 이하
함수 실행: 10초 이하
Edge Functions: 무제한

# Docker 배포
메모리: 2GB 이상
CPU: 2코어 이상
스토리지: 5GB 이상
```

## 📦 상세 설치 가이드

### 1. 로컬 개발 환경

#### Node.js 설치 확인
```bash
# 버전 확인
node --version  # v18.17.0 이상
npm --version   # 9.0.0 이상

# 버전이 낮은 경우 업그레이드
# Windows: https://nodejs.org/
# macOS: brew install node
# Ubuntu: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
```

#### Python 설치 (선택사항, AI 엔진용)
```bash
# Python 확인
python3 --version  # 3.9.0 이상
pip3 --version

# AI 엔진 패키지 설치 (선택사항)
# 경량 버전 (권장)
npm run python:install-lightweight

# 전체 버전 (로컬 개발용)
npm run python:install-full
```

#### 프로젝트 설정
```bash
# 프로젝트 클론
git clone <repository-url>
cd openmanager-vibe-v5

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
```

### 2. 환경 변수 설정

#### .env.local 기본 설정
```bash
# 기본 설정
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3001

# 포트 설정
PORT=3001

# AI 엔진 설정 (선택사항)
PYTHON_PATH=python3
AI_ENGINE_MODE=optimized
FASTAPI_BASE_URL=https://openmanager-ai-engine.onrender.com

# 데이터베이스 설정 (선택사항)
# Supabase 또는 기타 PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://localhost:6379

# 관리자 PIN (기본값: 1234)
ADMIN_PIN=1234

# GitHub 통합 (선택사항)
GITHUB_TOKEN=your_github_token
```

#### 프로덕션 환경 변수
```bash
# Vercel 환경 변수
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
VERCEL_PLAN=hobby  # 또는 pro

# AI 엔진 (프로덕션)
AI_ENGINE_MODE=production
FASTAPI_BASE_URL=https://openmanager-ai-engine.onrender.com

# 보안 설정
ADMIN_PIN=your_secure_pin
JWT_SECRET=your_jwt_secret
```

### 3. 개발 도구 설정

#### VS Code 설정
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

#### 추천 VS Code 확장
```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "eamodio.gitlens",
    "ms-playwright.playwright"
  ]
}
```

#### Cursor AI 설정 (권장)
```json
// .cursor/settings.json
{
  "typescript.suggest.autoImports": true,
  "editor.inlineSuggest.enabled": true,
  "github.copilot.enable": {
    "*": true,
    "yaml": false,
    "plaintext": false
  }
}
```

## 🚀 배포 가이드

### 1. Vercel 배포 (권장)

#### Vercel CLI 설정
```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 프로젝트 빌드 테스트
npm run build

# 배포 (첫 번째)
vercel

# 프로덕션 배포
vercel --prod
```

#### Vercel 대시보드 설정
1. **프로젝트 연결**: GitHub 저장소 연결
2. **환경 변수 설정**: 위의 프로덕션 환경 변수 입력
3. **도메인 설정**: 커스텀 도메인 연결 (선택)
4. **빌드 설정**: 기본값 사용 (Next.js 자동 감지)

### 2. Docker 배포

#### Dockerfile
```dockerfile
# 위치: 프로젝트 루트
FROM node:18-alpine AS base

# 의존성 설치
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 빌드
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

# 실행
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

#### Docker 빌드 및 실행
```bash
# 이미지 빌드
docker build -t openmanager-v5 .

# 컨테이너 실행
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  openmanager-v5

# Docker Compose (선택사항)
docker-compose up -d
```

### 3. GitHub Actions CI/CD

#### 워크플로우 파일
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Type check
      run: npm run type-check
    
    - name: Lint
      run: npm run lint
    
    - name: Build
      run: npm run build
    
    - name: Test
      run: npm run test
    
    - name: E2E Test
      run: npm run test:e2e
```

## 🔧 개발 도구 및 스크립트

### NPM 스크립트
```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:e2e": "playwright test",
    "clean": "rm -rf .next out dist",
    "clean:ports": "lsof -ti:3001 | xargs kill -9",
    "dev:clean": "npm run clean:ports && npm run dev",
    "python:install": "pip3 install -r ai-engine-py/requirements.txt",
    "python:install-lightweight": "pip3 install numpy pandas scikit-learn",
    "setup:dev": "husky install"
  }
}
```

### 개발 유틸리티 명령어
```bash
# 포트 정리 (개발 시 유용)
npm run clean:ports

# 깔끔한 개발 서버 시작
npm run dev:clean

# 빌드 캐시 정리
npm run clean

# 타입 검사
npm run type-check

# 린트 검사
npm run lint

# 전체 테스트
npm run test
npm run test:e2e
```

## 🐛 설치 문제 해결

### 일반적인 문제

#### Node.js 버전 문제
```bash
# 현재 버전 확인
node --version

# nvm으로 버전 관리 (권장)
# Windows
nvm install 18.17.0
nvm use 18.17.0

# macOS/Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18.17.0
nvm use 18.17.0
```

#### 포트 충돌
```bash
# 포트 사용 확인
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# 프로세스 종료
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### 의존성 문제
```bash
# 캐시 정리
npm cache clean --force

# node_modules 재설치
rm -rf node_modules package-lock.json
npm install

# 권한 문제 (Linux/macOS)
sudo chown -R $(whoami) ~/.npm
```

#### Python 엔진 문제
```bash
# Python 경로 확인
which python3

# 패키지 설치 확인
python3 -c "import numpy, pandas, sklearn; print('AI packages OK')"

# 가상환경 사용 (권장)
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows
pip install -r ai-engine-py/requirements.txt
```

### Vercel 배포 문제

#### 빌드 실패
```bash
# 로컬에서 프로덕션 빌드 테스트
npm run build

# 환경 변수 확인
echo $NODE_ENV
echo $NEXT_PUBLIC_APP_URL
```

#### 함수 타임아웃
```bash
# vercel.json 설정
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

## ✅ 설치 완료 검증

### 기본 기능 테스트
1. **홈페이지 로드**: http://localhost:3001
2. **시스템 시작**: "시스템 시작" 버튼 클릭
3. **대시보드 접속**: http://localhost:3001/dashboard
4. **AI 에이전트**: 우상단 AI 버튼 클릭
5. **관리자 모드**: PIN 입력 (기본: 1234)

### 성능 검증
```bash
# 메모리 사용량 확인 (80MB 이하 권장)
node --expose-gc -e "global.gc(); console.log(process.memoryUsage())"

# API 응답 시간 확인 (150ms 이하 권장)
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/api/health
```

---

**이전 문서**: [2_ARCHITECTURE_GUIDE.md](./2_ARCHITECTURE_GUIDE.md) - 시스템 아키텍처  
**다음 문서**: [4_AI_AGENT_GUIDE.md](./4_AI_AGENT_GUIDE.md) - AI 에이전트 가이드 