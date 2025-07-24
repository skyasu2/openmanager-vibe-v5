# 🔐 GitHub 연결 가이드

## 📋 목차

1. [현재 연결 상태](#현재-연결-상태)
2. [Git 인증 방법](#git-인증-방법)
3. [문제 해결](#문제-해결)
4. [GitHub MCP 서버](#github-mcp-서버)
5. [보안 권장사항](#보안-권장사항)

## 현재 연결 상태

### ✅ 정상 작동 중

- **Git Push/Pull**: Windows Git Credential Manager를 통해 정상 작동
- **리포지토리**: https://github.com/skyasu2/openmanager-vibe-v5
- **최근 푸시**: 2025-07-24 성공

### ⚠️ 개선 필요

- **GITHUB_TOKEN**: 설정되어 있으나 만료됨 (401 에러)
- **SSH 키**: 미설정
- **GitHub API**: 토큰 갱신 필요

## Git 인증 방법

### 1. 현재 사용 중: Windows Git Credential Manager (권장)

```bash
# 현재 설정
git config --global credential.helper "/mnt/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe"

# 사용법
git push  # 자동으로 Windows 인증 팝업 또는 브라우저 열림
```

**장점:**

- 별도 토큰 관리 불필요
- Windows와 WSL 통합
- 안전한 인증 정보 저장

### 2. Personal Access Token (PAT)

#### 새 토큰 생성

1. https://github.com/settings/tokens/new 접속
2. 권한 설정:
   - `repo` (전체 체크) - 필수
   - `workflow` - GitHub Actions 사용 시
   - `admin:org` - 조직 관리 시
3. 토큰 저장

#### 토큰 설정

```bash
# 환경변수 설정 (.env.local)
GITHUB_TOKEN=ghp_YOUR_NEW_TOKEN

# 또는 .bashrc에 추가
export GITHUB_TOKEN="ghp_YOUR_NEW_TOKEN"
```

#### 토큰으로 Push

```bash
# 일회성 사용
git push https://skyasu2:$GITHUB_TOKEN@github.com/skyasu2/openmanager-vibe-v5.git main

# 영구 설정
git remote set-url origin https://skyasu2:$GITHUB_TOKEN@github.com/skyasu2/openmanager-vibe-v5.git
```

### 3. SSH 키 (장기적 해결책)

```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "skyasu2@gmail.com"

# 공개 키 확인
cat ~/.ssh/id_ed25519.pub

# GitHub에 추가
# Settings > SSH and GPG keys > New SSH key

# Remote URL 변경
git remote set-url origin git@github.com:skyasu2/openmanager-vibe-v5.git
```

### 4. GitHub CLI

```bash
# 설치
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# 로그인
gh auth login

# 사용
gh repo sync
```

## 문제 해결

### 🔍 연결 상태 확인

```bash
# 1. Git 설정 확인
git config --list | grep -E "(user|credential|remote)"

# 2. 토큰 상태 확인
echo "Token exists: $([ -n "$GITHUB_TOKEN" ] && echo 'Yes' || echo 'No')"

# 3. API 테스트
curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# 4. Push 테스트
git remote -v
```

### 🚨 일반적인 오류

#### 1. "Authentication failed"

```bash
# Windows Credential Manager 재설정
git config --unset credential.helper
git config --global credential.helper "/mnt/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe"
```

#### 2. "Bad credentials" (401)

- GITHUB_TOKEN이 만료됨
- 새 토큰 생성 필요

#### 3. "Permission denied"

- 토큰에 `repo` 권한 없음
- SSH 키가 GitHub에 등록되지 않음

## GitHub MCP 서버

### 현재 상태

- ✅ MCP 서버 설치됨 (`@modelcontextprotocol/server-github`)
- ⚠️ GITHUB_TOKEN 갱신 필요

### MCP 활용 방법

```typescript
// GitHub MCP 도구 사용 예시
await mcp__github__search_repositories({ query: 'user:skyasu2' });
await mcp__github__get_file_contents({
  owner: 'skyasu2',
  repo: 'openmanager-vibe-v5',
  path: 'README.md',
});
await mcp__github__create_issue({
  owner: 'skyasu2',
  repo: 'openmanager-vibe-v5',
  title: '이슈 제목',
  body: '이슈 내용',
});
```

### MCP 서버 설정 확인

```bash
# MCP 설정 파일 위치
~/.config/claude/claude_desktop_config.json

# 필요한 설정
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["path/to/github-mcp-server"],
      "env": {
        "GITHUB_TOKEN": "ghp_YOUR_VALID_TOKEN"
      }
    }
  }
}
```

## 보안 권장사항

### ✅ 해야 할 것

1. **토큰 권한 최소화**: 필요한 권한만 부여
2. **정기적 토큰 갱신**: 3-6개월마다
3. **환경변수 사용**: 코드에 토큰 하드코딩 금지
4. **.gitignore 확인**: `.env.local` 제외 확인

### ❌ 하지 말아야 할 것

1. 토큰을 코드에 직접 입력
2. 공개 리포지토리에 토큰 커밋
3. 만료된 토큰 방치
4. 과도한 권한 부여

## 정리 필요한 파일들

다음 파일들은 중복되거나 오래된 것으로 정리가 필요합니다:

### 삭제 권장

- `scripts/set-github-token.sh` - 보안상 위험
- `scripts/encrypt-github-token.cjs` - 불필요한 복잡성
- `scripts/test-github-token-security.cjs` - 중복 기능

### 유지

- `scripts/test-github-token.cjs` - 토큰 테스트용
- `scripts/github-auth-helper.cjs` - 백업용 (현재 미사용)

## 추천 설정

### 🎯 개발 환경 (WSL)

1. **주 방법**: Windows Git Credential Manager (현재 사용 중)
2. **백업**: 새 PAT 토큰 생성 후 환경변수 설정
3. **장기적**: SSH 키 설정

### 🚀 자동화/CI

1. GitHub Actions secrets 사용
2. 최소 권한 토큰 생성
3. 정기적 갱신 알림 설정

---

_최종 업데이트: 2025-07-24_
