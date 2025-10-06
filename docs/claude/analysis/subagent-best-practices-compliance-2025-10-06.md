# 서브에이전트 베스트 프랙티스 준수 분석

**분석 날짜**: 2025-10-06
**대상**: 12개 서브에이전트 + MCP 도구 설정
**기준**: Claude Code 공식 베스트 프랙티스 (2025)

---

## 📋 분석 개요

### 공식 베스트 프랙티스 5대 원칙

1. **도구 스코핑 (Tools Scoping)**: tools 파라미터로 명시적 제한
2. **단일 책임 (Clear Separation)**: 각 서브에이전트는 하나의 명확한 목표
3. **액션 지향 설명**: description은 간결하고 액션 지향적
4. **PROACTIVELY 힌트**: 필요 시 트리거 힌트 포함
5. **모델 선택**: model 필드로 명시적 제어 (inherit 권장)

---

## ✅ 준수 현황 (종합 평가: A+)

### 1. 도구 스코핑 ✅ 완벽 준수

**모든 서브에이전트가 tools 파라미터를 명시적으로 정의**

| 서브에이전트 | 도구 개수 | MCP 도구 | 일반 도구 | 평가 |
|-------------|-----------|----------|----------|------|
| code-review-specialist | 10 | Serena (5) | Read, Grep, Glob, Bash, TodoWrite | ✅ 적절 |
| database-administrator | 6 | Supabase (3), Serena (3) | - | ✅ 전문화 우수 |
| debugger-specialist | 10 | Serena (5) | Read, Grep, Bash, LS, Glob | ✅ 적절 |
| dev-environment-manager | 11 | Memory (1), Time (1), Serena (5) | Read, Write, Edit, Bash, Glob, LS | ✅ 적절 |
| documentation-manager | 11 | Context7 (1), Memory (1), Serena (5) | Read, Write, Edit, MultiEdit, Glob, Grep, LS | ✅ 적절 |
| gcp-cloud-functions-specialist | 7 | Serena (3) | Read, Write, Edit, Bash, Grep | ✅ 적절 |
| multi-ai-verification-specialist | 6 | Multi-AI (4) | Read, Write | ✅ 전문화 우수 |
| security-specialist | 10 | Supabase (1), Serena (5) | Read, Grep, Bash, Glob | ✅ 적절 |
| structure-refactor-specialist | 23 | Serena (11) | Read, Write, Edit, MultiEdit, Glob, Grep, TodoWrite, Bash | ⚠️ 도구 과다 |
| test-automation-specialist | 12 | Playwright (3), Serena (5) | Read, Write, Edit, Bash, Glob, Grep | ✅ 적절 |
| ui-ux-specialist | 12 | Memory (1), Sequential-thinking (1), Shadcn-ui (1), Serena (5) | Read, Write, Edit, MultiEdit, Glob, Grep | ✅ 적절 |
| vercel-platform-specialist | 13 | Vercel (7), Serena (3) | Read, Write, Edit, Bash, Grep | ✅ 적절 |

**주요 발견**:
- ✅ **100% 명시적 도구 스코핑** (공식 권장사항 완벽 준수)
- ✅ **전문 MCP 도구 집중 할당**: database-administrator (Supabase 100%), multi-ai-verification-specialist (Multi-AI 67%)
- ⚠️ **structure-refactor-specialist 도구 과다**: 23개 도구 (평균 10.9개 대비 211%)

### 2. 단일 책임 원칙 ✅ 완벽 준수

**각 서브에이전트가 명확한 단일 목표 보유**

