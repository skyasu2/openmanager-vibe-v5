# 🤖 서브 에이전트와 MCP 서버 매핑 가이드 v5.65.11

> **최종 업데이트**: 2025년 7월 28일  
> **버전**: v5.65.11  
> **용도**: 각 서브 에이전트가 효과적으로 사용할 수 있는 MCP 서버 매핑  
> **참고**: CLAUDE.md의 서브 에이전트 섹션 보완 문서  
> **⚠️ 중요**: MCP 설정이 CLI 기반으로 변경되었습니다. 최신 정보는 `/docs/mcp-servers-complete-guide.md` 참조

## 📋 빠른 참조표

| 서브 에이전트                  | 주요 MCP                                | 보조 MCP                      | 특화 작업     |
| ------------------------------ | --------------------------------------- | ----------------------------- | ------------- |
| **ai-systems-engineer**        | supabase, memory, sequential-thinking   | tavily-mcp, context7          | AI 최적화     |
| **mcp-server-admin**           | filesystem, tavily-mcp, github          | memory, sequential-thinking   | MCP 관리      |
| **issue-summary**              | supabase, filesystem, tavily-mcp        | memory, sequential-thinking   | 모니터링      |
| **database-administrator**     | supabase, filesystem, memory            | context7, sequential-thinking | DB 최적화     |
| **code-review-specialist**     | filesystem, github, serena              | context7, sequential-thinking | 코드 검토     |
| **doc-structure-guardian**     | filesystem, github, memory              | sequential-thinking           | 문서 관리     |
| **ux-performance-optimizer**   | filesystem, playwright, tavily-mcp      | context7, memory              | 성능 개선     |
| **gemini-cli-collaborator**    | filesystem, github, sequential-thinking | memory, tavily-mcp            | AI 협업       |
| **test-automation-specialist** | filesystem, playwright, github          | serena, context7, memory      | 테스트 자동화 |
| **central-supervisor**         | 모든 MCP 서버 접근 가능                 | -                             | 전체 조율     |

## 🎯 상세 매핑 가이드

### 1. **ai-systems-engineer** - AI 시스템 아키텍처 전문가

#### 주요 MCP 활용 패턴

```bash
# Supabase - AI 모델 메타데이터 및 임베딩 저장
mcp__supabase__query("SELECT * FROM ai_models WHERE status = 'active'")
mcp__supabase__execute_sql("INSERT INTO model_performance ...")

# Memory - AI 세션 컨텍스트 관리
mcp__memory__create_entities([{
  name: "AISessionContext",
  entityType: "Context",
  observations: ["모델 응답 시간", "토큰 사용량"]
}])

# Sequential Thinking - 복잡한 AI 파이프라인 설계
mcp__sequential-thinking__sequentialthinking({
  thought: "AI 폴백 전략 설계...",
  totalThoughts: 5
})
```

#### 실제 사용 예시

```typescript
// SimplifiedQueryEngine 최적화
Task(
  (subagent_type = 'ai-systems-engineer'),
  (prompt = `다음 작업을 수행하세요:
  1. mcp__supabase__list_tables로 AI 관련 테이블 확인
  2. mcp__memory__search_nodes로 이전 최적화 기록 조회
  3. mcp__sequential-thinking으로 성능 개선 전략 수립
  4. 개선된 엔진 구현 및 테스트`)
);
```

### 2. **mcp-server-admin** - MCP 인프라 엔지니어

#### 주요 MCP 활용 패턴

```bash
# Filesystem - MCP 설정 파일 관리
mcp__filesystem__read_file(".claude/mcp.json")
mcp__filesystem__write_file(".claude/mcp-backup.json", content)

# GitHub - MCP 설정 버전 관리
mcp__github__create_commit("feat: MCP 서버 설정 최적화")

# Tavily - 최신 MCP 업데이트 검색
mcp__tavily-mcp__search("@modelcontextprotocol latest updates")
```

#### 설정 검증 스크립트

```javascript
// MCP 서버 상태 확인
const servers = ['filesystem', 'github', 'memory', 'supabase', ...];
for (const server of servers) {
  const status = await checkMCPServer(server);
  console.log(`${server}: ${status}`);
}
```

### 3. **issue-summary** - DevOps 모니터링 엔지니어

#### 주요 MCP 활용 패턴

```bash
# Supabase - 로그 및 메트릭 조회
mcp__supabase__query(`
  SELECT * FROM error_logs
  WHERE created_at > NOW() - INTERVAL '1 hour'
  ORDER BY severity DESC
`)

# Filesystem - 로컬 로그 파일 분석
mcp__filesystem__read_file("/logs/application.log")

# Tavily - 외부 서비스 상태 확인
mcp__tavily-mcp__search("Vercel status page current incidents")
```

#### 자동 보고서 생성

```typescript
// 일일 상태 보고서
const report = {
  timestamp: new Date(),
  services: {
    vercel: await checkVercelStatus(),
    supabase: await checkSupabaseStatus(),
    redis: await checkRedisStatus(),
  },
  errors: await getRecentErrors(),
  recommendations: await generateRecommendations(),
};
```

### 4. **database-administrator** - 데이터베이스 최적화 전문가

#### 주요 MCP 활용 패턴

```sql
-- Supabase 직접 SQL 실행
mcp__supabase__execute_sql(`
  CREATE INDEX idx_user_activity ON user_sessions(user_id, created_at);
  ANALYZE user_sessions;
`)

-- 쿼리 성능 분석
mcp__supabase__query(`
  SELECT query, mean_exec_time, calls
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10
`)
```

#### RLS 정책 관리

```typescript
// Row Level Security 정책 생성
const rlsPolicy = `
  CREATE POLICY "Users can view own data" 
  ON user_data FOR SELECT 
  USING (auth.uid() = user_id)
`;
mcp__supabase__execute_sql(rlsPolicy);
```

### 5. **code-review-specialist** - 코드 품질 검토 전문가

#### 주요 MCP 활용 패턴

```bash
# Serena - 정적 코드 분석
mcp__serena__analyze_code("src/services/ai-engine.ts")

# GitHub - PR 리뷰 자동화
mcp__github__create_review_comment(
  owner, repo, pr_number,
  "DRY 원칙 위반: 이 로직은 utils/common.ts에 이미 구현되어 있습니다"
)

# Filesystem - 코드 패턴 검색
mcp__filesystem__search_pattern("console.log|debugger", "**/*.ts")
```

### 6. **doc-structure-guardian** - 문서 관리 전문가

#### 주요 MCP 활용 패턴

```bash
# 중복 문서 감지
mcp__filesystem__list_directory("docs/")
mcp__memory__create_entities([{
  name: "DocumentStructure",
  entityType: "Analysis",
  observations: ["52개 MCP 문서 발견", "15개 중복 의심"]
}])

# 문서 통합 작업
mcp__github__create_pull_request({
  title: "docs: MCP 문서 통합 및 정리",
  body: "JBGE 원칙에 따라 중복 제거"
})
```

### 7. **ux-performance-optimizer** - 프론트엔드 UX 엔지니어

#### 주요 MCP 활용 패턴

```javascript
// Playwright - 성능 측정
```
