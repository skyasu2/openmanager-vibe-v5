# AI CLI 도구 설정 (개인 환경)

**개인 개발 도구**: Claude Code + 3-AI 협업 시스템 (WSL 환경)

## 🛠️ 설치된 AI CLI 도구

| 도구 | 버전 | 요금제 | 역할 | 최근 업데이트 |
|------|------|--------|------|--------------|
| **Claude Code** | **v2.0.37** | Max ($200/월) | 메인 개발 환경 | **2025-11-19** |
| **OpenAI CLI (Codex)** | **v0.58.0** | Plus ($20/월) | 직접 CLI 실행 | **2025-11-19** |
| **Google Gemini CLI** | **v0.15.4** | 무료 (60 RPM/1K RPD) | 직접 CLI 실행 | **2025-11-19** |
| **Qwen Code** | **v0.2.1** | 무료 (60 RPM/2K RPD) | 설정 최적화 강화 | **2025-11-19** |
| **Kiro CLI** | **v1.20.0** | Beta (AWS Kiro) | 멀티 에이전트 터미널 오케스트레이션 | **2025-11-20** |

## 🚀 Claude Code v2.0.37 신규 기능 (공식 문서 검증)

```bash
# 버전 확인
claude --version  # v2.0.37

# 새로운 슬래시 명령어 ✅
/rewind              # 코드/대화 복원 메뉴 열기
/usage               # 플랜 사용량 및 rate limit 확인

# 키보드 단축키 ✅
Esc Esc              # Rewind 메뉴 열기 (빠른 복원)
Tab                  # Extended thinking 토글 (on-demand 활성화)
/think              # think (4K), think hard (10K), ultrathink (32K) 토큰 버짓
Ctrl-R               # 명령어 히스토리 역방향 검색
Shift-Tab            # 권한 모드 전환

```

**주요 개선점 (v2.0.31+ ⇒ v2.0.37)**:
- Extended Thinking 탭 토글 + ultrathink 키워드 (docs/status.md)
- @-mention MCP 서버 필터링 (토큰 10-18% 절약)
- Prompt Caching 자동 활성화 (장기 세션 안정성)

### Checkpoints (체크포인트) ✅
**공식 문서**: https://docs.claude.com/en/docs/claude-code/checkpointing

**자동 저장 시스템**:
- 매 프롬프트마다 자동으로 체크포인트 생성
- 30일간 보관 (cleanupPeriodDays 설정 가능)
- 세션 간 지속 (대화 재개 시 유지)

**3가지 복원 모드**:
1. **대화만 복원**: 코드는 유지하고 대화 히스토리만 되돌림
2. **코드만 복원**: 대화는 유지하고 파일 변경만 취소
3. **둘 다 복원**: 완전히 이전 상태로 복원

**사용 예시**:
```bash
# 실험적 리팩토링 시도
claude "이 함수를 완전히 재작성해줘"

# 마음에 안 들면 즉시 복원
Esc Esc  # 또는 /rewind
```

**제한사항**:
- Bash 명령어로 수정된 파일은 추적 안 됨 (rm, mv, cp 등)
- Git 버전 관리를 대체하지 않음 (세션 레벨 복구용)

### Sonnet 4.5 기본 모델 ✅
**세계 최고 수준 코딩 모델** (2025-09-29 릴리스)

- **Extended thinking**: Tab 키로 on-demand 활성화
- **Memory tool** (Beta): 컨텍스트 외부 정보 저장
- **향상된 코드 추론 능력**: 복잡한 멀티스텝 작업 지원

### Hooks 자동화 ✅
**공식 문서**: https://docs.claude.com/en/docs/claude-code/hooks

**올바른 Hooks 설정** (`~/.claude/settings.json`):
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm run type-check",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

**지원되는 Hook 타입**:
- `PreToolUse` - 도구 실행 전
- `PostToolUse` - 도구 실행 후
- `UserPromptSubmit` - 프롬프트 제출 시
- `SessionStart` - 세션 시작 시
- `SessionEnd` - 세션 종료 시

