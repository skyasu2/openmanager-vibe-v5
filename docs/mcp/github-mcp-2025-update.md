# 🚨 GitHub MCP 서버 2025년 주요 변경사항 및 해결 방안

**작성일**: 2025-08-20 12:00 KST  
**중요도**: 🔴 높음 - 즉시 조치 필요

## ⚠️ 핵심 변경사항 (2025년 4월)

### npm 패키지 지원 중단
- **기존**: `@modelcontextprotocol/server-github` (npm)
- **신규**: `ghcr.io/github/github-mcp-server` (Docker)
- **변경일**: 2025년 4월
- **영향**: 현재 npm 기반 설정이 작동하지 않는 이유

## 🔄 새로운 설정 방법

### 방법 1: Docker 기반 설정 (권장)

#### 1단계: Docker 설치 확인
```bash
# WSL에서 Docker 설치
sudo apt update
sudo apt install docker.io
sudo systemctl start docker
sudo usermod -aG docker $USER
# 재로그인 필요
```

#### 2단계: .mcp.json 수정
```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

#### 3단계: Claude Code CLI 명령
```bash
# Docker 이미지 미리 pull
docker pull ghcr.io/github/github-mcp-server

# Claude Code에서 설정
claude mcp add github -- docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server
```

### 방법 2: Remote GitHub MCP Server (공개 프리뷰)

#### 장점
- 로컬 설치 불필요
- 자동 업데이트
- OAuth 2.0 지원

#### 설정 방법
1. VS Code에서 원클릭 설치
2. 또는 Remote Server URL을 MCP 호스트에 직접 입력

#### 인증 옵션
- **OAuth 2.0** (권장): SAML 지원, 스코프 기반 접근
- **PAT**: 기존 방식 지원

### 방법 3: GitHub MCP Repos Manager (대안)

토큰 기반 GitHub 자동화 관리 서버
- Docker 불필요
- 80+ 도구 제공
- 직접 API 통합

## 🔑 Personal Access Token 설정 가이드

### 토큰 생성
1. GitHub → Settings → Developer settings → Personal access tokens
2. "Generate new token (classic)" 클릭
3. 이름: "Claude MCP Server Access"

### 필수 권한 (Scopes)
```
✅ repo (Full control of private repositories)
  ├─ repo:status
  ├─ repo_deployment
  ├─ public_repo
  └─ repo:invite

✅ workflow (Update GitHub Action workflows)

✅ write:packages (Upload packages to GitHub Package Registry)
  ├─ read:packages
  └─ delete:packages

✅ admin:org (선택사항 - 조직 관리)
  └─ read:org

✅ gist (선택사항 - Gist 생성/수정)
```

### 토큰 유효기간
- **권장**: 90일 (정기 갱신)
- **최대**: No expiration (보안 위험)

## 🐛 문제 해결

### 현재 문제: npm 패키지 사용으로 인한 인증 실패

#### 근본 원인
1. npm 패키지 `@modelcontextprotocol/server-github` 지원 중단
2. Claude Code가 환경변수를 시작 시점에 캐시
3. 토큰 갱신 후에도 캐시된 값 사용

#### 해결 순서

**1. 임시 해결책 (npm 유지)**
```bash
# 1. 토큰 직접 하드코딩 (테스트용)
vim .mcp.json
# "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_실제토큰값"

# 2. Claude Code 완전 재시작
pkill -f claude
ps aux | grep claude  # 프로세스 없음 확인
claude

# 3. 테스트
# Claude Code에서 mcp__github__* 도구 사용
```

**2. 영구 해결책 (Docker 전환)**
```bash
# 1. Docker 설치 및 설정
sudo apt install docker.io
sudo systemctl enable docker
sudo usermod -aG docker $USER
# 로그아웃 후 재로그인

# 2. GitHub 컨테이너 레지스트리 로그인
echo $GITHUB_PERSONAL_ACCESS_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# 3. 이미지 pull
docker pull ghcr.io/github/github-mcp-server

# 4. .mcp.json 업데이트 (위 Docker 설정 참조)

# 5. Claude Code 재시작
```

### 일반적인 오류와 해결

#### "Bad credentials" 오류
```bash
# 토큰 유효성 테스트
curl -H "Authorization: token ghp_YOUR_TOKEN" https://api.github.com/user

# 응답 확인
# 200 OK: 토큰 유효
# 401 Unauthorized: 토큰 무효
```

#### "Not connected" 오류
- Docker 데몬 실행 확인
- stdio transport 호환성 확인
- MCP 프로토콜 버전 확인

#### SSE (Server-Sent Events) 관련 오류
- 2025년 5월 26일부터 SSE 지원 제거
- Streamable HTTP로 마이그레이션 진행 중

## 📊 버전별 비교

| 항목 | npm (구버전) | Docker (신버전) | Remote Server |
|------|-------------|----------------|---------------|
| 지원 상태 | ❌ 중단 | ✅ 공식 | ✅ 프리뷰 |
| 설치 난이도 | 쉬움 | 중간 | 매우 쉬움 |
| 자동 업데이트 | ❌ | ❌ | ✅ |
| OAuth 2.0 | ❌ | ❌ | ✅ |
| 로컬 리소스 | 낮음 | 중간 | 없음 |
| 보안 | PAT만 | PAT만 | OAuth/PAT |

## 🚀 권장 마이그레이션 경로

### 단기 (즉시)
1. 현재 npm 설정에서 토큰 하드코딩으로 임시 해결
2. Claude Code 재시작으로 즉시 작동 확인

### 중기 (1주일 내)
1. Docker 설치 및 설정
2. Docker 기반 GitHub MCP 서버로 전환
3. 환경변수 기반 토큰 관리 복원

### 장기 (1개월 내)
1. Remote GitHub MCP Server 평가
2. OAuth 2.0 전환 검토
3. 조직 단위 정책 수립

## 📚 참고 자료

- [GitHub 공식 MCP Server](https://github.com/github/github-mcp-server)
- [MCP 설정 가이드](https://mcpcat.io/guides/adding-an-mcp-server-to-claude-code/)
- [Docker 설치 가이드 (WSL)](https://docs.docker.com/desktop/wsl/)
- [GitHub PAT 문서](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

## ⚡ 빠른 테스트 스크립트

```bash
#!/bin/bash
# test-github-mcp.sh

echo "=== GitHub MCP 테스트 ==="

# 1. 토큰 유효성 확인
echo "1. 토큰 유효성 테스트..."
TOKEN=$(grep GITHUB_PERSONAL_ACCESS_TOKEN .env.local | cut -d'=' -f2)
curl -s -H "Authorization: token $TOKEN" https://api.github.com/user | jq '.login'

# 2. Docker 상태 확인
echo "2. Docker 상태 확인..."
docker --version
docker ps

# 3. 이미지 존재 확인
echo "3. GitHub MCP 이미지 확인..."
docker images | grep github-mcp-server

# 4. MCP 설정 확인
echo "4. MCP 설정 확인..."
cat .mcp.json | jq '.mcpServers.github'

echo "=== 테스트 완료 ==="
```

---

**업데이트 주기**: 주간  
**마지막 검증**: 2025-08-20  
**담당**: Claude Code Assistant