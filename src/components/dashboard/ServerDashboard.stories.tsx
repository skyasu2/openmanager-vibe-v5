import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import ServerDashboard from './ServerDashboard';
import { useState } from 'react';

const meta: Meta<typeof ServerDashboard> = {
  title: 'Dashboard/ServerDashboard',
  component: ServerDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
🖥️ **메인 서버 대시보드**

OpenManager의 핵심 서버 모니터링 대시보드입니다.

### ✨ 주요 기능
- **실시간 서버 모니터링**: CPU, 메모리, 디스크 사용량 실시간 표시
- **서버 상태 관리**: 온라인, 경고, 오프라인 상태 시각화
- **자동 서버 감지**: 연결된 서버 자동 스캔 및 표시
- **Fallback 시스템**: 외부 서버 연결 실패 시 로컬 시뮬레이션 데이터 사용
- **반응형 그리드**: 서버 카드 자동 정렬 및 크기 조정
- **서버 상세 정보**: 각 서버 클릭 시 세부 정보 모달

### 🎯 사용 사례
- 서버 인프라 전체 상태 모니터링
- 리소스 사용량 추이 관찰
- 장애 서버 빠른 식별
- 시스템 성능 최적화 분석

### 🔧 기술 구현
- React Query를 통한 데이터 페칭
- Zustand 스토어와의 통합
- Fallback 데이터 시스템
- 실시간 업데이트 지원
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onStatsUpdate: {
      action: 'stats-updated',
      description: '서버 통계 업데이트 콜백',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ServerDashboard>;

// 상태 관리를 위한 래퍼 컴포넌트
const ServerDashboardWrapper = () => {
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    warning: 0,
    offline: 0,
  });

  const handleStatsUpdate = (newStats: typeof stats) => {
    setStats(newStats);
    action('stats-updated')(newStats);
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* 실시간 통계 표시 */}
      <div className='bg-white shadow-sm border-b p-4'>
        <div className='max-w-7xl mx-auto'>
          <h2 className='text-lg font-semibold text-gray-800 mb-3'>
            실시간 서버 통계
          </h2>
          <div className='grid grid-cols-4 gap-4'>
            <div className='text-center p-3 bg-blue-50 rounded-lg'>
              <div className='text-2xl font-bold text-blue-600'>
                {stats.total}
              </div>
              <div className='text-sm text-blue-800'>전체 서버</div>
            </div>
            <div className='text-center p-3 bg-green-50 rounded-lg'>
              <div className='text-2xl font-bold text-green-600'>
                {stats.online}
              </div>
              <div className='text-sm text-green-800'>온라인</div>
            </div>
            <div className='text-center p-3 bg-yellow-50 rounded-lg'>
              <div className='text-2xl font-bold text-yellow-600'>
                {stats.warning}
              </div>
              <div className='text-sm text-yellow-800'>경고</div>
            </div>
            <div className='text-center p-3 bg-red-50 rounded-lg'>
              <div className='text-2xl font-bold text-red-600'>
                {stats.offline}
              </div>
              <div className='text-sm text-red-800'>오프라인</div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 대시보드 */}
      <div className='p-6'>
        <div className='max-w-7xl mx-auto'>
          <ServerDashboard onStatsUpdate={handleStatsUpdate} />
        </div>
      </div>
    </div>
  );
};

/**
 * 🎯 **기본 서버 대시보드**
 *
 * 표준 서버 모니터링 대시보드입니다.
 * 실시간 서버 상태와 리소스 사용량을 표시합니다.
 */
export const Default: Story = {
  render: () => <ServerDashboardWrapper />,
};

/**
 * 🌙 **다크 모드**
 *
 * 다크 테마에서의 서버 대시보드 표시를 확인합니다.
 */
export const DarkMode: Story = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  render: () => (
    <div className='dark min-h-screen'>
      <ServerDashboardWrapper />
    </div>
  ),
};

/**
 * 📱 **모바일 반응형**
 *
 * 모바일 환경에서의 서버 대시보드 표시를 확인합니다.
 * 서버 카드가 세로로 배열되고 터치 최적화가 적용됩니다.
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => <ServerDashboardWrapper />,
};

/**
 * 💻 **태블릿 뷰**
 *
 * 태블릿 환경에서의 서버 대시보드 표시를 확인합니다.
 * 중간 크기 그리드 레이아웃이 적용됩니다.
 */
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  render: () => <ServerDashboardWrapper />,
};

/**
 * 🎨 **커스텀 컨테이너**
 *
 * 제한된 너비의 컨테이너에서의 대시보드 표시를 확인합니다.
 */
