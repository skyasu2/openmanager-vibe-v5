# ⚠️ 긴급 보안 경고 - 2025년 7월 16일

## 🚨 노출된 민감 정보

다음 민감한 정보들이 코드베이스에 노출되어 있습니다:

### 1. GitHub Personal Access Token

- **위치**: `.mcp.json`, `.env.local`
- **토큰**: `ghp_[REDACTED]`
- **위험도**: 🔴 **매우 높음**
- **즉시 조치 필요**: GitHub에서 노출된 토큰을 즉시 revoke하고 새로 생성하세요!

### 2. GitHub OAuth Secret

- **위치**: `.env.local`
- **값**: `[REDACTED]`
- **위험도**: 🔴 **매우 높음**

### 3. Upstash Redis Tokens

- **위치**: `.env.local`
- **토큰들**: KV 관련 여러 토큰
- **위험도**: 🟡 **높음**

### 4. Tavily API Key

- **위치**: `.env.local`
- **키**: `tvly-dev-[REDACTED]`
- **위험도**: 🟡 **중간** (개발용 키로 보임)

## 🛡️ 즉시 수행해야 할 조치

### 1. GitHub 토큰 무효화 및 재생성

```bash
# 1. GitHub.com 접속
# 2. Settings → Developer settings → Personal access tokens
# 3. 노출된 토큰 찾아서 "Revoke" 클릭
# 4. 새 토큰 생성 (필요한 권한만 부여)
```

### 2. GitHub OAuth App 시크릿 재생성

```bash
# 1. GitHub.com 접속
# 2. Settings → Developer settings → OAuth Apps
# 3. 해당 앱 선택
# 4. "Generate a new client secret" 클릭
```

### 3. Redis 토큰 재생성

```bash
# Upstash 콘솔에서 새 토큰 생성
# https://console.upstash.com/
```

## 📋 수행된 보안 조치

1. **`.mcp.json` 수정됨**
   - 하드코딩된 GitHub 토큰 제거
   - 환경 변수 참조로 변경

2. **백업 파일 보안 처리됨**
   - 백업 파일의 토큰을 `[REDACTED]`로 마스킹

3. **`.env.example` 생성됨**
   - 안전한 템플릿 파일 제공
   - 실제 값 없이 구조만 제공

## 🔧 올바른 MCP 설정 방법

### 방법 1: Claude Code 재시작 시 환경변수 전달

```bash
# Windows PowerShell
$env:GITHUB_TOKEN="YOUR_PLACEHOLDER"; claude

# macOS/Linux
GITHUB_TOKEN="YOUR_PLACEHOLDER" claude
```

### 방법 2: Claude MCP 명령어로 추가

```bash
claude mcp remove github
claude mcp add github -e GITHUB_TOKEN="YOUR_PLACEHOLDER" -- npx -y @modelcontextprotocol/server-github
```

### 방법 3: 시스템 환경변수 설정

```bash
# Windows
setx GITHUB_TOKEN "YOUR_PLACEHOLDER"

# macOS/Linux (.bashrc 또는 .zshrc에 추가)
export GITHUB_TOKEN="YOUR_PLACEHOLDER"
```

## 🚫 향후 예방 조치

1. **절대 하지 말아야 할 것**
   - API 키나 토큰을 코드에 하드코딩
   - `.env.local` 파일을 Git에 커밋
   - 백업 파일에 실제 토큰 포함

2. **항상 해야 할 것**
   - 환경 변수 사용
   - `.gitignore` 확인
   - 커밋 전 민감한 정보 검토
   - 정기적인 토큰 로테이션

## 📁 안전한 환경변수 관리

```bash
# 1. 실제 환경변수는 .env.local에만 저장
cp .env.example .env.local

# 2. .env.local 편집하여 실제 값 입력
# 3. .gitignore에 .env.local 포함 확인

# 4. Git에서 캐시된 파일 제거 (이미 커밋된 경우)
git rm --cached .mcp.json
git rm --cached .env.local
```

## 🔐 보안 체크리스트

- [ ] GitHub Personal Access Token revoke 및 재생성
- [ ] GitHub OAuth Secret 재생성
- [ ] Upstash Redis 토큰 재생성
- [ ] Tavily API 키 재생성 (필요시)
- [ ] 새 토큰들로 `.env.local` 업데이트
- [ ] Claude Code 재시작하여 새 환경변수 적용
- [ ] MCP 도구 정상 작동 확인

---

**작성일**: 2025년 7월 16일  
**심각도**: 🔴 **긴급**  
**담당**: 프로젝트 관리자
