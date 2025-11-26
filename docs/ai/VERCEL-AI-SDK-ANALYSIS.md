# Vercel AI SDK 통합 분석 및 개선 방안

**작성일**: 2025-11-27
**버전**: v1.0
**상태**: 현황 분석 완료
**목적**: 포트폴리오 시연용 AI 어시스턴트 고도화

---

## 🎯 프로젝트 컨텍스트

**포트폴리오 프로젝트** - 실제 서버 연동 없이 시뮬레이션 데이터 활용

### 핵심 방침

- ✅ **기존 Mock 데이터 활용** (Zustand store의 EnhancedServerMetrics)
- ✅ **시뮬레이션 기반 AI 응답** (실제 서버 대신 동적 Mock)
- ✅ **현실적인 시연 경험** (포트폴리오 설명 시 실제처럼 보이도록)
- ❌ **실제 서버 연동 없음** (GCP, AWS 등 외부 인프라 호출 제거)

### 시뮬레이션 범위

1. **서버 메트릭**: Zustand store의 동적 Mock 데이터
2. **ML 예측**: CPU/메모리 기반 간단한 알고리즘
3. **RAG 검색**: 하드코딩된 Mock 지식베이스
4. **실시간 업데이트**: Mock 데이터 주기적 변경으로 시뮬레이션

---

## 📊 현재 통합 상태

### ✅ 적용 완료 영역

#### 1. `/src/app/api/ai/chat/route.ts` (NEW)

**Vercel AI SDK 완전 적용** - 신규 API 엔드포인트

```typescript
import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';

// ✅ 주요 기능
- streamText() - 실시간 스트리밍 응답
- tool() - Tool Calling (3개 도구)
- Google Gemini 1.5 Flash 모델
- maxDuration: 30초
```

**구현된 Tools (3개)**:

1. `getSystemStatus` - 시스템 상태 조회
2. `checkResourceUsage` - CPU/메모리 사용량
3. `analyzeLogs` - 로그 분석

#### 2. `/src/domains/ai-sidebar/components/AISidebarV4.tsx` (NEW)

**React Hooks 통합** - 새로운 사이드바 컴포넌트

```typescript
import { useChat } from 'ai/react';

// ✅ 주요 기능
- useChat() Hook - 상태 관리 자동화
- 실시간 메시지 스트리밍
- Tool invocations → Thinking steps 자동 변환
- 메모리 효율적 설계 (useMemo, memo)
```

**Thinking Process 시각화**:

- Tool invocations를 ThinkingStep으로 매핑
- 실시간 "processing" 상태 표시
- 완료 시 "completed" + 결과 표시

### ⚠️ 미적용 영역 (레거시)

#### 1. `/src/app/api/ai/query/route.ts` (LEGACY)

**기존 fetch 기반** - 708줄, Vercel AI SDK 미사용

**현재 구조**:

```typescript
// ❌ 수동 처리
- SimplifiedQueryEngine (커스텀 엔진)
- 수동 타임아웃 관리
- 수동 에러 핸들링
- 수동 스트리밍 구현 없음
```

**문제점**:

- 스트리밍 미지원 (전체 응답 대기)
- Tool calling 미지원
- 복잡한 에러 처리 로직
- 코드 중복 (708줄)

#### 2. `/src/components/dashboard/AISidebarContent.tsx` (LEGACY)

**기존 컴포넌트** - 625줄, fetch 기반

**현재 구조**:

```typescript
// ❌ 수동 처리
- fetch() 직접 호출
- 수동 상태 관리 (useState)
- 수동 로딩/에러 처리
- Thinking steps 수동 파싱
```

---

## 🎯 개선 방안 (5개 영역)

### 1. 🔄 기존 API를 Vercel AI SDK로 마이그레이션

**목표**: `/api/ai/query` → `/api/ai/unified-stream`

**개선점**:

```typescript
// Before (708줄)
const engine = await getQueryEngine();
const result = await engine.query(queryRequest); // 블로킹

// After (~100줄)
const result = streamText({
  model: google('gemini-1.5-flash'),
  messages: [...],
  tools: { ragSearch, mlPredict, complexityAnalysis },
});
return result.toDataStreamResponse(); // 스트리밍
```

**효과** (포트폴리오 시연 관점):

