# 서브 에이전트 에러 분석 및 해결 방안

## 작성일: 2025-01-27

### 📋 목차

1. [문제 분석](#문제-분석)
2. [표면적 원인](#표면적-원인)
3. [근본적 원인](#근본적-원인)
4. [구현된 해결책](#구현된-해결책)
5. [사용 가이드](#사용-가이드)
6. [모니터링](#모니터링)

---

## 🔍 문제 분석

서브 에이전트들이 Task 도구를 통해 실행될 때 다음과 같은 에러들이 발생:

- MCP 도구 접근 실패
- 환경변수 누락으로 인한 인증 실패
- 컨텍스트 부족으로 인한 작업 실패
- 에러 발생 시 복구 불가능

## 📌 표면적 원인

### 1. 환경변수 설정 문제

```bash
# 누락된 주요 환경변수
SUPABASE_PROJECT_REF    # Supabase MCP 필수
SUPABASE_ACCESS_TOKEN   # Supabase MCP 필수
GITHUB_TOKEN           # GitHub MCP 필수
TAVILY_API_KEY         # Tavily 검색 필수
```

### 2. 문법 오류

```python
# 잘못된 예시 (Python 스타일)
Task(subagent_type="ai-systems-engineer", ...)

# 올바른 예시 (JavaScript/TypeScript)
Task({
  subagent_type: "ai-systems-engineer",
  description: "작업 설명",
  prompt: "수행할 작업"
})
```

### 3. MCP 도구 접근 제한

- 서브 에이전트가 `mcp__*` 도구에 직접 접근 불가
- tools 필드에 MCP 도구를 명시하면 오히려 에러 발생

## 🎯 근본적 원인

### 1. 아키텍처 설계 문제

- **문제**: Task 도구와 서브 에이전트 간 연결 구조 미구현
- **영향**: 서브 에이전트가 독립된 환경에서 실행되어 상위 컨텍스트 접근 불가

### 2. 문서와 구현의 불일치

- **문제**: CLAUDE.md의 이상적인 설계와 실제 구현 차이
- **영향**: 개발자가 잘못된 가이드를 따라 에러 발생

### 3. 검증 시스템 부재

- **문제**: MCP 서버 시작 전 환경변수 검증 없음
- **영향**: 런타임에 예기치 않은 에러 발생

## 🛠️ 구현된 해결책

### 1. MCP 환경변수 검증 시스템

```typescript
// src/services/agents/mcp-validator.ts
export class MCPValidator {
  static validateEnvironment(): ValidationResult {
    // 전체 MCP 환경변수 검증
  }

  static validateForAgent(agentType: string): ValidationResult {
    // 특정 에이전트에 필요한 MCP 검증
  }
}
```

### 2. 에이전트 컨텍스트 제공자

```typescript
// src/services/agents/context-provider.ts
export class AgentContextProvider {
  static async buildContext(agentType: string): Promise<AgentContext> {
    // 프로젝트 정보, MCP 상태, 에이전트별 설정 제공
  }
}
```

### 3. 에러 복구 메커니즘

```typescript
// src/services/agents/error-recovery.ts
export class AgentErrorRecovery {
  static async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    context: RecoveryContext
  ): Promise<T> {
    // MCP 실패 시 대체 전략 실행
  }
}
```

### 4. MCP 사용 추적 시스템

```typescript
// src/services/agents/mcp-tracker.ts
export class MCPUsageTracker {
  static track(agentType: string, mcpTool: string, success: boolean): void {
    // 성공률, 응답 시간, 에러 패턴 추적
  }
}
```

### 5. 통합 헬퍼

```typescript
// src/services/agents/agent-helper.ts
export class AgentHelper {
  static async executeWithAgent(
    agentType: string,
    operation: string,
    task: () => Promise<any>,
    options?: AgentExecutionOptions
  ): Promise<AgentExecutionResult> {
    // 검증, 컨텍스트, 복구, 추적을 모두 포함한 실행
  }
}
```

## 📖 사용 가이드

### 1. 환경변수 설정

```bash
# .env.local에 추가
GITHUB_TOKEN=ghp_your_personal_access_token
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_ACCESS_TOKEN=sbp_your_access_token
TAVILY_API_KEY=tvly-your_api_key
```

### 2. 서브 에이전트 실행

```typescript
// 개선된 실행 방법
const result = await AgentHelper.executeWithAgent(
  'ai-systems-engineer',
  'optimize-engine',
  async () => {
    // 실제 작업 로직
    return await optimizeQueryEngine();
  },
  {
    validateMCP: true, // MCP 검증
    includeContext: true, // 컨텍스트 포함
    trackUsage: true, // 사용 추적
    enableRecovery: true, // 에러 복구
  }
);
```

### 3. 상태 확인

```bash
# API를 통한 상태 확인
GET /api/agents/health

# 응답 예시
{
  "success": true,
  "system": {
    "healthy": true,
    "recommendations": []
  },
  "agents": [
    {
      "agent": "ai-systems-engineer",
      "ready": true,
      "issues": []
    }
  ]
}
```

## 📊 모니터링

### 1. 사용 통계 확인

```typescript
const report = AgentHelper.generateUsageReport();
console.log(report);
```

### 2. 에이전트별 디버그

```typescript
const debug = await AgentHelper.debugAgent('database-administrator');
console.log(debug);
```

### 3. 시스템 건강 상태

```typescript
const health = await AgentHelper.checkSystemHealth();
if (!health.healthy) {
  console.warn('시스템 문제:', health.recommendations);
}
```

## 🎯 모범 사례

### 1. 항상 환경변수 검증

```typescript
const preparation = await AgentHelper.prepareAgentExecution(agentType);
if (!preparation.ready) {
  console.error('준비 실패:', preparation.issues);
  return;
}
```

### 2. 병렬 실행 활용

```typescript
const [result1, result2] = await Promise.all([
  AgentHelper.executeWithAgent('ux-performance-optimizer', ...),
  AgentHelper.executeWithAgent('database-administrator', ...)
]);
```

### 3. 에러 처리

```typescript
const result = await AgentHelper.executeWithAgent(...);
if (!result.success) {
  // 에러 처리 로직
  console.error('실행 실패:', result.error);
  console.log('검증 이슈:', result.validationIssues);
}
```

## 🔄 마이그레이션 가이드

### 기존 코드

```python
# 잘못된 방식
Task(subagent_type="ai-systems-engineer", prompt="작업")
```

### 개선된 코드

```typescript
// 올바른 방식
await AgentHelper.executeWithAgent(
  'ai-systems-engineer',
  'operation-name',
  async () => {
    // Task 호출 또는 직접 구현
    return await performTask();
  }
);
```

## 📝 체크리스트

- [ ] 필수 환경변수 설정 (.env.local)
- [ ] AgentHelper 임포트
- [ ] 에러 처리 구현
- [ ] 사용 추적 활성화
- [ ] 정기적인 상태 모니터링

## 🚀 다음 단계

1. **단기 (1주일)**
   - 모든 서브 에이전트 호출을 AgentHelper로 마이그레이션
   - 환경변수 자동 설정 스크립트 작성

2. **중기 (2주일)**
   - 대시보드 UI 구현
   - 실시간 모니터링 시스템 구축

3. **장기 (1개월)**
   - AI 기반 자동 최적화
   - 서브 에이전트 자동 스케일링

---

**작성자**: Claude Code Assistant  
**검토**: AI Systems Engineer Sub-Agent
