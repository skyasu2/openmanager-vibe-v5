# 🗂️ MCP 설정 백업 - 2025년 7월 16일

## 📋 백업 목록

1. **mcp.json.backup**
   - 프로젝트 레벨 MCP 설정
   - filesystem, memory, github 서버 정의

2. **claude-mcp.json.backup**
   - Claude 전용 MCP 설정
   - .claude/mcp.json 파일 백업

3. **claude-settings.json.backup**
   - Claude 권한 설정
   - .claude/settings.local.json 파일 백업

## 🔧 복원 방법

```bash
# 프로젝트 MCP 설정 복원
cp docs/backup/mcp-2025-07-16/mcp.json.backup .mcp.json

# Claude MCP 설정 복원
cp docs/backup/mcp-2025-07-16/claude-mcp.json.backup .claude/mcp.json

# Claude 권한 설정 복원
cp docs/backup/mcp-2025-07-16/claude-settings.json.backup .claude/settings.local.json
```

## ⚠️ 주의사항

- GitHub 토큰이 포함되어 있으므로 외부 공유 금지
- 복원 전 현재 설정 백업 권장
- Claude Code 재시작 필요할 수 있음