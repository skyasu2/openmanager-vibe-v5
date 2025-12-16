# CLAUDE.md - OpenManager VIBE Project Memory

**한국어로 우선 대화, 기술용어는 영어 사용허용**

---

## 📦 핵심 정보

**프로젝트**: OpenManager VIBE v5.82.0 - AI 기반 실시간 서버 모니터링 플랫폼
**환경**: WSL + Claude Code v2.0.62 + Codex/Gemini/Qwen 리뷰 + Jules 비동기
**스택**: Next.js 16, React 19, TypeScript 5.9 strict, Vercel + Supabase

---

## 🚀 빠른 시작

```bash
# 개발
npm run dev:stable          # 안정화된 개발 서버
npm run validate:all        # Biome+타입+테스트

# 테스트 (Vercel 중심)
npm run test:vercel:e2e     # Vercel E2E (권장)
npm run test:super-fast     # 11초 빠른 테스트

# 배포
git push                    # Vercel 자동 배포

# Claude Code v2.0.31+
/rewind                     # Checkpoints 복원
/usage                      # 사용량 확인
npx ccusage@latest          # 상세 토큰 분석

# Extended Thinking
Tab 키 토글 | Token Budget: think(4K) < think hard(10K) < ultrathink(32K)

# @-mention 서버 필터링 (v2.0.10+)
@serena "코드 검색"             # Serena만 활성화 → 10-18% 추가 절약
@context7 "Next.js 16 문서"    # Context7만 활성화
@vercel "배포 상태 확인"       # Vercel만 활성화
@figma "디자인 코드 생성"      # Figma만 활성화 (6회/월 한도 주의!)

# Jules (비동기 대형 작업) - Google AI Pro 포함
jules new "테스트 일괄 생성"    # 백그라운드 실행 → PR 생성
jules remote list --session    # 활성 세션 확인
jules remote pull --session ID --apply  # 결과 적용

# 버전 관리 (standard-version)
npm run release:patch         # 버그 수정 (fix:)
npm run release:minor         # 새 기능 (feat:)
npm run release:major         # 호환성 파괴 (BREAKING CHANGE:)
npm run release:first         # 첫 릴리스 (0.0.0 → 1.0.0)
```

### 📦 버전 관리 가이드

**standard-version 자동 버전 결정** (Conventional Commits 기반):
- `fix:` → patch (예: 5.81.0 → 5.81.1)
- `feat:` → minor (예: 5.81.0 → 5.82.0)
- `BREAKING CHANGE:` 또는 `feat!:` → major (예: 5.81.0 → 6.0.0)

```bash
# 일반적인 릴리스 워크플로우
git add . && git commit -m "feat: 새로운 기능"
npm run release:minor         # CHANGELOG 생성 + 태그 + 커밋
git push --follow-tags        # 태그와 함께 푸시
```

---

## 💡 핵심 원칙

1. **Type-First**: 타입 정의 → 구현 → 리팩토링
2. **any 금지**: TypeScript strict mode 100%
3. **Vercel 중심**: 실제 환경 우선 테스트
4. **MCP 필요시 사용**: 복잡한 작업 시 MCP 서버 활용 (85% 토큰 절약 가능)
5. **Side-Effect First**: 테스트/문서/의존성 동시 수정
6. **UX Obsession**: 사용자 경험 최우선 (Premium Quality)
7. **Simplicity**: 코드는 읽기 쉽고 단순하게 유지 (KISS)

### 작업 전 필수 체크

1. 중복 기능 검색 (@serena)
2. 레거시 코드 정리
3. 영향 범위 분석

---

## 🎭 서브에이전트 & Skills

### 서브에이전트 (8개)

**호출**: `Task [에이전트명] "[작업]"`

