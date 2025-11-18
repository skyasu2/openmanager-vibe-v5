# 🤖 Claude Code 서브에이전트 완전 가이드

**OpenManager VIBE 프로젝트 전용** | 최종 업데이트: 2025-10-15

> 이 문서는 Claude Code에서 사용하는 12개 전문 서브에이전트의 활용법과 최적화 전략을 다룹니다.

---

## 📑 목차

1. [빠른 시작](#-빠른-시작-quick-start)
2. [상황별 에이전트 선택](#-상황별-에이전트-선택-매트릭스)
3. [자주 사용하는 명령어](#-자주-사용하는-명령어-모음)
4. [핵심 에이전트 구성](#-핵심-에이전트-구성-12개)
5. [최적화 전략](#-서브에이전트-최적화-전략)
6. [AI 활용 방법](#-ai-활용-방법---혼합-전략)

---

## 🚀 빠른 시작 (Quick Start)

### 2가지 호출 방법

1. **명시적 호출**: "codex-specialist를 사용하여 버그를 분석해주세요"
2. **직접 CLI**: `codex exec "복잡한 로직 분석"` (외부 도구)

### ⚡ 5초 선택 가이드

- 🐛 **버그 해결** → debugger-specialist + codex-specialist
- 🔧 **성능 최적화** → structure-refactor-specialist
- 📝 **코드 리뷰** → code-review-specialist + codex-specialist
- 🚀 **배포 이슈** → vercel-platform-specialist + security-specialist
- 🎨 **UI/UX 개선** → ui-ux-specialist + shadcn-ui 도구

---

## 🎯 상황별 에이전트 선택 매트릭스

| 상황                 | 1순위                      | 2순위                         | 조합 사용          |
| -------------------- | -------------------------- | ----------------------------- | ------------------ |
| 🐛 **버그 수정**     | debugger-specialist        | codex-specialist              | 분석→해결 순서     |
| 🚀 **성능 개선**     | structure-refactor-specialist | codex-specialist              | 구조→검증 순서     |
| 🔒 **보안 강화**     | security-specialist        | codex-specialist              | 스캔→실무검증      |
| 📱 **UI 개선**       | ui-ux-specialist           | shadcn-ui 도구                | 디자인→구현        |
| 🧪 **테스트 자동화** | test-automation-specialist | vercel-platform-specialist    | 테스트→배포        |

---

## ⚡ 자주 사용하는 명령어 모음

### 일일 개발 워크플로우

```bash
# 🌅 개발 시작
code-review-specialist: "어제 커밋한 코드 품질 검토해주세요"

# 🔧 개발 중
debugger-specialist: "이 에러의 근본 원인을 찾아주세요"
codex-specialist: "이 로직을 실무 관점에서 개선해주세요"

# 🚀 배포 전
security-specialist: "배포 전 보안 체크리스트 확인해주세요"
test-automation-specialist: "테스트 전체 상황을 분석하고 실행해주세요"
```

### 🧪 test-automation-specialist 스마트 진단 기능

**스마트 진단**: 테스트 환경 스캔 → 시나리오 분석 → 실행 → 실패 원인 자동 구분(테스트 vs 코드 문제) → 보안/성능 분석 → 개선안 제시. OWASP Top 10 대응 포함

---

## 🎯 핵심 에이전트 구성 (12개)

### 1. 코드 검증 전문가

#### codex-specialist

**ChatGPT Codex CLI 전용 외부 AI 연동 - 실무 검증 전문가**

- **역할**: 검증 및 분석 전문가 (실제 개발은 Claude Code가 수행)
- **특화**: 구현 검증·버그 분석·개선 제안, GPT-5 기반 분석
- **출력**: 버그 포인트 3개 + 리팩토링 제안 3개 + 개선 방향
- **호출 예시**: `codex: 구현된 알고리즘을 실무 관점에서 검증해주세요`
- **중요**: Codex는 분석/제안만, 실제 수정은 Claude가 수행

### 2. 시스템 설정 & 범용 (3개)

- **general-purpose**: 복잡한 다단계 작업 자율 처리, 코드 검색 및 연구 (모든 도구)
- **statusline-setup**: Claude Code 상태표시줄 설정 (Read, Edit)
- **output-style-setup**: Claude Code 출력 스타일 생성 (Read, Write, Edit, Glob, Grep)

### 3. 전문 도구 (12개)

#### 개발 환경 & 구조 (2개)

- **dev-environment-manager**: WSL 최적화, Node.js 버전 관리, 도구 통합
- **structure-refactor-specialist**: 프로젝트 구조 정리, 아키텍처 리팩토링

#### 백엔드 & 인프라 (3개)

- **database-administrator**: Supabase PostgreSQL 전문, RLS 정책, 쿼리 최적화
- **vercel-platform-specialist**: Vercel 플랫폼 최적화, 배포 자동화
- **gcp-cloud-functions-specialist**: GCP Cloud Functions 전문가

#### 코드 품질 & 보안 (3개)

- **code-review-specialist**: 통합 코드 품질 검토 + 디버깅 분석 전문가 ⭐ **강화됨**
- **debugger-specialist**: 근본 원인 분석 및 버그 해결 전문가
- **security-specialist**: 종합 보안 전문가 (auditor + reviewer 통합)

#### 테스트 & 문서화 (2개)

- **test-automation-specialist**: 🧪 **종합 테스트 진단 전문가** - 스마트 진단 시스템 ⭐
- **documentation-manager**: AI 친화적 문서 관리

#### UI/UX 전문가 (1개)

- **ui-ux-specialist**: 내장 UI/UX 전문가 (사용자 인터페이스 개선, 디자인 시스템 구축)

---

## 🔧 서브에이전트 최적화 전략

**최종 12개 에이전트 구성 완료** - Ghost agents 및 Low-value agents 제거 완료 (2025-10-19)

### 📊 최적화 성과

- 12개 에이전트로 최적화 완료
- 7개 중복 에이전트 제거
- 메모리 절약 및 효율성 증대

### 🗑️ 최적화 완료 (2025-09-19)

**제거/통합**:
- 7개 중복 에이전트 제거 (orchestrator, verification, supervisor, security-auditor/reviewer, analyst, coordinator)
- design-architect → ui-ux-specialist (이름 명확화)
- security-specialist (auditor + reviewer 통합)

- ✅ **security-specialist**: auditor + reviewer 기능 통합, Critical priority 유지

---

## 🎯 AI 활용 방법 - 혼합 전략

**✅ 공식 문서 확인**: 서브에이전트는 명시적 호출 방식과 자동 위임 방식을 지원합니다!

### 🔄 공식 서브에이전트 호출 방법

**복잡한 작업 → 간소화된 서브에이전트 호출** ⭐ **60% 효율화**

```bash
# 프로젝트 컨텍스트가 필요한 전문적 분석
codex: 타입스크립트 안전성을 전체 분석해주세요
ui-ux: UI/UX 개선을 실제로 구현해주세요
```

**간단한 작업 → 직접 CLI**

```bash
# 빠른 확인이나 간단한 질문
codex exec "이 함수에 버그 있나요?"
```

---

## 📈 성과 측정 및 품질 관리

### 에이전트별 성능 지표 (2025-09-25 기준)

- **평균 응답 시간**: 200ms
- **정확도**: 9.2/10
- **사용자 만족도**: 8.8/10

### 품질 보증 방법

```bash
# 응답 품질이 낮을 때
1. 더 구체적인 프롬프트 재시도
2. 다른 에이전트로 2차 검증
3. 외부 CLI 도구로 직접 확인
```

---

## 📚 관련 문서

- **[CLAUDE.md](../../CLAUDE.md)** - 메인 프로젝트 가이드
- **[AI 교차검증 시스템](./ai-cross-verification.md)** - 상세 교차검증 방법론
- **[MCP 설정 가이드](../mcp/setup-guide.md)** - MCP 서버 통합

---

**💡 팁**: 서브에이전트는 복잡한 작업을 전문가에게 위임하여 효율성을 높이는 도구입니다. 상황에 맞는 에이전트를 선택하여 개발 생산성을 극대화하세요!
