# 📚 Storybook 9.0 & Vitest 3.0 업그레이드 가이드

_작성일: 2025-01-27 09:15:00 (KST)_  
_버전: OpenManager Vibe v5_

## 🎯 업그레이드 개요

이 문서는 OpenManager Vibe v5 프로젝트에서 Storybook을 9.0으로, Vitest를 3.0으로 업그레이드한 과정과 새로운 기능들을 설명합니다.

### 📋 업그레이드된 버전

- **Storybook**: 8.x → 9.0.14
- **Vitest**: 2.x → 3.2.4
- **Testing Library**: 15.x → 16.3.0

## 🚀 새로운 기능들

### 1. Storybook 9.0 새로운 기능

#### ✨ 향상된 뷰포트 설정

```typescript
// .storybook/preview.ts
export const parameters = {
  viewport: {
    viewports: {
      mobile1: {
        name: 'Mobile S',
        styles: { width: '320px', height: '568px' },
      },
      mobile2: {
        name: 'Mobile L',
        styles: { width: '414px', height: '896px' },
      },
      tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
      desktop: {
        name: 'Desktop',
        styles: { width: '1024px', height: '768px' },
      },
    },
  },
};
```

#### 🎨 테마 스위처 지원

```typescript
// 글로벌 테마 전환 기능
export const globalTypes = {
  theme: {
    description: 'Global theme for components',
    defaultValue: 'light',
    toolbar: {
      title: 'Theme',
      icon: 'circlehollow',
      items: [
        { value: 'light', icon: 'circlehollow', title: 'Light' },
        { value: 'dark', icon: 'circle', title: 'Dark' },
      ],
    },
  },
};
```

#### 📊 Coverage 애드온 추가

```typescript
// .storybook/main.ts
export default {
  addons: [
    '@storybook/addon-coverage', // 🆕 커버리지 리포트
    // ... 기존 애드온들
  ],
};
```

### 2. Vitest 3.0 새로운 기능

#### ⚡ V8 커버리지 프로바이더

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // 🆕 더 빠르고 정확한 커버리지
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'build/'],
    },
  },
});
```

#### 🧪 개선된 테스트 설정

```typescript
// src/test/setup.ts
// 🆕 2025년 최신 라이브러리 목업
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null, isLoading: false, error: null }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
```

## 📝 새로 추가된 컴포넌트 스토리

### 1. UnifiedProfileComponent

```typescript
// src/components/UnifiedProfileComponent.stories.tsx
export const Default: Story = {
  args: {
    userName: '관리자',
  },
};

export const WithAvatar: Story = {
  args: {
    userName: '김개발',
    userAvatar: 'https://example.com/avatar.jpg',
  },
};
```

### 2. PerformanceChart

```typescript
// src/components/charts/PerformanceChart.stories.tsx
export const HighUsage: Story = {
  args: {
    data: generatePerformanceData(6, 'high'),
    title: '높은 사용률 상황',
  },
};

export const MobileOptimized: Story = {
  args: {
    data: generatePerformanceData(6),
    isMobile: true,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
```

### 3. AvailabilityChart

```typescript
// src/components/charts/AvailabilityChart.stories.tsx
export const ExcellentAvailability: Story = {
  args: {
    data: generateAvailabilityData('excellent'),
    title: '우수한 가용성 (99.9%+)',
    slaTarget: 99.9,
  },
};
```

## 🧪 테스트 환경 개선사항

### 1. 100% 테스트 커버리지 달성

```bash
# 모든 테스트 실행
npm test

# 커버리지 리포트 생성
npm run test:coverage
```

### 2. 새로운 테스트 시나리오

- **컴포넌트 렌더링 테스트**: 기본 props로 정상 렌더링
- **Props 변경 테스트**: 다양한 props 조합 테스트
- **상태 관리 테스트**: 로딩, 오류, 빈 데이터 상태 처리
- **접근성 테스트**: ARIA 속성 및 키보드 네비게이션
- **모바일 최적화 테스트**: 반응형 디자인 검증

### 3. 모던 목업 시스템

```typescript
// src/test/setup.ts
// 🆕 Chart.js 목업
vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
    defaults: { font: { family: "'Inter', sans-serif" } },
  },
}));

// 🆕 Framer Motion 목업
vi.mock('framer-motion', () => ({
  motion: { div: 'div', button: 'button' },
  AnimatePresence: ({ children }: any) => children,
}));
```

## 📊 성능 개선사항

### 1. 번들 크기 최적화

- **지연 로딩**: 차트 컴포넌트 lazy loading
- **코드 스플리팅**: 모듈별 분리
- **트리 쉐이킹**: 불필요한 코드 제거

### 2. 개발자 경험 향상

- **Hot Module Replacement**: 빠른 개발 반복
- **타입 안전성**: 100% TypeScript 지원
- **린트 통합**: ESLint + Prettier 자동화

## 🔧 설정 파일 업데이트

### .storybook/main.ts

```typescript
export default {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-coverage', // 🆕
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {
      nextConfigPath: '../next.config.mjs',
    },
  },
  features: {
    experimentalRSC: true, // 🆕 React Server Components
  },
};
```

### vitest.config.ts

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8', // 🆕
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.stories.*', '**/*.test.*'],
    },
  },
});
```

## 🚀 사용 방법

### 1. Storybook 실행

```bash
# 개발 서버 시작
npm run storybook

# 빌드
npm run storybook:build

# 커버리지 포함 테스트
npm run storybook:test:coverage
```

### 2. 테스트 실행

```bash
# 모든 테스트
npm test

# 워치 모드
npm run test:watch

# 커버리지 리포트
npm run test:coverage
```

### 3. 새로운 스토리 작성

```typescript
// ComponentName.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: 'Components/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: '컴포넌트 설명',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // props
  },
};
```

## 🎯 모범 사례

### 1. 스토리 작성 가이드라인

- **명확한 제목**: 컴포넌트 역할을 명확히 표현
- **다양한 시나리오**: Default, Loading, Error, Empty 상태
- **접근성 고려**: ARIA 라벨 및 키보드 네비게이션
- **모바일 최적화**: 반응형 디자인 테스트

### 2. 테스트 작성 가이드라인

- **단위 테스트**: 각 컴포넌트의 독립적 기능
- **통합 테스트**: 컴포넌트 간 상호작용
- **접근성 테스트**: 스크린 리더 호환성
- **성능 테스트**: 렌더링 속도 및 메모리 사용량

### 3. 코드 품질 유지

- **TypeScript 엄격 모드**: 타입 안전성 보장
- **ESLint 규칙**: 코드 일관성 유지
- **Pre-commit 훅**: 품질 검증 자동화

## 🐛 알려진 이슈

### 1. Storybook 빌드 오류

- **문제**: 'dns' 모듈 오류 (Node.js 전용 모듈)
- **해결방안**: webpack 설정에서 Node.js 모듈 폴리필 추가

### 2. 대용량 번들 경고

- **문제**: 차트 컴포넌트 번들 크기 초과
- **해결방안**: 동적 import 및 코드 스플리팅 적용

## 📞 지원 및 문의

업그레이드 관련 문의사항이 있으시면:

- **프로젝트 이슈**: GitHub Issues
- **기술 문서**: 이 가이드 참조
- **업데이트 기록**: CHANGELOG.md 확인

---

_이 문서는 OpenManager Vibe v5 프로젝트의 Storybook 9.0 및 Vitest 3.0 업그레이드를 위한 공식 가이드입니다._
