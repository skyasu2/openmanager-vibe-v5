# 🔌 MCP 서버 완전 가이드

> Model Context Protocol 서버 통합 관리 가이드

## 🎯 개요

OpenManager VIBE v5에서 사용하는 11개 MCP 서버의 설치, 설정, 활용법을 총정리한 문서입니다.

## 📊 현재 MCP 서버 상태

**✅ 2025년 8월 12일 기준: 11/11 서버 100% 정상 작동!**

| 서버명 | 용도 | 타입 | 상태 |
|--------|------|------|------|
| `filesystem` | 파일 시스템 작업 | Node.js | ✅ |
| `memory` | 지식 그래프 관리 | Node.js | ✅ |
| `github` | GitHub 저장소 관리 | Node.js | ✅ |
| `sequential-thinking` | 복잡한 문제 해결 | Node.js | ✅ |
| `time` | 시간/시간대 변환 | Python | ✅ |
| `context7` | 라이브러리 문서 검색 | Node.js | ✅ |
| `shadcn-ui` | UI 컴포넌트 개발 | Node.js | ✅ |
| `tavily-mcp` | 웹 검색, 크롤링 | Node.js | ✅ |
| `supabase` | PostgreSQL 데이터베이스 | Node.js | ✅ |
| `playwright` | 브라우저 자동화 | Node.js | ✅ |
| `serena` | 고급 코드 분석 (LSP) | Python | ✅ |

## 🚀 빠른 설치 (권장)

### PowerShell 자동 설치
```powershell
# 완전 자동 설치 (11개 서버)
./scripts/install-all-mcp-servers.ps1

# 환경변수 서버 제외 설치
./scripts/install-all-mcp-servers.ps1 -SkipEnvServers

# MCP 환경변수 로드 및 시작
./scripts/start-claude-with-mcp.ps1
```

### Git Bash 자동 설치
```bash
# 완전 자동 설치
./scripts/install-all-mcp-servers.sh

# 환경변수 서버 제외
./scripts/install-all-mcp-servers.sh --skip-env

# MCP 환경변수 로드 및 시작
./scripts/start-claude-with-mcp.sh
```

## 📂 MCP 서버 카테고리별 분류

### 🔧 개발 도구 (4개)
- **filesystem**: 파일 읽기/쓰기, 디렉토리 탐색
- **github**: 저장소 관리, 이슈/PR 처리
- **sequential-thinking**: 단계별 문제 해결
- **serena**: LSP 기반 고급 코드 분석

### 🌐 외부 서비스 연동 (3개)
- **supabase**: PostgreSQL 데이터베이스 쿼리
- **tavily-mcp**: 웹 검색, 크롤링, 콘텐츠 추출
- **playwright**: 브라우저 자동화, 스크린샷

### 📚 지식 관리 (2개)
- **memory**: 대화 기록, 지식 그래프
- **context7**: 라이브러리/프레임워크 문서 검색

### 🎨 UI/UX 도구 (1개)
- **shadcn-ui**: UI 컴포넌트 생성 및 관리

### ⏰ 유틸리티 (1개)
- **time**: 정확한 시간 정보, 시간대 변환

## 🔑 핵심 MCP 서버 활용법

### 1. Filesystem - 파일 시스템 작업
```typescript
// 파일 읽기
mcp__filesystem__read_file({ path: "/path/to/file.ts" })

// 디렉토리 구조 확인
mcp__filesystem__list_directory({ path: "/src" })

// 파일 생성/수정
mcp__filesystem__write_file({ 
  path: "/new-file.ts", 
  contents: "content" 
})
```

### 2. Tavily MCP - 웹 인텔리전스
```typescript
// 최신 정보 검색 (1주일 이내)
mcp__tavily-mcp__tavily-search({
  query: "Next.js 15 features",
  time_range: "week",
  search_depth: "advanced"
})

// 웹사이트 크롤링
mcp__tavily-mcp__tavily-crawl({
  url: "https://docs.example.com",
  max_depth: 3
})

// 콘텐츠 추출
mcp__tavily-mcp__tavily-extract({
  urls: ["url1", "url2"],
  format: "markdown"
})
```

### 3. Time MCP - 정확한 시간 정보
```typescript
// 현재 시간 (한국 시간)
mcp__time__get_current_time({ timezone: "Asia/Seoul" })

// 시간대 변환
mcp__time__convert_timezone({
  datetime: "2025-08-12 14:30:00",
  from_timezone: "UTC",
  to_timezone: "Asia/Seoul"
})
```

