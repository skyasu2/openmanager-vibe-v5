# 🔐 보안 및 암호화 통합 가이드

## 📋 개요

OpenManager Vibe v5는 보안을 최우선으로 하는 AI 기반 서버 모니터링 플랫폼입니다. 이 가이드는 프로젝트의 모든 보안 측면을 포괄하는 통합 문서로, 민감한 정보 보호, 환경변수 암호화, 그리고 안전한 배포를 위한 모든 정보를 담고 있습니다.

### 주요 보안 기능

- **AES-256 암호화**: 모든 민감한 데이터는 AES-256-GCM/CBC로 암호화
- **PBKDF2 키 유도**: 10,000~100,000회 반복으로 브루트포스 공격 방어
- **환경변수 자동 암호화**: Git에 안전하게 저장 가능한 암호화 시스템
- **자동 복호화**: Vercel 배포 시 자동으로 환경변수 복호화

---

## 🛡️ 보안 원칙 및 모범 사례

### 1. 절대 금지 사항

- ❌ API 키를 코드에 직접 하드코딩
- ❌ `.env` 파일을 Git에 커밋
- ❌ 개발자 도구 콘솔에 API 키 노출
- ❌ 로그 파일에 민감한 정보 출력
- ❌ 프로덕션 키를 개발 환경에서 사용

### 2. 안전한 사용법

- ✅ 환경변수 또는 암호화된 형태로만 저장
- ✅ `process.env.GOOGLE_AI_API_KEY_ENCRYPTED` 사용
- ✅ 암호화 함수를 통한 안전한 접근
- ✅ 개발/프로덕션 환경 완전 분리
- ✅ 정기적인 키 로테이션

### 3. 환경별 보안 전략

#### 개발 환경
```bash
# .env.local 파일 사용 (Git에서 자동 제외)
ENCRYPTION_KEY=dev-only-encryption-key
GOOGLE_AI_API_KEY_ENCRYPTED=암호화된_키
```

#### 프로덕션 환경
```bash
# Vercel 환경변수로만 관리
ENV_MASTER_PASSWORD=프로덕션_마스터_비밀번호
# 암호화된 설정 파일은 Git에 커밋
```

---

## 🔐 환경변수 암호화 시스템

### 시스템 아키텍처

OpenManager Vibe v5는 3개의 핵심 모듈로 구성된 통합 암호화 시스템을 제공합니다:

1. **암호화 엔진** (`src/utils/encryption.ts`)
   - CryptoJS AES-256 암호화
   - 빌드 타임/런타임 분리
   - 자동 Google AI 키 복호화

2. **CLI 유틸리티** (`src/utils/cli-utils.ts`)
   - 비밀번호 마스킹 입력
   - 색상 콘솔 출력
   - 진행 상황 표시

3. **통합 관리자** (`src/lib/crypto/UnifiedEnvCryptoManager.ts`)
   - 싱글톤 패턴
   - 메모리 캐싱
   - Vercel 자동 통합

### 암호화 방식

- **알고리즘**: AES-256-GCM (인증된 암호화)
- **키 유도**: PBKDF2 (100,000회 반복)
- **무결성**: GCM 모드로 자동 검증
- **성능**: 메모리 캐싱으로 최적화

---

## 📝 암호화 구현 가이드

### 1. 빠른 시작

#### 마스터 비밀번호 설정
```bash
# 강력한 비밀번호 생성 (32자 이상 권장)
echo "MyS3cur3P@ssw0rd!2024#OpenManager$Vibe" > .env.key

# Git에서 제외 확인
echo ".env.key" >> .gitignore
```

#### 환경변수 암호화
```bash
# 통합 CLI 도구 사용
node scripts/encryption-manager.js --encrypt-google-ai

# 또는 일괄 암호화
node scripts/unified-env-crypto.mjs encrypt --password-file=.env.key
```

#### 암호화 검증
```bash
# 암호화 테스트
node scripts/encryption-manager.js --test-encryption

# 무결성 검증
node scripts/unified-env-crypto.mjs verify --password-file=.env.key
```

### 2. 코드에서 사용하기

#### TypeScript 통합
```typescript
// 기본 암호화/복호화
import { encrypt, decrypt } from '@/utils/encryption';

const encrypted = encrypt('sensitive-data');
const decrypted = decrypt(encrypted);

// Google AI 키 안전 관리
import { getSecureGoogleAIKey } from '@/utils/encryption';
const apiKey = getSecureGoogleAIKey(); // 자동 복호화

// 환경변수 접근 (타입 안전)
import { secureEnv } from '@/lib/environment/encrypted-env-loader';
const apiKey = secureEnv.GOOGLE_AI_API_KEY();
```

#### 상태 확인
```typescript
import { getEncryptionStatus } from '@/utils/encryption';

const status = getEncryptionStatus();
console.log(status.enabled);        // 암호화 활성화 여부
console.log(status.testPassed);     // 테스트 통과 여부
console.log(status.googleAI.hasKey); // Google AI 키 존재 여부
```

### 3. 지원되는 환경변수

자동으로 암호화되는 환경변수 목록:

- `GOOGLE_AI_API_KEY` - Google AI API 키
- `NEXTAUTH_SECRET` - NextAuth 시크릿
- `GITHUB_CLIENT_ID/SECRET` - GitHub OAuth
- `SUPABASE_*` - Supabase 인증 정보
- `UPSTASH_REDIS_*` - Redis 연결 정보
- `ENCRYPTION_KEY` - 암호화 마스터 키

