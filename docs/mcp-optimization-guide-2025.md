# MCP 최적화 가이드 2025

## 📋 개요

OpenManager VIBE v5의 MCP (Model Context Protocol) 서버 최적화 가이드입니다.
2025-07-28 업데이트로 WSL 환경 최적화 및 서브 에이전트 활용성을 대폭 개선했습니다.

## 🔧 최적화된 MCP 설정

### 1. 핵심 9개 MCP 서버 (우선순위 순)

| 순위 | MCP 서버 | 주요 기능 | 메모리 할당 | 상태 |
|------|----------|-----------|-------------|------|
| 1 | filesystem | 파일 읽기/쓰기/편집 | 6GB | ✅ 최우선 |
| 2 | github | GitHub 작업 | 4GB | ✅ 핵심 |
| 3 | memory | 지식 그래프 | 4GB | ✅ 핵심 |
| 4 | supabase | DB 작업 | 4GB | ✅ 핵심 |
| 5 | context7 | 라이브러리 문서 | 2GB | ✅ 중요 |
| 6 | tavily-mcp | 웹 검색 | 2GB | ✅ 중요 |
| 7 | sequential-thinking | 복잡한 분석 | 2GB | ✅ 유용 |
| 8 | playwright | 브라우저 자동화 | 4GB | ✅ 유용 |
| 9 | serena | 코드 분석 | 기본 | ✅ 전문 |

### 2. 버전 고정 및 안정성

```json
{
  "filesystem": "@modelcontextprotocol/server-filesystem@0.8.0",
  "github": "@modelcontextprotocol/server-github@0.8.0", 
  "memory": "@modelcontextprotocol/server-memory@0.8.0",
  "supabase": "@supabase/mcp-server-supabase@1.0.4",
  "context7": "@upstash/context7-mcp@0.2.1",
  "tavily-mcp": "tavily-mcp@0.2.9",
  "sequential-thinking": "@modelcontextprotocol/sequential-thinking@0.8.0",
  "playwright": "@playwright/mcp@0.1.1",
  "serena": "git+https://github.com/oraios/serena@v0.8.0"
}
```

### 3. WSL 환경 최적화

```json
"wslOptimizations": {
  "enableFileWatching": false,
  "useNativePathSeparators": true,
  "enableCaching": true
}
```

## 🤖 서브 에이전트 MCP 활용 가이드

### 필수 전제조건 체크리스트

#### 🔍 serena 사용 전
```bash
# 1. 프로젝트 활성화 (필수)
mcp__serena__activate_project /mnt/d/cursor/openmanager-vibe-v5

# 2. 온보딩 확인
mcp__serena__check_onboarding_performed

# 3. 필요시 온보딩 실행
mcp__serena__onboarding
```

#### 📚 context7 사용 전
```bash
# 1. 라이브러리 ID 검색
mcp__context7__resolve-library-id {"libraryName": "react"}

# 2. 문서 조회
mcp__context7__get-library-docs {"context7CompatibleLibraryID": "/facebook/react"}
```

#### 🗄️ supabase 사용 전
```bash
# 1. 프로젝트 목록 확인
mcp__supabase__list_projects

# 2. 프로젝트 ID 설정 (vnswjnltnhpsueosfhmw)
```

### 에이전트별 MCP 사용 패턴

#### 1. ai-systems-engineer 🤖
**주요 MCP**: supabase → memory → sequential-thinking → filesystem

```typescript
// 표준 작업 플로우
const workflow = [
  "mcp__supabase__list_tables", // DB 구조 파악
  "mcp__memory__search_nodes", // 기존 지식 검색
  "mcp__sequential-thinking__sequentialthinking", // 복잡한 분석
  "mcp__filesystem__read_file" // 코드 검토
];
```

#### 2. database-administrator 🗜️
**주요 MCP**: supabase → memory → filesystem → context7

```sql
-- 표준 DB 작업 플로우
1. mcp__supabase__execute_sql -- 현재 상태 조회
2. mcp__supabase__apply_migration -- 스키마 변경
3. mcp__memory__create_entities -- 변경사항 기록
4. mcp__context7__get-library-docs -- PostgreSQL 문서 참조
```

#### 3. code-review-specialist 🔍
**주요 MCP**: serena → filesystem → github → sequential-thinking

```typescript
// 코드 리뷰 플로우
const reviewProcess = [
  "mcp__serena__activate_project", // 프로젝트 준비
  "mcp__serena__get_symbols_overview", // 코드 구조 파악
  "mcp__serena__find_symbol", // 특정 심볼 검색
  "mcp__filesystem__read_file", // 파일 내용 확인
  "mcp__github__create_pull_request_review" // 리뷰 등록
];
```

#### 4. ux-performance-optimizer ⚡
**주요 MCP**: playwright → filesystem → tavily-mcp → context7

```javascript
// 성능 최적화 플로우
const perfOptimization = [
  "mcp__playwright__browser_navigate", // 페이지 로드
  "mcp__playwright__browser_snapshot", // 현재 상태 캡처
  "mcp__tavily-mcp__tavily-search", // 최적화 방법 검색
  "mcp__context7__get-library-docs", // Next.js 최적화 문서
  "mcp__filesystem__edit_file" // 코드 최적화 적용
];
```

#### 5. test-automation-specialist 🧪
**주요 MCP**: playwright → filesystem → github → serena

```typescript
// 테스트 자동화 플로우
const testAutomation = [
  "mcp__filesystem__search_files", // 테스트 파일 찾기
  "mcp__playwright__browser_generate_playwright_test", // 테스트 생성
  "mcp__serena__find_symbol", // 테스트 대상 코드 분석
  "mcp__github__push_files" // 테스트 코드 커밋
];
```

