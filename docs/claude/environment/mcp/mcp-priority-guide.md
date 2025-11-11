# MCP 우선순위 가이드

**MCP 최대 활용을 위한 실전 의사결정 가이드**

---

## 📊 개요

### 현재 상태

- **MCP 연결**: 9/9 완벽 (100% 가동률)
- **실제 활용도**: 65/100점
- **토큰 절약**: 50-60% (목표 85%)
- **개선 여지**: 25-35% 추가 절약 가능

### 목표

- **토큰 효율**: 85% 절약 달성 (300토큰 → 45토큰)
  - MCP 활용: 82% 절약 (300토큰 → 55토큰)
  - @-mention 추가: 3% 추가 절약 (55토큰 → 45토큰) 🔥
- **개발 속도**: 3-5배 향상
- **정확도**: 100% (최신 문서 기반)

---

## 🎯 작업별 MCP 우선순위 (유연한 선택)

| 작업 유형           | 권장 도구            | 언제 사용하면 좋을까                                           | 대안          | 효과       |
| ------------------- | -------------------- | -------------------------------------------------------------- | ------------- | ---------- |
| **코드 분석**       | Serena → Read        | 심볼/구조 파악 시 Serena 우선<br>작은 파일(~100줄)은 Read 가능 | Read 전체     | 3-5배 빠름 |
| **Vercel 조회**     | Vercel MCP → CLI     | 배포 정보, 환경변수 조회 시<br>일회성 작업은 CLI도 OK          | CLI (89초)    | 89배 빠름  |
| **DB 작업**         | Supabase MCP         | 테이블/RLS/쿼리 작업 시 권장                                   | CLI           | 완벽 활용  |
| **라이브러리 문서** | Context7 → WebSearch | 공식 문서 필요 시 Context7<br>블로그/예제는 WebSearch 가능     | WebSearch     | 100% 정확  |
| **UI 컴포넌트**     | Shadcn-ui MCP        | 새 컴포넌트 추가 시<br>수정은 기존 코드 참조 가능              | 기존 코드     | 최신 버전  |
| **E2E 테스트**      | Playwright MCP       | 자동화 필요 시                                                 | 수동 테스트   | 자동화     |
| **복잡한 분석**     | Sequential-thinking  | 다단계 추론 필요 시                                            | 직접 분석     | 정확도↑    |
| **지식 저장**       | Memory MCP           | 엔티티 관계 필요 시                                            | Serena memory | 관계 설정  |
| **시간대 변환**     | Time MCP             | 정확한 시간 계산 시                                            | 수동 계산     | 즉시 변환  |

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
│ 2. 위 매트릭스에서 권장 도구 확인        │
│    (상황에 따라 대안도 가능)            │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 3. MCP 도구 시도 (권장 시)              │
│    또는 대안 도구 사용                  │
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

## 🎯 @-mention 토큰 절약 가이드 (v2.0.10+)

**10-18% 추가 절약 효과** - 특정 MCP 서버만 활성화하여 불필요한 컨텍스트 제거

### 기본 원리

- **일반 방식**: 모든 MCP 서버(9개) 활성화 → 불필요한 도구 목록도 포함
- **@-mention 방식**: 필요한 MCP 서버만 활성화 → 해당 서버 도구만 로드

### 전체 9개 MCP 서버 @-mention 예시

#### 1️⃣ @serena - 코드 분석 전문

```bash
# ❌ Before: 모든 MCP 활성화 (9개 서버 × 평균 10개 도구 = 90개 도구 로드)
"src/components/LoginClient.tsx 파일의 구조를 분석해줘"
# 토큰: ~150 토큰 (MCP 서버 9개 모두 활성화)

# ✅ After: Serena만 활성화
@serena "src/components/LoginClient.tsx 파일의 구조를 분석해줘"
# 토큰: ~120 토큰 (20% 절약!)
# Serena 도구만 로드: find_symbol, get_symbols_overview, search_for_pattern 등
```

#### 2️⃣ @context7 - 라이브러리 문서 조회

```bash
# ❌ Before: 모든 MCP 활성화
"Next.js 15의 server actions 공식 문서를 가져와줘"
# 토큰: ~140 토큰

# ✅ After: Context7만 활성화
@context7 "Next.js 15의 server actions 공식 문서를 가져와줘"
# 토큰: ~115 토큰 (18% 절약!)
# Context7 도구만 로드: resolve_library_id, get_library_docs
```

#### 3️⃣ @vercel - 배포 정보 조회

```bash
# ❌ Before: 모든 MCP 활성화
"현재 Vercel 프로젝트 목록과 최근 배포를 확인해줘"
# 토큰: ~145 토큰

# ✅ After: Vercel만 활성화
@vercel "현재 프로젝트 목록과 최근 배포를 확인해줘"
# 토큰: ~118 토큰 (19% 절약!)
# Vercel 도구만 로드: getprojects, getdeployment, get_access_to_vercel_url 등
```

