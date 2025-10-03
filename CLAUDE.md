# CLAUDE.md - OpenManager VIBE Project Memory

**한국어로 우선 대화, 기술용어는 영어 사용허용**

**Claude Code 프로젝트 가이드** | [공식 문서](https://docs.claude.com/en/docs/claude-code/memory)

---

## 📋 목차

- [📦 버전 정보](#-버전-정보)
- [🎯 프로젝트 개요](#-프로젝트-개요)
- [🏗️ 시스템 아키텍처](#%EF%B8%8F-시스템-아키텍처)
- [🛠️ 개발 환경](#%EF%B8%8F-개발-환경)
- [📐 코딩 표준](#-코딩-표준)
- [🧪 테스트 전략](#-테스트-전략)
- [🚀 배포 가이드](#-배포-가이드)
- [📚 공통 워크플로우](#-공통-워크플로우)
- [💡 개발 철학](#-개발-철학)
- [🎯 현재 상태](#-현재-상태)
- [🔧 트러블슈팅](#-트러블슈팅)

---

## 📦 버전 정보

**중앙 관리 - Single Source of Truth**

| 항목 | 버전 | 업데이트 |
|------|------|----------|
| **프로젝트** | v5.71.0 | 2025-09-28 |
| **Claude Code** | v2.0.1 | 2025-09-30 |
| **Claude Sonnet** | 4.5 (20250929) | 2025-09-29 |
| **Node.js** | v22.19.0 LTS | - |
| **npm** | v11.6.0 | - |
| **Next.js** | v15.4.5 | - |
| **React** | v18.3.1 | - |
| **TypeScript** | v5.7.2 | - |

---

## 🎯 프로젝트 개요

**OpenManager VIBE**: AI 기반 실시간 서버 모니터링 플랫폼

### 핵심 특징
- **아키텍처**: Next.js 15+ + React 18+ + TypeScript (strict) + Vercel + Supabase
- **데이터 시스템**: StaticDataLoader (v5.71.0) - 99.6% CPU 절약, 92% 메모리 절약
- **무료 티어**: 100% 무료로 운영 (Vercel/Supabase 무료 계정 최적화)
- **AI 시스템**: 2-AI 모드 (LOCAL + GOOGLE_AI) + Claude Code 개발 환경

### 빠른 시작

```bash
# 개발 서버 시작
npm run dev:stable          # 안정화된 개발 서버 (권장)
npm run dev                 # 기본 개발 서버
npm run validate:all        # 린트+타입+테스트

# 테스트 실행
npm run test:vercel:e2e     # Vercel 환경 E2E 테스트 (권장)
npm run test:super-fast     # 빠른 유닛 테스트 (11초)

# 배포
git push                    # Vercel 자동 배포

# Claude Code v2.0 새 기능
/rewind                     # Checkpoints로 이전 상태 복원 (Esc 두 번)
/usage                      # Max 플랜 사용량 확인
```

### Claude Code v2.0 신규 기능 (공식 문서 검증 완료)

**Checkpoints (체크포인트)** ✅
- 코드 변경 전 자동 저장 (매 프롬프트마다 자동 생성)
- `/rewind` 또는 `Esc Esc`로 즉시 복원
- 3가지 복원 모드: 대화만 / 코드만 / 둘 다
- 30일간 자동 보관 (설정 가능)

**새로운 슬래시 명령어** ✅
- `/usage` - 플랜 사용량 및 rate limit 확인
- `/rewind` - 코드/대화 복원 메뉴 열기

**키보드 단축키** ✅
- `Tab` - Extended thinking 토글 (on-demand 활성화)
- `Ctrl-R` - 명령어 히스토리 역방향 검색
- `Esc Esc` - Rewind 메뉴 열기
- `Shift-Tab` - 권한 모드 전환

**Sonnet 4.5 기본 모델** ✅
- 세계 최고 코딩 모델 (2025-09-29 릴리스)
- Extended thinking 지원 (Tab 키로 토글)
- Memory tool (Beta) 사용 가능

**참고**: `alwaysThinkingEnabled` 설정은 공식 스키마에 존재하나 문서화되지 않은 Beta 기능입니다.

---

## 🏗️ 시스템 아키텍처

### 상세 아키텍처 문서 (Import)

- **@docs/claude/architecture/system-overview.md**
  - StaticDataLoader 시스템
  - 애플리케이션 AI 엔진 (2-AI 모드)
  - Mock 시뮬레이션 시스템
  - 무료 티어 전략

- **@docs/claude/architecture/ai-cross-verification.md**
  - 3-AI 협업 교차검증 시스템
  - Claude, Codex, Gemini, Qwen 통합

- **@docs/claude/architecture/mock-simulation.md**
  - FNV-1a 해시 기반 메트릭 생성
  - 10개 서버 타입, 15+ 장애 시나리오

### 기술 스택

**Frontend**
- Next.js 15+ (App Router)
- React 18.3.1
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui
- Zustand + React Query

**Backend**
- Vercel Edge Functions
- Supabase PostgreSQL
- GCP Cloud Functions
- Next.js API Routes

**Infrastructure**
- Hosting: Vercel (무료 티어)
- Database: Supabase (무료 티어)
- Functions: GCP Cloud Functions (무료 티어)

---

## 🛠️ 개발 환경

**1인 AI 개발 환경**: WSL + Multi-AI 협업 시스템

### 상세 개발 환경 문서 (Import)

- **@docs/claude/environment/wsl-optimization.md**
  - WSL 2 최적화 설정 (20GB 메모리)
  - .wslconfig 필수 설정
  - MCP 서버 호환성 설정

- **@docs/claude/environment/ai-tools-setup.md**
  - Claude Code v2.0.1 (Max $200/월)
  - Codex CLI v0.42.0 (Plus $20/월)
  - Gemini CLI v0.6.1 (무료)
  - Qwen CLI v0.0.14 (무료)

- **@docs/claude/environment/multi-ai-strategy.md**
  - 병렬 개발 패턴 (생산성 4배)
  - 교차 검증 워크플로우
  - 전문 분야별 특화

- **@docs/claude/environment/mcp-configuration.md**
  - 9개 MCP 서버 설정
  - 인증 방법 (OAuth, Token, API Key)
  - 문제 해결 가이드

- **@docs/claude/environment/mcp-priority-guide.md** ⭐
  - MCP 우선순위 의사결정 가이드
  - 작업별 MCP 선택 매트릭스
  - 실전 예시 (Before/After)
  - 82% 토큰 절약 달성 전략

- **@docs/claude/environment/workflows.md**
  - 일일 개발 루틴
  - 병렬 개발 패턴
  - AI 교차검증 워크플로우
  - Git/배포 워크플로우

- **@docs/claude/environment/claude-code-hooks-guide.md**
  - Claude Code v2.0 Hooks 시스템
  - PostToolUse/UserPromptSubmit 설정
  - WSL 환경 호환성 (선택적)

### 핵심 도구

| 도구 | 버전 | 요금제 | 역할 |
|------|------|--------|------|
| **Claude Code** | v2.0.1 | Max ($200/월) | 메인 개발 환경 |
| **OpenAI CLI** | v0.42.0 | Plus ($20/월) | 서브 (실무) |
| **Gemini CLI** | v0.6.1 | 무료 (60 RPM) | 서브 (설계) |
| **Qwen CLI** | v0.0.14 | 무료 (60 RPM) | 서브 (성능) |

### MCP 서버 현황

**9/9개 완벽 연결** (2025-09-30)
- vercel, serena, supabase, context7, playwright
- memory, time, sequential-thinking, shadcn-ui
- 연결 성공률: 100% 🏆
- 평균 응답속도: 50ms 미만

**활용도 및 개선 (2025-10-03)**
- 전체 활용도: 65/100점 → 목표 90/100점
- 토큰 절약: 50-60% → 목표 82%
- 개선 계획: [MCP 우선순위 가이드](docs/claude/environment/mcp-priority-guide.md) 적용
- 핵심 원칙: **"MCP를 대안이 아닌 1순위로!"**

### 빠른 시작

```bash
# 환경 시작
wsl && cd /mnt/d/cursor/openmanager-vibe-v5

# 상태 확인
claude --version && claude mcp list

# 개발 서버
npm run dev:stable &

# Claude Code 실행
claude
```

---

## 📐 코딩 표준

### 상세 코딩 표준 (Import)

- **@docs/claude/standards/typescript-rules.md**
  - TypeScript strict mode 필수
  - any 금지, 명시적 타입 정의
  - Type-First 개발 원칙

- **@docs/claude/standards/commit-conventions.md**
  - 이모지 + 간결한 메시지
  - ✨ feat | 🐛 fix | ♻️ refactor

- **@docs/claude/standards/git-hooks-best-practices.md**
  - Pre-commit Hook (1초, 보안 중심)
  - Pre-push Hook (25초, 품질 검증)
  - Industry Best Practices 준수

- **@docs/claude/standards/file-organization.md**
  - 500줄 권장, 1500줄 최대
  - 폴더 구조 및 네이밍 규칙

### 핵심 규칙

1. **TypeScript**: any 금지, strict mode 필수
2. **파일 크기**: 500줄 권장, 1500줄 초과 시 분리
3. **테스트**: Vercel 중심 E2E 테스트 우선
4. **커밋**: 이모지 + 간결한 메시지 (✨ 🐛 ♻️)
5. **Side-Effect**: 모든 수정/삭제 시 영향 분석 필수

### 타입 정의 예시

```typescript
// ✅ 올바른 타입 정의
interface ServerData {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  metrics: ServerMetrics;
}

// ❌ any 사용 금지
function getData(id: any): any {  // 절대 금지
  // ...
}
```

---

## 🧪 테스트 전략

### 상세 테스트 전략 (Import)

- **@docs/claude/testing/vercel-first-strategy.md**
  - Vercel 중심 테스트 철학
  - 실제 운영 환경 우선 검증
  - 성능 최적화 (44% 테스트 시간 단축)

- **@docs/claude/testing/e2e-playwright.md**
  - Playwright E2E 테스트
  - 18개 테스트, 98.2% 통과율

### 테스트 우선순위

1. **🔴 High**: Vercel E2E 테스트 (실제 환경)
2. **🟡 Medium**: API Routes 성능 테스트
3. **🔵 Low**: 로컬 Unit 테스트 (필요시만)

### 실행 명령어

```bash
# Vercel 환경 테스트 (우선)
npm run test:vercel:full    # 종합 프로덕션 테스트
npm run test:vercel:e2e     # E2E 테스트 (18개)
npm run test:vercel         # 프로덕션 환경 검증

# 로컬 테스트 (보조)
npm run test:super-fast     # 11초 빠른 테스트
npm run test:fast           # 21초 최적화 테스트 (44% 개선)
npm run test                # Vitest 유닛 테스트
```

### 현재 테스트 현황 (2025-09-28)
- **유닛 테스트**: 64개, 100% 통과 (11.72초)
- **E2E 테스트**: 18개, 98.2% 통과 (Vercel 환경)
- **성능 테스트**: FCP 608ms, 응답시간 532ms

---

## 🚀 배포 가이드

### 상세 배포 가이드 (Import)

- **@docs/claude/deployment/vercel-optimization.md**
  - Vercel 무료 티어 최적화
  - StaticDataLoader 활용
  - Edge Functions 전략

- **@docs/claude/deployment/zero-cost-operations.md**
  - 100% 무료 운영 전략
  - 연간 $1,380-2,280 절약
  - 플랫폼별 최적화

### 배포 워크플로우

```bash
# 1. 로컬 검증 (선택적)
npm run validate:all        # 린트+타입+테스트

# 2. Git commit & push
git add .
git commit -m "✨ feat: 새 기능 추가"
git push

# 3. Vercel 자동 배포
# → Vercel이 자동으로 빌드 및 배포

# 4. 배포 후 검증
npm run test:vercel:e2e     # E2E 테스트
npm run lighthouse:vercel   # 성능 측정
```

### Vercel 배포 현황 (2025-09-28)
- **배포 상태**: ✅ 완전 성공 (Zero Warnings)
- **프로덕션 URL**: https://openmanager-vibe-v5.vercel.app
- **Node.js 버전**: ✅ 22.x 통합
- **성능**: FCP 608ms, 응답시간 532ms

---

## 📚 공통 워크플로우

### 상세 워크플로우 (Import)

- **@docs/claude/workflows/common-tasks.md**
  - 빠른 시작 명령어
  - 배포 워크플로우
  - 트러블슈팅 가이드

### 자주 사용하는 명령어

```bash
# 개발
npm run dev:stable          # 안정화된 개발 서버
npm run validate:all        # 전체 검증

# 테스트
npm run test:vercel:e2e     # Vercel E2E (권장)
npm run test:super-fast     # 빠른 유닛 테스트

# 배포
git push                    # Vercel 자동 배포

# 검증
npm run type-check          # TypeScript 검사
npm run lint                # ESLint 검사

# Claude Code v2.0 기능
/rewind                     # Checkpoints 복원
/usage                      # 사용량 확인
Esc Esc                     # 빠른 복원
```

### Hooks 설정 (자동화 권장)

Claude Code v2.0은 Hooks를 통한 자동화를 지원합니다.

**설정 방법** (`~/.claude/settings.json`):
```json
{
  "hooks": {
    "beforeToolCall": "npm run lint",
    "afterFileEdit": "npm run type-check"
  }
}
```

**권장 Hooks**:
- `beforeToolCall`: 도구 실행 전 린팅
- `afterFileEdit`: 파일 수정 후 타입 체크
- `beforeCommit`: 커밋 전 전체 검증

---

## 💡 개발 철학

### 1. 🎨 Type-First 개발
**타입 정의 → 구현 → 리팩토링** 순서로 개발

```typescript
// 1. 타입 정의 먼저
interface AIQueryRequest {
  query: string;
  mode: 'LOCAL' | 'GOOGLE_AI';
}

// 2. 타입에 맞춰 구현
async function queryAI(req: AIQueryRequest): Promise<AIQueryResponse> {
  // 타입 안전성 보장
}

// 3. 타입 기반 리팩토링
function extractMode(req: AIQueryRequest): string {
  return req.mode;  // IDE 자동완성 지원
}
```

### 2. 🔄 Side-Effect First 개발
**개발 및 수정 시 테스트, 문서, API 등 연관된 모든 사이드 이펙트를 함께 고려하여 동시 수정**

#### 사이드 이펙트 체크리스트
- [ ] 관련 테스트 업데이트 완료
- [ ] 관련 문서 업데이트 완료
- [ ] 의존성 있는 코드 동시 수정 완료
- [ ] Breaking Change 문서화 완료

### 3. 📝 커밋 컨벤션
- **✨ feat**: 새 기능
- **🐛 fix**: 버그 수정
- **♻️ refactor**: 리팩토링
- **📝 docs**: 문서 수정
- **🧪 test**: 테스트 추가/수정

### 4. ⚠️ 사이드 이펙트 관리
**모든 수정, 삭제, 개발 작업 시 반드시 고려할 핵심 원칙**

#### 사전 영향 분석
- 의존성 추적: 변경 대상이 다른 컴포넌트/서비스에 미치는 영향
- 호환성 검증: 기존 API, 설정, 환경과의 하위 호환성

#### 안전 검증 프로토콜
- Vercel 환경 테스트 우선
- 단계적 적용 (큰 변경은 나누어 검증)
- 롤백 계획 사전 준비

---

## 🎯 현재 상태

### 프로젝트 현황
- **코드베이스**: 226,356줄 (src), 873개 TypeScript 파일
- **프로젝트 구조**: 기능별 레이어드 아키텍처, JBGE 원칙 적용
- **개발 상태**: 프로덕션 운영 중

### 품질 지표 (2025-10-03 업데이트)
- **TypeScript 에러**: 0개 완전 해결 ✅ (strict 모드 100% 달성)
- **인증 시스템**: ✅ Zustand 기반 최적화 완료 (Phase 2)
- **인증 성능**: PIN 인증 8-15ms → 2-3ms (**5배 향상** ⚡)
- **코드 품질**: ~90 lines 제거, localStorage 직접 접근 제거
- **개발 서버 성능**: 시작 시간 35% 단축 (32초 → 22초)
- **테스트 성능**: 44% 단축 (37.95초 → 21.08초)
- **Vercel E2E 테스트**: 18개, 98.2% 통과율

### Vercel 배포 현황
- **배포 상태**: ✅ 완전 성공 (Zero Warnings 달성)
- **프로덕션 URL**: https://openmanager-vibe-v5.vercel.app
- **Node.js 버전**: ✅ 22.x 통합
- **성능**: FCP 608ms, 응답시간 532ms, 99.95% 가동률

### 무료 티어 성과
- **월 운영비**: $0 (100% 무료)
- **절약 효과**: 연간 $1,380-2,280
- **Vercel**: 30GB/월 (30% 사용)
- **Supabase**: 15MB (3% 사용)
- **GCP**: Cloud Functions 200만 호출/월 (5% 사용)

---

## 🔧 트러블슈팅

### 프로덕션 배포 문제
```bash
# TypeScript 에러
npx tsc --noEmit

# 빌드 실패
npm run build                # 로컬 테스트
# → Vercel 로그 분석

# 런타임 오류
# → Vercel 로그 확인
# → 환경변수 검증
```

### 개발 환경 문제
```bash
# TypeScript strict 모드 오류
npm run type-check           # 타입 검사

# 테스트 실패
npm run test:vercel:e2e      # Vercel 환경 검증
npm run test:super-fast      # 빠른 로컬 검증
```

### 자주 발생하는 문제

#### 1. TypeScript strict 모드 오류
**해결**: any 사용 금지, 명시적 타입 정의

#### 2. Vercel 배포 실패
**해결**:
- 환경변수 검증
- Node.js 메모리 설정 확인
- 로컬 빌드 테스트

#### 3. E2E 테스트 타임아웃
**해결**:
- Vercel 환경 테스트로 전환
- 타임아웃 설정 증가 (필요시)

---

## 📚 추가 문서

### 설계도 관리
- **현재 운영 시스템**: [docs/design/current/](docs/design/current/)
- **미래 계획**: [docs/design/future/](docs/design/future/)
- **아카이브**: [docs/design/archive/](docs/design/archive/)

### 프로젝트 문서
- **전체 문서 인덱스**: [docs/README.md](docs/README.md)
- **빠른 시작 가이드**: [docs/QUICK-START.md](docs/QUICK-START.md)
- **시스템 아키텍처**: [docs/system-architecture.md](docs/system-architecture.md)
- **AI 시스템**: [docs/AI-SYSTEMS.md](docs/AI-SYSTEMS.md)

---

## 🎓 AI 시스템 파일 구분

**프로젝트에는 서로 다른 AI 시스템을 위한 파일들이 있습니다:**

### 📄 CLAUDE.md (현재 파일) ⭐
- **역할**: Claude Code의 **Project Memory** (팀 공유용)
- **위치**: `./CLAUDE.md`
- **자동 로드**: Claude Code 실행 시 자동으로 메모리에 로드
- **계층**: Enterprise → Project (이 파일) → User
- **공식 문서**: [Claude Code Memory System](https://docs.claude.com/en/docs/claude-code/memory)

### 📄 AGENTS.md
- **역할**: OpenAI Codex CLI의 **전용 설정 파일**
- **내용**: 12개 Codex 전문 에이전트 구성
- **위치**: 루트 디렉토리

### 📄 docs/claude/
- **역할**: Claude Code 상세 문서 (Import 파일들)
- **내용**: 아키텍처, 코딩 표준, 테스트, 배포 가이드

**⚠️ 중요**: 각 파일은 완전히 다른 AI 시스템을 위한 것입니다!

---

💡 **핵심 원칙**: Type-First + Side-Effect First + 이모지 커밋 + Vercel 중심 테스트

⚠️ **사이드 이펙트 우선**: 모든 수정, 삭제, 개발 시 영향 분석 및 검증 필수

📖 **상세 내용**: @docs/claude/ 폴더 Import 파일 참조 (공식 가이드 준수)

---

**Important Instructions**:
- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files to creating new ones
- NEVER proactively create documentation files (*.md) or README files
- Only create documentation files if explicitly requested by the User
