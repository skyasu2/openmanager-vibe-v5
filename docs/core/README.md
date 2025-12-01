# 📦 Core 문서 (메인 프로젝트)

**배포되고 실제로 동작하는 시스템 관련 문서**

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

## 🚀 배포 플랫폼 (platforms/)

### Vercel (platforms/vercel/)

- **vercel.md** - Vercel 배포 가이드
- **vercel-optimization.md** - 최적화 전략
- **vercel-specialist-guide.md** - 전문가 가이드

### GCP (platforms/gcp/)

- **gcp-deployment-guide.md** - GCP 배포 가이드
- **GCP_FUNCTIONS_INTEGRATION.md** - Cloud Functions 통합
- **GCP-FUNCTIONS-SUMMARY.md** - 요약
- **GCP-FUNCTIONS-OPTIMIZATION.md** - 최적화

### Supabase (platforms/supabase/)

- **schema.md** - 데이터베이스 스키마
- **queries.md** - 쿼리 최적화
- **optimization.md** - DB 성능 최적화

### 통합 배포 (platforms/deploy/)

- **README.md** - 배포 가이드 인덱스
- **free-tier.md** - 무료 티어 관리
- **zero-cost-operations.md** - 제로 비용 운영
- **warnings.md** - 배포 주의사항

---
category: core
purpose: core_system_documentation
ai_optimized: true
query_triggers:
  - '핵심 아키텍처'
  - '시스템 구조'
  - '보안 정책'
related_docs:
  - 'docs/architecture/WEB_ARCHITECTURE.md'
  - 'docs/architecture/BACKEND_ARCHITECTURE.md'
last_updated: '2025-12-01'
---

# 🧩 Core Documentation

프로젝트의 핵심 아키텍처, 보안, 성능 표준을 정의하는 문서입니다.

## 📚 주요 문서

### Architecture
- **[Web Architecture](../architecture/WEB_ARCHITECTURE.md)**: 프론트엔드 구조
- **[Backend Architecture](../architecture/BACKEND_ARCHITECTURE.md)**: 백엔드 및 서비스 레이어
- **[AI Engine Architecture](../architecture/AI_ENGINE_ARCHITECTURE.md)**: AI 엔진 구조

### Security
- **[Security Guidelines](../security/README.md)**: 보안 가이드라인 (RLS, Auth)

### Performance
- **[Performance Standards](./performance/README.md)**: 성능 목표 및 측정 표준

## 🔍 디렉터리 구조

- `architecture/`: 시스템 설계 및 구조
- `security/`: 보안 정책 및 가이드
- `performance/`: 성능 최적화 및 기준
- `platforms/`: 플랫폼별 설정 (Vercel, Supabase, GCP)(배포/운영)
