# 🔧 MCP 서버 완전 가이드

## 📌 MCP (Model Context Protocol) 개요

MCP는 Claude Code가 외부 시스템과 상호작용할 수 있게 해주는 프로토콜입니다. 11개의 핵심 서버를 통해 파일 시스템, 데이터베이스, 웹 서비스 등과 연동됩니다.

## 🚀 설치 및 설정

### Windows 설치
```powershell
# PowerShell 관리자 권한 실행
./scripts/install-all-mcp-servers.ps1

# 개별 설치
npm install -g @tavily/mcp
uvx --from serena serena
npm install -g @modelcontextprotocol/server-playwright
```

### 환경변수 설정 (.env.local)
```bash
# Tavily (웹 검색/크롤링)
TAVILY_API_KEY=tvly-dev-xxxxxxxxxxxxx

# Supabase (데이터베이스)
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxx
SUPABASE_PROJECT_ID=vnswjnltnhpsueosfhmw

# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx

# Context7 (문서 검색)
CONTEXT7_API_KEY=c7_xxxxxxxxxxxxx
```

## 📦 11개 핵심 MCP 서버

### 1. 🗂️ FileSystem MCP
**파일 시스템 작업**
```typescript
// 파일 검색
await mcp__filesystem__search_files({
  path: "./src",
  pattern: "*.test.ts",
  excludePatterns: ["node_modules"]
});

// 디렉토리 트리
await mcp__filesystem__directory_tree({
  path: "./src/services"
});

// 다중 파일 읽기
await mcp__filesystem__read_multiple_files({
  paths: ["package.json", "tsconfig.json", ".env.local"]
});
```

### 2. 🧠 Memory MCP
**지식 그래프 관리**
```typescript
// 엔티티 생성
await mcp__memory__create_entities({
  entities: [{
    name: "UserService",
    entityType: "Service",
    observations: ["인증 처리", "JWT 토큰 관리"]
  }]
});

// 관계 생성
await mcp__memory__create_relations({
  relations: [{
    from: "UserService",
    to: "Database",
    relationType: "uses"
  }]
});

// 지식 검색
await mcp__memory__search_nodes({
  query: "authentication"
});
```

### 3. 🐙 GitHub MCP
**GitHub 연동**
```typescript
// PR 생성
await mcp__github__create_pull_request({
  owner: "username",
  repo: "project",
  title: "✨ feat: 새 기능 추가",
  head: "feature-branch",
  base: "main",
  body: "## 변경사항\n- 기능 A 추가\n- 버그 B 수정"
});

// 파일 푸시
await mcp__github__push_files({
  owner: "username",
  repo: "project",
  branch: "main",
  files: [{
    path: "src/index.ts",
    content: "// 코드 내용"
  }],
  message: "📚 docs: README 업데이트"
});

// 이슈 생성
await mcp__github__create_issue({
  owner: "username",
  repo: "project",
  title: "버그: 로그인 실패",
  body: "재현 방법:\n1. ...",
  labels: ["bug", "urgent"]
});
```

### 4. 🗄️ Supabase MCP
**데이터베이스 관리**
```typescript
// SQL 실행
await mcp__supabase__execute_sql({
  project_id: "xxx",
  query: `
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
});

// RLS 정책 적용
await mcp__supabase__apply_migration({
  project_id: "xxx",
  name: "add_user_rls",
  query: `
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own data"
      ON users FOR SELECT
      USING (auth.uid() = id);
  `
});

// TypeScript 타입 생성
const types = await mcp__supabase__generate_typescript_types({
  project_id: "xxx"
});
```

### 5. 🔍 Tavily MCP
**웹 검색 및 크롤링**
```typescript
// 고급 검색
await mcp__tavily-mcp__tavily-search({
  query: "Next.js 15 새 기능",
  search_depth: "advanced",
  time_range: "week",
  max_results: 10,
  include_domains: ["nextjs.org", "vercel.com"]
});

// 웹 크롤링
await mcp__tavily-mcp__tavily-crawl({
  url: "https://docs.example.com",
  max_depth: 3,
  max_breadth: 20,
  categories: ["Documentation", "API"],
  instructions: "API 엔드포인트만 추출"
});

// 콘텐츠 추출
await mcp__tavily-mcp__tavily-extract({
  urls: ["https://blog.example.com/post1"],
  format: "markdown",
  include_images: true
});
```

### 6. 🎭 Playwright MCP
**브라우저 자동화**
```typescript
// 페이지 탐색
await mcp__playwright__browser_navigate({
  url: "https://app.example.com"
});

// 스냅샷 촬영
await mcp__playwright__browser_snapshot();

// 요소 클릭
await mcp__playwright__browser_click({
  element: "로그인 버튼",
  ref: "button[type='submit']"
});

