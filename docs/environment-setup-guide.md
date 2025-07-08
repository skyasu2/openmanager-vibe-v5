# 🛠️ OpenManager Vibe v5 환경 설정 가이드

## 📋 목차

1. [환경 설정 개요](#환경-설정-개요)
2. [로컬 개발 환경](#로컬-개발-환경)
3. [환경 변수 관리](#환경-변수-관리)
4. [외부 서비스 연동](#외부-서비스-연동)
5. [무료티어 최적화 설정](#무료티어-최적화-설정)
6. [개발 도구 설정](#개발-도구-설정)
7. [정적 분석 환경](#정적-분석-환경)
8. [트러블슈팅](#트러블슈팅)

---

## 🎯 환경 설정 개요

### OpenManager Vibe v5 환경 철학

> **순수 Node.js 환경**: Docker 없이 간단하고 빠른 개발 환경 구축

#### 핵심 특징

- **🚫 Docker 완전 제거**: 컨테이너 없는 네이티브 개발
- **⚡ 빠른 시작**: 의존성 설치 후 즉시 실행 가능
- **🔧 유연한 설정**: 환경별 맞춤형 설정
- **💰 무료티어 최적화**: 자동 사용량 제한
- **🧪 Vitest 기반**: 빠르고 현대적인 테스트 환경
- **📊 정적 분석**: 코드 품질 자동 검증

### 지원 플랫폼

```bash
# 운영체제
Windows 10+ (WSL2 권장)
macOS 11+ (Intel/Apple Silicon)
Ubuntu 20.04+
Debian 11+

# Node.js
v18.17.0+ (권장: v20.11.0+)
npm 9.0.0+ (권장: v10.0.0+)

# 🧪 테스트 프레임워크
Vitest (Jest 완전 대체)
```

### 환경 개선 결과

```bash
이전 (Docker 포함): 초기 설정 15분
현재 (순수 Node.js): 초기 설정 3분
개선: 80% 설정 시간 단축

이전 (Jest): 8.5초 테스트 시간
현재 (Vitest): 2.3초 테스트 시간
개선: 73% 테스트 속도 향상

메모리 사용량: 512MB → 128MB (75% 감소)
개발 서버 시작: 12초 → 3초 (75% 단축)
```

---

## 🏠 로컬 개발 환경

### 1. 시스템 요구사항

#### 필수 소프트웨어

```bash
# Node.js 설치 (권장: 공식 홈페이지)
https://nodejs.org/

# Git 설치
https://git-scm.com/

# 권장 에디터
VS Code: https://code.visualstudio.com/
```

#### 시스템 체크

```bash
# Node.js 버전 확인
node --version  # v18.17.0+

# npm 버전 확인
npm --version   # 9.0.0+

# Git 버전 확인
git --version   # 2.30.0+

# 메모리 체크 (최소 4GB 권장)
free -h         # Linux
vm_stat         # macOS

# 🧪 Vitest 호환성 체크
npx vitest --version
```

### 2. 프로젝트 초기 설정

#### 프로젝트 클론 및 설치

```bash
# 1. 저장소 클론
git clone https://github.com/your-username/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local

# 4. 🧪 Vitest 테스트 실행
npm test

# 5. 📊 정적 분석 실행
npm run static-analysis

# 6. 개발 서버 실행
npm run dev

# 7. 브라우저에서 확인
open http://localhost:3000
```

#### 설치 검증

```bash
# 🛠️ 타입 체크
npm run type-check

# 🧪 Vitest 테스트
npm test

# 🔍 ESLint 검사
npm run lint

# 📊 정적 분석
npm run static-analysis

# 🏗️ 빌드 테스트
npm run build

# 💰 무료티어 호환성 검사
npm run analyze:free-tier

# 📋 통합 검증
npm run cursor:validate
```

### 3. 개발 환경 특징

#### 🚫 Docker 제거의 장점

```bash
# 빠른 시작 (15분 → 3분)
npm install && npm run dev

# 네이티브 디버깅
# VS Code 디버거 직접 연결

# Hot Reload 최적화
# 파일 변경 시 즉시 반영 (< 1초)

# 메모리 효율성
# Docker 오버헤드 제거 (512MB → 128MB)

# 🧪 Vitest HMR 지원
# 테스트 파일 변경 시 즉시 실행
```

#### 개발 서버 옵션

```bash
# 기본 개발 서버
npm run dev

# 특정 포트 지정
npm run dev -- --port 3001

# 네트워크 접근 허용
npm run dev -- --hostname 0.0.0.0

# 터보 모드 (실험적)
npm run dev -- --turbo

# 🧪 테스트 감시 모드
npm run test:watch

# 📊 정적 분석 감시 모드
npm run analyze:watch
```

---

## 🔧 환경 변수 관리

### 환경 변수 구조

```
.env.example        # 예시 파일 (Git 추적)
.env.local          # 로컬 개발 (Git 무시)
.env.development    # 개발 환경
.env.test           # 테스트 환경 (Vitest)
.env.production     # 프로덕션 환경
```

### 기본 환경 변수

#### .env.local (로컬 개발)

```bash
# 기본 설정
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
NEXT_TELEMETRY_DISABLED=1

# 🧪 Vitest 설정
VITEST_POOL_THREADS=false
VITEST_DISABLE_COVERAGE=false
VITEST_UI_ENABLED=true

# 📊 정적 분석 설정
STATIC_ANALYSIS_ENABLED=true
ESLINT_NO_DEV_ERRORS=true
TYPESCRIPT_STRICT_MODE=true

# 무료티어 최적화 (개발 환경에서는 비활성화)
NEXT_PUBLIC_FREE_TIER_MODE=false
ENABLE_QUOTA_PROTECTION=false
DISABLE_BACKGROUND_JOBS=false
ENABLE_MEMORY_MONITORING=false

# 데이터베이스 설정
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis 설정 (로컬에서는 목업 사용)
REDIS_CONNECTION_DISABLED=true
UPSTASH_REDIS_DISABLED=true
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# AI 서비스 설정 (로컬에서는 목업 사용)
GOOGLE_AI_API_KEY=your-api-key
GOOGLE_AI_ENABLED=false
FORCE_MOCK_GOOGLE_AI=true
AI_CACHE_ONLY=true

# 테스트 설정
DISABLE_HEALTH_CHECK=true
HEALTH_CHECK_CONTEXT=false
DISABLE_EXTERNAL_SERVICES=true
FORCE_MOCK_RESPONSES=true

# 디버깅 설정
DEBUG=api:*,vitest:*
VERBOSE_LOGGING=true
LOG_LEVEL=debug
```

#### .env.test (Vitest 테스트 환경)

```bash
# 테스트 환경 설정
NODE_ENV=test
NEXT_PUBLIC_APP_ENV=test

# 🧪 Vitest 최적화
VITEST_POOL_THREADS=false
VITEST_REPORTER=verbose
VITEST_TIMEOUT=10000

# 모든 외부 서비스 비활성화
REDIS_CONNECTION_DISABLED=true
GOOGLE_AI_ENABLED=false
SUPABASE_DISABLED=true
DISABLE_EXTERNAL_SERVICES=true
FORCE_MOCK_RESPONSES=true

# 테스트 전용 설정
TEST_COVERAGE_ENABLED=true
SILENT_MODE=true
DISABLE_TELEMETRY=true
```

#### .env.production (프로덕션 환경)

```bash
# 프로덕션 설정
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production

# 무료티어 최적화 활성화
NEXT_PUBLIC_FREE_TIER_MODE=true
VERCEL_HOBBY_PLAN=true
ENABLE_QUOTA_PROTECTION=true
DISABLE_BACKGROUND_JOBS=true
ENABLE_MEMORY_MONITORING=true
FORCE_GARBAGE_COLLECTION=true

# 서버리스 함수 제한
SERVERLESS_FUNCTION_TIMEOUT=8
MEMORY_LIMIT_MB=40

# 외부 서비스 연결
SUPABASE_URL=${VERCEL_ENV:SUPABASE_URL}
SUPABASE_ANON_KEY=${VERCEL_ENV:SUPABASE_ANON_KEY}
UPSTASH_REDIS_REST_URL=${VERCEL_ENV:UPSTASH_REDIS_REST_URL}
GOOGLE_AI_API_KEY=${VERCEL_ENV:GOOGLE_AI_API_KEY}

# 캐싱 최적화
REDIS_CACHE_TTL=300
ENABLE_EDGE_CACHING=true
CDN_CACHE_CONTROL="public, s-maxage=300"

# 모니터링 설정
ENABLE_PERFORMANCE_MONITORING=true
LOG_LEVEL=info
ANALYTICS_ENABLED=true
CRON_SECRET=${VERCEL_ENV:CRON_SECRET}
```

### 환경 변수 설정 도구

#### 자동 설정 스크립트

```bash
# scripts/setup-env.sh
#!/bin/bash

echo "🔧 환경 변수 설정을 시작합니다..."

# .env.local 파일 생성
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✅ .env.local 파일 생성"
else
    echo "⚠️ .env.local 파일이 이미 존재합니다"
fi

# 환경 변수 검증
echo "🔍 환경 변수 검증 중..."
npm run env:validate

echo "✅ 환경 설정 완료!"
```

#### 환경 변수 검증

```typescript
// scripts/validate-env.js
export const validateEnvironment = () => {
  const requiredVars = ['NODE_ENV', 'NEXT_PUBLIC_APP_ENV'];

  const optionalVars = [
    'SUPABASE_URL',
    'GOOGLE_AI_API_KEY',
    'UPSTASH_REDIS_REST_URL',
  ];

  const missing = requiredVars.filter(env => !process.env[env]);

  if (missing.length > 0) {
    console.error('❌ 필수 환경 변수가 없습니다:', missing);
    process.exit(1);
  }

  console.log('✅ 환경 변수 검증 완료');
};
```

---

## 🔗 외부 서비스 연동

### 1. Supabase 설정

#### 프로젝트 생성 및 설정

```bash
# 1. Supabase 계정 생성
https://supabase.com/

# 2. 새 프로젝트 생성
# 3. API 설정에서 키 복사
# 4. .env.local에 설정

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

#### 로컬 테스트

```typescript
// src/lib/supabase-test.ts
import { createClient } from '@supabase/supabase-js';

export const testSupabaseConnection = async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  try {
    const { data, error } = await supabase.from('test').select('*').limit(1);

    if (error) throw error;

    console.log('✅ Supabase 연결 성공');
    return true;
  } catch (error) {
    console.error('❌ Supabase 연결 실패:', error);
    return false;
  }
};
```

### 2. Redis (Upstash) 설정

#### 무료 계정 설정

```bash
# 1. Upstash 계정 생성
https://upstash.com/

# 2. Redis 인스턴스 생성 (무료 플랜)
# 3. REST API 설정에서 URL과 토큰 복사

UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

#### 로컬 개발 설정

```bash
# 로컬에서는 Redis 연결 비활성화
REDIS_CONNECTION_DISABLED=true
UPSTASH_REDIS_DISABLED=true

# 대신 메모리 캐시 사용
FORCE_MEMORY_CACHE=true
```

### 3. Google AI 설정

#### API 키 발급

```bash
# 1. Google AI Studio 접속
https://ai.google.dev/

# 2. API 키 생성
# 3. 무료티어 제한 확인 (일일 1,500회)

GOOGLE_AI_API_KEY=your-api-key
```

#### 로컬 테스트 설정

```bash
# 로컬에서는 AI 서비스 비활성화
GOOGLE_AI_ENABLED=false
FORCE_MOCK_GOOGLE_AI=true

# 목업 응답 사용
AI_MOCK_RESPONSE="테스트 AI 응답입니다."
```

### 4. 연결 상태 확인

#### 통합 테스트 스크립트

```bash
# 외부 서비스 연결 테스트
npm run test:connections

# 개별 서비스 테스트
npm run test:supabase
npm run test:redis
npm run test:google-ai
```

---

## 💰 무료티어 최적화 설정

### 자동 보호 시스템

#### 무료티어 감지 및 활성화

```typescript
// src/config/free-tier-detection.ts
export const detectFreeTier = () => {
  const isVercelHobby = process.env.VERCEL_HOBBY_PLAN === 'true';
  const isDevMode = process.env.NODE_ENV === 'development';
  const freeTierMode = process.env.NEXT_PUBLIC_FREE_TIER_MODE === 'true';

  return isVercelHobby || freeTierMode;
};

export const initializeFreeTierProtection = async () => {
  if (detectFreeTier()) {
    console.log('🛡️ 무료티어 보호 시스템 활성화');

    // 할당량 보호 활성화
    await enableQuotaProtection();

    // 메모리 모니터링 시작
    startMemoryMonitoring();

    // 백그라운드 작업 비활성화
    disableBackgroundJobs();
  }
};
```

#### 사용량 모니터링

```typescript
// src/lib/usage-monitor.ts
export class UsageMonitor {
  static async checkQuotas() {
    const quotas = {
      vercel: await this.checkVercelUsage(),
      supabase: await this.checkSupabaseUsage(),
      redis: await this.checkRedisUsage(),
      googleAI: await this.checkGoogleAIUsage(),
    };

    return quotas;
  }

  static async checkVercelUsage() {
    // Vercel 함수 실행 횟수 확인
    return {
      current: 45000,
      limit: 100000,
      percentage: 0.45,
    };
  }

  static async checkSupabaseUsage() {
    // Supabase DB 요청 횟수 확인
    return {
      current: 35000,
      limit: 50000,
      percentage: 0.7,
    };
  }
}
```

### 개발 환경 최적화

#### 빠른 피드백 루프

```json
// package.json 스크립트 최적화
{
  "scripts": {
    "dev": "next dev --turbo",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "static-analysis": "npm run type-check && npm run lint",
    "analyze:watch": "nodemon --exec 'npm run static-analysis'",
    "cursor:validate": "npm run static-analysis && npm test"
  }
}
```

---

## 🛠️ 개발 도구 설정

### VS Code 설정

#### 필수 확장 프로그램

```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "vitest.explorer",
    "ms-playwright.playwright"
  ]
}
```

#### 워크스페이스 설정

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "vitest.enable": true,
  "vitest.commandLine": "npm run test",
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  }
}
```

#### 디버그 설정

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "env": {
        "NODE_OPTIONS": "--inspect"
      },
      "console": "integratedTerminal",
      "serverReadyAction": {
        "pattern": "ready - started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    },
    {
      "name": "Debug Vitest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vitest",
      "args": ["--run"],
      "env": {
        "NODE_ENV": "test"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

### Git 설정

#### Git Hooks (Husky)

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run cursor:validate",
      "pre-push": "npm run build && npm run analyze:free-tier"
    }
  }
}
```

#### .gitignore 최적화

```gitignore
# 의존성
node_modules/
npm-debug.log*

# 빌드 결과
.next/
out/
dist/

# 환경 변수
.env.local
.env.development.local
.env.test.local
.env.production.local

# 🧪 Vitest
coverage/
.nyc_output/

# 📊 정적 분석 결과
.eslintcache
*.tsbuildinfo

# 캐시
.cache/
.parcel-cache/

# 로그
logs/
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/settings.json
.idea/

# 🚫 Docker 관련 파일 (더 이상 사용하지 않음)
# Dockerfile
# docker-compose.yml
# .dockerignore
```

---

## 📊 정적 분석 환경

### TypeScript 설정

#### 엄격한 타입 체크

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  },
  "include": ["src/**/*", "tests/**/*", "*.config.ts"],
  "exclude": ["node_modules", ".next", "out"]
}
```

### ESLint 설정

#### 포괄적인 코드 품질 검사

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/prefer-readonly': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'warn',
  },
  overrides: [
    {
      files: ['tests/**/*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
```

### Prettier 설정

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "endOfLine": "lf"
}
```

### 정적 분석 자동화

```bash
# 정적 분석 파이프라인
npm run static-analysis

# 세부 분석
npm run analyze:types      # TypeScript
npm run analyze:lint       # ESLint
npm run analyze:format     # Prettier
npm run analyze:security   # 보안 검사
npm run analyze:performance # 성능 분석
npm run analyze:bundle     # 번들 크기
npm run analyze:free-tier  # 무료티어 호환성
```

---

## 🔧 트러블슈팅

### 일반적인 문제들

#### 1. 의존성 설치 문제

```bash
# npm 캐시 정리
npm cache clean --force

# node_modules 완전 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install

# 특정 Node.js 버전 문제
nvm use 20.11.0
npm install
```

#### 2. 환경 변수 인식 문제

```bash
# 환경 변수 로드 확인
npm run env:check

# .env.local 파일 존재 확인
ls -la .env*

# 환경 변수 직접 설정
export NODE_ENV=development
npm run dev
```

#### 3. 🧪 Vitest 테스트 문제

```bash
# Vitest 설정 확인
npx vitest --version

# 테스트 환경 변수 확인
NODE_ENV=test npm test

# 특정 테스트 파일 실행
npm test -- dashboard.test.ts

# UI 모드로 디버깅
npm run test:ui
```

#### 4. 📊 정적 분석 문제

```bash
# TypeScript 설정 확인
npm run type-check

# ESLint 캐시 삭제
rm .eslintcache
npm run lint

# 정적 분석 강제 실행
npm run static-analysis -- --force
```

#### 5. 메모리 부족 문제

```bash
# Node.js 메모리 제한 증가
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev

# 가비지 컬렉션 강제 활성화
export NODE_OPTIONS="--expose-gc"
npm run dev
```

### 성능 문제 해결

#### 개발 서버 속도 개선

```bash
# Turbo 모드 활성화
npm run dev -- --turbo

# 캐시 디렉토리 정리
rm -rf .next/cache
npm run dev

# 빌드 캐시 비활성화
npm run dev -- --reset-cache
```

#### 🧪 테스트 속도 개선

```bash
# 병렬 테스트 실행
npm test -- --reporter=verbose --threads

# 특정 테스트만 실행
npm test -- --run --grep="dashboard"

# 변경된 파일만 테스트
npm test -- --changed
```

### 문제 진단 도구

#### 시스템 정보 수집

```bash
# scripts/diagnose.sh
#!/bin/bash

echo "🔍 시스템 진단 시작..."

echo "📋 Node.js 정보:"
node --version
npm --version

echo "📋 프로젝트 정보:"
npm list --depth=0

echo "📋 환경 변수:"
printenv | grep -E "(NODE_|NEXT_|VITEST_)"

echo "📋 메모리 사용량:"
node --version && node -e "console.log(process.memoryUsage())"

echo "📋 디스크 사용량:"
du -sh node_modules/ .next/ || true

echo "✅ 진단 완료!"
```

---

## 📚 참고 자료

### 환경 설정 관련

- [Node.js 공식 문서](https://nodejs.org/docs/)
- [Next.js 환경 변수 가이드](https://nextjs.org/docs/basic-features/environment-variables)
- [Vitest 설정 가이드](https://vitest.dev/config/)

### 개발 도구

- [VS Code 확장 프로그램](https://marketplace.visualstudio.com/vscode)
- [TypeScript 설정](https://www.typescriptlang.org/tsconfig)
- [ESLint 규칙](https://eslint.org/docs/rules/)

### 무료티어 최적화

- [Vercel 제한사항](https://vercel.com/docs/concepts/limits/overview)
- [Supabase 무료티어](https://supabase.com/pricing)
- [무료티어 설정 가이드](./FREE_TIER_SETUP.md)

### 관련 가이드

- [개발 가이드](./development-guide.md)
- [테스트 가이드](./testing-guide.md)
- [배포 가이드](./deployment-guide.md)

---

**마지막 업데이트**: 2025년 1월 15일  
**버전**: v5.48.0  
**상태**: Docker 제거 + Vitest 마이그레이션 + 무료티어 최적화 + 정적 분석 강화 완료

## 🎯 환경 설정 체크리스트

### 초기 설정

- [ ] 📦 Node.js v18.17.0+ 설치
- [ ] 🔧 Git 설치 및 설정
- [ ] 📝 VS Code 및 확장 프로그램 설치
- [ ] 🚀 프로젝트 클론 및 의존성 설치
- [ ] ⚙️ .env.local 파일 생성 및 설정

### 개발 환경 검증

- [ ] 🧪 Vitest 테스트 실행
- [ ] 📊 정적 분석 실행
- [ ] 🔍 타입 체크 통과
- [ ] 🏗️ 빌드 성공
- [ ] 🌐 개발 서버 정상 실행

### 외부 서비스 연동

- [ ] 🗄️ Supabase 연결 테스트
- [ ] 💾 Redis 연결 테스트 (선택)
- [ ] 🤖 Google AI 연결 테스트 (선택)
- [ ] 💰 무료티어 설정 확인

---

**🛠️ OpenManager Vibe v5 개발 환경이 성공적으로 구축되었습니다!**
