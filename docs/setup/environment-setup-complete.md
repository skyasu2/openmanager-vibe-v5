# 🛠️ 환경 설정 완전 가이드

> 개발, 테스트, 프로덕션 환경 통합 설정

## 🎯 개요

OpenManager VIBE v5의 모든 환경 설정을 통합 관리하는 완전 가이드입니다.

## 📋 환경별 설정 매트릭스

| 항목                | 개발 (Development) | 테스트 (Test) | 프로덕션 (Production) |
| ------------------- | ------------------ | ------------- | --------------------- |
| **Rate Limit**      | 100 req/min        | 60 req/min    | 60 req/min            |
| **Default Timeout** | 30초               | 15초          | 10초                  |
| **Long Timeout**    | 2분                | 1분           | 30초                  |
| **Stream Timeout**  | 5분                | 3분           | 2분                   |
| **Cache TTL**       | 5분                | 10분          | 30분                  |
| **Debug Mode**      | ✅ 활성화          | ⚠️ 제한적     | ❌ 비활성화           |

## 🔧 환경 파일 설정

### 1. 기본 환경 변수 (.env.local)

```bash
# 기본 URL 설정
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI 서비스 키
GOOGLE_AI_API_KEY=your_google_ai_key
GOOGLE_AI_MODEL=gemini-2.0-flash-exp

# GCP 설정
GCP_PROJECT_ID=your_project_id
GCP_VM_EXTERNAL_IP=your_vm_ip
GCP_FUNCTIONS_REGION=us-central1

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# 외부 서비스
TAVILY_API_KEY=your_tavily_key
```

### 2. 환경별 분기 구성

```typescript
// src/lib/env-config.ts
export const ENV_CONFIG = {
  development: {
    baseUrl: 'http://localhost:3000',
    debug: true,
    rateLimit: 100,
    timeout: 30000,
  },
  test: {
    baseUrl: 'https://openmanager-test.vercel.app',
    debug: false,
    rateLimit: 60,
    timeout: 15000,
  },
  production: {
    baseUrl: 'https://openmanager-vibe-v5.vercel.app',
    debug: false,
    rateLimit: 60,
    timeout: 10000,
  },
};
```

## 🚀 플랫폼별 설정

### Vercel 배포 설정

```bash
# Vercel 환경 변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add GOOGLE_AI_API_KEY
vercel env add GCP_PROJECT_ID
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
vercel env add TAVILY_API_KEY

# 프로덕션 환경 배포
vercel --prod
```

### Supabase 인증 설정

```sql
-- RLS 정책 설정
CREATE POLICY "사용자는 자신의 데이터만 접근" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- GitHub OAuth 설정
INSERT INTO auth.providers (name, enabled) VALUES ('github', true);
```

### GCP 통합 설정

```bash
# GCP 인증 설정
gcloud auth login
gcloud config set project your-project-id

# VM 인스턴스 설정
gcloud compute instances create openmanager-vm \
  --zone=us-central1-a \
  --machine-type=e2-micro \
  --image-family=ubuntu-2404-lts \
  --image-project=ubuntu-os-cloud
```

## 🧪 테스트 환경 설정

### Vitest 환경 설정

```typescript
// config/testing/vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_BASE_URL: 'https://openmanager-test.vercel.app',
    },
  },
});
```

### 테스트 환경 변수

```bash
# .env.test
NODE_ENV=test
NEXT_PUBLIC_BASE_URL=https://openmanager-test.vercel.app
SUPABASE_URL=your_test_supabase_url
GOOGLE_AI_API_KEY=test_key_with_limited_quota
```

## 🔐 보안 설정

### 환경 변수 보안

```typescript
// src/lib/security.ts
export const validateEnvVars = () => {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_AI_API_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
};
```

### CSP 헤더 설정

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co https://api.anthropic.com",
    ].join('; '),
  },
];
```

## 📊 모니터링 설정

### 헬스 체크 엔드포인트

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      supabase: await checkSupabase(),
      googleAI: await checkGoogleAI(),
      gcpVM: await checkGCPVM(),
    },
  };

  return Response.json(health);
}
```

### 환경별 로깅

```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${message}`, data);
    }
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
    // 프로덕션에서는 외부 로깅 서비스로 전송
  },
};
```

## 🛠️ 개발 도구 설정

### VS Code 설정

```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "eslint.workingDirectories": ["./"],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.env.*": "dotenv"
  }
}
```

### Git Hooks 설정

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 환경 변수 체크
npm run env:validate

# 린트 실행
npm run lint

# 타입 체크
npm run type-check
```

## 🚀 배포 자동화

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📚 관련 문서

### 설정 가이드

- **[인증 보안 설정](./auth-security-setup.md)**
- **[플랫폼 배포 설정](./platform-deployment-setup.md)**
- **[서비스 통합 설정](./services-integration-setup.md)**

### 개발 환경

- **[개발 가이드](../development/development-guide.md)**
- **[WSL 최적화](../development/wsl-optimization-guide.md)**
- **[TypeScript 설정](../development/typescript-guide.md)**

### 배포 관련

- **[Vercel 배포](../deployment/vercel-deployment.md)**
- **[GCP 배포](../deployment/gcp-deployment.md)**
- **[무료 티어 최적화](../deployment/free-tier-optimization.md)**

---

> **환경 설정 문제가 있나요?** [문제 해결 가이드](../TROUBLESHOOTING.md)를 확인해주세요.
