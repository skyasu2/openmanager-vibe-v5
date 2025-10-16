---
category: architecture
purpose: system_architecture_and_standards
ai_optimized: true
query_triggers:
  - '시스템 아키텍처'
  - 'TypeScript any 제거'
  - '타입 시스템'
  - 'API 설계'
  - '데이터베이스 최적화'
  - '클라우드 의존성'
related_docs:
  - 'docs/design/'
  - 'docs/claude/standards/'
  - 'src/'
last_updated: '2025-10-16'
---

# 🏗️ 아키텍처 문서 (Architecture Documents)

**목적**: 시스템 아키텍처, 기술 표준, 리스크 관리 문서

---

## 📂 디렉토리 구조

```
architecture/
├── (루트 10개) - 시스템 전반 아키텍처, 표준, 리스크
├── api/ (4개)  - API 설계 및 검증
└── db/ (3개)   - 데이터베이스 설계 및 최적화
```

**총 17개 파일** (2-62일 전)

---

## 🎯 디렉토리별 역할

### 1. 루트 (10개) - 시스템 전반

**특징**: 프로젝트 전체 아키텍처, 표준, 리스크 분석

#### 주요 문서

**아키텍처 표준** (5개):

- **typescript-any-removal-project-report.md** (9.9K, 5일 전) ⭐
  - TypeScript any 타입 제거 프로젝트 보고서
  - 873개 TS 파일, 0 에러 달성

- **type-system-consistency.md** (6.8K, 24일 전)
  - 타입 시스템 일관성 가이드

- **react-hooks-standards.md** (5.0K, 24일 전)
  - React Hooks 표준 및 베스트 프랙티스

- **FOLDER-STRUCTURE.md** (8.0K, 36일 전)
  - 프로젝트 폴더 구조 설명

- **MEMORY-REQUIREMENTS.md** (8.0K, 49일 전)
  - 메모리 요구사항 분석

**시스템 설계** (3개):

- **24h-data-deployment.md** (7.8K, 2일 전, newest) ⭐
  - 24시간 데이터 배포 전략

- **simulation-setup.md** (8.5K, 34일 전)
  - 시뮬레이션 환경 설정

- **cloud-dependency-risk-assessment.md** (6.7K, 18일 전)
  - 클라우드 의존성 리스크 평가
  - Vercel, Supabase, GCP 종속성 분석

---

### 2. api/ (4개) - API 설계

**특징**: API 엔드포인트, 라우팅, 스키마, 검증 규칙

**시간**: 모두 34일 전 (2025-09-12) 작성

- **endpoints.md** (4.0K) ⭐
  - API 엔드포인트 정의 및 명세

- **routes.md** (1.4K)
  - API 라우팅 구조

- **schemas.md** (1.6K)
  - API 스키마 정의

- **validation.md** (2.2K)
  - 입력 검증 규칙

---

### 3. db/ (3개) - 데이터베이스 설계

**특징**: Supabase PostgreSQL 최적화, 쿼리, 스키마

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
