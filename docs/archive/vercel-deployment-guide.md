# 🚀 Vercel 환경변수 설정 가이드

> **최신 업데이트**: 2025년 7월 11일 - GCP Functions 3-Tier 아키텍처 반영

이 가이드는 OpenManager Vibe v5를 Vercel에 배포할 때 필요한 환경변수들을 올바르게 설정하는 방법을 설명합니다. GCP Functions와 MCP 서버를 포함한 3-Tier 아키텍처를 지원합니다.

## 📋 필수 환경변수 목록

### 1. 기본 애플리케이션 설정
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_FREE_TIER_MODE=true
VERCEL_HOBBY_PLAN=true
ENABLE_QUOTA_PROTECTION=true
```

### 2. Supabase 설정 (선택사항)
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 3. Redis 캐싱 설정 (선택사항)
```
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token
```

### 4. AI 엔진 설정

#### Google AI (폴백용)
```
GOOGLE_AI_API_KEY=your-google-ai-api-key
GOOGLE_AI_MODEL=gemini-1.5-flash
GOOGLE_AI_ENABLED=true
```

#### GCP Functions (3-Tier AI)
```
GCP_FUNCTIONS_ENABLED=true
GCP_FUNCTIONS_BASE_URL=https://asia-northeast3-openmanager-ai.cloudfunctions.net
THREE_TIER_AI_ENABLED=true
```

#### MCP 서버 (컨텍스트 분석)
```
MCP_SERVER_ENABLED=true
MCP_SERVER_URL=http://104.154.205.25:10000
```

### 5. 인증 설정 (선택사항)

#### NextAuth 기본 설정
```
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-app-name.vercel.app
```

#### GitHub OAuth 설정 (선택사항)
```
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

GitHub OAuth 설정 방법:
1. [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)로 이동
2. "New OAuth App" 클릭
3. 다음 정보 입력:
   - Application name: OpenManager Vibe v5
   - Homepage URL: https://your-app-name.vercel.app
   - Authorization callback URL: https://your-app-name.vercel.app/api/auth/callback/github
4. 생성된 Client ID와 Client Secret을 위 환경변수에 설정

## 🔧 Vercel 대시보드에서 환경변수 설정하기

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. 프로젝트 선택
3. **Settings** 탭 클릭
4. **Environment Variables** 섹션으로 이동
5. 각 환경변수를 추가:
   - **Name**: 환경변수 이름 입력
   - **Value**: 환경변수 값 입력
   - **Environment**: Production, Preview, Development 중 선택

## ⚠️ 중요 사항

### 클라이언트 사이드 환경변수
- 브라우저에서 접근 가능한 환경변수는 반드시 `NEXT_PUBLIC_` 접두사를 사용해야 합니다
- 민감한 정보(API 키, 시크릿 등)는 절대 `NEXT_PUBLIC_` 접두사를 사용하지 마세요

### 서버 사이드 전용 환경변수
- `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_AI_API_KEY` 등은 서버에서만 사용됩니다
- 이러한 환경변수는 클라이언트 번들에 포함되지 않습니다

## 🎯 환경별 설정

### Production 환경
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-production-app.vercel.app
```

### Preview 환경 (브랜치 배포)
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-preview-app.vercel.app
```

## 🔍 환경변수 확인 방법

배포 후 환경변수가 올바르게 설정되었는지 확인:

1. Vercel 대시보드의 **Functions** 탭에서 로그 확인
2. 브라우저 개발자 도구 콘솔에서 경고 메시지 확인
3. `/api/health` 엔드포인트로 시스템 상태 확인
4. `/api/ai/status` 엔드포인트로 3-Tier AI 시스템 상태 확인

## 💡 문제 해결

### "환경변수 미설정" 경고가 계속 나타날 때
1. Vercel 대시보드에서 환경변수가 올바르게 설정되었는지 확인
2. 배포를 다시 트리거하여 환경변수 적용
3. 브라우저 캐시를 삭제하고 페이지 새로고침

### 클라이언트 사이드에서 환경변수 접근 불가
- `NEXT_PUBLIC_` 접두사가 붙어있는지 확인
- 배포 후 환경변수를 추가했다면 재배포 필요

## 🎯 환경변수 우선순위

### 필수 환경변수
1. `NODE_ENV` - 프로덕션 환경 설정
2. `NEXT_PUBLIC_APP_URL` - 앱 URL
3. `GOOGLE_AI_API_KEY` - AI 서비스 기본 키

### 권장 환경변수
1. GCP Functions 관련 설정 (3-Tier AI)
2. MCP 서버 설정 (컨텍스트 분석)
3. Supabase 설정 (데이터베이스)
4. Redis 설정 (캐싱)

## 📚 참고 자료
- [Vercel 환경변수 문서](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js 환경변수 문서](https://nextjs.org/docs/basic-features/environment-variables)
- [전체 배포 가이드](./deployment-guide.md)
- [MCP 완전 가이드](./mcp-complete-guide.md)