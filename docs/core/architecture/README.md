---
category: design
purpose: system_architecture_and_design
ai_optimized: true
query_triggers:
  - '시스템 설계'
  - '아키텍처 구조'
  - 'MCP 설계'
  - 'AI 시스템 설계'
  - '모니터링 아키텍처'
related_docs:
  - 'docs/core/architecture/'
  - 'docs/claude/architecture/'
  - 'src/'
last_updated: '2025-12-12'
---

# 📐 설계 문서 (Design Documents)

**목적**: OpenManager VIBE 시스템 설계 및 아키텍처 문서

---

## 📂 디렉토리 구조

```
design/
├── current/        (7개) - 최신 버전별 상세 구현 (v5.71.0+)
├── features/       (5개) - 기능별 일반 설계 원칙
├── core/           (4개) - 기본 아키텍처 원칙
├── infrastructure/ (4개) - 인프라 계층 설계
├── specs/          (3개) - 설계 스펙 및 템플릿
└── ui/             (2개) - UI/UX 설계
```

---

## 🎯 디렉토리별 역할

### 1. current/ - 최신 구현 아키텍처

**특징**: 버전별 상세 구현 문서 (v5.71.0 기준)
**갱신**: 지속적 (6-30일 전 최종 수정)

**주요 문서**:

- `system-architecture-ai.md` (590줄) - AI 시스템 및 성능 아키텍처
- `system-architecture-deployment.md` (335줄) - 배포 및 운영 아키텍처
- `mcp-connection-pool-optimization.md` - MCP 연결 풀 최적화

**사용 시점**: 실제 구현, 코드 작성, 상세 리뷰

---

### 2. features/ - 기능별 설계 원칙

**특징**: 일반적 설계 원칙, 기능 개요
**관계**: features (일반) → current (구현)

**주요 문서**:

- `ai-system.md` (95줄) - 4-AI 교차검증 시스템 일반 설계
- `mcp.md` - MCP 서버 통합 아키텍처 (9개 서버)
- `monitoring.md` (109줄) - FNV-1a 해시 모니터링 원칙

**사용 시점**: 새 기능 설계, 아키텍처 리뷰, 원칙 확인

---

### 3. core/ - 기본 아키텍처

**특징**: 시스템의 기본 설계 원칙 (34일 전, 안정적)

**주요 문서**:

- `system-architecture-current.md` - 전체 시스템 아키텍처
  - 4계층: Frontend / API / Service / Data
  - 227K 코드라인, TypeScript strict 100%
- `consistency.md` - 데이터 일관성 전략
- `data-flow.md` - 데이터 흐름 파이프라인

**Query Triggers**: "전체 시스템 구조", "4계층 아키텍처", "데이터 일관성"

---

### 4. infrastructure/ - 인프라 설계

**문서**: `api.md`, `database.md`, `deployment.md`, `security.md`

**사용 시점**: 인프라 변경, 배포 설정, 보안 검토

---

### 5. specs/ - 설계 스펙 및 템플릿

**주요 문서**:

- `work-plan-template.md` - 작업 계획 템플릿
- `archived/template.md` (429줄) - 상세 작업 분할 템플릿

**사용 시점**: 새 기능 스펙 작성, SDD Phase 3

---

### 6. ui/ - UI/UX 설계

**문서**: `components.md`, `styling.md`

**사용 시점**: UI 컴포넌트 개발, 디자인 시스템 구축

---

## 🔄 문서 계층 구조

```
core/         (기본 원칙)
  ↓
features/     (일반 설계)
  ↓
current/      (구체적 구현)
  ↓
src/          (실제 코드)
```

**예시**: MCP 설계

1. **core/architecture.md**: 전체 시스템에서 MCP 위치
2. **features/mcp.md**: MCP 통합 일반 설계
3. **current/mcp-connection-pool-optimization.md**: 연결 풀 최적화 구현
4. **src/services/mcp/**: 실제 코드

---

## 📊 문서 통계 (2025-10-16)

| 디렉토리        | 파일 수 | 평균 나이 | 특징          |
| --------------- | ------- | --------- | ------------- |
| current/        | 7       | 15일      | 활발히 갱신   |
| features/       | 5       | 6-34일    | 안정적        |
| core/           | 4       | 34일      | 안정적        |
| infrastructure/ | 4       | -         | 안정적        |
| specs/          | 3       | -         | 템플릿        |
| ui/             | 2       | 34일      | 안정적        |
| **합계**        | **25**  | -         | **중복 없음** |

---

## 📑 Document Index (AI Query Guide)

### 새 기능 설계 시

- `docs/core/architecture/system-architecture-current.md` → 전체 구조 확인
- `specs/work-plan-template.md` → 템플릿
- `features/[topic].md` → 일반 설계
- `current/[feature]-v5.XX.md` → 구체적 구현

### 기존 설계 검토 시

- `features/[topic].md` → 일반 원칙
- `current/[feature]-v5.XX.md` → 최신 구현
- `src/` → 실제 코드

---

**Last Updated**: 2025-12-12 by Claude Code
## 🔄 기술 스택 상세

### Frontend 핵심 프레임워크
```
Next.js 16.0.7 (App Router)
React 19.2.1 (RSC, Actions)
TypeScript 5.9.3 (strict mode)
```

### 상태 관리
- **Zustand**: 글로벌 클라이언트 상태 (사이드바, UI 설정)
- **React Query**: 서버 상태 동기화
- **React Server Components**: 서버 사이드 상태

## 🌐 Web Architecture (Frontend)

### 핵심 스택
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | Next.js 16 | App Router, Server Actions, Edge Runtime |
| **Language** | TypeScript | Strict type safety, Zero `any` policy |
| **Styling** | Tailwind CSS | Utility-first styling, Dark mode support |
| **UI Library** | Shadcn/UI | Accessible, reusable components (Radix UI based) |
| **State** | Zustand | Global client state (Sidebar, UI preferences) |

### Backend & Deployment Architecture

| 서비스 | 배포 환경 / 호스팅 | 역할 설명 |
|--------|-------------------|-----------|
| **Next.js App** | Vercel (Serverless) | 프론트엔드 + API Routes 제공 |
| **AI Backend** | Google Cloud Run (Container / Serverless) | LangGraph 기반 멀티 에이전트 백엔드 |
| **Supabase DB** | Supabase Cloud (Managed PostgreSQL + Auth) | PostgreSQL 데이터베이스 + 인증(Auth) 제공 |