- ✅ 응답 시간 50% 감소 (스트리밍 + 첫 토큰 빠름)
- ✅ 코드 85% 감소 (708줄 → ~100줄)
- ✅ Tool calling 자동화 → **면접관에게 기술력 어필**
- ✅ 타임아웃/에러 핸들링 자동화
- 🎓 **포트폴리오 강점**: "Vercel AI SDK 활용 경험" 강조 가능

### 2. 💡 Thinking Process 고도화

**현재 문제**:

- Tool invocations만 thinking step으로 표시
- 실제 "생각 과정"이 아닌 "실행 기록"

**개선안**: Extended Thinking 패턴 도입

```typescript
// ✨ NEW: Thinking Stream 전용 도구
const thinkingTools = {
  // 1️⃣ 의도 분석
  analyzeIntent: tool({
    description: '사용자 질문의 의도를 분석합니다',
    parameters: z.object({ query: z.string() }),
    execute: async ({ query }) => ({
      intent: 'metric_query',
      confidence: 0.95,
      category: 'performance',
    }),
  }),

  // 2️⃣ 복잡도 분석
  analyzeComplexity: tool({
    description: '질문의 복잡도를 분석하여 최적 엔진을 선택합니다',
    parameters: z.object({ query: z.string() }),
    execute: async ({ query }) => ({
      score: 3, // 1-5
      recommendation: 'supabase-rag',
      reasoning: '단순 메트릭 조회 → RAG 충분',
    }),
  }),

  // 3️⃣ RAG 검색
  searchKnowledge: tool({
    description: 'Supabase pgvector에서 관련 지식을 검색합니다',
    parameters: z.object({ query: z.string() }),
    execute: async ({ query }) => {
      // 실제 RAG 검색
      const results = await supabase.rpc('match_documents', {
        query_embedding: await embed(query),
        match_threshold: 0.7,
        match_count: 3,
      });
      return {
        found: results.length,
        topMatch: results[0],
        relevance: 0.85,
      };
    },
  }),

  // 4️⃣ 라우팅 결정
  selectEngine: tool({
    description: '최적 AI 엔진을 선택합니다',
    parameters: z.object({ complexity: z.number() }),
    execute: async ({ complexity }) => ({
      engine: complexity > 3 ? 'gemini' : 'rag',
      reason: 'Cost optimization',
      estimatedCost: '$0',
    }),
  }),
};
```

**Thinking Process 시각화 개선**:

```typescript
// ThinkingProcessVisualizer.tsx 확장
const stepIconMap = {
  '의도 분석': Brain,
  '복잡도 분석': Activity,
  'RAG 검색': Database,
  '라우팅 결정': Route,
  '응답 생성': Zap,
};

// 실시간 스트리밍으로 단계별 표시
messages.map((m) =>
  m.toolInvocations?.map((t) => ({
    step: t.toolName,
    status: t.state === 'result' ? 'completed' : 'processing',
    description: t.result?.reasoning || `${t.toolName} 실행 중...`,
    timestamp: new Date(),
  }))
);
```

### 3. 🛠️ Tool 확장 (포트폴리오 시뮬레이션 데이터 활용)

**목표**: 기존 Mock 데이터를 Tool에서 활용하여 현실적인 AI 어시스턴트 시뮬레이션

**현재 문제**:

- Tool이 하드코딩된 고정값만 반환
- Zustand store의 동적 Mock 데이터와 분리

**개선안**: 기존 Mock 데이터 기반 Tools (포트폴리오 시연용)

