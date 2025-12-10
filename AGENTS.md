<!--
Codex configuration reference for OpenManager VIBE v5
Maintained for active Codex CLI usage in WSL2
-->

# 🤖 AGENTS.md - Codex CLI 전용 레퍼런스

<!-- Version: 1.0.0 | Author: Antigravity -->

> **이 문서는 Codex CLI 설정 및 사용 지침의 공식 레퍼런스입니다.**
> **Environment**: Windows 11 + WSL2 (Ubuntu)
> **프로젝트**: OpenManager VIBE v5.80.0
> **스택**: Next.js 16, React 19, TypeScript 5.9 strict, Node.js 22.21.1
> **다른 AI 도구**: `CLAUDE.md` (Claude Code/Multi-AI MCP), `GEMINI.md` (Gemini), `QWEN.md` (Qwen)
>
> ⚠️ **중요**: `scripts/ai-subagents/` 디렉토리는 **Claude Code의 Task tool 서브에이전트가 아닙니다**.
>
> - 이 디렉토리는 외부 AI CLI 도구(Codex, Gemini, Qwen)의 **Wrapper 스크립트 모음**입니다.
> - Claude Code 서브에이전트는 `.claude/agents/` 참조 또는 `Task` tool로 직접 호출합니다.

## 문서 목적

- **Codex CLI 전용**: GPT-5 Codex CLI의 설치 상태, 사용법, Wrapper 스크립트를 문서화합니다.
- **실제 상태만 기록**: 리포지터리에 존재하는 확인 가능한 정보만 유지합니다.
- **다른 AI는 별도 문서**: Gemini는 GEMINI.md, Qwen은 QWEN.md, Claude Code/Multi-AI MCP는 CLAUDE.md 참조

## 현재 환경 요약

| 항목               | 값                                  | 출처                          |
| ------------------ | ----------------------------------- | ----------------------------- |
| 프로젝트 버전      | 5.80.0                              | `package.json`                |
| Node.js            | 22.21.1                             | `.nvmrc`                      |
| npm                | 10.9.2                              | `package.json:packageManager` |
| Next.js            | 16                                  | `package.json`                |
| TypeScript         | 5.9                                 | `package.json`                |
| 주요 테스트 러너   | Vitest, Playwright                  | `package.json`                |
| 기본 작업 디렉터리 | `/mnt/d/cursor/openmanager-vibe-v5` | 현 세션                       |

> **2025-10-18 업데이트**  
> 자연어 질의용 `LOCAL`/`GOOGLE_AI` 모드 스위치는 폐기되었습니다.  
> `/api/ai/query`는 Supabase RAG + Google Cloud Functions + Gemini SDK를 묶은 단일 파이프라인을 항상 사용합니다.

### 기본 명령어 기억하기

```bash
nvm use          # Node 22.21.1 로드
npm install      # 필요 시 의존성 설치
npm run lint     # ESLint
npm run test     # Vitest (메인 설정)
```

## Codex CLI 사용 가이드

### 개요

- **Codex CLI v0.66.0 (GPT-5)** – ChatGPT Plus $20/월, `config/ai/registry-core.yaml`
- **응답 속도**: 6~12초 (자동 코드 리뷰 로그, `logs/code-reviews/*`)
- **자동 코드 리뷰**: `.husky/post-commit` → `scripts/code-review/auto-ai-review.sh` v6.4.0 (Primary 1:1:1 순환: codex→gemini→claude, Qwen 폴백, `logs/code-reviews/*`)
- **Wrapper**: `scripts/ai-subagents/codex-wrapper.sh` v3.3.0 (600초 타임아웃, stderr 분리, **Senior Full-Stack Developer 컨텍스트 적용**)
- **철학**: "사용자 지침 준수 & 재현 가능성" (Codex 자기 분석)
- **핵심 원칙**:
  - **Simplicity**: 코드는 읽기 쉽고 단순하게 유지 (KISS)
  - **UX Obsession**: 사용자 경험 최우선 (Premium Quality)
- **한도**: 30-150 메시지/5시간 (실사용 기준)

### 사용법

1. **실행 위치**: 프로젝트 루트(`/mnt/d/cursor/openmanager-vibe-v5`)에서 실행합니다.
2. **대표 명령어**
   ```bash
   codex exec "Next.js 15 App Router 성능 병목 요약해줘"
   codex exec "src/components/**/*.tsx 파일 타입 안전성 진단"
   ```
3. **`.codex/` 상태**: 리포지터리에 설정 파일이 포함되어 있지 않습니다. 최초 인증 시 아래 명령을 실행합니다.
   ```bash
   codex login --interactive  # 사용자별 설정은 ~/.codex/에 저장
   ```
   프로젝트별 설정을 공유하려면 `~/.codex/` 하위 파일을 확인한 뒤 필요한 항목만 수동으로 커밋하세요.

