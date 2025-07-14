# 🔐 암호화된 환경변수 사용 가이드

이 가이드는 OpenManager Vibe v5의 환경변수 암호화 시스템을 사용하는 방법을 설명합니다.

## 📋 개요

환경변수 암호화 시스템은 민감한 정보(API 키, 비밀번호 등)를 안전하게 저장하고 배포할 수 있도록 합니다:

- **AES-256-GCM** 암호화로 데이터 보호
- **PBKDF2 100,000회** 반복으로 강력한 키 유도
- Git에 암호화된 상태로 저장 가능
- Vercel 배포 시 자동 복호화

## 🚀 빠른 시작

### 1. 마스터 비밀번호 생성

```bash
# .env.key 파일에 마스터 비밀번호 저장 (로컬 개발용)
echo "your-super-secret-master-password-32chars!" > .env.key

# .gitignore에 추가 확인
echo ".env.key" >> .gitignore
```

### 2. 환경변수 암호화

```bash
# .env.local 파일의 환경변수를 암호화
node scripts/unified-env-crypto.mjs encrypt --password-file=.env.key

# 또는 직접 비밀번호 입력
node scripts/unified-env-crypto.mjs encrypt --password="your-password"
```

### 3. 암호화된 설정 확인

```bash
# 무결성 검증
node scripts/unified-env-crypto.mjs verify --password-file=.env.key

# 복호화 테스트 (키만 출력)
node scripts/unified-env-crypto.mjs decrypt --password-file=.env.key
```

## 📦 Vercel 배포 설정

### 1. Vercel 환경변수 설정

Vercel 대시보드에서 다음 환경변수를 추가:

```
ENV_MASTER_PASSWORD=your-super-secret-master-password-32chars!
```

⚠️ **중요**: 이 비밀번호는 암호화할 때 사용한 것과 동일해야 합니다!

### 2. 암호화된 설정 커밋

```bash
# 암호화된 설정 파일 확인
ls -la config/encrypted-env-config.ts

# Git에 커밋
git add config/encrypted-env-config.ts
git commit -m "🔐 Add encrypted environment variables"
git push
```

### 3. 자동 로드 확인

Vercel에 배포되면 자동으로:
1. `ENV_MASTER_PASSWORD` 읽기
2. 암호화된 설정 복호화
3. 환경변수로 로드

## 💻 코드에서 사용하기

### 기존 방식 (여전히 작동)

```typescript
const apiKey = process.env.GOOGLE_AI_API_KEY;
```

### 권장 방식 (타입 안전)

```typescript
import { secureEnv } from '@/lib/environment/encrypted-env-loader';

// 환경변수 접근
const apiKey = secureEnv.GOOGLE_AI_API_KEY();
const isProduction = secureEnv.isProduction();

// 환경변수 검증
if (!secureEnv.validate()) {
  throw new Error('필수 환경변수가 설정되지 않았습니다');
}
```

## 🔒 보안 모범 사례

### 마스터 비밀번호 관리

1. **강력한 비밀번호 사용**
   - 최소 32자 이상
   - 대소문자, 숫자, 특수문자 혼합
   - 예: `MyS3cur3P@ssw0rd!2024#OpenManager$Vibe`

2. **비밀번호 저장**
   - 로컬: `.env.key` 파일 (`.gitignore`에 추가)
   - Vercel: 환경변수로만 저장
   - 절대 코드에 하드코딩하지 않기

3. **정기적 변경**
   - 분기별 비밀번호 변경
   - 변경 시 재암호화 필요

### 환경별 분리

```bash
# 개발 환경
node scripts/unified-env-crypto.mjs encrypt --env=.env.development

# 프로덕션 환경  
node scripts/unified-env-crypto.mjs encrypt --env=.env.production
```

## 🛠️ 문제 해결

### "환경변수 미설정" 경고가 나타날 때

1. **Vercel에서 확인**
   - `ENV_MASTER_PASSWORD`가 설정되어 있는지 확인
   - 재배포 시도

2. **로컬에서 확인**
   - `.env.key` 파일이 있는지 확인
   - 암호화된 설정 파일이 있는지 확인

### 복호화 실패

1. **비밀번호 확인**
   - 암호화할 때와 동일한 비밀번호 사용
   - 공백이나 줄바꿈 문자 제거

2. **파일 무결성 확인**
   ```bash
   node scripts/unified-env-crypto.mjs verify --password-file=.env.key
   ```

## 📊 지원되는 환경변수

다음 환경변수들이 자동으로 암호화됩니다:

- `GOOGLE_AI_API_KEY` - Google AI API 키
- `NEXTAUTH_SECRET` - NextAuth 시크릿
- `GITHUB_CLIENT_ID` - GitHub OAuth ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth 시크릿
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 공개 키
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase 서비스 키
- `UPSTASH_REDIS_REST_URL` - Redis URL
- `UPSTASH_REDIS_REST_TOKEN` - Redis 토큰

## 🔄 마이그레이션 가이드

기존 시스템에서 마이그레이션:

1. **백업 생성**
   ```bash
   cp .env.local .env.local.backup
   ```

2. **새 시스템으로 암호화**
   ```bash
   node scripts/unified-env-crypto.mjs encrypt --password-file=.env.key
   ```

3. **Vercel 설정**
   - `ENV_MASTER_PASSWORD` 추가
   - 기존 환경변수 제거 (암호화된 버전 사용)

4. **코드 업데이트**
   ```typescript
   // 기존
   const key = process.env.GOOGLE_AI_API_KEY;
   
   // 새로운 방식 (선택사항)
   import { secureEnv } from '@/lib/environment/encrypted-env-loader';
   const key = secureEnv.GOOGLE_AI_API_KEY();
   ```

## ⚡ 성능 최적화

- **캐싱**: 한 번 복호화된 값은 메모리에 캐싱
- **지연 로딩**: 필요한 시점에만 복호화
- **자동 초기화**: Next.js instrumentation으로 앱 시작 시 자동 로드

## 🔍 디버깅

환경변수 로드 상태 확인:

```typescript
import { encryptedEnvLoader } from '@/lib/environment/encrypted-env-loader';

// 초기화 상태
console.log('초기화됨:', encryptedEnvLoader.isInitialized());

// 로드 에러
const error = encryptedEnvLoader.getLoadError();
if (error) {
  console.error('로드 실패:', error);
}
```

## 📚 추가 자료

- [환경변수 암호화 아키텍처](./architecture/env-encryption.md)
- [보안 감사 가이드](./security/audit-guide.md)
- [Vercel 배포 가이드](./vercel-deployment-guide.md)