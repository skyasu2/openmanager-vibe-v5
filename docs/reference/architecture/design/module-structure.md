# 🧩 Project Structure (Next.js Standard)

> **프로젝트 버전**: v5.87.0 | **Updated**: 2026-01-14

## 📂 디렉토리 구조

```
src/
├── __mocks__/         # Mock 데이터 (Jest/Vitest)
│   ├── data/          # API 모의 데이터
│   └── msw/           # MSW 핸들러
├── app/               # Next.js App Router
├── components/        # React 컴포넌트
│   └── ai-sidebar/    # AI 사이드바 컴포넌트
├── config/            # 설정 파일
├── constants/         # 상수
├── context/           # React Context
├── data/              # 정적 데이터 파일
├── database/          # 데이터베이스 유틸리티
├── hooks/             # 커스텀 훅
│   ├── ai-sidebar/    # AI 사이드바 훅
│   └── performance/   # 성능 모니터링 훅
├── lib/               # 유틸리티 라이브러리
│   ├── core/          # 핵심 시스템 (ProcessManager, Watchdog)
│   └── interfaces/    # 공통 인터페이스
├── schemas/           # 검증 스키마 (Zod)
├── scripts/           # 내부 스크립트
├── services/          # 비즈니스 서비스
│   ├── ai/            # AI 서비스
│   ├── data/          # 데이터 서비스
│   ├── metrics/       # 메트릭 서비스
│   └── performance/   # 성능 서비스
├── stores/            # Zustand 상태 관리
├── styles/            # CSS 스타일
├── test/              # 테스트 유틸리티
├── types/             # TypeScript 타입
│   ├── ai-sidebar/    # AI 사이드바 타입
│   └── performance/   # 성능 타입
├── utils/             # 유틸리티 함수
│   └── ai-sidebar/    # AI 사이드바 유틸
└── validators/        # 유효성 검사
```

## 🏗️ 구조 원칙

### Layer-First + Feature Grouping

| 계층 | 역할 | 예시 |
|------|------|------|
| `app/` | 라우팅, 페이지 | `/dashboard`, `/api/*` |
| `components/` | UI 컴포넌트 | `ServerCard`, `AISidebar` |
| `hooks/` | 상태/로직 훅 | `useAIEngine`, `usePerformanceMetrics` |
| `services/` | 비즈니스 로직 | `PerformanceService`, `MetricsProvider` |
| `lib/` | 핵심 유틸리티 | `ProcessManager`, `EventBus` |
| `types/` | 타입 정의 | `Server`, `AIMode` |

### 기능별 하위 디렉토리

큰 기능은 각 계층 내에서 하위 디렉토리로 그룹화:

```
hooks/
├── ai-sidebar/        # AI 사이드바 관련 훅
│   ├── useAIEngine.ts
│   └── useAISidebarChat.ts
├── performance/       # 성능 모니터링 훅
│   └── usePerformanceMetrics.ts
└── useOptimizedRealtime.ts  # 공통 훅
```

## 🚀 Best Practices

- **Flat when possible**: 파일이 적으면 하위 디렉토리 없이 flat 구조 유지
- **Feature grouping**: 관련 파일이 3개 이상이면 기능별 하위 디렉토리 생성
- **Clear imports**: `@/` alias 사용 (`@/hooks/ai-sidebar/useAIEngine`)
- **Colocation**: 테스트 파일은 `tests/` 디렉토리에 미러링

## 📝 Migration Note

이전 DDD 구조에서 마이그레이션됨:

| 이전 | 현재 |
|------|------|
| `src/domains/ai-sidebar/` | `src/components/`, `src/hooks/`, `src/types/ai-sidebar/` |
| `src/modules/performance-monitor/` | `src/services/`, `src/hooks/`, `src/types/performance/` |
| `src/core/` | `src/lib/core/` |
| `src/interfaces/` | `src/lib/interfaces/` |
| `src/mock/`, `src/mocks/` | `src/__mocks__/` |
