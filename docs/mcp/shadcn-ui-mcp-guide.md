ARCHIVED

## 🎨 개요

shadcn-ui MCP는 shadcn/ui v4 컴포넌트 라이브러리의 모든 컴포넌트와 블록에 접근할 수 있는 MCP 서버입니다.

## 📦 주요 기능

### 1. 컴포넌트 관리

- **46개의 기본 컴포넌트** 제공
- 컴포넌트 소스 코드 가져오기
- 컴포넌트 메타데이터 조회
- 데모 코드 제공

### 2. 블록 시스템

- **55개의 미리 만들어진 블록** 제공
- 카테고리: calendar, dashboard, login, sidebar, products
- 복잡한 UI 패턴 즉시 사용 가능

## 🔧 사용법

### 컴포넌트 목록 조회

```typescript
// 사용 가능한 모든 컴포넌트 목록
(await mcp__shadcn) - ui__list_components();
// 결과: 46개 컴포넌트 (accordion, alert, button, card, ...)
```

### 컴포넌트 메타데이터 확인

```typescript
// button 컴포넌트의 의존성 확인
(await mcp__shadcn) -
  ui__get_component_metadata({
    componentName: 'button',
  });
// 결과: dependencies: ["@radix-ui/react-slot"]
```

### 컴포넌트 소스 코드 가져오기

```typescript
// button 컴포넌트의 전체 소스 코드
(await mcp__shadcn) -
  ui__get_component({
    componentName: 'button',
  });
// 결과: Button 컴포넌트의 TypeScript 코드
```

### 데모 코드 확인

```typescript
// button 사용 예시 코드
(await mcp__shadcn) -
  ui__get_component_demo({
    componentName: 'button',
  });
// 결과: Button 컴포넌트 사용 예시
```

### 블록 목록 조회

```typescript
// 카테고리별 블록 목록
(await mcp__shadcn) -
  ui__list_blocks({
    category: 'login', // 선택사항: calendar, dashboard, login, sidebar, products
  });
// 결과: 5개의 로그인 블록 (login-01 ~ login-05)
```

### 블록 소스 코드 가져오기

```typescript
// login-01 블록의 전체 구조와 코드
(await mcp__shadcn) -
  ui__get_block({
    blockName: 'login-01',
    includeComponents: true, // 관련 컴포넌트 포함
  });
// 결과: 로그인 폼 페이지 전체 코드
```

## 📋 사용 가능한 컴포넌트 (46개)

### 기본 컴포넌트

- `button`, `input`, `label`, `textarea`, `select`
- `checkbox`, `radio-group`, `switch`, `toggle`

### 레이아웃

- `card`, `dialog`, `sheet`, `drawer`
- `tabs`, `accordion`, `collapsible`

### 네비게이션

- `navigation-menu`, `menubar`, `breadcrumb`
- `command`, `dropdown-menu`, `context-menu`

### 피드백

- `alert`, `alert-dialog`, `tooltip`, `toast` (sonner)
- `progress`, `skeleton`

### 데이터 표시

- `table`, `badge`, `avatar`
- `hover-card`, `popover`

### 폼

- `form`, `input-otp`

### 기타

- `calendar`, `carousel`, `chart`
- `separator`, `scroll-area`, `aspect-ratio`
- `resizable`, `sidebar`, `pagination`

## 🎯 활용 예시

### 1. 로그인 페이지 빠르게 구성

```typescript
// 1. 로그인 블록 가져오기
const loginBlock =
  (await mcp__shadcn) -
  ui__get_block({
    blockName: 'login-01',
  });

// 2. 프로젝트에 파일 복사
// - components/login-form.tsx
// - app/login/page.tsx

// 3. 필요한 컴포넌트 설치
// Button, Card, Input, Label 등
```

### 2. 대시보드 레이아웃 구성

```typescript
// 1. 사이드바 블록 선택
const sidebar =
  (await mcp__shadcn) -
  ui__get_block({
    blockName: 'sidebar-01',
  });

// 2. 대시보드 블록 추가
const dashboard =
  (await mcp__shadcn) -
  ui__get_block({
    blockName: 'dashboard-01',
  });
```

### 3. 커스텀 컴포넌트 생성

```typescript
// 1. 기본 컴포넌트 가져오기
const button =
  (await mcp__shadcn) -
  ui__get_component({
    componentName: 'button',
  });

// 2. 데모 코드 참고
const demo =
  (await mcp__shadcn) -
  ui__get_component_demo({
    componentName: 'button',
  });

// 3. 프로젝트에 맞게 수정
```

## ⚡ 성능 팁

1. **필요한 컴포넌트만 가져오기**
   - 전체 라이브러리 대신 개별 컴포넌트 import

2. **블록 사용 시 주의**
   - dashboard-01 같은 대형 블록은 응답 크기가 클 수 있음
   - includeComponents: false로 메인 파일만 먼저 확인

3. **캐싱 활용**
   - 자주 사용하는 컴포넌트는 로컬에 저장

## 🔗 연동 방법

### Next.js 프로젝트에 통합

1. 필요한 유틸리티 함수 설정 (`lib/utils.ts`)
2. Tailwind CSS 설정
3. 컴포넌트 복사 및 import 경로 수정

### 스타일 커스터마이징

- CSS 변수를 통한 테마 설정
- Tailwind 클래스로 스타일 오버라이드
- variant와 size props 활용

## 📚 참고 사항

- **v4 버전** 기준 (최신 버전)
- **MIT 라이선스**로 자유롭게 사용 가능
- **Radix UI** 기반으로 접근성 보장
- **TypeScript** 완벽 지원

## 🚨 주의사항

1. **import 경로 수정 필요**
   - `@/registry/new-york-v4/` → 프로젝트 경로로 변경

2. **의존성 설치**
   - Radix UI 패키지들 별도 설치 필요
   - class-variance-authority (cva) 설치 필요

3. **스타일 설정**
   - globals.css에 CSS 변수 추가 필요
   - tailwind.config.js 설정 확인
