# MCP 우선순위 가이드

**MCP 최대 활용을 위한 실전 의사결정 가이드**

---

## 📊 개요

### 현재 상태
- **MCP 연결**: 9/9 완벽 (100% 가동률)
- **실제 활용도**: 65/100점
- **토큰 절약**: 50-60% (목표 82%)
- **개선 여지**: 22-32% 추가 절약 가능

### 목표
- **토큰 효율**: 82% 절약 달성 (300토큰 → 55토큰)
- **개발 속도**: 3-5배 향상
- **정확도**: 100% (최신 문서 기반)

---

## 🎯 작업별 MCP 우선순위 매트릭스

| 작업 유형 | 1순위 MCP | 대체 도구 | 금지 패턴 | 효과 |
|----------|----------|----------|----------|------|
| **코드 분석** | Serena (find_symbol) | Read (부분만) | Read (전체 파일) | 3-5배 빠름 |
| **Vercel 조회** | Vercel MCP | - | CLI | 89배 빠름 |
| **DB 작업** | Supabase MCP | - | CLI | 완벽 활용 중 |
| **라이브러리 문서** | Context7 | WebFetch | WebSearch | 100% 정확 |
| **UI 컴포넌트** | Shadcn-ui MCP | 기존 코드 | 복사 붙여넣기 | 최신 버전 |
| **E2E 테스트** | Playwright MCP | - | 수동 테스트 | 자동화 |
| **복잡한 분석** | Sequential-thinking | - | 즉시 답변 | 정확도 향상 |
| **지식 저장** | Memory MCP | Serena write_memory | 파일 직접 수정 | 관계 설정 |
| **시간대 변환** | Time MCP | - | 수동 계산 | 즉시 변환 |

---

## 🚀 의사결정 플로우차트

```
작업 시작
    ↓
┌─────────────────────────────────────────┐
│ 1. 작업 유형 식별                        │
│    - 코드 분석?                         │
│    - 정보 조회?                         │
│    - 문서 참조?                         │
│    - UI 작업?                           │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 2. 위 매트릭스에서 1순위 MCP 확인        │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 3. MCP 도구 사용 시도                   │
└─────────────────────────────────────────┘
    ↓
    성공? ──예→ [완료]
    │
    아니오
    ↓
┌─────────────────────────────────────────┐
│ 4. 대체 도구 고려 (매트릭스 참조)        │
└─────────────────────────────────────────┘
```

---

## 💡 실전 예시 (Before/After)

### 시나리오 1: 컴포넌트 코드 분석

#### ❌ 잘못된 패턴 (현재)

```typescript
// 1. 전체 파일 읽기
Read("src/components/dashboard/DashboardClient.tsx")  // 500줄 전체
// 2. 관련 파일도 읽기
Read("src/types/dashboard.ts")
Read("src/hooks/useDashboard.ts")

// 토큰 소비: ~1,500 토큰
// 시간: 읽는 데 15초
// 정확도: 불필요한 정보 많음
```

#### ✅ 올바른 패턴 (개선)

```typescript
// 1. 심볼 오버뷰만
mcp__serena__get_symbols_overview("src/components/dashboard/DashboardClient.tsx")

// 2. 필요한 함수만 정확히
mcp__serena__find_symbol("handleSubmit", {
  relative_path: "src/components/dashboard/DashboardClient.tsx",
  include_body: true
})

// 토큰 소비: ~200 토큰 (87% 절약!)
// 시간: 3초 (5배 빠름)
// 정확도: 필요한 정보만 정확히
```

**절약 효과**: 1,300 토큰, 12초 절약

---

### 시나리오 2: Next.js 문서 조회

#### ❌ 잘못된 패턴

```typescript
WebSearch("Next.js 15 server actions best practices")
// 문제:
// - 부정확할 수 있음 (블로그, 오래된 정보)
// - 토큰 낭비 (검색 결과 파싱)
// - 시간 소요 (여러 결과 검토)
```

#### ✅ 올바른 패턴

```typescript
// 1. 라이브러리 ID 확인
mcp__context7__resolve_library_id("Next.js")

// 2. 정확한 문서 가져오기
mcp__context7__get_library_docs("/vercel/next.js", {
  topic: "server-actions",
  tokens: 2500
})

// 효과:
// - 100% 정확 (공식 문서)
// - 최신 정보 (실시간 업데이트)
// - 토큰 효율 (필요한 부분만)
```

**절약 효과**: 부정확한 정보 위험 제거, 디버깅 시간 절약

---

### 시나리오 3: Vercel 배포 정보 조회

#### ❌ 잘못된 패턴

```bash
# CLI 사용
source .env.local
vercel ls --token $VERCEL_TOKEN  # 89초 소요!
vercel env ls --token $VERCEL_TOKEN  # 85초 소요!
```

#### ✅ 올바른 패턴

```typescript
// MCP 사용
mcp__vercel__list_projects(teamId)  // ~1초 (89배 빠름!)
mcp__vercel__list_deployments(projectId, teamId)  // ~1초

// 효과:
// - 89배 빠른 응답
// - 토큰 절약
// - Claude Code 통합 환경
```

**절약 효과**: 88초 절약 (99% 시간 단축!)

---

### 시나리오 4: shadcn/ui 컴포넌트 추가

#### ❌ 잘못된 패턴

```typescript
// 기존 프로젝트에서 복사
// 문제:
// - 구버전일 수 있음
// - 프로젝트별 커스터마이징 포함
// - 의존성 누락 가능
```

#### ✅ 올바른 패턴

```typescript
// 1. 최신 컴포넌트 조회
mcp__shadcn_ui__get_component("button")

// 2. 데모 코드 확인
mcp__shadcn_ui__get_component_demo("button")

// 효과:
// - 최신 v4 코드
// - 공식 베스트 프랙티스
// - 완전한 구현 예시
```

