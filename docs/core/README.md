---
id: core-documentation
title: "Core 문서 (메인 프로젝트)"
category: core
purpose: core_system_documentation
ai_optimized: true
query_triggers:
  - '핵심 아키텍처'
  - '시스템 구조'
  - '보안 정책'
related_docs:
  - 'docs/core/architecture/README.md'
  - 'docs/core/security/README.md'
last_updated: '2025-12-12'
---

# 📦 Core 문서 (메인 프로젝트)

**배포되고 실제로 동작하는 시스템 관련 문서**

## 📂 디렉토리 구조

```
core/
├── architecture/      # 시스템 아키텍처 (통합됨)
│   ├── design/        # 설계 문서 (기존 design/core)
│   ├── current/       # 현재 구조 (기존 design/current)
│   ├── features/      # 기능 설계 (기존 design/features)
│   ├── infrastructure/# 인프라 설계 (기존 design/infrastructure)
│   └── ui/            # UI 설계 (기존 design/ui)
├── ai/                # 배포용 AI 기능
├── performance/       # 성능 최적화 가이드
├── security/          # 보안 정책 (통합됨)
└── platforms/         # 플랫폼별 설정 (Vercel, Supabase, GCP)
```

## 🎯 주요 문서

### 아키텍처 (architecture/)
- **[README.md](./architecture/README.md)**: 통합 아키텍처 가이드 (기술 스택, 웹/백엔드 구조)
- **[SYSTEM-ARCHITECTURE-CURRENT.md](./architecture/SYSTEM-ARCHITECTURE-CURRENT.md)**: 현재 시스템 구조
- **[FOLDER-STRUCTURE.md](./architecture/FOLDER-STRUCTURE.md)**: 폴더 구조 가이드

### AI 시스템 (ai/)
- **[ai-architecture.md](./ai/ai-architecture.md)**: AI 시스템 아키텍처
- **[README.md](./ai/README.md)**: 배포용 AI 기능 개요

### 보안 (security/)
- **[README.md](./security/README.md)**: 통합 보안 가이드 (GitHub OAuth, Supabase 보안)
- **[github-oauth.md](./security/github-oauth.md)**: GitHub OAuth 설정
- **[localStorage-to-cookie-migration.md](./security/localStorage-to-cookie-migration.md)**: 쿠키 마이그레이션

### 성능 (performance/)
- **[README.md](./performance/README.md)**: 성능 최적화 가이드
- **[bundle.md](./performance/bundle.md)**: 번들 최적화
- **[charts.md](./performance/charts.md)**: 차트 성능 최적화

## 📊 구조 변경사항

- **design/ 통합**: 설계 문서들이 `architecture/` 하위로 통합됨
- **보안 통합**: Supabase 보안 현황이 `security/README.md`에 통합됨
- **아키텍처 통합**: 기술 스택, 웹/백엔드 구조가 `architecture/README.md`에 통합됨

---

## 🎯 목적

이 디렉터리는 **실제 배포되고 운영되는 시스템**에 관한 문서를 포함합니다.

- Vercel, GCP, Supabase 배포 플랫폼
- 시스템 아키텍처 및 API 설계
- 보안, 성능, 모니터링

---

## 📂 디렉터리 구조

```
core/
├── platforms/              # 배포 플랫폼
│   ├── vercel/            # Vercel 배포 (3개 파일)
│   ├── gcp/               # GCP Cloud Functions (4개 파일)
│   ├── supabase/          # Supabase DB (3개 파일)
│   └── deploy/            # 통합 배포 (4개 파일)
│
├── architecture/          # 시스템 아키텍처
├── security/              # 보안 정책
├── performance/           # 성능 최적화
└── monitoring/            # 모니터링
```

---

## 📚 주요 문서

### Architecture
- **[Web Architecture](./architecture/WEB_ARCHITECTURE.md)**: 프론트엔드 구조
- **[Backend Architecture](./architecture/BACKEND_ARCHITECTURE.md)**: 백엔드 및 서비스 레이어
- **[AI Engine Architecture](./architecture/AI_ENGINE_ARCHITECTURE.md)**: AI 엔진 구조

### Security
- **[Security Guidelines](./security/README.md)**: 보안 가이드라인 (RLS, Auth)

### Performance
- **[Performance Standards](./performance/README.md)**: 성능 목표 및 측정 표준

---

## 🚀 배포 플랫폼 (platforms/)

### Vercel (platforms/vercel/)
- **vercel.md** - Vercel 배포 가이드
- **vercel-optimization.md** - 최적화 전략
- **vercel-specialist-guide.md** - 전문가 가이드

### GCP (platforms/gcp/)
- **gcp-deployment-guide.md** - GCP 배포 가이드
- **GCP-FUNCTIONS-SUMMARY.md** - 요약
- **GCP-FUNCTIONS-OPTIMIZATION.md** - 최적화
- **GCP-FUNCTIONS-CLEANUP-GUIDE.md** - 정리 가이드
- **GCP-INTEGRATION-METHOD.md** - 통합 방법 (HTTP vs SDK)
- **firewall-setup.md** - 방화벽 설정

### Supabase (platforms/supabase/)
- **schema.md** - 데이터베이스 스키마
- **queries.md** - 쿼리 최적화
- **optimization.md** - DB 성능 최적화

### 통합 배포 (platforms/deploy/)
- **README.md** - 배포 가이드 인덱스
- **free-tier.md** - 무료 티어 관리
- **zero-cost-operations.md** - 제로 비용 운영
- **warnings.md** - 배포 주의사항
