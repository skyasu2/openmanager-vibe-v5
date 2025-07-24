# GitHub MCP 토큰 설정 가이드

## 🚨 보안 경고

GitHub Personal Access Token은 매우 민감한 정보입니다. 절대로:

- 코드에 직접 작성하지 마세요
- 채팅이나 메시지에 공유하지 마세요
- 공개 저장소에 커밋하지 마세요

## 📌 현재 설정 (2025.01 업데이트)

**개발 편의성을 위한 평문 토큰 사용**:

- 암호화 시스템이 비활성화되어 있습니다
- `.env.local`에 평문으로 토큰을 저장합니다
- 더 간단하고 직관적인 설정이 가능합니다

## 📋 설정 단계

### 1. 새 GitHub Token 생성

1. GitHub 설정 페이지 접속: https://github.com/settings/tokens
2. "Generate new token (classic)" 클릭
3. 다음 권한 선택:
   - ✅ **repo** (전체 저장소 접근)
   - ✅ **workflow** (GitHub Actions)
   - ✅ **read:org** (조직 정보 읽기)
4. "Generate token" 클릭
5. 생성된 토큰을 안전한 곳에 복사

### 2. 환경 변수 설정

#### 방법 1: .env.local 파일 사용 (개발 환경)

```bash
# .env.local 파일 편집
GITHUB_TOKEN=ghp_여기에_실제_토큰_입력
```

#### 방법 2: 시스템 환경 변수 설정 (권장)

**Windows PowerShell:**

```powershell
[System.Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "your_token_here", "User")
```

**Linux/macOS:**

```bash
export GITHUB_TOKEN="your_token_here"
# ~/.bashrc 또는 ~/.zshrc에 추가하여 영구 설정
```

**WSL 환경:**

```bash
# ~/.bashrc에 추가
export GITHUB_TOKEN="your_token_here"
source ~/.bashrc
```

### 3. Claude Code 재시작

환경 변수 설정 후 Claude Code를 재시작해야 적용됩니다:

```bash
# Claude Code 재시작
claude exit
claude chat
```

### 4. 연결 테스트

```bash
# Claude Code 내에서
/mcp

# GitHub 서버가 목록에 나타나는지 확인
```

## 🚀 Git Push 사용법

### 토큰을 사용한 Push

WSL 환경에서는 대화형 인증이 작동하지 않으므로 토큰을 직접 사용합니다:

```bash
# .env.local에서 토큰 로드 후 push
source .env.local && git push https://${GITHUB_TOKEN}@github.com/skyasu2/openmanager-vibe-v5.git main

# 또는 npm 스크립트 사용
npm run git:secure-push
```

### 자주 사용하는 명령어

```bash
# 상태 확인
git status

# 모든 변경사항 추가
git add -A

# 커밋
git commit -m "커밋 메시지"

# 토큰으로 푸시
source .env.local && git push https://${GITHUB_TOKEN}@github.com/skyasu2/openmanager-vibe-v5.git main
```

## 🔒 보안 모범 사례

1. **토큰 권한 최소화**: 필요한 권한만 부여
2. **정기적 갱신**: 3-6개월마다 토큰 재생성
3. **환경별 분리**: 개발/프로덕션 토큰 구분
4. **접근 로그 확인**: GitHub 설정에서 토큰 사용 내역 모니터링
5. **절대 평문 커밋 금지**: `.env.local`은 `.gitignore`에 포함되어야 함

## ❓ 문제 해결

### MCP 서버가 시작되지 않는 경우

```bash
# 환경 변수 확인
echo $GITHUB_TOKEN

# Claude Code 디버그 모드
claude --mcp-debug
```

### 토큰 권한 부족 오류

- GitHub 설정에서 토큰 권한 재확인
- 특히 `repo` 전체 권한 필요

### 환경 변수가 인식되지 않는 경우

1. 시스템 환경 변수로 설정 확인
2. Claude Code 완전 재시작
3. 터미널 세션 새로 시작

## 📚 관련 문서

- [Claude Code MCP 설정 가이드](../claude-code-mcp-setup-2025.md)
- [GitHub Personal Access Tokens 공식 문서](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
