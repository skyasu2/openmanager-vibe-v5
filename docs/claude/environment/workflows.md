# 개인 워크플로우 패턴

**1인 AI 개발 워크플로우**: WSL + Multi-AI 협업 중심

## 🚀 일일 개발 루틴

### 1. 환경 시작
```bash
# Windows에서 WSL Claude 시작
.\claude-wsl-optimized.bat

# WSL 내부 확인
wsl
cd /mnt/d/cursor/openmanager-vibe-v5

# AI 도구 상태 확인
claude --version  # v2.0.1
which codex gemini qwen

# MCP 서버 상태 확인
claude mcp list

# WSL 성능 확인 (필요 시)
./scripts/wsl-monitor/wsl-monitor.sh --once
```

### 2. 개발 서버 시작
```bash
# 안정화된 개발 서버 (권장)
npm run dev:stable

# 또는 병렬 개발 패턴
npm run dev:stable &  # 백그라운드 실행
```

### 3. Claude Code 실행
```bash
# 메인 개발 환경
claude

# 사용량 확인 (Max 플랜)
/usage

# thinking 모드 토글
Tab
```

## 🎯 병렬 개발 패턴 (2025-09-28 최적화)

**성능 향상 달성**:
- 개발 서버 시작: 32초 → 22초 (35% 단축)
- 테스트 실행: 37.95초 → 21.08초 (44% 단축)
- E2E 성공률: 98.2% (Vercel 실제 환경)

### 터미널 구성
```bash
# Terminal 1: 백그라운드 개발 서버
npm run dev:stable &

# Terminal 2: Claude Code 메인 작업
claude

# Terminal 3: 보조 AI CLI 도구
codex exec "코드 리뷰"        # Codex 병렬 실행
gemini "아키텍처 검토"        # Gemini 병렬 실행
timeout 60 qwen -p "성능 분석" # Qwen Plan Mode
```

### 빠른 검증 (필요 시)
```bash
# 11초 빠른 테스트
npm run test:super-fast

# Vercel 환경 E2E 테스트
npm run test:vercel:e2e

# 종합 검증
npm run validate:all
```

## 🤝 AI 교차검증 워크플로우

### ✅ 유일한 올바른 방법: Bash CLI 병렬 실행

```bash
# Claude가 자연어 요청으로 bash를 통해 실제 외부 AI CLI 병렬 호출
"이 코드를 3개 AI로 교차검증해줘"

# → Claude가 bash로 실제 외부 AI CLI 병렬 실행:
#   - codex exec "코드 검증" > /tmp/codex.txt &
#   - gemini "아키텍처 분석" > /tmp/gemini.txt &
#   - qwen -p "성능 분석" > /tmp/qwen.txt &
#   - wait
# → 실제 Codex, Gemini, Qwen AI의 독립적 답변 수집
# → Claude가 /tmp 파일을 읽고 종합 판단

# 성과: 40% 속도 개선 (25초→15초), 31% 메모리 절약, 100% 정확성
```

### 특정 관점 강조

```bash
# 성능 크리티컬 구간
"성능 크리티컬 구간이니 Qwen 의견 중시해서 교차검증해줘"
# → Qwen 성능 항목 가중치 +10점

# 설계 중요 구간
"설계 원칙 준수가 중요하니 Gemini 의견 중시해서 검증해줘"
# → Gemini 설계합치 항목 가중치 +10점
```

### 히스토리 활용

```bash
# 지난번 검증과 비교
"지난번 검증과 비교하여 개선사항 확인"
# → Claude가 bash로 3개 AI 병렬 실행
# → 과거 결과와 비교 분석 후 종합 판단
```

### ⚠️ 잘못된 방법: Task Tool 서브에이전트 (사용 금지)

```bash
# ❌ 잘못된 방법 - Claude 역할극 (실제 외부 AI 호출 안 됨)
Task codex-specialist "코드 검증"
Task gemini-specialist "아키텍처 분석"
Task qwen-specialist "성능 분석"

# 문제점:
# - 실제 Codex, Gemini, Qwen AI가 아닌 Claude의 역할극
# - 진정한 교차검증 불가능
# - Claude의 단일 관점만 제공
```

## 🧪 테스트 전략

### Vercel 중심 접근 (1인 AI 개발 최적화)

**핵심 철학**: "로컬보다 실제 Vercel 환경에서 직접 테스트가 더 효과적"