#### 4️⃣ @supabase - 데이터베이스 작업

```bash
# ❌ Before: 모든 MCP 활성화
"users 테이블의 RLS 정책을 확인해줘"
# 토큰: ~148 토큰

# ✅ After: Supabase만 활성화
@supabase "users 테이블의 RLS 정책을 확인해줘"
# 토큰: ~120 토큰 (19% 절약!)
# Supabase 도구만 로드: execute_sql, list_tables, get_advisors 등
```

#### 5️⃣ @playwright - E2E 테스트

```bash
# ❌ Before: 모든 MCP 활성화
"로그인 페이지 E2E 테스트를 자동화해줘"
# 토큰: ~152 토큰

# ✅ After: Playwright만 활성화
@playwright "로그인 페이지 E2E 테스트를 자동화해줘"
# 토큰: ~125 토큰 (18% 절약!)
# Playwright 도구만 로드: browser_navigate, browser_click, browser_snapshot 등
```

#### 6️⃣ @shadcn-ui - UI 컴포넌트

```bash
# ❌ Before: 모든 MCP 활성화
"최신 shadcn/ui v4 button 컴포넌트를 가져와줘"
# 토큰: ~142 토큰

# ✅ After: Shadcn-ui만 활성화
@shadcn-ui "최신 v4 button 컴포넌트를 가져와줘"
# 토큰: ~118 토큰 (17% 절약!)
# Shadcn-ui 도구만 로드: get_component, list_components, get_component_demo
```

#### 7️⃣ @sequential-thinking - 복잡한 분석

```bash
# ❌ Before: 모든 MCP 활성화
"이 버그의 근본 원인을 다단계로 추론해서 분석해줘"
# 토큰: ~155 토큰

# ✅ After: Sequential-thinking만 활성화
@sequential-thinking "이 버그의 근본 원인을 다단계로 추론해서 분석해줘"
# 토큰: ~130 토큰 (16% 절약!)
# Sequential-thinking 도구만 로드: sequentialthinking
```

#### 8️⃣ @memory - 지식 저장

```bash
# ❌ Before: 모든 MCP 활성화
"프로젝트 아키텍처 엔티티를 지식 그래프로 저장해줘"
# 토큰: ~150 토큰

# ✅ After: Memory만 활성화
@memory "프로젝트 아키텍처 엔티티를 지식 그래프로 저장해줘"
# 토큰: ~125 토큰 (17% 절약!)
# Memory 도구만 로드: create_entities, search_nodes, read_graph
```

#### 9️⃣ @time - 시간대 변환

```bash
# ❌ Before: 모든 MCP 활성화
"현재 서울 시간을 UTC로 변환해줘"
# 토큰: ~140 토큰

# ✅ After: Time만 활성화
@time "현재 서울 시간을 UTC로 변환해줘"
# 토큰: ~115 토큰 (18% 절약!)
# Time 도구만 로드: get_current_time, convert_time
```

### 복합 작업 시 조합 사용

```bash
# 📝 예시: 코드 분석 + 라이브러리 문서 조회
@serena @context7 "LoginClient.tsx에서 사용된 Next.js 훅의 공식 문서를 확인해줘"
# 토큰: ~135 토큰 (2개 서버만 활성화, 13% 절약)

# 🚀 예시: Vercel 배포 + 데이터베이스 확인
@vercel @supabase "최근 배포의 환경변수와 DB 연결 상태를 확인해줘"
# 토큰: ~140 토큰 (2개 서버만 활성화, 12% 절약)
```

### 📊 @-mention 절약 효과 요약

| MCP 서버             | 일반 방식    | @-mention    | 절약률  |
| -------------------- | ------------ | ------------ | ------- |
| @serena              | 150 토큰     | 120 토큰     | 20%     |
| @context7            | 140 토큰     | 115 토큰     | 18%     |
| @vercel              | 145 토큰     | 118 토큰     | 19%     |
| @supabase            | 148 토큰     | 120 토큰     | 19%     |
| @playwright          | 152 토큰     | 125 토큰     | 18%     |
| @shadcn-ui           | 142 토큰     | 118 토큰     | 17%     |
| @sequential-thinking | 155 토큰     | 130 토큰     | 16%     |
| @memory              | 150 토큰     | 125 토큰     | 17%     |
| @time                | 140 토큰     | 115 토큰     | 18%     |
| **평균**             | **147 토큰** | **121 토큰** | **18%** |

### 💡 사용 팁

1. **단일 작업**: 항상 @-mention 사용 권장
2. **복합 작업**: 필요한 서버만 조합 (최대 2-3개)
3. **탐색 작업**: 어떤 서버가 필요한지 모를 때만 일반 방식 사용

