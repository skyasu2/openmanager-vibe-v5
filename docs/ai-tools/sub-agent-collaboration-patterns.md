# 서브 에이전트 협업 패턴 가이드

> 작성일: 2025.01.27  
> 상태: 구현 가이드

## 🎯 개요

Claude Code의 서브 에이전트들이 효과적으로 협업할 수 있는 패턴과 실제 구현 예시를 제공합니다.

## 🏗️ 협업 아키텍처

### 1. 병렬 처리 패턴 (Parallel Processing)

여러 에이전트가 동시에 독립적인 작업을 수행합니다.

```typescript
// 예시: 종합 시스템 분석
async function comprehensiveSystemAnalysis() {
  const tasks = await Promise.all([
    // 데이터베이스 분석
    Task({
      subagent_type: 'database-administrator',
      description: 'DB 성능 분석',
      prompt: '현재 데이터베이스의 인덱싱 상태와 쿼리 성능을 분석해주세요.',
    }),

    // 코드 품질 검토
    Task({
      subagent_type: 'code-review-specialist',
      description: '코드 품질 검토',
      prompt: '최근 커밋의 보안 취약점과 성능 이슈를 검토해주세요.',
    }),

    // 프론트엔드 성능
    Task({
      subagent_type: 'ux-performance-optimizer',
      description: 'UX 성능 분석',
      prompt: 'Core Web Vitals와 번들 크기를 분석해주세요.',
    }),
  ]);

  return synthesizeResults(tasks);
}
```

### 2. 순차 처리 패턴 (Sequential Processing)

한 에이전트의 출력이 다음 에이전트의 입력이 되는 파이프라인 패턴입니다.

```typescript
// 예시: 기능 구현 워크플로우
async function implementFeatureWorkflow(featureDescription: string) {
  // 1단계: AI 시스템 설계
  const design = await Task({
    subagent_type: 'ai-systems-engineer',
    description: '기능 설계',
    prompt: `다음 기능을 위한 시스템 설계를 제안해주세요: ${featureDescription}`,
  });

  // 2단계: 테스트 케이스 작성
  const tests = await Task({
    subagent_type: 'test-automation-specialist',
    description: '테스트 작성',
    prompt: `다음 설계에 대한 테스트 케이스를 작성해주세요:\n${design.response}`,
  });

  // 3단계: 구현 (메인 에이전트)
  const implementation = await implementFeature(design, tests);

  // 4단계: 코드 리뷰
  const review = await Task({
    subagent_type: 'code-review-specialist',
    description: '코드 리뷰',
    prompt: `구현된 코드를 리뷰하고 개선점을 제안해주세요:\n${implementation}`,
  });

  return { design, tests, implementation, review };
}
```

### 3. 계층적 협업 패턴 (Hierarchical Collaboration)

에이전트 진화 관리자가 다른 에이전트들을 오케스트레이션합니다.

```typescript
// 예시: 자동 성능 최적화
async function autoPerformanceOptimization() {
  // 진화 관리자가 전체 프로세스 관리
  return await Task({
    subagent_type: 'agent-evolution-manager',
    description: '시스템 전체 최적화',
    prompt: `
      시스템 전체의 성능을 분석하고 최적화해주세요.
      필요시 다른 에이전트들을 활용하여:
      1. 현재 병목점 식별
      2. 개선 방안 제시
      3. 구현 및 검증
      4. 결과 보고서 작성
    `,
  });
}
```

## 📋 실용적인 협업 시나리오

### 시나리오 1: 버그 수정 워크플로우

```typescript
async function bugFixWorkflow(bugReport: string) {
  // 1. 이슈 분석
  const analysis = await Task({
    subagent_type: 'issue-summary',
    description: '버그 분석',
    prompt: `버그 리포트를 분석하고 원인을 파악해주세요: ${bugReport}`,
  });

  // 2. 데이터베이스 영향 확인
  const dbImpact = await Task({
    subagent_type: 'database-administrator',
    description: 'DB 영향 분석',
    prompt: `이 버그가 데이터베이스에 미치는 영향을 분석해주세요: ${analysis.response}`,
  });

  // 3. 수정 및 테스트
  // ... 구현 코드

  // 4. 문서 업데이트
  const docUpdate = await Task({
    subagent_type: 'doc-structure-guardian',
    description: '문서 업데이트',
    prompt: '버그 수정 내용을 문서에 반영해주세요.',
  });
}
```

### 시나리오 2: 새로운 API 엔드포인트 추가

```typescript
async function addAPIEndpoint(specification: string) {
  const tasks = [];

  // 병렬 작업 1: 설계 & 테스트 계획
  tasks.push(
    Task({
      subagent_type: 'ai-systems-engineer',
      description: 'API 설계',
      prompt: `RESTful API 엔드포인트 설계: ${specification}`,
    }),
    Task({
      subagent_type: 'test-automation-specialist',
      description: '테스트 계획',
      prompt: `API 테스트 전략 수립: ${specification}`,
    })
  );

  const [design, testPlan] = await Promise.all(tasks);

  // 순차 작업: 구현 → 리뷰 → 문서화
  // ... 구현 코드
}
```

### 시나리오 3: 성능 최적화 태스크

