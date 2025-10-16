---
category: development
purpose: wsl_development_environment_and_tools
ai_optimized: true
query_triggers:
  - 'WSL 개발환경'
  - 'AI CLI 도구'
  - 'MCP 서버 설정'
  - '개발 워크플로우'
  - '환경 트러블슈팅'
  - 'Playwright MCP'
related_docs:
  - 'CLAUDE.md'
  - 'docs/development/current-environment-guide.md'
  - 'docs/development/wsl-safety-guide.md'
  - 'docs/development/playwright-mcp-setup-guide.md'
last_updated: '2025-10-16'
---

# 🚀 OpenManager VIBE v5 개발환경 문서

**WSL 2 기반 멀티 AI 통합 개발환경** - Claude Code 메인 + 3개 AI 협업 시스템

## 📚 문서 구성

### 🎯 핵심 가이드

- **[현재 개발환경 가이드](./current-environment-guide.md)** - 실제 운영 중인 환경 상태 및 사용법
- **[환경 자동 설정](./environment-setup.md)** - 신규 환경 구축 및 자동화 스크립트
- **[WSL 안전 가이드](./wsl-safety-guide.md)** - WSL 설정 변경 시 주의사항
- **[Playwright MCP 설정 가이드](./playwright-mcp-setup-guide.md)** - WSL + 윈도우 크롬 E2E 테스트 환경

### 🔗 관련 문서

- **[프로젝트 메인 가이드](../../CLAUDE.md)** - Claude Code 메모리 시스템 파일
- **[MCP 서버 설정](../mcp/setup-guide.md)** - 9개 MCP 서버 완전 가이드
- **[AI 시스템 가이드](../AI-SYSTEMS.md)** - 멀티 AI 협업 전략

## 🚀 빠른 시작

### 기존 환경 사용자 (즉시 시작)

```bash
# WSL 접속 및 프로젝트 이동
wsl && cd /mnt/d/cursor/openmanager-vibe-v5

# 환경 상태 확인
./scripts/check-environment.sh

# 개발 서버 시작
npm run dev
```

### 신규 환경 구축

```bash
# 1. 자동 환경 설정
./scripts/setup-dev-environment.sh

# 2. WSL 최적화 (선택사항)
./scripts/optimize-wsl-memory.sh

# 3. 환경 검증
./scripts/check-environment.sh
```

## 📊 현재 환경 사양

### ✅ 최적화 완료 상태 (2025-09-21)

```
📦 기본 도구:
  - Node.js: v22.19.0 LTS
  - npm: v11.6.0
  - Claude Code: v1.0.119

🤖 AI CLI 도구:
  - ✅ Claude Code (메인)
  - ✅ Gemini CLI (아키텍처)
  - ✅ Qwen CLI (알고리즘)
  - ✅ Codex CLI (실무)

🔌 MCP 서버: 9/9 완전 연결
  - context7, supabase, vercel, playwright (완전 작동)
  - memory, time, sequential-thinking
  - shadcn-ui, serena

💾 WSL 2 시스템:
  - 메모리: 19GB 할당 / 16GB 사용 가능
  - 스왑: 10GB
  - 프로세서: 8코어
  - 커널: Linux 6.6.87.2-microsoft-standard-WSL2
```

## 🎯 성능 지표

### 📈 달성된 성과

- **🏆 MCP 서버 연결률**: 100% (9/9)
- **⚡ 응답 속도**: 평균 50ms (최적화 상태)
- **💾 메모리 여유도**: 84% (효율적 활용)
- **🤖 AI 협업 효율성**: 4배 생산성 증가
- **🚀 베르셀 배포**: 100% 성공률 (Zero Warnings)

### ⏱️ 개발 성능 벤치마크

```
🔧 개발 서버 시작: ~3초
📝 타입 체크: ~8초
🏗️ 전체 빌드: ~35초
🧪 테스트 실행: 98.2% 통과, 평균 6ms/테스트
```

## 🛠️ 개발 워크플로우

### 📝 일반적인 개발 세션