**절약 효과**: 버전 충돌 방지, 디버깅 시간 절약

---

## 🚀 빠른 참조표 (Cheat Sheet)

### 작업 시작 전 체크리스트

**질문: 무엇을 하려는가?**

- [ ] **코드 분석?** → Serena
  - `mcp__serena__get_symbols_overview()`
  - `mcp__serena__find_symbol()`
  - `mcp__serena__search_for_pattern()`

- [ ] **Vercel 정보?** → Vercel MCP
  - `mcp__vercel__list_projects()`
  - `mcp__vercel__get_deployment()`
  - `mcp__vercel__get_access_to_vercel_url()`

- [ ] **DB 작업?** → Supabase MCP
  - `mcp__supabase__execute_sql()`
  - `mcp__supabase__list_tables()`
  - `mcp__supabase__get_advisors()`

- [ ] **라이브러리 문서?** → Context7
  - `mcp__context7__resolve_library_id()`
  - `mcp__context7__get_library_docs()`

- [ ] **UI 컴포넌트?** → Shadcn-ui
  - `mcp__shadcn_ui__get_component()`
  - `mcp__shadcn_ui__list_components()`

- [ ] **E2E 테스트?** → Playwright
  - `mcp__playwright__browser_navigate()`
  - `mcp__playwright__browser_click()`
  - `mcp__playwright__browser_snapshot()`

- [ ] **복잡한 분석?** → Sequential-thinking
  - `mcp__sequential_thinking__sequentialthinking()`

- [ ] **지식 저장?** → Memory MCP
  - `mcp__memory__create_entities()`
  - `mcp__memory__search_nodes()`

---

### 금지 패턴 🚫

#### 절대 하지 말 것

1. **❌ Read로 500줄 이상 파일 전체 읽기**
   - ✅ 대신: Serena `get_symbols_overview()` + `find_symbol()`

2. **❌ Serena 루트 디렉토리에서 skip_ignored_files 없이 사용**
   - ✅ 대신: `skip_ignored_files: true` 추가 (48배 빠름)
   - ✅ 또는: 특정 디렉토리 지정 (`relative_path: "src"`)

3. **❌ Vercel CLI 조회 명령어 사용**
   - ✅ 대신: Vercel MCP (89배 빠름)

4. **❌ WebSearch로 라이브러리 문서 찾기**
   - ✅ 대신: Context7 (100% 정확)

5. **❌ UI 컴포넌트 복사 붙여넣기**
   - ✅ 대신: Shadcn-ui MCP (최신 버전)

6. **❌ 복잡한 문제를 즉시 답변**
   - ✅ 대신: Sequential-thinking (단계별 분석)

---

## 📈 기대 효과

### 토큰 효율

| 구분 | 현재 | 개선 후 | 절약률 |
|------|------|---------|--------|
| 코드 분석 | 1,500 토큰 | 200 토큰 | 87% |
| 문서 조회 | 500 토큰 | 100 토큰 | 80% |
| Vercel 조회 | 300 토큰 | 55 토큰 | 82% |
| **전체 평균** | **300 토큰** | **55 토큰** | **82%** |

### 시간 효율

| 작업 | 현재 | 개선 후 | 향상 |
|------|------|---------|------|
| 코드 분석 | 15초 | 3초 | 5배 |
| Vercel 조회 | 89초 | 1초 | 89배 |
| 문서 조회 | 30초 | 5초 | 6배 |
| **평균** | **45초** | **3초** | **15배** |

### 정확도

- **라이브러리 문서**: WebSearch (70%) → Context7 (100%)
- **UI 컴포넌트**: 복사 (구버전) → MCP (최신)
- **코드 분석**: 전체 읽기 (불필요한 정보) → 심볼 (정확한 정보)

---

## 🎯 실천 방법

### 1단계: 습관화 (1주일)

**매일 아침:**
```bash
# 이 가이드 빠른 확인
cat docs/claude/environment/mcp-priority-guide.md
```

**작업 전:**
- Cheat Sheet 참조
- 1순위 MCP 확인
- 금지 패턴 회피

### 2단계: 측정 (2주차)

**일일 체크:**
- [ ] Serena 사용 횟수
- [ ] Context7 사용 횟수
- [ ] Vercel CLI 대신 MCP 사용 여부
- [ ] 토큰 절약량

**주간 리뷰:**
- 토큰 사용량 비교
- 작업 속도 측정
- 정확도 평가

### 3단계: 최적화 (3주차~)

**개선 포인트 발견:**
- 자주 사용하는 MCP 패턴 문서화
- 새로운 효율적 패턴 발견
- 팀과 공유

---

## 🔗 관련 문서

- [MCP 개인 설정](mcp-configuration.md)
- [Multi-AI 전략](multi-ai-strategy.md)
- [개인 워크플로우](workflows.md)
- [AI CLI 도구 설정](ai-tools-setup.md)

---

## 📝 체크리스트 요약

### 즉시 적용 (오늘부터)

- [ ] 코드 분석 → Serena 우선
- [ ] Vercel 조회 → MCP 우선 (CLI 금지)
- [ ] 라이브러리 문서 → Context7 우선
- [ ] UI 컴포넌트 → Shadcn-ui MCP
- [ ] 복잡한 분석 → Sequential-thinking

### 측정 (매주)

- [ ] 토큰 사용량 기록
- [ ] 작업 시간 측정
- [ ] MCP 사용 비율 추적

### 목표

- [ ] 토큰 절약: 82% 달성
- [ ] 개발 속도: 3-5배 향상
- [ ] 정확도: 100% 유지

---

**💡 핵심 원칙**: "MCP를 대안이 아닌 1순위로!"
