# 📚 Storybook 개발 가이드

## 🎯 개요

OpenManager Vibe v5의 Storybook 컴포넌트 개발 및 문서화 시스템 가이드입니다.
**개발자 전용 도구**로 외부 배포하지 않고 로컬 개발환경에서만 사용합니다.

## 🛠️ 개발 사용법

### 1. Storybook 개발 서버 실행

```bash
# 기본 Storybook 개발 서버 (브라우저 자동 열림)
npm run storybook

# 브라우저 자동 열기 없이 실행
npm run storybook:dev

# 문서 모드로 실행
npm run storybook:docs
```

### 2. 개발 워크플로우

1. **컴포넌트 개발**: 새 컴포넌트 작성
2. **스토리 작성**: `ComponentName.stories.tsx` 파일 생성
3. **Storybook 확인**: `http://localhost:6006`에서 확인
4. **반복 개발**: 실시간으로 변경사항 확인

### 3. Cursor IDE 통합

- **자동 완성**: TypeScript 기반 props 자동 완성
- **실시간 미리보기**: 저장 시 자동 새로고침
- **컴포넌트 탐색**: 스토리를 통한 컴포넌트 상태 확인
- **코드 네비게이션**: 스토리에서 컴포넌트 코드로 바로 이동

## 📖 Stories 목록

### 시스템 컴포넌트

- **SystemControlPanel** - 통합 시스템 제어 패널
  - 10가지 시스템 상태 시나리오
  - 프로세스 모니터링 및 제어
  - 30분 안정성 카운트다운

### 차트 컴포넌트

- **RealtimeChart** - 실시간 메트릭 차트
  - 12가지 모니터링 시나리오
  - CPU, 메모리, 디스크, 네트워크 메트릭
  - AI 예측 라인과 이상 감지

### 실시간 컴포넌트

- **RealtimeStatus** - WebSocket 연결 상태
  - 15가지 연결 상태 시나리오
  - 컴팩트 모드 및 상세 모드
  - 재연결 기능과 애니메이션

### 에러 처리

- **ErrorBoundary** - 에러 경계 컴포넌트
  - 다양한 에러 시나리오
  - 커스텀 폴백 UI
  - 하이드레이션 에러 처리

### 대시보드

- **AdminDashboardCharts** - 관리자 차트
  - 시스템 상태별 차트 표시
  - API 응답 시뮬레이션
  - 로딩 및 에러 상태

### AI 컴포넌트

- **AISidebar** - AI 사이드바
  - 좌우 위치 조정
  - 다양한 너비 설정
  - 모바일 반응형

### 토스트 시스템

- **EnhancedToastSystem** - 알림 시스템
  - 서버 모니터링 알림
  - 성능 경고
  - 배치 알림 처리

## 🎨 테마 및 스타일

### 지원하는 테마

- **라이트 모드**: 기본 밝은 테마
- **다크 모드**: 어두운 배경 테마
- **시스템 모드**: OS 설정에 따라 자동 전환

### 반응형 디자인

- **데스크톱**: 1200px 이상
- **태블릿**: 768px - 1199px
- **모바일**: 767px 이하

## 📱 모바일 최적화

모든 컴포넌트는 모바일 기기에서 최적화된 경험을 제공합니다:

- 터치 친화적 인터페이스
- 적응형 레이아웃
- 성능 최적화

## 🔧 개발 가이드

### 새 Story 추가

```typescript
// ComponentName.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import ComponentName from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: 'Category/ComponentName',
  component: ComponentName,
  parameters: {
    docs: {
      description: {
        component: '컴포넌트 설명',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: {
    // props
  },
};
```

### 인터랙티브 Story

```typescript
export const Interactive: Story = {
  args: {
    // props
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 인터랙션 시뮬레이션
  },
};
```

## 🧪 테스트

### Story 테스트 실행

```bash
# Storybook 테스트 러너
npm run test-storybook

# 접근성 테스트
npm run test-storybook:a11y
```

### 시각적 회귀 테스트

```bash
# Chromatic 사용 (설정 필요)
npm run chromatic
```

## 📊 메트릭 및 성능

### 번들 크기 최적화

- 코드 스플리팅 적용
- 트리 쉐이킹 최적화
- 이미지 최적화

### 성능 지표

- 초기 로딩: < 3초
- 스토리 전환: < 500ms
- 메모리 사용량: < 100MB

## 🔍 디버깅

### 개발 도구

- **React DevTools**: 컴포넌트 디버깅
- **Storybook Actions**: 이벤트 로깅
- **Controls**: 실시간 props 조정

### 로그 확인

```bash
# Storybook 개발 서버 로그
npm run storybook -- --debug

# 빌드 로그
npm run build-storybook -- --debug
```

## 📚 참고 자료

- [Storybook 공식 문서](https://storybook.js.org/docs)
- [MDX 문서 작성법](https://storybook.js.org/docs/react/writing-docs/mdx)
- [Addon 활용법](https://storybook.js.org/addons)

## 🆘 문제 해결

### 자주 발생하는 문제

1. **빌드 실패**

   ```bash
   rm -rf node_modules storybook-static
   npm install
   npm run storybook:build
   ```

2. **메모리 부족**

   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run storybook:build
   ```

3. **포트 충돌**

   ```bash
   # 다른 포트 사용
   npm run storybook -- --port 6008
   ```

## ✨ 기여 가이드

1. 새 컴포넌트 Story 작성
2. 다양한 시나리오 커버
3. 접근성 고려
4. 모바일 최적화
5. 한국어 설명 추가

---

**마지막 업데이트**: 2025-06-09
**Storybook 버전**: 7.x
**지원 브라우저**: Chrome, Firefox, Safari, Edge
