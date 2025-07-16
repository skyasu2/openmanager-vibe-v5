# 🔧 MCP 서버 설정 완료 가이드

## 🚨 알려진 문제 및 해결법 (2025년 7월 업데이트)

### 주요 문제점들

#### 1. 잘못된 패키지명 문제
**증상:**
- Tavily MCP 서버 실패
- `@tavily/mcp-server` 패키지를 찾을 수 없음 (npm error 404)
- MCP 도구 사용 시 "No such tool available" 오류

**원인:**
- 잘못된 패키지명 사용 (`@tavily/mcp-server` → `tavily-mcp`)
- 패키지명이 변경되었으나 문서가 업데이트되지 않음

**해결법:**
```bash
# 올바른 Tavily MCP 패키지 사용
claude mcp add tavily -e TAVILY_API_KEY="YOUR_KEY" -- npx -y tavily-mcp
```

#### 2. 중복 설정 문제
**증상:**
- `/mcp` 명령 실행 시 응답 없음
- `claude mcp list`와 `.mcp.json`의 서버가 불일치
- MCP 도구 사용 시 "No such tool available" 오류

**원인:**
- 동일한 MCP 서버가 여러 스코프(local, project, user)에 중복 설정
- `.mcp.json`과 Claude CLI 설정 간 충돌

#### 3. stdio transport 프로토콜 오류
**증상:**
- "protocolVersion validation error" 메시지
- MCP 서버가 시작되지만 도구가 노출되지 않음
- GitHub Issue #768, #3487 참조

#### 4. 환경 변수 전달 버그
**증상:**
- filesystem, memory는 작동하지만 API 키가 필요한 서버들은 실패
- supabase, tavily, context7 MCP가 작동하지 않음
- GitHub Issue #1254 참조

### 🚀 빠른 해결법

```bash
# 1. 진단 모드로 문제 확인
./scripts/fix-mcp-servers.sh --diagnose

# 2. 자동 복구 스크립트 실행
./scripts/fix-mcp-servers.sh

# 3. Claude Code 재시작 필수!
claude  # 종료 후 다시 실행
```

## ✅ 현재 설정된 MCP 서버

다음 MCP 서버들이 성공적으로 설정되었습니다:

1. **filesystem** - 파일 시스템 접근
2. **memory** - 컨텍스트 메모리 관리
3. **github** - GitHub API 통합
4. **supabase** - 데이터베이스 통합
5. **tavily** - AI 웹 검색
6. **context7** - 문서 검색

## 🔑 환경변수가 필요한 서버 설정

나머지 서버들은 환경변수 설정 후 추가하세요:

### 1. GitHub MCP 서버

```bash
# GitHub Personal Access Token 생성 후
claude mcp add github -e GITHUB_TOKEN="YOUR_GITHUB_TOKEN" -- npx -y @modelcontextprotocol/server-github
```

### 2. Supabase MCP 서버

```bash
# Supabase 프로젝트 정보 준비 후
claude mcp add supabase \
  -e SUPABASE_URL="YOUR_SUPABASE_URL" \
  -e SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY" \
  -- npx -y @supabase/mcp-server-supabase
```

### 3. Tavily MCP 서버 (AI 웹 검색)

```bash
# Tavily API 키 생성 후 (올바른 패키지명 사용)
claude mcp add tavily -e TAVILY_API_KEY="YOUR_TAVILY_KEY" -- npx -y tavily-mcp
```

## 📋 설정 확인 방법

```bash
# 현재 설정된 MCP 서버 목록 확인
claude mcp list

# Claude Code 내에서 /mcp 명령으로 상태 확인
/mcp
```

## 🚀 MCP 서버 사용하기

Claude Code에서 다음과 같이 사용할 수 있습니다:

```typescript
// Filesystem MCP
mcp__filesystem__read_file({ path: "src/app/page.tsx" })
mcp__filesystem__list_directory({ path: "src" })

// Memory MCP
mcp__memory__create_entities({ entities: [...] })
mcp__memory__search_nodes({ query: "프로젝트" })

// Context7 MCP
mcp__context7__resolve-library-id({ libraryName: "next.js" })
mcp__context7__get-library-docs({ context7CompatibleLibraryID: "/vercel/next.js" })
```

## 🔄 프로젝트 전체에서 사용하기

현재는 로컬 스코프로 설정되어 있습니다. 팀과 공유하려면:

```bash
# 프로젝트 스코프로 변경 (.mcp.json 파일 생성)
claude mcp add filesystem -s project -- npx -y @modelcontextprotocol/server-filesystem .
```

## ⚠️ 주의사항

- 환경변수에는 실제 값을 넣어주세요 (YOUR_XXX 부분)
- API 키는 절대 Git에 커밋하지 마세요
- `.env.local` 파일에 환경변수를 저장하고 `.gitignore`에 추가하세요

## 🔍 문제 해결 가이드

### MCP 도구가 작동하지 않을 때

1. **증상 확인**
   ```bash
   # Claude Code 내에서
   /mcp  # MCP 상태 확인
   ```

2. **환경 변수 확인**
   ```bash
   # .env.local 파일의 환경 변수 확인
   cat .env.local | grep -E "(TAVILY|SUPABASE|GITHUB)"
   ```

3. **자동 수정 스크립트 실행**
   ```bash
   ./scripts/fix-mcp-servers.sh
   ```

4. **Claude Code 재시작**
   - 터미널에서 `claude` 종료 후 다시 실행
   - 또는 `/restart` 명령 사용

5. **수동으로 MCP 재설정**
   ```bash
   # 문제가 있는 서버 제거
   claude mcp remove supabase
   
   # 환경 변수와 함께 다시 추가
   claude mcp add supabase \
     -e SUPABASE_URL="$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2)" \
     -e SUPABASE_SERVICE_ROLE_KEY="$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d'=' -f2)" \
     -- npx -y @supabase/mcp-server-supabase
   ```

### 로그 확인

MCP 관련 로그 위치:
- Windows: `%APPDATA%\Claude\logs\mcp-*.log`
- macOS: `~/Library/Logs/Claude/mcp-*.log`
- Linux: `~/.config/Claude/logs/mcp-*.log`

## 📚 참고 자료

- [Claude Code MCP 공식 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [Model Context Protocol 사양](https://modelcontextprotocol.io/)
- [GitHub Issue #1254 - 환경 변수 버그](https://github.com/anthropics/claude-code/issues/1254)