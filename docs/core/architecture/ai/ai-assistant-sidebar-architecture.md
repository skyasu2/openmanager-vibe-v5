# AI Assistant Architecture (Sidebar & Fullpage)

> **버전**: v3.0 (2025-12-14)
> **환경**: Next.js 16, TypeScript 5.9, React 19, Vercel AI SDK 5.x

## Overview

OpenManager VIBE v5.83.1의 AI 어시스턴트는 **사이드바 모드**와 **풀페이지 모드**를 지원하는 통합 아키텍처입니다. LangGraph 기반 Multi-Agent 시스템으로 4개 에이전트(Supervisor, NLQ, Analyst, Reporter)를 활용합니다.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
├──────────────────────┬──────────────────────────────────────────┤
│     사이드바 모드     │           풀페이지 모드                   │
│   (AISidebarV4)      │        (AIWorkspace)                     │
├──────────────────────┴──────────────────────────────────────────┤
│                  공유 컴포넌트                                    │
│  EnhancedAIChat, AIAssistantIconPanel, ThinkingVisualizer       │
├─────────────────────────────────────────────────────────────────┤
│                    State (Zustand)                               │
│         useAISidebarStore, useAIThinking                        │
├─────────────────────────────────────────────────────────────────┤
│                        BACKEND                                   │
│              /api/ai/unified-stream (LangGraph)                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │Supervisor│→│NLQ Agent│→│Analyst  │→│Reporter │               │
│  │Llama-8b │ │Gemini   │ │Gemini   │ │Llama-70b│               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

## Sidebar vs Fullpage Comparison

| 항목 | 사이드바 모드 | 풀페이지 모드 |
|:-----|:-------------|:-------------|
| **진입점** | `AISidebarV4.tsx` | `AIWorkspace.tsx` |
| **레이아웃** | 우측 패널 (컴팩트) | 3-column (좌/중앙/우) |
| **너비** | ~400px 고정 | 전체 화면 |
| **기능 선택** | 하단 아이콘 패널 | 좌측 네비게이션 |
| **시스템 컨텍스트** | 숨김 | 우측 패널 표시 |
| **라우트** | 대시보드 내 컴포넌트 | `/dashboard/ai-assistant` |
| **사용 시나리오** | 빠른 질의, 간단한 분석 | 심층 분석, 보고서 작성 |

### Layout Diagrams

**사이드바 모드**:
```
┌─────────────────────────────────┐
│ AISidebarHeader (AI 어시스턴트)   │
├─────────────────────────────────┤
│                                  │
│    EnhancedAIChat                │
│    (메시지 + 입력)                │
│                                  │
├─────────────────────────────────┤
│ AIAssistantIconPanel             │
│ (기능 선택 아이콘)                 │
└─────────────────────────────────┘
```

**풀페이지 모드**:
```
┌──────────────┬──────────────────────────┬──────────────┐
│   LEFT       │    CENTER                │  RIGHT       │
│              │                          │              │
│ - Logo       │  Header (Breadcrumb)     │ System       │
│ - New Chat   │  ┌────────────────────┐  │ Context      │
│ - Feature    │  │  EnhancedAIChat    │  │ - Status     │
│   Icons      │  │  or Feature Page   │  │ - Metrics    │
│              │  │                    │  │              │
│              │  └────────────────────┘  │              │
└──────────────┴──────────────────────────┴──────────────┘
```

## 3 AI Features

### 1. Natural Language Query (Chat)

| 항목 | 값 |
|------|-----|
| **컴포넌트** | `EnhancedAIChat.tsx` |
| **API** | `/api/ai/unified-stream` |
| **에이전트** | Supervisor → NLQ/Analyst/Reporter |
| **기능** | 서버 상태 질의, 메트릭 분석, 일반 대화 |

**흐름**:
```
사용자 입력 → useChat → POST /api/ai/unified-stream
    → LangGraph (Supervisor 라우팅) → 에이전트 실행
    → 스트리밍 응답 → UI 업데이트
```

### 2. Auto Incident Report

| 항목 | 값 |
|------|-----|
| **컴포넌트** | `AutoReportPage.tsx` |
| **API** | `/api/ai/incident-report` |
| **에이전트** | Reporter Agent (Llama 70b) |
| **기능** | 장애 리포트 자동 생성, 근본 원인 분석, 권장사항 |

**응답 구조**:
```typescript
interface IncidentReport {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affected_servers: string[];
  root_cause_analysis: {
    primary_cause: string;
    contributing_factors: string[];
    confidence: number;
  };
  recommendations: Array<{
    action: string;
    priority: 'immediate' | 'high' | 'medium' | 'low';
  }>;
  timeline: Array<{ timestamp: string; event: string }>;
}
```

### 3. Intelligent Monitoring (Anomaly/Prediction)

| 항목 | 값 |
|------|-----|
| **컴포넌트** | `IntelligentMonitoringPage.tsx` |
| **API** | `/api/ai/intelligent-monitoring` |
| **에이전트** | Analyst Agent (Gemini Pro) |
| **기능** | 이상 탐지, 장애 예측, 패턴 분석 |

**워크플로우 3단계**:
```
1. 이상탐지 (Anomaly Detection)
       ↓
2. 근본원인분석 (Root Cause Analysis)
       ↓
3. 예측모니터링 (Predictive Monitoring)
```

## Component Hierarchy