export const ConstrainedWidth: Story = {
  render: () => (
    <div className='max-w-4xl mx-auto bg-gray-50 min-h-screen'>
      <div className='p-4'>
        <div className='bg-white rounded-lg shadow-sm p-4 mb-4'>
          <h3 className='text-lg font-medium text-gray-800 mb-2'>
            🎨 제한된 너비 테스트
          </h3>
          <p className='text-sm text-gray-600'>
            1024px 최대 너비에서 서버 카드들이 어떻게 배치되는지 확인할 수
            있습니다.
          </p>
        </div>
        <ServerDashboardWrapper />
      </div>
    </div>
  ),
};

/**
 * ⚡ **성능 모니터링**
 *
 * 서버 대시보드의 렌더링 성능을 모니터링하기 위한 스토리입니다.
 * 다수의 서버 카드 렌더링 성능을 확인할 수 있습니다.
 */
export const PerformanceTest: Story = {
  render: () => (
    <div className='min-h-screen bg-gray-50 relative'>
      {/* 성능 모니터링 안내 */}
      <div className='absolute top-4 right-4 z-50 bg-yellow-100 border border-yellow-400 p-3 rounded-lg max-w-sm'>
        <h4 className='text-yellow-800 font-medium mb-2'>⚡ 성능 모니터링</h4>
        <div className='text-xs text-yellow-700 space-y-1'>
          <div>• React DevTools Profiler 활성화</div>
          <div>• 서버 카드 렌더링 시간 측정</div>
          <div>• 메모리 사용량 모니터링</div>
          <div>• 스크롤 성능 확인</div>
        </div>
      </div>

      <ServerDashboardWrapper />
    </div>
  ),
};

/**
 * 🧪 **상호작용 테스트**
 *
 * 서버 대시보드의 다양한 상호작용을 테스트하기 위한 스토리입니다.
 */
export const InteractionTest: Story = {
  render: () => (
    <div className='min-h-screen bg-gray-50 relative'>
      {/* 상호작용 가이드 */}
      <div className='absolute top-4 left-4 z-50 bg-blue-100 border border-blue-400 p-4 rounded-lg max-w-sm'>
        <h4 className='text-blue-800 font-medium mb-2'>🧪 상호작용 테스트</h4>
        <div className='text-xs text-blue-700 space-y-2'>
          <div className='space-y-1'>
            <div className='font-medium'>테스트 항목:</div>
            <div>✅ 서버 카드 클릭</div>
            <div>✅ 호버 효과 확인</div>
            <div>✅ 상태별 색상 구분</div>
            <div>✅ 로딩 상태 확인</div>
            <div>✅ 에러 상태 처리</div>
          </div>
          <div className='text-blue-600 text-xs border-t border-blue-300 pt-2'>
            Actions 패널에서 이벤트 로그를 확인하세요.
          </div>
        </div>
      </div>

      <ServerDashboardWrapper />
    </div>
  ),
};

/**
 * 🌐 **실제 데이터 시뮬레이션**
 *
 * 실제 운영 환경과 유사한 서버 데이터로 대시보드를 테스트합니다.
 */
export const RealDataSimulation: Story = {
  render: () => (
    <div className='min-h-screen bg-gray-50 relative'>
      {/* 시뮬레이션 정보 */}
      <div className='absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border border-green-400 p-3 rounded-lg'>
        <div className='text-center'>
          <h4 className='text-green-800 font-medium mb-1'>
            🌐 실제 데이터 시뮬레이션
          </h4>
          <p className='text-xs text-green-700'>
            운영 환경과 유사한 다양한 서버 상태와 메트릭을 표시합니다.
          </p>
        </div>
      </div>

      <ServerDashboardWrapper />
    </div>
  ),
};

/**
 * 🛠️ **개발자 모드**
 *
 * 개발 환경에서의 디버깅 정보와 함께 대시보드를 표시합니다.
 */
export const DeveloperMode: Story = {
  parameters: {
    docs: {
      description: {
        story: `
개발 모드에서는 다음과 같은 추가 정보가 표시됩니다:
- 서버 수와 상태 통계
- AI 에이전트 연결 상태
- 실시간 렌더링 시간
- 메모리 사용량 정보

**디버깅 팁:**
- React DevTools로 컴포넌트 트리 확인
- Network 탭에서 API 요청 모니터링
- Console에서 서버 데이터 구조 확인
        `,
      },
    },
  },
  render: () => (
    <div className='min-h-screen bg-gray-50'>
      <ServerDashboardWrapper />
    </div>
  ),
};
