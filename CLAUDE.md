# CLAUDE.md - OpenManager VIBE Project Memory

**한국어로 우선 대화, 기술용어는 영어 사용허용**

**Claude Code 프로젝트 가이드** | [공식 문서](https://docs.claude.com/en/docs/claude-code/memory)

---

## 📋 목차

- [📦 버전 정보](#-버전-정보)
- [🎯 프로젝트 개요](#-프로젝트-개요)
- [🏗️ 시스템 아키텍처](#%EF%B8%8F-시스템-아키텍처)
- [🛠️ 개발 환경](#%EF%B8%8F-개발-환경)
- [📐 코딩 표준](#-코딩-표준)
- [🧪 테스트 전략](#-테스트-전략)
- [🚀 배포 가이드](#-배포-가이드)
- [📚 공통 워크플로우](#-공통-워크플로우)
- [💡 개발 철학](#-개발-철학)
- [🎯 현재 상태](#-현재-상태)
- [🔧 트러블슈팅](#-트러블슈팅)

---

## 📦 버전 정보

**중앙 관리 - Single Source of Truth**

| 항목 | 현재 값 | 확인 경로 |
|------|---------|-----------|
| **프로젝트** | v5.80.0 | `package.json:version` |
| **Claude Code CLI** | `claude --version` 결과 확인 | 실행 환경에서 직접 확인 |
| **Claude 모델** | Sonnet (기본) | `/usage` 또는 설정 패널 |
| **Node.js** | 22.15.1 | `.nvmrc` |
| **npm** | 10.9.2 | `package.json:packageManager` |
| **Next.js** | ^15.4.5 | `package.json:dependencies.next` |
| **React** | 18.3.1 | `package.json` |
| **TypeScript** | ^5.7.2 | `package.json` |

---

## 🎯 프로젝트 개요

**OpenManager VIBE**: AI 기반 실시간 서버 모니터링 플랫폼

### 핵심 특징
- **기술 스택**: Next.js 15 App Router, React 18.3, TypeScript strict, Tailwind UI 구성요소
- **데이터 계층**: Supabase PostgreSQL, Vercel Edge Functions, 선택적 GCP Cloud Functions
- **배포 전략**: Vercel 기본 파이프라인, Git push 연동 자동 배포
- **AI 협업**: Claude Code를 메인 IDE로 사용하고, Codex/Gemini/Qwen CLI를 필요 시 병행 사용

### 빠른 시작

```bash
# 개발 서버 시작
npm run dev:stable          # 안정화된 개발 서버 (권장)
npm run dev                 # 기본 개발 서버
npm run validate:all        # 린트+타입+테스트

# 테스트 실행
npm run test:vercel:e2e     # Vercel 환경 E2E 테스트 (선택)
npm run test:super-fast     # 빠른 유닛 테스트 프로필

# 배포
git push                    # Vercel 자동 배포

# Claude Code v2.0 새 기능
/rewind                     # Checkpoints로 이전 상태 복원 (Esc 두 번)
/usage                      # Max 플랜 사용량 확인
```

### Claude Code v2.0 신규 기능 (공식 문서 검증 완료)

**Checkpoints (체크포인트)** ✅
- 코드 변경 전 자동 저장 (매 프롬프트마다 자동 생성)
- `/rewind` 또는 `Esc Esc`로 즉시 복원
- 3가지 복원 모드: 대화만 / 코드만 / 둘 다
- 30일간 자동 보관 (설정 가능)

**새로운 슬래시 명령어** ✅
- `/usage` - 플랜 사용량 및 rate limit 확인
- `/rewind` - 코드/대화 복원 메뉴 열기

**키보드 단축키** ✅
- `Tab` - Extended thinking 토글 (on-demand 활성화)
- `Ctrl-R` - 명령어 히스토리 역방향 검색
- `Esc Esc` - Rewind 메뉴 열기
- `Shift-Tab` - 권한 모드 전환

**Sonnet 4.5 기본 모델** ✅
- 세계 최고 코딩 모델 (2025-09-29 릴리스)
- Extended thinking 지원 (Tab 키로 토글)
- Memory tool (Beta) 사용 가능

**참고**: `alwaysThinkingEnabled` 설정은 공식 스키마에 존재하나 문서화되지 않은 Beta 기능입니다.

---

## 🤖 Multi-AI 사용 전략 (2025-10-05 신규)

**핵심 원칙**: MCP 도구 우선 → Bash CLI 대안 → 수동 실행 최후

### 1️⃣ Multi-AI MCP 서버 (우선 사용) ⭐

**위치**: `packages/multi-ai-mcp/` (프로젝트 전용 MCP)

**사용 시기**:
- ✅ 3-AI 교차검증 필요 시 (자동 합의 분석)
- ✅ Claude Code 내에서 즉시 실행
- ✅ 결과를 구조화된 JSON으로 받고 싶을 때

**사용법**:
```typescript
// Claude Code에서 자연어로 요청
"이 코드를 Multi-AI MCP로 교차검증해줘"

// 또는 명시적 도구 호출
mcp__multi_ai__queryAllAIs({
  query: "Multi-AI MCP 서버 코드 품질 분석",
  qwenPlanMode: false  // Normal Mode 권장 (8초 응답)
})

// 선택적 AI 실행
mcp__multi_ai__queryWithPriority({
  query: "성능 최적화 방법",
  includeCodex: true,
  includeGemini: false,  // 아키텍처 분석 제외
  includeQwen: true
})

// 성능 통계 확인
mcp__multi_ai__getPerformanceStats()

// 히스토리 조회 (v1.2.0 신규)
mcp__multi_ai__getHistory({ limit: 10 })  // 최근 10개 기록

// 히스토리 검색 (v1.2.0 신규)
mcp__multi_ai__searchHistory({ pattern: "성능 최적화" })  // 패턴 매칭

// 히스토리 통계 (v1.2.0 신규)
mcp__multi_ai__getHistoryStats()  // 평균 성공률, 응답시간, AI 사용량
```

**장점**:
- ✅ **자동 합의 분석**: 2+ AI 합의 항목 자동 추출
- ✅ **충돌 감지**: 의견 차이 자동 식별
- ✅ **구조화된 결과**: JSON 형태로 즉시 사용 가능
- ✅ **성능 추적**: 응답 시간, 성공률 자동 기록
- ✅ **히스토리 자동 저장**: 모든 검증 결과 자동 기록 (v1.2.0)
- ✅ **WSL 완벽 지원**: 프로젝트 `.mcp.json` 정상 작동

**권장 사용법**:
- ✅ **짧은 쿼리** (<1000자): `queryAllAIs` 사용 (3-AI 병렬)
- ✅ **긴 쿼리** (1000-2500자): `queryWithPriority` 사용 (선택적 AI)
- ✅ **복잡한 분석**: Qwen Plan Mode 비활성화 (Normal Mode 권장)
- ✅ **과거 검증 조회**: `getHistory`, `searchHistory` 사용 (v1.2.0)

**현재 버전**: v1.2.0 (2025-10-05 개선)
**평가 점수**: 9.5/10 (프로덕션 완벽 준비)

**🎉 v1.2.0 신규 기능** (2025-10-05):
- ✅ **히스토리 자동 기록**: 모든 AI 교차검증 결과 자동 저장 (JSON 형식)
- ✅ **히스토리 조회**: `getHistory(limit)` - 최근 N개 검증 기록 조회
- ✅ **히스토리 검색**: `searchHistory(pattern)` - 쿼리 패턴 기반 검색
- ✅ **히스토리 통계**: `getHistoryStats()` - 평균 성공률, 응답시간, AI 사용량 분석
- ✅ **히스토리 위치**: `packages/multi-ai-mcp/history/` (MCP 패키지 내부)

**🔧 v1.1.0 개선 사항** (2025-10-05):
- ✅ **쿼리 길이 제한 완화**: 1,000자 → 2,500자 (+150%)
- ✅ **Gemini 타임아웃 증가**: 30초 → 90초 (+200%)
- ✅ **Qwen 타임아웃 증가**: Normal 45초, Plan 90초 (+50%)
- ✅ **3-AI 병렬 성공**: 23.6초, 100% 성공률 (타임아웃 0%)

**최신 검증 결과** (2025-10-05 v1.2.0):
- **개별 점수**: Codex 8/10 (5초), Gemini 10/10 (23.6초), Qwen 8/10 (23.6초)
- **총 실행 시간**: 23.6초 (3-AI 병렬 실행)
- **성공률**: 100% (3/3 AI 완료, 타임아웃 0%)
- **히스토리 기록**: 자동 저장 완료 (검증 메타데이터 포함)

---

### 2️⃣ Bash CLI Wrapper (대안)

**위치**: `scripts/ai-subagents/`

**사용 시기**:
- ⚠️ MCP 서버 사용 불가 시 (연결 실패, 디버깅)
- ⚠️ 터미널 스크립트에서 직접 호출
- ⚠️ 개별 AI 테스트 필요 시

**사용법**:
```bash
# Wrapper 스크립트 (적응형 타임아웃)
./scripts/ai-subagents/codex-wrapper.sh "쿼리"
./scripts/ai-subagents/gemini-wrapper.sh "쿼리"
./scripts/ai-subagents/qwen-wrapper.sh -p "쿼리"

# 병렬 실행 (Claude가 자동으로 수행)
"Bash CLI로 3-AI 병렬 실행해줘"
```

**장점**:
- ✅ **적응형 타임아웃**: 30/90/120초 자동 조절
- ✅ **자동 재시도**: 실패 시 1회 재시도
- ✅ **성능 로깅**: logs/ai-perf/ 자동 기록

**단점**:
- ❌ 수동 합의 분석 필요
- ❌ Claude가 결과 파일 읽고 종합해야 함

---

### 3️⃣ 직접 CLI 실행 (최후)

**사용 시기**:
- ❌ MCP/Wrapper 모두 실패 시만
- ❌ 특수한 디버깅 목적

**사용법**:
```bash
# 직접 실행 (타임아웃 보호 필수)
timeout 90 codex exec "쿼리"
timeout 30 gemini "쿼리"
timeout 60 qwen -p "쿼리"
```

---

### 의사결정 플로우차트

```
AI 교차검증 필요
    ↓
Multi-AI MCP 사용 가능? ──예→ [MCP 우선 사용] ✅
    │
    아니오
    ↓
Bash CLI Wrapper 사용 ──예→ [Wrapper 대안] ⚠️
    │
    아니오
    ↓
직접 CLI 실행 (타임아웃 보호) ──→ [최후 수단] ❌
```

---

### 실전 예시

**시나리오 1: 코드 품질 검증**
```
# ✅ 권장 (MCP 우선)
"이 코드를 Multi-AI MCP로 검증해줘"

# ❌ 비권장 (Bash CLI 직접)
"Bash로 3개 AI 병렬 실행"
```

**시나리오 2: 성능 분석**
```
# ✅ 권장 (선택적 AI)
mcp__multi_ai__queryWithPriority({
  query: "성능 병목점 분석",
  includeQwen: true,  // 성능 전문가만
  includeCodex: false,
  includeGemini: false
})
```

**시나리오 3: MCP 연결 실패 시**
```
# ⚠️ 대안 (Wrapper 사용)
./scripts/ai-subagents/codex-wrapper.sh "분석"
```

---

### 버전 관리

| 항목 | 버전 | 상태 |
|------|------|------|
| **Multi-AI MCP** | v1.0.0 | ✅ 프로덕션 준비 완료 |
| **Codex Wrapper** | v1.0.0 | ✅ 적응형 타임아웃 적용 |
| **Gemini Wrapper** | v1.0.0 | ✅ 30초 고정 |
| **Qwen Wrapper** | v1.1.0 | ✅ Plan Mode 90초 (Normal 45초) |

---

## 🏗️ 시스템 아키텍처

### 상세 아키텍처 문서 (Import)

- **@docs/claude/architecture/system-overview.md**
  - StaticDataLoader 시스템
  - 애플리케이션 AI 엔진 (2-AI 모드)
  - Mock 시뮬레이션 시스템
  - 무료 티어 전략

- **@docs/claude/architecture/ai-cross-verification.md**
  - 3-AI 협업 교차검증 시스템
  - Claude, Codex, Gemini, Qwen 통합

- **@docs/claude/architecture/mock-simulation.md**
  - FNV-1a 해시 기반 메트릭 생성
  - 10개 서버 타입, 15+ 장애 시나리오

### 기술 스택

**Frontend**
- Next.js 15+ (App Router)
- React 18.3.1
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui
- Zustand + React Query

**Backend**
- Vercel Edge Functions
- Supabase PostgreSQL
- GCP Cloud Functions
- Next.js API Routes

**Infrastructure**
- Hosting: Vercel (무료 티어)
- Database: Supabase (무료 티어)
- Functions: GCP Cloud Functions (무료 티어)

---

## 🛠️ 개발 환경

**1인 AI 개발 환경**: WSL + Multi-AI 협업 시스템

### 상세 개발 환경 문서 (Import)

- **@docs/claude/environment/wsl-optimization.md**
  - WSL 2 최적화 설정 (20GB 메모리)
  - .wslconfig 필수 설정
  - MCP 서버 호환성 설정

- **@docs/claude/environment/ai-tools-setup.md**
  - Claude Code 설치 및 플랜 확인 절차
  - Codex/Gemini/Qwen CLI 설치·인증 가이드
  - CLI 버전 및 토큰 한도 점검 방법

- **@docs/claude/environment/multi-ai-strategy.md**
  - 병렬 개발 패턴 (생산성 4배)
  - 교차 검증 워크플로우
  - 전문 분야별 특화

- **@docs/claude/environment/mcp/mcp-configuration.md**
  - 10개 MCP 서버 설정 (Multi-AI 추가)
  - 인증 방법 (OAuth, Token, API Key)
  - 문제 해결 가이드

- **@docs/claude/environment/mcp/mcp-priority-guide.md** ⭐
  - MCP 우선순위 의사결정 가이드
  - 작업별 MCP 선택 매트릭스
  - 실전 예시 (Before/After)
  - 82% 토큰 절약 달성 전략

- **@docs/claude/environment/workflows.md**
  - 일일 개발 루틴
  - 병렬 개발 패턴
  - AI 교차검증 워크플로우
  - Git/배포 워크플로우

- **@docs/claude/environment/claude-code-hooks-guide.md**
  - Claude Code v2.0 Hooks 시스템
  - PostToolUse/UserPromptSubmit 설정
  - WSL 환경 호환성 (선택적)

### 핵심 도구

| 도구 | 확인 명령 | 역할 | 현재 버전 | 최근 확인 |
|------|------------|------|----------|----------|
| **Claude Code** | `claude --version` | 메인 IDE/Task | v2.0.1 | 2025-10-04 |
| **Codex CLI** | `codex --version` | 코드 분석·자동화 | v0.44.0 | 2025-10-05 |
| **Gemini CLI** | `gemini --version` | 아키텍처/문서 초안 | v0.7.0 ⬆️ | 2025-10-04 |
| **Qwen CLI** | `qwen --version` | 프로토타입/성능 실험 | v0.0.14 | 2025-10-04 |

### AI CLI 타임아웃 권장사항 (2025-10-05 개선)

**문제 해결**: Codex 응답 시간 변동성으로 인한 타임아웃 발생 (단순 쿼리 2초 vs 복잡 쿼리 51초)

**Wrapper 스크립트 사용 (권장)**:
```bash
# Codex - 적응형 타임아웃 (30/90/120초)
./scripts/ai-subagents/codex-wrapper.sh "복잡한 분석"

# Gemini - 고정 30초
./scripts/ai-subagents/gemini-wrapper.sh "아키텍처 검토"

# Qwen - Plan Mode 90초 (Normal 45초)
./scripts/ai-subagents/qwen-wrapper.sh -p "성능 최적화"
```

**개선 성과**:
- 타임아웃 성공률: **40% → 95%** (2.4배 향상)
- 자동 재시도로 **92% 재실행 감소**
- P95 응답 시간 기준 안전 계수 1.67 적용

**직접 CLI 사용 시 타임아웃 설정**:
- 간단한 쿼리: `timeout 30 codex exec "쿼리"`
- 복잡한 쿼리: `timeout 90 codex exec "쿼리"`
- 자동화 스크립트: `timeout 90` 이상 권장

→ 상세 내용은 @docs/claude/environment/multi-ai-strategy.md 참조

### MCP 서버 점검

- `claude mcp list`로 연결 상태와 버전을 수시 확인합니다.
- 자동 점검 스크립트: `./scripts/mcp-health-check-enhanced.sh` (WSL에서 실행).
- 설정 변경 또는 신규 서버 추가 시 `docs/claude/environment/mcp/` 문서를 먼저 갱신한 뒤 이 파일을 업데이트합니다.

### 빠른 시작

```bash
# 환경 시작
wsl && cd /mnt/d/cursor/openmanager-vibe-v5

# 상태 확인
claude --version && claude mcp list

# 개발 서버
npm run dev:stable &

# Claude Code 실행
claude
```

### Codex CLI 연동 베스트 프랙티스 (Claude Code → WSL)

1. **작업 디렉터리 고정**: Claude Code Shell/Run Command 도구에서 `cd /mnt/d/cursor/openmanager-vibe-v5` 실행 후 `pwd`로 확인합니다.
2. **명령 호출**: `codex-cli "분석 대상 설명"` 형태로 직접 호출합니다. 자주 쓰는 명령은 Claude 스니펫이나 사용자 단축어에 등록하세요.
3. **결과 공유**: Codex 출력은 Claude 대화에 자동 기록되지 않으니, 필요한 요약을 복사해 Claude에게 전달하고 후속 지시를 요청합니다.
4. **대용량 분할**: 대규모 폴더 분석은 파일 단위로 나눠 실행하고, 로그를 `/reports`나 노트에 저장해 팀과 공유합니다.
5. **오류 대응**: 인증 실패나 타임아웃 발생 시 `codex-cli auth status`로 먼저 상태를 확인하고, 즉시 Claude에게 상황을 보고해 대체 경로나 재시도 전략을 협의합니다.

---

## 📐 코딩 표준

### 상세 코딩 표준 (Import)

- **@docs/claude/standards/typescript-rules.md**
  - TypeScript strict mode 필수
  - any 금지, 명시적 타입 정의
  - Type-First 개발 원칙

- **@docs/claude/standards/commit-conventions.md**
  - 이모지 + 간결한 메시지
  - ✨ feat | 🐛 fix | ♻️ refactor

- **@docs/claude/standards/git-hooks-best-practices.md**
  - Pre-commit Hook (1초, 보안 중심)
  - Pre-push Hook (25초, 품질 검증)
  - Industry Best Practices 준수

- **@docs/claude/standards/file-organization.md**
  - 500줄 권장, 1500줄 최대
  - 폴더 구조 및 네이밍 규칙

### 핵심 규칙

1. **TypeScript**: any 금지, strict mode 필수
2. **파일 크기**: 500줄 권장, 1500줄 초과 시 분리
3. **테스트**: Vercel 중심 E2E 테스트 우선
4. **커밋**: 이모지 + 간결한 메시지 (✨ 🐛 ♻️)
5. **Side-Effect**: 모든 수정/삭제 시 영향 분석 필수

### 타입 정의 예시

```typescript
// ✅ 올바른 타입 정의
interface ServerData {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  metrics: ServerMetrics;
}

// ❌ any 사용 금지
function getData(id: any): any {  // 절대 금지
  // ...
}
```

---

## 🧪 테스트 전략

### 상세 테스트 전략 (Import)

- **@docs/claude/testing/vercel-first-strategy.md**
  - Vercel 중심 테스트 철학
  - 실제 운영 환경 우선 검증
  - 성능 최적화 (44% 테스트 시간 단축)

- **@docs/claude/testing/e2e-playwright.md**
  - Playwright E2E 테스트
  - 18개 테스트, 98.2% 통과율

### 테스트 우선순위

1. **🔴 High**: Vercel E2E 테스트 (실제 환경)
2. **🟡 Medium**: API Routes 성능 테스트
3. **🔵 Low**: 로컬 Unit 테스트 (필요시만)

### 실행 명령어

```bash
# Vercel 환경 테스트 (우선)
npm run test:vercel:full    # 종합 프로덕션 테스트
npm run test:vercel:e2e     # E2E 테스트 (18개)
npm run test:vercel         # 프로덕션 환경 검증

# 로컬 테스트 (보조)
npm run test:super-fast     # 11초 빠른 테스트
npm run test:fast           # 21초 최적화 테스트 (44% 개선)
npm run test                # Vitest 유닛 테스트
```

### 현재 테스트 현황 (2025-09-28)
- **유닛 테스트**: 64개, 100% 통과 (11.72초)
- **E2E 테스트**: 18개, 98.2% 통과 (Vercel 환경)
- **성능 테스트**: FCP 608ms, 응답시간 532ms

---

## 🚀 배포 가이드

### 상세 배포 가이드 (Import)

- **@docs/claude/deployment/vercel-optimization.md**
  - Vercel 무료 티어 최적화
  - StaticDataLoader 활용
  - Edge Functions 전략

- **@docs/claude/deployment/zero-cost-operations.md**
  - 100% 무료 운영 전략
  - 연간 $1,380-2,280 절약
  - 플랫폼별 최적화

### 배포 워크플로우

```bash
# 1. 로컬 검증 (선택적)
npm run validate:all        # 린트+타입+테스트

# 2. Git commit & push
git add .
git commit -m "✨ feat: 새 기능 추가"
git push

# 3. Vercel 자동 배포
# → Vercel이 자동으로 빌드 및 배포

# 4. 배포 후 검증
npm run test:vercel:e2e     # E2E 테스트
npm run lighthouse:vercel   # 성능 측정
```

### Vercel 배포 현황 (2025-09-28)
- **배포 상태**: ✅ 완전 성공 (Zero Warnings)
- **프로덕션 URL**: https://openmanager-vibe-v5.vercel.app
- **Node.js 버전**: ✅ 22.x 통합
- **성능**: FCP 608ms, 응답시간 532ms

---

## 📚 공통 워크플로우

### 상세 워크플로우 (Import)

- **@docs/claude/workflows/common-tasks.md**
  - 빠른 시작 명령어
  - 배포 워크플로우
  - 트러블슈팅 가이드

### 자주 사용하는 명령어

```bash
# 개발
npm run dev:stable          # 안정화된 개발 서버
npm run validate:all        # 전체 검증

# 테스트
npm run test:vercel:e2e     # Vercel E2E (권장)
npm run test:super-fast     # 빠른 유닛 테스트

# 배포
git push                    # Vercel 자동 배포

# 검증
npm run type-check          # TypeScript 검사
npm run lint                # ESLint 검사

# Claude Code v2.0 기능
/rewind                     # Checkpoints 복원
/usage                      # 사용량 확인
Esc Esc                     # 빠른 복원
```

### Hooks 설정 (자동화 권장)

Claude Code v2.0은 Hooks를 통한 자동화를 지원합니다.

**설정 방법** (`~/.claude/settings.json`):
```json
{
  "hooks": {
    "beforeToolCall": "npm run lint",
    "afterFileEdit": "npm run type-check"
  }
}
```

**권장 Hooks**:
- `beforeToolCall`: 도구 실행 전 린팅
- `afterFileEdit`: 파일 수정 후 타입 체크
- `beforeCommit`: 커밋 전 전체 검증

---

## 💡 개발 철학

### 1. 🎨 Type-First 개발
**타입 정의 → 구현 → 리팩토링** 순서로 개발

```typescript
// 1. 타입 정의 먼저
interface AIQueryRequest {
  query: string;
  mode: 'LOCAL' | 'GOOGLE_AI';
}

// 2. 타입에 맞춰 구현
async function queryAI(req: AIQueryRequest): Promise<AIQueryResponse> {
  // 타입 안전성 보장
}

// 3. 타입 기반 리팩토링
function extractMode(req: AIQueryRequest): string {
  return req.mode;  // IDE 자동완성 지원
}
```

### 2. 🔄 Side-Effect First 개발
**개발 및 수정 시 테스트, 문서, API 등 연관된 모든 사이드 이펙트를 함께 고려하여 동시 수정**

#### 사이드 이펙트 체크리스트
- [ ] 관련 테스트 업데이트 완료
- [ ] 관련 문서 업데이트 완료
- [ ] 의존성 있는 코드 동시 수정 완료
- [ ] Breaking Change 문서화 완료

### 3. 📝 커밋 컨벤션
- **✨ feat**: 새 기능
- **🐛 fix**: 버그 수정
- **♻️ refactor**: 리팩토링
- **📝 docs**: 문서 수정
- **🧪 test**: 테스트 추가/수정

### 4. ⚠️ 사이드 이펙트 관리
**모든 수정, 삭제, 개발 작업 시 반드시 고려할 핵심 원칙**

#### 사전 영향 분석
- 의존성 추적: 변경 대상이 다른 컴포넌트/서비스에 미치는 영향
- 호환성 검증: 기존 API, 설정, 환경과의 하위 호환성

#### 안전 검증 프로토콜
- Vercel 환경 테스트 우선
- 단계적 적용 (큰 변경은 나누어 검증)
- 롤백 계획 사전 준비

---

## 🎯 현재 상태

### 프로젝트 현황
- **코드베이스**: 226,356줄 (src), 873개 TypeScript 파일
- **프로젝트 구조**: 기능별 레이어드 아키텍처, JBGE 원칙 적용
- **개발 상태**: 프로덕션 운영 중

### 품질 지표 (2025-10-03 업데이트)
- **TypeScript 에러**: 0개 완전 해결 ✅ (strict 모드 100% 달성)
- **인증 시스템**: ✅ Zustand 기반 최적화 완료 (Phase 2)
- **인증 성능**: PIN 인증 8-15ms → 2-3ms (**5배 향상** ⚡)
- **코드 품질**: ~90 lines 제거, localStorage 직접 접근 제거
- **개발 서버 성능**: 시작 시간 35% 단축 (32초 → 22초)
- **테스트 성능**: 44% 단축 (37.95초 → 21.08초)
- **Vercel E2E 테스트**: 18개, 98.2% 통과율

### 최근 개선 성과 (2025-10-03)

#### Phase 1: 보안 시스템 최적화

**보안 시스템 최적화**:
- ✅ Test API 보안 간소화: 5-Layer → 2-Layer (67% 성능 향상 예상)
- ✅ User API 보안 강화: 0-Layer → 2-Layer (Rate limiting 10 req/min + IP whitelist)
- ✅ 보안 우선순위 정상화: 내부 API 단순화, 공개 API 강화

**코드 품질 개선**:
- ✅ AI 엔진 코드 삭제: 3,659줄 제거 (UnifiedAIEngineRouter 9개 파일)
- ✅ 타입 마이그레이션: RouterConfig, RouteResult → SimplifiedQueryEngine.types.ts
- ✅ 레퍼런스 정리: Import 및 코멘트 100% 클린업

**성능 영향**:
- Test API: 2ms → 0.65ms 예상 (67% 개선)
- User API: +8ms (무시 가능한 수준)
- 코드베이스: -3,600줄 순감 (1.6% 감소)

#### Phase 2: Vercel 배포 검증

**배포 현황**:
- ✅ Git push 성공: 31c360f9 → Vercel 자동 배포
- ✅ 빌드 성공: 58초 만에 READY 상태
- ✅ 프로덕션 URL: https://openmanager-vibe-v5.vercel.app

**검증 결과**:
- ✅ Test API: 403 BYPASS_NOT_ALLOWED (프로덕션 차단 정상 작동)
- ✅ User API Rate Limiting: 10 req → 401, 11-12 req → 429 (정상 작동)
- ✅ 응답 시간: 평균 80-90ms (로컬 571ms → Vercel 최적화)

**E2E 테스트**:
- ⚠️ 18개 테스트 중 일부 실패 (pre-existing bugs)
  - 원인: `process.env.NODE_ENV` in browser context (tests/e2e/helpers/admin.ts:36)
  - 영향: Phase 1 변경사항과 무관한 기존 버그
- ✅ Phase 1 변경사항: 직접 curl 테스트로 정상 작동 확인

#### Phase 3: 보안 강화 (CSRF + 메모리 누수)

**AI/ChatGPT 공격 시나리오 분석**:
- 🛡️ 전체 보안 점수: **7.75/10** → **8.5/10** (10% 향상)
- 🟢 Strong 방어: Brute Force (9/10), DoS (9/10), SQL Injection (10/10)
- 🟡 Moderate → Strong: CSRF (5/10 → 9/10), Rate Limit Bypass (6/10 → 7/10)
- 🔴 Critical 취약점: 2개 해결 완료

**Phase 3-1: CSRF 토큰 보호**:
- ✅ utils/security/csrf.ts 생성 (토큰 생성/검증)
- ✅ User API (/api/admin/verify-pin) CSRF 검증 추가
- ✅ 3-Layer 보안: CSRF → Rate limiting → IP whitelist
- 🎯 효과: CSRF Attack 방어 5/10 → 9/10 (**4점 향상**)

**Phase 3-2: 메모리 누수 방지**:
- ✅ setInterval로 1분마다 오래된 로그 정리
- ✅ Test API, User API 모두 적용
- 🎯 효과: 무한 메모리 증가 방지, DoS 방어 강화

**보안 개선 요약**:
```
공격 유형            | Phase 1 | Phase 3 | 개선 |
--------------------|---------|---------|------|
Brute Force         |   9/10  |   9/10  |  ✅  |
Rate Limit Bypass   |   6/10  |   7/10  | +1점 |
CSRF Attack         |   5/10  |   9/10  | +4점 |
DoS Attack          |   8/10  |   9/10  | +1점 |
SQL Injection       |  10/10  |  10/10  |  ✅  |
Session Hijacking   |   8/10  |   8/10  |  ✅  |
Env Extraction      |   9/10  |   9/10  |  ✅  |
Endpoint Discovery  |   8/10  |   8/10  |  ✅  |
--------------------|---------|---------|------|
평균 점수           |  7.75   |   8.5   | +10% |
```

#### Phase 4: Vercel 배포 및 프로덕션 검증

**배포 현황**:
- ✅ Git push: 31c360f9 → 7b05105a (Phase 3 변경사항)
- ✅ Pre-push Hook: 64개 테스트 통과 (3.98초)
- ✅ Vercel 빌드: dpl_B71eykrYXSMjjUbbq9sUBKzUbWmj (READY 상태)
- ✅ 프로덕션 URL: https://openmanager-vibe-v5-169vn32kl-skyasus-projects.vercel.app

**CSRF 보호 검증**:
- ✅ User API: 403 차단 (CSRF 토큰 없음) → 정상 작동
- ✅ 에러 메시지: "CSRF 토큰이 유효하지 않습니다."
- ✅ 응답 시간: 평균 0.77초 (네트워크 포함)
- ✅ 보안 레이어 순서: CSRF (Layer 0) → Rate limiting (Layer 1) → IP whitelist (Layer 2)

**Test API 자동화 유지 확인**:
- ✅ Test API에는 CSRF **미적용** (테스트 자동화 유지)
- ✅ 2-Layer 보안 유지: Production blocking + Rate limiting
- ✅ `ALLOW_TEST_API_IN_PROD=true`로 Vercel 테스트 가능
- ✅ E2E 테스트 자동화 영향 없음

**메모리 정리 로직**:
- ✅ setInterval 자동 실행 중 (1분마다)
- ✅ Test API, User API 모두 적용
- ✅ 오래된 requestLog 자동 삭제 (메모리 누수 방지)

**최종 성과**:
- 🛡️ CSRF 보호: 프로덕션 완벽 적용
- 🔒 Test API: 자동화 영향 없음 (CSRF 제외)
- 🧹 Memory leak: 자동 정리 작동 중
- ⚡ 성능: User API 응답 0.77초 (정상)

### Vercel 배포 현황
- **배포 상태**: ✅ 완전 성공 (Zero Warnings 달성)
- **프로덕션 URL**: https://openmanager-vibe-v5.vercel.app
- **Node.js 버전**: ✅ 22.x 통합
- **성능**: FCP 608ms, 응답시간 532ms, 99.95% 가동률

### 무료 티어 성과
- **월 운영비**: $0 (100% 무료)
- **절약 효과**: 연간 $1,380-2,280
- **Vercel**: 30GB/월 (30% 사용)
- **Supabase**: 15MB (3% 사용)
- **GCP**: Cloud Functions 200만 호출/월 (5% 사용)

---

## 🔧 트러블슈팅

### 프로덕션 배포 문제
```bash
# TypeScript 에러
npx tsc --noEmit

# 빌드 실패
npm run build                # 로컬 테스트
# → Vercel 로그 분석

# 런타임 오류
# → Vercel 로그 확인
# → 환경변수 검증
```

### 개발 환경 문제
```bash
# TypeScript strict 모드 오류
npm run type-check           # 타입 검사

# 테스트 실패
npm run test:vercel:e2e      # Vercel 환경 검증
npm run test:super-fast      # 빠른 로컬 검증
```

### 자주 발생하는 문제

#### 1. TypeScript strict 모드 오류
**해결**: any 사용 금지, 명시적 타입 정의

#### 2. Vercel 배포 실패
**해결**:
- 환경변수 검증
- Node.js 메모리 설정 확인
- 로컬 빌드 테스트

#### 3. E2E 테스트 타임아웃
**해결**:
- Vercel 환경 테스트로 전환
- 타임아웃 설정 증가 (필요시)

---

## 📚 추가 문서

### 설계도 관리
- **현재 운영 시스템**: [docs/design/current/](docs/design/current/)
- **미래 계획**: [docs/design/future/](docs/design/future/)
- **아카이브**: [docs/design/archive/](docs/design/archive/)

### 프로젝트 문서
- **전체 문서 인덱스**: [docs/README.md](docs/README.md)
- **빠른 시작 가이드**: [docs/QUICK-START.md](docs/QUICK-START.md)
- **시스템 아키텍처**: [docs/system-architecture.md](docs/system-architecture.md)
- **AI 시스템**: [docs/AI-SYSTEMS.md](docs/AI-SYSTEMS.md)
- **서브에이전트 공식 가이드**: [docs/claude/sub-agents-official.md](docs/claude/sub-agents-official.md)

---

## 🎓 AI 시스템 파일 구분

**프로젝트에는 서로 다른 AI 시스템을 위한 파일들이 있습니다:**

### 📄 CLAUDE.md (현재 파일) ⭐
- **역할**: Claude Code의 **Project Memory** (팀 공유용)
- **위치**: `./CLAUDE.md`
- **자동 로드**: Claude Code 실행 시 자동으로 메모리에 로드
- **계층**: Enterprise → Project (이 파일) → User
- **공식 문서**: [Claude Code Memory System](https://docs.claude.com/en/docs/claude-code/memory)

### 📄 AGENTS.md
- **역할**: Codex CLI 환경 요약 및 운영 가이드
- **내용**: 현재 설치 상태, 사용 절차, 유지보수 체크리스트
- **위치**: 루트 디렉터리 (`./AGENTS.md`)

### 📄 docs/claude/
- **역할**: Claude Code 상세 문서 (Import 파일들)
- **내용**: 아키텍처, 코딩 표준, 테스트, 배포 가이드

**⚠️ 중요**: 각 파일은 완전히 다른 AI 시스템을 위한 것입니다!

---

💡 **핵심 원칙**: Type-First + Side-Effect First + 이모지 커밋 + Vercel 중심 테스트

⚠️ **사이드 이펙트 우선**: 모든 수정, 삭제, 개발 시 영향 분석 및 검증 필수

📖 **상세 내용**: @docs/claude/ 폴더 Import 파일 참조 (공식 가이드 준수)

---

**Important Instructions**:
- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files to creating new ones
- NEVER proactively create documentation files (*.md) or README files
- Only create documentation files if explicitly requested by the User
