# 🔐 OpenManager Vibe v5 - 암호화 시스템 가이드

## 📋 개요

OpenManager Vibe v5의 암호화 시스템은 **중복 제거와 재활용성 검토**를 통해 완전히 리팩토링되었습니다. 기존 5개의 중복 스크립트를 3개의 핵심 모듈로 통합하여 **515줄의 코드를 절약**하고 **일관된 사용자 경험**을 제공합니다.

## 🎯 리팩토링 성과

### **Before (중복 시대)**

- `scripts/encrypt-env-vars.js` (163줄) ❌ 삭제됨
- `scripts/encrypt-env-vars.mjs` (159줄) ❌ 존재하지 않음
- `development/security/encrypt-google-ai.js` (357줄) ⚠️ 보존됨 (고유 CLI UX)
- `development/security/quick-encrypt.js` (127줄) ❌ 삭제됨
- `development/security/encrypt-env-google-ai.js` (66줄) ❌ 삭제됨
- `scripts/restore-env.js` (124줄) ⚠️ 보존됨 (레거시 복호화)

### **After (통합 시대)**

- `src/utils/encryption.ts` - 🔐 **핵심 암호화 엔진**
- `src/utils/cli-utils.ts` - 🎨 **CLI UX 유틸리티**
- `scripts/encryption-manager.js` - 🚀 **통합 CLI 도구**
- `scripts/env-management.js` - 📊 **환경변수 관리** (확장됨)

## 🛠️ 핵심 컴포넌트

### 1. 🔐 **핵심 암호화 엔진** (`src/utils/encryption.ts`)

```typescript
// 기본 암호화/복호화
import { encrypt, decrypt } from '@/utils/encryption';

const encrypted = encrypt('sensitive-data');
const decrypted = decrypt(encrypted);

// Google AI 키 안전 관리
import { getSecureGoogleAIKey } from '@/utils/encryption';

const apiKey = getSecureGoogleAIKey(); // 자동 복호화

// 암호화 시스템 상태 확인
import { getEncryptionStatus } from '@/utils/encryption';

const status = getEncryptionStatus();
console.log(status.testPassed); // true/false
```

**주요 기능:**

- CryptoJS AES-256 암호화
- 환경변수 기반 키 관리
- 빌드 타임/런타임 분리
- 자동 Google AI 키 복호화
- 내장 암호화 테스트

### 2. 🎨 **CLI UX 유틸리티** (`src/utils/cli-utils.ts`)

```typescript
// 색상 콘솔 출력
import { successLog, errorLog, warningLog } from '@/utils/cli-utils';

successLog('작업 완료!');
errorLog('오류 발생!');
warningLog('주의 필요!');

// 비밀번호 마스킹 입력
import { hiddenQuestion } from '@/utils/cli-utils';

const password = await hiddenQuestion('비밀번호 입력: ');

// 검증 함수
import { validateAPIKey, validatePassword } from '@/utils/cli-utils';

const isValid = validateAPIKey('AIzaSy...'); // true/false
```

**주요 기능:**

- 비밀번호 마스킹 입력
- 색상 콘솔 출력
- API 키/비밀번호 검증
- 진행 상황 표시
- 결과 요약 출력

### 3. 🚀 **통합 CLI 도구** (`scripts/encryption-manager.js`)

```bash
# 도움말 출력
node scripts/encryption-manager.js --help

# Google AI 키 암호화 (대화형)
node scripts/encryption-manager.js --encrypt-google-ai

# 암호화 테스트
node scripts/encryption-manager.js --test-encryption

# 환경변수 복원
node scripts/encryption-manager.js --restore-env
```

**통합된 기능:**

- ✅ Google AI 키 암호화 (대화형 인터페이스)
- ✅ 암호화/복호화 테스트
- ✅ 환경변수 백업 복원
- ✅ 풍부한 CLI UX
- ✅ 검증 및 오류 처리

## 📊 **환경변수 관리 시스템**

### **Google AI 할당량 보호 설정**

```bash
# 할당량 보호 (encrypt-env-vars.mjs에서 통합)
GOOGLE_AI_ENABLED=true
GOOGLE_AI_QUOTA_PROTECTION=true
GOOGLE_AI_DAILY_LIMIT=1200
GOOGLE_AI_HOURLY_LIMIT=100
GOOGLE_AI_TEST_LIMIT_PER_DAY=5
GOOGLE_AI_HEALTH_CHECK_CACHE_HOURS=24
GOOGLE_AI_CIRCUIT_BREAKER_THRESHOLD=5
FORCE_MOCK_GOOGLE_AI=false
```

