# 서브에이전트 목록 및 역할 분석

**날짜**: 2025-10-05
**프로젝트**: OpenManager VIBE v5.80.0

---

## 📊 개요

Claude Code Task 도구에서 사용 가능한 서브에이전트 16개의 역할과 도구 접근 권한을 분석합니다.

---

## 🎯 서브에이전트 전체 목록

| # | 서브에이전트 | 우선순위 | 역할 | 주요 도구 |
|---|-------------|----------|------|----------|
| 1 | **general-purpose** | 기본 | 일반 목적 (코드 검색, 복잡한 작업) | 모든 도구 (*) |
| 2 | **statusline-setup** | 설정 | Claude Code statusline 설정 | Read, Edit |
| 3 | **output-style-setup** | 설정 | Claude Code output style | Read, Write, Edit, Glob, Grep |
| 4 | **security-specialist** | CRITICAL | 보안 전문가 (취약점, 인증, SLA 99.9%) | Read, Grep, Bash, Glob, MCP (supabase, serena) |
| 5 | **gcp-cloud-functions-specialist** | - | GCP Functions 전문가 (서버리스 배포) | Read, Write, Edit, Bash, Grep, MCP (gcp, serena) |
| 6 | **documentation-manager** | PROACTIVE | 문서 관리 (JBGE 원칙, docs 체계화) | Read, Write, Edit, MultiEdit, Glob, Grep, LS, MCP (context7, memory, serena) |
| 7 | **dev-environment-manager** | PROACTIVE | 개발 환경 관리 (WSL, Node.js, 도구 통합) | Read, Write, Edit, Bash, Glob, LS, MCP (memory, time, serena) |
| 8 | **debugger-specialist** | PROACTIVE | 디버깅 및 근본 원인 분석 | Read, Grep, Bash, LS, Glob, MCP (serena, gcp) |
| 9 | **database-administrator** | HIGH | Supabase PostgreSQL 전문가 (쿼리 최적화, RLS) | MCP (supabase, serena) |
| 10 | **code-review-specialist** | - | 코드 품질 검토 (PR, TypeScript strict, shadcn/ui) | Read, Grep, Glob, Bash, TodoWrite, MCP (serena) |
| 11 | **test-automation-specialist** | PROACTIVE | 테스트 자동화 (Vitest, Playwright E2E) | Read, Write, Edit, Bash, Glob, Grep, MCP (playwright, serena) |
| 12 | **structure-refactor-specialist** | PROACTIVE | 구조 설계 및 리팩토링 (아키텍처 패턴) | Read, Write, Edit, MultiEdit, Glob, Grep, TodoWrite, MCP (serena) |
| 13 | **spec-driven-specialist** | - | 계획 대비 결과 분석 평가 | Read, Write, Edit, MultiEdit, TodoWrite, Glob, Grep, MCP (memory, sequential-thinking, serena) |
| 14 | **vercel-platform-specialist** | - | Vercel 플랫폼 최적화 (Edge Functions, 무료 티어) | Read, Write, Edit, Bash, Grep, MCP (vercel, serena) |
| 15 | **ui-ux-specialist** | - | UI/UX 전문가 (디자인 시스템, 사용자 경험) | Read, Write, Edit, MultiEdit, Glob, Grep, MCP (memory, sequential-thinking, shadcn-ui, serena) |
| 16 | **verification-recorder** | - | AI 교차검증 결과 자동 저장 (히스토리 관리) | Write, Read, Bash |

---

## 🔍 우선순위별 분류

### CRITICAL (최우선)
- **security-specialist**: 보안 취약점 스캔, 인증/인가 검증, SLA 99.9% 보장

### HIGH (높음)
- **database-administrator**: Supabase RLS 정책, 쿼리 최적화, 마이그레이션

### PROACTIVE (사전 실행 권장)
- **documentation-manager**: 문서 관리 자동화 (JBGE 원칙)
- **dev-environment-manager**: 환경 설정 자동화
- **debugger-specialist**: 복잡한 버그 디버깅
- **test-automation-specialist**: 코드 변경 후 자동 테스트
- **structure-refactor-specialist**: 아키텍처 리팩토링

---

## 📝 주요 서브에이전트 상세 분석

### 1. security-specialist (CRITICAL)
**역할**: 종합 보안 전문가
- 취약점 스캔
- 인증/인가 검증
- 배포 전 필수 보안 감사
- SLA 99.9% 보장

**도구**:
- Read, Grep, Bash, Glob
- MCP: supabase (get_advisors), serena (분석 도구)

**사용 시기**: 배포 전, API 변경 시, 보안 검토 필요 시

---

### 2. documentation-manager (PROACTIVE)
**역할**: 문서 관리 전문가
- JBGE 원칙 적용
- 루트 파일 정리
- docs 폴더 체계화

**도구**:
- Read, Write, Edit, MultiEdit, Glob, Grep, LS
- MCP: context7 (라이브러리 문서), memory (지식 그래프), serena (코드 분석)

**사용 시기**: 문서 업데이트, 새 기능 문서화, 구조 정리

---

### 3. database-administrator (HIGH)
**역할**: Supabase PostgreSQL 전문가
- 쿼리 최적화
- RLS 정책 관리
- 마이그레이션 자동화

