# CLAUDE.md - OpenManager VIBE Project Memory

**한국어로 우선 대화, 기술용어는 영어 사용허용**

---

## 📦 핵심 정보

**프로젝트**: OpenManager VIBE v5.80.0 - AI 기반 실시간 서버 모니터링 플랫폼
**환경**: WSL + Claude Code v2.0.31+ + Multi-AI 협업
**스택**: Next.js 15, React 18.3, TypeScript strict, Vercel + Supabase

---

## 🚀 빠른 시작

```bash
# 개발
npm run dev:stable          # 안정화된 개발 서버
npm run validate:all        # 린트+타입+테스트

# 테스트 (Vercel 중심)
npm run test:vercel:e2e     # Vercel E2E (권장)
npm run test:super-fast     # 11초 빠른 테스트

# 배포
git push                    # Vercel 자동 배포

# Claude Code v2.0.31+ 🆕
/rewind                     # Checkpoints 복원
/usage                      # 사용량 확인
npx ccusage@latest          # 상세 토큰 분석
Esc Esc                     # 빠른 복원

# Extended Thinking (v2.0.31+) 🔥
# 활성화: Tab 키 토글 또는 ultrathink 키워드 (자동)
claude --model sonnet
> "복잡한 버그를 think harder 해서 분석해줘"    # Token budget 10K
> "아키텍처를 ultrathink 해서 검토해줘"        # Token budget 32K + Extended Thinking 자동
# Token Budget Keywords: think (4K) < think hard (10K) < ultrathink (32K + Extended Thinking)

# @-mention 서버 필터링 (v2.0.10+) 🔥
@serena "코드 구조 분석"       # Serena만 활성화 → 10-18% 추가 절약
@context7 "Next.js 15 문서"    # Context7만 활성화
@vercel "배포 상태 확인"       # Vercel만 활성화
```

---

## 📊 주간 메트릭 (logs/feedback/week1-checklist.md)

- MCP 활용도: 65% → 90% 목표
- 3-AI 성공률: 100% 유지
- 토큰 효율: 55토큰 유지

---

## 💡 핵심 원칙

1. **Type-First**: 타입 정의 → 구현 → 리팩토링
2. **any 금지**: TypeScript strict mode 100%
3. **Vercel 중심**: 실제 환경 우선 테스트
4. **MCP 우선**: 85% 토큰 절약 (MCP 82% + @-mention 3%)
5. **Side-Effect First**: 테스트/문서/의존성 동시 수정

---

## ⚡ 토큰 최적화 전략

### @-mention 템플릿 (복사해서 사용) 🔥

```bash
# 코드 분석 (Serena)
@serena "src/components/LoginClient.tsx 구조 분석"

# 라이브러리 문서 (Context7)
@context7 "Next.js 15 server actions 문서"

# Vercel 조회
@vercel "최근 배포 목록"

# DB 작업 (Supabase)
@supabase "users 테이블 RLS 정책 확인"

# UI 컴포넌트 (Shadcn-ui)
@shadcn-ui "button 컴포넌트 최신 버전"
```

**효과**: 10-18% 추가 절약, Cache Read 90%+ 달성

### 외부 문서 참조 가이드

| 문서                     | 언제 참조           | 핵심 내용                     |
| ------------------------ | ------------------- | ----------------------------- |
| multi-ai-strategy.md     | AI 교차검증 필요 시 | 3-AI 병렬 실행, Bash Wrapper  |
| subagents-complete-guide | 전문 작업 필요 시   | 12개 에이전트, 호출 방법      |
| mcp-priority-guide.md    | MCP 도구 선택 시    | 작업별 우선순위, Before/After |

**원칙**: 500줄+ 문서는 직접 참조 최소화, 1-2줄 요약으로 빠른 판단

---

## 🤖 Multi-AI 교차검증

**⚠️ 트리거**: "AI 교차검증" 명시 시에만 활성화 (일반 개발은 Claude 단독)

**호출**:

```bash
Task multi-ai-verification-specialist "LoginClient.tsx 검증"
```

**상세**: @docs/claude/environment/multi-ai-strategy.md (653줄, 3-AI 협업 전략)

---

## 🎭 서브에이전트 (12개)

**호출**: `Task [에이전트명] "[작업]"`

**핵심**: multi-ai-verification, code-review, vercel-platform, security, test-automation

**상세**: @docs/ai/subagents-complete-guide.md (371줄, 전체 목록)
**설정**: @config/ai/registry-core.yaml (SSOT)

---

## 📐 코딩 표준 (엄격)

```typescript
// ✅ 올바른 타입
interface ServerData {
  id: string;
  status: 'online' | 'offline';
  metrics: ServerMetrics;
}

// ❌ any 절대 금지
function getData(id: any): any {} // 절대 금지
```