// 텍스트 입력
await mcp__playwright__browser_type({
  element: "이메일 입력 필드",
  ref: "input[name='email']",
  text: "test@example.com"
});

// 스크린샷
await mcp__playwright__browser_take_screenshot({
  filename: "login-page.png",
  fullPage: true
});
```

### 7. ⏰ Time MCP
**시간대 관리**
```typescript
// 현재 시간 조회
await mcp__time__get_current_time({
  timezone: "Asia/Seoul"
});

// 시간대 변환
await mcp__time__convert_time({
  source_timezone: "Asia/Seoul",
  target_timezone: "America/New_York",
  time: "14:30"
});
```

### 8. 🧩 Sequential Thinking MCP
**체계적 문제 해결**
```typescript
await mcp__sequential-thinking__sequentialthinking({
  thought: "문제를 단계별로 분석해보자",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true,
  isRevision: false
});
```

### 9. 📚 Context7 MCP
**문서 검색**
```typescript
// 라이브러리 ID 해석
const libraryId = await mcp__context7__resolve-library-id({
  libraryName: "next.js"
});

// 문서 가져오기
await mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/vercel/next.js",
  topic: "app router",
  tokens: 10000
});
```

### 10. 🎨 Shadcn-UI MCP
**UI 컴포넌트**
```typescript
// 컴포넌트 목록
await mcp__shadcn-ui__list_shadcn_components();

// 컴포넌트 상세
await mcp__shadcn-ui__get_component_details({
  componentName: "button"
});

// 사용 예제
await mcp__shadcn-ui__get_component_examples({
  componentName: "dialog"
});
```

### 11. 🔬 Serena MCP
**코드 분석**
```typescript
// 심볼 검색
await mcp__serena__find_symbol({
  name_path: "UserService",
  relative_path: "src/services",
  include_body: true,
  depth: 1
});

// 참조 찾기
await mcp__serena__find_referencing_symbols({
  name_path: "authenticate",
  relative_path: "src/auth/auth.service.ts"
});

// 패턴 검색
await mcp__serena__search_for_pattern({
  substring_pattern: "TODO|FIXME|HACK",
  context_lines_before: 2,
  context_lines_after: 2
});
```

## 🎯 실전 활용 패턴

### 1. 파일 검색 → GitHub 커밋
```typescript
// 테스트 파일 찾기
const testFiles = await mcp__filesystem__search_files({
  pattern: "*.test.ts"
});

// 변경사항 커밋
await mcp__github__push_files({
  files: testFiles,
  message: "🧪 test: 테스트 커버리지 개선"
});
```

### 2. 웹 검색 → 문서 업데이트
```typescript
// 최신 정보 검색
const docs = await mcp__tavily-mcp__tavily-search({
  query: "React 19 새 기능",
  search_depth: "advanced"
});

// 문서 업데이트
await mcp__filesystem__write_file({
  path: "docs/react19-features.md",
  content: docs.formatted
});
```

### 3. DB 스키마 → TypeScript 타입
```typescript
// 스키마 생성
await mcp__supabase__apply_migration({
  query: "CREATE TABLE products (...)"
});

// 타입 생성
const types = await mcp__supabase__generate_typescript_types();

// 파일 저장
await mcp__filesystem__write_file({
  path: "src/types/database.ts",
  content: types
});
```

## ⚙️ 설정 파일

### claude_desktop_config.json
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "env": {
        "ALLOWED_DIRECTORIES": "D:\\cursor\\openmanager-vibe-v5"
      }
    },
    "tavily-mcp": {
      "command": "npx",
      "args": ["-y", "tavily-mcp"],
      "env": {
        "TAVILY_API_KEY": "${TAVILY_API_KEY}"
      }
    },
    "supabase": {
      "command": "npx",
      "args": ["supabase-mcp"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
      }
    }
  }
}
```

## 🚨 트러블슈팅

### MCP 서버 연결 실패
```bash
# 서버 상태 확인
claude mcp list

# 서버 재시작
claude mcp remove [server-name]
claude mcp add [server-name]

# 로그 확인
claude mcp logs [server-name]
```

### 권한 문제
```bash
# Windows PowerShell 관리자 권한
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# npm 전역 설치 권한
npm config set prefix "%APPDATA%\npm"
```

### 환경변수 미설정
```bash
# .env.local 확인
cat .env.local | grep TAVILY_API_KEY

# 환경변수 재로드
source .env.local  # Linux/Mac
$env:TAVILY_API_KEY = "tvly-xxx"  # Windows
```

## 📚 추가 자료

- [MCP 공식 문서](https://modelcontextprotocol.io/docs)
- [Claude Code MCP 가이드](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [MCP 서버 레지스트리](https://github.com/modelcontextprotocol/servers)