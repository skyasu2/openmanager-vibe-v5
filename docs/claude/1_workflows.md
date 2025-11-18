# 워크플로우 & Multi-AI 전략 통합 가이드

**1인 AI 개발 워크플로우**: WSL + Codex 리뷰 중심

---

## 🚀 일일 개발 루틴

### 1. 환경 시작

```bash
# Windows에서 WSL Claude 시작
.\claude-wsl-optimized.bat

# WSL 내부 확인
wsl
cd /mnt/d/cursor/openmanager-vibe-v5

# AI 도구 상태 확인
claude --version
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

# Extended Thinking 토글
Tab
```

## 🎯 병렬 개발 패턴

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

# Terminal 3: Codex 코드 리뷰
codex exec "코드 리뷰"
```

### 빠른 검증

```bash
# 11초 빠른 테스트
npm run test:super-fast

# Vercel 환경 E2E 테스트
npm run test:vercel:e2e

# 종합 검증
npm run validate:all
```

---

## 🤖 AI 도구 활용

### 🏆 메인 개발 라인: Claude Code (Max $200/월)

**WSL 환경 중심의 핵심 개발 도구**

#### 주요 특징

- MCP 서버 9개 통합 (85% 토큰 절약)
- **Max 한계**: 5시간당 200-800 프롬프트
- **효율적 사용**: Opus는 Plan Mode 전용, 기본은 Sonnet 4.5

#### 사용 전략

```bash
# 일상적 개발 (Sonnet 4.5)
claude  # 기본 모델로 충분

# 복잡한 설계 (Opus)
claude --model opus  # Plan Mode 전용
```

### 💰 Codex CLI (ChatGPT Plus $20/월)

**GPT-5 기반 코드 리뷰 전문가** - 버그 분석, 실무 개선 제안

```bash
codex exec "코드 리뷰 및 개선점 분석"
./scripts/ai-subagents/codex-wrapper.sh
```

## 🤝 코드 리뷰 워크플로우

### 🎯 역할 분담

**Claude Code = 메인 개발자**:
- ✅ 모든 코딩, 구현, 문서 작성
- ✅ 최종 결정 및 통합

**Codex = 코드 리뷰어**:
- ✅ 구현 검증, 버그 분석
- ✅ 개선 제안, 의견 제시
- ❌ **실제 코드 수정은 하지 않음**

### 개발 워크플로우

**단순화된 2단계 프로세스**:
1. **Claude Code**: 모든 개발 및 구현
2. **Codex**: 변경 사항 리뷰 및 개선 제안

### 📝 코드 리뷰 방법

#### Codex로 코드 리뷰 받기

```bash
# Codex 직접 실행
codex exec "코드 리뷰 및 개선점 분석"

# 또는 Wrapper 스크립트
./scripts/ai-subagents/codex-wrapper.sh "변경 사항 검토"
```

---

## 🧪 테스트 전략

### Vercel 중심 접근

**핵심 철학**: "로컬보다 실제 Vercel 환경에서 직접 테스트가 더 효과적"

```bash
# Vercel E2E 테스트 (우선)
npm run test:vercel:full
npm run test:vercel:e2e

# 빠른 테스트
npm run test:super-fast     # 11초
npm run test:fast           # 21초, 44% 향상
```

### 1인 AI 개발 맞춤 전략

```bash
# Codex 코드 리뷰 (Unit 테스트 보완)
codex exec "이 로직 검증 및 개선점 확인"
```

---

## 🔄 Git 워크플로우

### 커밋 패턴

```bash
# 이모지 + 간결한 메시지
git add .
git commit -m "✨ feat: 새 기능"

# Git 인증 (Personal Access Token)
source .env.local
git push
```

---

## 🛠️ 트러블슈팅 워크플로우

### MCP 문제 해결

```bash
# 상태 확인 및 종합 체크
claude mcp list
./scripts/mcp-health-check.sh
```

### WSL 성능 문제

```bash
./scripts/wsl-monitor/wsl-monitor.sh --once
./scripts/emergency-recovery.sh
```

### AI CLI 도구 문제

```bash
# 버전 및 환경변수 확인
claude --version; codex --version
source .env.local && echo $OPENAI_API_KEY
```

---

## 📊 사용량 모니터링

### Claude Code 사용량

```bash
# Claude Code 내장 사용량 확인
/usage  # Max 플랜 한도 추적

# ccusage - 일일/주간 토큰 사용량 상세 분석
npx ccusage@latest

# ccstatusline - Status Line 커스터마이징
npx ccstatusline@latest
```

---

## 🚀 배포 워크플로우

### Vercel 배포

```bash
# Git commit & push (Vercel 자동 배포)
git add .
git commit -m "✨ feat: 새 기능"
source .env.local && git push

# 배포 후 E2E 테스트
npm run test:vercel:e2e
```

---

## 💡 효율성 팁

- 병렬 작업: 개발 서버(백그라운드) + Claude Code(메인) + Codex(리뷰)
- 토큰 절약: MCP 우선(82%) + @-mention(3%) + Opus는 Plan Mode만
- 시간 절약: Vercel 환경 우선 + 멀티스레드 테스트(44% 향상)

---

## 📈 효율성 지표

### 현재 투자 대비 효과

| 항목                  | 값                 | 설명                           |
| --------------------- | ------------------ | ------------------------------ |
| **Codex CLI**         | $20/월             | ChatGPT Plus 구독              |
| **메인 개발 환경**    | Claude Max $200/월 | 별도 구독                      |
| **총 개발 도구 비용** | $220/월            | Codex + Claude Max             |
| **실제 작업 가치**    | $2,200+            | API 환산 시 10배 이상          |
| **비용 효율성**       | 10배               | 절약 효과                      |
| **개발 생산성**       | 3배                | Claude + Codex 협업 효과       |

### 토큰 효율성

- MCP 통합: 82% 절약 | @-mention: 3% 추가 | Claude: 평균 45토큰(85% 절약)

### 개발 품질

- Codex 체계적 검증 | 커밋 전 사전 검토 | MCP 99.9% 안정성

---

## 🔗 관련 문서

- **[CLAUDE.md](../../CLAUDE.md)** - 핵심 프로젝트 메모리
- **[AI Registry](../../config/ai/registry-core.yaml)** - AI 도구 버전, 스펙, 설정
- **[서브에이전트 가이드](../../docs/ai/subagents-complete-guide.md)** - 12개 전문 에이전트
- **[MCP Priority Guide](mcp/mcp-priority-guide.md)** - MCP 활용 전략
- **[AI 유지보수](../../docs/ai/ai-maintenance.md)** - AI CLI 도구 관리