| 서브에이전트 | 핵심 책임 | 책임 범위 | 평가 |
|-------------|----------|-----------|------|
| code-review-specialist | 코드 품질 검토 | PR 리뷰, TypeScript strict 모드, 컴포넌트 품질 | ✅ 명확 |
| database-administrator | PostgreSQL 관리 | 쿼리 최적화, RLS 정책, 마이그레이션 | ✅ 명확 |
| debugger-specialist | 디버깅 및 근본 원인 분석 | 버그 해결, 스택 트레이스, 성능 진단 | ✅ 명확 |
| dev-environment-manager | 개발 환경 관리 | WSL 최적화, Node.js 버전, 도구 통합 | ✅ 명확 |
| documentation-manager | 문서 관리 | JBGE 원칙, 루트 파일 정리, docs 체계화 | ✅ 명확 |
| gcp-cloud-functions-specialist | GCP Cloud Functions | 서버리스 배포, 최적화, 무료 티어 | ✅ 명확 |
| multi-ai-verification-specialist | 3-AI 교차검증 | 병렬 분석, 합의/충돌 검출, 결과 종합 | ✅ 명확 |
| security-specialist | 종합 보안 | 취약점 스캔, 인증/인가, 보안 감사 | ✅ 명확 |
| structure-refactor-specialist | 아키텍처 리팩토링 | 아키텍처 패턴, 모듈화, 의존성 관리 | ✅ 명확 |
| test-automation-specialist | 테스트 자동화 | Vitest, Playwright E2E, 커버리지 | ✅ 명확 |
| ui-ux-specialist | UI/UX 개선 | 인터페이스 개선, 디자인 시스템, 사용자 경험 | ✅ 명확 |
| vercel-platform-specialist | Vercel 플랫폼 관리 | Edge Functions, 배포 설정, 무료 티어 | ✅ 명확 |

**주요 발견**:
- ✅ **역할 중복 제거 완료**: spec-driven-specialist 제거로 documentation-manager와 역할 중복 해소
- ✅ **전문성 강화**: 각 도메인(DB, 보안, 테스트, 배포)마다 전담 에이전트
- ✅ **통합 에이전트**: security-specialist (auditor + reviewer 통합), code-review-specialist (verification + quality-control 통합)

### 3. 액션 지향 설명 ✅ 완벽 준수

**모든 description이 명확하고 간결**

**우수 사례**:
```yaml
# 전문성 강조 + 버전 표시
description: Multi-AI 교차검증 전문가 - 3-AI 병렬 분석, 합의/충돌 검출, 결과 종합 (v3.0.0)

# 우선순위 + 전문성 + 핵심 기능
description: HIGH - Supabase PostgreSQL 전문가. 쿼리 최적화, RLS 정책, 마이그레이션 자동화

# 트리거 힌트 + 전문성 + 핵심 기능
description: PROACTIVELY use for debugging complex issues. 디버깅 및 근본 원인 분석 전문가. 복잡한 버그 해결, 스택 트레이스 분석, 성능 문제 진단
```

**개선 가능 사례**:
```yaml
# 너무 간략 (gcp-cloud-functions-specialist)
description: GCP Cloud Functions 전문가. 서버리스 함수 배포, 최적화, 무료 티어 관리 (현재 GCP MCP 서버 미연결 - Bash 도구로 gcloud CLI 사용)
# → 기술적 세부사항(미연결)은 시스템 프롬프트로 이동 권장
```

### 4. PROACTIVELY 힌트 ✅ 적절한 적용

**트리거 힌트가 필요한 5개 에이전트에 적용**

| 서브에이전트 | PROACTIVELY 힌트 | 트리거 시점 | 평가 |
|-------------|-----------------|-----------|------|
| debugger-specialist | "PROACTIVELY use for debugging complex issues" | 복잡한 버그 발생 시 | ✅ 적절 |
| dev-environment-manager | "PROACTIVELY use for environment setup" | 환경 설정 필요 시 | ✅ 적절 |
| documentation-manager | "PROACTIVELY use for documentation management" | 문서 작업 필요 시 | ✅ 적절 |
| structure-refactor-specialist | "PROACTIVELY use for architecture refactoring" | 리팩토링 필요 시 | ✅ 적절 |
| test-automation-specialist | "PROACTIVELY run after code changes" | 코드 변경 후 자동 | ✅ 적절 |

**트리거 힌트 없는 에이전트**:
- code-review-specialist, database-administrator, security-specialist: 명시적 호출이 더 적절 ✅
- multi-ai-verification-specialist: 사용자 요청 기반 ✅
- vercel-platform-specialist: 배포 작업 시 명시적 호출 ✅

**주요 발견**:
- ✅ **선택적 적용**: 자동화가 필요한 에이전트에만 PROACTIVELY 힌트 적용
- ✅ **명시적 호출 유지**: 중요한 작업(보안, DB, 배포)은 명시적 호출 유지

### 5. 모델 선택 ✅ 완벽 준수

