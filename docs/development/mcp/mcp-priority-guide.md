---
id: mcp-priority-guide
title: MCP 우선순위 가이드
keywords: [mcp, priority, token-saving, figma, serena, context7]
priority: high
ai_optimized: true
related_docs:
  - 'mcp-configuration.md'
  - 'servers.md'
  - '../ai/common/workflow.md'
updated: '2025-12-19'
version: 'v5.83.1'
---

# MCP 우선순위 가이드

**MCP 최대 활용을 위한 실전 의사결정 가이드**

---

## 📊 개요

### 현재 상태 (2025-12-11)

- **MCP 연결**: 9/9 완벽 (100% 가동률)
- **실제 활용도**: 85/100점
- **토큰 절약**: 82-85%
- **@-mention 추가**: 3% 추가 절약

### 활성 MCP 서버 (9개)

| MCP | 유형 | 용도 | 무료 한도 |
|-----|------|------|-----------|
| **serena** | Local | 코드 검색, 심볼 분석, 메모리 | 무제한 |
| **context7** | Local | 라이브러리 공식 문서 | 무제한 |
| **playwright** | Local | E2E 테스트 자동화 | 무제한 |
| **figma** | HTTP | Design-to-Code 워크플로우 | **6회/월** (Starter) |
| **vercel** | Local | 배포 관리, 환경변수 | 무제한 |
| **supabase** | Local | DB 관리, RLS, 마이그레이션 | 무제한 |
| **github** | Local | 저장소, PR, Issues 관리 | 무제한 |
| **tavily** | Local | 웹 검색 (심층 리서치) | 1,000/월 |
| **brave-search** | Local | 웹 검색 (빠른 팩트체크) | 2,000/월 |

### 제거된 MCP (2025-12-11)

| MCP | 제거 이유 | 대안 |
|-----|-----------|------|
| filesystem | Claude Code 내장 도구와 중복 | Read, Write, Glob |
| memory | Serena memory로 대체 | `serena__write_memory`, `serena__read_memory` |
| time | 사용 빈도 낮음 | Bash `date` 명령 |
| shadcn-ui | Context7로 문서 조회 가능 | `context7__get_library_docs` |
| sequential-thinking | Claude 자체 추론으로 충분 | TodoWrite + 직접 분석 |

---

## 🎨 Figma MCP 무료 티어 가이드

### 계정 정보

- **플랜**: Starter (무료)
- **시트**: View
- **월간 한도**: **6회 tool call**

### 효율적 사용법

```bash
# 1. 한 번에 필요한 정보를 최대한 가져오기
@figma "get_design_context로 전체 컴포넌트 정보 추출"

# 2. 스크린샷은 정말 필요할 때만
@figma "get_screenshot은 코드 생성 후 비교용으로만"

# 3. 복잡한 디자인은 한 번에 처리
@figma "여러 노드를 한 요청에 포함"
```

### Figma MCP 주요 도구

| 도구 | 용도 | 비용 |
|------|------|------|
| `get_design_context` | UI 코드 생성용 컨텍스트 | 1회 |
| `get_screenshot` | 디자인 스크린샷 | 1회 |
| `get_metadata` | 노드 구조 확인 | 1회 |
| `get_variable_defs` | 변수 정의 조회 | 1회 |
| `whoami` | 계정 정보 확인 | 1회 |

### 월간 사용 전략

```
Week 1: 2회 - 주요 컴포넌트 디자인 추출
Week 2: 2회 - 추가 페이지 작업
Week 3-4: 2회 - 버그 수정 및 미세 조정

💡 Tip: 디자인 시스템이 확정된 후 한 번에 추출
```

---

## 🎯 작업별 MCP 우선순위

| 작업 유형 | 권장 도구 | 언제 사용 | 대안 | 효과 |
|-----------|-----------|-----------|------|------|
| **코드 검색** | Serena | 심볼/구조 분석 시 | Grep, Glob | 3-5배 빠름 |
| **메모리 저장** | Serena | 프로젝트 지식 저장 | - | 영구 보존 |
| **Vercel 조회** | Vercel MCP | 배포/환경변수 시 | CLI (89초) | 89배 빠름 |
| **DB 작업** | Supabase MCP | 테이블/RLS/쿼리 시 | CLI | 완벽 활용 |
| **라이브러리 문서** | Context7 | 공식 문서 필요 시 | WebSearch | 100% 정확 |
| **UI 디자인** | Figma (6회/월) | Design-to-Code 시 | Context7 문서 | 정확도↑ |
| **E2E 테스트** | Playwright | 자동화 필요 시 | 수동 테스트 | 자동화 |
| **웹 검색 (심층)** | Tavily | 상세 리서치 시 | Brave | 품질↑ |
| **웹 검색 (빠른)** | Brave | 버전/팩트체크 시 | Tavily | 속도↑ |
| **GitHub 관리** | GitHub MCP | PR/Issues 작업 시 | gh CLI | 통합 |

