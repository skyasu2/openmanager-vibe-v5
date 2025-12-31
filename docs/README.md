# OpenManager VIBE v5 Documentation

> **버전**: v5.83.14 | **최종 갱신**: 2025-12-31

---

## Quick Navigation

| 목적 | 문서 |
|------|------|
| **처음 시작** | [QUICK-START.md](./QUICK-START.md) |
| **개발 가이드** | [DEVELOPMENT.md](./DEVELOPMENT.md) |
| **AI 아키텍처** | [AI Engine 5W1H](./core/architecture/ai/ai-engine-5w1h.md) |
| **변경 이력** | [CHANGELOG.md](./CHANGELOG.md) |
| **프로젝트 상태** | [status.md](./status.md) |

---

## Documentation Structure

```
docs/
├── README.md           ← 현재 문서 (진입점)
├── QUICK-START.md      # 빠른 시작 가이드
├── DEVELOPMENT.md      # 개발자 가이드
├── CHANGELOG.md        # 변경 이력
├── DOCS-BASELINE.md    # 문서 개선 계획
├── llms.txt            # AI/LLM 최적화
│
├── core/               # 시스템 핵심
│   ├── architecture/   # 아키텍처 설계
│   │   └── ai/         # AI Engine 상세
│   ├── ai/             # AI 기능 개요
│   ├── performance/    # 성능 최적화
│   ├── security/       # 보안 정책
│   └── platforms/      # 플랫폼별 설정
│
├── development/        # 개발 가이드
│   ├── testing/        # 테스트 가이드
│   ├── standards/      # 코딩 컨벤션
│   ├── mcp/            # MCP 서버
│   └── ai/             # AI 도구 사용법
│
├── environment/        # 환경 설정
│   ├── wsl/            # WSL 가이드
│   └── troubleshooting/# 문제 해결
│
├── api/                # API 레퍼런스
└── archive/            # 아카이브
```

---

## By Role

### Developer (개발자)
1. [QUICK-START.md](./QUICK-START.md) - 환경 설정
2. [DEVELOPMENT.md](./DEVELOPMENT.md) - 개발 워크플로우
3. [Testing Guide](./development/testing/) - 테스트 작성법

### AI/ML Engineer
1. [AI Engine 5W1H](./core/architecture/ai/ai-engine-5w1h.md) - 아키텍처 요약
2. [AI Engine Architecture](./core/architecture/ai/ai-engine-architecture.md) - 상세 명세
3. [AI Model Policy](./ai-model-policy.md) - 모델 정책

### DevOps
1. [Vercel Deploy](./core/platforms/vercel/) - 프론트엔드 배포
2. [Cloud Run](./core/platforms/gcp/) - AI Engine 배포
3. [Environment Setup](./environment/) - 환경 설정

---

## Key Documents

### Architecture (아키텍처)

| 문서 | 설명 | 업데이트 |
|------|------|----------|
| [AI Engine 5W1H](./core/architecture/ai/ai-engine-5w1h.md) | 육하원칙 아키텍처 요약 | 2025-12-31 |
| [AI Engine Architecture](./core/architecture/ai/ai-engine-architecture.md) | 상세 기술 명세 | 2025-12-28 |
| [System Architecture](./core/architecture/system/system-architecture-current.md) | 전체 시스템 구조 | 2025-12 |

### Guides (가이드)

| 문서 | 설명 |
|------|------|
| [MSW Guide](./development/testing/msw-guide.md) | Mock Service Worker |
| [E2E Testing](./development/testing/e2e-testing-guide.md) | Playwright E2E |
| [MCP Setup](./development/mcp/) | MCP 서버 설정 |

### Troubleshooting (문제 해결)

| 문서 | 설명 |
|------|------|
| [System Recovery](./environment/troubleshooting/system-recovery-guide-2025.md) | 시스템 복구 |
| [WSL Guide](./environment/wsl/wsl-restore-guide.md) | WSL 문제 해결 |

---

## Document Types

| 타입 | 위치 | 특성 |
|------|------|------|
| **Guides** | `docs/` | 항상 최신 유지, How-to 중심 |
| **Reference** | `docs/api/`, `docs/core/` | 정확한 명세 |
| **Reports** | `reports/` | 시점별 스냅샷 |
| **Logs** | `logs/` | 임시 데이터 (Git 미추적) |

---

## Contributing to Docs

### 새 문서 작성 시
1. 적절한 폴더 선택 (위 구조 참고)
2. 기존 템플릿 활용
3. 상단에 버전/날짜 명시
4. 관련 문서 링크 추가

### 문서 업데이트 시
1. 날짜 업데이트
2. CHANGELOG.md에 기록
3. 관련 문서 링크 확인

---

## Metrics

| 지표 | 값 |
|------|-----|
| 총 문서 수 | 145개 |
| 총 라인 수 | 31,784줄 |
| 마지막 업데이트 | 2025-12-31 |

> 문서 개선 계획: [DOCS-BASELINE.md](./DOCS-BASELINE.md)

---

## External Resources

- [GitHub Repository](https://github.com/skyasu2/openmanager-vibe-v5)
- [Vercel Dashboard](https://vercel.com)
- [Supabase Dashboard](https://supabase.com)