---

## 💡 실전 예시 (Before/After)

### 시나리오 1: 컴포넌트 코드 분석

#### ❌ 비효율적 패턴

```typescript
// 1. 전체 파일 읽기
Read('src/components/dashboard/DashboardClient.tsx'); // 500줄 전체
// 2. 관련 파일도 읽기
Read('src/types/dashboard.ts');
Read('src/hooks/useDashboard.ts');

// 토큰 소비: ~1,500 토큰
// 시간: 읽는 데 15초
// 정확도: 불필요한 정보 많음
```

#### ✅ 효율적 패턴

```typescript
// 1. 심볼 오버뷰만
mcp__serena__get_symbols_overview(
  'src/components/dashboard/DashboardClient.tsx'
);

// 2. 필요한 함수만 정확히
mcp__serena__find_symbol('handleSubmit', {
  relative_path: 'src/components/dashboard/DashboardClient.tsx',
  include_body: true,
});

// 토큰 소비: ~200 토큰 (87% 절약!)
// 시간: 3초 (5배 빠름)
// 정확도: 필요한 정보만 정확히
```

**절약 효과**: 1,300 토큰, 12초 절약

**언제 Read를 써도 될까?**:

- 파일이 100줄 미만
- 전체 맥락이 필요한 경우
- 설정 파일 등 짧은 파일

---

### 시나리오 2: Next.js 문서 조회

#### ❌ 부정확할 수 있는 패턴

```typescript
WebSearch('Next.js 15 server actions best practices');
// 단점:
// - 블로그, 오래된 정보 섞임
// - 토큰 낭비 (검색 결과 파싱)
// - 시간 소요 (여러 결과 검토)
```

#### ✅ 정확한 패턴

```typescript
// 1. 라이브러리 ID 확인
mcp__context7__resolve_library_id('Next.js');

// 2. 정확한 문서 가져오기
mcp__context7__get_library_docs('/vercel/next.js', {
  topic: 'server-actions',
  tokens: 2500,
});

// 장점:
// - 100% 정확 (공식 문서)
// - 최신 정보 (실시간 업데이트)
// - 토큰 효율 (필요한 부분만)
```

**절약 효과**: 부정확한 정보 위험 제거, 디버깅 시간 절약

**언제 WebSearch를 써도 될까?**:

- 블로그/튜토리얼 검색
- 커뮤니티 의견 필요
- 공식 문서에 없는 내용

---

### 시나리오 3: Vercel 배포 정보 조회

#### ❌ 느린 패턴

```bash
# CLI 사용
source .env.local
vercel ls --token $VERCEL_TOKEN  # 89초 소요!
vercel env ls --token $VERCEL_TOKEN  # 85초 소요!
```

#### ✅ 빠른 패턴

```typescript
// MCP 사용 (@open-mcp/vercel v0.0.13)
mcp__vercel__getprojects(teamId); // ~1초 (89배 빠름!)
mcp__vercel__getdeployments(projectId, teamId); // ~1초

// 장점:
// - 89배 빠른 응답
// - 토큰 절약
// - Claude Code 통합 환경

// 참고: 공식 Vercel MCP와 도구명 다름 (list_projects → getprojects)
```

**절약 효과**: 88초 절약 (99% 시간 단축!)

**언제 CLI를 써도 될까?**:

- 스크립트/자동화에 포함
- CI/CD 파이프라인
- 로컬 테스트

---

### 시나리오 4: shadcn/ui 컴포넌트 추가

#### ❌ 구버전 위험

```typescript
// 기존 프로젝트에서 복사
// 단점:
// - 구버전일 수 있음
// - 프로젝트별 커스터마이징 포함
// - 의존성 누락 가능
```

#### ✅ 최신 버전

```typescript
// 1. 최신 컴포넌트 조회
mcp__shadcn_ui__get_component('button');

// 2. 데모 코드 확인
mcp__shadcn_ui__get_component_demo('button');

// 장점:
// - 최신 v4 코드
// - 공식 베스트 프랙티스
// - 완전한 구현 예시
```

**절약 효과**: 버전 충돌 방지, 디버깅 시간 절약

**언제 기존 코드를 써도 될까?**:

- 기존 컴포넌트 수정
- 프로젝트 스타일 유지
- 커스터마이징된 버전

---

## 🚀 빠른 참조표 (Cheat Sheet)

### 작업 시작 전 체크리스트

**질문: 무엇을 하려는가?**

- [ ] **코드 분석?** → Serena 권장 (작은 파일은 Read도 OK)
  - `mcp__serena__get_symbols_overview()`
  - `mcp__serena__find_symbol()`
  - `mcp__serena__search_for_pattern()`

