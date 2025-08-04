# 🏗️ OpenManager VIBE v5 프로젝트 구조 및 아키텍처

**현재 버전**: v5.65.11 (2025-07-28)  
**작성 목적**: 프로젝트의 전체적인 구조와 아키텍처를 한눈에 파악

## 📋 프로젝트 개요

**OpenManager VIBE v5**는 **1인 개발 포트폴리오 프로젝트**로, 2025년 바이브 코딩 대회 출품작입니다. 무료 티어만을 활용하여 구현한 AI 기반 실시간 서버 모니터링 플랫폼으로, 최신 기술 스택의 학습과 실무 적용 능력을 보여줍니다.

### 🎯 프로젝트 특성
- **개발 규모**: 1인 개발 (2025년 5월 말 ~ 현재)
- **프로젝트 성격**: 포트폴리오 + 기술 학습 + 코딩 대회 출품작
- **기술적 도전**: 무료 티어 제약 하에서 완전한 기능 구현
- **현재 상태**: 대회 출품 후 지속적 고도화 진행

### 핵심 기술 스택

- **Frontend**: Next.js 14.2.4 + React 18.2.0 + TypeScript strict mode
- **Backend**: GCP Functions (Python 3.11) + Vercel Edge Runtime
- **Database**: Supabase PostgreSQL (500MB) + pgvector
- **Cache**: Upstash Memory Cache (256MB) + 500K 명령/월
- **AI Engine**: 2-Mode System (LOCAL/GOOGLE_ONLY)
- **Deploy**: Vercel + GCP + Supabase 무료 티어

## 🏛️ 전체 아키텍처

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vercel Edge   │────│   GCP Functions  │────│   Supabase DB   │
│   Next.js 14    │    │   Python 3.11    │    │   PostgreSQL    │
│   (Frontend)    │    │   (AI Backend)   │    │   (Vector DB)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        ▼                        │
         │              ┌──────────────────┐               │
         └──────────────│  Upstash Memory Cache   │───────────────┘
                        │   (Cache/Rate)   │
                        └──────────────────┘
