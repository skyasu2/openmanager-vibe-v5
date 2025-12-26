# AI Assistant 3-Tier Architecture

> **Version**: v5.88.0
> **Last Updated**: 2025-12-26
> **Status**: Production

## Overview

OpenManager VIBE의 AI 어시스턴트는 **3계층 아키텍처**로 구성됩니다:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                                │
│                    (AISidebarV4.tsx + useChat)                       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ Vercel AI SDK v5
                           │ Data Stream Protocol
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API PROXY (BFF)                               │
│                   /api/ai/supervisor/route.ts                        │
│              Protocol Translation + Error Handling                   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTP POST + Streaming
                           │ Keep-Alive Ping (10s)
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CLOUD RUN AI ENGINE                             │
│                  LangGraph Multi-Agent Supervisor                    │
│             NLQ Agent │ Analyst Agent │ Reporter Agent               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Frontend (Vercel)

### 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/domains/ai-sidebar/components/AISidebarV4.tsx` | UI 컴포넌트 + useChat 훅 |
| `src/domains/ai-sidebar/hooks/useAIChatSync.ts` | Zustand 상태 동기화 |
| `src/stores/useAISidebarStore.ts` | 전역 상태 관리 |

### Vercel AI SDK v5 사용

```typescript
// AISidebarV4.tsx
import { useChat } from '@ai-sdk/react';

const { messages, input, handleSubmit, isLoading } = useChat({
  api: '/api/ai/supervisor',
  body: { sessionId, enableVerification: true },
});
```

### Data Stream Protocol

프론트엔드 ↔ API Proxy 간 통신은 **Data Stream Protocol**을 사용합니다:

| Prefix | 의미 | 예시 |
|--------|------|------|
| `0:` | 텍스트 콘텐츠 | `0:"Hello"` |
| `2:` | JSON 데이터 배열 | `2:[{"key":"value"}]` |
| `3:` | 에러 메시지 | `3:"Error occurred"` |
| `8:` | 메시지 주석 | `8:{"type":"annotation"}` |
| `d:` | 완료 신호 | `d:{"finishReason":"stop"}` |
| `e:` | 시작 신호 | `e:{"messageId":"..."}` |

---

## Layer 2: API Proxy (Vercel Edge)

### 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/app/api/ai/supervisor/route.ts` | BFF 프록시 |

### 주요 책임

1. **프로토콜 변환**
   - AI SDK v5 `parts[]` 형식 → Cloud Run `content` 문자열
   - Cloud Run 응답 → Data Stream Protocol 포맷

2. **에러 처리**
   - Cloud Run 타임아웃 시 사용자 친화적 메시지
   - Rate Limit 감지 및 안내

3. **스트리밍 중계**
   - Cloud Run SSE → AI SDK Data Stream
   - Keep-Alive ping 전달

### 프로토콜 변환 코드

```typescript
// route.ts - 메시지 추출
const DATA_STREAM_PREFIXES = {
  TEXT: '0',           // 텍스트 콘텐츠
  DATA: '2',           // JSON 데이터 배열
  ERROR: '3',          // 에러 메시지
  FINISH: 'd',         // 완료 신호
  START: 'e',          // 시작 신호
} as const;

// parts[] → content 문자열 변환
const extractUserMessage = (messages: AIMessage[]): string => {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  if (!lastUserMessage) return '';

  // AI SDK v5: parts 배열 또는 content 문자열
  if (lastUserMessage.parts) {
    return lastUserMessage.parts
      .filter(p => p.type === 'text')
      .map(p => p.text)
      .join('');
  }
  return lastUserMessage.content || '';
};
```

---

## Layer 3: Cloud Run AI Engine

### 핵심 파일

| 파일 | 역할 |
|------|------|
| `cloud-run/ai-engine/src/services/langgraph/multi-agent-supervisor.ts` | Multi-Agent Supervisor |
| `cloud-run/ai-engine/src/agents/nlq-agent.ts` | 자연어 쿼리 처리 |
| `cloud-run/ai-engine/src/agents/analyst-agent.ts` | 패턴 분석 |
| `cloud-run/ai-engine/src/agents/reporter-agent.ts` | 리포트 생성 |
| `cloud-run/ai-engine/src/agents/verifier-agent.ts` | 응답 검증 |

### LangGraph Multi-Agent Supervisor

```
                    ┌─────────────────┐
                    │   Supervisor    │
                    │  (Groq/Mistral) │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │  NLQ Agent  │   │  Analyst    │   │  Reporter   │
    │  (Groq)     │   │  (Groq)     │   │  (Groq)     │
    └─────────────┘   └─────────────┘   └─────────────┘
           │                 │                 │
           └─────────────────┼─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Verifier     │
                    │   (Mistral)     │
                    └─────────────────┘
```

### Dual-Provider 전략

| Provider | 역할 | 모델 |
|----------|------|------|
| **Groq** | Supervisor + Worker Agents | llama-3.3-70b-versatile |
| **Mistral** | Verifier + Last Keeper | mistral-large-2411 |

### Last Keeper Mode

Groq Rate Limit 발생 시 **Mistral로 즉시 전환**:

```typescript
// multi-agent-supervisor.ts
if (isRateLimit) {
  console.warn(`⚠️ [Supervisor] Groq rate limit detected...`);
  return await executeLastKeeperMode(query, sessionId);
}
```

---

## Data Flow

### 정상 경로 (Normal Path)

```
1. User Input (AISidebarV4)
   ↓
2. useChat → POST /api/ai/supervisor
   ↓
3. route.ts: parts[] → content 변환
   ↓
4. Cloud Run: Supervisor 라우팅
   ↓
5. Worker Agent 실행 (NLQ/Analyst/Reporter)
   ↓
6. Verifier 검증 (Simple Query는 Skip)
   ↓
7. SSE Stream → Data Stream Protocol 변환
   ↓
8. useChat: 실시간 렌더링
```

### Fallback 경로 (Last Keeper)

```
1. User Input
   ↓
2. Groq Rate Limit 감지
   ↓
3. executeLastKeeperMode() 즉시 실행
   ↓
4. Mistral 직접 응답 (도구 없음)
   ↓
5. 1-3초 내 응답 완료
```

---

## 시간-품질 분석

| 경로 | 예상 시간 | 품질 | 효율 |
|------|----------|------|------|
| Last Keeper | 1-3초 | 50% | **16.7%/s** |
| Normal Only | 15-20초 | 70% | 3.5%/s |
| Normal + Verifier | 30-50초 | 85% | 1.7%/s |

**Smart Skip 로직**:
```typescript
const isSimpleQuery = query.length < 30 ||
  /^(안녕|반가워|고마워|도움|뭐해|테스트)/i.test(query);

const { response, verification } = await executeSupervisor(query, {
  enableVerification: !isSimpleQuery, // 간단 쿼리는 Verifier 스킵
});
```

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| [time-quality-correlation-analysis.md](./time-quality-correlation-analysis.md) | 시간-품질 상관관계 분석 |
| [dual-provider-architecture.md](./dual-provider-architecture.md) | Groq + Mistral 전략 |
| [ai-engine-architecture.md](./ai-engine-architecture.md) | AI Engine 전체 아키텍처 |

---

## Changelog

- **v5.88.0** (2025-12-26): Dual-provider 아키텍처 문서화
- **v5.87.1** (2025-12-25): Smart Skip 로직 추가
- **v5.87.0** (2025-12-24): Last Keeper Mode 구현
