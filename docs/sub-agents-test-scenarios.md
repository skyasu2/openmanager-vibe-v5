# 서브 에이전트 MCP 동작 테스트 시나리오

## 테스트 일자: 2025-01-27

### 테스트 목적

각 서브 에이전트가 MCP 도구를 올바르게 활용하여 실제 작업을 수행할 수 있는지 검증

### 테스트 시나리오

#### 1. ai-systems-engineer 테스트

**목적**: AI 시스템 성능 최적화 및 MCP 통합 검증

```bash
Task(
  subagent_type="ai-systems-engineer",
  description="SimplifiedQueryEngine 성능 분석",
  prompt="src/services/ai/SimplifiedQueryEngine.ts 파일을 분석하고 성능 개선점을 찾아주세요. memory MCP를 활용하여 분석 결과를 저장하고, supabase MCP로 쿼리 성능 메트릭을 확인하세요."
)
```

#### 2. database-administrator 테스트

**목적**: 데이터베이스 최적화 및 쿼리 성능 개선

```bash
Task(
  subagent_type="database-administrator",
  description="pgvector 인덱스 최적화",
  prompt="Supabase의 pgvector 인덱스 상태를 확인하고 최적화 방안을 제시하세요. supabase MCP를 사용하여 현재 인덱스를 분석하고, memory MCP에 최적화 패턴을 저장하세요."
)
```

#### 3. code-review-specialist 테스트

**목적**: 코드 품질 검토 및 보안 취약점 검사

```bash
Task(
  subagent_type="code-review-specialist",
  description="AI 서비스 보안 검토",
  prompt="src/services/ai 폴더의 코드를 검토하여 보안 취약점을 찾아주세요. serena MCP를 사용하여 심층 분석을 수행하고, github MCP로 관련 이슈를 확인하세요."
)
```

#### 4. doc-structure-guardian 테스트

**목적**: 문서 구조 정리 및 위반사항 검사

```bash
Task(
  subagent_type="doc-structure-guardian",
  description="루트 디렉토리 문서 검사",
  prompt="루트 디렉토리의 문서 파일을 검사하고 CLAUDE.md 규칙 위반사항을 찾아주세요. filesystem MCP로 파일을 스캔하고, memory MCP에 위반 이력을 기록하세요."
)
```

#### 5. ux-performance-optimizer 테스트

**목적**: 프론트엔드 성능 최적화

```bash
Task(
  subagent_type="ux-performance-optimizer",
  description="Core Web Vitals 분석",
  prompt="Next.js 애플리케이션의 Core Web Vitals를 분석하고 개선점을 제시하세요. playwright MCP로 성능 테스트를 수행하고, tavily-mcp로 최신 최적화 기법을 검색하세요."
)
```

#### 6. mcp-server-admin 테스트

**목적**: MCP 서버 설정 관리 및 최적화

```bash
Task(
  subagent_type="mcp-server-admin",
  description="MCP 서버 상태 점검",
  prompt=".claude/mcp.json 파일을 분석하고 모든 MCP 서버의 설정이 올바른지 확인하세요. filesystem MCP로 설정을 읽고, tavily-mcp로 최신 MCP 업데이트를 확인하세요."
)
```

#### 7. issue-summary 테스트

**목적**: 시스템 모니터링 및 이슈 보고

```bash
Task(
  subagent_type="issue-summary",
  description="서비스 상태 종합 점검",
  prompt="모든 외부 서비스(Vercel, Supabase, Redis)의 상태를 점검하고 이슈를 보고하세요. supabase MCP로 DB 상태를 확인하고, tavily-mcp로 서비스 상태 페이지를 확인하세요."
)
```

#### 8. gemini-cli-collaborator 테스트

**목적**: Gemini CLI와의 협업 검증

```bash
Task(
  subagent_type="gemini-cli-collaborator",
  description="복잡한 코드 분석 협업",
  prompt="src/services/ai/UnifiedAIEngineRouter.ts의 복잡한 로직을 Gemini와 함께 분석하세요. filesystem MCP로 코드를 읽고, sequential-thinking MCP로 분석 전략을 수립하세요."
)
```

#### 9. test-automation-specialist 테스트

**목적**: 테스트 코드 생성 및 실행

```bash
Task(
  subagent_type="test-automation-specialist",
  description="AI 서비스 테스트 생성",
  prompt="src/services/ai/SimplifiedQueryEngine.ts에 대한 단위 테스트를 생성하세요. filesystem MCP로 코드를 분석하고, playwright MCP로 통합 테스트도 작성하세요."
)
```

#### 10. agent-evolution-manager 테스트

**목적**: 에이전트 성능 분석 및 자동 개선

```bash
Task(
  subagent_type="agent-evolution-manager",
  description="에이전트 성능 리뷰",
  prompt="모든 서브 에이전트의 최근 실행 로그를 분석하고 성능 개선점을 찾아주세요. memory MCP로 성능 데이터를 저장하고, sequential-thinking MCP로 개선 전략을 수립하세요."
)
```

### 테스트 실행 계획

1. **개별 테스트**: 각 시나리오를 순차적으로 실행
2. **MCP 상속 확인**: 각 에이전트가 MCP 도구를 실제로 사용하는지 로그 확인
3. **결과 검증**: 예상된 MCP 도구가 활용되었는지 확인
4. **성능 측정**: 각 작업의 소요 시간 및 리소스 사용량 측정

### 예상 결과

- 모든 에이전트가 recommended_mcp에 정의된 MCP 도구를 자동으로 상속받아 사용
- 각 에이전트의 전문성에 맞는 MCP 조합이 효과적으로 활용됨
- MCP 도구 직접 명시 없이도 정상 동작 확인

### 성공 기준

1. ✅ 각 에이전트가 Task 도구를 통해 정상 실행
2. ✅ MCP 도구가 자동으로 상속되어 사용 가능
3. ✅ 각 작업이 의도한 결과를 생성
4. ✅ 에러 없이 모든 테스트 완료
