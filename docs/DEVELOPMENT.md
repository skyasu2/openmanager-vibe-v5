# OpenManager VIBE v5 개발 가이드

> **v5.88.0** | Updated 2026-01-18
>
> 개발자 전용 문서 - 프로젝트 기여 및 개발 환경 구성 가이드

## 📋 목차

- [🏗️ 개발 환경 설정](#개발-환경-설정)
- [🤖 AI 도구 통합](#ai-도구-통합)
- [🔌 MCP 서버 설정](#mcp-서버-설정)
- [🧪 테스트 실행](#테스트-실행)
- [📚 개발 워크플로우](#개발-워크플로우)

## 🏗️ 개발 환경 설정

### Prerequisites

- **Windows 11 + WSL 2** (권장 개발 환경)
- **Node.js** v22.21.1 (`.nvmrc` 참조)
- npm 10.9.2 이상
- Docker Desktop (AI 서비스용)
- Git

### 기술 스택 (v5.87.0)

```
Next.js 16.1.1 (App Router)
React 19.2.3
TypeScript 5.9.3 (strict mode)
Supabase (PostgreSQL + Realtime)
Tailwind CSS 4.1.18 + Shadcn/UI
```
- Git
- **Claude Code** (메인 AI 개발 도구)

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
CLOUD_RUN_AI_URL=https://ai-engine-xxx.run.app  # Cloud Run AI 사용 시
GITHUB_CLIENT_ID=your_github_oauth_id
GITHUB_CLIENT_SECRET=your_github_oauth_secret
```

### Docker 기반 로컬 AI 개발 (New ⭐)

`ai-engine`을 로컬에서 실행하여 테스트할 수 있습니다.

```bash
# AI 서비스 로컬 실행 (AI Engine)
cd cloud-run
docker-compose up --build

# 접속 주소
# AI Engine: http://localhost:8080
```

> **참고**: `.env` 파일에 필요한 API 키가 설정되어 있어야 합니다. `docker-compose.yml`을 참조하세요.

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

### AI 도구별 전문 분야

| 도구            | 요금제            | 역할        | 전문 분야                        |
| --------------- | ----------------- | ----------- | -------------------------------- |
| **Claude Code** | Max ($200/월)     | 메인 개발   | 전체 아키텍처, 코드 리뷰, 문서화 |
| **Codex CLI**   | Plus ($20/월)     | 코드 리뷰   | 복잡한 로직, 테스트 코드         |
| **Gemini CLI**  | 무료 (1K req/day) | 코드 리뷰   | 시스템 설계, SOLID 원칙          |

> **2-AI 교차검증**: Codex ↔ Gemini 순환 (2026-01-07 단순화)

## 🔌 MCP 서버 설정

### Claude Code MCP 통합 (8개 서버)

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
| **serena**              | ✅   | 코드 검색, 심볼 분석 | -           |
| **context7**            | ✅   | 라이브러리 문서 검색 | -           |
| **sequential-thinking** | ✅   | 복잡한 추론/설계     | -           |
| **supabase**            | ✅   | PostgreSQL DB 관리   | ✅          |
| **vercel**              | ✅   | 프로젝트 배포 관리   | ✅          |
| **playwright**          | ✅   | E2E 테스트           | -           |
| **github**              | ✅   | 저장소/PR 관리       | ✅          |
| **tavily**              | ✅   | 웹 검색 (리서치)     | ✅          |

## 🎯 Claude Code 도구

### 기본 서브에이전트 (5개)

| 서브에이전트 | 용도 |
|-------------|------|
| `general-purpose` | 범용 리서치, 코드 검색, 멀티스텝 작업 |
| `Explore` | 코드베이스 빠른 탐색 |
| `Plan` | 구현 계획 설계 |
| `claude-code-guide` | Claude Code 문서 안내 |
| `statusline-setup` | 상태라인 설정 |

### 커스텀 스킬 (11개)

```bash
# 스킬 목록 확인
ls .claude/skills/

# 주요 스킬 사용
/review              # 코드 리뷰 결과 확인
```

| 스킬 | 용도 |
|------|------|
| `ai-code-review` | Multi-AI 코드 리뷰 |
| `lint-smoke` | Lint + 테스트 스모크 체크 |
| `security-audit-workflow` | 보안 감사 |
| `validation-analysis` | 검증 결과 분석 |

## 🧪 테스트 실행

### Vercel 중심 테스트 전략

```bash
# Vercel 환경 통합 테스트
npm run test:vercel:full    # 종합 프로덕션 테스트
npm run test:vercel:e2e     # E2E 테스트 (Playwright, 실제 Vercel 환경)

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

#### Biome 명령어 (Lint & Format)

Biome은 ESLint와 Prettier를 대체하는 고성능 툴체인입니다.

```bash
# 로컬 개발용
npm run lint                # 전체 검사 (Lint)
npm run lint:fix            # 자동 수정 (Check --write)
npm run format              # 포맷팅 (Format --write)

# CI/CD용
npm run lint:ci             # CI 환경용 검사
npm run lint:strict         # 경고를 에러로 처리
```

**성능 비교:**

- 기존 (ESLint): 150초+ → OOM 에러 발생 ❌
- **개선 (Biome)**: **1초 미만** (99% 성능 향상) ✅

**사용 권장사항:**

- **로컬 개발**: `npm run lint:fix`로 자동 수정
- **커밋 전**: `lint-staged`가 자동 실행 (Biome Check)
- **CI/CD**: `npm run lint:ci` (GitHub Actions)

#### TypeScript 타입 체크

```bash
# 전체 타입 체크
npm run type-check          # 프로젝트 전체

# 빠른 타입 체크
npm run type-check:fast     # 래퍼 스크립트 사용
npm run type-check:changed  # 변경된 파일만
```

#### 통합 검증

```bash
# 전체 검증
npm run validate:all        # 린트+타입+테스트
npm run validate            # 타입+퀵 린트
npm run validate:quick      # 빠른 타입+퀵 린트
npm run validate:changed    # 변경된 파일만

# 개별 테스트
npm run test                # 단위 테스트
npm run test:quick          # 최소 테스트 세트
```

#### Pre-commit 검사 자동화

커밋 시 자동으로 실행됩니다:

```bash
# TypeScript 파일 (.ts, .tsx)
1. Prettier 포맷팅
2. tsc --noEmit (타입 체크)
3. ESLint 자동 수정 (--max-warnings=0)

# JavaScript 파일 (.js, .jsx)
1. Prettier 포맷팅
2. ESLint 자동 수정

# 기타 파일 (.json, .md, .css)
1. Prettier 포맷팅만
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
2. **2-AI 교차검증**: Codex ↔ Gemini 자동 코드 리뷰
3. **코드 리뷰**: `ai-code-review` 스킬 활용
4. **테스트**: `lint-smoke` 스킬 + Playwright MCP
5. **문서화**: Claude Code 직접 수행

### 5. 커밋 및 푸시

```bash
# 자동 CHANGELOG 갱신 시스템
git add .
git commit -m "✨ feat: 새로운 기능 추가"
# → 자동으로 CHANGELOG.md 업데이트
# 💡 Tip: 소스 변경 시 문서/테스트가 없으면 경고가 표시됩니다 (Soft Warning)

# 푸시 (pre-push 검증 포함)
git push origin main
# 💡 Tip: 긴급 수정 시 빌드 검증 건너뛰기:
# SKIP_BUILD=true git push origin main
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
