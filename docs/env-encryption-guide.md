# 환경 변수 암호화 백업 및 복원 가이드

> **최종 업데이트**: 2025년 8월 10일  
> **목적**: GitHub 동기화 시 환경 변수 안전 관리  
> **보안 수준**: 포트폴리오 프로젝트용 (GitHub 자동 감지 방지)

## 📋 개요

이 시스템은 다음과 같은 목적으로 설계되었습니다:
- **다중 환경 지원**: 다른 개발 환경에서 GitHub 동기화 후 환경 변수 쉽게 복원
- **GitHub 보안 정책 준수**: 환경 변수가 GitHub에 노출되지 않도록 방지
- **실용적 접근**: 포트폴리오 프로젝트에 적합한 수준의 보안 제공

## 🔒 암호화 방식

- **알고리즘**: AES-256-CBC
- **암호화 도구**: OpenSSL (Shell) / Node.js crypto 모듈 (JavaScript)
- **보안 수준**: GitHub 자동 감지 방지 수준
- **목적**: 실수로 인한 시크릿 노출 방지

## 📁 파일 구조

```
openmanager-vibe-v5/
├── scripts/
│   ├── secure_env.sh       # Linux/Mac용 암호화/복호화
│   ├── secure_env.bat       # Windows용 암호화/복호화
│   ├── setup-env.js         # Node.js 기반 암호화 설정
│   └── restore-env.js       # Node.js 기반 복원
├── .github/
│   └── workflows/
│       └── backup_env.yml   # GitHub Actions 자동 백업
├── .env.local              # 실제 환경 변수 (Git 제외)
├── .env.encrypted          # 암호화된 환경 변수 (Git 포함 가능)
├── .env.example            # 환경 변수 템플릿
└── .backup/                # 암호화된 백업 파일들
    └── env.backup.*.enc    # 타임스탬프가 포함된 백업
```

## 🚀 사용 방법

### 1. 초기 설정 (새 환경)

#### 방법 1: Node.js 스크립트 사용 (권장)

```bash
# .env.example을 기반으로 암호화된 파일 생성
node scripts/setup-env.js

# 출력 예시:
# ✅ .env.encrypted 파일이 생성되었습니다.
# 🔑 복구 비밀번호: a1b2c3d4e5f6...
# ⚠️ 이 비밀번호를 안전한 곳에 보관하세요!
```

#### 방법 2: Shell 스크립트 사용 (Linux/Mac)

```bash
# 실행 권한 부여
chmod +x scripts/secure_env.sh

# .env.local 파일 암호화
./scripts/secure_env.sh encrypt "your-password" .env.local .env.encrypted
```

#### 방법 3: Batch 스크립트 사용 (Windows)

```cmd
# .env.local 파일 암호화
scripts\secure_env.bat encrypt "your-password" .env.local .env.encrypted
```

### 2. 환경 변수 복원 (새 환경에서)

#### 방법 1: Node.js 스크립트 사용 (대화형)

```bash
# 대화형 복원
node scripts/restore-env.js

# 프롬프트:
# 🔑 복구 비밀번호를 입력하세요: [비밀번호 입력]
# ✅ .env.local 파일이 성공적으로 복구되었습니다.
```

#### 방법 2: Shell 스크립트 사용

```bash
# .env.encrypted 파일 복호화
./scripts/secure_env.sh decrypt "your-password" .env.encrypted .env.local
```

#### 방법 3: Batch 스크립트 사용 (Windows)

```cmd
# .env.encrypted 파일 복호화
scripts\secure_env.bat decrypt "your-password" .env.encrypted .env.local
```

### 3. GitHub Actions 자동 백업

`.github/workflows/backup_env.yml`이 다음과 같은 상황에서 자동 실행됩니다:
- main 브랜치에 푸시할 때
- 매일 자정 (UTC)
- 수동 트리거 (Actions 탭에서)

**필수 설정**: GitHub 저장소 Settings → Secrets → Actions에서 다음 시크릿 추가
- `ENV_BACKUP_PASSWORD`: 백업용 비밀번호

## 🔄 일반적인 워크플로우

### 새 개발 환경 설정

