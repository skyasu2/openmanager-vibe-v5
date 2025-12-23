# AI 컨텍스트 압축 시스템 설계

**Version**: 1.0.0
**Date**: 2025-12-23
**Status**: Draft

## 1. 개요

### 1.1 목적
AI 대화 시스템에서 장기 대화 시 컨텍스트 윈도우 한계를 극복하고, 중요한 맥락을 보존하면서 효율적인 토큰 사용을 달성하기 위한 컨텍스트 압축 시스템 설계.

### 1.2 현재 상태 분석
- **구현 위치**: `src/lib/ai/core/prompt-builder.ts`
- **현재 방식**: 단순 문자 기반 토큰 추정 (4자 = 1토큰)
- **제한사항**:
  - 끝에서만 자르는 단순 truncation
  - 요약/압축 없음
  - 중요도 기반 필터링 없음
  - 하이브리드 버퍼 전략 없음

## 2. 경쟁사 비교 분석

### 2.1 Claude Code (Anthropic)
| 기능 | 상세 |
|------|------|
| **자동 압축** | 95% 컨텍스트 사용 시 auto-compact 트리거 |
| **요약 방식** | 구조화된 요약 (핵심 결정/맥락 보존) |
| **마커 시스템** | `<!-- anchor -->` 마커로 중요 지점 표시 |
| **메모리 지속** | 세션 간 메모리 파일로 지속성 유지 |

### 2.2 OpenAI Assistants API
| 기능 | 상세 |
|------|------|
| **스레드 메모리** | 자동 truncation 정책 적용 |
| **Tool 결과 처리** | 큰 출력 자동 요약 |
| **Run Steps** | 단계별 상태 관리 |

### 2.3 LangChain/LangGraph
| 기능 | 상세 |
|------|------|
| **ConversationBufferWindowMemory** | 최근 N개 메시지만 유지 |
| **ConversationSummaryMemory** | LLM 기반 자동 요약 |
| **ConversationSummaryBufferMemory** | 하이브리드 (최근 + 요약) |

### 2.4 우리 시스템과의 Gap 분석

| 기능 | 경쟁사 | 우리 | Gap |
|------|--------|------|-----|
| 토큰 기반 관리 | ✅ | ❌ | 문자 기반만 사용 |
| 계층적 요약 | ✅ | ❌ | 요약 없음 |
| 하이브리드 버퍼 | ✅ | ❌ | 단순 truncation |
| 중요도 스코어링 | ✅ | ❌ | 순서 기반만 |
| 스마트 트리거 | ✅ | ❌ | 수동 제한만 |
| 앵커 포인트 | ✅ | ❌ | 미구현 |

## 3. 제안 설계

### 3.1 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│                  Context Compression System                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────┐    ┌───────────────┐    ┌─────────────┐  │
│  │ Token Counter │ →  │ Compression   │ →  │ Buffer      │  │
│  │ (tiktoken)    │    │ Trigger       │    │ Manager     │  │
│  └───────────────┘    └───────────────┘    └─────────────┘  │
│           │                  │                    │         │
│           ▼                  ▼                    ▼         │
│  ┌───────────────┐    ┌───────────────┐    ┌─────────────┐  │
│  │ Importance    │    │ Summarizer    │    │ Anchor      │  │
│  │ Scorer        │    │ (LLM-based)   │    │ Manager     │  │
│  └───────────────┘    └───────────────┘    └─────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 핵심 컴포넌트

#### 3.2.1 Token Counter
```typescript
interface TokenCounter {
  // tiktoken 기반 정확한 토큰 계산
  countTokens(text: string): number;

  // 모델별 컨텍스트 한계
  getModelLimit(model: string): number;

  // 현재 사용률
  getUsageRatio(messages: Message[], model: string): number;
}
```

#### 3.2.2 Compression Trigger
```typescript
interface CompressionTrigger {
  // 압축 필요 여부 판단
  shouldCompress(
    usageRatio: number,
    threshold?: number  // default: 0.85
  ): boolean;

  // 압축 레벨 결정
  getCompressionLevel(usageRatio: number): 'light' | 'medium' | 'aggressive';
}
```

#### 3.2.3 Buffer Manager
```typescript
interface BufferManager {
  // 하이브리드 버퍼 관리
  manageBuffer(messages: Message[], config: {
    recentCount: number;      // 최근 N개 원본 유지
    summaryMaxTokens: number; // 요약 최대 토큰
  }): {
    recent: Message[];        // 최근 메시지 (원본)
    summary: string;          // 이전 대화 요약
    anchors: AnchorPoint[];   // 중요 앵커 포인트
  };
}
```

