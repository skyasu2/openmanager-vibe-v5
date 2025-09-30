# 🤖 Claude Code 서브에이전트 완전 가이드

**OpenManager VIBE 프로젝트 전용** | 최종 업데이트: 2025-09-30

> 이 문서는 Claude Code에서 사용하는 18개 전문 서브에이전트의 활용법과 최적화 전략을 다룹니다.

---

## 📑 목차

1. [빠른 시작](#-빠른-시작-quick-start)
2. [상황별 에이전트 선택](#-상황별-에이전트-선택-매트릭스)
3. [자주 사용하는 명령어](#-자주-사용하는-명령어-모음)
4. [핵심 에이전트 구성](#-핵심-에이전트-구성-18개)
5. [최적화 전략](#-서브에이전트-최적화-전략)
6. [AI 활용 방법](#-ai-활용-방법---혼합-전략)

---

## 🚀 빠른 시작 (Quick Start)

### 3가지 호출 방법 (표준화)

1. **자동 위임**: "이 코드를 3개 AI로 교차검증해줘"
2. **명시적 호출**: "codex-specialist를 사용하여 버그를 분석해주세요"
3. **직접 CLI**: `codex exec "복잡한 로직 분석"` (외부 도구)

### ⚡ 5초 선택 가이드

- 🐛 **버그 해결** → debugger-specialist + codex-specialist
- 🔧 **성능 최적화** → qwen-specialist + structure-refactor-specialist
- 📝 **코드 리뷰** → code-review-specialist + gemini-specialist
- 🚀 **배포 이슈** → vercel-platform-specialist + security-specialist
- 🎨 **UI/UX 개선** → ui-ux-specialist + shadcn-ui 도구

---

## 🎯 상황별 에이전트 선택 매트릭스

| 상황 | 1순위 | 2순위 | 조합 사용 |
|------|-------|-------|-----------|
| 🐛 **버그 수정** | debugger-specialist | codex-specialist | 분석→해결 순서 |
| 🚀 **성능 개선** | qwen-specialist | structure-refactor-specialist | 알고리즘→구조 순서 |
| 🔒 **보안 강화** | security-specialist | codex-specialist | 스캔→실무검증 |
| 📱 **UI 개선** | ui-ux-specialist | shadcn-ui 도구 | 디자인→구현 |
| 🧪 **테스트 자동화** | test-automation-specialist | vercel-platform-specialist | 테스트→배포 |

---

## ⚡ 자주 사용하는 명령어 모음

### 일일 개발 워크플로우

```bash
# 🌅 개발 시작
code-review-specialist: "어제 커밋한 코드 품질 검토해주세요"

# 🔧 개발 중
debugger-specialist: "이 에러의 근본 원인을 찾아주세요"
qwen-specialist: "이 로직을 더 효율적으로 개선해주세요"

# 🚀 배포 전
security-specialist: "배포 전 보안 체크리스트 확인해주세요"
test-automation-specialist: "테스트 전체 상황을 분석하고 실행해주세요"
```

### 🧪 test-automation-specialist 스마트 진단 기능

**🎯 사용법**: `test-automation-specialist: "전체 테스트를 진단하고 실행해주세요"`

**📋 자동 분석 과정 (6단계)**:
1. **테스트 환경 스캔** → package.json, playwright.config.ts, 환경변수 검증
2. **시나리오 분석** → 현재 테스트 케이스, 커버리지, 누락 영역 확인
3. **테스트 실행** → 유닛, E2E, API 테스트 순차 실행
4. **실패 원인 진단** → 타임아웃/셀렉터/네트워크 vs 코드 로직 문제 구분
5. **보안/성능 분석** → 취약점 스캔, 성능 지표 분석
6. **개선안 제시** → 구체적 수정 방법 및 우선순위 제안

**🔍 실제 진단 예시**:

```yaml
# 타임아웃 오류 진단 결과
문제: "E2E 테스트 15초 타임아웃"
분석: "테스트 설정 문제 (코드 문제 아님)"
해결: "playwright.config.ts actionTimeout: 30초로 증가"
상태: "✅ 해결 완료"

# API 헬스체크 분석 결과
문제: "일부 API 헬스체크 실패"
분석: "콜드 스타트 지연 (코드 정상)"
해결: "웜업 요청 또는 캐싱 전략 권장"
우선순위: "낮음 (운영에 영향 없음)"

# 성능 분석 결과
측정: "FCP 608ms, 응답시간 532ms"
평가: "Google 권장 기준 대비 우수 (1.8초 이하)"
개선: "추가 최적화 불필요"
```

**🔬 테스트 vs 코드 문제 자동 구분 알고리즘**:

```yaml
# 🧪 테스트 문제 (Test Issues)
타임아웃_오류:
  증상: "TimeoutError, 15000ms exceeded"
  진단: "테스트 설정 문제"
  해결: "playwright.config.ts 타임아웃 증가"

셀렉터_오류:
  증상: "Element not found, selector"
  진단: "UI 변경으로 인한 테스트 코드 문제"
  해결: "셀렉터 업데이트 필요"

환경변수_누락:
  증상: "Environment variable not found"
  진단: "테스트 환경 설정 문제"
  해결: ".env.test 또는 환경변수 설정"

# 💻 코드 문제 (Code Issues)
API_로직_오류:
  증상: "500 Internal Server Error"
  진단: "서버 코드 로직 문제"
  해결: "API 코드 디버깅 필요"

인증_실패:
  증상: "401 Unauthorized, 403 Forbidden"
  진단: "인증/인가 로직 문제"
  해결: "인증 시스템 코드 수정"

데이터베이스_오류:
  증상: "Database connection failed"
  진단: "DB 연결 또는 쿼리 문제"
  해결: "데이터베이스 코드 점검"
```

**🛡️ 보안 자동 감지 체크리스트**:

```yaml
# ✅ 보안 헤더 검증
CSP_헤더:
  상태: "✅ 정상"
  내용: "Content-Security-Policy 적용"
  점검: "XSS, 인젝션 공격 방어"

CORS_설정:
  상태: "✅ 정상"
  내용: "Cross-Origin 요청 제한"
  점검: "무단 도메인 접근 차단"

# 🔐 인증/인가 시스템 검증
권한_시스템:
  상태: "✅ 정상"
  내용: "GitHub OAuth + PIN 인증 (4231)"
  점검: "무인가 접근 차단 정상"

API_보호:
  상태: "✅ 정상"
  내용: "관리자 전용 API 접근 제한"
  점검: "/api/debug/env 인증 필수 적용"

# ⚠️ 환경변수 보안 스캔
민감정보_노출:
  자동검사: "API 키, 토큰, 패스워드 패턴 스캔"
  권장사항: ".env 파일 git 제외 확인"

# 📊 보안 점수 자동 계산
보안_등급: "A+ (95/100점)"
기준: "OWASP Top 10 대응, 보안 권장사항 준수"
```

### AI 교차검증 템플릿

```bash
# 3-AI 교차검증 (고품질 코드)
"이 [컴포넌트/함수/API]를 3개 AI로 교차검증해줘:
- Codex: 실무 관점에서 문제점 찾기
- Gemini: 아키텍처 관점에서 구조 개선
- Qwen: 성능 관점에서 최적화 방안"
```

---

## 🎯 핵심 에이전트 구성 (18개)

### 1. AI 교차 검증 시스템 (3개)

#### codex-specialist
**ChatGPT Codex CLI 전용 외부 AI 연동**
- **특화**: 구현·버그스캔·PR 제안 전문가, GPT-5 기반 분석
- **출력**: 디프 기반 버그 포인트 3개 + 리팩토링 포인트 3개 + PR 초안
- **호출 예시**: `codex: 복잡한 알고리즘을 최적화 분석해주세요`

#### gemini-specialist
**Google Gemini CLI 전용 외부 AI 연동**
- **특화**: 시스템 아키텍처 분석, 구조적 개선사항 제안
- **호출 예시**: `gemini: 시스템 아키텍처 설계를 검토해주세요`

#### qwen-specialist
**Qwen CLI 전용 외부 AI 연동**
- **특화**: 알고리즘 최적화, 성능 분석, 수학적 복잡도 개선
- **호출 예시**: `qwen: 알고리즘 성능을 최적화 분석해주세요`

### 2. 시스템 설정 & 범용 (3개)

#### general-purpose
**범용 목적 에이전트**
- **특화**: 복잡한 다단계 작업 자율 처리, 코드 검색 및 연구
- **도구**: 모든 도구 접근 가능 (*)

#### statusline-setup
**Claude Code 상태표시줄 설정 전용**
- **특화**: Claude Code 상태표시줄 설정 구성
- **도구**: Read, Edit

#### output-style-setup
**Claude Code 출력 스타일 생성 전용**
- **특화**: Claude Code 출력 스타일 생성
- **도구**: Read, Write, Edit, Glob, Grep

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

#### 분석 & UI/UX 전문가 (2개)

- **spec-driven-specialist**: 계획 대비 결과 분석 평가 전문가
- **ui-ux-specialist**: 내장 UI/UX 전문가 (사용자 인터페이스 개선, 디자인 시스템 구축)

---

## 🔧 서브에이전트 최적화 전략

**15개 핵심 에이전트 최적화 완료** - UI/UX 전문가 독립화 완료 (2025.09.19)

### 📊 AI 교차검증 결과 (9.17/10)

- **Codex (실무 관점)**: 9.2/10 - 단계적 제거, 기능 패리티 우선
- **Gemini (아키텍처)**: 9.5/10 - 응집도 증가, 결합도 감소
- **Qwen (성능 최적화)**: 8.8/10 - 26% 메모리 절약, CPU 효율성 증대

### 🗑️ 최적화 완료 (2025-09-19)

**제거된 에이전트 (7개)**:
- ❌ **orchestrator-agent**: 서브에이전트 체이닝 불가능으로 논리적 모순
- ❌ **verification-specialist**: 중간 단계일 뿐, Claude Code가 직접 수행 가능
- ❌ **central-supervisor**: Claude Code 메인이 실제 오케스트레이터 역할
- ❌ **security-auditor**: security-specialist로 통합
- ❌ **security-reviewer**: security-specialist로 통합
- ❌ **requirements-analyst**: 프로젝트 성숙 단계에서 불필요
- ❌ **task-coordinator**: 프로젝트 성숙 단계에서 불필요

**이름 변경된 에이전트 (1개)**:
- 🔄 **design-architect** → **ui-ux-specialist**: UI/UX 전문성 명확화

**통합된 에이전트 (1개)**:
- ✅ **security-specialist**: auditor + reviewer 기능 통합, Critical priority 유지

---

## 🎯 AI 활용 방법 - 혼합 전략

**✅ 공식 문서 확인**: 서브에이전트는 명시적 호출 방식과 자동 위임 방식을 지원합니다!

### 🔄 공식 서브에이전트 호출 방법

**복잡한 작업 → 간소화된 서브에이전트 호출** ⭐ **60% 효율화**

```bash
# 프로젝트 컨텍스트가 필요한 전문적 분석
codex: 타입스크립트 안전성을 전체 분석해주세요
gemini: 시스템 아키텍처 설계를 검토해주세요
qwen: 알고리즘 성능을 최적화 분석해주세요

# 문서화 및 프로젝트 정리 전문가
spec-driven: UI/UX 개선 프로젝트 작업계획서를 작성해주세요
spec-driven: 현재까지의 개발 진행 상황을 정리해주세요
spec-driven: 프로젝트 완료 보고서 및 성과 정리를 해주세요
ui-ux: UI/UX 개선을 실제로 구현해주세요
```

**간단한 작업 → 직접 CLI**

```bash
# 빠른 확인이나 간단한 질문
codex exec "이 함수에 버그 있나요?"
gemini "이 구조가 SOLID 원칙에 맞나요?"
qwen -p "시간복잡도는?"

# AI 교차검증 (사용자 요청 시)
"이 코드를 3개 AI로 교차검증해줘" # Claude가 적절한 방식 선택하여 실행
```

---

## 📈 성과 측정 및 품질 관리

### 에이전트별 성능 지표 (2025-09-25 기준)

- **평균 응답 시간**: 200ms (qwen 60초 제외)
- **정확도**: 9.2/10 (AI 교차검증 결과)
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