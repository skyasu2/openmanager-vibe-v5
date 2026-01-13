# React 컴포넌트 테스트 가이드

**작성일**: 2025-11-26
**목적**: React Testing Library를 사용한 컴포넌트 UI 테스트

---

## 🎯 개요

React Testing Library를 사용하여 사용자 중심의 컴포넌트 테스트를 작성합니다.

**핵심 원칙**: 구현 세부사항이 아닌 사용자가 보는 대로 테스트

---

## 📦 설치

```bash
# 이미 설치됨
npm install -D @testing-library/react @testing-library/jest-dom
```

**의존성**:

- `@testing-library/react`: ^16.1.0
- `@testing-library/jest-dom`: ^6.6.3
- `vitest`: ^3.2.4
- `jsdom`: 테스트 환경

---

## 🛠️ 구현된 테스트

### 1. StatusIcon 컴포넌트 (18개 테스트)

**파일**: `tests/unit/components/StatusIcon.test.tsx`

**테스트 카테고리**:

1. **기본 렌더링** (2개)
   - 정상적으로 렌더링
   - 컨테이너 클래스 적용

2. **상태별 스타일** (3개)
   - 에러 상태: 빨간색 (border-red-500, bg-red-500/10)
   - 완료 상태: 녹색 (border-green-500, bg-green-500/10)
   - 진행 중 상태: 파란색 (border-blue-500, bg-blue-500/10)

3. **크기 옵션** (3개)
   - sm: w-8 h-8
   - md: w-12 h-12 (기본값)
   - lg: w-16 h-16

4. **아이콘 표시** (3개)
   - customIcon 사용
   - 활성 상태: animate-pulse 클래스
   - 비활성 상태: animate-pulse 없음

5. **로딩 링 애니메이션** (3개)
   - 활성 상태: 회전 링 표시
   - 완료 상태: 회전 링 숨김
   - 에러 상태: 회전 링 숨김

6. **단계별 아이콘 변경** (1개)
   - currentStep 변경 시 아이콘 재렌더링

7. **엣지 케이스** (3개)
   - 음수 currentStep 처리
   - 매우 큰 currentStep 처리
   - 빈 문자열 error 처리

**실행 결과**: ✅ 18/18 passed (71ms)

### 2. ProgressLabel 컴포넌트 (24개 테스트)

**파일**: `tests/unit/components/ProgressLabel.test.tsx`

**테스트 카테고리**:

1. **기본 렌더링** (2개)
   - 정상적으로 렌더링
   - 제목과 설명 렌더링

2. **진행률 표시** (4개)
   - 진행률 계산 로직 검증
   - custom progress 우선 사용
   - 100% 완료 메시지
   - showProgress=false 처리

3. **format 옵션** (4개)
   - `percentage`: 진행률: XX%
   - `step-count`: X / Y 단계
   - `custom`: stepDescription 사용 (제목과 설명 모두)
   - `customTitle`: 사용자 정의 제목

4. **에러 상태** (3개)
   - 에러 메시지 표시 (❌)
   - 빨간색 스타일 (text-red-400)
   - 빨간색 진행 바 (bg-red-400)

5. **완료 상태** (3개)
   - 완료 메시지 표시 (✅)
   - 녹색 스타일 (text-green-400)
   - 녹색 진행 바 (bg-green-400)

6. **진행 중 상태** (2개)
   - 파란색 스타일 (text-blue-400)
   - 파란색 진행 바 (bg-blue-400)

7. **동적 업데이트** (2개)
   - currentStep 변경 → 진행률 업데이트
   - stepDescription 변경 → 설명 업데이트

8. **엣지 케이스** (4개)
   - totalSteps=1 처리
   - currentStep > totalSteps → 100% 제한
   - progress > 100 → 완료 상태
   - stepDescription 없음 → 기본 설명

**실행 결과**: ✅ 24/24 passed (71ms)

---

## 🎨 테스트 작성 패턴

### 기본 구조

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('정상적으로 렌더링된다', () => {
    const { container } = render(<MyComponent />);
    expect(container.firstChild).toBeDefined();
  });
});
```

### 주요 쿼리 메서드

```typescript
// 텍스트로 찾기
screen.getByText('Hello World');
screen.getAllByText('Duplicate Text'); // 여러 개 허용

// Role로 찾기
screen.getByRole('button', { name: 'Submit' });

// Test ID로 찾기
screen.getByTestId('custom-element');

