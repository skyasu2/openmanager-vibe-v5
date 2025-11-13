<!--
Codex configuration reference for OpenManager VIBE v5
Maintained for active Codex CLI usage in WSL2
-->

# 🤖 AGENTS.md - Codex CLI 전용 레퍼런스

> **이 문서는 Codex CLI 설정 및 사용 지침의 공식 레퍼런스입니다.**
> **OpenManager VIBE v5 Codex CLI 연동 안내**
> **Language Policy**: 한국어 우선, 기술용어 영어 허용
> **Last Updated**: 2025-10-08
> **Environment**: Windows 11 + WSL2 (Ubuntu)
> **다른 AI 도구**: `CLAUDE.md` (Claude Code/Multi-AI MCP), `GEMINI.md` (Gemini), `QWEN.md` (Qwen)
>
> ⚠️ **중요**: `scripts/ai-subagents/` 디렉토리는 **Claude Code의 Task tool 서브에이전트가 아닙니다**.
> - 이 디렉토리는 외부 AI CLI 도구(Codex, Gemini, Qwen)의 **Wrapper 스크립트 모음**입니다.
> - Claude Code 서브에이전트는 `.claude/agents/` 참조 또는 `Task` tool로 직접 호출합니다.

## 문서 목적
- **Codex CLI 전용**: GPT-5 Codex CLI의 설치 상태, 사용법, Wrapper 스크립트를 문서화합니다.
- **실제 상태만 기록**: 리포지터리에 존재하는 확인 가능한 정보만 유지합니다.
- **다른 AI는 별도 문서**: Gemini는 GEMINI.md, Qwen은 QWEN.md, Claude Code/Multi-AI MCP는 CLAUDE.md 참조

## 현재 환경 요약
| 항목 | 값 | 출처 |
| --- | --- | --- |
| 프로젝트 버전 | 5.79.1 | `package.json` |
| Node.js | 22.15.1 | `.nvmrc` |
| npm | 10.9.2 | `package.json:packageManager` |
| Next.js | ^15.4.5 | `package.json` |
| TypeScript | ^5.7.2 | `package.json` |
| 주요 테스트 러너 | Vitest, Playwright | `package.json` |
| 기본 작업 디렉터리 | `/mnt/d/cursor/openmanager-vibe-v5` | 현 세션 |

> **2025-10-18 업데이트**  
> 자연어 질의용 `LOCAL`/`GOOGLE_AI` 모드 스위치는 폐기되었습니다.  
> `/api/ai/query`는 Supabase RAG + Google Cloud Functions + Gemini SDK를 묶은 단일 파이프라인을 항상 사용합니다.

### 기본 명령어 기억하기
```bash
nvm use          # Node 22.15.1 로드
npm install      # 필요 시 의존성 설치
npm run lint     # ESLint
npm run test     # Vitest (메인 설정)
```

## Codex CLI 사용 가이드

### 개요
- **철학**: "사용자 지침을 정확히 따르고 결과를 재현 가능하게 남기는 것이 최우선"
- **비용**: ChatGPT Plus $20/월 (Codex 단독 비용)
- **인증**: API Key (ChatGPT Plus 계정)
- **응답 속도**: 2초 (2025-10-10 실측)
- **한도**: 30-150 메시지/5시간 (실사용량 기준)
- **참고**: 메인 개발 환경 Claude Max ($200/월)는 별도 구독

### 📊 2025 벤치마크 성능 (GPT-5 Codex v0.45.0)
- **HumanEval**: 94% pass@1 (함수 단위 문제 해결 최강)
- **SWE-bench Verified**: 74.5% (다중 파일 버그 수정)
- **Code Refactoring**: 51.3% vs GPT-5 33.9%
- **토큰 효율**: 93.7% 절약
- **LiveCodeBench**: 70%+ (대화형 코드 편집)

### 사용법
1. **실행 위치**: WSL2 터미널에서 프로젝트 루트 진입 후 사용합니다.
2. **대표 명령어**
   ```bash
   codex exec "Next.js 15 App Router 성능 병목 요약해줘"
   codex exec "src/components/**/*.tsx 파일 타입 안전성 진단"
   ```
3. **`.codex/` 상태**: 현재 리포지터리에 설정 파일이 포함되어 있지 않습니다. 최초 인증이 필요하면 아래 명령으로 로그인합니다.
   ```bash
   codex login --interactive  # 사용자별 설정은 ~/.codex/에 저장
   ```
   프로젝트별 설정을 공유하려면 `~/.codex/` 하위 파일을 확인한 뒤 필요한 항목만 수동으로 커밋하세요.

## Codex CLI 역할 및 관련 도구

