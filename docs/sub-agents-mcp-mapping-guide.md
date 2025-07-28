# 🤖 서브 에이전트와 MCP 서버 매핑 가이드

> **최종 업데이트**: 2025년 1월 28일  
> **용도**: 각 서브 에이전트가 효과적으로 사용할 수 있는 MCP 서버 매핑  
> **참고**: CLAUDE.md의 서브 에이전트 섹션 보완 문서

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
mcp__playwright__browser_navigate('http://localhost:3000');
const metrics = mcp__playwright__evaluate(`
  performance.getEntriesByType('navigation')[0]
`);

// Tavily - 최신 최적화 기법 검색
mcp__tavily - mcp__search('Next.js 15 performance optimization 2025');
```

### 8. **gemini-cli-collaborator** - AI 협업 전문가

#### 주요 MCP 활용 패턴

```bash
# 파일 내용을 Gemini에 전달
content=$(mcp__filesystem__read_file("src/complex-algorithm.ts"))
echo "$content" | gemini "이 알고리즘의 시간 복잡도를 분석해주세요"

# Git diff를 Gemini로 분석
mcp__github__get_diff("main", "feature-branch") | gemini "변경사항 리뷰"
```

### 9. **test-automation-specialist** - QA 자동화 엔지니어

#### 주요 MCP 활용 패턴

```typescript
// Playwright E2E 테스트
mcp__playwright__browser_navigate('/login');
mcp__playwright__browser_type('#email', 'test@example.com');
mcp__playwright__browser_click("button[type='submit']");
mcp__playwright__browser_wait_for({ text: 'Dashboard' });

// 테스트 결과 저장
mcp__github__create_or_update_file(
  'test-results/e2e-report.json',
  JSON.stringify(testResults)
);
```

### 10. **central-supervisor** - 중앙 오케스트레이터

#### 특별한 권한

- **모든 MCP 서버에 접근 가능**
- **다른 서브 에이전트 조율**
- **복잡한 멀티 태스크 관리**

#### 활용 예시

```typescript
Task(
  (subagent_type = 'central-supervisor'),
  (prompt = `전체 시스템 성능 개선 프로젝트:
  
  1. issue-summary로 현재 문제점 분석
  2. 병렬 실행:
     - database-administrator: DB 최적화
     - ux-performance-optimizer: 프론트엔드 개선
     - ai-systems-engineer: AI 응답 속도 개선
  3. test-automation-specialist로 개선 사항 검증
  4. doc-structure-guardian으로 변경사항 문서화
  
  모든 MCP 도구를 적절히 활용하여 작업을 완료하세요.`)
);
```

## 🚀 효과적인 MCP 활용 팁

### 1. **프롬프트에 MCP 도구 명시**

```typescript
// ❌ 나쁜 예
"데이터베이스를 최적화해주세요"

// ✅ 좋은 예
"mcp__supabase__list_tables로 테이블 확인 후,
 mcp__supabase__execute_sql로 인덱스 생성해주세요"
```

### 2. **단계별 가이드 제공**

```typescript
Task(
  (subagent_type = 'database-administrator'),
  (prompt = `
  Step 1: mcp__supabase__query로 pg_stat_user_tables 조회
  Step 2: 스캔 횟수가 많은 테이블 식별
  Step 3: mcp__supabase__execute_sql로 EXPLAIN ANALYZE 실행
  Step 4: 필요한 인덱스 생성
  `)
);
```

### 3. **전제조건 확인**

- **Serena**: 프로젝트 활성화 필요
- **Context7**: 라이브러리 ID 먼저 검색
- **Supabase**: 환경변수 설정 확인

### 4. **에러 처리**

```typescript
try {
  const result = await mcp__supabase__query(sql);
} catch (error) {
  // 폴백 전략 실행
  const cached = await mcp__memory__search_nodes('similar_query');
}
```

## 📊 MCP 사용률 최적화 전략

### 현재 상태 (83.3% 활용률)

- ✅ filesystem, github, memory: 100% 활용
- ✅ supabase, playwright: 80% 활용
- ⚠️ context7, tavily-mcp: 60% 활용
- ⚠️ sequential-thinking: 40% 활용
- ❌ serena: 20% 활용

### 개선 방안

1. **Serena 활용 증대**: 코드 리뷰 시 필수 사용
2. **Context7 통합**: 라이브러리 문서 조회 자동화
3. **Sequential-thinking**: 복잡한 문제에 적극 활용

## 🔗 관련 문서

- [CLAUDE.md](/CLAUDE.md) - 메인 프로젝트 가이드
- [claude-code-mcp-setup-2025.md](./claude-code-mcp-setup-2025.md) - MCP 설정 가이드
- [mcp-quick-guide.md](./mcp-quick-guide.md) - 빠른 시작 가이드
- [sub-agent-collaboration-patterns.md](./sub-agent-collaboration-patterns.md) - 협업 패턴

---

💡 **팁**: 이 가이드는 지속적으로 업데이트됩니다. 새로운 MCP 서버나 서브 에이전트가 추가되면 매핑을 업데이트해주세요.
