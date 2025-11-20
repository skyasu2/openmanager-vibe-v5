---
category: architecture
purpose: system_architecture_and_standards
ai_optimized: true
query_triggers:
  - '시스템 아키텍처'
  - 'API 설계'
  - '데이터베이스'
  - '기술 스택'
related_docs:
  - 'architecture/SYSTEM-ARCHITECTURE-CURRENT.md'
  - 'architecture/api/endpoints.md'
  - 'ai/README.md'
last_updated: '2025-11-20'
---

# 🏗️ 아키텍처 문서

**목적**: 시스템 아키텍처, API 설계, 데이터베이스 구조 문서

---

## 📂 디렉토리 구조

```
architecture/
├── SYSTEM-ARCHITECTURE-CURRENT.md  # 현재 시스템 아키텍처 (v5.79.1) ⭐
├── SYSTEM-ARCHITECTURE-REVIEW.md   # 아키텍처 검토 보고서
├── api/                            # API 설계 (4개)
│   ├── endpoints.md               # 85개 엔드포인트 레퍼런스 ⭐
│   ├── routes.md                  # 라우팅 구조
│   ├── schemas.md                 # 스키마 정의
│   └── validation.md              # 검증 규칙
├── db/                            # 데이터베이스 (3개)
│   ├── schema.md                  # Supabase 스키마
│   ├── queries.md                 # 쿼리 최적화
│   └── optimization.md            # 성능 최적화
└── decisions/                     # ADR (2개)
    ├── adr-001-unified-ai-engine-cache-and-providers.md
    └── adr-002-server-card-rendering-strategy.md
```

---

## 🎯 핵심 문서

### 1. 시스템 아키텍처

#### **SYSTEM-ARCHITECTURE-CURRENT.md** ⭐
**현재 시스템의 전체 구조 (v5.79.1)**

```
Frontend (Next.js 15)
    ↓
API Layer (85개 Routes)
    ↓
Service Layer (AI, Data)
    ↓
Data Layer (StaticDataLoader, Supabase, Google AI)
```

**포함 내용**:
- 계층별 컴포넌트 상세
- 85개 API Routes 분류
- 데이터 플로우
- 성능 지표
- 배포 구성

#### **SYSTEM-ARCHITECTURE-REVIEW.md**
**아키텍처 검토 및 개선 제안**

---

### 2. API 설계 (api/)

#### **endpoints.md** ⭐
**85개 API 엔드포인트 완전 레퍼런스**

카테고리:
- 🤖 AI 관련 (20개)
- 🖥️ 서버 관리 (30개)
- 📈 메트릭 (15개)
- 🔐 인증 (5개)
- 🔧 유틸리티 (15개)

#### **routes.md**
라우팅 구조 및 미들웨어

#### **schemas.md**
API 스키마 정의 (Zod)

#### **validation.md**
입력 검증 규칙

---

### 3. 데이터베이스 (db/)

#### **schema.md**
Supabase PostgreSQL 스키마

테이블:
- `ai_conversations` - AI 대화 이력
- `ai_context_cache` - 컨텍스트 캐시 (3분 TTL)
- `embeddings` - RAG 벡터 (pgvector)

#### **queries.md**
쿼리 최적화 가이드

#### **optimization.md**
성능 최적화 전략

---

### 4. 아키텍처 결정 기록 (decisions/)

#### **ADR-001: Unified AI Engine**
통합 AI 엔진 및 캐싱 전략

#### **ADR-002: Server Card Rendering**
서버 카드 렌더링 최적화

---

## 🔄 기술 스택

### Frontend
```
Next.js 15.4.5 + React 18 + TypeScript 5.7.2
Zustand (상태) + React Query (서버 상태)
Chart.js + Recharts (차트)
shadcn/ui + Tailwind CSS (UI)
```

### Backend
```
Vercel Edge Functions (85개 Routes)
Google AI (Gemini 2.5 Flash)
Supabase PostgreSQL + pgvector
```

### 데이터
```
StaticDataLoader (Mock 데이터, 99.6% CPU 절약)
24시간 고정 데이터 + 1분 보간
17개 서버 시뮬레이션
```

---

## 📊 성능 지표

| 항목 | 값 |
|------|-----|
| API 평균 응답 | 152ms |
| Google AI 응답 | 1초 이내 |
| 페이지 로드 | 1.2초 |
| E2E 테스트 통과율 | 98.2% |

---

## 🎯 주요 특징

### 1. 무료 티어 최적화
- Vercel: ~10GB/월 (100GB 중)
- Supabase: ~50MB (500MB 중)
- Google AI: ~300 요청/일 (1500 중)
- **총 운영비**: $0/월