// CSS 선택자로 찾기 (container 사용)
const { container } = render(<Component />);
container.querySelector('.border-2');
```

### 상태 테스트

```typescript
it('활성 상태일 때 파란색 스타일이 적용된다', () => {
  const { container } = render(
    <StatusIcon isActive={true} />
  );

  const element = container.querySelector('.border-2');
  expect(element?.className).toContain('border-blue-500');
});
```

### 동적 업데이트 테스트

```typescript
it('props 변경 시 재렌더링된다', () => {
  const { rerender } = render(<Component step={0} />);
  expect(screen.getByText('Step 1')).toBeDefined();

  rerender(<Component step={1} />);
  expect(screen.getByText('Step 2')).toBeDefined();
});
```

---

## 🔧 중요한 패턴 및 주의사항

### 1. SVG 요소의 className 처리

```typescript
// ❌ SVG는 className이 SVGAnimatedString 객체
expect(svgElement?.className).toContain('animate-pulse');

// ✅ classList.contains() 사용
expect(svgElement?.classList.contains('animate-pulse')).toBe(true);
```

### 2. 중복 텍스트 처리

```typescript
// ❌ 여러 요소에 같은 텍스트가 있으면 실패
expect(screen.getByText('커스텀 설명')).toBeDefined();

// ✅ getAllByText로 여러 요소 검증
const elements = screen.getAllByText('커스텀 설명');
expect(elements.length).toBe(2);
```

### 3. CSS 선택자 사용

```typescript
// ❌ 불안정한 선택자 (DOM 구조 변경에 취약)
container.querySelector('div > div');

// ✅ 명확한 클래스 선택자
container.querySelector('.border-2');
```

### 4. 엣지 케이스 테스트

```typescript
describe('엣지 케이스', () => {
  it('음수 값 처리', () => {
    const { container } = render(<Component value={-1} />);
    expect(container.firstChild).toBeDefined();
  });

  it('빈 문자열 처리', () => {
    const { container } = render(<Component text="" />);
    expect(container.querySelector('.error')).toBeNull();
  });
});
```

---

## 🚀 테스트 실행

### 컴포넌트 테스트만 실행

```bash
# 모든 컴포넌트 테스트
npm run test -- tests/unit/components/ --run

# 특정 컴포넌트
npm run test -- tests/unit/components/StatusIcon.test.tsx --run
npm run test -- tests/unit/components/ProgressLabel.test.tsx --run
```

### 전체 테스트에 포함

```bash
npm run test           # 모든 Vitest 테스트 (컴포넌트 테스트 포함)
npm run test:quick     # 빠른 테스트
npm run validate:all   # 린트 + 타입 + 테스트
```

---

## 📊 테스트 결과 (2025-11-26)

| 컴포넌트      | 기본   | 스냅샷 | 접근성 | 합계   | 실행 시간 |
| ------------- | ------ | ------ | ------ | ------ | --------- |
| StatusIcon    | 18     | 7      | 4      | 29     | 179ms     |
| ProgressLabel | 24     | 7      | 4      | 35     | 220ms     |
| **합계**      | **42** | **14** | **8**  | **64** | **399ms** |

**성능**: 64개 테스트가 399ms에 실행 (매우 빠름)
**커버리지**: 기본 + 스냅샷 + 접근성 = 3가지 테스트 레이어

---

## 🎯 언제 컴포넌트 테스트를 작성하나요?

### ✅ 작성해야 하는 경우

1. **재사용 가능한 UI 컴포넌트**
   - Button, Input, Card, Modal 등
   - 예: `StatusIcon`, `ProgressLabel`

2. **복잡한 상태 로직**
   - 여러 상태에 따라 UI가 변경
   - 예: 로딩/완료/에러 상태 전환

3. **사용자 인터랙션**
   - 클릭, 입력, 드래그 등
   - 예: Form, Dropdown, Slider

4. **조건부 렌더링**
   - props에 따라 다른 UI 표시
   - 예: 권한별 메뉴, 역할별 버튼

### ⛔ 작성하지 않아도 되는 경우

1. **단순 표시 컴포넌트**
   - 단순히 props를 그대로 렌더링
   - 예: `<Text>{props.text}</Text>`

2. **페이지 컴포넌트**
   - E2E 테스트로 대체 가능
   - 예: `/dashboard`, `/settings`

3. **Third-party 라이브러리 래퍼**
   - 라이브러리 자체가 테스트됨
   - 예: `<ReactMarkdown>` 단순 사용

---

## 🔧 Vitest 설정

**파일**: `config/testing/vitest.config.main.ts`

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // ✅ React 컴포넌트 테스트 환경
    setupFiles: ['./src/test/setup.ts', './config/testing/msw-setup.ts'],
    include: [
      'tests/unit/**/*.{test,spec}.{js,ts,tsx}', // ✅ 컴포넌트 테스트 포함
    ],
  },
});
```

---

## 📚 관련 문서