```bash
# 🔴 High Priority: Vercel E2E 테스트
npm run test:vercel:full    # 종합 프로덕션 테스트
npm run test:vercel:e2e     # E2E 테스트 (실제 환경)
npm run test:vercel         # 프로덕션 테스트

# 🤖 기본 워크플로우
npm run test:ai             # 1인 AI 개발 기본 (Vercel 환경)
npm run test:super-fast     # 가장 빠른 테스트 (11초)
npm run test:fast           # 최적화된 멀티스레드 (21초, 44% 성능 향상)
npm run test:dev            # 병렬 개발 테스트 (quick + vercel)

# 🔵 Low Priority: 로컬 테스트 (필요 시만)
npm run test                # Vitest
npm run test:e2e            # 로컬 Playwright
```

### 1인 AI 개발 맞춤 전략
```bash
# 🧠 AI 교차검증 (Unit 테스트 대체)
"codex: 이 로직 문제있나 검증해줘"
"gemini: 구조적 개선점 있나 확인"
"qwen: 성능 병목점 분석해줘"
```

## 🔄 Git 워크플로우

### 커밋 패턴
```bash
# 이모지 + 간결한 메시지
git add .
git commit -m "✨ feat: AI 교차검증 시스템 추가"
git commit -m "🐛 fix: 타임아웃 오류 해결"
git commit -m "♻️ refactor: AI 라우터 구조 개선"

# Git 인증 (Personal Access Token)
source .env.local
git push
```

### PR 생성 (필요 시)
```bash
# gh CLI 사용
gh pr create --title "feat: 새 기능" --body "설명"
```

## 🛠️ 트러블슈팅 워크플로우

### MCP 문제 해결
```bash
# 1. MCP 서버 상태 확인
claude mcp list

# 2. Serena 프로젝트 활성화
mcp__serena__activate_project "/mnt/d/cursor/openmanager-vibe-v5"

# 3. 종합 건강 체크
./scripts/mcp-health-check.sh

# 4. 문제 서버 재연결
claude mcp remove serena
claude mcp add serena uv run --directory ~/.local/share/uv/tools/serena-mcp serena-mcp
```

### WSL 성능 문제
```bash
# WSL 종합 진단
./scripts/wsl-monitor/wsl-monitor.sh --once

# 메모리 활용도
free -h

# 응급 복구
./scripts/emergency-recovery.sh
```

### AI CLI 도구 문제
```bash
# 버전 확인
claude --version
codex --version
gemini --version
qwen --version

# 환경변수 확인
source .env.local
echo $OPENAI_API_KEY
echo $GOOGLE_AI_API_KEY

# Wrapper 스크립트 확인
ls -la scripts/ai-subagents/
```

## 📊 사용량 모니터링

### Claude Code 사용량
```bash
# Claude Code 내장 사용량 확인
/usage  # Max 플랜 한도 추적
```

### AI 교차검증 성능
```bash
# Performance log 확인
tail -f logs/ai-perf/ai-perf-$(date +%F).log

# 히스토리 확인
ls -lh reports/quality/ai-verifications/
```

## 🚀 배포 워크플로우

### 베르셀 배포
```bash
# 1. 로컬 검증 (선택적)
npm run validate:all

# 2. Git commit & push
git add .
git commit -m "✨ feat: 새 기능"
source .env.local && git push

# 3. Vercel 자동 배포 (Git push 후 자동)
# → 약 5분 소요

# 4. E2E 테스트 실행 (배포 완료 후)
npm run test:vercel:e2e

# 5. 프로덕션 확인
curl -I https://openmanager-vibe-v5.vercel.app
```

### 베르셀 CLI (보조)
```bash
# 토큰 기반 인증
source .env.local

# 배포 상태 확인
vercel ls --token $VERCEL_TOKEN

# 로그 확인
vercel logs --token $VERCEL_TOKEN

# 환경변수 관리
vercel env ls --token $VERCEL_TOKEN
```

## 💡 효율성 팁

### 병렬 작업
- Terminal 1: 개발 서버 백그라운드
- Terminal 2: Claude Code 메인 작업
- Terminal 3: 서브 AI 병렬 실행

### 토큰 절약
- MCP 도구 우선 사용 (27% 토큰 절약)
- Opus는 Plan Mode만 사용
- 서브 AI로 부하 분산

### 시간 절약
- Vercel 환경 우선 테스트
- AI 교차검증으로 Unit 테스트 대체
- 멀티스레드 테스트 (44% 성능 향상)

## 🔗 관련 문서

- [공통 작업 워크플로우](../../../../docs/claude/workflows/common-tasks.md) (팀 공유)
- [Multi-AI 전략](multi-ai-strategy.md) (개인)
- [AI CLI 도구 설정](ai-tools-setup.md) (개인)
- [MCP 개인 설정](mcp-configuration.md) (개인)
