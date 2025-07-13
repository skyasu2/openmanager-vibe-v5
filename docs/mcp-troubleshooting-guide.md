# MCP 문제 해결 완전 가이드

## 🔥 최신 해결사례 (2025-07-13)

### Filesystem MCP Server 실패 문제 해결

**문제**: Filesystem MCP Server가 시작되지 않음
```
Filesystem MCP Server
Status: ✘ failed
Usage: mcp-server-filesystem <allowed-directory> [additional-directories...]
```

**원인**: Filesystem 서버는 **명령줄 인자**로 허용된 디렉터리를 받아야 하는데, 환경 변수(ALLOWED_DIRECTORIES)로만 전달하면 실패합니다.

**해결방법**: `.mcp.json` 파일 수정
```json
// ❌ 잘못된 설정
"filesystem": {
  "command": "node",
  "args": [
    "./node_modules/@modelcontextprotocol/server-filesystem/dist/index.js"
  ],
  "env": {
    "ALLOWED_DIRECTORIES": "D:/cursor/openmanager-vibe-v5"
  }
}

// ✅ 올바른 설정
"filesystem": {
  "command": "node",
  "args": [
    "./node_modules/@modelcontextprotocol/server-filesystem/dist/index.js",
    "D:/cursor/openmanager-vibe-v5"  // 디렉터리를 args로 전달
  ]
}
```

## 🆕 Claude Code v1.0.51 업데이트 사항

Claude Code v1.0.51부터 MCP 서버 설정 방식이 변경되었습니다:
- ❌ 기존: `~/.claude/settings.json` 파일의 `mcpServers` 필드 사용
- ✅ 신규: `claude mcp add` CLI 명령어 사용

### 주요 변경사항
1. **settings.json의 mcpServers 필드 제거**: 더 이상 인식되지 않음
2. **CLI 기반 설정**: 모든 MCP 서버는 CLI 명령어로 추가
3. **설정 파일 위치 변경**: 내부 구조 변경으로 직접 편집 불가

## 현재 문제 상황

- ❌ Claude Code doctor가 "mcpServers" 필드를 인식하지 못함
- ❌ settings.json에 직접 추가한 MCP 설정이 작동하지 않음
- ❌ `/mcp` 명령 시 "No MCP servers configured" 메시지

## 문제 진단

### 1. 설정 파일 상태

```bash
# Claude Code 전역 설정 확인
cat ~/.claude/settings.json
# 결과: {} (비어있음)

# 프로젝트 MCP 설정 확인  
cat .claude/mcp.json
# 결과: 설정은 있지만 인식되지 않음
```

### 2. 프로세스 상태

```bash
# MCP 프로세스 확인
ps aux | grep mcp
# 결과: 프로세스 없음
```

## 해결 방법

### 🚀 방법 1: 자동 설정 스크립트 (권장)

**npm 스크립트 사용**:
```bash
# 프로젝트 디렉토리에서
npm run mcp:setup
```

**또는 직접 실행**:
```bash
# 스크립트 실행
chmod +x scripts/setup-mcp-servers.sh
./scripts/setup-mcp-servers.sh
```

⚠️ **중요**: Claude Code의 터미널이 아닌 일반 터미널(WSL, PowerShell 등)에서 실행하세요!

### 🔧 방법 2: 설정 초기화 후 재설정

문제가 지속되거나 기존 설정을 정리하고 싶을 때:

```bash
# 1. MCP 설정 초기화 (백업 포함)
npm run mcp:reset

# 2. MCP 서버 재설정
npm run mcp:setup

# 3. 설정 확인
npm run mcp:list
```

### 🔄 방법 2: 설정 초기화 후 재설정

```bash
# 1. 설정 초기화
chmod +x scripts/reset-mcp-settings.sh
./scripts/reset-mcp-settings.sh

# 2. MCP 서버 재설정
./scripts/setup-mcp-servers.sh

# 3. Claude Code 재시작
claude

# 4. MCP 확인
claude mcp list
```

### 방법 3: 수동으로 CLI 명령 실행

각 MCP 서버를 개별적으로 추가:

```bash
# 파일시스템 MCP
claude mcp add filesystem node \
  "/mnt/d/cursor/openmanager-vibe-v5/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js" \
  "/mnt/d/cursor/openmanager-vibe-v5"

# GitHub MCP
claude mcp add github node \
  "/mnt/d/cursor/openmanager-vibe-v5/node_modules/@modelcontextprotocol/server-github/dist/index.js" \
  -e GITHUB_PERSONAL_ACCESS_TOKEN="${GITHUB_TOKEN}"

# Memory MCP
claude mcp add memory node \
  "/mnt/d/cursor/openmanager-vibe-v5/node_modules/@modelcontextprotocol/server-memory/dist/index.js"

# Brave Search MCP
claude mcp add brave-search node \
  "/mnt/d/cursor/openmanager-vibe-v5/node_modules/@modelcontextprotocol/server-brave-search/dist/index.js" \
  -e BRAVE_API_KEY="${BRAVE_API_KEY}"

# Supabase MCP
claude mcp add supabase node \
  "/mnt/d/cursor/openmanager-vibe-v5/node_modules/@supabase/mcp-server-supabase/dist/index.js" \
  -e SUPABASE_URL="https://vnswjnltnhpsueosfhmw.supabase.co" \
  -e SUPABASE_SERVICE_ROLE_KEY="your-key"
```