**모든 서브에이전트가 `model: inherit` 사용**

```yaml
model: inherit  # ✅ 12/12 (100%)
```

**의미**:
- 메인 대화와 동일한 모델 사용
- 일관된 성능 및 토큰 효율성
- 사용자가 Sonnet/Opus/Haiku 선택 시 서브에이전트도 동일 모델 사용

---

## ⚠️ 개선 필요 사항

### 1. structure-refactor-specialist 도구 과다 (우선순위: 중)

**현재 상태**: 23개 도구 (평균 10.9개의 211%)

```yaml
tools: Read, Write, Edit, MultiEdit, Glob, Grep, TodoWrite,
       mcp__serena__list_dir, mcp__serena__get_symbols_overview, mcp__serena__find_symbol,
       mcp__serena__find_referencing_symbols, mcp__serena__replace_symbol_body,
       mcp__serena__insert_after_symbol, mcp__serena__insert_before_symbol,
       mcp__serena__replace_regex, mcp__serena__write_memory,
       mcp__serena__think_about_collected_information,
       mcp__serena__think_about_task_adherence, Bash
```

**문제점**:
- 도구 목록이 너무 길어 가독성 저하
- 모든 Serena 도구를 포함 (11개)
- 리팩토링 작업에 필수가 아닌 도구 포함 가능

**권장 개선안**:
```yaml
# 핵심 도구만 유지 (12개로 축소)
tools: Read, Write, Edit, MultiEdit, Glob, TodoWrite,
       mcp__serena__get_symbols_overview, mcp__serena__find_symbol,
       mcp__serena__replace_symbol_body, mcp__serena__insert_after_symbol,
       mcp__serena__replace_regex, mcp__serena__write_memory
```

**제거 후보**:
- `mcp__serena__list_dir` (Glob으로 대체 가능)
- `mcp__serena__find_referencing_symbols` (필요 시 요청)
- `mcp__serena__insert_before_symbol` (insert_after로 충분)
- `mcp__serena__think_about_*` 도구들 (자동 실행되는 도구)
- `Grep, Bash` (리팩토링 시 덜 중요)

### 2. gcp-cloud-functions-specialist description 장황함 (우선순위: 낮)

**현재**:
```yaml
description: GCP Cloud Functions 전문가. 서버리스 함수 배포, 최적화, 무료 티어 관리 (현재 GCP MCP 서버 미연결 - Bash 도구로 gcloud CLI 사용)
```

**문제점**:
- 기술적 세부사항이 description에 포함
- 괄호 안 설명이 너무 길어짐

**권장 개선안**:
```yaml
description: GCP Cloud Functions 전문가. 서버리스 함수 배포, 최적화, 무료 티어 관리 (gcloud CLI 사용)
```

또는 시스템 프롬프트로 이동:
```yaml
description: GCP Cloud Functions 전문가. 서버리스 함수 배포, 최적화, 무료 티어 관리
```

---

## 📊 MCP 도구 활용 분석

### MCP 서버별 할당 현황

| MCP 서버 | 사용 에이전트 수 | 주요 에이전트 | 활용도 |
|----------|----------------|--------------|--------|
| **serena** | 11/12 (92%) | 거의 모든 에이전트 | ⭐⭐⭐⭐⭐ 핵심 |
| **memory** | 2/12 (17%) | dev-environment-manager, documentation-manager, ui-ux-specialist | ⭐⭐⭐ 적절 |
| **supabase** | 2/12 (17%) | database-administrator, security-specialist | ⭐⭐⭐⭐⭐ 전문화 |
| **vercel** | 1/12 (8%) | vercel-platform-specialist | ⭐⭐⭐⭐⭐ 전문화 |
| **multi-ai** | 1/12 (8%) | multi-ai-verification-specialist | ⭐⭐⭐⭐⭐ 전문화 |
| **playwright** | 1/12 (8%) | test-automation-specialist | ⭐⭐⭐⭐⭐ 전문화 |
| **shadcn-ui** | 1/12 (8%) | ui-ux-specialist | ⭐⭐⭐⭐ 적절 |
| **sequential-thinking** | 1/12 (8%) | ui-ux-specialist | ⭐⭐⭐ 적절 |
| **context7** | 1/12 (8%) | documentation-manager | ⭐⭐⭐⭐ 적절 |
| **time** | 1/12 (8%) | dev-environment-manager | ⭐⭐⭐ 적절 |

