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
last_updated: '2025-12-19'
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
- **[system-architecture-current.md](./architecture/system/system-architecture-current.md)**: 현재 시스템 구조
- **[folder-structure.md](./architecture/folder-structure.md)**: 폴더 구조 가이드

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

## 🚀 배포 플랫폼 (platforms/)

### Vercel (platforms/vercel/)
- **[vercel.md](./platforms/vercel/vercel.md)** - Vercel 배포 가이드
- **[vercel-optimization.md](./platforms/vercel/vercel-optimization.md)** - 최적화 전략
- **[vercel-specialist-guide.md](./platforms/vercel/vercel-specialist-guide.md)** - 전문가 가이드

### GCP (platforms/gcp/)
- **[firewall-setup.md](./platforms/gcp/firewall-setup.md)** - 방화벽 설정

### Supabase (platforms/supabase/)
- 참조: [architecture/db/](./architecture/db/) - DB 스키마, 쿼리, 최적화

### 통합 배포 (platforms/deploy/)
- **[README.md](./platforms/deploy/README.md)** - 배포 가이드 인덱스