---

## 🔒 Git 보안 설정

### .gitignore 설정

```gitignore
# 환경변수 파일
.env
.env.local
.env.*.local
.env.key

# 백업 파일
*.backup
*.bak

# 테스트용 암호화 파일
*.test.encrypted
```

### Git 히스토리 정리

민감한 정보가 커밋된 경우:

```bash
# BFG Repo-Cleaner 사용
bfg --delete-files .env
bfg --replace-text passwords.txt

# 또는 git filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
```

---

## 🚀 프로덕션 보안 체크리스트

### 배포 전 확인사항

- [ ] 모든 API 키가 암호화되었는가?
- [ ] `.env.local` 파일이 Git에서 제외되는가?
- [ ] 테스트 파일들이 정리되었는가?
- [ ] 로그에 민감한 정보가 출력되지 않는가?
- [ ] 프로덕션 마스터 비밀번호가 설정되었는가?

### Vercel 배포 설정

1. **환경변수 설정**
   ```bash
   # Vercel 대시보드에서 설정
   ENV_MASTER_PASSWORD=프로덕션_마스터_비밀번호
   ```

2. **암호화된 설정 커밋**
   ```bash
   git add config/encrypted-env-config.ts
   git commit -m "🔐 Update encrypted environment variables"
   git push
   ```

3. **자동 로드 확인**
   - Vercel 빌드 로그에서 "Environment variables loaded successfully" 확인
   - 헬스체크 엔드포인트 확인: `/api/health`

### 보안 감사

#### 월간 검토
- [ ] 사용하지 않는 API 키 제거
- [ ] 접근 로그 검토
- [ ] 보안 업데이트 적용

#### 분기별 검토
- [ ] 마스터 비밀번호 변경
- [ ] API 키 로테이션
- [ ] 보안 취약점 스캔

---

## 🛠️ 문제 해결

### 일반적인 문제

#### "환경변수 미설정" 오류
```bash
# 1. 로컬 환경 확인
cat .env.local | grep ENCRYPTION_KEY

# 2. 암호화 상태 확인
node scripts/encryption-manager.js --test-encryption

# 3. Vercel 환경변수 확인
vercel env pull
```

#### 복호화 실패
```bash
# 1. 비밀번호 검증
node scripts/unified-env-crypto.mjs verify --password-file=.env.key

# 2. 파일 무결성 확인
sha256sum config/encrypted-env-config.ts

# 3. 강제 재암호화
node scripts/unified-env-crypto.mjs encrypt --force
```

#### 메모리 누수
```typescript
// 암호화 매니저 초기화 확인
import { enhancedCrypto } from '@/lib/crypto/EnhancedEnvCryptoManager';

// 싱글톤 인스턴스 사용
const instance1 = enhancedCrypto;
const instance2 = enhancedCrypto;
console.log(instance1 === instance2); // true여야 함
```

### 성능 최적화

- **캐싱**: 복호화된 값은 메모리에 캐싱
- **지연 로딩**: 필요한 시점에만 복호화
- **배치 처리**: 여러 환경변수 동시 복호화

### 디버깅 모드

```bash
# 상세 로그 활성화
DEBUG=crypto:* npm run dev

# 암호화 상태 덤프
node scripts/encryption-manager.js --debug
```

---

## 🚨 보안 사고 대응

### 즉시 대응 (0-1시간)

1. **영향 범위 파악**
   - 노출된 키 목록 작성
   - 접근 로그 확인
   - 이상 활동 모니터링

2. **긴급 차단**
   - Google Cloud Console에서 키 비활성화
   - GitHub 토큰 취소
   - Supabase 키 재생성

3. **임시 조치**
   - 프로덕션 배포 중단
   - 영향받은 서비스 격리

### 복구 절차 (1-24시간)

1. **새 키 생성**
   ```bash
   # 새 API 키 생성 후 암호화
   node scripts/encryption-manager.js --encrypt-google-ai
   ```

2. **Git 히스토리 정리**
   ```bash
   # 민감한 정보 제거
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/sensitive/file"
   ```

3. **전체 재배포**
   - 새 마스터 비밀번호 설정
   - 모든 환경변수 재암호화
   - Vercel 환경변수 업데이트

### 사후 분석 (24-72시간)

- 사고 원인 분석
- 보안 정책 개선
- 팀 교육 실시
- 재발 방지 대책 수립

---

## 📚 참고 자료

### 프로젝트 문서
- [아키텍처 개요](./architecture/README.md)
- [API 보안 가이드](./api-security.md)
- [Vercel 배포 가이드](./vercel-deployment-guide.md)

### 외부 자료
- [OWASP 암호화 가이드](https://owasp.org/www-project-cryptographic-storage-cheat-sheet/)
- [Node.js 보안 모범 사례](https://nodejs.org/en/docs/guides/security/)
- [Vercel 보안 문서](https://vercel.com/docs/security)

### 보안 도구
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [GitGuardian](https://www.gitguardian.com/)
- [Snyk](https://snyk.io/)

---

_최종 업데이트: 2025년 7월 11일_
_OpenManager Vibe v5 - 통합 보안 가이드 v2.0_