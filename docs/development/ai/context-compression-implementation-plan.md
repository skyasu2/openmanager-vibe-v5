# Context Compression System 구현 계획

**Version**: 1.0.0
**Date**: 2025-12-23
**Status**: Approved

## 1. 오픈소스 분석 결과

### 1.1 Token Counting 라이브러리

| 라이브러리 | 버전 | 라이선스 | 비용 | 장점 | 단점 |
|-----------|------|---------|------|------|------|
| `js-tiktoken` | 1.0.21 | MIT | FREE | Pure JS, 가벼움, 빌드 쉬움 | 일부 모델 미지원 |
| `tiktoken` | 1.0.22 | MIT | FREE | OpenAI 공식, 정확도 높음 | WASM 의존성 |
| `ai-tokenizer` | 1.0.6 | MIT | FREE | Vercel AI SDK 호환 | 신규 라이브러리 |

**권장**: `js-tiktoken` - Cloud Run 환경 호환성 우수, Pure JS로 빌드 단순화

### 1.2 메모리/압축 라이브러리

| 솔루션 | 상태 | 비용 | 특징 |
|--------|------|------|------|
| `@langchain/langgraph` | **이미 설치됨** (v1.0.4) | FREE | MemorySaver, messagesStateReducer |
| `@langchain/langgraph-checkpoint-postgres` | **이미 설치됨** (v1.0.0) | FREE | PostgresSaver |
| LangMem | 미설치 | FREE | 별도 인덱싱 필요 - 과도함 |

**권장**: 기존 LangGraph 활용 - 추가 의존성 불필요

### 1.3 요약용 LLM

| 모델 | Provider | 비용 | 용도 |
|------|----------|------|------|
| `gemini-2.5-flash-lite` | Google | FREE (1,500 RPD) | 압축/요약 |
| `llama-3.1-8b-instant` | Groq | FREE (14,400 RPD) | 빠른 요약 |

**권장**: `gemini-2.5-flash-lite` - 이미 supervisor에서 사용 중, 무료

## 2. 구현 전략: 100% 오픈소스 (FREE)

### 2.1 결정 사항

```
┌─────────────────────────────────────────────────────────────┐
│                 구현 전략: 오픈소스 우선                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ Token Counter: js-tiktoken (npm install 필요)            │
│  ✅ Buffer Manager: LangGraph messagesStateReducer (기존)    │
│  ✅ Summarizer: Gemini 2.5 Flash Lite (기존)                 │
│  ✅ Persistence: PostgresSaver (기존)                        │
│                                                              │
│  📦 추가 의존성: js-tiktoken 1개만                           │
│  💰 추가 비용: $0 (모든 FREE 티어)                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 아키텍처

```
기존 Cloud Run AI Engine
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Context Compression Module                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. TokenCounter (신규)                                      │
│     └── js-tiktoken 기반                                     │
│                                                              │
│  2. CompressionTrigger (신규)                                │
│     └── 85% 임계값 도달 시 압축 시작                         │
│                                                              │
│  3. BufferManager (기존 확장)                                │
│     └── state-definition.ts의 messagesStateReducer 활용      │
│                                                              │
│  4. Summarizer (기존 활용)                                   │
│     └── Gemini 2.5 Flash Lite 호출                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 3. 구현 계획

### Phase 1: Token Counter + Trigger (1-2일)

**파일**: `cloud-run/ai-engine/src/lib/context-compression/token-counter.ts`

```typescript
// 핵심 인터페이스
interface TokenCounter {
  countTokens(text: string): number;
  countMessages(messages: BaseMessage[]): number;
  getUsageRatio(messages: BaseMessage[], limit: number): number;
}

// 압축 트리거 로직
interface CompressionTrigger {
  shouldCompress(usageRatio: number, threshold?: number): boolean;
  getLevel(usageRatio: number): 'none' | 'light' | 'aggressive';
}
```

**의존성 설치**:
```bash
cd cloud-run/ai-engine
npm install js-tiktoken
```

### Phase 2: Hybrid Buffer Manager (1-2일)

**파일**: `cloud-run/ai-engine/src/lib/context-compression/buffer-manager.ts`

```typescript
// LangGraph RemoveMessage 패턴 활용
import { RemoveMessage } from '@langchain/langgraph';

interface BufferConfig {
  recentMessageCount: number;  // 최근 N개 원본 유지 (기본: 10)
  summaryMaxTokens: number;    // 요약 최대 토큰 (기본: 500)
}

interface CompressedBuffer {
  summary: string;           // 이전 대화 요약
  recentMessages: BaseMessage[];  // 최근 메시지 원본
  removedCount: number;      // 제거된 메시지 수
}
```

**기존 state-definition.ts 확장**:
```typescript
// AgentState에 추가
conversationSummary: Annotation<string>({
  reducer: (_, next) => next,
  default: () => '',
}),

compressionMetadata: Annotation<CompressionMetadata>({
  reducer: (_, next) => next,
  default: () => ({
    lastCompressedAt: null,
    totalCompressed: 0,
    compressionRatio: 0,
  }),
}),
```

