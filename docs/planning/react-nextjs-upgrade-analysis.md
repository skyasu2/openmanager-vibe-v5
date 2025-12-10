# React/Next.js 업그레이드 회귀 분석

## 🔍 버전 변경 요약

| 패키지    | 이전 버전 (12/1 이전) | 현재 버전 | 변경 유형             |
| --------- | --------------------- | --------- | --------------------- |
| React     | ^18.3.0               | ^19.2.1   | **메이저 업그레이드** |
| React DOM | ^18.3.0               | ^19.2.1   | **메이저 업그레이드** |
| Next.js   | ^15.x                 | ^16.0.7   | **메이저 업그레이드** |

## ⚠️ React 19 주요 Breaking Changes

### 1. `ref` Props 처리 변경

```tsx
// React 18 (이전)
const Button = forwardRef((props, ref) => <button ref={ref} {...props} />);

// React 19 (현재) - ref가 일반 prop으로 전달됨
const Button = ({ ref, ...props }) => <button ref={ref} {...props} />;
```

**영향받는 파일들**:

- `src/components/ui/*.tsx` (대부분의 UI 컴포넌트)
- `forwardRef` 사용하는 모든 컴포넌트

### 2. Context API 변경

```tsx
// React 18
<Context.Provider value={value}>

// React 19 - Context를 직접 Provider로 사용 가능
<Context value={value}>
```

### 3. `use()` Hook 신규 추가

- Promise와 Context를 조건부로 읽을 수 있음
- 기존 `useContext` 대체 가능

### 4. Hydration 불일치 에러 강화

- React 19는 hydration 불일치를 더 엄격하게 처리
- 서버/클라이언트 렌더링 차이 시 경고가 아닌 에러 발생

## ⚠️ Next.js 16 주요 Breaking Changes

### 1. Turbopack 기본 활성화

- Webpack에서 Turbopack으로 전환
- 일부 Webpack 플러그인 호환성 문제 가능

### 2. CSS 처리 변경

- Tailwind CSS v4 호환성 개선
- 일부 CSS 클래스 우선순위 변경 가능

### 3. App Router 변경사항

- 메타데이터 API 변경
- 동적 라우팅 처리 변경

## 🎯 의심되는 문제 영역

### 1. Tailwind CSS v4 호환성 (높은 우선순위)

```css
/* 현재 globals.css에서 발견된 Tailwind v4 마이그레이션 흔적 */
@import "tailwindcss";
@plugin 'tailwindcss-animate';
@custom-variant dark (&:is(.dark *));
```

**문제 가능성**:

- `@theme` 블록 내 커스텀 속성 정의 문법 변경
- 기본 border-color가 `currentcolor`로 변경됨
- 일부 유틸리티 클래스 동작 변경

### 2. forwardRef 마이그레이션 (중간 우선순위)

- UI 컴포넌트들이 `forwardRef` 사용 중
- React 19에서는 `ref`가 일반 prop으로 전달됨

### 3. Hydration 불일치 (중간 우선순위)

- 서버/클라이언트 렌더링 차이
- `typeof window === 'undefined'` 체크 관련

## 📋 확인이 필요한 컴포넌트

1. **UI 컴포넌트** (`src/components/ui/`)

   - input.tsx, button.tsx, etc.
   - `forwardRef` 패턴 확인 필요

2. **AI 컴포넌트** (`src/components/ai/`)

   - AIWorkspace.tsx
   - AIAssistantIconPanel.tsx

3. **대시보드 컴포넌트** (`src/components/dashboard/`)
   - ServerDashboard.tsx
   - 차트 및 그리기 관련 컴포넌트

## 🔧 권장 조치

### 즉시 조치 (Quick Wins)

1. **브라우저 콘솔 에러 확인**

   - Hydration 불일치 에러
   - React 경고 메시지

2. **forwardRef 호환성 확인**

   ```bash
   grep -r "forwardRef" src/components --include="*.tsx"
   ```

3. **CSS 클래스 충돌 확인**
   - 브라우저 개발자 도구에서 적용된 스타일 확인

### 심층 분석 필요

1. 특정 문제 페이지/컴포넌트 식별
2. 업그레이드 전 커밋으로 체크아웃하여 비교 테스트
3. React 19 마이그레이션 가이드 적용

## 🚀 다음 단계

사용자 확인 필요:

1. **어떤 페이지**에서 문제가 발생하나요?
2. **구체적인 증상**은 무엇인가요? (레이아웃 깨짐, 텍스트 겹침 등)
3. **브라우저 콘솔**에 에러 메시지가 있나요?

이 정보가 있으면 정확한 원인을 찾고 수정할 수 있습니다.
