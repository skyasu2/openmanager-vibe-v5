# 📚 MCP (Model Context Protocol) 가이드 인덱스

> **최종 업데이트**: 2025년 7월 17일  
> **주의**: 이 문서는 MCP 관련 모든 가이드의 통합 인덱스입니다.

## 🆕 최신 가이드 (권장)

### [🚀 Claude Code MCP 설정 가이드 2025](./claude-code-mcp-setup-2025.md)
- **버전**: v2.1 (2025년 7월 16일 업데이트)
- **내용**: 최신 Claude Code의 MCP 설정 방법
- **특징**: Remote MCP, OAuth, SSE 지원

### [📊 MCP 통합 가이드](./mcp-unified-guide.md)
- 6개 공식 MCP 서버 설정 및 사용법
- filesystem, github, memory, supabase, context7, tavily

### [🔧 MCP 설정 지침](./mcp-setup-instructions.md)
- 빠른 설치 및 설정 방법
- 문제 해결 가이드

## 📦 아카이브 문서 (참고용)

> ⚠️ **주의**: 아카이브 문서들은 구버전 정보를 담고 있습니다. 최신 정보는 위의 문서를 참조하세요.

### 구버전 MCP 가이드
- [`/archive/mcp/MCP-GUIDE.md`](./archive/mcp/MCP-GUIDE.md) - 구버전 통합 가이드
- [`/archive/mcp/mcp-complete-guide.md`](./archive/mcp/mcp-complete-guide.md) - 구버전 상세 가이드
- [`/archive/claude-code-mcp-setup.md`](./archive/claude-code-mcp-setup.md) - 2024년 버전

### 특정 MCP 서버 가이드
- [`/archive/SUPABASE_MCP_USAGE.md`](./archive/SUPABASE_MCP_USAGE.md) - Supabase MCP 사용법
- [`/archive/tavily-mcp-guide.md`](./archive/tavily-mcp-guide.md) - Tavily MCP 가이드

### 아키텍처 문서
- [`/archive/MCP_ARCHITECTURE.md`](./archive/MCP_ARCHITECTURE.md) - MCP 아키텍처 설명
- [`/archive/mcp-server-architecture.md`](./archive/mcp-server-architecture.md) - 서버 구조

## 🎯 빠른 시작

### 1. 최신 설정 방법 (2025)

```bash
# Filesystem MCP
claude mcp add filesystem npx -y @modelcontextprotocol/server-filesystem .

# GitHub MCP (토큰 필요)
claude mcp add github -e GITHUB_TOKEN="YOUR_TOKEN" npx -y @modelcontextprotocol/server-github

# Supabase MCP
claude mcp add supabase npx -y @supabase/mcp-server-supabase --project-ref=YOUR_REF -e SUPABASE_ACCESS_TOKEN=YOUR_TOKEN
```

### 2. 대화형 메뉴

```bash
# MCP 관리 메뉴
/mcp
```

## 📝 마이그레이션 노트

### 구버전에서 이동 시
1. 기존 `.mcp.json` 파일 백업
2. 환경변수를 `.env` 파일로 이동
3. 새 명령어 구문 사용 (`claude mcp add`)

### 주요 변경사항
- **stdio → SSE**: 더 나은 성능과 안정성
- **로컬 전용 → Remote 지원**: 클라우드 MCP 서버 연결 가능
- **수동 설정 → OAuth**: 자동 인증 프로세스

## 🔗 관련 문서

- [AI 도구 가이드 v2](./ai-tools-guide-v2.md)
- [개발 도구 통합](./development-tools.md)
- [시스템 아키텍처](./system-architecture.md)

---

💡 **팁**: MCP 설정에 문제가 있다면 `/mcp` 명령어로 대화형 도움말을 확인하세요.