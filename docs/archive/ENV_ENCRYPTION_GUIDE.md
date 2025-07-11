# 환경변수 암호화 시스템 가이드

## 개요

OpenManager Vibe v5는 민감한 환경변수를 안전하게 관리하기 위한 통합 암호화 시스템을 제공합니다.

## 주요 특징

- **AES-256-GCM 암호화**: 인증된 암호화로 무결성 보장
- **PBKDF2 키 파생**: 100,000회 반복으로 브루트포스 공격 방어
- **자동 복호화**: Vercel 배포 시 자동으로 환경변수 복호화
- **Git 안전**: 암호화된 설정 파일은 Git에 커밋 가능

## 시스템 구성 요소

### 1. EnhancedEnvCryptoManager

- 위치: `/src/lib/crypto/EnhancedEnvCryptoManager.ts`
- 역할: 런타임 암호화/복호화 및 자동 초기화
- 특징:
  - 싱글톤 패턴
  - 메모리 캐싱
  - Vercel 자동 통합

### 2. 암호화 스크립트

- 위치: `/scripts/unified-encrypt-env.mjs`
- 사용법:

  ```bash
  # 비밀번호 직접 입력
  node scripts/unified-encrypt-env.mjs --password=your-master-password

  # 파일에서 비밀번호 읽기
  node scripts/unified-encrypt-env.mjs --password-file=.env.key
  ```

### 3. 암호화된 설정 파일

- 위치: `/config/encrypted-env-config.ts`
- 내용: 암호화된 환경변수 저장
- Git 커밋 가능

## 사용 방법

### 1. 로컬 개발 환경 설정

1. `.env.local` 파일에 환경변수 설정
2. 마스터 비밀번호 생성 (`.env.key` 파일)
3. 환경변수 암호화:
   ```bash
   npm run encrypt-env
   ```

### 2. Vercel 배포 설정

1. Vercel 대시보드에서 환경변수 추가:

   ```
   ENV_MASTER_PASSWORD = <your-master-password>
   ```

2. 암호화된 설정 파일 커밋:

   ```bash
   git add config/encrypted-env-config.ts
   git commit -m "Update encrypted environment variables"
   ```

3. 배포 시 자동으로 복호화됨

### 3. 애플리케이션에서 사용

```typescript
import { enhancedCrypto } from '@/lib/crypto/EnhancedEnvCryptoManager';

// 초기화 (app 시작 시)
await enhancedCrypto.initializeForVercel();

// 환경변수 사용
const apiKey = enhancedCrypto.getEnvVar('GOOGLE_AI_API_KEY');
```

## 보안 고려사항

### 마스터 비밀번호 관리

1. **강력한 비밀번호 사용**: 최소 32자 이상
2. **정기적인 변경**: 분기별 1회 이상
3. **접근 제한**: 필요한 팀원만 접근

### 환경변수 분류

- **Public 변수**: `NEXT_PUBLIC_` 접두사
- **Private 변수**: 서버 사이드에서만 사용
- **Critical 변수**: API 키, 토큰 등

### 로테이션 정책

- **API 키**: 월 1회
- **토큰**: 분기 1회
- **비밀번호**: 분기 1회

## 문제 해결

### 복호화 실패

1. 마스터 비밀번호 확인
2. 암호화된 설정 파일 버전 확인
3. 환경변수 설정 확인

### 성능 최적화

- 복호화된 값은 메모리에 캐싱됨
- 초기화는 앱 시작 시 1회만 수행
- 민감한 데이터는 주기적으로 정리

## 마이그레이션 가이드

### 기존 시스템에서 마이그레이션

1. 기존 환경변수 백업
2. 새 암호화 스크립트 실행
3. 애플리케이션 코드 업데이트
4. 테스트 및 검증

### 버전 업그레이드

- 버전 호환성 확인
- 점진적 마이그레이션 지원
- 롤백 계획 수립

## 모범 사례

1. **개발/프로덕션 분리**: 환경별 다른 마스터 비밀번호 사용
2. **감사 로깅**: 환경변수 접근 로깅
3. **최소 권한 원칙**: 필요한 환경변수만 노출
4. **정기 검토**: 사용하지 않는 환경변수 제거

## 참고 자료

- [OWASP 암호화 가이드](https://owasp.org/www-project-cryptographic-storage-cheat-sheet/)
- [Node.js Crypto 문서](https://nodejs.org/api/crypto.html)
- [Vercel 환경변수 문서](https://vercel.com/docs/environment-variables)
