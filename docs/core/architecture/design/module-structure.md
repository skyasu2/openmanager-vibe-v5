# 🧩 Module Structure

The `src/modules` directory is used for feature-specific logic, shared utilities, and pluggable components that do not necessarily constitute a full "domain" or are cross-cutting concerns packaged as modules.

## 📂 `src/modules` Directory

Modules are functional units that provide specific capabilities to the application. They are often more focused on technical or specific functional features compared to the broader business domains.

### Current Modules (v5.83.7)

| Module | Files | Description |
|--------|-------|-------------|
| `advanced-features` | 2 | 고급/실험적 기능 (baseline optimizer, demo scenarios) |
| `data-generation` | 1 | Mock 데이터 생성 (RealisticPatternEngine) |
| `performance-monitor` | 5 | 성능 모니터링 (컴포넌트, hooks, services, types) |
| `shared` | 3 | 공유 유틸리티 (constants, types, utils) |
| `third-party-ai-chat` | 1 | 외부 AI 채팅 통합 (AIConversationManager) |

### Module vs. Domain

| Feature        | Domain (`src/domains`)                                        | Module (`src/modules`)                                                         |
| :------------- | :------------------------------------------------------------ | :----------------------------------------------------------------------------- |
| **Scope**      | Broad business capability (e.g., User Management, AI Sidebar) | Specific feature or technical capability (e.g., Performance Monitor, Data Gen) |
| **Components** | Full vertical slice (UI, Logic, State)                        | Often logic-heavy or specific UI widgets                                       |
| **Coupling**   | Loosely coupled, high cohesion                                | Can be used by multiple domains or apps                                        |
| **Usage**      | Represents a major part of the user experience                | Provides tools or specific functionality                                       |

## 🏗️ Module Anatomy

A typical module might contain:

```
src/modules/[module-name]/
├── components/   # Module-specific UI
├── hooks/        # Custom hooks
├── services/     # Business logic
├── types/        # TypeScript types
├── lib/          # Core logic and helper functions (optional)
├── store/        # State management (optional)
└── index.ts      # Public API
```

### Example: Performance Monitor Module

```
src/modules/performance-monitor/
├── components/
│   └── PerformanceMonitor.tsx    # UI 컴포넌트
├── hooks/
│   └── usePerformanceMetrics.ts  # 메트릭 hook
├── services/
│   └── PerformanceService.ts     # 비즈니스 로직
├── types/
│   └── performance.ts            # 타입 정의
└── index.ts                      # Public API
```

## 🚀 Best Practices

- **Keep it Focused**: A module should do one thing well.
- **Reusability**: Design modules to be reusable where possible.
- **Clear Interface**: Use `index.ts` to define a clear boundary.
