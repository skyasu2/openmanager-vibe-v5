# 🚀 OpenManager VIBE v5 현재 개발환경 가이드

**마지막 업데이트**: 2025-09-21
**환경 상태**: ✅ 완전 최적화 완료 (19GB WSL + 9개 MCP 서버)

> **핵심**: WSL 2 기반 멀티 AI 통합 개발환경 - Claude Code 메인 + 3개 AI 협업 시스템

## 🎯 환경 개요

### 📊 현재 시스템 사양 (실제 측정값)
```bash
시스템: WSL 2 (Ubuntu on Windows)
커널: Linux 6.6.87.2-microsoft-standard-WSL2
메모리: 19GB 할당 / 16GB 사용 가능 (84% 여유도)
스왑: 10GB
프로세서: 8코어 완전 활용
네트워킹: 미러 모드 (MCP 서버 호환성)
```

### 🛠️ 핵심 도구 버전
```bash
Node.js: v22.19.0 LTS
npm: v11.6.0
Claude Code: v1.0.119
AI CLI 도구: gemini, qwen, codex (모두 정상 작동)
MCP 서버: 9/9 완전 연결 성공
```

## 🚀 빠른 환경 확인

### 1단계: 기본 도구 확인
```bash
# WSL 접속
wsl
cd /mnt/d/cursor/openmanager-vibe-v5

# 핵심 도구 버전 확인
node --version    # v22.19.0
npm --version     # 11.6.0
claude --version  # 1.0.119 (Claude Code)

# AI CLI 도구 확인
which gemini qwen codex
```

### 2단계: MCP 서버 상태 확인
```bash
# 9개 MCP 서버 연결 상태 확인
claude mcp list

# 예상 결과: 모든 서버 ✓ Connected
# - supabase, vercel, context7, serena, memory
# - sequential-thinking, shadcn-ui, time, playwright
```

### 3단계: 메모리 상태 확인
```bash
# WSL 메모리 상태 확인
free -h

# 예상 결과:
#                total        used        free
# Mem:            19Gi       3.3Gi        16Gi
# Swap:           10Gi          0B        10Gi
```

## 🎨 개발 워크플로우

### 📝 일반적인 개발 세션
```bash
# 1. 개발 서버 시작
npm run dev

# 2. 타입 검사 + 린트 + 테스트
npm run validate:all

# 3. AI 도구 활용
claude                    # 메인 개발 환경
codex exec "작업 요청"    # GPT-5 실무 통합
gemini "작업 요청"        # 아키텍처 분석
timeout 60 qwen -p "요청" # 알고리즘 최적화
```

### 🤖 AI 협업 시스템 활용
```bash
# Claude Code 서브에이전트 호출
"codex-specialist 서브에이전트를 사용하여 실무 분석해주세요"
"gemini-specialist 서브에이전트를 사용하여 아키텍처 검토해주세요"
"qwen-specialist 서브에이전트를 사용하여 성능 최적화해주세요"

# 3-AI 교차검증
"이 코드를 3개 AI로 교차검증해줘"
```

## 📊 성능 모니터링

### WSL 시스템 모니터링
```bash
# 종합 상태 체크 (개발 전용)
./scripts/wsl-monitor/wsl-monitor.sh --once

# MCP 서버 전용 분석
./scripts/wsl-monitor/wsl-monitor.sh --check-mcp

# 프로세스 집중 분석
./scripts/wsl-monitor/wsl-monitor.sh --check-processes

# 응급 복구 (메모리 부족 시)
./scripts/emergency-recovery.sh
```

### 실시간 대시보드
```bash
# 백그라운드 모니터링 시작
./scripts/wsl-monitor/wsl-monitor.sh --daemon

# CPU/메모리 실시간 추적
htop

# MCP 프로세스 모니터링
ps aux | grep -E "(claude|mcp|node.*server)"
```

## 🔧 개발 도구 설정

### Node.js 메모리 최적화
```bash
# ~/.bashrc에 추가 (19GB 환경 최적화)
export NODE_OPTIONS="--max-old-space-size=12288"
source ~/.bashrc
```

### AI CLI 환경 설정
```bash
# 모든 AI 도구 PATH 확인
echo $PATH | grep -o '[^:]*nvm[^:]*'

# AI 도구 실행 테스트
claude --help
gemini --version
qwen --help
codex --version
```

## 🚨 트러블슈팅

### MCP 서버 연결 문제
```bash
# MCP 서버 재시작
claude mcp restart

# 개별 서버 재연결
claude mcp remove serena
claude mcp add serena /home/sky-note/.local/bin/serena-mcp-server

# 환경변수 로드
source ./scripts/setup-mcp-env.sh
```

### 메모리 부족 경고
```bash
# 메모리 사용량 확인
free -h

# Node.js 프로세스 메모리 확인
ps aux --sort=-%mem | head -10

# 필요시 응급 복구
./scripts/emergency-recovery.sh
```

### AI CLI 도구 오류
```bash
# 도구별 연결 테스트
claude --version     # Claude Code 상태
codex auth status    # Codex 인증 상태
gemini config list   # Gemini 설정 확인
qwen --help         # Qwen 기본 동작 확인
```

## 📈 성능 지표

### 현재 달성된 성과
- **MCP 서버 연결률**: 100% (9/9)
- **응답 속도**: 평균 50ms (최적화 상태)
- **메모리 여유도**: 84% (19GB 중 16GB 사용 가능)
- **AI 협업 효율성**: 4배 생산성 증가 ($220/월로 $2,200+ 가치)
- **베르셀 배포 성공률**: 100% (Zero Warnings 달성)

### 성능 벤치마크
```bash
# 개발 서버 시작 시간: ~3초
npm run dev

# 타입 체크 시간: ~8초
npx tsc --noEmit

# 전체 빌드 시간: ~35초
npm run build

# 테스트 실행 시간: 98.2% 통과, 평균 6ms/테스트
npm test
```

## 🔗 관련 문서

- **[WSL 안전 가이드](./wsl-safety-guide.md)**: WSL 설정 변경 시 주의사항
- **[CLAUDE.md](../../CLAUDE.md)**: 프로젝트 전체 가이드 (메모리 시스템)
- **[MCP 설정 가이드](../mcp/setup-guide.md)**: 9개 MCP 서버 상세 설정
- **[AI 시스템 가이드](../AI-SYSTEMS.md)**: 멀티 AI 협업 전략

---

💡 **팁**: 이 환경은 90% 완성된 프로젝트에 최적화되어 있습니다. 새 프로젝트 시작 시에는 메모리 설정을 조정하세요.

🐧 **WSL 우선**: 모든 AI 개발 작업은 WSL에서 수행하여 최고 성능을 보장합니다.