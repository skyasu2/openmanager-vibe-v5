# Documentation Structure Improvement Plan

**분석일**: 2025-12-19
**버전**: v5.83.1

---

## 1. 현재 구조 분석

### 1.1 디렉토리별 파일 수

| 디렉토리 | 파일 수 | 비고 |
|:---------|:-------:|:-----|
| `docs/core` | 55 | 핵심 문서 (가장 많음) |
| `docs/development` | 43 | 개발 가이드 |
| `docs/archive` | 41 | 아카이브 |
| `docs/ops` | 19 | 운영 (testing 포함) |
| `docs/environment` | 14 | 환경 설정 |
| `docs/planning` | 11 | 계획/분석 |
| `docs/api` | 1 | API 문서 |
| **합계** | **~180** | |

### 1.2 깊이 분석

- **최대 깊이**: 4레벨 (예: `docs/development/ai/common/ai-benchmarks.md`)
- **평균 깊이**: 3레벨

---

## 2. 발견된 문제점

### 2.1 문서 분산 문제 (Critical)

#### Problem A: Claude-Code 관련 문서 분산
현재 4곳에 분산되어 있음:

```
docs/
├── development/
│   ├── ai/claude-code/           # subagents, README
│   ├── claude-code-v2.0.31-best-practices.md
│   └── claude-workflow-guide.md
├── environment/
│   ├── tools/claude-code/        # hooks guide
│   └── wsl/claude-code-wsl-guide.md
```

**영향**: 사용자가 Claude-Code 관련 정보를 찾기 어려움

#### Problem B: AI 관련 문서 분산
현재 5곳 이상에 분산:

```
docs/
├── AI_MODEL_POLICY.md            # 루트 레벨
├── core/
│   ├── ai/                       # 2 files
│   └── architecture/             # AI 관련 4+ files
├── development/ai/               # 2 subdirs
└── planning/analysis/            # AI 분석 2 files
```

**영향**: AI 아키텍처 전체 파악이 어려움

#### Problem C: Testing 문서 위치 문제
현재 `docs/ops/testing/`에 19개 파일이 있음

**질문**: Testing이 `ops`에 있는 것이 맞는가?
- `ops` = Operations (운영/배포/모니터링)
- `development` = 개발 관련 (테스트 포함?)

### 2.2 빈 디렉토리

| 디렉토리 | 상태 | 조치 |
|:---------|:-----|:-----|
| `docs/reports/` | 빈 폴더 | 삭제 권장 |
| `reports/planning/archive/` | 빈 폴더 | 삭제 권장 |

### 2.3 깊은 중첩 구조

`docs/core/architecture/` 아래 8개 하위 폴더:
- `current/`, `db/`, `decisions/`, `design/`
- `features/`, `infrastructure/`, `system/`, `ui/`

**문제**: 탐색이 어렵고 관련 문서 찾기 힘듦

### 2.4 일관성 없는 네이밍

| 패턴 | 예시 | 권장 |
|:-----|:-----|:-----|
| SCREAMING_SNAKE | `AI_ENGINE_ARCHITECTURE.md` | kebab-case로 통일 |
| SCREAMING_KEBAB | `MEMORY-REQUIREMENTS.md` | kebab-case로 통일 |
| kebab-case | `module-structure.md` | **표준** |
| Mixed | `DATA_ARCHITECTURE.md` | kebab-case로 통일 |

### 2.5 Archive 분산

```
docs/
├── archive/
│   ├── completed/               # 완료된 작업
│   ├── planning/                # 완료된 계획
│   └── reports/completed/       # 완료된 리포트 (중복!)
└── planning/
    └── archive/                 # 빈 폴더
```

**문제**: Archive가 여러 곳에 분산되어 관리 어려움

---

## 3. 개선 제안

### 3.1 Phase 1: 빈 디렉토리 정리 (즉시)

```bash
# 빈 디렉토리 삭제
rm -rf docs/reports/
rm -rf reports/planning/archive/
```

**예상 소요**: 5분
**리스크**: 낮음

### 3.2 Phase 2: Claude-Code 문서 통합 (권장)