```typescript
const serverTools = {
  // 📊 서버 메트릭 조회 (Zustand Mock 데이터)
  getServerMetrics: tool({
    description: '서버 CPU/메모리/디스크 상태를 조회합니다 (시뮬레이션)',
    parameters: z.object({
      serverId: z.string().optional(),
      metric: z.enum(['cpu', 'memory', 'disk', 'all']),
    }),
    execute: async ({ serverId, metric }) => {
      // 💡 Zustand store에서 Mock 데이터 가져오기
      const servers = useServerDataStore.getState().servers;
      const target = serverId
        ? servers.find((s) => s.id === serverId)
        : servers;

      return {
        servers: Array.isArray(target) ? target : [target],
        timestamp: new Date().toISOString(),
        avgCpu: calculateAvg(servers, 'cpu'),
        alertCount: servers.filter((s) => s.status === 'warning').length,
        // 포트폴리오: 실제 데이터가 아닌 시뮬레이션임을 명시
        _simulation: true,
      };
    },
  }),

  // 🔮 ML 예측 시뮬레이션 (포트폴리오용)
  predictIncident: tool({
    description: 'ML 모델로 장애 가능성을 예측합니다 (시뮬레이션)',
    parameters: z.object({ serverId: z.string() }),
    execute: async ({ serverId }) => {
      // 💡 Mock 예측 로직 (실제 GCP 호출 대신)
      const servers = useServerDataStore.getState().servers;
      const server = servers.find((s) => s.id === serverId);

      // CPU/Memory 기반 간단한 예측 알고리즘
      const cpuRisk = server.cpu > 80 ? 0.7 : server.cpu > 60 ? 0.4 : 0.1;
      const memRisk = server.memory > 85 ? 0.8 : server.memory > 70 ? 0.5 : 0.2;
      const probability = Math.max(cpuRisk, memRisk);

      return {
        probability: probability.toFixed(2),
        timeframe: '1h',
        confidence: 0.85,
        factors: [
          cpuRisk > 0.5 ? 'High CPU usage' : null,
          memRisk > 0.5 ? 'High memory usage' : null,
        ].filter(Boolean),
        _simulation: true,
      };
    },
  }),

  // 📚 RAG 지식베이스 시뮬레이션
  searchKnowledgeBase: tool({
    description: '과거 장애 이력 및 해결 방법을 검색합니다 (시뮬레이션)',
    parameters: z.object({ query: z.string() }),
    execute: async ({ query }) => {
      // 💡 Mock RAG 검색 결과 (실제 Supabase 호출 대신)
      const mockKnowledge = [
        {
          incident: 'CPU 과부하',
          solution: 'PM2 클러스터 모드 확장 및 로드밸런싱 적용',
          similarity: 0.92,
        },
        {
          incident: '메모리 누수',
          solution: 'Node.js 메모리 프로파일링 후 캐시 정리 스크립트 추가',
          similarity: 0.85,
        },
        {
          incident: '디스크 용량 부족',
          solution: '로그 로테이션 설정 및 오래된 백업 삭제',
          similarity: 0.78,
        },
      ];

      // 쿼리 키워드 기반 간단한 매칭
      const keywords = query.toLowerCase();
      const matches = mockKnowledge.filter((k) =>
        keywords.includes(k.incident.toLowerCase().split(' ')[0])
      );

      return {
        matches: matches.length,
        topSolution: matches[0]?.solution || mockKnowledge[0].solution,
        relevance: matches[0]?.similarity || 0.65,
        allResults: matches.slice(0, 3),
        _simulation: true,
      };
    },
  }),

  // 📈 서버 상태 분석 (통계 기반)
  analyzeServerHealth: tool({
    description: '전체 서버의 건강도를 분석합니다 (시뮬레이션)',
    parameters: z.object({}),
    execute: async () => {
      const servers = useServerDataStore.getState().servers;

      const healthScore =
        servers.reduce((sum, s) => {
          const cpuScore = (100 - s.cpu) / 100;
          const memScore = (100 - s.memory) / 100;
          const diskScore = (100 - s.disk) / 100;
          return sum + (cpuScore + memScore + diskScore) / 3;
        }, 0) / servers.length;

      return {
        overallHealth: (healthScore * 100).toFixed(1),
        criticalServers: servers.filter((s) => s.status === 'critical').length,
        warningServers: servers.filter((s) => s.status === 'warning').length,
        healthyServers: servers.filter((s) => s.status === 'online').length,
        recommendations: [
          healthScore < 0.6 ? '일부 서버 리소스 확장 필요' : null,
          servers.some((s) => s.cpu > 80) ? 'CPU 부하 분산 권장' : null,
          servers.some((s) => s.memory > 85) ? '메모리 최적화 필요' : null,
        ].filter(Boolean),
        _simulation: true,
      };
    },
  }),
};
```

### 4. 📡 스트리밍 응답 개선

**현재**: 기본 text streaming만 지원

**개선안**: Structured Streaming + Partial JSON