**파일 크기**: 500줄 권장, 1500줄 최대
**커밋**: ✨ feat | 🐛 fix | ♻️ refactor

---

## 🧪 테스트 전략

**우선순위**:

1. 🔴 **Vercel E2E** (실제 환경) - 98.2% 통과율
2. 🟡 **API Routes** (성능 측정)
3. 🔵 **Unit 테스트** (필요 시만)

```bash
npm run test:vercel:full    # 종합 검증
npm run test:super-fast     # 11초
npm run test:fast           # 21초 (44% 개선)
```

---

## 🛠️ 개발 환경

**WSL 최적화**:

- 메모리: 20GB 할당
- .wslconfig: `dnsTunneling=true`, `autoProxy=true` (필수)
- MCP 상태: 9/9 연결 (완벽 연결!)

**MCP 연결**: 9/9 완벽 (100% 가동률) ✅

**MCP 우선 전략**: Serena (코드 분석), Vercel (배포), Context7 (문서), Shadcn-ui (UI)

- **토큰 절약**: 85% (MCP 82% + @-mention 3%)
- **핵심 서버**: vercel, serena, supabase, context7, playwright, shadcn-ui, memory, time, sequential-thinking

**상세**: @docs/claude/environment/mcp/mcp-priority-guide.md (514줄, Before/After 예시)

---

## 🎯 현재 상태

**상세**: @docs/status.md (종합 평가: 9.2/10)

---

## 🔧 트러블슈팅

**TypeScript 오류**:

```bash
npm run type-check
```

**Vercel 배포 실패**:

```bash
npm run build  # 로컬 테스트
# → Vercel 로그 확인
```

**AI CLI 도구 문제**:

```bash
# 🆕 서브에이전트 사용 (권장)
"dev-environment-manager야, AI 도구 헬스 체크해줘"

# 또는 레거시 스크립트 (기본 체크만)
./scripts/ai-tools-health-check.sh  # Deprecated - 서브에이전트 권장
```

**MCP 문제**:

```bash
claude mcp list                # 전체 서버 상태 확인
./scripts/mcp-health-check.sh  # 자동 헬스 체크 (로그 저장)
```

---

## 📚 상세 문서 (Import)

### 📖 수동 참조 (필요시만)

**아키텍처**:

- docs/claude/architecture/system-overview.md
- docs/claude/architecture/ai-cross-verification.md

**개발 환경**:

- docs/claude/environment/wsl-optimization.md
- docs/claude/environment/ai-tools-setup.md
- docs/ai/ai-maintenance.md (AI CLI 도구 유지보수)
- docs/claude/1_workflows.md ✅ **통합 워크플로우 (workflows + multi-ai 통합)**
- docs/claude/environment/mcp/mcp-configuration.md

**코딩 표준**:

- docs/claude/standards/typescript-rules.md
- docs/claude/standards/commit-conventions.md
- docs/claude/standards/git-hooks-best-practices.md

**테스트/배포**:

- docs/claude/testing/vercel-first-strategy.md
- docs/claude/deployment/vercel-optimization.md

**워크플로우**:

- docs/claude/1_workflows.md ✅ **통합 워크플로우 (일일 루틴 + Multi-AI + 서브에이전트 + MCP 우선순위)**
- ~~docs/claude/workflows/common-tasks.md~~ ❌ **제거 완료 (Phase 2A)**

---

## 📏 CLAUDE.md 크기 관리

**현재**: 292줄 ✅ (목표: 200-300줄)
**새 내용 추가 시**: Import 문서로 분리 또는 기존 내용 삭제 필수

**최적화 완료**: 2025-11-11 (281줄 → 292줄, 토큰 효율 섹션 추가)

---

## 🎓 AI 시스템 파일 구분

- **CLAUDE.md** (이 파일): Claude Code Project Memory (빠른 참조)
- **AGENTS.md**: Codex CLI 환경 가이드
- **docs/claude/**: 상세 문서 (필요 시 참조)

---

## ⚡ Quick Reference

**통합 워크플로우**: @docs/claude/1_workflows.md ✅ (일일 루틴 + Multi-AI + 서브에이전트 + MCP 우선순위)
**상세 가이드**: @docs/claude/environment/mcp/mcp-priority-guide.md
**Multi-AI 전략**: @docs/claude/environment/multi-ai-strategy.md (교차검증 상세)

---

💡 **핵심**: Type-First + MCP 우선 + Vercel 중심 + any 금지

⚠️ **주의**: 모든 수정 시 Side-Effect 분석 필수

📖 **상세**: docs/claude/ 문서 참조 (필요 시 @path/to/file.md)

---

**Important Instructions**:

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files to creating new ones
- NEVER proactively create documentation files (\*.md) or README files
- Only create documentation files if explicitly requested by the User
