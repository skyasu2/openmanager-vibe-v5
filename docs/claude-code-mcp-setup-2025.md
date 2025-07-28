# 🔧 Claude Code MCP 상세 설정 가이드

> **최종 업데이트**: 2025년 7월 28일  
> **문서 용도**: MCP 고급 설정 및 문제 해결  
> **빠른 사용법**: `docs/mcp-quick-guide.md` 참조
> **공식 문서**: [Claude MCP (Model Control Protocol) 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)

## 📋 프로젝트 MCP 서버 현황

현재 프로젝트에서 사용 중인 MCP 서버: **4개**

1. **filesystem** - 파일 시스템 작업
2. **github** - GitHub 통합
3. **memory** - 컨텍스트 메모리
4. **sequential-thinking** - 단계별 문제 분석

## 🔧 설정 파일 구조

### 프로젝트 설정 (.mcp.json)

```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/mnt/d/cursor/openmanager-vibe-v5"
      ],
      "env": {}
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "memory": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": {}
    },
    "sequential-thinking": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {
        "DISABLE_THOUGHT_LOGGING": "true"
      }
    }
  }
}
```

## 🚀 MCP 서버 설치

### 기본 명령어

```bash
# 프로젝트 레벨 설치 (권장)
claude mcp add <서버명> -s project npx -y <패키지명>

# 사용자 레벨 설치
claude mcp add <서버명> -s user npx -y <패키지명>
```

### 실제 설치 예시

```bash
# Filesystem
claude mcp add filesystem -s project npx -y @modelcontextprotocol/server-filesystem .

# GitHub (토큰 필요)
claude mcp add github -s project -e GITHUB_TOKEN="${GITHUB_TOKEN}" npx -y @modelcontextprotocol/server-github

# Memory
claude mcp add memory -s project npx -y @modelcontextprotocol/server-memory

# Sequential Thinking
claude mcp add sequential-thinking -s project npx -y @modelcontextprotocol/server-sequential-thinking
```

## 🔑 환경 변수 설정

### GitHub Token 설정

1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. 필요한 권한 선택:
   - `repo` (전체 저장소 접근)
   - `read:org` (조직 읽기)
   - `write:discussion` (이슈/PR 작성)

4. `.env.local` 파일에 저장:

```bash
GITHUB_TOKEN=ghp_YOUR_GITHUB_TOKEN_HERE
```

## 🔍 MCP 서버 관리

### 상태 확인

```bash
# Claude Code 내에서
/mcp

# CLI에서
claude mcp list
```

### 서버 재시작

```bash
# 특정 서버만 재시작
claude mcp restart <서버명>

# 모든 서버 재시작
claude mcp restart --all
```

### 서버 제거

```bash
# 설정 파일 직접 편집 (권장)
# .mcp.json에서 해당 서버 블록 삭제

# 또는 CLI 사용
claude mcp remove <서버명> -s project
```

## 🐛 문제 해결

### 일반적인 문제

#### 1. "MCP 서버가 연결되지 않았습니다"

```bash
# 디버그 모드 실행
claude --mcp-debug

# 로그 확인
tail -f ~/.claude/logs/mcp-server-*.log
```

#### 2. "Permission denied" 오류

```bash
# npx 캐시 정리
npx clear-npx-cache

# 권한 확인
ls -la ~/.npm
```

#### 3. GitHub 인증 실패

```bash
# 토큰 유효성 확인
curl -H "Authorization: token ${GITHUB_TOKEN}" https://api.github.com/user

# 환경 변수 확인
echo $GITHUB_TOKEN
```

### 고급 디버깅

#### MCP 서버 수동 실행

```bash
# 문제가 있는 서버 직접 실행
npx -y @modelcontextprotocol/server-filesystem /path/to/project

# 출력 확인으로 문제 진단
```

#### 설정 파일 검증

```bash
# JSON 구문 검증
cat .mcp.json | python -m json.tool
```

## 📝 Best Practices

### 1. 보안

- API 토큰은 절대 코드에 하드코딩하지 않기
- `.env.local` 파일은 반드시 `.gitignore`에 포함
- 필요한 최소 권한만 부여

### 2. 성능

- 불필요한 MCP 서버는 비활성화
- 대용량 파일 작업 시 주의
- Memory 서버는 세션 간 데이터 유지 안 됨

### 3. 협업

- `.mcp.json`은 Git에 커밋 (토큰 제외)
- 팀원들과 동일한 MCP 설정 공유
- README에 필요한 환경 변수 문서화

## 🔗 추가 리소스

- [MCP 공식 문서](https://modelcontextprotocol.io/)
- [프로젝트 빠른 가이드](./mcp-quick-guide.md)
- [GitHub Token 설정 가이드](./setup/github-mcp-token-setup.md)
