# MCP 서버 유지보수 가이드

## 🚨 긴급 업데이트 (2025-07-15)

### Tavily와 Supabase MCP 수정 완료
- **문제**: 두 MCP 서버가 Claude Code에서 인식되지 않음
- **원인**:
  - Tavily: 래퍼 스크립트의 stdio 통신 처리 문제
  - Supabase: 환경변수 이름 불일치 (NEXT_PUBLIC_SUPABASE_URL)
- **해결**:
  - `.claude/mcp.json` 설정 수정 완료
  - Tavily: 직접 실행 방식으로 변경 (npx -y tavily-mcp)
  - Supabase: 환경변수 매핑 수정
  - `.env.local`에 필요한 환경변수 추가
- **필수 조치**: Claude Code 재시작 필요

자세한 내용은 [MCP-QUICK-FIX.md](../MCP-QUICK-FIX.md) 참조

## 🔧 현재 설정된 MCP 서버 (2025-07-15 업데이트)

| 서버 | 상태 | 설정 방식 | 환경변수 | 용도 |
|------|------|-----------|----------|------|
| filesystem | ✅ | npx | ALLOWED_DIRECTORIES | 파일 시스템 접근 |
| github | ✅ | npx | GITHUB_TOKEN | GitHub API 통합 |
| memory | ✅ | npx | - | 컨텍스트 메모리 |
| supabase | ✅ | npx | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY | 데이터베이스 |
| context7 | ✅ | npx | - | 문서 검색 |
| tavily | ✅ | npx | TAVILY_API_KEY | 웹 검색 |
| ~~gemini-cli-bridge~~ | ❌ | ~~node~~ | - | MCP 지원 중단 |

## 📁 설정 파일 구조

### 1. `.claude/mcp.json` - MCP 서버 정의
```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "--allowed-directories", "/mnt/d/cursor/openmanager-vibe-v5"],
      "env": {}
    }
  }
}
```

### 2. `.claude/settings.local.json` - 권한 및 활성화
```json
{
  "permissions": {
    "allow": [
      "mcp__filesystem__read_file",
      "mcp__github__get_file_contents"
    ]
  },
  "enableAllProjectMcpServers": true
}
```

## 🚀 문제 해결 체크리스트

### MCP 서버 연결 실패

1. **패키지 설치 확인**
   ```bash
   npm list @modelcontextprotocol/server-filesystem
   npm list @supabase/mcp-server-supabase
   ```

2. **환경변수 확인**
   ```bash
   echo $GITHUB_TOKEN
   echo $SUPABASE_URL
   echo $TAVILY_API_KEY
   ```

3. **Claude Code 재시작**
   ```bash
   # 모든 Claude 프로세스 종료
   pkill -f claude
   # 재시작
   claude
   ```

4. **설정 파일 확인**
   - `.claude/mcp.json` - MCP 서버 정의
   - `.claude/settings.local.json` - 권한 및 활성화 설정

### 특정 서버 문제 해결

#### Filesystem MCP
- **문제**: 경로 오류
- **해결**: WSL 환경에서는 `/mnt/d/cursor/openmanager-vibe-v5` 사용

#### GitHub MCP  
- **문제**: 토큰 인증 실패
- **해결**: `GITHUB_TOKEN` 환경변수 설정 확인

#### Supabase MCP
- **문제**: 데이터베이스 연결 실패
- **해결**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 확인

#### Tavily MCP
- **문제**: API 키 오류
- **해결**: `TAVILY_API_KEY` 환경변수 설정

## 📅 정기 점검 항목

### 월간 점검
- [ ] 모든 MCP 서버 연결 상태 확인
- [ ] API 키 만료일 확인
- [ ] 패키지 업데이트 확인
- [ ] 로그 파일 정리

### 분기별 점검
- [ ] 보안 취약점 스캔
- [ ] 사용하지 않는 MCP 서버 제거
- [ ] 문서 업데이트
- [ ] 성능 최적화

## 🔐 보안 관리

### 현재 적용된 보안 조치
1. **환경변수 관리**: API 키 등 민감 정보 분리
2. **권한 최소화**: 필요한 기능만 허용
3. **경로 제한**: 파일시스템 접근 범위 제한
4. **stdio 통신**: 로컬 통신으로 보안 강화

### 추가 권장사항
1. **API 키 순환**: 정기적인 API 키 변경
2. **로그 모니터링**: MCP 서버 접근 로그 확인
3. **업데이트**: MCP 패키지 정기 업데이트
4. **백업**: 설정 파일 정기 백업

## 🛠️ 트러블슈팅

### MCP 서버가 목록에 안 보일 때
1. `enableAllProjectMcpServers` 설정 확인
2. 서버 이름 오타 확인 (대소문자 구분)
3. Claude Code 재시작

### 권한 오류 발생 시
1. `.claude/settings.local.json`의 `permissions.allow` 배열 확인
2. 필요한 권한이 포함되어 있는지 확인
3. 권한 추가 후 Claude Code 재시작

### 환경변수 오류
1. `.env.local` 파일에서 환경변수 확인
2. 터미널에서 환경변수 로드 확인
3. MCP 서버 재시작

## 📊 모니터링 도구

### 현재 상태 확인
```bash
# MCP 서버 목록 확인
claude mcp list

# 패키지 설치 상태 확인
npm list | grep modelcontextprotocol

# 환경변수 확인
env | grep -E "(GITHUB|SUPABASE|TAVILY)"

# 로그 확인
ls -la ~/.claude/logs/
```

### 성능 모니터링
```bash
# MCP 서버 프로세스 확인
ps aux | grep modelcontextprotocol

# 메모리 사용량 확인
top -p $(pgrep -f modelcontextprotocol)

# 네트워크 연결 확인
netstat -tulpn | grep node
```

## 🔄 업데이트 프로세스

### 패키지 업데이트
```bash
# 오래된 패키지 확인
npm outdated

# MCP 패키지 업데이트
npm update @modelcontextprotocol/server-*

# 설정 파일 백업
cp .claude/mcp.json .claude/mcp.json.backup
cp .claude/settings.local.json .claude/settings.local.json.backup
```

### 설정 파일 백업
```bash
# 백업 스크립트
#!/bin/bash
BACKUP_DIR="mcp-backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp .claude/mcp.json $BACKUP_DIR/
cp .claude/settings.local.json $BACKUP_DIR/
echo "백업 완료: $BACKUP_DIR"
```

## 📋 정기 점검 스크립트

### 월간 점검 자동화
```bash
#!/bin/bash
echo "🔍 MCP 서버 월간 점검 시작..."

# 1. 패키지 상태 확인
echo "📦 패키지 상태 확인..."
npm list | grep modelcontextprotocol

# 2. 환경변수 확인
echo "🌍 환경변수 확인..."
env | grep -E "(GITHUB|SUPABASE|TAVILY)"

# 3. 설정 파일 백업
echo "💾 설정 파일 백업..."
cp .claude/mcp.json .claude/mcp.json.backup.$(date +%Y%m%d)
cp .claude/settings.local.json .claude/settings.local.json.backup.$(date +%Y%m%d)

# 4. 로그 정리
echo "🧹 로그 정리..."
find ~/.claude/logs/ -name "*.log" -mtime +30 -delete

echo "✅ 월간 점검 완료!"
```

이 가이드는 현재 프로젝트에 적용된 실제 MCP 설정을 기반으로 작성되었으며, WSL 환경에서 안정적으로 작동하는 방식을 반영합니다.