```

## 📂 루트 디렉토리 구조

```
openmanager-vibe-v5/
├── 📁 src/                    # 메인 소스 코드
├── 📁 docs/                   # 프로젝트 문서 (45개)
├── 📁 gcp-functions/          # Python 3.11 서버리스 함수
├── 📁 scripts/                # 자동화 스크립트 (6개 카테고리)
├── 📁 infra/                  # 인프라 설정
├── 📁 tests/                  # 테스트 파일
├── 📁 config/                 # 환경 설정
├── 📄 CLAUDE.md              # Claude Code 가이드
├── 📄 GEMINI.md              # Gemini 협업 가이드
├── 📄 README.md              # 프로젝트 소개
└── 📄 CHANGELOG.md           # 변경 로그
```

## 🔧 src 디렉토리 상세 구조

### 📱 Frontend (app/)

```
src/app/
├── 🏠 page.tsx                    # 메인 랜딩 페이지
├── 📊 dashboard/                  # 서버 모니터링 대시보드
├── 🔐 auth/                       # GitHub OAuth 인증
├── ⚙️ admin/                      # 관리자 패널
├── 🌐 api/                        # API Routes (60+개 엔드포인트)
│   ├── 🤖 ai/                     # AI 쿼리 및 분석
│   ├── 📊 servers/                # 서버 메트릭 CRUD
│   ├── 🔄 realtime/               # 실시간 데이터 스트림
│   ├── 🔐 auth/                   # 인증/인가
│   ├── 📈 metrics/                # 성능 메트릭
│   ├── 🚨 alerts/                 # 알림 시스템
│   └── 🛠️ mcp/                    # MCP 서버 연동
├── 🚦 system-boot/               # 시스템 부팅 시퀀스
└── 💾 test-ai/                   # AI 엔진 테스트
```

### 🧩 Components 구조

```
src/components/
├── 🤖 ai/                         # AI 관련 컴포넌트 (20+개)
│   ├── AIAssistantAdminDashboard   # AI 관리 대시보드
│   ├── AIModeSelector             # LOCAL/GOOGLE_ONLY 모드 선택
│   ├── ThinkingProcessVisualizer  # AI 사고 과정 시각화
│   └── RealTimeThinkingViewer     # 실시간 AI 로그
├── 📊 dashboard/                  # 대시보드 컴포넌트 (30+개)
│   ├── OptimizedDashboard         # 메인 대시보드
│   ├── ServerDashboard            # 서버 목록
│   ├── EnhancedServerModal        # 서버 상세 모달
│   └── monitoring/                # 모니터링 위젯
├── 🔐 auth/                       # 인증 관련
├── 📱 mobile/                     # 모바일 대응
├── 🎨 ui/                         # shadcn/ui 기반 컴포넌트
└── 🔗 shared/                     # 공통 컴포넌트
```

### ⚙️ Services 아키텍처

```
src/services/
├── 🤖 ai/                         # AI 엔진 서비스 (12개)
│   ├── SimplifiedQueryEngine      # 2-Mode AI 통합 엔진
│   ├── supabase-rag-engine       # Supabase RAG 검색
│   ├── embedding-service         # 벡터 임베딩
│   └── query-cache-manager       # AI 쿼리 캐싱
├── 🔌 mcp/                        # MCP 서버 관리 (10개)
│   ├── MCPServerManager          # 9개 MCP 서버 관리
│   ├── official-mcp-client       # MCP 클라이언트
│   └── mcp-orchestrator          # MCP 오케스트레이션
├── 🔐 auth/                       # 인증 서비스
├── 📊 metrics/                    # 메트릭 수집
├── 🔄 realtime/                   # 실시간 데이터
├── 💾 supabase/                   # Supabase 연동
└── 🛠️ system/                     # 시스템 관리
```

### 📦 Types 시스템

```
src/types/
├── 🤖 ai-assistant.ts             # AI 어시스턴트 타입
├── 📊 server-metrics.ts           # 서버 메트릭 타입
├── 🔐 auth.types.ts               # 인증 타입
├── 🔌 mcp.ts                      # MCP 타입
├── 🛡️ type-utils.ts               # 타입 안전성 유틸리티
└── 🌐 unified.ts                  # 통합 타입 정의
```

## 🐍 GCP Functions (Python 3.11)

```
gcp-functions/
├── 🇰🇷 enhanced-korean-nlp/       # 한국어 NLP 처리
│   ├── main.py                   # 2.1x 성능 향상
│   ├── requirements.txt          # Python 의존성
│   └── deploy.sh                 # 배포 스크립트
├── 🤖 unified-ai-processor/       # 통합 AI 처리
│   ├── main.py                   # 2.5x 성능 향상
│   └── deploy.sh
├── 📈 ml-analytics-engine/        # ML 분석 엔진
│   ├── main.py                   # 2.4x 성능 향상
│   └── deploy.sh
└── 🚀 deployment/                 # 통합 배포
    └── deploy-all.sh             # 전체 함수 일괄 배포
```

## 🛠️ 자동화 스크립트

```
scripts/
├── 🌍 env/                        # 환경 설정
├── 🔌 mcp/                        # MCP 서버 관리
├── 🔒 security/                   # 보안 검사
├── 🚀 deployment/                 # 배포 자동화
├── 🧹 maintenance/                # 유지보수
└── 🧪 testing/                    # 테스트 도구
```

## 📚 문서 구조 (JBGE 원칙 적용)

```
docs/
├── 📄 README.md                   # 문서 네비게이션
├── 🚀 quick-start/                # 5분 가이드 (5개)
│   ├── vercel-edge.md            # Fluid Compute, Active CPU
│   ├── supabase-auth.md          # GitHub OAuth, RLS
│   ├── memory cache-cache.md            # 500K 명령/월
│   └── gcp-functions.md          # Python 3.11 서버리스
├── 🤖 ai/                         # AI 시스템 (4개)
├── 💻 development/                # 개발 가이드 (12개)
├── 🚀 gcp/                        # GCP 가이드 (4개)
├── ⚡ performance/                # 성능 최적화 (5개)
├── 🔒 security/                   # 보안 가이드 (4개)
└── 🧪 testing/                    # 테스트 가이드 (2개)
```

## 🔗 핵심 시스템 연동

### 1. AI 시스템 (2-Mode)

```typescript
// LOCAL 모드: Supabase RAG + 자체 NLP
// GOOGLE_ONLY 모드: Google AI (Gemini) 직접 연동

interface AIMode {
  LOCAL: 'supabase-rag' | 'korean-nlp';
  GOOGLE_ONLY: 'google-ai-direct';
}
```

### 2. 실시간 데이터 플로우

```
Client WebSocket ←→ Vercel API ←→ GCP Functions ←→ Supabase
                 ↕
            Upstash Memory Cache (캐싱)
