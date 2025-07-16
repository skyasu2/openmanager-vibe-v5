# MCP (Model Context Protocol) 가이드

> ⚠️ **이 문서는 구 버전입니다**
> 
> **최신 Claude Code MCP 설정 가이드는 [claude-code-mcp-setup-2025.md](./claude-code-mcp-setup-2025.md)를 참조하세요.**

## 변경 사항

### 이전 방식 (더 이상 사용하지 않음)
- `.claude/mcp.json` 파일 직접 편집
- JSON 형식으로 서버 정의

### 현재 방식 (권장)
- Claude Code CLI 사용: `claude mcp add`
- 설정이 `~/.claude.json`에 자동 저장
- 환경변수는 `.env.local`에서 관리

## 마이그레이션
1. 기존 `.claude/mcp.json` 백업
2. `docs/MCP-GUIDE.md` 참조하여 CLI로 재설정
3. 구 설정 파일 제거

자세한 내용은 [MCP-GUIDE.md](./MCP-GUIDE.md)를 확인하세요.