1. **저장소 클론**
```bash
git clone https://github.com/yourusername/openmanager-vibe-v5.git
cd openmanager-vibe-v5
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 복원**
```bash
# .env.encrypted 파일이 있는 경우
node scripts/restore-env.js
# 또는
./scripts/secure_env.sh decrypt "password" .env.encrypted .env.local
```

4. **개발 시작**
```bash
npm run dev
```

### 환경 변수 업데이트 시

1. **.env.local 수정**
```bash
# 에디터로 환경 변수 수정
nano .env.local
```

2. **암호화 파일 업데이트**
```bash
# 새로운 암호화 파일 생성
./scripts/secure_env.sh encrypt "password" .env.local .env.encrypted
```

3. **커밋 및 푸시**
```bash
git add .env.encrypted
git commit -m "🔒 Update encrypted environment variables"
git push
```

## ⚠️ 주의사항

### 보안 관련

1. **비밀번호 관리**
   - 절대 비밀번호를 코드나 커밋 메시지에 포함하지 마세요
   - 팀원과 안전한 채널로 비밀번호 공유 (1Password, LastPass 등)
   - 정기적으로 비밀번호 변경 권장

2. **파일 관리**
   - `.env.local`은 절대 커밋하지 마세요 (`.gitignore`에 포함됨)
   - `.env.encrypted`만 저장소에 포함 가능
   - 백업 파일도 암호화된 상태로만 커밋

3. **GitHub 보안**
   - GitHub Actions 시크릿은 저장소 관리자만 설정 가능
   - 포크된 저장소에서는 시크릿 접근 불가

### 포트폴리오 프로젝트 특성

- **목적**: 실수로 인한 환경 변수 노출 방지
- **대상**: GitHub 자동 감지 시스템 우회
- **한계**: 군사급 보안이 아닌 실용적 수준
- **장점**: 간단하고 팀 협업에 유용

## 🛠️ 문제 해결

### OpenSSL이 설치되지 않은 경우

**Linux/Mac:**
```bash
# Ubuntu/Debian
sudo apt-get install openssl

# macOS
brew install openssl
```

**Windows:**
- Git Bash 사용 (OpenSSL 포함)
- 또는 [OpenSSL 다운로드](https://slproweb.com/products/Win32OpenSSL.html)

### 복호화 실패

1. **비밀번호 확인**
   - 대소문자 구분
   - 특수문자 정확히 입력

2. **파일 손상 확인**
   - Git LF/CRLF 변환 문제일 수 있음
   - Binary 모드로 다시 클론

3. **OpenSSL 버전 호환성**
   - 암호화와 복호화 시 같은 OpenSSL 버전 사용 권장

### Node.js crypto 에러

```bash
# Node.js 버전 확인 (v14+ 필요)
node --version

# 최신 버전으로 업데이트
nvm install --lts
nvm use --lts
```

## 📊 파일별 역할 요약

| 파일 | 용도 | Git 포함 | 비고 |
|------|------|---------|------|
| `.env.local` | 실제 환경 변수 | ❌ | 절대 커밋 금지 |
| `.env.encrypted` | 암호화된 환경 변수 | ✅ | 안전하게 공유 가능 |
| `.env.example` | 환경 변수 템플릿 | ✅ | 구조만 포함 |
| `.backup/*.enc` | 타임스탬프 백업 | ✅ | GitHub Actions 자동 생성 |
| `scripts/secure_env.*` | 암호화/복호화 도구 | ✅ | 플랫폼별 스크립트 |

## 💡 베스트 프랙티스

1. **팀 협업 시**
   - 마스터 비밀번호는 팀 리더가 관리
   - 새 팀원 합류 시 안전한 방법으로 비밀번호 전달
   - 팀원 이탈 시 비밀번호 변경 및 재암호화

2. **CI/CD 환경**
   - GitHub Secrets 활용
   - 프로덕션과 개발 환경 분리
   - 환경별 다른 암호화 키 사용

3. **백업 전략**
   - 정기적인 자동 백업 (GitHub Actions)
   - 로컬 백업도 별도 유지
   - 백업 파일 정기적 정리 (30일 이상된 파일)

## 🔗 관련 문서

- [환경 변수 설정 가이드](./setup/ENV-SETUP-QUICKSTART.md)
- [보안 관리 가이드](./security-management-guide.md)
- [GitHub Actions 가이드](./.github/workflows/README.md)

---

💡 **팁**: 이 시스템은 포트폴리오 프로젝트를 위한 실용적인 솔루션입니다. 
프로덕션 환경에서는 AWS Secrets Manager, HashiCorp Vault 등 전문 도구 사용을 권장합니다.