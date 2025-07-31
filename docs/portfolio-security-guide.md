# 포트폴리오 보안 가이드

**작성일**: 2025-07-31  
**목적**: 포트폴리오 프로젝트를 위한 적절한 보안 수준 안내

## 🎯 보안 철학

포트폴리오 프로젝트는 엔터프라이즈급 보안이 아닌, **실용적이고 기본적인 보안**에 중점을 둡니다.

### 핵심 원칙
- ✅ 하드코딩된 시크릿 방지
- ✅ 기본적인 API 보호
- ✅ 환경변수 사용
- ❌ 과도한 보안 정책
- ❌ 복잡한 인증 시스템

## 🔧 보안 설정 현황

### 1. AI 보안 (완화됨)

```typescript
// PromptSanitizer
{
  enableStrictMode: false,  // 포트폴리오용
  maxInputLength: 2000,
  blockSystemCommands: true,
  enableKoreanProtection: true
}

// UnifiedAIEngineRouter
{
  enableSecurity: true,
  strictSecurityMode: false,  // 포트폴리오용
  dailyTokenLimit: 10000,
  userTokenLimit: 1000
}
```

### 2. API 보호 (기본)

```typescript
// 민감한 엔드포인트만 보호
- /api/admin/*     ✅ 인증 필요
- /api/database/*  ✅ 인증 필요
- /api/ai/security ✅ 인증 필요
- /api/ai/query    ✅ 인증 필요
- /api/servers/*   ❌ 공개 (데모용)
```

### 3. 환경변수 관리

```bash
# .env.local (필수)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_AI_API_KEY=your_google_ai_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## 🛡️ 기본 보안 체크리스트

### 필수 항목
- [ ] 하드코딩된 시크릿 없음
- [ ] 환경변수로 모든 설정 관리
- [ ] 관리자 API 인증 보호
- [ ] 기본 입력 검증
- [ ] 일반적인 에러 메시지

### 선택 항목
- [ ] HTTPS 사용 (Vercel 자동)
- [ ] 기본 CORS 설정
- [ ] Rate limiting (선택사항)

## 🚀 빠른 보안 설정

### 1. 하드코딩 검사

```bash
# Husky pre-commit 자동 실행
git commit -m "your message"

# 수동 검사
bash scripts/security/check-hardcoded-secrets.sh
```

### 2. API 보호 추가

```typescript
// src/app/api/your-endpoint/route.ts
import { withAuth } from '@/lib/api-auth';

async function handler(request: NextRequest) {
  // Your API logic
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
```

### 3. 환경변수 사용

```typescript
// ❌ 나쁜 예
const apiKey = 'sk_live_abcd1234';

// ✅ 좋은 예
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY not configured');
}
```

## 📊 보안 수준 비교

| 항목 | 엔터프라이즈 | 포트폴리오 (현재) |
|------|--------------|-------------------|
| 하드코딩 방지 | ✅ | ✅ |
| API 인증 | 모든 엔드포인트 | 민감한 것만 |
| 입력 검증 | 엄격함 | 기본적 |
| 보안 헤더 | 모두 설정 | 기본값 |
| 로깅/모니터링 | 상세함 | 최소한 |
| 취약점 스캔 | 자동화 | 수동 |

## ⚠️ 주의사항

### 프로덕션 배포 시
포트폴리오를 실제 서비스로 전환할 때는:

1. `enableStrictMode: true`로 변경
2. 모든 API 엔드포인트 보호
3. 상세한 로깅 추가
4. 보안 헤더 강화
5. 정기적인 취약점 스캔

### 현재 설정 유지
포트폴리오/데모 용도로는 현재 설정이 적합합니다:
- 개발 속도 우선
- 기본 보안 확보
- 데모에 적합한 유연성

## 🔍 보안 검사 명령어

```bash
# TypeScript 타입 체크
npm run type-check

# 린트 실행
npm run lint

# 하드코딩 시크릿 검사
bash scripts/security/check-hardcoded-secrets.sh

# 빌드 테스트
npm run build
```

## 📝 참고 자료

- [OWASP Top 10](https://owasp.org/Top10/) - 참고용
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers) - 기본 설정
- `.claude/agents/security-auditor.md` - 포트폴리오용으로 조정됨

---

💡 **요약**: 포트폴리오 프로젝트는 **실용적인 보안**에 중점을 둡니다. 하드코딩 방지와 기본 인증만으로도 충분합니다.