### 2. 계층 분리
```
Presentation → API → Service → Data
```
각 계층 독립적 테스트 가능

### 3. 캐싱 전략
```
메모리 (1분) → Supabase (3분) → Vercel Edge (5분)
```

### 4. StaticDataLoader
- 99.6% CPU 절약
- 92% 메모리 절약
- 캐시 히트율 3배 향상

---

## 🔗 관련 문서

### 시스템 이해
- **[현재 아키텍처](SYSTEM-ARCHITECTURE-CURRENT.md)** - 전체 구조
- **[API 레퍼런스](api/endpoints.md)** - 85개 엔드포인트
- **[DB 스키마](db/schema.md)** - 데이터베이스 구조

### 개발 가이드
- **[AI 시스템](../ai/README.md)** - AI 통합 가이드
- **[개발 환경](../development/README.md)** - 설정 가이드
- **[테스트](../testing/README.md)** - 테스트 전략

### 배포
- **[배포 가이드](../deploy/README.md)** - Vercel 배포
- **[보안](../security/README.md)** - 보안 표준

---

## 📝 문서 작성 가이드

### 새 아키텍처 문서 추가 시

1. **적절한 위치 선택**
   - 시스템 전반: `architecture/`
   - API 관련: `architecture/api/`
   - DB 관련: `architecture/db/`
   - 결정 기록: `architecture/decisions/`

2. **YAML frontmatter 추가**
```yaml
---
id: unique-id
title: 'Document Title'
keywords: [key1, key2]
priority: high|medium|low
updated: '2025-11-20'
---
```

3. **관련 문서 연결**
   - `related_docs` 필드 활용
   - 상호 참조 링크 추가

4. **README 업데이트**
   - 이 파일에 새 문서 추가
   - 카테고리 분류

---

**마지막 업데이트**: 2025-11-20  
**총 문서**: 20개  
**상태**: ✅ 최신


**시간**: 모두 34일 전 (2025-09-12) 작성

- **optimization.md** (6.0K) ⭐
  - 데이터베이스 성능 최적화 전략

- **queries.md** (3.7K)
  - 주요 쿼리 패턴 및 최적화

- **schema.md** (3.1K)
  - 데이터베이스 스키마 설계

---

## 📊 문서 통계 (2025-10-16)

| 디렉토리 | 파일 수 | 작성 기간 | 평균 크기 | 최신 업데이트                   |
| -------- | ------- | --------- | --------- | ------------------------------- |
| 루트     | 10      | 2-62일 전 | 7.5K      | 24h-data-deployment.md (2일 전) |
| api/     | 4       | 34일 전   | 2.3K      | endpoints.md                    |
| db/      | 3       | 34일 전   | 4.3K      | optimization.md                 |
| **합계** | **17**  | -         | **5.5K**  | **안정적**                      |

**특징**:

- ✅ 안정적 구조 (api/, db/ 34일간 변경 없음)
- ✅ 최신 표준 유지 (any 타입 제거, 24시간 배포)
- ✅ 명확한 분류 (시스템/API/DB)

---

## 🔍 핵심 문서 소개

### ⭐ typescript-any-removal-project-report.md (5일 전)

**목적**: TypeScript any 타입 제거 프로젝트 성과 보고

**주요 내용**:

- ✅ 873개 TS 파일, 0 에러 달성
- ✅ TypeScript strict mode 100%
- ✅ any → 구체적 타입 전환 전략

**중요도**: 🔴 **HIGH** - 타입 안전성 기준

---

### ⭐ 24h-data-deployment.md (2일 전, newest)

**목적**: 24시간 데이터 배포 및 운영 전략

**주요 내용**:

- 실시간 데이터 업데이트 전략
- 무정지 배포 아키텍처
- 데이터 동기화 메커니즘

**중요도**: 🔴 **HIGH** - 최신 운영 전략

---

### ⭐ cloud-dependency-risk-assessment.md (18일 전)

**목적**: 클라우드 서비스 종속성 리스크 평가

**주요 내용**:

- Vercel, Supabase, GCP 종속성 분석
- 무료 티어 한계 (100GB 대역폭, 500MB 스토리지)
- 마이그레이션 전략 (필요 시)

**중요도**: 🟡 **MEDIUM** - 리스크 관리

---

### ⭐ endpoints.md (api/, 34일 전)

**목적**: API 엔드포인트 정의 및 명세

**주요 내용**:

- REST API 엔드포인트 목록
- 요청/응답 형식
- 인증/인가 규칙

