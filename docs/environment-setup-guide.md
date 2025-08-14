# 📋 환경변수 설정 가이드

## 개요

OpenManager VIBE v5는 환경별로 구분된 설정을 사용합니다. 모든 환경변수는 `.env.local` 파일로 통합 관리됩니다.

## 🎯 환경 구분

### 1. 개발 환경 (Development)
- **URL**: `http://localhost:3000`
- **용도**: 로컬 개발 및 테스트
- **설정**: `NODE_ENV=development`

### 2. 테스트 환경 (Test/Staging)
- **URL**: `https://openmanager-test.vercel.app`
- **용도**: Vercel Preview 배포, QA 테스트
- **설정**: `NODE_ENV=test`

### 3. 프로덕션 환경 (Production)
- **URL**: `https://openmanager-vibe-v5.vercel.app`
- **용도**: 실제 서비스 운영
- **설정**: `NODE_ENV=production`

## 🚀 빠른 시작

### 1단계: 템플릿 복사
```bash
cp .env.local.template .env.local
```

### 2단계: 필수 값 설정
`.env.local` 파일을 열고 다음 필수 값들을 설정:

```env
# 환경 설정 (development | test | production)
NODE_ENV=development

# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# GitHub OAuth (필수)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Google AI (선택)
GOOGLE_AI_API_KEY=your-google-ai-key
```

### 3단계: 환경별 URL 설정
```env
# 로컬 개발
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 테스트 서버 (Vercel Preview)
NEXT_PUBLIC_SITE_URL=https://openmanager-test.vercel.app

# 프로덕션 (Vercel 메인)
NEXT_PUBLIC_SITE_URL=https://openmanager-vibe-v5.vercel.app
```

## 📊 환경별 설정 매트릭스

| 설정 | 개발 | 테스트 | 프로덕션 |
|------|------|--------|----------|
| NODE_ENV | development | test | production |
| NEXT_PUBLIC_SITE_URL | localhost:3000 | test.vercel.app | vibe-v5.vercel.app |
| DEBUG | true | true | false |
| MOCK_MODE | true/false | false | false |
| API_RATE_LIMIT | 100 | 60 | 60 |

## 🔒 보안 주의사항

### ⚠️ 절대 하지 말아야 할 것
1. **실제 키를 Git에 커밋하지 마세요**
2. **서비스 키를 클라이언트에 노출하지 마세요**
3. **`.env.local` 파일을 공유하지 마세요**

### ✅ 권장 사항
1. **환경변수는 Vercel 대시보드에서 설정**
2. **로컬에서는 `.env.local` 사용**
3. **민감한 키는 `[환경변수에서 설정]`으로 표시**

## 🔧 Vercel 배포 설정

### Vercel 대시보드에서 설정할 환경변수

1. **프로덕션 환경변수** (Production)
```
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://openmanager-vibe-v5.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
GITHUB_CLIENT_ID=your-github-id
GITHUB_CLIENT_SECRET=your-github-secret
```

2. **프리뷰 환경변수** (Preview/Test)
```
NODE_ENV=test
NEXT_PUBLIC_SITE_URL=https://openmanager-test.vercel.app
# 나머지는 프로덕션과 동일하거나 테스트용 키 사용
```

## 📝 환경변수 유틸리티

### 환경 감지 코드
```typescript
import { getEnvConfig } from '@/lib/env-config';

const config = getEnvConfig();
console.log('현재 환경:', config.environment);
console.log('사이트 URL:', config.siteUrl);
console.log('API URL:', config.apiUrl);
```

### API 엔드포인트에서 사용
```typescript
import { getEnvConfig } from '@/lib/env-config';

export async function GET() {
  const config = getEnvConfig();
  
  // 환경에 따른 처리
  if (config.isProduction) {
    // 프로덕션 로직
  } else if (config.isTest) {
    // 테스트 로직
  } else {
    // 개발 로직
  }
}
```

## 🧪 테스트

### 환경변수 검증
```bash
# 환경변수 확인
npm run env:check

# 개발 서버 실행
npm run dev

# 테스트 모드 실행
NODE_ENV=test npm run dev

# 프로덕션 빌드 테스트
NODE_ENV=production npm run build
```

## 📚 관련 문서

- [Vercel 환경변수 문서](https://vercel.com/docs/environment-variables)
- [Next.js 환경변수 문서](https://nextjs.org/docs/basic-features/environment-variables)
- [프로젝트 README](../README.md)

## 🔄 API 환경별 설정

### API 설정 자동 적용
환경에 따라 자동으로 다른 API 설정이 적용됩니다:

| 설정 | 개발 | 테스트 | 프로덕션 |
|------|------|--------|----------|
| Rate Limit | 100/분 | 60/분 | 60/분 |
| Timeout | 30초 | 15초 | 10초 |
| Cache TTL | 비활성화 | 5분 | 10분 |
| Debug Mode | 활성화 | 활성화 | 비활성화 |

### API 설정 사용법

#### 서버 사이드 (API Routes)
```typescript
import { getEnvConfig, getApiConfig } from '@/lib/env-config';

export async function GET() {
  const envConfig = getEnvConfig();
  const apiConfig = getApiConfig();
  
  // 환경별 처리
  if (envConfig.isDevelopment) {
    // 개발 환경 로직
  }
  
  // 캐시 헤더 설정
  const headers = apiConfig.cache.enabled
    ? { 'Cache-Control': `max-age=${apiConfig.cache.ttl}` }
    : { 'Cache-Control': 'no-cache' };
}
```

#### 클라이언트 사이드 (React Components)
```typescript
import { useApiConfig, useEnvironment } from '@/hooks/useApiConfig';

function MyComponent() {
  const { apiCall, buildApiUrl } = useApiConfig();
  const env = useEnvironment();
  
  // 환경별 조건부 렌더링
  const apiUrl = env.when({
    development: 'http://localhost:3000/api',
    test: 'https://test.vercel.app/api',
    production: 'https://vibe-v5.vercel.app/api',
  }, '/api');
  
  // API 호출
  const data = await apiCall('/servers', { method: 'GET' });
}
```

### 환경 표시 컴포넌트
개발/테스트 환경에서 현재 환경을 시각적으로 표시:

```typescript
import { EnvironmentBadge } from '@/components/EnvironmentBadge';

// 레이아웃에 추가
<EnvironmentBadge />
```

## ❓ 자주 묻는 질문

### Q: Vercel 배포 시 환경변수가 적용되지 않아요
A: Vercel 대시보드에서 환경변수를 설정한 후 재배포가 필요합니다.

### Q: 로컬과 프로덕션 환경을 어떻게 구분하나요?
A: `NODE_ENV`와 `VERCEL_ENV` 환경변수로 자동 감지됩니다.

### Q: 테스트 서버는 어떻게 설정하나요?
A: Vercel Preview 배포를 사용하거나 별도 브랜치로 배포합니다.

### Q: API 환경별 설정을 커스텀하려면?
A: `/src/lib/api-config.ts` 파일의 `API_CONFIGS` 객체를 수정하세요.

---

**마지막 업데이트**: 2025-08-14