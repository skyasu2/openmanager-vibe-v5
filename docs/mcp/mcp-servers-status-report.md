ARCHIVED

> 작성일: 2025-08-03  
> 프로젝트: OpenManager VIBE v5

## 📊 전체 현황

**총 11개 MCP 서버** - 모두 정상 작동 중 ✅

## 🔧 MCP 서버별 상세 현황

### 1. filesystem (파일 시스템)

- **상태**: ✅ Connected
- **용도**: 파일 읽기/쓰기, 디렉토리 관리
- **특징**: 프로젝트 디렉토리 `/mnt/d/cursor/openmanager-vibe-v5` 전용

### 2. memory (지식 그래프)

- **상태**: ✅ Connected
- **용도**: 엔티티 관계 관리, 지식 저장
- **활용**: 프로젝트 구조, 컴포넌트 관계 저장

### 3. sequential-thinking (문제 해결)

- **상태**: ✅ Connected
- **용도**: 복잡한 문제의 단계별 분석
- **특징**: 최대 100단계까지 사고 체인 생성

### 4. playwright (브라우저 자동화)

- **상태**: ✅ Connected
- **용도**: E2E 테스트, 스크린샷, 웹 스크래핑
- **활용**: Storybook visual regression testing

### 5. context7 (문서 검색)

- **상태**: ✅ Connected
- **용도**: 라이브러리 최신 문서 검색
- **지원**: Next.js, React, Supabase 등 주요 라이브러리

### 6. time (시간 관리)

- **상태**: ✅ Connected
- **용도**: 정확한 시간 기록, 시간대 변환
- **기본**: Asia/Seoul 타임존

### 7. supabase (데이터베이스)

- **상태**: ✅ Connected
- **프로젝트**: vnswjnltnhpsueosfhmw
- **기능**: PostgreSQL 쿼리, 마이그레이션, RLS 정책

### 8. github (저장소 관리)

- **상태**: ✅ Connected
- **기능**: 이슈 생성, PR 관리, 파일 조작
- **토큰**: 환경변수 설정됨

### 9. serena (코드 분석)

- **상태**: ✅ Connected
- **용도**: 심볼 기반 코드 분석, 리팩토링
- **특징**: AST 기반 정밀 분석

### 10. tavily-remote (웹 검색)

- **상태**: ✅ Connected
- **용도**: 실시간 웹 검색, 콘텐츠 추출
- **API키**: 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

### 11. shadcn-ui (UI 컴포넌트) ⭐ NEW

- **상태**: ✅ Connected
- **버전**: v4 (최신)
- **컴포넌트**: 46개
- **블록**: 55개 (calendar, dashboard, login, sidebar, products)

## 🚀 주요 사용 패턴

### 1. 파일 작업 콤보

```typescript
// 파일 검색 → 읽기 → 수정
filesystem → serena → filesystem
```

### 2. 문서 기반 개발

```typescript
// 라이브러리 문서 → 코드 생성
context7 → filesystem
```

### 3. UI 개발 워크플로우

```typescript
// UI 컴포넌트 → Storybook → Visual Test
shadcn-ui → filesystem → playwright
```

### 4. 데이터베이스 작업

```typescript
// 스키마 확인 → 마이그레이션 → 쿼리
supabase (list_tables) → supabase (apply_migration) → supabase (execute_sql)
```

## 📈 사용 통계 (추정)

| MCP 서버            | 사용 빈도  | 주요 용도          |
| ------------------- | ---------- | ------------------ |
| filesystem          | ⭐⭐⭐⭐⭐ | 모든 파일 작업     |
| serena              | ⭐⭐⭐⭐   | 코드 분석/리팩토링 |
| supabase            | ⭐⭐⭐     | DB 작업            |
| github              | ⭐⭐⭐     | 버전 관리          |
| context7            | ⭐⭐⭐     | 문서 참조          |
| shadcn-ui           | ⭐⭐⭐     | UI 개발            |
| memory              | ⭐⭐       | 지식 관리          |
| tavily-remote       | ⭐⭐       | 정보 검색          |
| playwright          | ⭐⭐       | 테스트             |
| sequential-thinking | ⭐⭐       | 복잡한 분석        |
| time                | ⭐         | 시간 기록          |

## 🎯 권장 사항

### 신규 기능 활용

1. **shadcn-ui MCP**로 UI 개발 속도 향상
   - 46개 컴포넌트 즉시 사용
   - 55개 블록으로 페이지 빠른 구성

2. **sequential-thinking**으로 복잡한 문제 해결
   - 아키텍처 설계
   - 버그 원인 분석

3. **playwright + Storybook**으로 Visual Testing
   - 자동 스크린샷 캡처
   - UI 변경사항 감지

### 성능 최적화

- 큰 응답은 pagination 사용 (shadcn-ui blocks)
- 캐시 활용 (자주 사용하는 컴포넌트)
- 병렬 처리 (독립적인 MCP 호출)

## 📝 관련 문서

- [MCP 서버 완전 가이드](/docs/mcp-servers-complete-guide.md)
- [shadcn-ui MCP 사용 가이드](/docs/shadcn-ui-mcp-guide.md)
- [Time MCP 활용 가이드](/docs/time-mcp-usage-guide.md)
- [Supabase RLS 보안 가이드](/docs/supabase-rls-security-guide.md)