```typescript
async function performanceOptimization() {
  // 1. 현재 상태 분석 (병렬)
  const [dbAnalysis, frontendAnalysis, apiAnalysis] = await Promise.all([
    Task({
      subagent_type: 'database-administrator',
      description: 'DB 성능 분석',
      prompt: 'pgvector 인덱스와 쿼리 성능을 분석해주세요',
    }),
    Task({
      subagent_type: 'ux-performance-optimizer',
      description: '프론트엔드 성능',
      prompt: '번들 크기와 로딩 속도를 분석해주세요',
    }),
    Task({
      subagent_type: 'issue-summary',
      description: 'API 성능 모니터링',
      prompt: '최근 24시간 API 응답 시간을 분석해주세요',
    }),
  ]);

  // 2. 종합 개선안 도출
  const improvements = await Task({
    subagent_type: 'agent-evolution-manager',
    description: '개선안 종합',
    prompt: `
      다음 분석 결과를 바탕으로 우선순위별 개선안을 제시해주세요:
      - DB: ${dbAnalysis.response}
      - Frontend: ${frontendAnalysis.response}
      - API: ${apiAnalysis.response}
    `,
  });

  return improvements;
}
```

## 🛠️ 구현 가이드

### 1. 에이전트 간 데이터 전달

```typescript
// 컨텍스트 객체로 데이터 전달
interface AgentContext {
  previousResults: any[];
  sharedData: Record<string, any>;
  workflow: string;
}

async function passDataBetweenAgents(context: AgentContext) {
  const result1 = await Task({
    subagent_type: 'database-administrator',
    description: '데이터 수집',
    prompt: '사용자 활동 데이터를 수집해주세요',
  });

  // 결과를 다음 에이전트에 전달
  const result2 = await Task({
    subagent_type: 'ai-systems-engineer',
    description: '데이터 분석',
    prompt: `수집된 데이터를 분석해주세요:\n${JSON.stringify(result1.data)}`,
  });

  return { result1, result2 };
}
```

### 2. 에러 처리와 재시도

```typescript
async function robustAgentExecution(task: any, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await Task(task);
    } catch (error) {
      lastError = error;
      console.log(`시도 ${i + 1} 실패, 재시도 중...`);

      // 지수 백오프
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }

  throw new Error(`태스크 실패: ${lastError}`);
}
```

### 3. 결과 종합 및 보고

```typescript
function synthesizeAgentResults(results: any[]) {
  const summary = {
    totalTasks: results.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    insights: [],
    recommendations: [],
    nextSteps: [],
  };

  // 각 결과에서 핵심 정보 추출
  results.forEach((result) => {
    if (result.insights) summary.insights.push(...result.insights);
    if (result.recommendations)
      summary.recommendations.push(...result.recommendations);
  });

  return summary;
}
```

## 📊 성능 고려사항

### 1. 동시 실행 제한

```typescript
// 동시 실행 에이전트 수 제한
const MAX_CONCURRENT_AGENTS = 3;

async function limitedParallelExecution(tasks: any[]) {
  const results = [];

  for (let i = 0; i < tasks.length; i += MAX_CONCURRENT_AGENTS) {
    const batch = tasks.slice(i, i + MAX_CONCURRENT_AGENTS);
    const batchResults = await Promise.all(batch.map((task) => Task(task)));
    results.push(...batchResults);
  }

  return results;
}
```

### 2. 캐싱 전략

```typescript
const agentCache = new Map();

async function cachedAgentExecution(task: any) {
  const cacheKey = JSON.stringify(task);

  if (agentCache.has(cacheKey)) {
    const cached = agentCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 3600000) {
      // 1시간
      return cached.result;
    }
  }

  const result = await Task(task);
  agentCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
  });

  return result;
}
```

## 🚀 고급 패턴

### 1. 조건부 워크플로우

```typescript
async function conditionalWorkflow(initialData: any) {
  const analysis = await Task({
    subagent_type: 'code-review-specialist',
    description: '초기 분석',
    prompt: `코드 복잡도 분석: ${initialData}`,
  });

  // 분석 결과에 따라 다른 에이전트 선택
  if (analysis.complexity === 'high') {
    return await Task({
      subagent_type: 'ai-systems-engineer',
      description: '복잡한 리팩토링',
      prompt: '고복잡도 코드 리팩토링 제안',
    });
  } else {
    return await Task({
      subagent_type: 'test-automation-specialist',
      description: '테스트 추가',
      prompt: '단순 코드에 대한 테스트 작성',
    });
  }
}
```

### 2. 피드백 루프

```typescript
async function feedbackLoop(task: any, maxIterations = 3) {
  let result;
  let feedback;

  for (let i = 0; i < maxIterations; i++) {
    result = await Task(task);

    // 결과 검증
    feedback = await Task({
      subagent_type: 'code-review-specialist',
      description: '결과 검증',
      prompt: `이 결과를 검증하고 개선점을 제안해주세요: ${result.response}`,
    });

    if (feedback.approved) break;

    // 피드백을 반영하여 태스크 수정
    task.prompt += `\n\n이전 피드백: ${feedback.suggestions}`;
  }

  return { result, feedback, iterations: i + 1 };
}
```

## 📋 베스트 프랙티스

1. **명확한 프롬프트**: 각 에이전트에게 구체적이고 명확한 지시사항 제공
2. **적절한 에이전트 선택**: 작업에 가장 적합한 전문 에이전트 활용
3. **에러 처리**: 모든 에이전트 호출에 적절한 에러 처리 구현
4. **결과 검증**: 중요한 작업은 다른 에이전트로 교차 검증
5. **리소스 관리**: 동시 실행 제한과 캐싱으로 효율성 향상

## 🔗 관련 문서

- [서브 에이전트 종합 분석 보고서](./sub-agents-comprehensive-analysis-2025-01-27.md)
- [서브 에이전트 MCP 매핑 가이드](./sub-agents-mcp-mapping-guide.md)
- [MCP 통합 문제 해결 보고서](./sub-agents-mcp-fix-report-2025-01-27.md)