### 방법 3: MCP 서버 직접 테스트

```bash
# MCP 서버 직접 실행 테스트
node scripts/test-mcp-direct.js
```

### 방법 4: 대체 경로 사용

WSL 환경에서 Windows 경로 문제가 있을 수 있습니다:

```bash
# 심볼릭 링크 생성
ln -s /mnt/d/cursor/openmanager-vibe-v5 ~/openmanager-vibe-v5

# 설정에서 심볼릭 링크 경로 사용
"args": ["/home/skyasu/openmanager-vibe-v5/node_modules/..."]
```

## 자주 발생하는 문제와 해결법

### 1. "Unrecognized field: mcpServers" 오류

**문제**: `/doctor` 명령 실행 시 settings.json의 mcpServers 필드 오류
```
⚠ Found invalid settings files. They will be ignored.
└ Unrecognized field: mcpServers
```

**해결**: 
```bash
# 설정 초기화 후 재설정
npm run mcp:reset
npm run mcp:setup
```

### 2. "Raw mode is not supported" 오류

**문제**: Claude Code 터미널에서 스크립트 실행 시 발생

**해결**: 일반 터미널(WSL, PowerShell, Terminal 앱)에서 실행

### 3. MCP 서버가 목록에 나타나지 않음

**문제**: `claude mcp list` 실행 시 서버가 보이지 않음

**해결**:
1. Claude Code 완전히 종료 (Ctrl+C)
2. 다시 시작: `claude`
3. 확인: `claude mcp list`

### 4. 환경변수 관련 오류

**문제**: GITHUB_TOKEN, BRAVE_API_KEY 등이 설정되지 않음

**해결**:
```bash
# GitHub 토큰 설정
source scripts/setup-github-token.sh

# Supabase 키 설정  
source scripts/set-supabase-key.sh
```

## 디버깅 방법

### 1. Claude Code 로그 확인

```bash
# 로그 디렉토리 찾기
find ~ -name "claude*log*" -type f 2>/dev/null

# 최신 로그 확인
tail -f ~/.claude/logs/*.log
```

### 2. MCP 서버 디버깅 모드

```bash
# 디버깅 모드로 MCP 서버 실행
DEBUG=* node /mnt/d/cursor/openmanager-vibe-v5/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js
```

### 3. 권한 문제 확인

```bash
# 파일 권한 확인
ls -la ~/.claude/
ls -la node_modules/@modelcontextprotocol/

# 실행 권한 부여
chmod +x node_modules/@modelcontextprotocol/*/dist/index.js
```

## 일반적인 오류와 해결

### 오류 1: "No MCP servers configured"

**원인**: Claude Code가 설정 파일을 찾지 못함
**해결**:

- 전역 설정 파일 생성 (~/.claude/settings.json)
- 절대 경로 사용

### 오류 2: "ENOENT: no such file or directory"

**원인**: 잘못된 경로
**해결**:

- 절대 경로 사용
- WSL에서는 /mnt/d/ 경로 확인

### 오류 3: "Permission denied"

**원인**: 실행 권한 없음
**해결**:

```bash
chmod +x node_modules/@modelcontextprotocol/*/dist/index.js
chmod +x node_modules/@supabase/mcp-server-supabase/dist/index.js
```

### 오류 4: 환경 변수 인식 안됨

**원인**: Claude Code가 환경 변수를 상속받지 못함
**해결**:

- 설정 파일에 직접 값 입력
- 환경 변수 설정 후 같은 터미널에서 Claude 실행

## 최종 체크리스트

- [ ] MCP 패키지 설치 확인
- [ ] ~/.claude/settings.json 파일 생성 및 설정
- [ ] 환경 변수 설정
- [ ] 절대 경로 사용
- [ ] 파일 실행 권한 확인
- [ ] Claude Code 완전 재시작
- [ ] `/mcp` 명령으로 테스트

## 추가 도움말

### MCP 서버별 테스트 명령

```bash
# Filesystem MCP
@filesystem list files in current directory

# Supabase MCP  
@supabase SELECT 1;

# GitHub MCP
@github show repository info

# Memory MCP
@memory remember this: test

# Brave Search MCP
@brave-search test search
```

### 지원 리소스

- [MCP 공식 문서](https://modelcontextprotocol.com)
- [Claude Code 문서](https://docs.anthropic.com/en/docs/claude-code)
- GitHub Issues: MCP 관련 문제 검색

## 문제가 지속된다면

1. Claude Code 버전 확인
2. Node.js 버전 확인 (v22+ 권장)
3. WSL 버전 확인 (WSL2 권장)
4. Claude Code 재설치 고려

이 가이드로도 해결되지 않는다면, 구체적인 오류 메시지와 함께 문의해주세요.
