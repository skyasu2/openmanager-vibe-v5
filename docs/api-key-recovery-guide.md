# 🔐 암호화된 API 키 복원 가이드

## 개요

OpenManager Vibe v5 프로젝트는 **EnhancedEnvCryptoManager**를 사용하여 모든 API 키와 민감한 환경변수를 암호화하여 안전하게 관리합니다. 이 가이드는 암호화된 API 키를 복원하고 사용하는 방법을 설명합니다.

## 🗝️ 마스터 비밀번호 확인

API 키 복호화를 위해서는 **마스터 비밀번호**가 필요합니다:

1. **환경변수**: `ENV_MASTER_PASSWORD`
2. **파일**: `.env.key` (프로젝트 루트)
3. **팀 비밀번호**: 팀에서 공유하는 복호화 비밀번호

## 🚀 API 키 복원 방법

### 1. 모든 API 키 확인

```bash
npm run decrypt:keys
```

- 마스터 비밀번호를 입력하면 모든 암호화된 환경변수를 복호화합니다
- 민감한 키는 일부만 표시됩니다 (처음 10자 + 마지막 5자)

### 2. 특정 API 키만 복원

```bash
npm run decrypt:keys GOOGLE_AI_API_KEY
```

### 3. .env 파일로 내보내기

```bash
npm run decrypt:keys:export
```

- `.env.decrypted` 파일로 모든 환경변수를 내보냅니다
- **⚠️ 주의**: 사용 후 반드시 파일을 삭제하세요!

### 4. MCP 설정 자동 업데이트

```bash
npm run decrypt:mcp-update
```

- Claude Desktop의 MCP 설정에 자동으로 API 키를 적용합니다
- GitHub 토큰 등이 자동 업데이트됩니다

## 📋 암호화된 API 키 목록

현재 프로젝트에 암호화되어 있는 주요 API 키:

| 키 이름                     | 용도                 | 카테고리 |
| --------------------------- | -------------------- | -------- |
| `GOOGLE_AI_API_KEY`         | Google AI/Gemini API | ai       |
| `GITHUB_TOKEN`              | GitHub API 액세스    | vcs      |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 관리자 키   | database |
| `UPSTASH_REDIS_REST_TOKEN`  | Redis 캐시 액세스    | cache    |
| `NEXTAUTH_SECRET`           | 인증 시크릿          | auth     |

## 🔒 보안 주의사항

### DO:

- ✅ 마스터 비밀번호를 안전하게 보관
- ✅ 복호화된 파일은 사용 후 즉시 삭제
- ✅ 팀원과 마스터 비밀번호 안전하게 공유
- ✅ 정기적으로 API 키 로테이션

### DON'T:

- ❌ 복호화된 키를 평문으로 저장
- ❌ Git에 .env 파일 커밋
- ❌ 공개 채널에서 마스터 비밀번호 공유
- ❌ 복호화 로그를 남기기

## 🛠️ 문제 해결

### 복호화 실패 시

1. 마스터 비밀번호가 정확한지 확인
2. `config/encrypted-env-config.ts` 파일이 존재하는지 확인
3. Node.js 버전이 22.0.0 이상인지 확인

### 환경변수가 로드되지 않을 때

```bash
# 수동으로 환경변수 설정
export ENV_MASTER_PASSWORD="your-master-password"
npm run dev
```

## 🔄 API 키 업데이트

### 새 API 키 추가

```bash
# 1. 토큰 관리 도구 사용
npm run secure:add NEW_API_KEY

# 2. 암호화된 설정 재생성
npm run encrypt:env
```

### 기존 API 키 변경

1. 복호화: `npm run decrypt:keys:export`
2. `.env.decrypted` 파일에서 값 수정
3. 재암호화: `npm run encrypt:env`
4. `.env.decrypted` 파일 삭제

## 📚 관련 파일

- **암호화된 설정**: `/config/encrypted-env-config.ts`
- **암호화 매니저**: `/src/lib/crypto/EnhancedEnvCryptoManager.ts`
- **환경변수 로더**: `/src/lib/environment/encrypted-env-loader.ts`
- **복호화 스크립트**: `/scripts/decrypt-api-keys.ts`

## 🚀 빠른 시작

```bash
# 1. API 키 확인
npm run decrypt:keys

# 2. 개발 서버 시작 (자동 복호화)
echo "your-master-password" > .env.key
npm run dev

# 3. 프로덕션 배포
# Vercel에 ENV_MASTER_PASSWORD 환경변수 설정
```

## 💡 팁

1. **VSCode 사용자**: `.env.key` 파일을 `.gitignore`에 추가하고 팀원과 별도로 공유
2. **CI/CD**: GitHub Secrets에 `ENV_MASTER_PASSWORD` 저장
3. **로컬 개발**: `.env.key` 파일 사용이 가장 편리
4. **Vercel 배포**: 환경변수로 `ENV_MASTER_PASSWORD` 설정

---

이 시스템은 API 키를 안전하게 관리하면서도 개발 편의성을 제공합니다.
질문이나 문제가 있으면 팀 리더에게 문의하세요.
