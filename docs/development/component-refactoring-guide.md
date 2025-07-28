# 🏗️ 컴포넌트 리팩토링 가이드

## 🎯 목표

거대 컴포넌트를 작고 관리하기 쉬운 단위로 분할하여 유지보수성과 재사용성을 향상시킵니다.

## 📊 현재 문제점

### 거대 컴포넌트 목록

1. **UnifiedAdminDashboard.tsx**: 1,308줄
2. **EnhancedServerModal.tsx**: 1,062줄
3. **LogDashboard.tsx**: 1,027줄
4. **UnifiedMetricsManager.ts**: 995줄
5. **PerformanceDashboard.tsx**: 956줄

## 🔨 리팩토링 전략

### 1. 컴포넌트 분할 원칙

#### Single Responsibility Principle

- 각 컴포넌트는 하나의 명확한 책임만 가져야 함
- 100줄 이하의 함수, 800줄 이하의 파일

#### 분할 패턴

```typescript
// Before: 거대한 단일 컴포넌트
export function UnifiedAdminDashboard() {
  // 1300+ 줄의 코드
  // 상태 관리, UI 렌더링, 비즈니스 로직 혼재
}

// After: 분할된 컴포넌트 구조
// 1. 컨테이너 컴포넌트 (상태 관리)
export function AdminDashboardContainer() {
  const { data, actions } = useAdminDashboard();
  return <AdminDashboardView {...data} {...actions} />;
}

// 2. 프레젠테이션 컴포넌트 (UI)
export function AdminDashboardView(props: AdminDashboardViewProps) {
  return (
    <>
      <AdminHeader {...props.header} />
      <AdminMetrics {...props.metrics} />
      <AdminLogs {...props.logs} />
      <AdminAlerts {...props.alerts} />
    </>
  );
}

// 3. 커스텀 훅 (비즈니스 로직)
export function useAdminDashboard() {
  // 상태 관리 및 비즈니스 로직
}
```

### 2. UnifiedAdminDashboard 리팩토링 계획

#### Phase 1: 분석 및 계획

- [ ] 컴포넌트 책임 분석
- [ ] 의존성 맵핑
- [ ] 재사용 가능한 부분 식별

#### Phase 2: 분할

```
UnifiedAdminDashboard/
├── index.tsx                    # 메인 컨테이너
├── hooks/
│   ├── useAdminDashboard.ts    # 메인 비즈니스 로직
│   ├── useSystemStatus.ts      # 시스템 상태 관리
│   └── usePerformanceData.ts   # 성능 데이터 관리
├── components/
│   ├── AdminHeader/            # 헤더 컴포넌트
│   ├── SystemStatusCard/       # 시스템 상태 카드
│   ├── PerformanceMetrics/     # 성능 메트릭
│   ├── LogViewer/              # 로그 뷰어
│   └── AlertsPanel/            # 알림 패널
└── types/
    └── admin-dashboard.types.ts # 타입 정의
```

#### Phase 3: 구현 예시

**1. 메인 컨테이너 (index.tsx)**

```typescript
import { useAdminDashboard } from './hooks/useAdminDashboard';
import { AdminDashboardView } from './AdminDashboardView';

export function UnifiedAdminDashboard() {
  const dashboardData = useAdminDashboard();

  if (dashboardData.isLoading) {
    return <DashboardSkeleton />;
  }

  return <AdminDashboardView {...dashboardData} />;
}
```

**2. 커스텀 훅 (useAdminDashboard.ts)**

```typescript
export function useAdminDashboard() {
  const systemStatus = useSystemStatus();
  const performanceData = usePerformanceData();
  const logs = useLogData();
  const alerts = useAlertData();

  return {
    systemStatus,
    performanceData,
    logs,
    alerts,
    isLoading: systemStatus.isLoading || performanceData.isLoading,
  };
}
```

**3. 개별 컴포넌트 (SystemStatusCard/index.tsx)**

```typescript
interface SystemStatusCardProps {
  status: SystemStatus;
  onRefresh: () => void;
}

export function SystemStatusCard({ status, onRefresh }: SystemStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
        <Button onClick={onRefresh} size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <StatusIndicator status={status.overall} />
        <StatusMetrics metrics={status.metrics} />
      </CardContent>
    </Card>
  );
}
```

### 3. 테스트 전략

#### 단위 테스트

```typescript
// hooks/useAdminDashboard.test.ts
describe('useAdminDashboard', () => {
  it('should fetch and combine all dashboard data', async () => {
    const { result } = renderHook(() => useAdminDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.systemStatus).toBeDefined();
    expect(result.current.performanceData).toBeDefined();
  });
});

// components/SystemStatusCard/SystemStatusCard.test.tsx
describe('SystemStatusCard', () => {
  it('should display system status', () => {
    const mockStatus = {
      overall: 'healthy',
      metrics: { cpu: 45, memory: 60 },
    };

    render(<SystemStatusCard status={mockStatus} onRefresh={jest.fn()} />);

    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('healthy')).toBeInTheDocument();
  });
});
```

### 4. 스토리북 통합

```typescript
// SystemStatusCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { SystemStatusCard } from './SystemStatusCard';

const meta = {
  title: 'Admin/SystemStatusCard',
  component: SystemStatusCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SystemStatusCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Healthy: Story = {
  args: {
    status: {
      overall: 'healthy',
      metrics: { cpu: 45, memory: 60, disk: 30 },
    },
  },
};

export const Warning: Story = {
  args: {
    status: {
      overall: 'warning',
      metrics: { cpu: 75, memory: 85, disk: 70 },
    },
  },
};

export const Critical: Story = {
  args: {
    status: {
      overall: 'critical',
      metrics: { cpu: 95, memory: 92, disk: 88 },
    },
  },
};
```

## 📋 체크리스트

### 리팩토링 전

- [ ] 현재 컴포넌트의 모든 기능 문서화
- [ ] 의존성 및 상태 흐름 다이어그램 작성
- [ ] 기존 테스트 확인 및 백업

### 리팩토링 중

- [ ] 점진적 마이그레이션 (기능별로 하나씩)
- [ ] 각 단계마다 테스트 실행
- [ ] 타입 안전성 유지

### 리팩토링 후

- [ ] 모든 기능 정상 작동 확인
- [ ] 성능 비교 (번들 크기, 렌더링 시간)
- [ ] 문서 업데이트

## 🎯 예상 효과

1. **유지보수성 향상**
   - 파일당 평균 200-300줄로 감소
   - 명확한 책임 분리

2. **재사용성 증가**
   - 독립적인 컴포넌트 활용
   - 공통 훅 재사용

3. **테스트 용이성**
   - 단위 테스트 작성 간편화
   - 모의 객체 사용 용이

4. **개발 속도 향상**
   - 병렬 작업 가능
   - 코드 이해도 향상
