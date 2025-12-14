# OpenManager VIBE v5

> **AI-Native 서버 모니터링 PoC**
> **Vibe Coding**을 통해 DevOps의 미래인 **AX (AI Experience)**를 탐구합니다.

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-teal)](https://supabase.com/)
[![Google AI](https://img.shields.io/badge/Google_AI-Gemini_2.5-blue)](https://ai.google.dev/)
[![Biome](https://img.shields.io/badge/Biome-Lint_%26_Format-orange)](https://biomejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-blue)](https://www.typescriptlang.org/)

## 👨‍💻 프로젝트 철학

이 프로젝트는 단순한 서버 모니터링 도구가 아닙니다. **인간과 AI의 협업(Vibe Coding)**이 만들어낼 수 있는 풀스택 개발의 가능성을 증명하는 **Proof of Concept (PoC)**입니다.

기존의 "수동적 모니터링"을 넘어, **AI(Gemini)**가 워크플로우에 직접 통합되어 **"예측하고 상호작용하는 운영(Predictive & Interactive Operations)"** 경험을 제공합니다.

## 🏗️ 시스템 아키텍처

이벤트 기반 아키텍처(Event-Driven Architecture)를 통해 실시간성과 AI 분석 능력을 극대화했습니다.

### 1. 🌐 웹 아키텍처 (Frontend)

Next.js 15 App Router와 React Server Components를 활용하여 초기 로딩 속도와 검색 엔진 최적화(SEO)를 잡았으며, 클라이언트 상호작용은 Zustand와 React Query로 최적화했습니다.

```mermaid
graph TD
    User[사용자 브라우저]
    
    subgraph "Next.js App Router"
        Layout[루트 레이아웃]
        Page[페이지 컴포넌트]
        
        subgraph "Server Components (RSC)"
            DataFetcher[데이터 페칭]
        end
        
        subgraph "Client Components"
            Interactive[인터랙티브 UI]
            Charts[Recharts 시각화]
            Socket[웹소켓 클라이언트]
        end
    end
    
    User --> Layout
    Layout --> Page
    Page --> DataFetcher
    Page --> Interactive
    
    Interactive -->|Zustand| Store[클라이언트 스토어]
    Socket -->|실시간 업데이트| Store
```

### 2. 🔙 백엔드 아키텍처 (Backend)

Supabase를 BaaS로 활용하여 인증, 데이터베이스, 실시간 구독을 처리하며, 비즈니스 로직은 Next.js Edge Functions의 Service Layer로 캡슐화했습니다.

```mermaid
graph TD
    Client[클라이언트 앱]
    
    subgraph "Edge Layer (Next.js)"
        API[Route Handlers]
        Service[Service Layer]
    end
    
    subgraph "Supabase (BaaS)"
        Auth[GoTrue 인증]
        DB[(PostgreSQL)]
        Realtime[Realtime 엔진]
    end
    
    Client -->|REST/RPC| API
    API --> Service
    Service -->|Supabase SDK| DB
    
    DB -->|CDC| Realtime
    Realtime -->|WebSocket| Client
```

### 3. 🧠 AI 엔진 아키텍처 (Intelligence)

**Hybrid Multi-Agent AI Engine (LangGraph)**을 도입하여 단순한 응답을 넘어선 복합적인 추론과 작업을 수행합니다. **Cloud Run**을 주 백엔드로 사용하며(Supervisor-Worker 패턴), 로컬 환경에서도 동일한 로직이 실행되는 하이브리드 구조를 갖추고 있습니다.

```mermaid
graph TD
    Client[사용자/클라이언트] --> API[Next.js API Route]

    subgraph "Hybrid Engine Router"
        API --> Check{Cloud Run 활성?}
        Check -- Yes --> Cloud[Cloud Run (LangGraph Server)]
        Check -- No --> Local[Local LangGraph (Fallback)]
    end

    subgraph "AI Agents (Supervisor-Worker)"
        Cloud --> Supervisor[🦸 Supervisor Agent (Routing)]
        Local --> Supervisor
        
        Supervisor --> NLQ[🔍 NLQ Agent (Metrics)]
        Supervisor --> Analyst[📊 Analyst Agent (Patterns)]
        Supervisor --> Reporter[📝 Reporter Agent (RAG/Report)]
    end

    subgraph "Data & Context"
        NLQ --> Metrics[(Live Metrics)]
        Reporter --> VectorDB[(Knowledge Base)]
        Supervisor --> DB[(Session State)]
    end
```

## ✨ 핵심 기능

### 1. ⚡ 실시간 성능 (Real-time Performance)
- **GPU 가속 UI**: 하드웨어 가속을 통한 부드러운 120fps 애니메이션.
- **WebSocket 통합**: 100ms 미만의 지연 시간으로 메트릭 업데이트.
- **최적화된 렌더링**: RSC와 클라이언트 하이드레이션의 조화.

### 2. 🤖 AI 기반 운영 (AI Operations)
- **Unified AI Engine**: Google Gemini 2.5 Flash 기반의 지능형 처리.
- **자동 코드 리뷰**: 여러 AI 모델이 교차 검증하는 고가용성 리뷰 시스템.
- **문맥 인식 분석**: 현재 시스템 상태와 로그를 이해하고 상관관계를 분석.
- **RAG 트러블슈팅**: 벡터 검색을 통해 과거 사례와 문서를 즉시 참조하여 해결책 제시.

### 3. 🛡️ 개발 품질 (Development Quality)
- **Strict TypeScript**: `any` 타입 사용을 배제한 철저한 타입 안정성.
- **현대적 툴체인**: Biome(린트/포맷), Vitest(단위 테스트), Playwright(E2E).
- **CI/CD 파이프라인**: Vercel을 통한 자동화된 검증 및 배포.

## 🛠️ 서비스 배포 및 역할 (Service Deployment & Roles)

| 서비스 | 배포 환경 / 호스팅 | 역할 설명 |
|--------|-------------------|-----------|
| **Next.js App** | Vercel (Serverless) | 프론트엔드 + API Routes 제공 |
| **AI Backend** | Google Cloud Run (Container / Serverless) | LangGraph 기반 멀티 에이전트 백엔드 |
| **Supabase DB** | Supabase Cloud (Managed PostgreSQL + Auth) | PostgreSQL 데이터베이스 + 인증(Auth) 제공 |

## 📚 문서 (Documentation)

- [**Environment Setup**](docs/environment/README.md): 개발 환경 설정 및 아키텍처 가이드
- [**AI Engine Architecture**](docs/core/architecture/AI_ENGINE_ARCHITECTURE.md): LangGraph Multi-Agent AI 엔진 설계

## 🚀 시작하기

**필수 요구사항**: Node.js v22+, npm v10+

```bash
# 1. 클론 및 설치
git clone https://github.com/your-username/openmanager-vibe-v5.git
cd openmanager-vibe-v5
npm install

# 2. 환경 설정
cp .env.example .env.local
# SUPABASE_URL, SUPABASE_ANON_KEY, GOOGLE_AI_KEY 설정

# 3. 개발 서버 실행
## ⚠️ WSL 사용자 필독 (Recommended)
WSL2 환경에서는 Windows 브라우저 접속을 위해 다음 명령어를 사용하세요:
```bash
npm run dev:network
# 내부적으로 0.0.0.0 바인딩을 수행합니다.
# 자세한 가이드: docs/development/wsl-setup-guide.md
```

## 일반 실행 (Mac/Linux)
```bash
npm run dev:stable
```

---

<div align="center">
  <sub>Built with 💜 using Vibe Coding methodologies.</sub>
</div>
