# 🛠️ OpenManager VIBE v5 개발 가이드

> **개발자 전용 문서** - 프로젝트 기여 및 개발 환경 구성 가이드

## 📋 목차

- [🏗️ 개발 환경 설정](#개발-환경-설정)
- [🤖 AI 도구 통합](#ai-도구-통합)
- [🔌 MCP 서버 설정](#mcp-서버-설정)
- [🎯 서브에이전트 시스템](#서브에이전트-시스템)
- [🧪 테스트 실행](#테스트-실행)
- [📚 개발 워크플로우](#개발-워크플로우)

## 🏗️ 개발 환경 설정

### Prerequisites

- **Windows 11 + WSL 2** (권장 개발 환경)
- Node.js v22 이상 (WSL 내부 설치)
- npm 10.x 이상
- Git
- **Claude Code v1.0.119** (메인 AI 개발 도구)

### WSL 2 최적화 설정

```bash
# WSL 메모리 최적화 (.wslconfig 설정)
cat > /mnt/c/Users/$USER/.wslconfig << 'EOF'
[wsl2]
memory=19GB
processors=8
swap=10GB
networkingMode=mirrored
dnsTunneling=true
autoProxy=true
EOF

# WSL 재시작
wsl --shutdown
```

### 환경 변수 설정

```bash
# .env.local 생성 및 설정
cp config/templates/env.local.template .env.local

# 필수 환경 변수 설정
SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 선택적 환경 변수
GOOGLE_AI_API_KEY=your_google_ai_api_key  # Google AI API 사용 시
GITHUB_CLIENT_ID=your_github_oauth_id
GITHUB_CLIENT_SECRET=your_github_oauth_secret
```

## 🤖 AI 도구 통합

### 메인 AI: Claude Code (WSL 환경)

```bash
# Claude Code 설치 및 설정
npm install -g @anthropic-ai/claude-code
claude --version  # v1.0.119 확인

# 프로젝트 활성화
claude init
```

**역할**: 메인 개발, 아키텍처 설계, 프로젝트 전체 컨텍스트 관리

### 서브 AI: 병렬 개발 지원

#### Codex CLI (ChatGPT Plus)

```bash
npm install -g @openai/codex-cli
codex auth login
codex exec "복잡한 알고리즘 구현"
```

#### Gemini CLI

```bash
npm install -g @google/gemini-cli
gemini auth login
gemini "아키텍처 설계 검토"
```

#### Qwen CLI

```bash
npm install -g qwen-code
qwen auth login
qwen -p "성능 최적화 분석"
```

### AI 도구별 전문 분야

| 도구            | 요금제            | 역할        | 전문 분야                        |
| --------------- | ----------------- | ----------- | -------------------------------- |
| **Claude Code** | Max ($200/월)     | 메인 개발   | 전체 아키텍처, 코드 리뷰, 문서화 |
| **Codex CLI**   | Plus ($20/월)     | 병렬 개발   | 복잡한 로직, 테스트 코드         |
| **Gemini CLI**  | 무료 (1K req/day) | 아키텍처    | 시스템 설계, SOLID 원칙          |
| **Qwen Code**   | 무료 (2K req/day) | 성능 최적화 | 알고리즘, 성능 분석              |

## 🔌 MCP 서버 설정

### Claude Code MCP 통합 (9개 서버)

```bash
# MCP 서버 상태 확인
claude mcp list

# 환경변수 로드
source ./scripts/setup-mcp-env.sh

# MCP 서버 건강 체크
./scripts/mcp-health-check.sh
```

### MCP 서버 목록

| 서버                    | 상태 | 기능                 | API 키 필요 |
| ----------------------- | ---- | -------------------- | ----------- |
| **context7**            | ✅   | 라이브러리 문서 검색 | ✅          |
| **supabase**            | ✅   | PostgreSQL DB 관리   | ✅          |
| **vercel**              | ✅   | 프로젝트 배포 관리   | OAuth       |
| **memory**              | ✅   | 컨텍스트 메모리      | -           |
| **time**                | ✅   | 시간 유틸리티        | -           |
| **sequential-thinking** | ✅   | 사고 과정 추적       | -           |
| **shadcn-ui**           | ✅   | UI 컴포넌트          | -           |
| **serena**              | ✅   | 코드 분석            | -           |
| **playwright**          | ✅   | E2E 테스트           | -           |

## 🎯 서브에이전트 시스템

### 12개 전문 서브에이전트 구성

#### 🎯 핵심 에이전트 (1개)

- **central-supervisor**: 복잡한 작업 분해 및 서브에이전트 오케스트레이션

#### 🛠️ 개발 환경 & 구조 (2개)

- **dev-environment-manager**: WSL 최적화, Node.js 버전 관리
- **structure-refactor-specialist**: 프로젝트 구조 정리, 폴더 최적화

#### 🌐 백엔드 & 인프라 (5개)

- **database-administrator**: Supabase PostgreSQL 전문 관리
- **ai-systems-specialist**: AI 어시스턴트 기능 개발
- **vercel-platform-specialist**: Vercel 플랫폼 + MCP 연동
- **mcp-server-administrator**: 9개 MCP 서버 관리

#### 🔍 코드 품질 & 테스트 (5개)

- **code-review-specialist**: 코드 리뷰, SOLID 원칙 검증
- **debugger-specialist**: 버그 해결, 스택 트레이스 분석
- **security-auditor**: 포트폴리오용 기본 보안
- **quality-control-specialist**: CLAUDE.md 규칙 준수 검토
- **test-automation-specialist**: Vitest/Playwright 테스트

#### 📚 문서화 & Git (2개)

- **documentation-manager**: docs 폴더 + 루트 문서 관리
- **git-cicd-specialist**: 커밋/푸시/PR 전문

#### 🤖 AI 협업 (3개)

- **codex-agent**: ChatGPT Plus AI 개발 CLI
- **gemini-agent**: Google Gemini 병렬 개발
- **qwen-agent**: Qwen Code 병렬 개발

### 서브에이전트 사용법

```typescript
// 복잡한 풀스택 기능 구현
Task({
  subagent_type: 'central-supervisor',
  prompt: '사용자 대시보드에 실시간 알림 기능 추가',
});

// 성능 최적화
Task({
  subagent_type: 'ai-systems-specialist',
  prompt: 'AI 응답 시간 2초 미만 달성을 위한 최적화',
});

// 보안 감사
Task({
  subagent_type: 'security-auditor',
  prompt: '새로운 API 엔드포인트 보안 검토',
});
```

## 🧪 테스트 실행

### Vercel 중심 테스트 전략

```bash
# Vercel 환경 통합 테스트
npm run test:vercel:full    # 종합 프로덕션 테스트
npm run test:vercel:e2e     # E2E 테스트 (실제 환경)
npm run test:vercel         # 프로덕션 테스트

# AI 개발 최적화 테스트
npm run test:ai             # AI 개발 기본 (Vercel 환경)
npm run test:super-fast     # 가장 빠른 테스트 (11초)
npm run test:fast           # 멀티스레드 테스트 (21초)
npm run test:dev            # 병렬 개발 테스트

# 보조적 로컬 테스트
npm run test                # Vitest
npm run test:e2e            # 로컬 Playwright
```

### 테스트 성능 지표

- **test:super-fast**: 11초 (핵심 기능만)
- **test:fast**: 21초 (44% 성능 향상, 멀티스레드)
- **test:ai**: Vercel 실제 환경 검증

## 📚 개발 워크플로우

### 1. 개발 서버 실행

```bash
# 안정화된 개발 서버 (권장)
npm run dev:stable

# 기본 개발 서버
npm run dev

# 완전 정리된 개발 서버
npm run dev:clean

# Playwright 테스트 전용
npm run dev:playwright
```

### 2. 코드 품질 관리

```bash
# 전체 검증
npm run validate:all        # 린트+타입+테스트

# 개별 검증
npm run lint                # ESLint
npm run type-check          # TypeScript
npm run test               # 단위 테스트
```

### 3. 빌드 및 배포

```bash
# 로컬 빌드
npm run build

# 성능 분석
npm run analyze:performance
npm run analyze:bundle

# Vercel 배포 (자동)
git push origin main
```

### 4. AI 협업 워크플로우

1. **메인 개발**: Claude Code로 핵심 기능 구현
2. **병렬 검증**: Codex/Gemini/Qwen으로 교차 검증
3. **코드 리뷰**: code-review-specialist 서브에이전트
4. **테스트**: test-automation-specialist 서브에이전트
5. **문서화**: documentation-manager 서브에이전트

### 5. 커밋 및 푸시

```bash
# 자동 CHANGELOG 갱신 시스템
git add .
git commit -m "✨ feat: 새로운 기능 추가"
# → 자동으로 CHANGELOG.md 업데이트

# 푸시 (pre-push 검증 포함)
git push origin main
```

## 🔧 문제 해결

### 개발 서버 문제

```bash
# segment-explorer 에러 해결
npm run dev:stable   # devtools 비활성화

# 포트 충돌 해결
killall -9 node
npm run dev
```

### MCP 서버 문제

```bash
# MCP 상태 확인
claude mcp list

# 서버 재연결
claude mcp remove [server-name]
claude mcp add [server-name] [command]

# 종합 진단
./scripts/mcp-health-check.sh
```

### WSL 성능 이슈

```bash
# WSL 모니터링
./scripts/wsl-monitor/wsl-monitor.sh --once

# 응급 복구
./scripts/maintenance/emergency-recovery.sh

# 메모리 최적화 확인
free -h
```

## 📊 개발 성과 지표

| 지표                  | 목표  | 현재  | 상태 |
| --------------------- | ----- | ----- | ---- |
| **TypeScript 오류**   | 0개   | 0개   | ✅   |
| **빌드 시간**         | <60초 | 45초  | ✅   |
| **개발 서버 시작**    | <30초 | 22초  | ✅   |
| **테스트 커버리지**   | >80%  | 85%   | ✅   |
| **E2E 테스트 통과율** | >95%  | 98.2% | ✅   |

## 🤝 기여하기

1. **Issue 생성**: 버그 리포트 또는 기능 제안
2. **Fork & Clone**: 저장소 포크 후 로컬 복제
3. **브랜치 생성**: `feature/기능명` 또는 `fix/수정내용`
4. **개발**: 위 워크플로우 따라 개발
5. **테스트**: `npm run validate:all` 통과 확인
6. **PR 생성**: 상세한 설명과 함께 Pull Request

---

**💡 TIP**: 이 문서는 개발자를 위한 상세 가이드입니다. 일반적인 프로젝트 소개는 [README.md](./README.md)를 참조하세요.
