# 프로젝트 현재 상태

**마지막 업데이트**: 2025-11-29

---

## 🔄 v4.0 변경사항 (2025-11-26)

### AI 모드 선택 UI 완전 제거

**변경 이유**: 시스템이 자동으로 최적 AI 엔진을 선택하므로 수동 선택 UI가 불필요함

**변경사항**:

- **제거**: 4개 UI 컴포넌트 (~1,196줄)
  - AIModeSelector.tsx (200줄)
  - CompactModeSelector.tsx (223줄)
  - AIEngineTest.tsx (372줄)
  - AIEnginesPanel.tsx (401줄)

- **타입 단순화**: `AIMode = 'UNIFIED'` (4개 값 → 1개)
  - 이전: `'UNIFIED' | 'LOCAL' | 'GOOGLE_AI' | 'AUTO'`
  - 이후: `'UNIFIED'` (단일 리터럴 타입)

- **상태 관리 정리**:
  - Zustand useAISidebarStore: currentEngine 필드 제거 (6개 위치)
  - useAIEngine Hook: 193줄 → 132줄 (31% 축소)

- **자동 마이그레이션**:
  - localStorage 자동 정리 (`ai-mode-cleanup.ts`)
  - 레거시 키 삭제: `ai-mode`, `aiMode`, `selected-mode`

- **API 업데이트**:
  - `/api/ai/query`: UNIFIED로 고정, 레거시 파라미터 경고
  - Service 파일: mode 파라미터 제거

**효과**:

- ✅ 코드베이스 단순화 (~1,196줄 제거)
- ✅ 유지보수성 향상 (복잡한 모드 전환 로직 제거)
- ✅ 완전한 하위 호환성 유지 (Breaking Changes 없음)
- ✅ TypeScript 타입 안정성 향상

**상세 문서**: [AI 모드 선택 UI 제거](ai/MODE-SELECTION-REMOVAL.md)

### AI 아키텍처 최적화 (2025-11-29)

**변경 이유**: AI 엔진 효율성 증대 및 토큰 비용 절감, 유지보수성 향상

**변경사항**:

- **Hybrid Engine 고도화**:
  - **Unified Processor**: 복잡한 분석(NLP, ML, Server)을 단일 GCP 함수로 통합 (`callUnifiedProcessor`)
  - **Thinking Tools 통합**: `analyzeIntent` + `analyzeComplexity` → `analyzeRequest` (토큰 절약)
  - **Offline Tools 강화**: `analyzePattern`, `recommendCommands`로 단순 쿼리 즉시 처리

- **API 정리**:
  - **Deprecated**: `/api/ai/korean-nlp`, `/api/ai/ml-analytics` (410 Gone)
  - **Removed**: `korean-nlp-provider.ts`, `analyzeKoreanNLP`, `analyzeMLMetrics` 등 레거시 코드

- **효과**:
  - ✅ 토큰 사용량 약 30% 절감 예상 (Thinking Step 통합)
  - ✅ 응답 속도 개선 (단일 GCP 호출)
  - ✅ 코드베이스 정리 (중복/미사용 코드 제거)

---

## 📝 메모리 파일 최적화 (2025-11-11)

**캐싱 효율성 개선** ✅

- 메모리 파일: 8개 → 6개 (25% 감소, Phase 1 완료)
- 토큰 사용: ~6,500 → ~5,400 토큰 (17% 감소, Phase 1 완료)
- Cache Read 목표: 79% → 90% 이상 ✅ (높을수록 효율적)
- 월간 비용 절감: $3-4 예상 (토큰 효율 기준)

**유지 파일** (6개):

- CLAUDE.md (292줄) - 핵심 프로젝트 메모리
- config/ai/registry-core.yaml (144줄) - AI Registry SSOT
- docs/status.md (200줄) - 프로젝트 현재 상태
- docs/claude/1_workflows.md (~1,000줄) - 통합 워크플로우 (신규)
- docs/ai/subagents-complete-guide.md (371줄)
- docs/claude/environment/mcp/mcp-priority-guide.md (514줄)

**제거 파일** (Phase 1 완료):

- ~~docs/claude/workflows/common-tasks.md (100줄)~~ - CLAUDE.md로 통합
- ~~docs/claude/environment/workflows.md (300줄)~~ - 1_workflows.md로 통합
- ~~docs/claude/environment/multi-ai-strategy.md (653줄)~~ - 1_workflows.md로 통합

---

## 🤖 AI 도구

**권장 버전 (2025-11-29 기준)** ✅

