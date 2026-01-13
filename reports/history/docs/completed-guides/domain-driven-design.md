# 🏛️ Next.js Standard + DDD-lite Structure

> **Updated**: 2026-01-09 - Layer-First + Feature Grouping 구조로 전환

OpenManager VIBE v5는 **Next.js 표준 구조**에 **DDD-lite** 원칙을 적용합니다.
순수 DDD의 `src/domains/` 구조 대신, Next.js 친화적인 Layer-First 접근법을 사용합니다.

## 📂 구조 원칙

### Layer-First + Feature Grouping

```
src/
├── components/        # UI 컴포넌트 (Layer)
│   └── ai-sidebar/    # 기능별 그룹 (Feature)
├── hooks/             # 커스텀 훅 (Layer)
│   ├── ai-sidebar/    # 기능별 그룹
│   └── performance/   # 기능별 그룹
├── services/          # 비즈니스 로직 (Layer)
│   └── performance/   # 기능별 그룹
├── types/             # 타입 정의 (Layer)
│   ├── ai-sidebar/    # 기능별 그룹
│   └── performance/   # 기능별 그룹
└── utils/             # 유틸리티 (Layer)
    └── ai-sidebar/    # 기능별 그룹
```

### DDD-lite 원칙 적용

| DDD 원칙 | Next.js 적용 |
|----------|-------------|
| **Encapsulation** | 각 기능 폴더 내 `index.ts`로 public API 정의 |
| **Cohesion** | 관련 파일을 기능별 하위 디렉토리로 그룹화 |
| **Loose Coupling** | Layer 간 의존성 방향 준수 (hooks → services → types) |

## 🌟 예시: AI Sidebar 기능

### 파일 분포

```
src/
├── components/ai-sidebar/
│   ├── AISidebarV4.tsx           # 메인 사이드바
│   ├── AISidebarHeader.tsx       # 헤더
│   ├── EnhancedAIChat.tsx        # 채팅 UI
│   ├── AIDebugPanel.tsx          # 디버그 패널
│   ├── AIEngineIndicator.tsx     # 엔진 상태
│   ├── CloudRunStatusIndicator.tsx
│   └── index.ts                  # Public exports
├── hooks/ai-sidebar/
│   ├── useAIEngine.ts            # 엔진 상태 관리
│   ├── useAIThinking.ts          # 사고 과정 관리
│   └── index.ts
├── types/ai-sidebar/
│   ├── ai-sidebar-types.ts       # 타입 정의
│   └── index.ts
└── utils/ai-sidebar/
    └── index.ts
```

### Import 패턴

```typescript
// ✅ Good: Layer별 import
import { AISidebarV4 } from '@/components/ai-sidebar';
import { useAIEngine } from '@/hooks/ai-sidebar';
import type { AIResponse } from '@/types/ai-sidebar';

// ✅ Also Good: 개별 파일 import (필요시)
import { useAIEngine } from '@/hooks/ai-sidebar/useAIEngine';
```

## 🔄 기존 DDD와의 비교

### 이전 구조 (순수 DDD)
```
src/domains/ai-sidebar/
├── components/
├── hooks/
├── types/
└── index.ts  # 모든 것을 하나의 domain에서 export
```

### 현재 구조 (Next.js + DDD-lite)
```
src/
├── components/ai-sidebar/  # Layer 우선
├── hooks/ai-sidebar/       # 기능별 그룹화
├── types/ai-sidebar/
└── utils/ai-sidebar/
```

### 변경 이유

1. **Next.js 친화적**: App Router, Server Components와 자연스러운 통합
2. **도구 호환성**: ESLint, Prettier 등 도구들이 Layer 구조 기대
3. **팀 친숙도**: 대부분의 Next.js 개발자가 익숙한 패턴
4. **Vercel 최적화**: 배포 시 자동 코드 스플리팅 최적화

## 📝 Best Practices

### 새 기능 추가 시

```bash
# 기능이 작은 경우 (파일 1-2개)
src/hooks/useNewFeature.ts
src/types/new-feature.ts

# 기능이 큰 경우 (파일 3개 이상)
src/hooks/new-feature/
├── useNewFeatureState.ts
├── useNewFeatureActions.ts
└── index.ts
```

### index.ts 패턴

```typescript
// src/hooks/ai-sidebar/index.ts
export { useAIEngine } from './useAIEngine';
export { useAIThinking } from './useAIThinking';

// Re-export types for convenience
export type { AIEngineState } from './useAIEngine';
```

### 의존성 방향

```
components → hooks → services → types
     ↓         ↓         ↓
   utils     utils     utils
```

- **components**: hooks, types, utils 사용 가능
- **hooks**: services, types, utils 사용 가능
- **services**: types, utils만 사용
- **types**: 다른 types만 참조 가능