### 4. Memory MCP - 지식 그래프
```typescript
// 정보 저장
mcp__memory__store({
  content: "프로젝트 중요 정보",
  metadata: { type: "project-info", priority: "high" }
})

// 정보 검색
mcp__memory__search({ query: "MCP 설정" })

// 관련 정보 찾기
mcp__memory__query({
  query: "최근 성능 개선 사항",
  max_results: 5
})
```

### 5. Supabase MCP - 데이터베이스
```typescript
// SQL 쿼리 실행
mcp__supabase__execute_query({
  query: "SELECT * FROM servers WHERE status = $1",
  params: ["active"]
})

// 테이블 스키마 확인
mcp__supabase__get_schema({ table: "servers" })
```

## ⚠️ 환경변수 설정

### 필수 환경변수
```env
# Supabase MCP
SUPABASE_URL=your_supabase_url
SUPABASE_ACCESS_TOKEN=your_access_token

# Tavily MCP  
TAVILY_API_KEY=your_tavily_api_key

# GitHub MCP
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token
```

### .env.local 설정
```bash
# 환경변수 템플릿 복사
cp .env.local.template .env.local

# 필요한 값들 설정
# MCP 관련 환경변수들도 포함되어 있음
```

## 🛠️ MCP 관리 명령어

### CLI 기반 관리
```bash
# MCP 서버 목록 확인
claude mcp list

# MCP 서버 추가
claude mcp add filesystem npx @modelcontextprotocol/server-filesystem

# MCP 서버 제거
claude mcp remove filesystem

# Claude API 재시작
claude api restart
```

### 상태 확인
```bash
# 연결 상태 확인
claude mcp status

# 로그 확인
claude logs
```

## 🔧 문제 해결

### 자주 발생하는 문제

#### 1. MCP 서버 연결 실패
```bash
# Claude API 재시작
claude api restart

# MCP 설정 확인
claude mcp list
```

#### 2. 환경변수 오류
```bash
# 환경변수 로드된 상태로 Claude 시작
./scripts/start-claude-with-mcp.ps1  # PowerShell
./scripts/start-claude-with-mcp.sh   # Git Bash
```

#### 3. Python MCP 서버 오류 (time, serena)
```bash
# uvx 절대 경로 확인
where uvx  # Windows
which uvx  # Linux/macOS

# Python 환경 확인
python --version
```

#### 4. NPX 기반 서버 오류
```bash
# NPX 캐시 정리
npx clear-npx-cache

# 글로벌 패키지 재설치
npm install -g @modelcontextprotocol/server-filesystem
```

## 📚 상세 가이드 링크

### 개별 MCP 서버 가이드
- **[Windows MCP 완전 설치 가이드](./technical/mcp/windows-mcp-complete-installation-guide.md)**
- **[MCP 환경변수 가이드](./technical/mcp/mcp-environment-variables-guide.md)**
- **[Tavily MCP 고급 활용](./technical/mcp/tavily-mcp-advanced-guide.md)**
- **[Serena MCP 설정 가이드](./technical/mcp/serena-mcp-setup-guide-2025.md)**

### 통합 개발 가이드
- **[MCP 개발 가이드 2025](./technical/mcp/mcp-development-guide-2025.md)**
- **[MCP 사용법 가이드](./technical/mcp/mcp-usage-guide-2025.md)**
- **[서브에이전트-MCP 매핑](./technical/ai-engines/sub-agents-mcp-mapping-guide.md)**

## 💡 고급 활용 팁

### 1. MCP 서버 체이닝
```typescript
// 여러 MCP 서버를 연계한 워크플로우
const searchResult = await mcp__tavily-mcp__tavily-search({...});
const analysis = await mcp__sequential-thinking__solve({
  problem: `분석해줘: ${searchResult.content}`
});
await mcp__memory__store({ content: analysis });
```

### 2. 병렬 MCP 호출
```typescript
// 독립적인 작업들을 병렬로 실행
const [timeInfo, githubStatus, fileList] = await Promise.all([
  mcp__time__get_current_time({ timezone: "Asia/Seoul" }),
  mcp__github__get_repository_info({ repo: "openmanager-vibe-v5" }),
  mcp__filesystem__list_directory({ path: "/src" })
]);
```

### 3. 조건부 MCP 활용
```typescript
// 환경이나 조건에 따라 다른 MCP 서버 활용
const shouldUseDatabase = process.env.NODE_ENV === 'production';
if (shouldUseDatabase) {
  await mcp__supabase__execute_query({...});
} else {
  await mcp__filesystem__write_file({...});
}
```

---

> **MCP 서버 관련 문제가 있나요?** [기술 문서](./technical/mcp/)를 확인하거나 이슈를 등록해주세요.