- **[타입 레벨 테스트 가이드](./type-level-testing-guide.md)** - expectTypeOf 사용법
- **[Supertest 통합 가이드](./supertest-integration-guide.md)** - API 테스트 (보류)
- **[React Testing Library 공식 문서](https://testing-library.com/docs/react-testing-library/intro)**
- **[Vitest 공식 문서](https://vitest.dev/)**

---

## 📸 Snapshot Testing (추가됨 2025-11-26)

### 개요

스냅샷 테스트는 컴포넌트의 렌더링 결과를 저장하고, 이후 변경사항을 자동으로 감지합니다.

### 구현 현황

- **StatusIcon**: 7개 스냅샷 (기본/에러/완료/진행 중/커스텀 아이콘/크기별)
- **ProgressLabel**: 7개 스냅샷 (기본/에러/완료/다양한 포맷)

### 사용법

```typescript
describe('스냅샷 테스트', () => {
  it('기본 상태 스냅샷', () => {
    const { container } = render(<StatusIcon currentStep={0} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

### 스냅샷 업데이트

```bash
# 스냅샷 생성/업데이트
npm run test -- tests/unit/components/ --run -u

# 스냅샷 검증만 (CI/CD)
npm run test -- tests/unit/components/ --run
```

### 언제 사용하나?

**✅ 좋은 경우**:

- UI 회귀 테스트 (예상치 못한 변경 감지)
- 복잡한 마크업 구조 검증
- 스타일 변경 추적

**⛔ 피해야 할 경우**:

- 동적 데이터 (날짜, 랜덤값 등)
- 자주 변경되는 UI
- 외부 API 응답

---

## ♿ Accessibility Testing (추가됨 2025-11-26)

### 개요

jest-axe를 사용하여 WCAG 접근성 기준을 자동으로 검증합니다.

### 설치

```bash
npm install -D jest-axe
```

### 설정

```typescript
// src/test/setup.ts
import { expect } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);
```

### 구현 현황

- **StatusIcon**: 4개 접근성 테스트 (기본/에러/완료/진행 중)
- **ProgressLabel**: 4개 접근성 테스트 (기본/에러/완료/다양한 포맷)

### 사용법

```typescript
import { axe } from 'jest-axe';

describe('접근성 테스트', () => {
  it('접근성 위반이 없다', async () => {
    const { container } = render(<Button>클릭</Button>);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 검증 항목

- 색상 대비 (WCAG AA/AAA)
- ARIA 속성 (role, aria-label 등)
- 키보드 네비게이션
- 스크린 리더 지원
- 폼 요소 라벨링

### 접근성 개선 예시

```typescript
// ❌ Before: 접근성 위반
<button className="icon-only">
  <Icon />
</button>

// ✅ After: 접근성 준수
<button aria-label="닫기" className="icon-only">
  <Icon />
</button>
```

### CI/CD 통합

```yaml
# .github/workflows/test.yml
- name: Run accessibility tests
  run: npm run test -- tests/unit/components/ --run
```

---

## 🎓 다음 단계

### 1. 추가 컴포넌트 테스트

복잡한 UI 로직을 가진 컴포넌트 우선:

```typescript
// tests/unit/components/ServerCard.test.tsx
// tests/unit/components/AlertBanner.test.tsx
// tests/unit/components/ChartDisplay.test.tsx
```

### 2. 사용자 인터랙션 테스트

```typescript
import { fireEvent } from '@testing-library/react';

it('버튼 클릭 시 핸들러 호출', () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick} />);

  fireEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### 3. 비동기 컴포넌트 테스트

```typescript
import { waitFor } from '@testing-library/react';

it('데이터 로딩 후 렌더링', async () => {
  render(<AsyncComponent />);

  await waitFor(() => {
    expect(screen.getByText('Data Loaded')).toBeDefined();
  });
});
```

---

## 💡 핵심 요약

1. **3가지 테스트 레이어**
   - 기본 테스트: 기능 및 동작 검증 (42개)
   - 스냅샷 테스트: UI 회귀 방지 (14개)
   - 접근성 테스트: WCAG 준수 검증 (8개)

2. **사용자 중심 테스트**
   - 구현 세부사항이 아닌 사용자가 보는 대로
   - Role, Text, Label로 요소 찾기
   - 실제 사용 시나리오 검증

3. **React Testing Library + jest-axe**
   - render, screen, fireEvent, waitFor
   - toMatchSnapshot으로 UI 회귀 방지
   - toHaveNoViolations로 접근성 검증
   - Vitest와 완벽 통합

4. **빠르고 포괄적**
   - 64개 테스트가 399ms에 실행
   - jsdom 환경에서 실행
   - 기능 + 회귀 + 접근성 = 3중 안전망

5. **실전 적용**
   - 재사용 가능한 컴포넌트 우선
   - 복잡한 상태 로직 검증
   - 엣지 케이스 처리 확인
   - 접근성 기준 자동 검증

---

**결론**: React 컴포넌트 테스트는 기능 검증, UI 회귀 방지, 접근성 준수를 동시에 보장합니다. 3가지 테스트 레이어로 리팩토링 안전성과 사용자 경험을 모두 향상시킬 수 있습니다.
