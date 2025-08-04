# 통합 환경변수 관리 도구 가이드

## 🔐 개요

`env-manager.cjs`는 OpenManager VIBE v5의 환경변수를 안전하게 관리하기 위한 통합 개발 도구입니다. 기존에 분산되어 있던 여러 암호화/백업 도구들의 기능을 하나로 통합하여 중복을 제거하고 사용성을 개선했습니다.

## 🚀 주요 기능

1. **환경변수 백업** - 민감한 정보는 자동 암호화하여 GitHub에 안전하게 커밋 가능
2. **환경변수 복원** - 백업에서 환경변수를 복원하여 다른 개발 환경에서도 쉽게 설정
3. **개별 암호화** - 특정 환경변수를 암호화하여 안전하게 저장
4. **상태 확인** - 현재 환경변수 설정 상태와 누락된 필수 변수 확인

## 📋 사용법

### 기본 명령어

```bash
# 환경변수 백업
npm run env:backup

# 환경변수 복원
npm run env:restore

# 복원 미리보기 (dry-run)
npm run env:restore -- --dry-run

# 특정 환경변수 암호화
npm run env:encrypt -- GOOGLE_AI_API_KEY

# 환경변수 상태 확인
npm run env:status

# 도움말
npm run env:manage -- help
```

### 직접 실행

```bash
# 스크립트 직접 실행
node scripts/env-manager.cjs <command> [options]

# 예시
node scripts/env-manager.cjs backup
node scripts/env-manager.cjs restore --file config/env-backup.json
node scripts/env-manager.cjs encrypt GITHUB_TOKEN
```

## 🔒 암호화되는 환경변수

다음 환경변수들은 백업 시 자동으로 암호화됩니다:

- `GITHUB_TOKEN`
- `GITHUB_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `SUPABASE_DB_PASSWORD`
- `GOOGLE_AI_API_KEY`
- `UPSTASH_MEMORY_CACHE_REST_TOKEN`
- `KV_REST_API_TOKEN`
- `ENCRYPTION_KEY`

## 📁 백업 파일 위치

- **백업 디렉토리**: `config/env-backups/`
- **최신 백업 링크**: `config/env-backup-latest.json`
- **기본 백업**: `config/env-backup.json`

## 🎯 사용 시나리오

### 1. 새로운 개발 환경 설정

```bash
# 1. 저장소 클론
git clone https://github.com/skyasu2/openmanager-vibe-v5.git

# 2. 의존성 설치
npm install

# 3. 환경변수 복원
npm run env:restore

# 4. 상태 확인
npm run env:status
```

### 2. 환경변수 백업 및 공유

```bash
# 1. 현재 환경변수 백업
npm run env:backup

# 2. Git에 커밋 (민감한 정보는 암호화됨)
git add config/env-backup-latest.json
git commit -m "📦 update: 환경변수 백업 업데이트"
```

### 3. 새로운 API 키 추가

```bash
# 1. 환경변수 암호화
npm run env:encrypt -- NEW_API_KEY

# 2. .env.local에 추가
echo "NEW_API_KEY_ENCRYPTED=<암호화된_값>" >> .env.local

# 3. 백업 생성
npm run env:backup
```

## 🔧 기존 도구와의 관계

이 통합 도구는 다음 기존 스크립트들의 기능을 통합했습니다:

- `env-backup-manager.cjs` - 백업/복원 기능
- `encryption-manager.js` - 암호화/복호화 기능
- `encrypt-github-token.cjs` - GitHub 토큰 암호화
- `encrypt-tavily-key.cjs` - API 키 암호화

기존 스크립트들은 호환성을 위해 유지되지만, 새로운 작업에는 통합 도구 사용을 권장합니다.

## ⚠️ 주의사항

1. **암호화 키**: `ENCRYPTION_KEY` 환경변수가 설정되어 있어야 합니다.
2. **백업 보안**: 백업 파일에는 암호화된 민감한 정보가 포함되어 있으므로 관리에 주의하세요.
3. **복원 시**: 기존 `.env.local` 파일은 자동으로 백업됩니다.

## 🐛 문제 해결

### 복호화 실패

```bash
# 암호화 키 확인
echo $ENCRYPTION_KEY

# 기본 키로 재시도
ENCRYPTION_KEY="openmanager-vibe-v5-2025-production-key" npm run env:restore
```

### 필수 환경변수 누락

```bash
# 상태 확인
npm run env:status

# 누락된 변수 직접 추가
echo "MISSING_VAR=value" >> .env.local
```

## 🔄 마이그레이션 가이드

기존 백업 파일이 있는 경우:

```bash
# 1. 기존 백업 확인
ls config/env-backup*.json

# 2. 특정 백업 파일로 복원
npm run env:restore -- --file config/env-backup.json

# 3. 새 형식으로 백업
npm run env:backup
```

## 📝 추가 개발

새로운 민감한 환경변수 추가 시:

1. `scripts/env-manager.cjs`의 `SENSITIVE_VARS` 배열에 추가
2. 백업 생성
3. 문서 업데이트

```javascript
// scripts/env-manager.cjs
const SENSITIVE_VARS = [
  // ... 기존 변수들
  'NEW_SENSITIVE_VAR', // 새로 추가
];
```
