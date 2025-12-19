---
id: domain-driven-design
title: Domain-Driven Design (DDD) Structure
keywords: [architecture, ddd, domains, structure]
priority: high
ai_optimized: true
related_docs:
  - 'architecture/system-architecture-current.md'
  - 'architecture/module-structure.md'
updated: '2025-12-19'
version: 'v5.83.1'
---

# 🏛️ Domain-Driven Design (DDD) Structure

OpenManager VIBE v5 adopts a pragmatic Domain-Driven Design (DDD) approach to organize complex business logic and UI components. This structure helps in maintaining separation of concerns and scalability.

## 📂 `src/domains` Directory

The `src/domains` directory contains self-contained business domains. Each domain encapsulates its own logic, state, and UI, exposing only what is necessary to the rest of the application.

### Structure of a Domain

Taking `ai-sidebar` as a reference implementation, a typical domain folder structure looks like this:

```
src/domains/[domain-name]/
├── components/           # Domain-specific React components
│   └── index.ts          # Component exports
├── hooks/                # Custom hooks for domain logic
│   └── index.ts          # Hook exports
├── types/                # TypeScript type definitions
│   └── index.ts          # Type exports
├── utils/                # Helper functions specific to the domain (optional)
│   └── index.ts          # Utility exports
└── index.ts              # Public API of the domain (unified exports)
```

> **Note**: `services/` 폴더는 필요에 따라 추가할 수 있습니다. 현재 ai-sidebar 도메인은 API 호출을 hooks에서 직접 처리합니다.

### Key Principles

1.  **Encapsulation**: Internal details of a domain should not leak out. Use `index.ts` to explicitly export only the components and functions that other parts of the app need to use.
2.  **Cohesion**: All code related to a specific business capability (e.g., the AI Sidebar) stays together. This makes it easier to understand and modify features without jumping between disparate folders.
3.  **Independence**: Domains should ideally be loosely coupled. If one domain needs to interact with another, it should do so through well-defined interfaces or shared services/state.

## 🌟 Example: AI Sidebar Domain

The `ai-sidebar` domain handles the AI chat interface and interaction logic.

### Current Structure (v5.83.1)

```
src/domains/ai-sidebar/
├── components/
│   ├── AISidebarV4.tsx           # 메인 사이드바 컴포넌트
│   ├── AISidebarHeader.tsx       # 헤더 컴포넌트
│   ├── EnhancedAIChat.tsx        # 채팅 인터페이스
│   ├── AIDebugPanel.tsx          # 디버그 패널
│   ├── AIEngineIndicator.tsx     # 엔진 상태 표시
│   ├── AIFunctionPages.tsx       # 기능 페이지
│   ├── CloudRunStatusIndicator.tsx # Cloud Run 상태
│   ├── InlineAgentStatus.tsx     # 에이전트 상태
│   └── index.ts
├── hooks/
│   ├── useAIEngine.ts            # AI 엔진 상태 관리
│   ├── useAIThinking.ts          # AI 사고 과정 관리
│   └── index.ts
├── types/
│   ├── ai-sidebar-types.ts       # 타입 정의
│   └── index.ts
├── utils/
│   └── index.ts                  # (현재 비어있음)
└── index.ts
```

### Exports

- **hooks**: `useAIEngine`, `useAIThinking`
- **types**: `AIEngineInfo`, `AIResponse`, `AISidebarProps`, `AISidebarState`, `ChatMessage`, `ThinkingStep` 등

## 🔄 Migration to DDD

We are gradually migrating core features to this structure. New major features should be implemented as domains if they represent a distinct business capability.

### Current Domains (v5.83.1)

| Domain | Status | Description |
|--------|--------|-------------|
| `ai-sidebar` | ✅ Active | AI 채팅 인터페이스 및 사이드바 |

### Migration Candidates

다음 기능들은 향후 domain으로 분리될 수 있습니다:

- `dashboard` - 대시보드 컴포넌트 및 상태 관리
- `server-monitoring` - 서버 모니터링 로직
- `alerts` - 알림 시스템

## 📝 Best Practices

### Domain 생성 가이드

```typescript
// src/domains/[domain-name]/index.ts
/**
 * [Domain Name] Domain Export
 * 도메인 통합 export
 */

// Hooks
export { useMyHook } from './hooks';

// Types
export type { MyType } from './types';

// Components (필요시)
export { MyComponent } from './components';
```

### Import 규칙

```typescript
// ✅ Good: domain index에서 import
import { useAIEngine, type AIResponse } from '@/domains/ai-sidebar';

// ❌ Bad: 내부 파일 직접 import
import { useAIEngine } from '@/domains/ai-sidebar/hooks/useAIEngine';
```