```
src/
├── components/ai/                      # AI 컴포넌트
│   ├── AIAssistantIconPanel.tsx        # 기능 선택 아이콘 (3가지)
│   ├── AIWorkspace.tsx                 # 풀페이지 컨테이너
│   ├── AIContentArea.tsx               # 기능별 페이지 라우팅
│   ├── ThinkingProcessVisualizer.tsx   # AI 사고 과정 시각화
│   ├── MonitoringWorkflow.tsx          # 3단계 워크플로우
│   └── pages/
│       ├── AutoReportPage.tsx          # 자동 보고서
│       └── IntelligentMonitoringPage.tsx # 이상감지/예측
│
├── domains/ai-sidebar/                 # 사이드바 도메인
│   ├── components/
│   │   ├── AISidebarV4.tsx            # 사이드바 전용 (권장)
│   │   ├── EnhancedAIChat.tsx          # 공유 채팅 UI
│   │   ├── AISidebarHeader.tsx         # 헤더
│   │   ├── AIFunctionPages.tsx         # 기능 페이지 전환
│   │   ├── InlineAgentStatus.tsx       # 에이전트 상태
│   │   └── AIEngineIndicator.tsx       # 엔진 상태 표시
│   ├── hooks/
│   │   └── useAIEngine.ts              # 엔진 관리 (하위 호환)
│   └── types/
│       └── ai-sidebar-types.ts         # 타입 정의
│
├── stores/
│   └── useAISidebarStore.ts           # 글로벌 AI 상태 (Zustand)
│
└── app/api/ai/                         # API 라우트
    ├── unified-stream/route.ts         # LangGraph 멀티-에이전트
    ├── incident-report/route.ts        # 자동 보고서
    └── intelligent-monitoring/route.ts # 이상감지/예측
```

## State Management

**Zustand Store** (`useAISidebarStore`):

```typescript
interface AISidebarState {
  // UI 상태
  isOpen: boolean;
  selectedFunction: 'chat' | 'auto-report' | 'intelligent-monitoring';

  // 메시지 (100개 제한)
  messages: EnhancedChatMessage[];
  sessionId: string;
}

interface EnhancedChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'thinking';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  thinkingSteps?: AIThinkingStep[];
}
```

## LangGraph Agent Routing

```
사용자 쿼리 → Supervisor (분류) → 적절한 에이전트

┌────────────────────────────────────────────────────────┐
│ Supervisor (Groq Llama-8b)                             │
│ → "서버 CPU 사용량 보여줘" → NLQ Agent                  │
│ → "이 패턴 분석해줘" → Analyst Agent                    │
│ → "장애 보고서 작성해줘" → Reporter Agent               │
│ → "종합 분석해줘" → Parallel Node (NLQ + Analyst)       │
└────────────────────────────────────────────────────────┘
```

| 에이전트 | 모델 | 역할 | 도구 |
|:---------|:-----|:-----|:-----|
| **Supervisor** | Groq Llama-8b | 인텐트 분류, 라우팅 | - |
| **NLQ Agent** | Gemini Flash | 서버 메트릭 조회 | `getServerMetrics` |
| **Analyst** | Gemini Pro | 패턴 분석, 이상 탐지 | `analyzePattern` |
| **Reporter** | Llama 70b | 리포트 생성, RAG | `searchKnowledgeBase` |

## API Endpoints

| 기능 | 엔드포인트 | 메서드 | 설명 |
|------|-----------|--------|------|
| **자연어 질의** | `/api/ai/unified-stream` | POST | LangGraph 스트리밍 |
| **자동 보고서** | `/api/ai/incident-report` | POST | 장애 리포트 생성 |
| **이상감지** | `/api/ai/intelligent-monitoring` | POST | 예측 분석 |

### Request/Response Format

**Request** (unified-stream):
```json
{
  "messages": [{ "role": "user", "content": "서버 상태 확인" }],
  "sessionId": "optional-session-id"
}
```

**Response** (streaming):
```
Content-Type: text/plain; charset=utf-8
X-Session-Id: session_xxx
X-Backend: cloud-run | local
```

## Key Shared Components

### EnhancedAIChat

사이드바/풀페이지 모두에서 사용되는 핵심 채팅 컴포넌트:

- 메시지 렌더링 (user/assistant/thinking)
- AI 사고 과정 시각화 (ThinkingProcessVisualizer)
- 에이전트 상태 표시 (InlineAgentStatus)
- 자동 스크롤, 키보드 단축키

### AIAssistantIconPanel

3가지 AI 기능 선택 UI:

```typescript
const AI_FUNCTIONS = [
  { id: 'chat', icon: MessageSquare, label: '자연어 질의' },
  { id: 'auto-report', icon: FileText, label: '자동 장애 보고서' },
  { id: 'intelligent-monitoring', icon: Brain, label: '이상감지/예측' },
];
```

## Security & Performance

### Security
- **Input Validation**: Zod 스키마 검증
- **Rate Limiting**: maxDuration 30초
- **Quick Filter/Sanitize**: 입력 정제

### Performance
- **스트리밍**: 실시간 토큰 전송
- **메시지 제한**: 100개 (메모리 관리)
- **SSR 안전**: `skipHydration: true`
- **동적 import**: 기능 페이지 lazy loading

---

> **참고 문서**:
> - `ai-engine-architecture.md`: LangGraph 백엔드 상세
> - `ai-architecture.md`: AI 전체 아키텍처
