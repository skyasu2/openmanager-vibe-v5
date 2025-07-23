# 🔄 환경변수 백업/복원 가이드

## 📋 개요

이 시스템은 개발 환경에서 환경변수를 안전하게 백업하고, 다른 컴퓨터나 환경에서 쉽게 복원할 수 있도록 설계된 개발 도구입니다.

### 🎯 주요 목적

- **환경변수 손실 방지**: 실수로 삭제되거나 손실된 환경변수 복구
- **팀 협업**: 팀원 간 개발 환경 공유
- **멀티 디바이스**: 여러 컴퓨터에서 동일한 개발 환경 구성
- **안전한 백업**: 민감한 정보는 암호화하여 GitHub에 안전하게 저장

## 🚀 사용법

### 1. 환경변수 백업

현재 `.env.local`의 모든 환경변수를 백업:

```bash
node scripts/env-backup-manager.cjs backup
```

#### 백업 프로세스:

1. `.env.local` 파일 읽기
2. 민감한 변수는 자동 암호화
3. 일반 변수는 평문 저장
4. `config/env-backup.json`에 저장

### 2. 환경변수 복원

백업 파일에서 환경변수 복원:

```bash
node scripts/env-backup-manager.cjs restore
```

#### 복원 프로세스:

1. `config/env-backup.json` 읽기
2. 암호화된 변수 자동 복호화
3. `.env.local` 파일 생성/덮어쓰기

## 🔐 암호화 대상 변수

다음 환경변수들은 자동으로 암호화됩니다:

- `GITHUB_TOKEN`
- `GITHUB_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `GOOGLE_AI_API_KEY`
- `UPSTASH_REDIS_REST_TOKEN`
- `KV_REST_API_TOKEN`

## 📁 파일 구조

```
config/
├── env-backup.json          # 백업된 환경변수 (GitHub 업로드 가능)
├── supabase-encrypted.json  # Supabase 관련 암호화된 설정
└── encrypted-env-config.ts  # 암호화 설정 관리
```

## 💡 활용 시나리오

### 시나리오 1: 새 팀원 온보딩

```bash
# 1. 저장소 클론
git clone https://github.com/skyasu2/openmanager-vibe-v5.git

# 2. 의존성 설치
npm install

# 3. 환경변수 복원
node scripts/env-backup-manager.cjs restore

# 4. 개발 서버 시작
npm run dev
```

### 시나리오 2: 환경변수 업데이트

```bash
# 1. .env.local 수정
# 2. 백업 생성
node scripts/env-backup-manager.cjs backup

# 3. 변경사항 커밋
git add config/env-backup.json
git commit -m "🔧 chore: 환경변수 업데이트"
git push
```

### 시나리오 3: 다른 컴퓨터에서 작업

```bash
# 1. 최신 코드 pull
git pull

# 2. 환경변수 복원
node scripts/env-backup-manager.cjs restore

# 3. 작업 시작
npm run dev
```

## ⚠️ 주의사항

1. **암호화 키**: 현재 단순한 키(`openmanager-backup-2025`)를 사용하므로 매우 민감한 정보는 별도 관리 권장
2. **평문 토큰 사용**: 개발 편의를 위해 `.env.local`에 평문으로 저장되므로 `.env.local`은 절대 커밋하지 말 것
3. **백업 파일**: `config/env-backup.json`은 민감한 정보를 암호화하여 저장하므로 GitHub에 업로드 가능
4. **Git 추적 제외**: `.gitignore`에 다음 파일들이 포함되어 있는지 확인 필요:
   - `.env.local`
   - `.env`
   - `config/env-backup.json`

## 🔑 현재 정책 (2025.07)

**개발 환경 우선 설정**:

- 평문 토큰 사용을 기본으로 함 (암호화 시스템 비활성화)
- 개발자가 직접 `.env.local`에 토큰 입력
- 백업 시스템은 민감한 변수만 선택적으로 암호화
- 프로덕션 환경에서는 환경변수로 관리 권장

## 🛠️ 추가 도구

### GitHub 토큰 암호화 (개별)

```bash
node scripts/encrypt-github-token.cjs
```

### 보안 테스트

```bash
node scripts/final-security-test.cjs
```

## 📝 FAQ

**Q: 암호화 키는 어디에 있나요?**
A: `scripts/env-backup-manager.cjs`의 `BACKUP_KEY` 상수에 하드코딩되어 있습니다.

**Q: 새로운 민감한 변수를 추가하려면?**
A: `scripts/env-backup-manager.cjs`의 `SENSITIVE_VARS` 배열에 추가하세요.

**Q: 백업 파일을 실수로 삭제했어요!**
A: Git 히스토리에서 복원하거나, 팀원에게 최신 백업 요청하세요.

## 🔍 관련 문서

- [환경변수 설정 가이드](../setup/ENV-SETUP-QUICKSTART.md)
- [보안 가이드](../security-complete-guide.md)
- [GitHub MCP 토큰 설정](../setup/github-mcp-token-setup.md)