## 🔧 WSL 통합 실행

```bash
# WSL 접속 및 프로젝트 이동
wsl
cd /mnt/d/cursor/openmanager-vibe-v5

# AI 도구들 직접 CLI 실행 (2025-11-19 업데이트)
claude --version                         # Claude Code v2.0.37 버전 확인
codex exec "작업 요청"                   # Codex CLI v0.58.0 직접 실행 (6~12초)
gemini "작업 요청" --model gemini-2.5-pro # Gemini CLI v0.15.4 직접 실행 (25~31초 폴백)
timeout 90 qwen --approval-mode yolo -p "작업 요청" # Qwen CLI v0.2.1 YOLO Mode (자동 승인)
kiro-cli --version                       # Kiro CLI v1.20.0 설치 확인 (AWS Kiro Beta)
```

## 💡 Codex CLI v0.58.0 (OpenAI CLI)

**GPT-5 기반 실무 전문가** - ChatGPT Plus $20/월 (Codex→Gemini 자동 코드 리뷰 1차 엔진, docs/status.md)

### 설치 및 인증
```bash
# 설치 (npm 전역)
npm install -g @openai/codex

# 인증 (.env.local 환경변수 사용)
source .env.local
export OPENAI_API_KEY=$OPENAI_API_KEY
```

### 사용법
```bash
# 기본 실행
codex exec "복잡한 알고리즘 최적화 분석"

# 코드 리뷰
codex exec "이 코드의 보안 취약점 분석"

# 타임아웃 설정 (wrapper v2.5.0, 600초, PROJECT_ROOT 자동)
./scripts/ai-subagents/codex-wrapper.sh

# 컨텍스트: 1인 개발자 관점 prefix 자동 주입 (scripts/ai-subagents/codex-wrapper.sh)
# 성능: 평균 응답 6~12초 (logs/code-reviews/*)
# 특징: 실무 중심, 빠른 구현 우선 + Gemini 폴백 연동
```

### Codex 철학 및 벤치마크 (2025-11-19 업데이트)

**핵심 철학** (GPT-5 Codex 자기 분석):
> "사용자 지침을 정확히 따르고 결과를 재현 가능하게 남기는 것이 최우선"

**2025 벤치마크 성능**:
- ✅ **HumanEval**: 94% pass@1 (함수 단위 문제 해결 최강)
- ✅ **SWE-bench Verified**: 74.5% (다중 파일 버그 수정)
- ✅ **Code Refactoring**: 51.3% vs GPT-5 33.9%
- ✅ **토큰 효율**: 93.7% 절약 (GPT-5 대비)
- ✅ **LiveCodeBench**: 70%+ (대화형 코드 편집 안정성)

**강점 및 특징**:
- 재현 가능한 테스트 + 명확한 구조 + 예방적 개선
- 라인 단위 보고, CLI 통합 최적화
- 정확성 ⭐⭐⭐⭐⭐ / 실무 대응 ⭐⭐⭐⭐⭐ / 설계합치 ⭐⭐⭐⭐
- 실무 개발자 관점 (책임감 있는 코드 중시)

## 🧠 Gemini CLI v0.15.4 (Google CLI)

**아키텍처 전문가** - Google OAuth 무료 (Codex rate limit 시 폴백 2차 엔진, docs/status.md)

### 설치 및 인증
```bash
# 설치 (npm 전역)
npm install -g @google/gemini-cli

# 인증 (브라우저 OAuth)
gemini login
# → Google 계정으로 로그인

# 인증 확인
gemini whoami
```

### 사용법
```bash
# 기본 실행
gemini "아키텍처 검토" --model gemini-2.5-pro

# 설계 분석
gemini "SOLID 원칙 준수 여부 확인" --model gemini-2.5-pro

# Wrapper 스크립트 (v2.5.0, 기본 모델 gemini-2.5-pro, 600초)
./scripts/ai-subagents/gemini-wrapper.sh

# 성능: Codex rate limit 폴백 시 25~31초 (docs/status.md)
# 특징: 설계 원칙 중시, 장기 유지보수 우선
```