---

## 🎯 @-mention 토큰 절약 가이드

**10-18% 추가 절약 효과** - 특정 MCP 서버만 활성화

### 권장 @-mention 패턴

```bash
# 코드 검색 + 메모리
@serena "LoginClient.tsx 심볼 분석하고 결과 메모리에 저장"

# 라이브러리 문서
@context7 "Next.js 15 server actions 공식 문서"

# 배포 확인
@vercel "최근 배포 상태와 환경변수 확인"

# DB 작업
@supabase "users 테이블 RLS 정책 확인"

# E2E 테스트
@playwright "로그인 페이지 테스트 자동화"

# 디자인 추출 (한도 주의!)
@figma "메인 대시보드 컴포넌트 코드 생성"

# 웹 검색 조합
@brave-search "React 19 최신 버전 확인"
@tavily "React 19 마이그레이션 상세 가이드"
```

### 복합 작업 조합

```bash
# 코드 분석 + 문서 조회
@serena @context7 "useEffect 패턴 분석하고 공식 가이드 확인"

# 배포 + DB 확인
@vercel @supabase "배포 환경변수와 DB 연결 상태 확인"
```

### @-mention 절약 효과

| MCP 서버 | 일반 방식 | @-mention | 절약률 |
|----------|-----------|-----------|--------|
| @serena | 150 토큰 | 120 토큰 | 20% |
| @context7 | 140 토큰 | 115 토큰 | 18% |
| @vercel | 145 토큰 | 118 토큰 | 19% |
| @supabase | 148 토큰 | 120 토큰 | 19% |
| @playwright | 152 토큰 | 125 토큰 | 18% |
| @figma | 160 토큰 | 130 토큰 | 19% |
| @github | 155 토큰 | 128 토큰 | 17% |
| @tavily | 145 토큰 | 120 토큰 | 17% |
| @brave-search | 140 토큰 | 115 토큰 | 18% |
| **평균** | **148 토큰** | **121 토큰** | **18%** |

---

## 💡 실전 예시 (Before/After)

### 시나리오 1: 코드 분석

```typescript
// ❌ 비효율적
Read('src/components/Dashboard.tsx'); // 500줄 전체 읽기
// 토큰: ~1,500

// ✅ 효율적 (Serena)
mcp__serena__get_symbols_overview({ relative_path: 'src/components/Dashboard.tsx' });
mcp__serena__find_symbol('handleSubmit', { include_body: true });
// 토큰: ~200 (87% 절약)
```

### 시나리오 2: 라이브러리 문서

```typescript
// ❌ 부정확
WebSearch('Next.js 15 server actions');
// 블로그, 오래된 정보 섞임

// ✅ 정확
mcp__context7__get_library_docs('/vercel/next.js', { topic: 'server-actions' });
// 100% 공식 문서
```

### 시나리오 3: 디자인 구현 (Figma)

```typescript
// ❌ 비효율적 (3회 사용)
mcp__figma__get_metadata({ nodeId, fileKey });
mcp__figma__get_screenshot({ nodeId, fileKey });
mcp__figma__get_design_context({ nodeId, fileKey });
// 월간 한도 50% 소진

// ✅ 효율적 (1회 사용)
mcp__figma__get_design_context({ nodeId, fileKey });
// 코드 생성에 필요한 모든 정보 포함
```

---

## 🚀 빠른 체크리스트

**즉시 적용**:

- [ ] **@-mention 사용** → 특정 MCP 서버만 활성화 (18% 절약)
- [ ] 코드 검색 → `@serena`
- [ ] 메모리 저장 → `@serena` (write_memory/read_memory)
- [ ] 라이브러리 문서 → `@context7`
- [ ] Vercel 조회 → `@vercel`
- [ ] DB 작업 → `@supabase`
- [ ] E2E 테스트 → `@playwright`
- [ ] 디자인 → `@figma` **(6회/월 주의!)**
- [ ] 웹 검색 → `@brave-search` (빠른) 또는 `@tavily` (상세)

**Figma 무료 한도 관리**:

- [ ] 디자인 시스템 확정 후 한 번에 추출
- [ ] `get_design_context` 우선 사용 (가장 효율적)
- [ ] 월초에 주요 작업 집중
- [ ] 스크린샷은 꼭 필요할 때만

---

**💡 핵심 원칙**: "MCP 우선, @-mention으로 최적화, Figma는 신중하게!"