| 우선순위 | 에이전트 | 용도 |
|----------|----------|------|
| CRITICAL | security-specialist | 보안 감사, 취약점 스캔 |
| HIGH | debugger-specialist | 버그 분석, 근본 원인 추적 |
| HIGH | architecture-specialist | 아키텍처 설계, 모듈화/리팩토링 |
| HIGH | code-review-specialist | 통합 코드 품질 검토 |
| HIGH | test-automation-specialist | Vitest + Playwright 테스트 |
| HIGH | performance-specialist | Core Web Vitals, 번들 최적화 |
| HIGH | ui-ux-specialist | UI/UX, React 19 + Figma 연동 |
| MEDIUM | documentation-manager | JBGE 문서 관리 |

### 자동 서브에이전트 호출

| 상황 | 서브에이전트 |
|------|-------------|
| 보안 파일 변경 (auth, env, api) | `security-specialist` |
| 소스 코드 변경 | `test-automation-specialist` |
| 아키텍처/구조 변경 | `architecture-specialist` |
| 복잡한 로직, 중요 PR | `code-review-specialist` |
| UI 컴포넌트 + Figma 디자인 | `ui-ux-specialist` |

### Skills (7개)

**호출**: `Skill [스킬명]`

| 스킬 | 용도 |
|------|------|
| lint-smoke | 린트 + 테스트 자동화 |
| playwright-triage | E2E 테스트 실패 분류 |
| ai-code-review | AI 코드 리뷰 오케스트레이션 |
| security-audit-workflow | 배포 전 보안 감사 |

**전체 목록**: @config/ai/registry-core.yaml (SSOT)

---

## 🛠️ 개발 환경

**MCP 연결**: 9/9 완벽 (100% 가동률)

| MCP | 역할 | 한도 |
|-----|------|------|
| serena | 코드 검색/메모리 | 무제한 |
| context7 | 라이브러리 문서 | 무제한 |
| vercel | 배포 상태 확인 | 무제한 |
| supabase | DB 관리 | 무제한 |
| playwright | E2E 테스트 | 무제한 |
| github | PR/Issue 관리 | 무제한 |
| **figma** | **Design-to-Code** | **6회/월** |
| tavily | 심층 리서치 | 1,000/월 |
| brave-search | 팩트체크 | 2,000/월 |

**상세**: @config/ai/registry-core.yaml, @docs/development/mcp/mcp-priority-guide.md

### 외부 AI CLI 도구

| 도구 | 용도 | 실행 방식 | 한도 |
|------|------|----------|------|
| **Claude Code** | 실시간 개발 | 동기 (실시간) | 구독 |
| **Codex/Gemini/Qwen** | 코드 리뷰 | 동기 (3-AI 순환) | 무제한 |
| **Jules** | 대형 작업 (테스트/리팩토링) | **비동기 (백그라운드)** | 100/일 (Pro) |

**Jules 활용 원칙**: 대형 작업은 Jules로 백그라운드 실행 → Claude Code로 다른 작업 계속

---

## 🧪 테스트 전략

**우선순위**:
1. 🔴 **Vercel E2E** (실제 환경) - 98.2% 통과율
2. 🟡 **API Routes** (성능 측정)
3. 🔵 **Unit 테스트** (필요 시만)

```bash
npm run test:vercel:full    # 종합 검증
npm run test:super-fast     # 11초
```

---

## 🎯 현재 상태

**상세**: @docs/status.md (종합 평가: 9.0/10)

---

## 🔧 트러블슈팅

```bash
npm run type-check          # TypeScript
npm run build               # Vercel 배포
claude mcp list             # MCP 상태
```

---

## 📚 문서 참조

| 문서 | 용도 |
|------|------|
| config/ai/registry-core.yaml | AI 설정 SSOT |
| docs/status.md | 기술 스택/상태 |
| docs/development/mcp/mcp-priority-guide.md | MCP 활용 가이드 |

---

💡 **핵심**: Type-First + MCP 필요시 사용 + Vercel 중심 + any 금지

⚠️ **주의**: 작업 전 중복 검색 → 레거시 정리 → 영향 범위 분석 → Vercel E2E 테스트

---

**Important Instructions**:

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files to creating new ones
- NEVER proactively create documentation files (\*.md) or README files
- Only create documentation files if explicitly requested by the User
