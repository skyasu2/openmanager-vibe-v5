# MCP 서버 설정 리포트

**작성일**: 2025-07-25
**작업**: Linear 및 Puppeteer MCP 서버 추가

## 요약

사용자의 요청에 따라 Linear MCP Server와 Puppeteer MCP Server를 프로젝트에 추가하려고 시도했습니다.

## 작업 내용

### 1. 현재 MCP 서버 상태 확인

설치된 서버 목록:

- ✅ filesystem
- ✅ memory
- ✅ sequential-thinking
- ✅ github
- ✅ context7
- ✅ tavily-mcp
- ✅ supabase
- ✅ serena

### 2. Linear MCP Server 추가

**패키지 정보**:

- 공식 Linear MCP 서버: `https://mcp.linear.app/sse`
- 설치 방법: `npx -y mcp-remote https://mcp.linear.app/sse`
- 상태: ❌ 연결 실패

**문제점**:

- `mcp-remote` 패키지가 URL 파싱 오류 발생
- Linear의 공식 원격 MCP 서버는 인증이 필요할 수 있음

### 3. Puppeteer MCP Server 추가

**패키지 정보**:

- NPM 패키지: `@modelcontextprotocol/server-puppeteer`
- 버전: 2025.5.12
- 상태: ❌ Deprecated (더 이상 지원되지 않음)

**문제점**:

- 패키지가 deprecated되어 더 이상 사용할 수 없음
- NPM에서 공식적으로 지원 중단됨

## 변경사항

### .mcp.json 파일 업데이트

```json
{
  "mcpServers": {
    // ... 기존 서버들 ...
    "linear": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.linear.app/sse"],
      "env": {}
    },
    "puppeteer": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"],
      "env": {}
    }
  }
}
```

### Claude Code CLI 설정

```bash
# Linear 서버 추가
claude mcp add linear "npx -y mcp-remote https://mcp.linear.app/sse"

# Puppeteer 서버 추가
claude mcp add puppeteer "npx -y @modelcontextprotocol/server-puppeteer"
```

## 권장사항

### Linear MCP Server

1. **대안 1**: 커뮤니티 버전 사용

   ```bash
   claude mcp add linear "npx -y linear-mcp-server"
   ```

2. **대안 2**: 환경변수 설정 후 재시도
   - Linear API 키가 필요할 수 있음
   - `.env.local`에 `LINEAR_API_KEY` 추가

### Puppeteer MCP Server

1. **대안 1**: 커뮤니티 구현 사용

   ```bash
   claude mcp add puppeteer "npx -y puppeteer-mcp-server"
   ```

2. **대안 2**: Playwright MCP Server 사용
   - Puppeteer의 대안으로 Playwright 기반 서버 고려

## 다음 단계

1. Linear API 키 설정 확인
2. 대체 브라우저 자동화 MCP 서버 조사
3. 필요한 경우 커스텀 MCP 서버 개발 고려

## 참고자료

- [Linear MCP 공식 문서](https://linear.app/changelog/2025-05-01-mcp)
- [MCP Servers 디렉토리](https://mcpservers.org/)
- [Model Context Protocol 공식 문서](https://modelcontextprotocol.io/)
