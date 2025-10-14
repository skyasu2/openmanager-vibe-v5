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

# Claude Code v2.0
/rewind                     # Checkpoints 복원
/usage                      # 사용량 확인
npx ccusage@latest          # 상세 토큰 분석
npx ccstatusline@latest     # Status Line 설정
Esc Esc                     # 빠른 복원
```

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
- **Claude Code**: 최종 결정자 (3-AI 평가/통합)
- **Codex**: 실무 버그 수정 (2초)
- **Gemini**: SOLID 아키텍처 (11초)
- **Qwen**: 성능 최적화 (6초)

**호출 조건**:
- 복잡한 버그 (근본 원인 불명확)
- 아키텍처 결정 (SOLID 검토, 대규모 리팩토링)
- 성능 이슈 (병목점 분석, 알고리즘 최적화)
- 기술 선택 (다양한 관점 필요)

**사용법**: 
```bash
# 교차검증 요청
"useState vs useReducer를 AI 교차검증해줘"

# 서브에이전트 직접 호출
Task multi-ai-verification-specialist "LoginClient.tsx 검증"
```

**상세**: @docs/claude/environment/multi-ai-strategy.md

---

## 🎭 서브에이전트 활용 (18개 전문가)

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
function getData(id: any): any { }  // 절대 금지
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
- MCP 상태: 9/9 완벽 연결

**MCP 서버** (9/9 완벽 연결):
- ✅ vercel (OAuth 안정화, v2.0.5+ 패치)
- ✅ serena, supabase, context7, playwright
- ✅ memory, time, sequential-thinking, shadcn-ui

**MCP 우선순위 (82% 토큰 절약)**:
- 코드 분석: **Serena** (Read 대신, 3-5배 빠름)
- Vercel 조회: **Vercel MCP** (CLI 대신, 89배 빠름)
- 라이브러리 문서: **Context7** (WebSearch 대신, 100% 정확)
- UI 컴포넌트: **Shadcn-ui MCP** (최신 v4)

**상세**: @docs/claude/environment/mcp/mcp-priority-guide.md (Before/After 예시 포함)

### 🎯 MCP 토글 기능 (v2.0.10+)

**선택적 사용** - @-mention으로 특정 서버만 활성화:

```bash
# 예시: serena만 활성화
@serena 이 컴포넌트 구조 분석해줘

# 예시: context7만 활성화
@context7 Next.js 15 server actions 문서

# 예시: vercel만 활성화
@vercel 최신 배포 상태 확인
```

**효과**: 추가 10-18% 토큰 절약 (55토큰 → 45-50토큰)

**권장**: 일반 사용은 기본 설정 유지 (이미 충분히 효율적)

### ⚡ Serena MCP 주의사항

**루트 작업 시 필수**: `skip_ignored_files: true` (48배 빠름)
**대규모 검색**: 특정 디렉토리 지정 (`relative_path: "src"`)

---

## 🎯 현재 상태 (2025-10-15)

**품질**:
- TypeScript 에러: 0개 ✅
- E2E 테스트: 18개, 98.2% 통과
- 코드베이스: 226K줄, 873개 TS 파일

**성능**:
- 개발 서버: 22초 (35% 개선)
- 테스트: 21초 (44% 개선)
- FCP: 608ms, 응답: 532ms

**무료 티어**:
- 월 운영비: $0 (100% 무료)
- Vercel: 30% 사용
- Supabase: 3% 사용

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

**MCP 문제**:
```bash
claude mcp list
./scripts/mcp-health-check.sh
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

**현재 크기**: 255줄 (목표 달성! ✅)
**목표**: 200-300줄 유지
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
- NEVER proactively create documentation files (*.md) or README files
- Only create documentation files if explicitly requested by the User