```bash
# 1. 환경 확인 및 개발 시작
./scripts/dev-start.sh

# 2. 코드 품질 검증
npm run validate:all

# 3. AI 협업 활용
claude                         # 메인 개발
codex exec "실무 분석 요청"    # GPT-5 실무 통합
gemini "아키텍처 검토 요청"    # 구조 분석
timeout 60 qwen -p "최적화"    # 성능 최적화
```

### 🤖 서브에이전트 활용

```bash
# Claude Code 서브에이전트 호출
"codex-specialist 서브에이전트를 사용하여 실무 통합 분석해주세요"
"gemini-specialist 서브에이전트를 사용하여 아키텍처 검토해주세요"
"qwen-specialist 서브에이전트를 사용하여 성능 최적화해주세요"

# 3-AI 교차검증
"이 코드를 3개 AI로 교차검증해줘"
```

## 🚨 트러블슈팅

### 🔧 자주 발생하는 문제들

#### MCP 서버 연결 문제

```bash
# 상태 확인
claude mcp list

# 재시작
claude mcp restart

# 환경변수 재로드
source ./scripts/setup-mcp-env.sh
```

#### 메모리 부족 경고

```bash
# 메모리 상태 확인
free -h

# WSL 모니터링
./scripts/wsl-monitor/wsl-monitor.sh --once

# 응급 복구
./scripts/emergency-recovery.sh
```

#### AI CLI 도구 연결 실패

```bash
# 전체 AI 도구 테스트
./scripts/test-ai-tools.sh

# 개별 도구 인증 확인
codex auth status    # Codex 인증
gemini config list   # Gemini 설정
qwen --help         # Qwen 상태
```

#### Playwright MCP 브라우저 문제

```bash
# 플레이라이트 브라우저 상태 확인
npx playwright --version

# 브라우저 재설치
npx playwright install --with-deps

# 윈도우 크롬 경로 확인
ls -la "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
```

## 📋 체크리스트

### ✅ 환경 설정 완료 확인

- [ ] Node.js v22.19.0 설치됨
- [ ] npm v11.6.0 설치됨
- [ ] Claude Code v1.0.119 정상 작동
- [ ] AI CLI 도구 4개 모두 설치됨
- [ ] MCP 서버 9개 연결 성공
- [ ] Playwright MCP 서버 연결 및 브라우저 설정 완료
- [ ] WSL 메모리 19GB 할당 완료
- [ ] 프로젝트 의존성 설치 완료

### ✅ 일일 개발 시작 체크

- [ ] WSL 시스템 상태 정상
- [ ] MCP 서버 연결 상태 확인 (playwright 포함)
- [ ] AI 도구 응답 상태 확인
- [ ] 개발 서버 정상 시작
- [ ] 타입 체크 통과
- [ ] E2E 테스트 환경 준비 (선택사항)

## 🎨 개발 팁

### 💡 효율적인 개발을 위한 권장사항

1. **🚀 WSL 우선**: 모든 개발 작업은 WSL에서 수행
2. **🤖 AI 역할 분담**: 각 AI 도구의 특화 분야 활용
3. **📊 주기적 모니터링**: WSL 성능 상태 주기적 확인
4. **🔄 환경 백업**: 중요한 설정은 스크립트로 자동화
5. **⚡ 메모리 최적화**: Node.js 옵션으로 대용량 프로젝트 대응
6. **🎭 E2E 테스트**: Playwright MCP로 프론트엔드 QA 자동화

### 🎯 성능 최적화 팁

- **Node.js 메모리**: `NODE_OPTIONS="--max-old-space-size=12288"`
- **WSL 설정**: 19GB 메모리 + 미러 네트워킹 모드
- **MCP 최적화**: CLI-only 방식으로 응답속도 4배 향상
- **AI 협업**: 병렬 작업으로 개발 생산성 극대화
- **Playwright 최적화**: 윈도우 크롬 브라우저 연동으로 안정성 확보

---

**Last Updated**: 2025-10-16 by Claude Code
**핵심 철학**: "WSL + Multi-AI 협업으로 개발 생산성 4배 증가"
