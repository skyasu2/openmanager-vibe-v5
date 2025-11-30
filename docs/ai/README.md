---
category: ai-systems
purpose: multi_ai_integration_and_verification
ai_optimized: true
query_triggers:
  - 'AI 교차검증'
  - '서브에이전트'
  - 'Codex 사용법'
  - 'Gemini 활용'
  - 'Qwen 최적화'
related_docs:
  - 'config/ai/registry-core.yaml'
  - 'docs/ai/subagents-complete-guide.md'
  - 'docs/ai/ai-coding-standards.md'
last_updated: '2025-11-27'
---

# 🤖 AI 시스템 문서

> **📝 핵심 가이드**:
>
> - [서브에이전트 완전 가이드](./subagents-complete-guide.md) (12개 전문 에이전트)
> - [AI 코딩 규칙](./ai-coding-standards.md) (Codex, Gemini, Qwen, Claude)
> - [AI 벤치마크](./ai-benchmarks.md) (성능 비교)
> - [AI 사용 가이드](./ai-usage-guidelines.md) (DO/DON'T, 무료 티어)

**목적**: Multi-AI 교차검증, 서브에이전트, CLI 도구 통합 가이드

> **ℹ️ 아키텍처 노트**: v5.80.0부터 **Unified Processor** 아키텍처가 도입되어 모든 AI 요청이 단일 GCP 함수로 통합 처리됩니다. (레거시 모드 선택 UI 제거됨)

---

## 📂 디렉토리 구조

```
ai/
├── subagents-complete-guide.md      # 서브에이전트 완전 가이드 ⭐
├── ai-coding-standards.md           # AI 코딩 규칙 통합 🆕
├── ai-benchmarks.md                 # AI 도구 벤치마크 🆕
├── ai-usage-guidelines.md           # AI 사용 가이드라인 🆕
├── GCP_FUNCTIONS_INTEGRATION.md     # GCP Functions 통합
├── GCP-FUNCTIONS-SUMMARY.md         # GCP Functions 요약 🆕
├── ai-maintenance.md                # AI CLI 유지보수
├── UNIFIED_ENGINE.md                # AI 엔진 통합 가이드
├── AI-FEATURES-OPERATION-GUIDE.md   # AI 기능 운영 가이드
└── verifications/                   # AI 검증 기록 (3개)
```

**총 15개 파일**

---

## 🎯 핵심 문서 (우선순위별)

### ⭐ 필수 읽기

| 문서                                                         | 설명                     | 중요도 |
| ------------------------------------------------------------ | ------------------------ | ------ |
| [subagents-complete-guide.md](./subagents-complete-guide.md) | 12개 서브에이전트 활용법 | ⭐⭐⭐ |
| [ai-coding-standards.md](./ai-coding-standards.md) 🆕        | AI 코딩 규칙 통합        | ⭐⭐⭐ |
| [ai-benchmarks.md](./ai-benchmarks.md) 🆕                    | AI 도구 성능 비교        | ⭐⭐   |
| [ai-usage-guidelines.md](./ai-usage-guidelines.md) 🆕        | AI 사용 가이드라인       | ⭐⭐   |

### 📚 상세 가이드

| 문서                                                               | 설명                                    |
| ------------------------------------------------------------------ | --------------------------------------- |
| [ai-maintenance.md](./ai-maintenance.md)                           | AI CLI 유지보수 (버전 관리, 트러블슈팅) |
| [GCP_FUNCTIONS_INTEGRATION.md](./GCP_FUNCTIONS_INTEGRATION.md)     | GCP Functions 전체 가이드               |
| [GCP-FUNCTIONS-SUMMARY.md](./GCP-FUNCTIONS-SUMMARY.md) 🆕          | GCP Functions 요약                      |
| [UNIFIED_ENGINE.md](./UNIFIED_ENGINE.md)                           | AI 엔진 통합 아키텍처                   |
| [AI-FEATURES-OPERATION-GUIDE.md](./AI-FEATURES-OPERATION-GUIDE.md) | AI 기능 운영 매뉴얼                     |

---

## 🤖 서브에이전트 시스템

### 빠른 실행

```bash
# 복잡한 작업 → 서브에이전트 호출
"code-review-specialist야, 변경사항 리뷰해줘"
"debugger-specialist야, 이 버그 근본 원인 찾아줘"
"security-specialist야, 배포 전 보안 체크해줘"

# 간단한 작업 → 직접 CLI
codex exec "이 함수에 버그 있나요?"
gemini "이 구조가 SOLID 원칙에 맞나요?"
qwen -p "시간복잡도는?"
```

### 주요 서브에이전트 (12개)

#### 코드 품질 & 검증

- **codex-specialist**: 실무 관점 검증 (외부 CLI)
- **code-review-specialist**: 통합 코드 리뷰 + Codex 자동 리뷰
- **debugger-specialist**: 근본 원인 분석

#### 시스템 & 환경

- **dev-environment-manager**: WSL 최적화, Node.js 관리
- **structure-refactor-specialist**: 아키텍처 리팩토링
- **database-administrator**: Supabase PostgreSQL 전문

#### 배포 & 보안

- **vercel-platform-specialist**: Vercel 플랫폼 최적화
- **security-specialist**: 종합 보안 전문가 (CRITICAL)
- **gcp-cloud-functions-specialist**: GCP Functions 전문

#### 테스트 & 문서

- **test-automation-specialist**: 테스트 자동화 (스마트 진단)
- **documentation-manager**: AI 친화적 문서 관리
- **ui-ux-specialist**: UI/UX 개선 전문

**상세**: [subagents-complete-guide.md](./subagents-complete-guide.md)
**설정 SSOT**: [config/ai/registry-core.yaml](../../config/ai/registry-core.yaml)

---

## 🔄 AI 도구 현황

### 활성화된 도구 (4개)

| 도구            | 버전    | 역할             | 상태    |
| --------------- | ------- | ---------------- | ------- |
| **Claude Code** | v2.0.49 | 메인 개발 AI     | ✅ 활성 |
| **Codex**       | v0.63.0 | 코드 리뷰 & 검증 | ✅ 활성 |
| **Gemini**      | v0.17.1 | 범용 개발 파트너 | ✅ 활성 |
| **Qwen**        | v0.2.3  | 성능 최적화      | ✅ 활성 |

### 자동 코드 리뷰 시스템 (v5.0.0)

**1:1:1:1 균등 분배** (Codex, Gemini, Qwen, Claude 각 25%):

- 1차: 순환적 균등 선택 (상태 파일 기반)
- 2차: Primary AI 실패 → Secondary AI 1 폴백
- 3차: Secondary AI 1 실패 → Secondary AI 2 폴백
- 4차: Secondary AI 2 실패 → Secondary AI 3 폴백 (최종)
- Git Hook: `.husky/post-commit` 자동 트리거
- 출력: `logs/code-reviews/review-{AI}-YYYY-MM-DD-HH-MM-SS.md`
- 가용성: **99.99%** (Codex OR Gemini OR Qwen OR Claude)

**상세**: [@docs/status.md](../status.md) (코드 리뷰 시스템 상태)

---

## 📊 AI 성능 지표

### HumanEval & SWE-bench

| AI 도구    | HumanEval               | SWE-bench | 특화 영역           |
| ---------- | ----------------------- | --------- | ------------------- |
| **Codex**  | 94%                     | 74.5%     | 함수 단위 문제 해결 |
| **Gemini** | -                       | 54%       | 범용 개발           |
| **Qwen**   | 88.4% (7B), 92.7% (32B) | -         | 성능 최적화         |

**상세**: [ai-benchmarks.md](./ai-benchmarks.md)

---

## 💡 빠른 사용 가이드

### Codex (실무 검증)

```bash
# 코드 리뷰
codex exec "이 PR을 실무 관점에서 리뷰해주세요"

# 버그 분석
cat file.ts | codex "버그 3가지 찾아줘"

# 리팩토링
codex exec "이 코드 DRY 원칙 적용해서 개선해줘"
```

### Gemini (범용 개발)

```bash
# 아키텍처 검토
git diff | gemini "설계 결정 검토해줘"

# 타입 검증
cat types.ts | gemini "TypeScript strict mode 준수 확인"

# 테스트 작성
cat component.tsx | gemini "Vitest 테스트 작성해줘"
```

### Qwen (성능 최적화)

```bash
# 성능 분석
qwen -p "이 알고리즘 시간복잡도는?"

# 최적화 제안
cat slow-function.ts | qwen "성능 개선 방안 3가지"

# 메모리 분석
qwen -p "메모리 효율적인 구현은?"
```

**상세**: [ai-usage-guidelines.md](./ai-usage-guidelines.md)

---

## 🔗 관련 문서

### 시스템 설정

- **[config/ai/registry-core.yaml](../../config/ai/registry-core.yaml)** - AI Registry SSOT
- **[config/ai/changelog.yaml](../../config/ai/changelog.yaml)** - AI 도구 변경 이력

### 개발 가이드

- **[status.md](../status.md)** - 프로젝트 현재 상태
- **[development/README.md](../development/README.md)** - 개발 환경 종합

### 분석 & 기획

- **[analysis/AI-ENGINE-OPTIMIZATION-2025-11-20.md](../analysis/AI-ENGINE-OPTIMIZATION-2025-11-20.md)** - AI 최적화
- **[specs/ai-engine-refactoring-summary.md](../specs/ai-engine-refactoring-summary.md)** - AI 리팩토링 요약

---

**Last Updated**: 2025-11-27 by Claude Code
**핵심 원칙**: "Multi-AI 교차검증 + 서브에이전트 활용 + 99.99% 가용성"