## 🎯 실전 활용 예시

### 1. 복잡한 DB 작업 (database-administrator)

```typescript
const dbTask = `
다음 MCP 도구들을 순서대로 사용해주세요:

1. mcp__supabase__list_tables
   - 현재 테이블 구조 파악

2. mcp__supabase__execute_sql 
   - 쿼리: "SELECT * FROM information_schema.columns WHERE table_schema = 'public'"
   - 컬럼 정보 상세 조회

3. mcp__memory__create_entities
   - 분석 결과를 지식 그래프에 저장

4. mcp__supabase__apply_migration
   - 필요한 스키마 변경 적용

각 단계별 결과를 다음 단계의 입력으로 활용하세요.
`;
```

### 2. 성능 분석 (ux-performance-optimizer)

```typescript
const perfAnalysis = `
다음 MCP 도구들을 사용해 성능 분석을 수행해주세요:

1. mcp__playwright__browser_navigate
   - URL: "http://localhost:3000"

2. mcp__playwright__browser_snapshot
   - 현재 페이지 상태 캡처

3. mcp__tavily-mcp__tavily-search
   - query: "Next.js 15 performance optimization 2025"

4. mcp__context7__resolve-library-id
   - libraryName: "next.js"

5. mcp__context7__get-library-docs
   - topic: "performance"

6. mcp__filesystem__read_file
   - path: "/mnt/d/cursor/openmanager-vibe-v5/src/app/layout.tsx"

7. mcp__sequential-thinking__sequentialthinking
   - 수집된 정보를 종합하여 최적화 방안 도출
`;
```

### 3. 코드 품질 검사 (code-review-specialist)

```typescript
const codeReview = `
다음 MCP 도구들을 사용해 코드 품질을 검사해주세요:

1. mcp__serena__activate_project
   - project: "/mnt/d/cursor/openmanager-vibe-v5"

2. mcp__serena__get_symbols_overview
   - relative_path: "src/components/ai"

3. mcp__serena__find_symbol
   - name_path: "AIAssistantAdminDashboard"
   - include_body: true

4. mcp__serena__find_referencing_symbols
   - name_path: "AIAssistantAdminDashboard"

5. mcp__memory__create_entities
   - 발견된 문제점들을 지식 그래프에 기록

6. mcp__filesystem__edit_file
   - 문제점 자동 수정

각 단계에서 발견된 이슈를 다음 단계에서 해결하는 방식으로 진행하세요.
`;
```

## 🚀 성능 최적화 팁

### 1. 메모리 관리
- filesystem: 6GB (가장 많이 사용)
- supabase, github, playwright: 4GB (중요 작업)
- 나머지: 2GB (일반 작업)

### 2. 캐싱 활용
```bash
# npm 캐시 최적화
npm config set cache ~/.npm-cache
npm config set prefer-offline true

# uv 캐시 최적화 (serena용)
export UV_CACHE_DIR="${HOME}/.cache/uv"
```

### 3. 연결 안정성
- 타임아웃: 30초
- 재시도: 3회
- 헬스체크: 5분마다

### 4. WSL 최적화
- 파일 와처 비활성화 (성능 향상)
- 네이티브 경로 사용
- 캐싱 활성화

## 🛠️ 트러블슈팅

### 1. MCP 서버 연결 실패
```bash
# 1. 환경변수 확인
echo $GITHUB_TOKEN
echo $SUPABASE_URL
echo $TAVILY_API_KEY

# 2. npx 캐시 초기화
npm cache clean --force
npx clear-npx-cache

# 3. 프로세스 종료 후 재시작
pkill -f "mcp"
```

### 2. serena 초기화 실패
```bash
# 1. uv 재설치
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. 캐시 정리
rm -rf ${HOME}/.cache/uv

# 3. 프로젝트 재활성화
uvx --from git+https://github.com/oraios/serena@v0.8.0 serena-mcp-server activate_project /mnt/d/cursor/openmanager-vibe-v5
```

### 3. playwright 브라우저 설치
```bash
# WSL에서 브라우저 설치
sudo apt update
sudo apt install chromium-browser

# playwright 브라우저 설치
npx playwright install chromium
```

## 📊 모니터링

### 1. MCP 서버 상태 확인
```bash
# API 엔드포인트
GET /api/mcp/health     # 헬스 체크
GET /api/mcp/metrics    # 메트릭스
GET /api/mcp/status     # 상태 정보
```

### 2. 메모리 사용량 모니터링
```bash
# Node.js 프로세스 모니터링
ps aux | grep "npx.*mcp"

# 메모리 사용량 확인
free -h
df -h
```

### 3. 로그 확인
```bash
# MCP 서버 로그
tail -f ~/.claude/logs/mcp-*.log

# Claude Code 로그
tail -f ~/.claude/logs/claude-code.log
```

## 🔄 정기 유지보수

### 일일 작업
- MCP 서버 헬스체크 확인
- 메모리 사용량 모니터링
- 실패한 작업 로그 검토

### 주간 작업
- npx 캐시 정리
- 환경변수 유효성 검증
- 성능 메트릭 분석

### 월간 작업
- MCP 서버 버전 업데이트 검토
- 설정 최적화 검토
- 백업 및 복원 테스트

## 📚 참고 자료

- [Claude MCP 공식 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [서브 에이전트 가이드](https://docs.anthropic.com/en/docs/claude-code/sub-agents)
- [WSL 최적화 가이드](./wsl-optimization-guide.md)
- [성능 모니터링 가이드](./performance-monitoring-guide.md)

---

**최종 업데이트**: 2025-07-28T08:30:00+09:00  
**버전**: 2.0.0  
**작성자**: MCP Server Admin  