# 🔐 OpenManager Vibe v5 - 환경변수 암호화 시스템

## 📋 개요

OpenManager Vibe v5는 민감한 환경변수들을 AES 암호화하여 안전하게 저장하고 관리하는 시스템을 제공합니다. 이 시스템을 통해 데이터베이스 연결 정보, API 키, 토큰 등을 Git에 안전하게 커밋할 수 있습니다.

## 🔑 암호화된 환경변수 목록

현재 암호화되어 저장된 환경변수들:

### 📊 Supabase (데이터베이스)

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키 (공개)
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 롤 키 (비공개)

### 🔴 Redis (캐시)

- `UPSTASH_REDIS_REST_URL`: Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis 인증 토큰

### 📡 MCP 서버

- `GCP_MCP_SERVER_URL`: GCP VM 배포 MCP 서버 URL (<http://104.154.205.25:10000>)

## 🚀 사용법

### 1. 전체 환경변수 복호화

```bash
# 모든 환경변수를 복호화하여 .env.decrypted 파일 생성
node scripts/decrypt-env-vars.mjs openmanager2025
```

### 2. 특정 환경변수 복호화

```bash
# 특정 환경변수만 복호화하여 출력
node scripts/decrypt-env-vars.mjs openmanager2025 UPSTASH_REDIS_REST_TOKEN
node scripts/decrypt-env-vars.mjs openmanager2025 NEXT_PUBLIC_SUPABASE_URL
```

### 3. 새로운 환경변수 암호화

```bash
# 환경변수 값을 수정한 후 재암호화
node scripts/encrypt-env-vars.mjs
```

## 🔧 개발 환경 설정

### 방법 1: 복호화된 환경변수 사용

```bash
# 1. 환경변수 복호화
node scripts/decrypt-env-vars.mjs openmanager2025

# 2. .env.decrypted를 .env.local로 복사
cp .env.decrypted .env.local

# 3. 개발 서버 시작
npm run dev

# 4. 보안을 위해 복호화 파일 삭제
rm .env.decrypted
```

### 방법 2: 직접 환경변수 설정

```bash
# 특정 변수만 복호화하여 환경변수로 설정
export UPSTASH_REDIS_REST_TOKEN=$(node scripts/decrypt-env-vars.mjs openmanager2025 UPSTASH_REDIS_REST_TOKEN | cut -d'=' -f2)
```

## 🛡️ 보안 가이드라인

### ✅ 안전한 사용법

- 팀 비밀번호는 안전한 곳에 보관
- 복호화된 파일(`.env.decrypted`)은 사용 후 즉시 삭제
- 암호화된 설정 파일(`encrypted-env-config.mjs`)은 Git에 커밋 가능

### ❌ 금지사항

- 복호화된 환경변수를 Git에 커밋하지 말 것
- 팀 비밀번호를 코드에 하드코딩하지 말 것
- 복호화된 파일을 장기간 보관하지 말 것

## 🔄 환경변수 순환 일정

- **Quarterly (분기별)**: Redis 토큰
- **Manual (수동)**: 기타 모든 환경변수

## 📂 파일 구조

```
config/
├── encrypted-env-config.mjs    # 암호화된 환경변수 설정
└── README.md                   # 이 파일

scripts/
├── encrypt-env-vars.mjs        # 환경변수 암호화 스크립트
└── decrypt-env-vars.mjs        # 환경변수 복호화 스크립트
```

## 🆘 문제 해결

### 비밀번호 오류

```bash
❌ 복호화 실패: 팀 비밀번호가 올바르지 않습니다.
```

**해결**: 올바른 팀 비밀번호를 사용하세요.

### 환경변수 없음

```bash
❌ 환경변수 VARIABLE_NAME을 찾을 수 없습니다.
```

**해결**: 사용 가능한 환경변수 목록을 확인하세요.

### 복호화 실패

```bash
❌ 복호화 실패: 복호화 결과가 비어있습니다.
```

**해결**: 암호화된 데이터가 손상되었을 수 있습니다. 관리자에게 문의하세요.

## 📞 지원

문제가 발생하거나 새로운 환경변수를 추가해야 하는 경우 개발팀에 문의하세요.

---

**⚠️ 중요**: 이 시스템은 개발 편의성과 보안을 위해 설계되었습니다. 프로덕션 환경에서는 각 플랫폼의 환경변수 관리 시스템을 사용하세요.
