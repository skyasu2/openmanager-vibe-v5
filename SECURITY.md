# 🔐 보안 가이드라인

## API 키 보안 관리

### ✅ 현재 보안 상태

- **Google AI API 키**: 완전히 암호화됨 (`GOOGLE_AI_API_KEY_ENCRYPTED`)
- **환경변수 파일**: `.env.local`, `.env*` 모두 Git에서 제외
- **하드코딩 방지**: 모든 실제 API 키가 코드에서 제거됨
- **암호화 시스템**: AES 암호화를 통한 안전한 키 관리

### 🚨 보안 규칙

#### 1. **절대 금지 사항**

- API 키를 코드에 직접 하드코딩 ❌
- `.env` 파일을 Git에 커밋 ❌
- 개발자 도구 콘솔에 API 키 노출 ❌
- 로그 파일에 API 키 출력 ❌

#### 2. **안전한 사용법**

- 환경변수 또는 암호화된 형태로만 저장 ✅
- `process.env.GOOGLE_AI_API_KEY_ENCRYPTED` 사용 ✅
- `getSecureGoogleAIKey()` 함수를 통한 복호화 ✅
- 개발/프로덕션 환경 분리 ✅

### 🔧 API 키 설정 방법

#### 로컬 개발 환경

```bash
# .env.local 파일에 추가 (Git에서 자동 제외)
GOOGLE_AI_API_KEY_ENCRYPTED=YOUR_ENCRYPTED_KEY_HERE
ENCRYPTION_KEY=YOUR_ENCRYPTION_KEY_HERE
```

#### Vercel 배포 환경

```bash
# Vercel 환경변수에 설정
vercel env add GOOGLE_AI_API_KEY_ENCRYPTED
vercel env add ENCRYPTION_KEY
```

### 🛡️ 암호화 프로세스

1. **암호화 스크립트 사용**:

   ```bash
   node development/security/encrypt-env-google-ai.js
   ```

2. **복호화는 자동**:

   ```typescript
   import { getSecureGoogleAIKey } from '@/utils/encryption';
   const apiKey = getSecureGoogleAIKey();
   ```

### 📝 체크리스트

배포 전 반드시 확인:

- [ ] 실제 API 키가 코드에 하드코딩되지 않았는가?
- [ ] `.env.local` 파일이 Git에서 제외되는가?
- [ ] 암호화된 키만 사용하고 있는가?
- [ ] 로그에 민감한 정보가 출력되지 않는가?
- [ ] 테스트 파일들이 정리되었는가?

### 🚨 사고 대응 절차

API 키가 노출된 경우:

1. **즉시 Google Cloud Console에서 키 비활성화**
2. **새로운 API 키 생성**
3. **암호화 후 환경변수 업데이트**
4. **Git 히스토리에서 민감한 정보 제거**
5. **모든 배포 환경 재설정**

### 📚 관련 파일

- `src/utils/encryption.ts` - 암호화/복호화 유틸리티
- `src/lib/google-ai-manager.ts` - Google AI 키 관리
- `development/security/` - 개발용 암호화 스크립트
- `.gitignore` - 환경변수 파일 제외 설정

---

**⚠️ 주의**: 해킹이 아니더라도 API 키 노출은 예상치 못한 요금 청구나 서비스 악용을 초래할 수 있습니다. 항상 보안을 최우선으로 관리하세요.
