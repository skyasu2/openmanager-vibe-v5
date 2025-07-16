# 🎯 MCP (Model Context Protocol) 통합 가이드

> OpenManager VIBE v5의 MCP 도구 설정 및 사용법 완전 가이드

## 📋 개요

MCP는 Claude Code와 다양한 도구들을 연결하는 프로토콜입니다. OpenManager VIBE는 6개의 핵심 MCP 서버를 통합하여 강력한 개발 환경을 제공합니다.

## 🛠️ MCP 서버 목록

### 1. **filesystem** - 파일 시스템 접근
```bash
claude mcp add filesystem npx -y @modelcontextprotocol/server-filesystem .
```

### 2. **github** - GitHub API 통합
```bash
claude mcp add github -e GITHUB_TOKEN="YOUR_TOKEN" npx -y @modelcontextprotocol/server-github
```

### 3. **memory** - 컨텍스트 메모리
```bash
claude mcp add memory npx -y @modelcontextprotocol/server-memory
```

### 4. **supabase** - 데이터베이스 통합
```bash
claude mcp add supabase npx -y @supabase/mcp-server-supabase \
  --project-ref=YOUR_REF -e SUPABASE_ACCESS_TOKEN=YOUR_TOKEN
```

### 5. **context7** - 문서 검색
```bash
claude mcp add context7 npx -y @context7/mcp-server
```

### 6. **tavily** - AI 웹 검색
```bash
claude mcp add tavily -e TAVILY_API_KEY=YOUR_KEY npx -y @tavily/mcp-server
```

## 🚀 사용법

### 기본 사용 예시

```typescript
// 파일 읽기
mcp__filesystem__read_file({ path: "src/app/page.tsx" })

// GitHub 이슈 생성
mcp__github__create_issue({
  owner: "user",
  repo: "repo",
  title: "버그 수정",
  body: "상세 내용"
})

// 메모리 저장
mcp__memory__create_entities({
  entities: [{
    name: "프로젝트 구조",
    entityType: "정보",
    observations: ["Next.js 15 사용"]
  }]
})
```

## 📊 프로젝트별 활용

### OpenManager VIBE에서의 활용
- **filesystem**: 코드 분석 및 수정
- **github**: PR 생성 및 이슈 관리
- **memory**: 프로젝트 컨텍스트 유지
- **supabase**: 데이터베이스 스키마 관리
- **context7**: Next.js 문서 검색
- **tavily**: 최신 기술 동향 조사

## ⚙️ 설정 관리

### 환경별 스코프
- `local`: 현재 디렉토리만
- `project`: 프로젝트 전체
- `user`: 사용자 전역

### OAuth 인증 (Remote MCP)
```bash
# 대화형 메뉴
/mcp

# OAuth 서버 추가
claude mcp add linear-server https://api.linear.app/mcp
```

## 🔍 문제 해결

### 일반적인 문제
1. **토큰 오류**: 환경 변수 확인
2. **패키지 실행 실패**: npx 캐시 정리
3. **권한 문제**: 스코프 설정 확인

### 디버깅
```bash
# MCP 서버 상태 확인
/mcp

# 로그 확인
claude logs
```

## 📚 참고 자료

- [Claude Code MCP 설정 2025](./claude-code-mcp-setup-2025.md)
- [개발 도구 통합](./development-tools.md)
- [API 최적화 가이드](./api-optimization-guide.md)

---

**MCP로 더 빠르고 효율적인 개발을 경험하세요! 🚀**