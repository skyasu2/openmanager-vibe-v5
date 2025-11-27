# AI Assistant & AI Sidebar Architecture Design

> **문서 목적**: OpenManager VIBE v5의 AI Assistant 및 AI Sidebar 아키텍처 설계도
> **작성일**: 2025-11-19
> **버전**: v1.0
> **환경**: Next.js 15.4.5, TypeScript 5.7.2, React 18

## 📋 아키텍처 개요

### 시스템 구성도

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Layer (Next.js)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   AI Sidebar    │  │ AI Assistant    │  │ Dashboard UI    │  │
│  │   Components    │  │   Components    │  │   Components    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    State Management Layer                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ AISidebar Store  │  │ AI Assistant    │  │ Global Store    │  │
│  │   (Zustand)      │  │ Store (Zustand) │  │   (Zustand)     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    Service Layer                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ AI Sidebar      │  │ AI Query        │  │ Performance     │  │
│  │ Service         │  │ Engine          │  │ Monitor         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    API Layer (Next.js Routes)                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ /api/ai/query   │  │ /api/ai/        │  │ /api/health     │  │
│  │                 │  │ google-ai/      │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    External AI Services                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Google Cloud    │  │ Supabase RAG    │  │ Local AI        │  │
│  │ Functions       │  │ Pipeline        │  │ Processing      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🏗️ 핵심 아키텍처 패턴

### 1. Layered Architecture (계층형 아키텍처)

- **Presentation Layer**: UI 컴포넌트 및 사용자 인터페이스
- **Business Logic Layer**: 상태 관리 및 비즈니스 규칙
- **Service Layer**: 데이터 처리 및 외부 API 통신
- **Data Access Layer**: 데이터베이스 및 외부 서비스 연동

### 2. Domain-Driven Design (DDD)

- **AI Sidebar Domain**: `src/domains/ai-sidebar/`
- **AI Assistant Domain**: `src/components/ai/`
- **Shared Domain**: 공통 유틸리티 및 타입

### 3. Event-Driven Architecture

- 실시간 AI 응답 스트리밍
- 사용자 인터랙션 이벤트 처리
- 시스템 상태 변경 알림

## 📁 디렉터리 구조

```
src/
├── domains/
│   └── ai-sidebar/                    # AI 사이드바 도메인
│       ├── components/
│       │   ├── AISidebarV3.tsx       # 메인 사이드바 컴포넌트
│       │   ├── AIChatMessages.tsx    # 채팅 메시지 컴포넌트
│       │   ├── AIEngineSelector.tsx  # AI 엔진 선택기
│       │   ├── AIThinkingDisplay.tsx # AI 사고 과정 표시
│       │   └── EnhancedAIChat.tsx    # 향상된 채팅 컴포넌트
│       ├── hooks/
│       │   ├── useAIEngine.ts        # AI 엔진 훅
│       │   ├── useAIThinking.ts      # AI 사고 과정 훅
│       │   └── index.ts              # 훅 내보내기
│       ├── services/
│       │   └── RealAISidebarService.ts # AI 사이드바 서비스
│       ├── types/
│       │   ├── ai-sidebar-types.ts   # 타입 정의
│       │   └── index.ts              # 타입 내보내기
│       └── utils/
│           ├── aiQueryHandlers.ts    # 쿼리 핸들러
│           └── index.ts              # 유틸리티 내보내기
├── components/
│   ├── ai/                           # AI 어시스턴트 컴포넌트
│   │   ├── AIAssistantIconPanel.tsx  # AI 아이콘 패널
│   │   ├── AssistantLogPanel.tsx      # 어시스턴트 로그 패널
│   │   ├── AIPerformanceMonitor.tsx  # AI 성능 모니터
│   │   ├── RealTimeThinkingViewer.tsx # 실시간 사고 뷰어
│   │   └── pages/
│   │       └── AIChatPage.tsx        # AI 채팅 페이지
│   └── dashboard/
│       ├── AISidebarContent.tsx      # 대시보드 사이드바 콘텐츠
│       └── AIAssistantButton.tsx     # AI 어시스턴트 버튼
├── stores/
│   ├── useAISidebarStore.ts          # AI 사이드바 상태 관리
│   └── modules/
│       └── ai.store.ts               # AI 상태 모듈
├── services/
│   └── ai/
│       ├── performance-optimized-query-engine.ts # 성능 최적화 쿼리 엔진
│       └── SimplifiedQueryEngine.processors.googleai.ts # Google AI 프로세서
├── types/
│   ├── ai-assistant.ts               # AI 어시스턴트 타입
│   ├── ai-assistant-input-schema.ts  # 입력 스키마 타입
│   ├── ai-thinking.ts                # AI 사고 과정 타입
│   └── ai-types.ts                   # AI 관련 타입
└── app/
    └── api/
        └── ai/
            ├── query/
            │   └── route.ts          # AI 쿼리 API
            └── google-ai/
                └── generate/
                    └── route.ts      # Google AI 생성 API
```