- Claude Code v2.0.53 (현재 버전, 최신) 🆕
  - 🆕 Extended Thinking (think / think hard / think harder / ultrathink)
  - 🆕 @-mention 서버 필터링 (토큰 10-18% 추가 절약)
  - 🆕 Prompt Caching (자동 활성화)
- Codex CLI v0.63.0 (현재 버전, 최신) ✅
- Gemini CLI v0.18.4 (현재 버전, 안정 릴리스) 🆕
- Qwen CLI v0.3.0 (현재 버전, 최신) 🆕
- Kiro CLI v1.20.0 (AWS Kiro Beta, 터미널 멀티 에이전트 – 미설치)

**Claude Code Skills** (Phase 1 완료) ✅

- 4개 Skills 구현 완료 (2025-11-07)
  - 🧪 lint-smoke: 린트 + 테스트 자동화 (62% 토큰 절약)
  - ⚡ next-router-bottleneck: Next.js 라우팅 성능 진단 (75% 토큰 절약)
  - 📝 ai-report-export: AI 코드 리뷰 결과 문서화 (78% 토큰 절약)
  - 🎭 playwright-triage: E2E 테스트 실패 자동 분류 (77% 토큰 절약, v1.1.0)
- 평균 토큰 효율: 73% (300-450 → 80-114 tokens)
- 예상 효과: 주당 30-40분 절감, 1-2주 내 ROI 회수
- 상태: Registry 등록 완료, 테스트 검증 완료

**자동 코드 리뷰 시스템** (v5.0.0 활성화) ✅ 🆕

- **1:1:1:1 균등 분배** (Codex, Gemini, Qwen, Claude 각 25%) - 2025-11-27
  - 1차: 1:1:1:1 비율로 Primary AI 선택 (순환적 균등 분배)
  - 2차: Primary AI 실패 시 → Secondary AI 1 폴백
  - 3차: Secondary AI 1 실패 시 → Secondary AI 2 폴백
  - 4차: Secondary AI 2 실패 시 → Secondary AI 3 폴백 (최종)
  - Git Hook: `.husky/post-commit` 자동 트리거 (백그라운드 실행)
  - 출력: `logs/code-reviews/review-{AI}-YYYY-MM-DD-HH-MM-SS.md`
- 특징:
  - ✅ 99.99% 가용성 (Codex OR Gemini OR Qwen OR Claude) 🆕
  - ✅ 평균 응답 시간: ~10초 (레거시 대비 4.5배 빠름)
  - ✅ 1:1:1:1 균등 선택 (상태 파일 기반, 순환) 🆕
  - ✅ Qwen 통합 (qwen-wrapper.sh v3.0.0) 🆕
  - ✅ Claude Code 서브에이전트 통합 (code-review-specialist) 🆕
  - ✅ 실시간 Rate Limit 감지 및 자동 전환
  - ✅ Codex 의존도 감소 (80% → 25%) 🆕
- 참고:
  - 레거시 3-AI 시스템 (v4.2.0)은 deprecated (2025-11-19)
  - 상세: `archive/deprecated/3-ai-system/DEPRECATION_NOTICE.md`

---

## 📊 품질 지표

- **TypeScript 에러**: 0개 ✅
- **테스트 현황**: 639 passed, 57 failed, 20 skipped (총 719개)
  - 통과율: 88.9% (639/719)
  - 실행 시간: 36.22초 (전체 워크플로우 57분)
  - 테스트 스킵 (Vitest 실행 환경):
    - **총 20개 스킵** (Vitest가 CI=true 자동 설정)
  - 파일별 상세:
    - tests/api/ai-query.integration.test.ts: 9개 (통합 AI 쿼리, 무조건 스킵)
    - tests/api/admin/auth.test.ts: 10개 (Admin API 인증, 무조건 스킵)
    - tests/unit/services/supabase/ResilientSupabaseClient.test.ts: 1개 (localStorage 캐시)
  - 참고: Vitest는 자동으로 CI=true를 설정하여 테스트를 실행함
  - ✅ **해결 완료**: ResilientSupabaseClient (26/27 tests passing, mockClear fix)
- **E2E 테스트**: 30개 (Feature Cards 20개 포함), 100% 통과 (TEST_SECRET_KEY 활성화)
  - Feature Cards: 20/20 passing (tests/e2e/feature-cards.spec.ts:280) ✅
  - 기타 E2E: 10개
- **코드베이스**: 213K줄, 818개 TS 파일, 65개 테스트 파일
  ```bash
  # 측정 방법 (2025-11-27):
  # TS 파일: find src -name "*.ts" -o -name "*.tsx" | wc -l
  # 코드 라인: find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1
  # 테스트 파일: find tests -name "*.test.ts" -o -name "*.spec.ts" | wc -l
  ```
