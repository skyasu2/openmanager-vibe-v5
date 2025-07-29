# ⚠️ MCP 설정 마이그레이션 안내

> **작성일**: 2025년 7월 29일  
> **중요**: Claude Code v1.16.0부터 MCP 설정 방식이 변경되었습니다.

## 변경사항

### 이전 방식 (더 이상 사용 안함)

- **설정 파일**: `.claude/mcp.json`
- **관리 방법**: 파일 직접 편집

### 새로운 방식 (현재)

- **설정 위치**: `~/.claude.json`의 projects 섹션
- **관리 방법**: `claude mcp` CLI 명령어

## 마이그레이션 완료

✅ 모든 MCP 서버가 CLI 방식으로 마이그레이션되었습니다.
✅ 구 설정 파일은 `mcp.json.legacy`로 백업되었습니다.

## MCP 서버 관리 명령어

```bash
# 서버 추가
claude mcp add <name> <command> -- <args>

# 서버 목록 확인
claude mcp list

# 서버 제거
claude mcp remove <name>

# API 재시작
claude api restart
```

## 현재 활성 서버 (10개)

모든 서버가 정상 연결된 상태입니다:

- filesystem, memory, github, supabase
- tavily-mcp, sequential-thinking, playwright
- time, context7, serena

## 추가 정보

상세한 가이드는 `/docs/mcp-servers-complete-guide.md`를 참조하세요.
