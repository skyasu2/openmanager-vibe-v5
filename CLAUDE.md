# CLAUDE.md - OpenManager VIBE Project Memory

**한국어로 우선 대화, 기술용어는 영어 사용허용**

---

## 📦 핵심 정보

**프로젝트**: OpenManager VIBE v5.80.0 - AI 기반 실시간 서버 모니터링 플랫폼
**환경**: WSL + Claude Code v2.0.14 + Multi-AI 협업
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

# Claude Code v2.0.22 🆕
/rewind                     # Checkpoints 복원
/usage                      # 사용량 확인
npx ccusage@latest          # 상세 토큰 분석
Esc Esc                     # 빠른 복원
# 🆕 Haiku 4.5: 빠른 탐색용, Explore 서브에이전트
# 🆕 Claude Skills: 고급 기능 지원
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
4. **MCP 우선**: 82% 토큰 절약 (Read → Serena, WebSearch → Context7)
5. **Side-Effect First**: 테스트/문서/의존성 동시 수정

---

## 🤖 Multi-AI 교차검증

**⚠️ 트리거**: "AI 교차검증" 명시 시에만 활성화 (일반 개발은 Claude 단독)

**4-AI 역할**:

- **Claude Code**: 메인 개발자 (코딩, 문서, 모든 구현) + 최종 결정자
- **Codex**: 실무 검증 (버그 분석, 개선 제안) - 2초
- **Gemini**: 아키텍처 검증 (SOLID 검토, 설계 리뷰) - 11초
- **Qwen**: 성능 검증 (병목 분석, 최적화 제안) - 6초

**핵심 원칙**:

- ✅ **개발/구현**: Claude Code 전담
- ✅ **검증/리뷰**: Codex/Gemini/Qwen (사용자 명시 시만)
- ⚠️ **예외**: 사용자가 특정 AI에게 직접 개발 지시한 경우만
  - 예: "Codex야 이 코드 짜줘" - OK (명시적 지시)

**검증 호출 조건**:

- 복잡한 버그 (근본 원인 불명확) → Codex 검증
- 아키텍처 결정 (SOLID 검토, 대규모 리팩토링) → Gemini 검증
- 성능 이슈 (병목점 분석, 알고리즘 최적화) → Qwen 검증
- 종합 검토 (다양한 관점 필요) → 3-AI 교차검증

**사용법**:

```bash
# 교차검증 요청
"useState vs useReducer를 AI 교차검증해줘"

# 서브에이전트 직접 호출
Task multi-ai-verification-specialist "LoginClient.tsx 검증"
```

**상세**: @docs/claude/environment/multi-ai-strategy.md

---

## 🎭 서브에이전트 활용 (12개 전문가)

### 호출 방법

```bash
Task [에이전트명] "[작업 요청]"
```

### 핵심 서브에이전트

- **multi-ai-verification-specialist**: 3-AI 교차검증
- **code-review-specialist**: TypeScript strict 검토
- **vercel-platform-specialist**: 배포 및 최적화
- **security-specialist**: 보안 감사
- **test-automation-specialist**: E2E 테스트

**전체 목록**: @docs/ai/subagents-complete-guide.md
**설정 레지스트리**: @config/ai/registry.yaml (SSOT)

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

**MCP 서버** (9/9 연결): ✅ **완벽 연결!**

- ✅ **vercel** (@open-mcp/vercel v0.0.13, stdio 방식)
  - OAuth 버그 우회: HTTP → stdio + API_KEY
  - Claude Code v2.0.14 OAuth 버그 (invalid_scope) 해결
- ✅ serena, supabase, context7, playwright
- ✅ memory, time, sequential-thinking, shadcn-ui

**MCP 우선순위 (82% 토큰 절약)**:

- 코드 분석: **Serena** (Read 대신, 3-5배 빠름)
- Vercel 조회: **Vercel MCP** (CLI 대신, 89배 빠름)
- 라이브러리 문서: **Context7** (WebSearch 대신, 100% 정확)
- UI 컴포넌트: **Shadcn-ui MCP** (최신 v4)

**상세**: @docs/claude/environment/mcp/mcp-priority-guide.md (Before/After 예시 포함)

### 🎯 @-mention 토큰 절약 (v2.0.10+)

특정 MCP 서버만 활성화: `@serena 구조 분석`, `@context7 문서`, `@vercel 배포 확인`
**효과**: 10-18% 추가 절약

### 📋 MCP 사용 팁

- **코드 분석**: Serena (500줄+), Read (100줄-)
- **정보 조회**: Vercel MCP (89배 빠름), Context7 (100% 정확)
- **토큰 절약**: @-mention으로 특정 서버만 활성화

**상세 가이드**: @docs/claude/environment/mcp/mcp-priority-guide.md

---

## 🎯 현재 상태 (2025-10-24)

**종합 평가**: 9.2/10 (매우 건강한 상태)

- ✅ TypeScript 에러: 0개
- ✅ MCP 연결: 9/9 (100%)
- ✅ AI 도구: 최신 버전 (4/4)
- ✅ 무료 티어: 월 $0

**상세**: @docs/status.md

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
- docs/claude/environment/workflows.md
- docs/claude/environment/mcp/mcp-configuration.md

**코딩 표준**:

- docs/claude/standards/typescript-rules.md
- docs/claude/standards/commit-conventions.md
- docs/claude/standards/git-hooks-best-practices.md

**테스트/배포**:

- docs/claude/testing/vercel-first-strategy.md
- docs/claude/deployment/vercel-optimization.md

**워크플로우**:

- docs/claude/workflows/common-tasks.md

---

## 📏 CLAUDE.md 크기 관리

**현재**: 305줄 ✅ (목표: 200-300줄)
**새 내용 추가 시**: Import 문서로 분리 또는 기존 내용 삭제 필수

---

## 🎓 AI 시스템 파일 구분

- **CLAUDE.md** (이 파일): Claude Code Project Memory (빠른 참조)
- **AGENTS.md**: Codex CLI 환경 가이드
- **docs/claude/**: 상세 문서 (필요 시 참조)

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
