# MCP 서버 트러블슈팅 가이드

> **최초 작성**: 2025년 7월 26일  
> **최종 업데이트**: 2025년 7월 26일  
> **문제**: MCP 서버들이 정상적으로 동작하지 않는 문제  
> **해결**: 환경변수 처리, 프로젝트 레벨 설정 수정, Supabase MCP 환경변수 문제 해결

## 🆕 2025-07-26 추가 발견 문제 및 해결

### 1. Supabase MCP `SUPABASE_ACCESS_TOKEN` 오류

**증상**:

```
Please provide a personal access token (PAT) with the --access-token flag or set the SUPABASE_ACCESS_TOKEN environment variable
MCP error -32000: Connection closed
```

**원인**:

- Supabase MCP가 Personal Access Token을 요구하지만 Service Role Key를 사용하고 있었음
- 환경변수가 Claude Code 시작 시점에만 로드되어 재시작 필요

**해결방법**:

```json
// .mcp.json 수정
"supabase": {
  "env": {
    "SUPABASE_URL": "${SUPABASE_URL}",
    "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}",
    "SUPABASE_ACCESS_TOKEN": "${SUPABASE_PAT}"  // Personal Access Token 사용
  }
}
```

**추가 필요 작업**:

1. `.env.local`에 `SUPABASE_PAT` 환경변수 추가
2. Claude Code 재시작하여 환경변수 반영

### 2. Playwright MCP 서버 추가

**배경**: Puppeteer 대신 Playwright 사용 권장

**설정**:

```json
"playwright": {
  "type": "stdio",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-playwright"
  ],
  "env": {}
}
```

## 🔍 기존 문제 분석

### 표면적 증상

- `claude mcp list` 실행 시 일부 서버만 표시됨
- Supabase, Serena MCP 서버 연결 실패
- 환경변수가 설정되어 있음에도 MCP가 인식 못함

### 근본적 원인

#### 1. **MCP 서버 스코프 충돌**

```json
// ~/.claude.json (user-level)
"mcpServers": {
  "filesystem": {...},
  "memory": {...},
  "sequential-thinking": {...}
}

// .mcp.json (project-level)
"mcpServers": {
  "filesystem": {...},
  "memory": {...},
  // ... 중복 정의
}
```

- 동일한 서버가 user와 project 레벨에 중복 정의
- Claude Code는 기본적으로 user-level을 우선시
- Project-level 서버는 명시적 활성화 필요

#### 2. **환경변수 확장 실패**

```json
// 문제: 환경변수 참조가 확장되지 않음
"env": {
  "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
}

// 해결: 직접 값 사용
"env": {
  "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_7En1..."
}
```

#### 3. **Project MCP 서버 비활성화**

- Claude Code v1.0.60부터 project 서버는 수동 활성화 필요
- `.claude/settings.local.json`에 `enabledMcpjsonServers` 설정 필요

## 🛠️ 해결 방법

### 1단계: 기존 프로세스 정리

```bash
# MCP 프로세스 종료
killall -9 mcp-server-filesystem mcp-server-memory
```

### 2단계: User-level 서버 제거

```bash
claude mcp remove filesystem -s user
claude mcp remove memory -s user
claude mcp remove sequential-thinking -s user
```

### 3단계: Project-level 설정 수정

#### `.mcp.json` 수정

- 환경변수 참조를 실제 값으로 변경
- 불필요한 서버(Serena) 제거
- 올바른 환경변수 설정

#### `.claude/settings.local.json` 수정

```json
{
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": [
    "filesystem",
    "memory",
    "sequential-thinking",
    "github",
    "context7",
    "tavily-mcp",
    "supabase"
  ]
}
```

### 4단계: Claude Code 재시작

```bash
# Claude Code 종료 후 재시작
# 새 터미널에서:
claude mcp list
```

## ✅ 검증 체크리스트

1. [ ] 모든 MCP 서버가 "✓ Connected" 상태인지 확인
2. [ ] 환경변수가 올바르게 설정되었는지 확인
3. [ ] 중복 서버 정의가 없는지 확인
4. [ ] `.claude/settings.local.json`에 서버 활성화 설정 확인

## 🚀 권장사항

### 개발 환경 설정

1. **환경변수 대신 직접 값 사용** (개발 편의성)
   - 보안이 중요한 프로덕션에서는 환경변수 사용
   - 개발 환경에서는 직접 값으로 빠른 설정

2. **Project-level 통일**
   - 모든 MCP 서버를 `.mcp.json`에 정의
   - 팀원과 설정 공유 가능

3. **정기적인 상태 확인**

   ```bash
   # MCP 서버 상태 확인
   claude mcp list

   # 프로세스 확인
   ps aux | grep mcp
   ```

## 📊 디버깅 방법

### 1. 로그 확인

```bash
# Claude CLI 디버그 모드
claude --debug

# 로그 파일 위치
~/.cache/claude-cli-nodejs/-mnt-d-cursor-openmanager-vibe-v5/
```

### 2. MCP 서버별 로그 확인

- `mcp-logs-supabase/`: Supabase 연결 로그
- `mcp-logs-tavily-mcp/`: Tavily 연결 로그
- `mcp-logs-filesystem/`: 파일시스템 로그

### 3. 환경변수 확인 (마스킹)

```bash
env | grep -i supabase | sed 's/=.*$/=***/'
env | grep -i github | sed 's/=.*$/=***/'
env | grep -i tavily | sed 's/=.*$/=***/'
```

## 📋 일반적인 문제들

### 문제: "Failed to connect" 에러

**원인**: 환경변수가 설정되지 않았거나 잘못된 값
**해결**: 환경변수 확인 후 `.mcp.json`에 직접 입력

### 문제: 서버가 목록에 나타나지 않음

**원인**: `enabledMcpjsonServers` 설정 누락
**해결**: `.claude/settings.local.json` 업데이트

### 문제: 중복 서버 실행

**원인**: User와 Project 레벨에 동일 서버 정의
**해결**: User-level 서버 제거

### 문제: GitHub MCP 인증 실패

**원인**: Personal Access Token 미설정 또는 권한 부족
**해결**:

1. GitHub에서 Personal Access Token 생성 (repo, workflow, read:org 권한)
2. `.env.local`에 `GITHUB_PERSONAL_ACCESS_TOKEN` 추가
3. Claude Code 재시작

### 문제: npm warn config cache-max 경고

**원인**: npm 설정 deprecated 경고
**해결**: 무시 가능 (정상 작동에 영향 없음)

## 🔗 관련 문서

- [Claude Code MCP 설정 가이드](./claude-code-mcp-setup-2025.md)
- [MCP 빠른 시작 가이드](./mcp-quick-guide.md)
- [개발 도구 통합](./development-tools.md)
- [MCP 서버 상태 현황](./mcp-server-status.md)

## 📝 변경 이력

### 2025-07-26 업데이트

- Supabase MCP Personal Access Token 사용으로 변경
- GitHub MCP 인증 실패 해결 방법 추가
- 환경변수 재시작 필요성 명시
- Claude Code 재시작 가이드 추가
