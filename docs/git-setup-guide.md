# Git 설정 가이드

**작성일**: 2025-07-31  
**목적**: 원활한 Git 커밋/푸시를 위한 설정 가이드

## 🚨 일반적인 문제와 해결법

### 1. lint-staged 오류
```
✖ No valid configuration found.
```

**해결**: `.lintstagedrc.json` 파일이 생성되었습니다.

### 2. GitHub 푸시 인증 실패
```
fatal: could not read Username for 'https://github.com': No such device or address
```

**해결**: 아래 Git 인증 설정 방법 중 하나를 선택하세요.

### 3. 테스트 실패로 푸시 차단
```
❌ 단위 테스트 실패!
```

**해결**: 다음 옵션 중 선택:
- `SKIP_TESTS=1 git push` - 테스트만 건너뛰기
- `HUSKY=0 git push` - 모든 검증 건너뛰기

## 🔧 Git 인증 설정

### 빠른 설정 (스크립트 사용)
```bash
# Git credential 설정 스크립트 실행
bash scripts/core/setup-git-credential.sh
```

### 수동 설정 방법

#### 방법 1: Personal Access Token (권장)
1. GitHub에서 토큰 생성: https://github.com/settings/tokens
2. 다음 명령 실행:
```bash
git config --global credential.helper store
git push origin main
# Username: your-github-username
# Password: your-personal-access-token
```

#### 방법 2: SSH 키 설정
```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "your.email@example.com"

# 공개 키 복사
cat ~/.ssh/id_ed25519.pub

# GitHub에 키 추가: https://github.com/settings/keys

# Remote URL 변경
git remote set-url origin git@github.com:skyasu2/openmanager-vibe-v5.git
```

#### 방법 3: Git Credential Manager
```bash
# Windows/Mac
git config --global credential.helper manager-core

# Linux
git config --global credential.helper libsecret
```

## 🚀 Husky 훅 사용법

### Pre-commit 훅
- **자동 실행**: `git commit` 시
- **검사 항목**:
  - lint-staged (코드 포맷팅)
  - 하드코딩된 시크릿 검사
- **건너뛰기**: `HUSKY=0 git commit`

### Pre-push 훅
- **자동 실행**: `git push` 시
- **검사 항목**:
  - TypeScript 타입 체크
  - 단위 테스트
  - 하드코딩된 시크릿 검사
- **옵션**:
  - `SKIP_TESTS=1 git push` - 테스트만 건너뛰기
  - `HUSKY=0 git push` - 모든 검증 건너뛰기
  - 대화형 모드에서 'y' 입력으로 계속 진행

## 📋 체크리스트

### 최초 설정 시
- [ ] Git 사용자 정보 설정
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  ```
- [ ] Git 인증 방법 선택 및 설정
- [ ] `.lintstagedrc.json` 파일 존재 확인
- [ ] Husky 설치 확인 (`npm install`)

### 커밋 전
- [ ] 하드코딩된 시크릿 없음
- [ ] 코드 포맷팅 완료
- [ ] TypeScript 에러 없음

### 푸시 전
- [ ] 모든 테스트 통과 (또는 SKIP_TESTS=1 사용)
- [ ] 빌드 성공
- [ ] GitHub 인증 설정 완료

## 🔍 문제 해결

### 문제: Husky 훅이 실행되지 않음
```bash
# Husky 재설치
npx husky install
```

### 문제: 권한 거부 오류
```bash
# 실행 권한 부여
chmod +x .husky/*
chmod +x scripts/security/*.sh
chmod +x scripts/core/*.sh
```

### 문제: 토큰 권한 부족
GitHub Personal Access Token에 다음 권한이 있는지 확인:
- `repo` (전체 저장소 접근)
- `workflow` (GitHub Actions 사용 시)

## 💡 유용한 명령어

```bash
# 현재 Git 설정 확인
git config --list

# Credential 캐시 삭제
git config --global --unset credential.helper
rm ~/.git-credentials

# Remote URL 확인
git remote -v

# 최근 커밋 확인
git log --oneline -5

# 변경사항 확인
git status
git diff
```

## 📚 참고 자료

- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Git Credential Storage](https://git-scm.com/book/en/v2/Git-Tools-Credential-Storage)
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)