### Serena MCP 도구 분석

**가장 많이 사용되는 Serena 도구**:
1. `find_symbol` - 10개 에이전트
2. `get_symbols_overview` - 9개 에이전트
3. `search_for_pattern` - 9개 에이전트
4. `write_memory` - 8개 에이전트
5. `find_referencing_symbols` - 7개 에이전트

**Serena 도구 활용 패턴**:
- ✅ **코드 분석 에이전트**: find_symbol + get_symbols_overview
- ✅ **리팩토링 에이전트**: replace_symbol_body + insert_* + replace_regex
- ✅ **디버깅 에이전트**: find_referencing_symbols + think_about_collected_information

---

## 🎯 베스트 프랙티스 준수도 점수

| 항목 | 점수 | 평가 |
|------|------|------|
| 도구 스코핑 | 95/100 | 1개 에이전트 도구 과다 |
| 단일 책임 원칙 | 100/100 | 완벽 |
| 액션 지향 설명 | 95/100 | 1개 description 장황 |
| PROACTIVELY 힌트 | 100/100 | 적절한 적용 |
| 모델 선택 | 100/100 | 완벽 |
| **종합 점수** | **98/100 (A+)** | **베스트 프랙티스 거의 완벽 준수** |

---

## ✅ 권장 조치

### 즉시 적용 (선택)

1. **structure-refactor-specialist 도구 축소** (23개 → 12-15개)
   - 우선순위: 중
   - 예상 효과: 가독성 향상, 성능 개선

2. **gcp-cloud-functions-specialist description 간소화**
   - 우선순위: 낮
   - 예상 효과: description 일관성 향상

### 현재 유지 권장

- ✅ 모든 서브에이전트의 명시적 도구 스코핑
- ✅ 단일 책임 원칙 준수
- ✅ MCP 도구 전문화 (Supabase, Vercel, Multi-AI, Playwright)
- ✅ Serena MCP 활용 (코드 분석의 핵심)
- ✅ PROACTIVELY 힌트 선택적 적용

---

## 📈 공식 베스트 프랙티스 대비 우수 사례

### 1. 전문 MCP 도구 100% 활용

**database-administrator**:
```yaml
tools: mcp__supabase__execute_sql, mcp__supabase__list_tables, mcp__supabase__list_migrations,
       mcp__serena__search_for_pattern, mcp__serena__find_symbol, mcp__serena__write_memory
```
→ Supabase MCP 도구만 사용, 불필요한 일반 도구 제외 ✅

**multi-ai-verification-specialist**:
```yaml
tools: Read, Write, mcp__multi-ai__queryCodex, mcp__multi-ai__queryGemini,
       mcp__multi-ai__queryQwen, mcp__multi-ai__getBasicHistory
```
→ Multi-AI MCP 전용, 최소 일반 도구만 포함 ✅

### 2. 역할 통합으로 중복 제거

**이전 (3개 에이전트)**:
- verification-specialist
- quality-control-specialist
- security-auditor + security-reviewer

**현재 (2개 에이전트)**:
- code-review-specialist (verification + quality-control 통합)
- security-specialist (auditor + reviewer 통합)

→ 역할 중복 제거, 효율성 향상 ✅

### 3. PROACTIVELY 힌트 전략적 활용

**자동화 필요**: test-automation-specialist ("PROACTIVELY run after code changes")
**명시적 호출**: security-specialist, database-administrator (중요 작업)

→ 작업 특성에 맞는 트리거 전략 ✅

---

## 🔗 참고 자료

- [Claude Code 공식 문서 - Subagents](https://docs.claude.com/en/docs/claude-code/sub-agents)
- [Claude Code Best Practices - Anthropic](https://www.anthropic.com/engineering/claude-code-best-practices)
- [PubNub - Best Practices for Claude Code Sub-agents](https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/)

---

**결론**: 현재 서브에이전트 설정은 Claude Code 공식 베스트 프랙티스를 **98% 준수**하고 있으며, 소수의 개선 가능 사항만 존재합니다. 전체적으로 **A+ 수준의 구성**이며, 특히 MCP 도구 활용과 단일 책임 원칙 준수가 우수합니다.