```

### 3. 인증 플로우

```
GitHub OAuth → Supabase Auth → JWT Token → RLS Policy
```

## 📊 개발 성과 및 기술적 지표 (v5.65.11 기준)

| 구성 요소 | 응답 시간 | 학습 성과 | 무료 티어 효율성 |
|-----------|-----------|-----------|------------------|
| Vercel Edge | 152ms | Next.js 14 App Router 숙련 | 30% 사용 (70% 여유) |
| GCP Functions | 200ms | Python 3.11 + ML 구현 | 15% 사용 (충분한 확장성) |
| Supabase DB | 50ms | PostgreSQL + Vector DB | 3.17% 사용 (15.86MB/500MB) |
| Upstash Memory Cache | 5ms | 캐싱 최적화 구현 | 25% 사용 (효율적 활용) |

## 🔧 MCP 서버 생태계

**활성화된 9개 MCP 서버**:

| 서버명 | 용도 | 응답시간 | 상태 |
|--------|------|----------|------|
| filesystem | 파일 시스템 작업 | 0.1s | ✅ |
| github | GitHub 연동 | 1.2s | ✅ |
| memory | 컨텍스트 메모리 | 0.2s | ✅ |
| supabase | DB 직접 연동 | 0.8s | ✅ |
| context7 | 고급 컨텍스트 | 1.5s | ✅ |
| tavily-mcp | 웹 검색 | 2.1s | ✅ |
| sequential-thinking | 순차적 사고 | 0.3s | ✅ |
| playwright | 브라우저 자동화 | 1.8s | ✅ |
| serena | 코드 분석 | 1.1s | ✅ |

## 🚀 10개 서브 에이전트 시스템

| 에이전트 | 전문 분야 | 주요 기능 |
|----------|-----------|-----------|
| **central-supervisor** | 작업 조율 | 복잡한 멀티 에이전트 작업 관리 |
| **ai-systems-engineer** | AI 엔진 | UnifiedAIEngineRouter 최적화 |
| **code-review-specialist** | 코드 품질 | SOLID 원칙, 타입 안전성 |
| **database-administrator** | DB 최적화 | Supabase 성능, pgvector 인덱스 |
| **ux-performance-optimizer** | 성능 최적화 | Core Web Vitals, 번들 크기 |
| **test-automation-specialist** | 테스트 | Jest/Vitest/Playwright 자동화 |
| **issue-summary** | 모니터링 | 24/7 시스템 상태 감시 |
| **gemini-cli-collaborator** | AI 협업 | Claude + Gemini 협력 |
| **mcp-server-admin** | MCP 관리 | 9개 MCP 서버 상태 관리 |
| **doc-structure-guardian** | 문서 관리 | JBGE 원칙 적용 |

## 🔄 데이터 흐름

### 1. 실시간 모니터링

```
서버 메트릭 → GCP Functions → Supabase → Vercel API → Client
             ↓
        Upstash Memory Cache (캐싱)
```

### 2. AI 쿼리 처리

```
사용자 질의 → SimplifiedQueryEngine → [LOCAL|GOOGLE_ONLY] → AI 응답
             ↓
         Query Cache (Memory Cache)
```

### 3. 인증 및 권한

```
GitHub Login → Supabase Auth → JWT → RLS Policy → 데이터 접근
```

## 🛡️ 보안 아키텍처

- **인증**: GitHub OAuth + Supabase Auth
- **권한**: Row Level Security (RLS) 정책
- **암호화**: 환경변수 암호화 시스템
- **Rate Limiting**: Upstash Memory Cache 기반
- **CORS**: Vercel + GCP Functions 설정

## 📈 확장성 계획

### 단기 (v5.66.0)
- [ ] TypeScript Phase 4 완료 (noUncheckedIndexedAccess)
- [ ] GCP VM 무료 티어 활용
- [ ] 모바일 앱 지원

### 장기 (v6.0)
- [ ] Kubernetes 전환
- [ ] 멀티 테넌트 지원
- [ ] 글로벌 확장
- [ ] AI 모델 학습 시스템

## 🔗 관련 문서

- [시스템 아키텍처 (레거시)](./system-architecture.md)
- [AI 시스템 통합 가이드](./ai/ai-system-unified-guide.md)
- [서브 에이전트 가이드](./sub-agents-mcp-mapping-guide.md)
- [Quick Start 가이드](./quick-start/)
- [성능 최적화 가이드](./performance/)

---

**마지막 업데이트**: 2025-07-28  
**문서 작성자**: Claude Code + central-supervisor  
**다음 업데이트**: v5.66.0 릴리스 시