## 🔧 핵심 컴포넌트 상세 설계

### 1. AI Sidebar V3 (메인 컴포넌트)

**역할**: AI 사이드바의 핵심 UI 컴포넌트
**주요 기능**:

- 다중 AI 엔진 지원 (Google AI, Local AI)
- 실시간 AI 사고 과정 시각화
- 채팅 메시지 관리
- 스트리밍 응답 처리

**주요 Props**:

```typescript
interface AISidebarV3Props {
  isOpen: boolean;
  onClose: () => void;
  defaultEngine?: AIMode;
  sessionId?: string;
  enableRealTimeThinking?: boolean;
  onEngineChange?: (engine: AIMode) => void;
  onMessageSend?: (message: string) => void;
}
```

### 2. AI Query Engine (쿼리 처리 엔진)

**역할**: AI 쿼리 처리 및 응답 생성
**처리 파이프라인**:

```
User Query → Pattern Matching → Context Retrieval → AI Processing → Response Generation
```

**주요 컴포넌트**:

- `SimplifiedQueryEngine`: 기본 쿼 처리 엔진
- `GoogleAIProcessor`: Google AI 전용 프로세서
- `PerformanceOptimizedQueryEngine`: 성능 최적화 엔진

### 3. State Management (상태 관리)

**AISidebar Store**:

```typescript
interface AISidebarState {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  selectedEngine: AIMode;
  sessionId: string;
  messages: ChatMessage[];
}
```

**AI Assistant Store**:

```typescript
interface AIAssistantState {
  logs: ResponseLogData[];
  suggestions: PatternSuggestion[];
  documents: ContextDocument[];
  systemHealth: SystemHealth;
  stats: AIAssistantStats;
}
```

## 🔄 데이터 흐름 아키텍처

### 1. 사용자 쿼리 처리 흐름

```
1. 사용자 입력 → AISidebarV3
2. 메시지 검증 → useAIEngine Hook
3. 쿼리 전송 → RealAISidebarService
4. API 호출 → /api/ai/query
5. AI 처리 → Google Cloud Functions
6. 응답 수신 → 스트리밍 처리
7. UI 업데이트 → ChatMessage 렌더링
```

### 2. AI 사고 과정 시각화 흐름

```
1. AI 처리 시작 → ThinkingStep 생성
2. 단계별 상태 업데이트 → useAIThinking Hook
3. 실시간 UI 렌더링 → AIThinkingDisplay
4. 완료 상태 처리 → 최종 응답 표시
```

### 3. 성능 모니터링 흐름

```
1. 요청 시작 → 성능 메트릭 수집
2. 처리 시간 측정 → AIPerformanceMonitor
3. 리소스 사용량 추적 → 시스템 상태 업데이트
4. 대시보드 표시 → 성능 카드 렌더링
```

## 🛡️ 보안 아키텍처

### 1. 인증 및 권한 관리

- **JWT Token**: 사용자 인증
- **API Key**: 외부 AI 서비스 인증
- **Role-Based Access**: 관리자/일반 사용자 구분

### 2. 데이터 보안

- **입력 검증**: SQL Injection, XSS 방지
- **출력 필터링**: 민감 정보 마스킹
- **전송 암호화**: HTTPS/TLS 통신

### 3. 프라이버시 보호

- **데이터 익명화**: 개인 식별 정보 제거
- **로컬 처리 옵션**: 민감 데이터 외부 전송 방지
- **데이터 보관 정책**: 자동 데이터 만료

## 🚀 성능 최적화 아키텍처

### 1. 프론트엔드 최적화

- **Code Splitting**: 동적 컴포넌트 로딩
- **Virtual Scrolling**: 대량 메시지 효율적 렌더링
- **Memoization**: 불필요한 리렌더링 방지
- **Debouncing**: 사용자 입력 최적화

### 2. 네트워크 최적화

- **스트리밍 응답**: 실시간 AI 응답 제공
- **요청 캐싱**: 반복 쿼리 응답 속도 향상
- **Compression**: 데이터 전송량 최소화
- **CDN**: 정적 리소스 빠른 전송

### 3. 서버 최적화

