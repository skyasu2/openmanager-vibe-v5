<!--
Codex configuration reference for OpenManager VIBE v5
Maintained for active Codex CLI usage in WSL2
-->

# 🤖 AGENTS.md - Codex CLI Reference

> **이 문서는 Codex CLI 설정 및 사용 지침의 공식 레퍼런스입니다.**  
> **OpenManager VIBE v5 Codex CLI 연동 안내**  
> **Language Policy**: 한국어 우선, 기술용어 영어 허용  
> **Last Updated**: 2025-10-04  
> **Environment**: Windows 11 + WSL2 (Ubuntu)  
> **Primary Docs**: `CLAUDE.md`, `GEMINI.md`, `QWEN.md`

## 문서 목적
- Codex CLI를 포함한 보조 AI 도구들의 실제 상태와 사용법을 한곳에서 요약합니다.
- 현재 리포지터리에 존재하지 않는 서브에이전트나 자동화 스크립트를 문서에서 제거하고, 확인 가능한 정보만 유지합니다.
- 새로운 자동화나 에이전트가 추가될 때 갱신 기준을 제공합니다.

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

### 기본 명령어 기억하기
```bash
nvm use          # Node 22.15.1 로드
npm install      # 필요 시 의존성 설치
npm run lint     # ESLint
npm run test     # Vitest (메인 설정)
```

## Codex CLI 사용 가이드

### 📊 2025 벤치마크 성능 (GPT-5 Codex v0.42.0)
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
3. **`.codex/` 상태**: 현재 리포지터리에 설정 파일이 포함되어 있지 않습니다. 필요하면 아래 명령으로 초기화합니다.
   ```bash
   codex-cli init --project openmanager-vibe-v5 --korean --wsl
   ```
   초기화 후 생성된 설정 파일은 Git에 추적되지 않으므로, 공유가 필요하면 수동으로 커밋하세요.

## AI 도구 및 역할 범위
| 도구 | 역할 | 참고 문서 |
| --- | --- | --- |
| Claude Code | 메인 IDE 및 Task 실행 | `CLAUDE.md` |
| Codex CLI | CLI 기반 코드 분석·자동화 보조 | 본 문서 |
| Gemini 도구 모음 | 대용량 분석, 문서 초안 | `GEMINI.md` |
| Qwen 도구 모음 | 프로토타입, 알고리즘 실험 | `QWEN.md` |

### 현재 상태에 대한 메모
- `scripts/ai/README.md`에 따라 과거 AI 교차 검증 스크립트는 `archive/`로 이동되었습니다. 활성화하려면 필요한 파일을 수동 복원해야 합니다.
- `scripts/ai-subagents/`에는 전략 문서(`*.md`)만 남아 있으며 실행 가능한 `*-wrapper.sh` 스크립트는 존재하지 않습니다.
- 저장소 내에서 "서브에이전트"라는 용어는 문서적으로만 사용되고 있으며, 현재 자동 등록된 서브에이전트 목록은 없습니다.

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
- **2025-10-04**: 리포지터리 실상에 맞춰 문서 전체 재작성, 가상 서브에이전트 및 오래된 통계 제거.