### 자동 코드 리뷰 파이프라인 (Primary 1:1:1 순환 + Qwen/Claude 폴백)

- **트리거**: `.husky/post-commit` → `scripts/code-review/auto-ai-review.sh` 백그라운드 실행
- **Primary 로직**: codex → gemini → claude 순환 선택 (`last_ai` 기반, `.ai-usage-state` 관리)
- **폴백**: Primary 실패 시 → Qwen 즉시 → Claude Code (code-review-specialist)
- **가용성**: 99.99% (Primary OR Qwen OR Claude Code)
- **출력**: `logs/code-reviews/review-{AI}-YYYY-MM-DD-HH-MM-SS.md`

### 📊 2025 벤치마크 성능 (GPT-5 Codex v0.66.0)

- **HumanEval**: 94% pass@1 (함수 단위 문제 해결 최강)
- **SWE-bench Verified**: 74.5% (다중 파일 버그 수정)
- **Code Refactoring**: 51.3% vs GPT-5 33.9%
- **토큰 효율**: 93.7% 절약
- **LiveCodeBench**: 70%+ (대화형 코드 편집)

## Codex CLI 역할 및 관련 도구

### Codex CLI (본 문서)

- **역할**: CLI 기반 코드 리뷰 & 검증, 자동 리뷰 시스템 1차 엔진
- **Independent Reviewer**: 함수 단위 논리 검증뿐만 아니라 전체 문맥을 고려한 독립적 리뷰 수행
- **Full-Stack Capability**: 비즈니스 로직, 엣지 케이스, 타입 안전성, 보안까지 포괄적 검토
- **Precision Specialist**: 모호함 없는 정확한 코드 수정 제안 (HumanEval 94% 성능 기반)
- **Practical Review**: 실무 관점에서 배포 가능한 수준인지 엄격하게 검증
- **Wrapper**: `scripts/ai-subagents/codex-wrapper.sh` **v3.3.0** (600초, 포터블, **Senior Full-Stack Developer 컨텍스트**)

### ✅ Pre-Implementation Checklist

구현 시작 전 다음을 확인하세요:

1. **Context**: Claude/Gemini가 제공한 설계 의도를 정확히 파악했는가?
2. **Simplicity**: 가장 단순하고 직관적인 구현 방식인가?
3. **Verification**: 구현 후 테스트 계획이 수립되었는가?

### 다른 AI 도구 (별도 문서)

| 도구                       | 현재 버전 | 참고 문서   |
| -------------------------- | --------- | ----------- |
| Claude Code / Multi-AI MCP | v2.0.61   | `CLAUDE.md` |
| Gemini CLI                 | v0.19.4   | `GEMINI.md` |
| Qwen CLI                   | v0.4.0    | `QWEN.md`   |

## 📜 Codex 핵심 코딩 규칙 (Codex Coding Standards)

Codex CLI는 다음 규칙을 준수하여 코드를 생성해야 합니다.

### 1. 가독성 (Readability)

- **명확한 네이밍**: `userCount` vs `u` 처럼 의도가 드러나는 이름 사용.
- **함수 분리**: 하나의 함수는 "한 가지 일"만 수행. 복잡한 로직은 하위 함수로 분할.
- **스타일 준수**: 프로젝트의 들여쓰기, 줄바꿈 등 컨벤션 일관성 유지.

### 2. 간결함 & 단순함 (Simplicity & Clarity)

- **KISS 원칙**: 과도한 기교보다 단순하고 명료한 구현 우선.
- **매직 넘버 제거**: 하드코딩된 숫자/문자열은 의미 있는 상수로 대체.

### 3. 유지보수성 & 확장성 (Maintainability & Scalability)

- **미래 고려**: 단순 스크립트와 확장 가능한 코드의 접근 방식 구분.
- **구조화**: 모듈화, 관심사 분리(SoC), 응집도/결합도 고려 (SOLID 원칙).

### 4. 일관성 (Consistency)

- **컨벤션 엄수**: 팀/프로젝트 단위의 네이밍, 주석, 커밋 메시지 규칙 따르기.
- **협업 효율**: 일관된 스타일로 리뷰 속도 향상 및 실수 방지.

### 5. 테스트 & AI 상호 검증 (Testing & AI Verification)

- **테스트 필수**: 핵심 로직 및 라이브러리는 단위 테스트(Unit Test) 확보.
- **상호 검증**: 작성된 코드는 반드시 **다른 AI(Claude, Gemini)**의 리뷰를 거쳐 잠재적 문제 해결.

### 6. 문서화 (Documentation)

- **Why 주석**: 코드가 "무엇"을 하는지보다 "왜" 그렇게 했는지 설명.
- **자체 설명**: 이상적인 코드는 주석 없이도 이해 가능하도록 작성.

