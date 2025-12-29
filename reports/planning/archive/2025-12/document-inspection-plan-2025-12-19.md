# 📋 문서 점검 계획서

**작성일**: 2025-12-19  
**버전**: v5.83.1  
**목적**: docs 폴더 내 유효 문서 점검 및 최신화

---

## 1. 제외 대상 (점검 불필요)

### 1.1 테스트 관련
- `docs/development/testing/` (21개 파일) - 별도 관리
- `docs/archive/testing/` (1개 파일)

### 1.2 리포트/로그
- `docs/reports/` (2개 파일)
  - TEST_INFRASTRUCTURE_ANALYSIS.md
  - WSL_VIBE_CODING_BEST_PRACTICES.md

### 1.3 아카이브 (완료/Deprecated)
- `docs/archive/completed/` (11개 파일)
- `docs/archive/gcp-functions-deprecated/` (5개 파일)
- `docs/archive/architecture-v5.71/` (3개 파일)
- `reports/planning/archive/` (7개 파일)
- `docs/archive/` 루트 파일들 (6개 파일)

**제외 합계: ~56개 파일**

---

## 2. 점검 대상 문서 목록

### 2.1 📁 Core 문서 (핵심 아키텍처) - 우선순위: 🔴 High

#### AI 관련 (5개)
| 파일 | 점검 항목 |
|------|----------|
| `docs/core/ai/ai-architecture.md` | Cloud Run 전환 반영 여부 |
| `docs/core/ai/ANALYSIS_CURRENT_STRUCTURE.md` | 현재 구조와 일치 여부 |
| `docs/core/ai/FREE-TIER-MONITOR-GUIDE.md` | 무료 티어 정책 최신화 |
| `docs/core/ai/MODE-SELECTION-REMOVAL.md` | 완료 후 아카이브 검토 |
| `docs/core/ai/README.md` | 개요 최신화 |

#### Architecture (26개)
| 하위 폴더 | 파일 수 | 점검 초점 |
|-----------|---------|----------|
| `current/` | 2 | 현재 시스템과 일치 여부 |
| `db/` | 3 | 스키마/쿼리 최신화 |
| `decisions/` | 2 | ADR 유효성 |
| `design/` | 2 | 디자인 원칙 준수 |
| `features/` | 5 | 기능별 아키텍처 |
| `infrastructure/` | 6 | 인프라 설정 |
| `system/` | 2 | 시스템 다이어그램 |
| `ui/` | 2 | UI 컴포넌트 구조 |
| 루트 | 12 | 주요 아키텍처 문서 |

#### Performance (6개)
- 번들 최적화, 캐시, 차트 성능 문서

#### Platforms (6개)
- Vercel, GCP, Deploy 관련 설정

#### Security (3개)
- OAuth, Cookie 마이그레이션

---

### 2.2 📁 Development 문서 (개발 가이드) - 우선순위: 🟡 Medium

#### AI 개발 가이드 (13개)
| 하위 폴더 | 파일 수 | 설명 |
|-----------|---------|------|
| `claude-code/` | 3 | Claude Code 사용 가이드 |
| `common/` | 9 | AI 코딩 표준, 워크플로우 |

#### MCP 가이드 (9개)
- MCP 설정, 통합, 도구 사용법

#### Standards (5개)
- 커밋 규칙, 문서화 표준, TypeScript 규칙

#### Workflows (2개)
- 코드 리뷰, Lint 가이드

#### 루트 파일 (15개)
- 프레임워크 체크리스트, 모킹 시스템 등

---

### 2.3 📁 Environment 문서 (환경 설정) - 우선순위: 🟡 Medium

#### Tools (1개)
- `claude-code/claude-code-hooks-guide.md`

#### Troubleshooting (7개)
- 빌드 오류, 시스템 복구 가이드

#### WSL (5개)
- WSL 설정, 최적화, 복구 가이드

---

### 2.4 📁 Planning 문서 (계획) - 우선순위: 🟢 Low

#### Analysis (5개)
- AI 아키텍처 분석, UI/UX 분석

#### Templates (1개)
- 작업 계획 템플릿

#### 루트 (3개)
- TODO.md, improvement-workplan

---

### 2.5 📁 API 문서 - 우선순위: 🟡 Medium
- `docs/api/endpoints.md` - API 엔드포인트 목록

---

### 2.6 📁 루트 문서 - 우선순위: 🔴 High
| 파일 | 점검 항목 |
|------|----------|
| `docs/README.md` | 문서 인덱스 최신화 |
| `docs/status.md` | 프로젝트 상태 반영 |
| `docs/QUICK-START.md` | 빠른 시작 가이드 |
| `docs/DEVELOPMENT.md` | 개발 가이드 |
| `docs/AI_MODEL_POLICY.md` | AI 모델 정책 |

---

## 3. 점검 기준 체크리스트

### 각 문서별 점검 항목
- [ ] 버전 정보 최신화 (v5.83.1 반영)
- [ ] 날짜 정보 갱신
- [ ] 링크 유효성 검증
- [ ] 코드 예제 동작 여부
- [ ] 아키텍처 변경 반영
- [ ] 중복 내용 통합 필요 여부
- [ ] 아카이브 대상 여부

---

## 4. 점검 우선순위 및 일정

### Phase 1: 핵심 문서 (🔴 High)
**대상**: 35개 파일
- `docs/core/` 전체
- `docs/` 루트 문서

### Phase 2: 개발 가이드 (🟡 Medium)
**대상**: 45개 파일
- `docs/development/` (testing 제외)
- `docs/environment/`
- `docs/api/`

### Phase 3: 계획/분석 문서 (🟢 Low)
**대상**: 9개 파일
- `reports/planning/` (archive 제외)

---

## 5. 예상 정리 대상

### 5.1 아카이브 후보
- 완료된 마이그레이션 문서
- v5.7x 이전 버전 관련 문서
- 일회성 분석 문서

### 5.2 통합 후보
- AI 관련 문서 중복 (ai-architecture vs AI_ENGINE_ARCHITECTURE)
- MCP 가이드 분산 (9개 → 3~4개로 통합 가능)

### 5.3 삭제 후보
- 빈 README.md 파일
- 더 이상 유효하지 않은 워크어라운드 문서

---

## 6. 점검 대상 통계

| 카테고리 | 파일 수 | 우선순위 |
|----------|---------|----------|
| Core | 45 | 🔴 High |
| Development (testing 제외) | 44 | 🟡 Medium |
| Environment | 13 | 🟡 Medium |
| Planning (archive 제외) | 9 | 🟢 Low |
| API | 1 | 🟡 Medium |
| 루트 | 5 | 🔴 High |
| **합계** | **117** | - |

---

## 7. 다음 단계

1. **Phase 1 시작**: Core 문서 점검
2. 각 문서별 상태 태그 추가 (✅ 최신, ⚠️ 갱신필요, 📦 아카이브)
3. 통합 가능 문서 식별 및 병합
4. 최종 문서 구조 정리

---

_작성: Claude Code_  
_승인 대기: 사용자 확인 필요_
