# 🛠️ MCP 도구 레퍼런스 (2025년판)

> **OpenManager VIBE v5 - MCP 도구 완전 가이드**  
> 2025년 8월 기준 | Claude Code v1.0.81 + 8개 MCP 서버  
> 상태: 모든 도구 실제 테스트 완료 ✅  

## 🎯 레퍼런스 개요

**OpenManager VIBE v5**에서 사용하는 **8개 MCP 서버**의 **총 70+ 도구**에 대한 완전한 레퍼런스입니다.

### 📊 서버별 도구 수

| 서버 | 도구 수 | 주요 카테고리 | 문서 링크 |
|------|---------|---------------|-----------|
| `memory` | 6개 | 지식 관리 | [Memory 도구](./mcp-tools-memory.md) |
| `shadcn-ui` | 46개 | UI 컴포넌트 | [ShadCN UI 도구](./mcp-tools-shadcn.md) |
| `time` | 2개 | 시간 처리 | [Time 도구](./mcp-tools-time.md) |
| `sequential-thinking` | 1개 | AI 사고 | [Thinking 도구](./mcp-tools-thinking.md) |
| `context7` | 3개 | 문서 검색 | [Context7 도구](./mcp-tools-context7.md) |
| `serena` | 25개 | 코드 분석 | [Serena 도구](./mcp-tools-serena.md) |
| `supabase` | 7개 | 데이터베이스 | [Supabase 도구](./mcp-tools-supabase.md) |
| `playwright` | 15개 | 브라우저 자동화 | [Playwright 도구](./mcp-tools-playwright.md) |

**총 도구 수**: 105개  
**카테고리**: 8개 주요 분야

---

## 📚 모듈별 상세 가이드

### 🧠 [지식 관리 시스템](./mcp-tools-memory.md)
**Memory MCP** - 엔티티, 관계, 지식 그래프 관리
- Knowledge Graph 생성 및 관리
- 엔티티 간 관계 설정
- 지식 검색 및 추천

### 🎨 [UI 컴포넌트 시스템](./mcp-tools-shadcn.md)
**ShadCN UI MCP** - 46개 UI 컴포넌트 완전 활용
- React 컴포넌트 자동 생성
- 디자인 시스템 통합
- 블록 및 템플릿 관리

### ⏰ [시간 처리 시스템](./mcp-tools-time.md)
**Time MCP** - 시간대 변환, 현재 시간 관리
- 글로벌 시간대 변환
- 실시간 시간 조회
- 날짜 형식 변환

### 🤔 [AI 사고 시스템](./mcp-tools-thinking.md)
**Sequential Thinking MCP** - 체계적 사고 프로세스
- 단계별 문제 해결
- 사고 과정 추적
- 논리적 추론 지원

### 📚 [문서 검색 시스템](./mcp-tools-context7.md)
**Context7 MCP** - 라이브러리 문서 검색
- 기술 문서 검색
- API 레퍼런스 조회
- 코드 예제 탐색

### 🔧 [코드 분석 시스템](./mcp-tools-serena.md)
**Serena MCP** - 25개 코드 분석 도구
- 심볼 분석 및 검색
- 코드 패턴 탐지
- 파일 구조 분석

### 🐘 [데이터베이스 시스템](./mcp-tools-supabase.md)
**Supabase MCP** - PostgreSQL + Vector DB
- SQL 쿼리 실행
- 타입 생성 및 마이그레이션
- Vector 검색 지원

### 🎭 [브라우저 자동화](./mcp-tools-playwright.md)
**Playwright MCP** - E2E 테스트 및 자동화
- 페이지 네비게이션
- 요소 상호작용
- 스크린샷 및 테스트

---

## 🚀 빠른 시작

### 1️⃣ 기본 설정 확인
```bash
# MCP 서버 상태 확인
claude-code mcp status

# 활성 서버 조회
claude-code mcp list
```

### 2️⃣ 주요 도구 활용
```typescript
// 지식 관리
await mcp__memory__create_entities([...])

// UI 컴포넌트 생성
await mcp__shadcn__get_component({ name: "button" })

// 현재 시간 조회
await mcp__time__get_current_time({ timezone: "Asia/Seoul" })
```

### 3️⃣ 활용 패턴
- **개발 워크플로우**: Serena → ShadCN → Memory 순서로 활용
- **테스트 자동화**: Playwright → Supabase 데이터 검증
- **문서화 자동화**: Context7 → Memory 지식 축적

---

## 📖 추가 가이드

### 🛠️ [MCP 종합 가이드](../MCP-GUIDE.md)
MCP 서버 설치, 설정, 활용에 대한 종합 가이드

### ⚡ [MCP 성능 최적화](./mcp-performance-guide.md)
MCP 도구 성능 최적화 및 베스트 프랙티스

### 🔧 [MCP 문제해결](./mcp-troubleshooting.md)
MCP 관련 문제 해결 및 디버깅 가이드

---

**💡 팁**: 각 도구 문서에는 실제 사용 예제와 함께 성능 최적화 방법이 포함되어 있습니다.