### Codex CLI (본 문서)
- **역할**: CLI 기반 실무 코드 분석·자동화 보조 (GPT-5 기반)
- **벤치마크**: HumanEval 94%, SWE-bench 74.5%, 토큰 93.7% 절약
- **Wrapper**: `scripts/ai-subagents/codex-wrapper.sh` v2.0.0

### 다른 AI 도구 (별도 문서)
| 도구 | 참고 문서 |
| --- | --- |
| Claude Code / Multi-AI MCP | `CLAUDE.md` |
| Gemini CLI | `GEMINI.md` |
| Qwen CLI | `QWEN.md` |

## Codex Wrapper 스크립트 (v2.0.0)

**위치**: `scripts/ai-subagents/codex-wrapper.sh`
**버전**: v2.0.0 (2025-10-10)
**목적**: Codex CLI 호출 시 안정적 타임아웃 및 사용자 가이드 제공

### 주요 기능

#### 1. 고정 타임아웃 (300초)
- **모든 쿼리**: 300초 (5분) 고정 타임아웃
- 복잡도 감지 제거 (재시도보다 분할 권장)
- 자원 낭비 방지 (재시도 = 실패 시간 + 재시도 시간)

#### 2. 타임아웃 시 사용자 가이드
타임아웃 발생 시 자동 안내:
- 질문을 더 작은 단위로 분할
- 질문을 더 간결하게 수정
- 핵심 부분만 먼저 질문

#### 3. 성능 로깅
- `logs/ai-perf/codex-perf-YYYY-MM-DD.log`에 자동 기록
- 응답 시간, 토큰 수 추적

### 사용 예시
```bash
# 직접 실행 (디버깅/테스트 전용)
./scripts/ai-subagents/codex-wrapper.sh "버그 분석"

# 일반 사용 시: Claude Code가 자동 제어
"버그를 AI 교차검증해줘"  # Claude가 wrapper 호출
```

### v2.0.0 개선 사항
- **재시도 제거**: 자원 낭비 방지 (40% 실패 → 0% 재시도)
- **타임아웃 통일**: 300초로 고정 (단순화)
- **사용자 가이드**: 타임아웃 시 해결 방법 안내
- **코드 간소화**: 220줄 → 170줄 (23% 감소)

### 다른 AI Wrapper 스크립트
- **Gemini**: `scripts/ai-subagents/gemini-wrapper.sh` v2.0.0 (300초) → `GEMINI.md` 참조
- **Qwen**: `scripts/ai-subagents/qwen-wrapper.sh` v2.1.0 (Normal Mode 기본) → `QWEN.md` 참조

## 추천 워크플로우
- **Lint/Typecheck 선행**: `npm run lint:strict` → `npm run test:quick`
- **Playwright E2E** (선택): `npm run test:e2e`
- **Codex CLI 활용**: 린트/테스트가 잡지 못한 구조적 이슈나 대규모 변경 전에 보조 분석으로 사용
- **결과 공유**: Codex 분석 결과는 PR 코멘트 또는 `/reports` 디렉터리에 저장

## Codex CLI와 다른 도구 연계
1. **CLAUDE ↔ Codex**
   - Claude Task에서 복잡한 문제 감지 시 "WSL Codex 분석" 요청
   - Codex 결과를 Claude 대화에 붙여 후속 작업
2. **Gemini/Qwen과 병행**
   - `scripts/ai-subagents` 문서를 참고하여 필요 시 수동 호출
   - 자동 호출 스크립트가 필요하면 `archive/`에서 복원 후 업데이트 기록 남기기

## 유지보수 체크리스트
- 프로젝트 버전 또는 Node 버전이 바뀌면 위 표를 즉시 수정합니다.
- 새 AI 스크립트나 자동화가 추가되면 실제 경로와 실행 방법을 검증 후 문서에 추가합니다.
- 사용하지 않는 절차나 수치는 과감히 삭제하고, 문서 하단에 업데이트 로그를 남깁니다.

## 업데이트 로그
- **2025-10-10**: Codex Wrapper v2.0.0 반영 (타임아웃 300초, 재시도 제거), Qwen v2.1.0 참조 추가.
- **2025-10-08**: Codex CLI 버전 정보 0.45.0으로 갱신하고 Gemini CLI 0.8.1 업그레이드 반영.
- **2025-10-05**: Codex CLI 전용 문서로 재정의, Wrapper 스크립트 v1.0.0 상세 정보 추가, 다른 AI 도구는 별도 문서로 분리.
- **2025-10-04**: 리포지터리 실상에 맞춰 문서 전체 재작성, 가상 서브에이전트 및 오래된 통계 제거.