**현재 → 제안**:
```
docs/development/ai/claude-code/     # 모든 Claude-Code 문서 통합
├── README.md
├── subagents-complete-guide.md
├── weekly-subagent-reminder.md
├── best-practices.md                # ← 이동
├── workflow-guide.md                # ← 이동
├── hooks-guide.md                   # ← 이동
└── wsl-guide.md                     # ← 이동
```

**이동 대상 파일**:
1. `docs/development/claude-code-v2.0.31-best-practices.md` → `docs/development/ai/claude-code/best-practices.md`
2. `docs/development/claude-workflow-guide.md` → `docs/development/ai/claude-code/workflow-guide.md`
3. `docs/environment/tools/claude-code/claude-code-hooks-guide.md` → `docs/development/ai/claude-code/hooks-guide.md`
4. `docs/environment/wsl/claude-code-wsl-guide.md` → `docs/development/ai/claude-code/wsl-guide.md`

**예상 소요**: 30분
**리스크**: 중간 (내부 링크 업데이트 필요)

### 3.3 Phase 3: Testing 위치 검토 (토론 필요)

**Option A**: 현재 유지 (`docs/ops/testing/`)
- 장점: 변경 없음
- 단점: `ops`가 testing을 포함하는 것이 직관적이지 않음

**Option B**: `docs/development/testing/`으로 이동
- 장점: 개발 관련 문서가 한 곳에 모임
- 단점: 대규모 이동 필요 (19개 파일)

**Option C**: `docs/testing/`으로 최상위 분리
- 장점: 테스팅의 중요성 강조
- 단점: 최상위 디렉토리 증가

**권장**: Option A 유지 (현재 구조 안정화 후 재검토)

### 3.4 Phase 4: 네이밍 표준화 (장기)

모든 파일명을 `kebab-case`로 통일:

```bash
# 예시 변환
AI_ENGINE_ARCHITECTURE.md → ai-engine-architecture.md
MEMORY-REQUIREMENTS.md → memory-requirements.md
DATA_ARCHITECTURE.md → data-architecture.md
```

**예상 소요**: 1시간+
**리스크**: 높음 (모든 내부 링크 업데이트 필요)

### 3.5 Phase 5: Architecture 하위 구조 단순화 (장기)

**현재** (8개 하위 폴더):
```
docs/core/architecture/
├── current/
├── db/
├── decisions/
├── design/
├── features/
├── infrastructure/
├── system/
└── ui/
```

**제안** (4개로 통합):
```
docs/core/architecture/
├── decisions/          # ADR 유지
├── db/                 # DB 스키마 유지
├── system/             # current + design + features + infrastructure 통합
└── ui/                 # UI 관련 유지
```

---

## 4. 우선순위 요약

| Phase | 작업 | 우선순위 | 리스크 | 예상 시간 | 상태 |
|:------|:-----|:--------:|:------:|:---------:|:----:|
| 1 | 빈 디렉토리 삭제 | **높음** | 낮음 | 5분 | ✅ 완료 |
| 2 | Claude-Code 문서 통합 | **중간** | 중간 | 30분 | ✅ 완료 |
| 3 | Testing 위치 검토 | 낮음 | - | 토론 | ⏸️ 보류 |
| 4 | 네이밍 표준화 | 낮음 | 높음 | 30분 | ✅ 완료 |
| 5 | Architecture 단순화 | 낮음 | 높음 | 2시간+ | ⏸️ 장기 |

---

## 5. 즉시 실행 가능한 작업

### 5.1 빈 디렉토리 삭제

```bash
rm -rf docs/reports/
rm -rf reports/planning/archive/
```

### 5.2 빈 tools 디렉토리 정리 (claude-code 이동 후)

Phase 2 완료 후:
```bash
# tools/claude-code가 비면
rm -rf docs/environment/tools/
```

---

## 6. 결론

현재 docs 구조는 **대체로 합리적**이지만, 다음 개선이 권장됩니다:

1. **즉시**: 빈 디렉토리 삭제
2. **단기**: Claude-Code 문서 통합
3. **장기**: 네이밍 표준화 및 구조 단순화

점진적 개선을 통해 문서 탐색성과 유지보수성을 향상시킬 수 있습니다.