### Gemini 철학 및 벤치마크 (2025-11-19 업데이트)

**핵심 철학** (Gemini 2.5 Flash 자기 분석):
> "구조적 무결성을 갖춘 효율성 - Senior Code Architect 역할"

**2025 벤치마크 성능**:
- ✅ **SWE-bench Verified**: 54% (48.9% → 54% 5% 개선)
- ✅ **테스트 커버리지**: 98.2% (54/55 통과) - 프로젝트 실적
- ✅ **문제 발견율**: 95%+ (3-AI 교차검증 시스템)
- ✅ **Aider Polyglot**: 향상된 코딩 벤치마크
- ✅ **SOLID 원칙**: 대규모 리팩토링 전문

**강점 및 특징**:
- SOLID 원칙, TypeScript 타입 안전성, any 타입 제거 전문
- TDD 워크플로우: Red-Green-Refactor 사이클 직접 실행
- 정확성 ⭐⭐⭐⭐ / 아키텍처 ⭐⭐⭐⭐⭐ / 설계합치 ⭐⭐⭐⭐⭐
- Senior Code Architect 관점 (구조적 품질 책임)

## ⚙️ Qwen CLI v0.2.1

**성능 최적화 전문가** - Qwen OAuth 무료 (YOLO Mode 완전 무인, scripts/ai-subagents/qwen-wrapper.sh)

### 설치 및 인증
```bash
# 설치 (npm 전역)
npm install -g @qwen-code/qwen-code

# 인증 (브라우저 OAuth)
qwen login
# → Qwen 계정으로 로그인
```

### 사용법
```bash
# YOLO Mode (권장) - 자동 승인, 완전 무인
timeout 90 qwen --approval-mode yolo -p "기능 구현 계획"
timeout 90 qwen --approval-mode yolo -p "리팩토링 전략"

# Plan Mode (선택) - 세부 계획 수립
qwen -p "성능 병목점 분석"

# Wrapper 스크립트 (v2.5.0, YOLO 기본, 600초)
./scripts/ai-subagents/qwen-wrapper.sh

# 성능: YOLO Mode 타임아웃 600초 (실제 응답 수초, logs/ai-perf/qwen-perf-*.log)
# 특징: 성능 최적화 중시, 자원 효율 우선, 완전 무인 워크플로우
```

### Qwen 철학 및 벤치마크 (2025-11-19 업데이트)

**핵심 철학** (Qwen 2.5 Coder):
> "1ms라도 빨라야 함 - 성능과 실용성 우선"

**2025 벤치마크 성능**:
- ✅ **HumanEval**: 88.4% (7B), 92.7% (32B) - 오픈소스 최강
- ✅ **MBPP**: 84.5% - Python 코드 생성 특화
- ✅ **Math**: 57.2% (32B) - 수학적 최적화
- ✅ **오픈소스 SOTA**: 동급 크기 중 최고 성능
- ✅ **YOLO Mode**: qwen --approval-mode yolo (완전 무인, scripts/ai-subagents/qwen-wrapper.sh)

**강점 및 특징**:
- 알고리즘 최적화, 성능 병목점 분석 전문
- 구체적 수치 제시, 즉시 적용 가능한 개선안
- 정확성 ⭐⭐⭐ / 성능 ⭐⭐⭐⭐⭐ / 설계합치 ⭐⭐
- 성능 엔지니어 관점 (실행 속도 및 메모리 효율 최우선)

### YOLO Mode 특징 (v0.2.1)
- **모든 도구 자동 승인**: `qwen --approval-mode yolo -p "<prompt>"`
- **타임아웃 600초**: `scripts/ai-subagents/qwen-wrapper.sh`에서 timeout 600초 & 로그 기록
- **로그 추적**: `logs/ai-perf/qwen-perf-YYYY-MM-DD.log`에 응답 시간/모드 저장
- **Plan Mode 병행 가능**: 필요 시 `qwen -p`로 수동 계획 출력

## 🧑‍⚕️ Kiro CLI v1.20.0 (AWS Kiro Beta)

