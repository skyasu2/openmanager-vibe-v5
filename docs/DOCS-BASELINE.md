# Documentation Baseline & Improvement Plan

> **생성일**: 2025-12-31
> **목표**: 2025 베스트 프랙티스 기반 문서 최적화

---

## 1. 현재 상태 (Baseline)

### 1.1 정량 지표

| 지표 | 현재 값 | 목표 값 | 차이 |
|------|---------|---------|------|
| 총 문서 수 | 145개 | 80개 | -65개 |
| 총 라인 수 | 31,784줄 | 20,000줄 | -11,784줄 |
| 평균 문서 길이 | 219줄 | 250줄 | +31줄 |
| Mermaid 다이어그램 | 18개 | 50개 | +32개 |
| 내부 링크 | 176개 | 300개 | +124개 |
| README 파일 | 20개 | 35개 | +15개 |
| 폴더 수 | 35개 | 20개 | -15개 |

### 1.2 구조 현황

```
docs/                           # 현재 구조
├── (root) ────────── 5개       # 진입점
├── development/ ──── 64개      # 44% (과다)
├── core/ ─────────── 56개      # 39% (적정)
├── environment/ ──── 14개      # 10% (적정)
├── api/ ──────────── 2개       # (부족)
├── archive/ ───────── 2개      # (양호)
├── plans/ ─────────── 1개
└── rag/ ──────────── 1개
```

### 1.3 문제점 식별

| 문제 | 영향 범위 | 심각도 |
|------|----------|--------|
| 테스팅 가이드 분산 (15개) | development/testing | High |
| AI 문서 중복 | core/ai, development/ai | High |
| 트러블슈팅 파편화 (8개) | environment/troubleshooting | Medium |
| CHANGELOG 없음 | 전체 | Medium |
| llms.txt 없음 | AI 최적화 | Low |
| 버전 표기 불일치 | 전체 | Low |

---

## 2. 목표 구조 (Target)

```
docs/                           # 목표 구조 (2025 Best Practice)
├── README.md                   # 문서 진입점
├── CHANGELOG.md                # 변경 이력
├── llms.txt                    # AI/LLM 최적화
├── DOCS-BASELINE.md            # 이 문서
│
├── getting-started/            # 시작 가이드 (3-5개)
│   ├── README.md
│   ├── quick-start.md
│   ├── installation.md
│   └── first-steps.md
│
├── guides/                     # How-to 가이드 (15-20개)
│   ├── README.md
│   ├── development/
│   ├── testing/
│   └── deployment/
│
├── reference/                  # 레퍼런스 (10-15개)
│   ├── README.md
│   ├── api/
│   ├── configuration/
│   └── architecture/
│
├── troubleshooting/            # 문제 해결 (3-5개)
│   ├── README.md
│   ├── common-issues.md
│   └── faq.md
│
└── archive/                    # 보관 문서
    └── ...
```

---

## 3. 개선 로드맵

### Phase 1: Quick Wins (즉시) - COMPLETED

| # | 작업 | 파일 | 상태 |
|---|------|------|------|
| 1.1 | CHANGELOG.md 생성 | `docs/CHANGELOG.md` | [x] |
| 1.2 | llms.txt 생성 | `docs/llms.txt` | [x] |
| 1.3 | docs/README.md 개선 | `docs/README.md` | [x] |
| 1.4 | 기준점 문서 생성 | `docs/DOCS-BASELINE.md` | [x] |

### Phase 2: 문서 통합 (1주)

| # | 작업 | Before | After |
|---|------|--------|-------|
| 2.1 | 테스팅 가이드 통합 | 15개 | 5개 |
| 2.2 | AI 문서 정리 | 중복 제거 | 단일 참조 |
| 2.3 | 트러블슈팅 통합 | 8개 | 3개 |
| 2.4 | MCP 가이드 통합 | 7개 | 3개 |

### Phase 3: 구조 재편 (2주)

| # | 작업 | 설명 |
|---|------|------|
| 3.1 | 폴더 구조 재편 | 목표 구조로 마이그레이션 |
| 3.2 | README 추가 | 각 폴더에 인덱스 문서 |
| 3.3 | 내부 링크 정비 | 문서 간 참조 강화 |
| 3.4 | Mermaid 추가 | 아키텍처 문서 시각화 |

### Phase 4: 품질 향상 (지속)

| # | 작업 | 주기 |
|---|------|------|
| 4.1 | 버전 표기 통일 | 1회성 |
| 4.2 | 문서 리뷰 프로세스 | 월 1회 |
| 4.3 | 오래된 문서 Archive | 분기 1회 |

---

## 4. 성공 지표 (KPI)

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| 문서 수 | 145개 | 80개 | `find docs -name "*.md" \| wc -l` |
| 문서당 다이어그램 | 0.12개 | 0.5개 | Mermaid 블록 수 / 문서 수 |
| 문서당 내부 링크 | 1.2개 | 3개 | 링크 수 / 문서 수 |
| README 커버리지 | 57% | 100% | README 수 / 폴더 수 |
| 최근 30일 업데이트 | 100% | 50%+ | 최근 수정 문서 비율 |

---

## 5. 참고 자료

### 2025 베스트 프랙티스 출처

- [Mintlify - AI Documentation Trends 2025](https://www.mintlify.com/blog/ai-documentation-trends-whats-changing-in-2025)
- [Pinterest - Docs-as-Code](https://www.infoq.com/news/2025/06/docs-as-code-at-pinterest/)
- [Tutorial.ai - 10 Best Practices](https://www.tutorial.ai/b/software-documentation-best-practices)
- [DeepDocs - Developer Guide](https://deepdocs.dev/software-documentation-best-practices/)

### 관련 문서

- [AI Engine 5W1H](./core/architecture/ai/ai-engine-5w1h.md)
- [DEVELOPMENT.md](./DEVELOPMENT.md)
- [QUICK-START.md](./QUICK-START.md)

---

**다음 업데이트**: Phase 1 완료 후
