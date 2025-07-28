# 📚 OpenManager VIBE v5 문서

> **5분 안에 필요한 정보 찾기** - 실무 중심 문서

## 🎯 문서 철학

**"모든 것을 문서화하지 말고, 찾는 방법을 문서화하라"**

- 프로젝트 특화 내용만 문서화
- 표준 기능은 공식 문서 링크 활용
- 실제 코드와 설정 예제 중심

## 🚀 빠른 시작 (Quick Start)

필수 설정과 실무 코드를 5분 안에 확인하세요.

| 문서                                                     | 설명                                | 공식 문서                                 |
| -------------------------------------------------------- | ----------------------------------- | ----------------------------------------- |
| **[Vercel Edge Runtime](./quick-start/vercel-edge.md)**  | Fluid Compute, Active CPU 가격 모델 | [📖](https://vercel.com/docs)             |
| **[Supabase Auth 설정](./quick-start/supabase-auth.md)** | GitHub OAuth, RLS 보안              | [📖](https://supabase.com/docs)           |
| **[Upstash Redis 캐싱](./quick-start/redis-cache.md)**   | 5ms 글로벌 레이턴시, Rate Limiting  | [📖](https://upstash.com/docs)            |
| **[GCP Functions 배포](./quick-start/gcp-functions.md)** | Python 3.11 서버리스                | [📖](https://cloud.google.com/docs)       |
| **[배포 가이드](./quick-start/deployment-guide.md)**     | Vercel + GCP 통합 배포              | [📖](https://vercel.com/docs/deployments) |

## 🤖 AI 시스템

2-Mode AI 시스템과 통합 가이드입니다.

| 문서                                                          | 설명                              |
| ------------------------------------------------------------- | --------------------------------- |
| **[AI 시스템 통합 가이드](./ai/ai-system-unified-guide.md)**  | 2-Mode 시스템 (LOCAL/GOOGLE_ONLY) |
| **[AI 완전 가이드](./ai/ai-complete-guide.md)**               | AI 엔진 상세 구현                 |
| **[ML 개선 요약](./ai/ML-ENHANCEMENT-SUMMARY.md)**            | 머신러닝 최적화                   |
| **[pgvector 마이그레이션](./ai/pgvector-migration-guide.md)** | 벡터 DB 설정                      |

## 💡 개발 가이드

개발 환경 설정과 모범 사례입니다.

| 문서                                                                   | 설명              |
| ---------------------------------------------------------------------- | ----------------- |
| **[개발 환경](./development/development-environment.md)**              | 환경 설정 가이드  |
| **[개발 가이드](./development/development-guide.md)**                  | 코딩 표준 및 규칙 |
| **[TypeScript 설정](./development/typescript-configuration-guide.md)** | 타입 안전성       |
| **[React Hooks 최적화](./development/react-hooks-optimization.md)**    | 성능 개선         |

## 🔒 보안 및 성능

보안 설정과 성능 최적화 가이드입니다.

| 문서                                                                               | 설명           |
| ---------------------------------------------------------------------------------- | -------------- |
| **[보안 가이드](./security/security-complete-guide.md)**                           | 전체 보안 설정 |
| **[환경변수 보안](./security/env-security-guide.md)**                              | 환경변수 관리  |
| **[성능 최적화 가이드](./performance/performance-optimization-complete-guide.md)** | 전체 성능 개선 |
| **[API 최적화](./performance/api-optimization-guide.md)**                          | API 성능 개선  |
| **[Redis 설정](./performance/redis-configuration-guide.md)**                       | 캐싱 최적화    |

## 🔧 기타 주요 문서

| 문서                                                        | 설명                 |
| ----------------------------------------------------------- | -------------------- |
| **[MCP 베스트 프랙티스](./mcp-best-practices-guide.md)**    | MCP 서버 활용법      |
| **[서브 에이전트 매핑](./sub-agents-mcp-mapping-guide.md)** | 서브 에이전트 가이드 |
| **[시스템 아키텍처](./system-architecture.md)**             | 전체 구조 설명       |

## 📊 현재 상태

### 프로젝트 지표

| 지표                 | 현재                             | 목표    |
| -------------------- | -------------------------------- | ------- |
| **응답 시간**        | 152ms                            | < 200ms |
| **가동률**           | 99.95%                           | 99.9%+  |
| **무료 티어 사용률** | Vercel 30%, GCP 15%, Supabase 3% | < 80%   |
| **코드 품질**        | 400개 문제                       | < 100개 |

### 기술 스택

- **Frontend**: Next.js 14.2.4 + React 18.2.0 + TypeScript
- **Backend**: Vercel Edge Runtime + GCP Functions (Python 3.11)
- **Database**: Supabase PostgreSQL + pgvector
- **Cache**: Upstash Redis
- **AI**: Google AI + Supabase RAG

## 📁 문서 구조

```
docs/
├── README.md                          # 이 문서
├── quick-start/                       # 빠른 시작 가이드 (5분)
│   ├── vercel-edge.md                # Vercel Edge Runtime
│   ├── supabase-auth.md              # 인증 설정
│   ├── redis-cache.md                # Redis 캐싱
│   ├── gcp-functions.md              # GCP Functions
│   └── deployment-guide.md           # 배포 가이드
├── ai/                               # AI 시스템 문서
│   ├── ai-system-unified-guide.md    # 2-Mode 시스템
│   ├── ai-complete-guide.md          # 상세 구현
│   ├── ML-ENHANCEMENT-SUMMARY.md     # ML 최적화
│   └── pgvector-migration-guide.md   # 벡터 DB
├── development/                      # 개발 가이드 (12개)
│   ├── development-environment.md    # 환경 설정
│   ├── development-guide.md          # 코딩 표준
│   ├── typescript-*.md               # TypeScript 관련
│   └── ...
├── security/                         # 보안 가이드 (4개)
│   ├── security-complete-guide.md
│   └── env-security-guide.md
├── performance/                      # 성능 최적화 (5개)
│   ├── performance-optimization-complete-guide.md
│   └── api-optimization-guide.md
├── gcp/                             # GCP 관련 (4개)
│   └── gcp-complete-guide.md
├── setup/                           # 설정 가이드
├── monitoring/                      # 모니터링
├── testing/                         # 테스트 가이드
└── reports/                         # 테스트 결과
```

## 💡 문서 활용 팁

1. **5분 룰**: 필요한 정보를 5분 안에 찾을 수 없다면 문서 개선 필요
2. **공식 문서 우선**: 기본 기능은 공식 문서 링크 참조
3. **실무 코드 중심**: 복사해서 바로 사용 가능한 예제
4. **정기 업데이트**: 분기별 공식 문서 변경사항 확인

## 🔗 주요 링크

### 공식 문서

- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Upstash Docs](https://upstash.com/docs)
- [Google Cloud Docs](https://cloud.google.com/docs)

### 프로젝트

- [GitHub Repository](https://github.com/[your-org]/openmanager-vibe-v5)
- [프로덕션 사이트](https://your-app.vercel.app)
- [개발 환경](http://localhost:3000)

---

> **마지막 업데이트**: 2025-07-28 | **문서 개선 제안은 이슈로 등록해주세요**