#### 3.2.4 Importance Scorer
```typescript
interface ImportanceScorer {
  // 메시지 중요도 계산
  scoreMessage(message: Message): number;  // 0-1

  // 중요도 기준
  // - 키워드 밀도
  // - 사용자 명시적 표시
  // - 의사결정 포함 여부
  // - Tool 호출 결과
}
```

#### 3.2.5 Summarizer
```typescript
interface Summarizer {
  // LLM 기반 요약 생성
  summarize(messages: Message[], config: {
    maxTokens: number;
    preserveKeys: string[];   // 보존할 키워드
    preserveDecisions: boolean;
  }): Promise<string>;

  // 계층적 요약 (여러 레벨)
  hierarchicalSummarize(messages: Message[], levels: number): Promise<string[]>;
}
```

### 3.3 구현 단계

#### Phase 1: 기초 인프라 (1주)
1. tiktoken 기반 토큰 카운터 구현
2. Compression Trigger 로직 추가
3. 기존 PromptBuilder 리팩토링

#### Phase 2: 하이브리드 버퍼 (1주)
1. BufferManager 구현
2. 최근 메시지 + 요약 분리
3. 앵커 포인트 시스템

#### Phase 3: 스마트 압축 (2주)
1. Importance Scorer 구현
2. LLM 기반 Summarizer 통합
3. 계층적 요약 시스템

### 3.4 설정 예시

```typescript
const compressionConfig = {
  // 압축 트리거 설정
  trigger: {
    usageThreshold: 0.85,      // 85% 사용 시 압축 시작
    emergencyThreshold: 0.95,  // 95% 시 강제 압축
  },

  // 버퍼 설정
  buffer: {
    recentMessageCount: 10,    // 최근 10개 원본 유지
    summaryMaxTokens: 500,     // 요약 최대 토큰
    anchorMaxCount: 5,         // 앵커 최대 개수
  },

  // 요약 설정
  summarizer: {
    model: 'gemini-2.5-flash-lite',  // 저비용 모델 사용
    preserveDecisions: true,
    preserveToolResults: true,
  },

  // 중요도 가중치
  importance: {
    userExplicit: 1.0,         // 사용자 명시 표시
    decision: 0.8,             // 의사결정 포함
    toolResult: 0.7,           // Tool 결과
    keyword: 0.5,              // 키워드 매칭
  },
};
```

## 4. 무료 티어 고려사항

### 4.1 비용 최적화 전략
- **요약용 모델**: `gemini-2.5-flash-lite` (저비용)
- **캐싱**: 동일 대화 요약 캐싱
- **지연 압축**: 필요 시점까지 압축 지연

### 4.2 API 호출 최소화
```typescript
// 요약이 필요할 때만 LLM 호출
if (shouldCompress && !cachedSummary) {
  summary = await summarizer.summarize(messages);
  cache.set(conversationId, summary);
}
```

## 5. 구현 우선순위

| 우선순위 | 기능 | 난이도 | 영향도 |
|----------|------|--------|--------|
| P0 | 토큰 카운터 (tiktoken) | 낮음 | 높음 |
| P0 | Compression Trigger | 낮음 | 높음 |
| P1 | 하이브리드 버퍼 | 중간 | 높음 |
| P1 | 단순 요약 (template) | 낮음 | 중간 |
| P2 | LLM 기반 요약 | 높음 | 중간 |
| P2 | 중요도 스코어링 | 중간 | 중간 |
| P3 | 앵커 포인트 | 높음 | 낮음 |
| P3 | 계층적 요약 | 높음 | 낮음 |

## 6. 결론

### 6.1 즉시 구현 권장 사항
1. **tiktoken 기반 토큰 카운터**: 정확한 토큰 추정으로 truncation 개선
2. **Compression Trigger**: 85% 임계값에서 압축 시작
3. **하이브리드 버퍼**: 최근 10개 + 이전 요약 방식

### 6.2 장기 로드맵
1. LLM 기반 스마트 요약
2. 중요도 기반 메시지 필터링
3. 앵커 포인트 시스템으로 핵심 맥락 보존

---

## 참고 자료

- [Claude Code Context Management](https://docs.anthropic.com/claude-code)
- [OpenAI Assistants Threads](https://platform.openai.com/docs/assistants)
- [LangChain Memory Types](https://python.langchain.com/docs/modules/memory/)
- [tiktoken Library](https://github.com/openai/tiktoken)