**도구**:
- MCP: supabase (execute_sql, list_tables, apply_migration)
- MCP: serena (코드 검색)

**사용 시기**: DB 스키마 변경, RLS 정책 추가, 성능 최적화

---

### 4. test-automation-specialist (PROACTIVE)
**역할**: 테스트 자동화 전문가
- Vitest 유닛 테스트
- Playwright E2E 테스트
- 테스트 커버리지 관리

**도구**:
- Read, Write, Edit, Bash, Glob, Grep
- MCP: playwright (E2E), serena (코드 분석)

**사용 시기**: 코드 변경 후 자동 실행, 배포 전 검증

---

### 5. vercel-platform-specialist
**역할**: Vercel 플랫폼 최적화 전문가
- Edge Functions 관리
- 배포 설정 최적화
- 무료 티어 활용

**도구**:
- Read, Write, Edit, Bash, Grep
- MCP: vercel (배포 관리), serena (코드 검색)

**사용 시기**: 배포 최적화, Edge Functions 개발, 성능 튜닝

---

### 6. verification-recorder
**역할**: AI 교차검증 결과 저장 전문가
- 히스토리 파일 생성
- 인덱스 자동 업데이트
- reports/quality/ai-verifications/ 관리

**도구**:
- Write, Read, Bash

**사용 시기**: AI 교차검증 완료 후 자동 실행

---

## ⚠️ Multi-AI MCP vs Task Tool 비교

### Multi-AI MCP (✅ 교차검증 전용)
**역할**: 3-AI 교차검증 시스템 (Codex + Gemini + Qwen)

**장점**:
- ✅ 실제 외부 AI CLI 병렬 실행
- ✅ 구조화된 JSON 결과
- ✅ 자동 합의 분석 (synthesis.consensus)
- ✅ 자동 충돌 감지 (synthesis.conflicts)
- ✅ 성능 추적 (응답 시간, 성공률)

**사용법**:
```typescript
mcp__multi_ai__queryAllAIs({
  query: "검증 내용",
  qwenPlanMode: false
})
```

### Task Tool 서브에이전트 (❌ 교차검증 불가)
**역할**: Claude가 특정 관점으로 역할극하는 내부 에이전트

**제한사항**:
- ❌ 실제 외부 AI 호출 안 됨
- ❌ Claude의 단일 관점만 제공
- ❌ 진정한 교차검증 불가능

**권장 사항**:
- AI 교차검증은 **반드시 Multi-AI MCP 사용**
- Task Tool은 코드 분석, 문서화, 테스트 등 **단일 작업에만 사용**

---

## 📊 MCP 도구 접근 권한 분석

| 서브에이전트 | MCP 도구 |
|-------------|----------|
| **security-specialist** | supabase (get_advisors), serena (분석) |
| **gcp-cloud-functions-specialist** | gcp (query-logs, query-metrics), serena |
| **documentation-manager** | context7, memory, serena |
| **dev-environment-manager** | memory, time, serena |
| **debugger-specialist** | serena, gcp (query_logs) |
| **database-administrator** | supabase (전체), serena |
| **code-review-specialist** | serena (find_symbol, find_referencing_symbols) |
| **test-automation-specialist** | playwright, serena |
| **structure-refactor-specialist** | serena (전체 심볼 도구) |
| **spec-driven-specialist** | memory, sequential-thinking, serena |
| **vercel-platform-specialist** | vercel (전체), serena |
| **ui-ux-specialist** | memory, sequential-thinking, shadcn-ui, serena |

---

## 🎯 권장 사용 패턴

### 1. AI 교차검증 (✅ Multi-AI MCP 전용)
```typescript
// ✅ 올바른 방법
mcp__multi_ai__queryAllAIs({
  query: "코드 검증",
  qwenPlanMode: false
})

// ❌ 잘못된 방법 (Claude 역할극)
Task("codex-specialist", "코드 검증")
```

### 2. 보안 검토 (security-specialist)
```typescript
Task("security-specialist", "취약점 스캔 및 RLS 정책 검증")
```

### 3. 문서 관리 (documentation-manager)
```typescript
Task("documentation-manager", "Multi-AI MCP 문서 최신화")
```

### 4. 테스트 자동화 (test-automation-specialist)
```typescript
Task("test-automation-specialist", "E2E 테스트 실행 및 커버리지 확인")
```

### 5. Vercel 배포 (vercel-platform-specialist)
```typescript
Task("vercel-platform-specialist", "Edge Functions 최적화 및 배포")
```

---

## 📌 결론

**핵심 원칙**:
1. **AI 교차검증**: 반드시 Multi-AI MCP 사용 (Task Tool 금지)
2. **보안 검토**: security-specialist (CRITICAL)
3. **문서 관리**: documentation-manager (PROACTIVE)
4. **테스트 자동화**: test-automation-specialist (PROACTIVE)
5. **DB 작업**: database-administrator (HIGH)

**MCP 우선 정책** (2025-10-05):
- Multi-AI 교차검증: `mcp__multi_ai__queryAllAIs` 우선
- Bash CLI Wrapper: MCP 연결 실패 시만 대안
- Task Tool: 코드 분석, 문서화, 테스트 등 단일 작업에만 사용