**중요도**: 🔴 **HIGH** - API 개발 기준

---

### ⭐ optimization.md (db/, 34일 전)

**목적**: 데이터베이스 성능 최적화 전략

**주요 내용**:

- 인덱스 전략
- 쿼리 최적화 패턴
- 커넥션 풀 관리

**중요도**: 🔴 **HIGH** - DB 성능 기준

---

## 💡 빠른 참조

### 새 기능 개발 시

**API 개발**:

1. `api/endpoints.md` - 엔드포인트 명세
2. `api/schemas.md` - 스키마 정의
3. `api/validation.md` - 검증 규칙
4. `api/routes.md` - 라우팅 구조

**DB 작업**:

1. `db/schema.md` - 스키마 설계
2. `db/queries.md` - 쿼리 패턴
3. `db/optimization.md` - 성능 최적화

**타입 안전성**:

1. `typescript-any-removal-project-report.md` - any 제거 가이드
2. `type-system-consistency.md` - 타입 일관성

---

### 리스크 관리 시

**클라우드 의존성**:

1. `cloud-dependency-risk-assessment.md` - 종속성 평가
2. `24h-data-deployment.md` - 무정지 배포

**리소스 제약**:

1. `MEMORY-REQUIREMENTS.md` - 메모리 요구사항

---

### 표준 준수 확인

**React 개발**:

1. `react-hooks-standards.md` - Hooks 표준

**프로젝트 구조**:

1. `FOLDER-STRUCTURE.md` - 폴더 구조
2. `simulation-setup.md` - 환경 설정

---

## 🔄 문서 계층 구조 (다른 디렉토리와 연계)

```
architecture/            (전체 시스템 아키텍처, 표준)
    ↓
docs/design/            (기능별 상세 설계)
    ↓
src/                    (실제 구현 코드)
```

**예시**: API 개발 플로우

1. **architecture/api/endpoints.md**: API 전체 구조
2. **design/features/api.md**: 기능별 API 설계
3. **design/current/system-architecture-deployment.md**: 배포 아키텍처
4. **src/app/api/**: 실제 API 구현

---

## 🎯 Document Index (AI Query Guide)

### 기술 리뷰 시

**아키텍처 리뷰**:

1. `24h-data-deployment.md` - 배포 전략
2. `cloud-dependency-risk-assessment.md` - 리스크 평가

**코드 리뷰**:

1. `react-hooks-standards.md` - Hooks 표준
2. `type-system-consistency.md` - 타입 일관성

**성능 리뷰**:

1. `db/optimization.md` - DB 최적화
2. `MEMORY-REQUIREMENTS.md` - 메모리 요구사항

---

## 📚 관련 문서

- **docs/design/** - 상세 설계 문서 (25개)
  - `design/core/architecture.md` - 전체 시스템 아키텍처
  - `design/features/` - 기능별 일반 설계
  - `design/current/` - 버전별 구체적 구현

- **docs/claude/standards/** - 코딩 표준
  - `typescript-rules.md` - TypeScript 규칙
  - `commit-conventions.md` - 커밋 컨벤션

---

## 🚨 주의사항

### 변경 시 영향도 체크

**api/ 변경 시**:

- [ ] `design/features/api.md` 동기화
- [ ] API 클라이언트 (src/lib/api/) 업데이트
- [ ] API 테스트 (tests/api/) 업데이트

**db/ 변경 시**:

- [ ] `design/infrastructure/database.md` 동기화
- [ ] Supabase 마이그레이션 (supabase/migrations/)
- [ ] 타입 정의 (src/types/) 업데이트

**표준 변경 시**:

- [ ] 기존 코드 영향 범위 분석
- [ ] 팀원 공유 및 합의
- [ ] 문서 업데이트 (README, CLAUDE.md)

---

## 🎯 핵심 원칙

> **"아키텍처는 진화하되, 표준은 일관되게"**

**안정성 우선**:

- ✅ api/, db/ 34일간 안정적 유지
- ✅ 변경 시 신중히 검토 (영향도 분석)
- ✅ 문서와 코드의 동기화

**표준 준수**:

- ✅ TypeScript strict mode 100%
- ✅ React Hooks 표준
- ✅ API 명세 준수

**리스크 관리**:

- ✅ 클라우드 종속성 모니터링
- ✅ 무료 티어 한계 인지
- ✅ 마이그레이션 전략 준비

---

**Last Updated**: 2025-10-16 by Claude Code
**핵심 철학**: "안정적 아키텍처 위에 빠른 진화"