### Phase 3: LLM Summarizer 통합 (1일)

**파일**: `cloud-run/ai-engine/src/lib/context-compression/summarizer.ts`

```typescript
// 기존 Gemini 모델 활용
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const SUMMARY_PROMPT = `
다음 대화 내용을 간결하게 요약하세요:
- 핵심 주제/질문
- 중요한 결정사항
- 언급된 서버/메트릭 정보

원본 대화:
{messages}

요약 (3-5문장):
`;

async function summarizeConversation(
  messages: BaseMessage[],
  maxTokens: number = 500
): Promise<string> {
  const model = createGoogleGenerativeAI()('gemini-2.5-flash-lite');
  // ... 요약 생성
}
```

## 4. 기존 코드와의 통합

### 4.1 multi-agent-supervisor.ts 수정

```typescript
// 압축 체크 추가
async function maybeCompressContext(state: AgentStateType): Promise<AgentStateType> {
  const tokenCount = tokenCounter.countMessages(state.messages);
  const usageRatio = tokenCount / MODEL_CONTEXT_LIMITS['gemini-2.5-flash'];

  if (compressionTrigger.shouldCompress(usageRatio)) {
    const compressed = await bufferManager.compress(state.messages);
    return {
      ...state,
      messages: [...compressed.recentMessages],
      conversationSummary: compressed.summary,
    };
  }

  return state;
}
```

### 4.2 System Prompt 수정

```typescript
// 요약이 있으면 시스템 프롬프트에 포함
function buildSystemPrompt(state: AgentStateType): string {
  let prompt = BASE_SYSTEM_PROMPT;

  if (state.conversationSummary) {
    prompt += `\n\n## 이전 대화 요약\n${state.conversationSummary}`;
  }

  return prompt;
}
```

## 5. 설정

```typescript
// cloud-run/ai-engine/src/config/compression.ts
export const COMPRESSION_CONFIG = {
  trigger: {
    usageThreshold: 0.85,      // 85%에서 압축 시작
    emergencyThreshold: 0.95,  // 95%에서 강제 압축
  },
  buffer: {
    recentMessageCount: 10,    // 최근 10개 원본 유지
    summaryMaxTokens: 500,     // 요약 최대 500 토큰
  },
  model: {
    contextLimits: {
      'gemini-2.5-flash-lite': 1_048_576,  // 1M tokens
      'llama-3.3-70b-versatile': 128_000,   // 128K tokens
    },
    summarizer: 'gemini-2.5-flash-lite',
  },
} as const;
```

## 6. 무료 티어 최적화

### 6.1 API 호출 최소화

- 요약은 압축 트리거 시점에만 1회 호출
- 동일 세션 요약 결과 캐싱 (cache-layer.ts 활용)
- 트리거 임계값 85% → 불필요한 압축 방지

### 6.2 비용 분석

| 항목 | 호출 빈도 | 비용 |
|------|----------|------|
| Token Counting | 매 요청 | $0 (로컬 계산) |
| Summarization | 압축 시점만 | $0 (Gemini Free) |
| PostgresSaver | 매 요청 | $0 (Supabase Free) |
| **Total** | | **$0** |

## 7. 구현 일정

| Phase | 작업 | 예상 시간 | 의존성 |
|-------|------|----------|--------|
| 1 | Token Counter + Trigger | 1-2일 | js-tiktoken 설치 |
| 2 | Buffer Manager | 1-2일 | Phase 1 완료 |
| 3 | Summarizer 통합 | 1일 | Phase 2 완료 |
| - | 통합 테스트 | 0.5일 | 모든 Phase 완료 |

**총 예상 기간**: 3-5일 (가벼운 테스트 포함)

## 8. 결론

### 8.1 오픈소스 채택 결정

✅ **100% 오픈소스 (FREE) 구현 가능**

- Token Counter: `js-tiktoken` (MIT)
- Buffer/Memory: `@langchain/langgraph` (이미 설치됨)
- Summarizer: Gemini 2.5 Flash Lite (무료)
- Persistence: PostgresSaver (이미 설치됨)

### 8.2 추가 비용

- 신규 의존성: `js-tiktoken` 1개
- 월간 비용: $0
- 유지보수 복잡도: 낮음

### 8.3 권장 사항

1. **Phase 1 먼저 구현**: Token Counter만으로도 정확한 사용량 모니터링 가능
2. **점진적 도입**: 모든 Phase를 한번에 하지 않고 단계별 배포
3. **기존 인프라 최대 활용**: 새 라이브러리 최소화

---

_Related Docs_:
- `context-compression-design.md` - 원본 설계 문서
- `state-definition.ts` - AgentState 정의
- `checkpointer.ts` - PostgresSaver 구현

_Last Updated: 2025-12-23_