```typescript
import { streamObject, experimental_useObject } from 'ai/react';

// Server-side: Structured streaming
export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamObject({
    model: google('gemini-1.5-flash'),
    schema: z.object({
      analysis: z.object({
        intent: z.string(),
        complexity: z.number(),
        recommendation: z.string(),
      }),
      servers: z.array(z.object({
        id: z.string(),
        status: z.enum(['healthy', 'warning', 'critical']),
        metrics: z.object({
          cpu: z.number(),
          memory: z.number(),
        }),
      })),
      insights: z.array(z.string()),
    }),
    messages,
  });

  return result.toTextStreamResponse();
}

// Client-side: Partial object consumption
function AIChat() {
  const { object, isLoading } = experimental_useObject({
    api: '/api/ai/stream-object',
  });

  // 실시간으로 부분 객체 표시
  return (
    <div>
      {object?.analysis && (
        <div>복잡도: {object.analysis.complexity}/5</div>
      )}
      {object?.servers?.map(s => (
        <ServerCard key={s.id} data={s} />
      ))}
    </div>
  );
}
```

**효과**:

- ✅ 타입 안전한 스트리밍 (Zod schema)
- ✅ 부분 객체 실시간 렌더링
- ✅ 복잡한 데이터 구조 지원

### 5. 🎨 UI/UX 개선

**개선안 1**: Multi-step Reasoning 시각화

```typescript
// 각 단계별 진행 상황 표시
<ThinkingProcessVisualizer
  steps={[
    { step: '질문 분석', status: 'completed', duration: 120 },
    { step: 'RAG 검색', status: 'completed', duration: 340 },
    { step: '서버 데이터 조회', status: 'processing', duration: null },
    { step: '응답 생성', status: 'pending', duration: null },
  ]}
  isActive={isLoading}
/>
```

**개선안 2**: Tool Call Results 인터랙티브 표시

```tsx
// Tool 실행 결과를 확장 가능한 카드로 표시
{
  message.toolInvocations?.map((t) => (
    <ToolResultCard
      key={t.toolCallId}
      name={t.toolName}
      state={t.state}
      result={t.result}
      expandable
    />
  ));
}
```

**개선안 3**: 실시간 비용 표시

```tsx
<FreeTierMonitor>
  <div className="flex items-center space-x-2">
    <DollarSign className="h-4 w-4" />
    <span>이번 응답 비용: $0.0012</span>
    <span className="text-green-600">(-85% vs Gemini API)</span>
  </div>
</FreeTierMonitor>
```

---

## 📈 예상 효과

### 성능 개선

- **응답 시간**: 600ms → 300ms (50% 감소, 첫 토큰 빠름)
- **코드 크기**: 708줄 → ~150줄 (79% 감소)
- **유지보수성**: ⭐⭐⭐ → ⭐⭐⭐⭐⭐

### 사용자 경험

- **실시간 피드백**: 응답 대기 → 실시간 thinking 표시
- **투명성**: 블랙박스 → 단계별 사고 과정 공개
- **신뢰성**: Tool calling 자동 검증

### 비용 효율

- **RAG 우선**: 단순 질문은 $0 (Supabase only)
- **스마트 라우팅**: 복잡도 기반 엔진 선택
- **무료 티어 최적화**: 월 $0 운영 유지

---

## 🚀 구현 우선순위

### Phase 1: 핵심 마이그레이션 (1-2일)

1. `/api/ai/query` → `/api/ai/unified-stream` 변환
2. `AISidebarContent` → `AISidebarV4` 통합
3. 기본 tool calling 구현

### Phase 2: Thinking Process 고도화 (1일)

1. Extended thinking tools 구현
2. ThinkingProcessVisualizer 개선
3. 실시간 스트리밍 단계 표시

### Phase 3: Tool 확장 (1-2일)

1. **포트폴리오용 시뮬레이션 tools** 구현
2. Zustand Mock 데이터 기반 메트릭 조회
3. 간단한 ML 예측 알고리즘 (CPU/메모리 기반)
4. Mock RAG 지식베이스 검색

### Phase 4: 고급 기능 (선택, 1-2일)

1. Structured streaming (`streamObject`)
2. Partial JSON rendering
3. Multi-modal 입력 지원 (이미지, 차트)

---

## 📚 참고 문서

- [Vercel AI SDK 공식 문서](https://sdk.vercel.ai/docs)
- [Tool Calling Guide](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling)
- [Structured Outputs](https://sdk.vercel.ai/docs/ai-sdk-core/structured-outputs)
- [React Hooks](https://sdk.vercel.ai/docs/ai-sdk-ui/overview)

---

**다음 단계**: 우선순위 확인 후 Phase 1부터 구현 시작
