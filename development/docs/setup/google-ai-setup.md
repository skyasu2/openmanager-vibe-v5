# 🔐 Google AI API 키 전용 보안 시스템

## 🎯 시스템 개요

OpenManager Vibe v5에 구현된 Google AI API 키 전용 보안 시스템입니다.

- ✅ **AES 암호화**: PBKDF2 키 생성 + CBC 모드
- ✅ **Git 안전**: 암호화된 키만 저장, 평문 노출 없음
- ✅ **팀 협업**: 비밀번호 공유로 간편한 팀 사용
- ✅ **개인 우선**: 환경변수 설정 시 비밀번호 불필요
- ✅ **자동 통합**: 기존 Google AI 코드와 완전 호환

## 📋 사용 우선순위

1. **개인 환경변수** (GOOGLE_AI_API_KEY) - 권장 ⭐
2. **팀 설정** (관리자에게 비밀번호 문의)
3. **오류** (키 없음)

---

## 🚀 빠른 시작 (개인 사용)

### 1. 환경변수 파일 생성

```bash
# 프로젝트 루트에 .env.local 파일 생성
echo "GOOGLE_AI_API_KEY=your_api_key_here" > .env.local
```

### 2. 서버 시작

```bash
npm run dev
```

### 3. 확인

- Google AI 기능이 바로 사용 가능
- 비밀번호 입력 불필요

---

## 🏢 팀 사용

### 팀원 사용법

#### 1. 최신 코드 가져오기

```bash
git pull
npm install
npm run dev
```

#### 2. 웹에서 Google AI 사용

1. Google AI 기능 접근 시 모달 표시
2. **관리자에게 팀 비밀번호 문의** 🔒
3. 세션 동안 Google AI 사용 가능

#### 3. 상태 확인

- 웹 UI에서 Google AI 상태 표시
- 🟢 환경변수 사용 중
- 🔵 팀 설정 사용 중
- 🔴 사용 불가

---

## 🔧 관리자 기능

### 새로운 API 키 암호화

```bash
# 1. 암호화 스크립트 실행
node scripts/encrypt-google-ai.js

# 2. API 키와 비밀번호 입력
# 3. 생성된 설정을 Git에 커밋
git add src/config/google-ai-config.ts
git commit -m "Google AI 키 업데이트"
```

### 비밀번호 변경

```bash
# 새로운 비밀번호로 재암호화
node scripts/encrypt-google-ai.js
# 팀원들에게 새 비밀번호 공유
```

---

## 📁 파일 구조

```
├── src/
│   ├── config/
│   │   └── google-ai-config.ts          # 암호화된 API 키 저장
│   ├── lib/
│   │   └── google-ai-manager.ts          # API 키 관리자
│   ├── components/
│   │   └── GoogleAIUnlock.tsx            # 비밀번호 입력 모달
│   └── app/api/google-ai/
│       └── unlock/route.ts               # 잠금 해제 API
├── scripts/
│   ├── encrypt-google-ai.js              # 암호화 도구
│   └── quick-encrypt.js                  # 개발용 (⚠️ 사용 금지)
└── google-ai-setup.md                    # 이 가이드
```

---

## 🛡️ 보안 특징

### 암호화 방식

- **알고리즘**: AES-256-CBC
- **키 생성**: PBKDF2 (10,000 iterations)
- **솔트**: 128-bit 랜덤
- **IV**: 128-bit 랜덤

### 보안 정책

- ✅ 평문 API 키 Git 저장 금지
- ✅ **비밀번호 코드 노출 금지** 🔒
- ✅ 프론트엔드에서 기존 키 값 숨김
- ✅ 메모리 임시 저장 (세션 기반)
- ✅ 실시간 키 가용성 확인

---

## 🔄 API 사용법

### 기존 코드와 호환

```typescript
// 기존 Google AI 호출 (변경 없음)
const googleAI = new GoogleAIService();
const response = await googleAI.generateContent('질문');

// 자동으로 다음 순서로 키 확인:
// 1. 환경변수 GOOGLE_AI_API_KEY
// 2. 팀 설정 (비밀번호로 잠금 해제된 경우)
// 3. 에러 (키 없음)
```

### 상태 확인

```typescript
import { getGoogleAIStatus } from '@/lib/google-ai-manager';

const status = getGoogleAIStatus();
console.log(status);
// {
//   source: 'env' | 'team' | 'none',
//   isAvailable: boolean,
//   needsUnlock: boolean
// }
```

---

## ❓ 문제 해결

### Q: 비밀번호를 잊었어요

**A**: 관리자에게 문의하거나 `scripts/encrypt-google-ai.js`를 재실행하세요.

### Q: 환경변수가 인식되지 않아요

**A**:

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일 이름이 정확한지 확인 (`.env.local`)
3. Next.js 서버 완전 재시작

### Q: 팀 설정이 작동하지 않아요

**A**:

1. `git pull`로 최신 코드 확인
2. 관리자에게 올바른 비밀번호 문의
3. 브라우저 새로고침

### Q: Google AI API 키가 작동하지 않아요

**A**:

1. [Google AI Studio](https://aistudio.google.com/)에서 키 상태 확인
2. 키가 `AIza`로 시작하는지 확인
3. API 할당량 확인

---

## 🔒 보안 수칙

### 관리자

- ❌ 비밀번호를 코드/문서에 하드코딩 금지
- ❌ 공개 채널에서 비밀번호 공유 금지
- ✅ 정기적인 비밀번호 변경 권장
- ✅ 팀원에게 안전한 방법으로 전달

### 팀원

- ❌ 비밀번호를 코드에 저장 금지
- ❌ 스크린샷/메모에 비밀번호 포함 금지
- ✅ 개인 환경변수 사용 권장
- ✅ 의심스러운 접근 시 관리자 알림

---

## 🎉 완료

이제 Google AI API 키가 안전하게 보호되면서도 팀원들이 쉽게 사용할 수 있습니다.

### 현재 설정

- **API 키**: 암호화되어 Git에 저장됨 ✅
- **팀 비밀번호**: 관리자가 별도 관리 🔒
- **개인 환경변수**: 우선 사용 ⭐
- **자동 통합**: 기존 코드와 호환 🔄

### 다음 단계

1. 관리자가 팀원들에게 안전하게 비밀번호 공유
2. 개인 환경변수 설정 권장
3. 정기적인 API 키 로테이션 고려