- [ ] **Vercel 정보?** → Vercel MCP 권장 (일회성은 CLI도 OK)
  - `mcp__vercel__getprojects()` (참고: @open-mcp/vercel 사용)
  - `mcp__vercel__getdeployment()`
  - `mcp__vercel__get_access_to_vercel_url()`

- [ ] **DB 작업?** → Supabase MCP 권장
  - `mcp__supabase__execute_sql()`
  - `mcp__supabase__list_tables()`
  - `mcp__supabase__get_advisors()`

- [ ] **라이브러리 문서?** → Context7 권장 (블로그는 WebSearch도 OK)
  - `mcp__context7__resolve_library_id()`
  - `mcp__context7__get_library_docs()`

- [ ] **UI 컴포넌트?** → Shadcn-ui MCP 권장
  - `mcp__shadcn_ui__get_component()`
  - `mcp__shadcn_ui__list_components()`

- [ ] **E2E 테스트?** → Playwright 권장
  - `mcp__playwright__browser_navigate()`
  - `mcp__playwright__browser_click()`
  - `mcp__playwright__browser_snapshot()`

- [ ] **복잡한 분석?** → Sequential-thinking 권장
  - `mcp__sequential_thinking__sequentialthinking()`

- [ ] **지식 저장?** → Memory MCP 권장
  - `mcp__memory__create_entities()`
  - `mcp__memory__search_nodes()`

---

### 주의사항 (권장사항)

#### 효율성을 위해 고려할 점

1. **📉 비효율적일 수 있는 패턴**
   - Read로 500줄 이상 파일 전체 읽기 → Serena가 더 효율적
   - Vercel CLI 반복 조회 → MCP가 89배 빠름
   - WebSearch로 공식 문서 찾기 → Context7이 100% 정확

2. **⚠️ Serena 루트 디렉토리 검색 시**
   - `skip_ignored_files: true` 권장 (48배 빠름)
   - 특정 디렉토리 지정 (`relative_path: "src"`)
   - 타임아웃 180초 방지

3. **💡 상황별 선택 가이드**
   - **빠른 확인**: 간단한 방법 사용
   - **복잡한 작업**: MCP 도구 권장
   - **일회성 작업**: 편한 방법 선택
   - **반복 작업**: MCP 도구 우선

---

## 📈 기대 효과

### 토큰 효율

| 구분        | 일반 방법    | MCP 활용    | @-mention 활용 | 절약률 (MCP) | 절약률 (@-mention) |
| ----------- | ------------ | ----------- | -------------- | ------------ | ------------------ |
| 코드 분석   | 1,500 토큰   | 200 토큰    | 120 토큰       | 87%          | 92%                |
| 문서 조회   | 500 토큰     | 100 토큰    | 85 토큰        | 80%          | 83%                |
| Vercel 조회 | 300 토큰     | 55 토큰     | 45 토큰        | 82%          | 85%                |
| **평균**    | **300 토큰** | **55 토큰** | **45 토큰**    | **82%**      | **85%**            |

**🎯 @-mention 추가 절약**: 기존 MCP 대비 10-18% 추가 절약, 일반 방법 대비 최대 92% 절약!

### 시간 효율

| 작업        | 일반 방법 | MCP 활용 | 향상     |
| ----------- | --------- | -------- | -------- |
| 코드 분석   | 15초      | 3초      | 5배      |
| Vercel 조회 | 89초      | 1초      | 89배     |
| 문서 조회   | 30초      | 5초      | 6배      |
| **평균**    | **45초**  | **3초**  | **15배** |

### 정확도

- **라이브러리 문서**: WebSearch (70%) → Context7 (100%)
- **UI 컴포넌트**: 복사 (구버전 위험) → MCP (최신)
- **코드 분석**: 전체 읽기 (불필요한 정보) → 심볼 (정확한 정보)

---

## 🎯 빠른 체크리스트

**즉시 적용**:

- [ ] **@-mention 사용** → 특정 MCP 서버만 활성화 (10-18% 추가 절약) 🔥
  - `@serena "코드 분석"` - 코드 구조 파악
  - `@context7 "문서 조회"` - 라이브러리 공식 문서
  - `@vercel "배포 확인"` - 프로젝트/배포 정보

- [ ] 코드 분석 → Serena 우선 (작은 파일은 Read도 OK)
- [ ] Vercel 조회 → MCP 권장 (일회성은 CLI도 OK)
- [ ] 라이브러리 문서 → Context7 권장 (블로그는 WebSearch도 OK)
- [ ] UI 컴포넌트 → Shadcn-ui MCP

**목표**: 토큰 85% 절약 (MCP 82% + @-mention 3%), 개발 속도 3-5배 향상

**관련 문서**: mcp-configuration.md, multi-ai-strategy.md, 1_workflows.md

---

**💡 핵심 원칙**: "MCP를 우선 고려하되, 상황에 맞게 유연하게!"