**터미널 기반 멀티 에이전트 오케스트레이터** – AWS Kiro가 제공하는 Beta CLI (WSL 경로: `/home/sky-note/.local/bin/kiro-cli`)

### 설치 및 버전 확인
```bash
which kiro-cli        # /home/sky-note/.local/bin/kiro-cli
kiro-cli --version    # kiro-cli 1.20.0
kiro-cli --help       # chat / agent / doctor / settings / quit 안내
```

> `kiro-cli`는 공급사 설치 스크립트를 통해 제공됩니다 (pip/npm 불필요). 업데이트는 AWS Kiro 배포 채널을 통해 진행하세요.

### 사용법
```bash
# 기본 대화 (현재 디렉터리 세션 기준)
kiro-cli chat --agent "central-supervisor" --no-interactive

# 멀티 에이전트 관리
kiro-cli agent list
kiro-cli agent create --help
kiro-cli agent set-default "codex-specialist"

# 시스템 진단 및 복구
kiro-cli doctor --all
kiro-cli doctor --strict --verbose

# 설정 확인/수정
kiro-cli settings list
kiro-cli settings theme dark
kiro-cli settings --delete prompt_cache

# 종료
kiro-cli quit
```

### 특징 및 베스트 프랙티스
- **Resume**: `kiro-cli chat --resume`으로 디렉터리별 세션 재개
- **모델 지정**: `--model sonnet-4` 등으로 실험 가능 (agent 기본값 우선)
- **툴 신뢰 옵션**: `--trust-all-tools` 또는 `--trust-tools=fs_read,fs_write`
- **Doctor 모드**: 인증/네트워크 오류, 권한 문제 자동 진단
- **Settings 포맷**: `kiro-cli settings list --format json-pretty`로 결과 파싱 용이

### Known Issues (Beta)
- Agent 마이그레이션(`kiro-cli agent migrate`)은 기존 글로벌 디렉터리를 덮어쓸 수 있으므로 **사전 백업 필수**
- `kiro-cli chat --trust-all-tools` 사용 시 위험 명령도 자동 실행될 수 있으니 실서버에서는 금지
- `.kiro/` 디렉터리를 Git에 커밋하지 않도록 `.vercelignore`/`.gitignore`에 포함 (이미 `.vercelignore` 146행에 `.kiro/` 등록됨)

---

## 🔄 WSL 환경변수 네이티브 사용

**cross-env 대신 WSL 네이티브 방식** (2025-09-28 최적화)

```bash
# ❌ 기존 방식 (cross-env)
cross-env NODE_ENV=development npm run dev

# ✅ WSL 네이티브 방식
export NODE_ENV=development
export DEBUG=true
export NEXT_TELEMETRY_DISABLED=1
npm run dev

# ~/.bashrc에 영구 설정
echo 'export NODE_OPTIONS="--max-old-space-size=12288"' >> ~/.bashrc
source ~/.bashrc
```

## 🚀 병렬 개발 패턴 (2025-09-28 최적화)

```bash
# Terminal 1: 백그라운드 개발 서버
npm run dev:stable &

# Terminal 2: Claude Code 메인 작업
claude

# Terminal 3: 보조 AI CLI 도구
codex exec "코드 리뷰"
gemini "아키텍처 검토"
```

## 🎯 효율성 지표

**투자 대비 효과**:
- **Multi-AI 비용**: $20/월 (Codex만 유료, Gemini+Qwen 무료)
- **메인 개발 환경**: Claude Max $200/월 (별도 구독)
- **총 개발 도구 비용**: $220/월
- **실제 작업 가치**: $2,200+ (API 환산 시)
- **비용 효율성**: 10배 이상 절약 효과
- **개발 생산성**: 4배 증가 (멀티 AI 협업)

## 🔗 관련 문서

- [Multi-AI 전략](multi-ai-strategy.md)
- [서브에이전트 가이드](../../../../docs/ai-tools/subagents-complete-guide.md)
- [AI 교차검증 시스템](../../../../docs/claude/architecture/ai-cross-verification.md)
