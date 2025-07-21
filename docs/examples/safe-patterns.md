# 안전한 환경변수 예제 패턴 가이드

이 문서는 OpenManager VIBE v5 프로젝트에서 사용하는 안전한 환경변수 예제 패턴들을 정의합니다.
보안 검사에서 오탐지를 방지하면서도 명확한 예제를 제공하기 위한 표준 패턴들입니다.

## 🔒 환경변수 플레이스홀더 규칙

### 1. 대문자 플레이스홀더 패턴

`YOUR_SERVICE_NAME_PLACEHOLDER` 형식을 사용합니다.

```env
# ✅ 올바른 예제
GOOGLE_AI_API_KEY=YOUR_GOOGLE_AI_API_KEY_PLACEHOLDER
SUPABASE_URL=YOUR_SUPABASE_URL_PLACEHOLDER
GITHUB_TOKEN=YOUR_GITHUB_TOKEN_PLACEHOLDER

# ❌ 피해야 할 패턴
GOOGLE_AI_API_KEY=YOUR_GOOGLE_AI_API_KEY_PLACEHOLDER
GITHUB_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 2. 서비스별 안전한 예제 패턴

#### GitHub 토큰

```env
# Personal Access Token
GITHUB_TOKEN=YOUR_GITHUB_PERSONAL_ACCESS_TOKEN_PLACEHOLDER

# OAuth App
GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID_PLACEHOLDER
GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET_PLACEHOLDER
```

#### API 키들

```env
# Google AI
GOOGLE_AI_API_KEY=YOUR_GOOGLE_AI_API_KEY_PLACEHOLDER

# OpenAI
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_PLACEHOLDER

# Anthropic
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY_PLACEHOLDER

# Tavily
TAVILY_API_KEY=YOUR_TAVILY_API_KEY_PLACEHOLDER
```

#### 데이터베이스 연결

```env
# Supabase
SUPABASE_URL=YOUR_SUPABASE_URL_PLACEHOLDER
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL_PLACEHOLDER
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_PLACEHOLDER
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER

# Redis
REDIS_URL=redis://default:YOUR_REDIS_TOKEN_PLACEHOLDER@your-redis-host.upstash.io:PORT
UPSTASH_REDIS_REST_URL=https://YOUR_REDIS_HOST_PLACEHOLDER
UPSTASH_REDIS_REST_TOKEN=YOUR_REDIS_TOKEN_PLACEHOLDER

# PostgreSQL
DATABASE_URL=postgresql://username:YOUR_DATABASE_PASSWORD_PLACEHOLDER@host:port/database
```

### 3. 테스트 파일용 안전한 모의 값

```typescript
// ✅ 테스트 파일에서 사용할 안전한 패턴
const mockApiKey = 'MOCK_API_KEY_FOR_TESTING';
const testToken = 'MOCK_TOKEN_FOR_TESTING';
const sampleSecret = 'MOCK_SECRET_FOR_TESTING';

// ❌ 피해야 할 패턴
const apiKey = 'test_api_key';
const secret = 'super_secret_api_key_12345';
```

### 4. 문서화 시 안전한 예제

````markdown
## 환경변수 설정

1. `.env.example`을 `.env.local`로 복사합니다:
   ```bash
   cp .env.example .env.local
   ```
````

2. 각 환경변수를 실제 값으로 교체합니다:

   ```env
   # 변경 전
   GOOGLE_AI_API_KEY=YOUR_GOOGLE_AI_API_KEY_PLACEHOLDER

   # 변경 후 (실제 키는 표시하지 않음)
   GOOGLE_AI_API_KEY=[실제 API 키 입력]
   ```

````

## 🚫 절대 사용하면 안 되는 패턴

다음 패턴들은 보안 검사에서 실제 시크릿으로 오인될 수 있으므로 절대 사용하지 마세요:

```env
# ❌ 실제 시크릿처럼 보이는 패턴
ghp_1234567890abcdef1234567890abcdef12345678
sk-1234567890abcdef1234567890abcdef1234567890abcdef
AIzaSyA1234567890abcdef1234567890abcdef

# ❌ 모호한 플레이스홀더
YOUR_API_KEY_PLACEHOLDER
YOUR_TOKEN_PLACEHOLDER
xxx_xxx_xxx
````

## ✅ 권장 사항

1. **명확한 플레이스홀더 사용**: `YOUR_SERVICE_NAME_PLACEHOLDER` 형식
2. **테스트 값은 MOCK\_ 접두사**: `MOCK_API_KEY_FOR_TESTING`
3. **민감한 정보는 REDACTED**: `[REDACTED]` 또는 `SENSITIVE_INFO_REMOVED`
4. **실제 형식 설명 추가**: 주석으로 실제 값의 형식 설명

```env
# Google AI API 키 (형식: AIza로 시작하는 39자 문자열)
GOOGLE_AI_API_KEY=YOUR_GOOGLE_AI_API_KEY_PLACEHOLDER

# GitHub Personal Access Token (형식: ghp_로 시작하는 40자 문자열)
GITHUB_TOKEN=YOUR_GITHUB_PERSONAL_ACCESS_TOKEN_PLACEHOLDER
```

## 📝 체크리스트

환경변수 예제 작성 시 확인사항:

- [ ] 플레이스홀더가 `YOUR_*_PLACEHOLDER` 형식인가?
- [ ] 테스트 값이 `MOCK_*` 형식인가?
- [ ] 실제 시크릿처럼 보이는 패턴이 없는가?
- [ ] 민감한 정보가 `[REDACTED]`로 표시되었는가?
- [ ] 주석으로 실제 값의 형식이 설명되어 있는가?

이 가이드를 따르면 보안 검사를 통과하면서도 개발자에게 명확한 예제를 제공할 수 있습니다.