- **Edge Computing**: Vercel Edge Functions 활용
- **Connection Pooling**: 데이터베이스 연결 최적화
- **Background Processing**: 무거운 작업 비동기 처리
- **Rate Limiting**: API 요청 제한

## 📊 모니터링 및 로깅 아키텍처

### 1. 성능 모니터링

- **응답 시간**: AI 쿼리 처리 시간 추적
- **처리량**: 동시 요청 수 모니터링
- **에러율**: 실패율 및 원인 분석
- **리소스 사용**: CPU, 메모리 사용량 추적

### 2. 사용자 행동 분석

- **쿼리 패턴**: 자주 묻는 질문 분석
- **사용 시간**: 사용자 참여도 측정
- **기능 사용률**: 각 기능의 사용 빈도
- **사용자 피드백**: 만족도 및 개선사항

### 3. 시스템 상태 모니터링

- **서비스 상태**: API 및 외부 서비스 연동 상태
- **데이터베이스**: 쿼리 성능 및 연결 상태
- **AI 서비스**: Google AI, Supabase RAG 상태
- **알림 시스템**: 실시간 상태 변경 알림

## 🔮 확장성 아키텍처

### 1. 수평적 확장

- **Stateless Design**: 서버 인스턴스 무 상태 설계
- **Load Balancing**: 요청 분산 처리
- **Microservices**: 기능별 서비스 분리
- **Container Orchestration**: Kubernetes 배포 지원

### 2. 기능적 확장

- **Plugin Architecture**: 새로운 AI 엔진 플러그인
- **Custom Components**: 확장 가능한 UI 컴포넌트
- **API Extensibility**: 개방형 API 설계
- **Third-party Integration**: 외부 서비스 연동

### 3. 데이터 확장

- **Multi-tenancy**: 다중 테넌트 지원
- **Data Sharding**: 대용량 데이터 분산 저장
- **Backup Strategy**: 데이터 백업 및 복구
- **Migration Tools**: 데이터 마이그레이션 지원

## 🧪 테스트 아키텍처

### 1. 단위 테스트

- **Component Testing**: 개별 컴포넌트 기능 검증
- **Hook Testing**: 커스텀 훅 동작 검증
- **Service Testing**: 서비스 로직 검증
- **Utility Testing**: 유틸리티 함수 검증

### 2. 통합 테스트

- **API Integration**: API 엔드포인트 통합 검증
- **Database Integration**: 데이터베이스 연동 검증
- **External Service**: 외부 AI 서비스 연동 검증
- **State Management**: 상태 관리 통합 검증

### 3. E2E 테스트

- **User Flow**: 사용자 시나리오 전체 검증
- **Cross-browser**: 다양한 브라우저 호환성
- **Performance**: 성능 기준 충족 검증
- **Accessibility**: 웹 접근성 준수 검증

## 📝 기술 스택 요약

### Frontend

- **Framework**: Next.js 15.4.5 (App Router)
- **Language**: TypeScript 5.7.2
- **State Management**: Zustand
- **UI Components**: Radix UI + TailwindCSS
- **Testing**: Vitest + Playwright

### Backend

- **Runtime**: Node.js 22.15.1
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js
- **Deployment**: Vercel

### AI Services

- **Primary**: Google Generative AI (@google/generative-ai)
- **RAG**: Supabase Vector Database
- **Processing**: Google Cloud Functions
- **Monitoring**: Custom Performance Monitor

### Development Tools

- **Package Manager**: npm 10.9.2
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript Compiler
- **Build**: Next.js Build System

## 🔮 향후 개발 로드맵

### Phase 1: 안정화 (현재 ~ 1개월)

- [ ] 성능 최적화 완료
- [ ] 에러 핸들링 강화
- [ ] 테스트 커버리지 90% 달성
- [ ] 사용자 피드백 반영

### Phase 2: 기능 확장 (1~3개월)

- [ ] 다중 AI 엔진 지원 확대
- [ ] 실시간 협업 기능
- [ ] 고급 분석 대시보드
- [ ] 모바일 앱 지원

### Phase 3: 엔터프라이즈 (3~6개월)

- [ ] 엔터프라이즈 보안 강화
- [ ] 온프레미스 배포 지원
- [ ] 커스텀 AI 모델 통합
- [ ] API 마켓플레이스

---

> **문서 유지보수**: 이 아키텍처 문서는 시스템 변경 시 즉시 업데이트되어야 합니다.
> **버전 관리**: 모든 변경 사항은 CHANGELOG.md에 기록됩니다.
> **팀 협업**: 아키텍처 변경 시 반드시 기술 리뷰를 거쳐야 합니다.
