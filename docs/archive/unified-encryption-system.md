# 🔐 통합 암호화 시스템 가이드

## 개요

OpenManager Vibe v5는 **EnhancedEnvCryptoManager**를 기반으로 하는 통합된 암호화 시스템을 사용합니다.
모든 환경변수와 민감한 데이터는 이 시스템을 통해 안전하게 관리됩니다.

## 🎯 핵심 특징

### 보안 수준

- **알고리즘**: AES-256-GCM (인증된 암호화)
- **키 유도**: PBKDF2 100,000회 반복
- **인증**: Auth Tag를 통한 무결성 검증
- **버전**: 2.0

### 통합 내역

이전에 4개의 서로 다른 암호화 매니저가 있었으나, 하나로 통합되었습니다:

- ~~EnvironmentCryptoManager~~ → **EnhancedEnvCryptoManager**
- ~~UnifiedEnvCryptoManager~~ → **EnhancedEnvCryptoManager**
- ~~UnifiedCryptoManager~~ → **EnhancedEnvCryptoManager**
- ~~CryptoJS 기반 유틸리티~~ → **EnhancedEnvCryptoManager**

## 📍 암호화 매니저 위치

```typescript
import { enhancedCryptoManager } from '@/lib/crypto/EnhancedEnvCryptoManager';
```

## 🔧 사용 방법

### 1. 마스터 키 초기화

```typescript
// 마스터 비밀번호로 초기화
enhancedCryptoManager.initializeMasterKey('your-master-password');
```

### 2. 환경변수 암호화

```typescript
// 단일 변수 암호화
const encrypted = enhancedCryptoManager.encryptVariable(
  'API_KEY',
  'secret-api-key-value'
);

// 전체 환경변수 암호화
const encryptedConfig = enhancedCryptoManager.encryptEnvironment({
  API_KEY: 'secret-value',
  DATABASE_URL: 'postgres://...',
});
```

### 3. 환경변수 복호화

```typescript
// 단일 변수 복호화
const decrypted = enhancedCryptoManager.decryptVariable(encryptedData);

// 전체 환경변수 복호화
const decryptedEnv = enhancedCryptoManager.decryptEnvironment(encryptedConfig);

// Process.env에 로드
enhancedCryptoManager.loadToProcess(encryptedConfig);
```

### 4. 캐싱 관리

```typescript
// 캐시 초기화
enhancedCryptoManager.clearCache();

// 환경변수 접근
const value = enhancedCryptoManager.getSecureEnv('API_KEY');

// 존재 여부 확인
const hasKey = enhancedCryptoManager.hasEnv('API_KEY');
```

## 📁 암호화된 설정 파일

### 설정 파일 위치

```
/config/encrypted-env-config.ts
```

### 설정 파일 구조

```typescript
export const ENCRYPTED_ENV_CONFIG = {
  version: '2.0',
  environment: 'production',
  variables: {
    API_KEY: {
      encrypted: '...',
      salt: '...',
      iv: '...',
      authTag: '...',
      algorithm: 'aes-256-gcm',
      iterations: 100000,
      timestamp: 1234567890,
      version: '2.0',
    },
  },
  checksum: '...',
};
```

## 🔄 마이그레이션 가이드

### 이전 시스템에서 마이그레이션

#### 1. UnifiedEnvCryptoManager 사용 코드

```typescript
// 이전 코드
import { UnifiedEnvCryptoManager } from '@/lib/crypto/UnifiedEnvCryptoManager';
const cryptoManager = UnifiedEnvCryptoManager.getInstance();
await cryptoManager.decrypt(data, password);

// 새 코드
import { enhancedCryptoManager } from '@/lib/crypto/EnhancedEnvCryptoManager';
enhancedCryptoManager.initializeMasterKey(password);
const decrypted = enhancedCryptoManager.decryptVariable(data, password);
```

#### 2. CryptoJS 기반 코드

```typescript
// 이전 코드
import { encrypt, decrypt } from '@/utils/encryption';
const encrypted = encrypt(text);

// 새 코드
import { enhancedCryptoManager } from '@/lib/crypto/EnhancedEnvCryptoManager';
const encrypted = enhancedCryptoManager.encryptVariable('temp', text);
```

## 🛡️ 보안 고려사항

### 마스터 키 관리

- 강력한 마스터 비밀번호 사용 (최소 16자 이상)
- 환경변수로 제공: `ENCRYPTION_KEY` 또는 `TEAM_DECRYPT_PASSWORD`
- 절대 하드코딩하지 말 것

### Git 제외 파일

```gitignore
# 암호화된 토큰 저장소
.secure-tokens.json
.secure-tokens.json.backup*
.secure-tokens-export.sh

# 환경변수 파일
.env*
!.env.example
```

### 권장 사항

1. 프로덕션에서는 항상 환경변수로 마스터 키 제공
2. 정기적인 키 로테이션 (월 1회 권장)
3. 암호화된 설정은 별도 보안 저장소 관리
4. 캐시는 필요시에만 사용 (메모리 누수 주의)

## 🔧 문제 해결

### 복호화 실패

```typescript
try {
  const decrypted = enhancedCryptoManager.decryptVariable(data);
} catch (error) {
  console.error('복호화 실패:', error.message);
  // 마스터 키 확인
  // 데이터 무결성 확인
}
```

### 캐시 문제

```typescript
// 캐시가 오래된 경우
enhancedCryptoManager.clearCache();
```

### 버전 호환성

- v2.0 형식만 지원
- 이전 버전 데이터는 마이그레이션 필요

## 📚 관련 파일

- **암호화 매니저**: `/src/lib/crypto/EnhancedEnvCryptoManager.ts`
- **설정 파일**: `/config/encrypted-env-config.ts`
- **자동 로더**: `/src/lib/environment/encrypted-env-loader.ts`
- **토큰 관리**: `/scripts/manage-secure-tokens.ts`

## 🌟 베스트 프랙티스

1. **싱글톤 패턴 활용**

   ```typescript
   // 항상 싱글톤 인스턴스 사용
   import { enhancedCryptoManager } from '@/lib/crypto/EnhancedEnvCryptoManager';
   ```

2. **에러 핸들링**

   ```typescript
   try {
     // 암호화/복호화 작업
   } catch (error) {
     // 적절한 에러 처리
   }
   ```

3. **환경별 설정**
   ```typescript
   if (process.env.NODE_ENV === 'production') {
     // 프로덕션 전용 보안 설정
   }
   ```

---

이 통합된 암호화 시스템은 보안성과 사용 편의성을 모두 제공하며,
프로젝트 전체에서 일관된 방식으로 민감한 데이터를 관리할 수 있게 해줍니다.