### **개발 환경 기본 설정**

```bash
# 개발 환경 최적화 (restore-env.js에서 통합)
DISABLE_GOOGLE_AI_HEALTH_CHECK=true
NEXT_TELEMETRY_DISABLED=1
SKIP_ENV_VALIDATION=true
DEVELOPMENT_MODE=true
LOCAL_DEVELOPMENT=true
```

## 🔄 **통합 전/후 비교**

| 기능                | 기존 구현    | 통합 후         |
| ------------------- | ------------ | --------------- |
| Google AI 키 암호화 | 3개 스크립트 | 1개 CLI 도구    |
| 환경변수 암호화     | 2개 스크립트 | 1개 관리 시스템 |
| 복호화 테스트       | 1개 스크립트 | 내장 기능       |
| CLI UX              | 1개 스크립트 | 재사용 유틸리티 |
| 코드 중복           | 515줄        | 0줄             |

## 🚀 **사용 가이드**

### **1. 개발 환경 설정**

```bash
# 환경변수 템플릿 복사
cp env.local.template .env.local

# 암호화 테스트
node scripts/encryption-manager.js --test-encryption
```

### **2. Google AI 키 설정**

```bash
# 대화형 암호화
node scripts/encryption-manager.js --encrypt-google-ai

# 결과를 .env.local에 추가
echo "GOOGLE_AI_API_KEY_ENCRYPTED=U2FsdGVkX1..." >> .env.local
```

### **3. 환경변수 복원**

```bash
# 백업에서 복원
node scripts/encryption-manager.js --restore-env
```

### **4. 프로덕션 배포**

```bash
# Vercel 환경변수 설정
vercel env add GOOGLE_AI_API_KEY_ENCRYPTED
vercel env add ENCRYPTION_KEY

# 배포
vercel --prod
```

## 🧪 **테스트 및 검증**

### **암호화 시스템 테스트**

```typescript
import { testEncryption } from '@/utils/encryption';

const result = testEncryption('my-test-value');
console.log(result.success); // true/false
console.log(result.error); // 오류 메시지 (실패 시)
```

### **환경변수 상태 확인**

```typescript
import { getEncryptionStatus } from '@/utils/encryption';

const status = getEncryptionStatus();
console.log(status.enabled); // 암호화 활성화 여부
console.log(status.testPassed); // 테스트 통과 여부
console.log(status.googleAI.hasKey); // Google AI 키 존재 여부
```

## 🔒 **보안 고려사항**

### **1. 키 관리**

- 환경변수 `ENCRYPTION_KEY` 사용 권장
- 개발 환경에서는 자동 생성 (경고 표시)
- 프로덕션에서는 필수 설정

### **2. 암호화 방식**

- CryptoJS AES-256 사용
- 모든 스크립트에서 동일한 알고리즘 사용
- 빌드 타임/런타임 분리로 오류 방지

### **3. 레거시 호환성**

- 기존 Node.js crypto 암호화 지원
- 자동 복호화 fallback 제공
- 단계적 마이그레이션 가능

## 📚 **마이그레이션 가이드**

### **기존 스크립트 사용자**

```bash
# 기존 방식 (더 이상 사용 안 함)
node scripts/encrypt-env-vars.js ❌
node development/security/quick-encrypt.js ❌

# 새로운 방식
node scripts/encryption-manager.js --encrypt-google-ai ✅
node scripts/encryption-manager.js --test-encryption ✅
```

### **환경변수 마이그레이션**

```bash
# 기존 암호화된 값이 있다면 자동 복원
node scripts/encryption-manager.js --restore-env

# 새로운 형식으로 재암호화
node scripts/encryption-manager.js --encrypt-google-ai
```

## 🎉 **개선 효과**

### **개발자 경험**

- ✅ 단일 CLI 도구로 모든 암호화 기능 통합
- ✅ 풍부한 색상 인터페이스
- ✅ 실시간 검증 및 오류 메시지
- ✅ 자동 테스트 및 검증

### **코드 품질**

- ✅ 515줄 중복 코드 제거
- ✅ 일관된 암호화 알고리즘
- ✅ TypeScript 타입 안전성
- ✅ 모듈화된 구조

### **운영 효율성**

- ✅ 프로덕션 환경 최적화
- ✅ 자동 폴백 메커니즘
- ✅ 포괄적 오류 처리
- ✅ 레거시 호환성 보장

---

_최종 업데이트: 2025년 7월 3일_
_OpenManager Vibe v5.44.3 - 암호화 시스템 v2.0_