## Codex Wrapper 스크립트 (v3.2.0)

**위치**: `scripts/ai-subagents/codex-wrapper.sh`
**버전**: v3.2.0 (2025-12-02, temp_stdout unbound variable 버그 수정)
**목적**: Codex CLI 호출 시 600초 타임아웃과 안전한 로깅/컨텍스트 주입 제공

### 주요 기능

1. **고정 타임아웃 600초** – 복잡한 분석도 한 번에 처리 (`timeout 600s`)
2. **PROJECT_ROOT 자동 계산** – 어떤 작업 디렉터리에서도 실행 가능 (PATH에 npm global bin 추가)
3. **Senior Full-Stack Developer 컨텍스트 자동 주입** – 포괄적이고 전문적인 리뷰 관점 유지
4. **stderr 분리 + 토큰/시간 로깅** – `logs/ai-perf/codex-perf-YYYY-MM-DD.log`에 기록, 공백 응답/타임아웃 안내 포함
5. **`.env.local` 자동 로드** – 프로젝트 루트에 존재하면 환경 변수 주입

### 사용 예시

```bash
# 직접 실행 (디버깅/테스트 전용)
./scripts/ai-subagents/codex-wrapper.sh "버그 분석"

# 일반 사용 시: Claude Code가 자동 제어
"버그를 AI 교차검증해줘"  # Claude가 wrapper 호출
```

### 타임아웃 발생 시 안내

- 질문을 더 작은 단위로 분할
- 질문을 더 간결하게 수정
- 핵심 부분만 먼저 질문

### 로그 위치

- `logs/ai-perf/codex-perf-YYYY-MM-DD.log` (토큰, 실행 시간 기록)

### 다른 AI Wrapper 스크립트

- Gemini/Qwen 래퍼는 동일한 포터블 구조(v3.2.0)이며 세부 설정은 각 전용 문서(`GEMINI.md`, `QWEN.md`)를 참고하세요.

## 추천 워크플로우

- **Lint/Typecheck 선행**: `npm run lint:strict` → `npm run test:quick`
- **Playwright E2E** (선택): `npm run test:e2e`
- **Codex CLI 활용**: 린트/테스트가 잡지 못한 구조적 이슈나 대규모 변경 전에 보조 분석으로 사용
- **결과 공유**: Codex 분석 결과는 PR 코멘트 또는 `/reports` 디렉터리에 저장

## Codex CLI와 다른 도구 연계

1. **CLAUDE ↔ Codex**
   - Claude Task에서 복잡한 문제 감지 시 "WSL Codex 분석" 요청
   - Codex 결과를 Claude 대화에 붙여 후속 작업
2. **Codex ↔ Gemini ↔ Claude**
   - 자동 코드 리뷰: Primary 1:1:1 순환 (codex→gemini→claude) + Qwen/Claude 폴백, `logs/code-reviews/*` 확인
3. **Gemini/Qwen과 병행**
   - `scripts/ai-subagents` 문서를 참고하여 필요 시 수동 호출
   - 자동 호출 스크립트가 필요하면 `archive/`에서 복원 후 업데이트 기록 남기기

## 유지보수 체크리스트

- 프로젝트 버전 또는 Node 버전이 바뀌면 위 표를 즉시 수정합니다.
- 새 AI 스크립트나 자동화가 추가되면 실제 경로와 실행 방법을 검증 후 문서에 추가합니다.
- 사용하지 않는 절차나 수치는 과감히 삭제하고, 문서 하단에 업데이트 로그를 남깁니다.

## 업데이트 로그

- **2025-11-27**: Codex wrapper v3.0.0 및 자동 코드 리뷰 스크립트 v4.3.0(4:1 비율, lint/typecheck, Claude 폴백) 반영. Gemini/Qwen 래퍼 안내를 전용 문서 참조로 단순화.
- **2025-11-20**: Codex CLI v0.58.0, Wrapper v2.5.0(600초) 및 자동 코드 리뷰 파이프라인 정보 반영. Node 22.21.1/Next ^15.5.5 테이블 갱신.
- **2025-10-10**: Codex Wrapper v2.0.0 반영 (타임아웃 300초, 재시도 제거), Qwen v2.1.0 참조 추가.
- **2025-10-08**: Codex CLI 버전 정보 0.45.0으로 갱신하고 Gemini CLI 0.8.1 업그레이드 반영.
- **2025-10-05**: Codex CLI 전용 문서로 재정의, Wrapper 스크립트 v1.0.0 상세 정보 추가, 다른 AI 도구는 별도 문서로 분리.
- **2025-10-04**: 리포지터리 실상에 맞춰 문서 전체 재작성, 가상 서브에이전트 및 오래된 통계 제거.