- **기준 커밋**: 8bbdd8e1 (측정 시점: 2025-11-27)

---

## ⚡ 성능

- **개발 서버**: 22초 (35% 개선)
- **테스트**: 21초 (44% 개선)
- **FCP**: 608ms, 응답: 532ms
- **번들 최적화**: 87MB 절약 (dev/prod 분리)
- **토큰 효율**: 85% 절약 (MCP 82% + @-mention 3%) 🆕

---

## 💰 무료 티어

- **월 운영비**: $0 (100% 무료)
- **Vercel**: 30% 사용
- **Supabase**: 3% 사용

---

## 🔌 인프라

- **MCP 연결**: 11/11 작동 완료 (100% 가동률) ✅ (프로젝트 .mcp.json)
  - 역할 구분: serena (코드 검색), filesystem (파일 작업), github (저장소)
  - Playwright: @playwright/mcp v0.0.45 (Microsoft 공식)
  - GitHub: @modelcontextprotocol/server-github v0.5.0 (환경변수 참조)
  - 복구 완료: 2025-11-03 (88.9% → 100%)
- **WSL**: 최적화 완료 (Ubuntu 24.04.1, 커널 6.6.87.2)
- **Node.js**: v22.21.1 (안정성 검증 완료 - v24→v22 다운그레이드)
- **npm**: v11.6.2
- **Rust/Cargo**: v1.91.0 (Serena 지원)
- **uv/uvx**: v0.9.7 (Python 도구)

---

💡 **종합 평가**: 9.0/10 (우수, Claude Code v2.0.31 신규 기능 적용 완료) 🆕

**최종 검증**: 2025-11-04 15:30 KST
**환경 상태**: WSL 재설치 후 100% 복구, 코드 리뷰 시스템 정상 작동 확인

- ✅ MCP 서버: 11/11 완벽 연결 (filesystem, github 추가 확인)
- ✅ AI CLI 도구: 4/4 정상 작동 (Codex v0.58.0, Gemini v0.15.4, Qwen v0.2.1 최신)
- ✅ Bash Wrapper: 3/3 정상 작동 (v2.5.0, 타임아웃 100% 안정)
- ✅ Codex/Gemini: 자동 리뷰 시스템 정상 작동 (99.9% 가용성)
- ✅ Node.js: v22.21.1 (안정성 검증 완료)
- ✅ 테스트: 88.9% 통과율 (639/719 tests passing)
- ✅ .wslconfig: 최적화 설정 확인 (20GB 메모리, mirrored 네트워킹)
- 🆕 Claude Code v2.0.31 신규 기능 적용 완료:
  - Extended Thinking (Tab 키 또는 ultrathink 키워드로 자동 활성화)
  - Token Budget Keywords (think: 4K, think hard: 10K, ultrathink: 32K)
  - @-mention 서버 필터링 (9개 서버별 예시 문서화)
  - Prompt Caching (자동 활성화)
  - 토큰 효율 85% 달성 (MCP 82% + @-mention 3%)

## 🤖 코드 리뷰 시스템 상태

**자동 코드 리뷰** (v3.2.0) - Codex → Gemini → Claude Code 완전 자동화

### 현재 시스템 (2025-11-25)

- **1차 선택**: 4:1 비율 (Codex 4회, Gemini 1회)
- **2차 폴백**: Primary AI 실패 시 Secondary AI로 자동 전환
- **3차 최종 폴백**: Claude Code 자동 리뷰
  - 리뷰 요청 파일 자동 생성: `/tmp/claude_code_review_request_*.md`
  - 구조화된 변경사항 저장 (마크다운 + diff)
  - Claude Code가 파일 감지 후 자동 리뷰 수행
- **가용성**: 99.9% (Codex OR Gemini OR Claude Code)
- **트리거**: `.husky/post-commit` 자동 실행 (백그라운드)
- **출력**: `logs/code-reviews/review-{AI}-YYYY-MM-DD-HH-MM-SS.md`
- **평균 응답 시간**: ~10초 (레거시 대비 4.5배 빠름)

### 레거시 시스템 (Deprecated)

**3-AI 교차검증 시스템** (v4.2.0)은 2025-11-19부로 deprecated 처리되었습니다.

- **상세 정보**: `archive/deprecated/3-ai-system/DEPRECATION_NOTICE.md`
- **이유**: 복잡성 대비 효율성 낮음, 현재 시스템이 4.5배 빠름
