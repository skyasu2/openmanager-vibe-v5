# MCP 문제 해결 완전 가이드

## 현재 문제 상황
- ❌ Claude Code가 MCP 서버를 인식하지 못함
- ❌ `/mcp` 명령 시 "No MCP servers configured" 메시지
- ❌ MCP 프로세스가 실행되지 않음

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

### 방법 1: 빠른 수정 스크립트 실행

```bash
# 1. 수정 스크립트 실행
chmod +x scripts/fix-mcp-setup.sh
./scripts/fix-mcp-setup.sh

# 2. Claude Code 완전 종료
pkill -f claude

# 3. Claude Code 재시작
claude

# 4. MCP 확인
/mcp
```

### 방법 2: 수동 설정 (권장)

#### 단계 1: Claude Code 전역 설정 업데이트
```bash
# 설정 파일 직접 편집
nano ~/.claude/settings.json
```

다음 내용 추가:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["/mnt/d/cursor/openmanager-vibe-v5/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js"],
      "env": {
        "ALLOWED_DIRECTORIES": "/mnt/d/cursor/openmanager-vibe-v5"
      }
    },
    "supabase": {
      "command": "node", 
      "args": ["/mnt/d/cursor/openmanager-vibe-v5/node_modules/@supabase/mcp-server-supabase/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://vnswjnltnhpsueosfhmw.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

#### 단계 2: 환경 변수 설정
```bash
# .bashrc 또는 .zshrc에 추가
export SUPABASE_URL="https://vnswjnltnhpsueosfhmw.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export GITHUB_TOKEN="your-github-token"
export BRAVE_API_KEY="your-brave-api-key"

# 즉시 적용
source ~/.bashrc
```

#### 단계 3: Claude Code 재시작
```bash
# 모든 Claude 프로세스 종료
pkill -f claude

# 재시작
claude
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
2. Node.js 버전 확인 (v18+ 권장)
3. WSL 버전 확인 (WSL2 권장)
4. Claude Code 재설치 고려

이 가이드로도 해결되지 않는다면, 구체적인 오류 메시지와 함께 문의해주세요.