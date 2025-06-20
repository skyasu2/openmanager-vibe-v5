/**
 * 🚨 System Alerts Page Stories
 *
 * 실시간 시스템 알림 페이지 스토리북 (v5.44.4)
 * 최근 업데이트: 메트릭 데이터 접근 수정, 임계값 최적화, 알림 생성 로직 개선
 */

import type { Meta, StoryObj } from '@storybook/react';
import SystemAlertsPage from './SystemAlertsPage';

const meta: Meta<typeof SystemAlertsPage> = {
  title: 'Dashboard/SystemAlertsPage',
  component: SystemAlertsPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
🚨 **실시간 시스템 알림 페이지 (v5.44.4)**

실시간 서버 모니터링 기반 지능형 알림 시스템입니다.

### ✨ 주요 기능
- **실시간 알림 생성**: 15개 서버 메트릭 기반 자동 알림
- **3단계 알림 분류**: Critical, Warning, Resolved
- **지능형 임계값**: CPU 70%, 메모리 70%, 디스크 70%
- **서버 상태 연동**: running/warning/error 상태 기반
- **자동 새로고침**: 10초 간격 실시간 업데이트
- **알림 상세 정보**: 값, 임계값, 서버 정보 표시

### 🔧 최근 수정사항 (v5.44.4)
- ✅ 메트릭 데이터 접근 경로 수정 (server.metrics.cpu)
- ✅ 임계값 최적화 (80%→70%로 낮춰 더 많은 알림 표시)
- ✅ 서버 상태 매핑 로직 수정 (error/stopped → offline)
- ✅ 해결된 알림 시뮬레이션 확률 증가 (50%)
- ✅ 디버깅 로그 추가로 알림 생성 과정 투명화

### 📊 알림 임계값 설정
- **CPU 사용률**: 70% 경고, 90% 심각
- **메모리 사용률**: 70% 경고, 90% 심각  
- **디스크 사용률**: 70% 경고, 95% 심각
- **서버 상태**: error/stopped → 심각, warning → 경고
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: '추가 CSS 클래스명',
      defaultValue: '',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 🎯 기본 시스템 알림 (실제 데이터 기반)
 */
export const Default: Story = {
  args: {
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story:
          '실제 15개 서버의 메트릭 데이터를 기반으로 자동 생성되는 시스템 알림입니다. 수정된 임계값과 상태 매핑이 적용되었습니다.',
      },
    },
  },
};

/**
 * 🚨 Critical 알림 중심 뷰
 */
export const CriticalAlertsView: Story = {
  args: {
    className: '',
  },
  render: args => (
    <div className='space-y-4'>
      <div className='bg-red-50 p-4 rounded-lg border border-red-200'>
        <h3 className='font-semibold text-red-800 mb-2'>
          🚨 Critical 알림 모니터링
        </h3>
        <p className='text-sm text-red-700'>
          CPU 90% 이상, 메모리 90% 이상, 디스크 95% 이상, 서버 오프라인 상태에서
          Critical 알림이 생성됩니다.
        </p>
        <div className='mt-2 text-xs text-red-600'>
          • CPU 과부하 (90% 이상)
          <br />
          • 메모리 부족 (90% 이상)
          <br />
          • 디스크 공간 부족 (95% 이상)
          <br />• 서버 오프라인 (error/stopped)
        </div>
      </div>
      <SystemAlertsPage {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Critical 알림 생성 조건과 함께 표시되는 시스템 알림 페이지입니다.',
      },
    },
  },
};

/**
 * ⚠️ Warning 알림 중심 뷰
 */
export const WarningAlertsView: Story = {
  args: {
    className: '',
  },
  render: args => (
    <div className='space-y-4'>
      <div className='bg-yellow-50 p-4 rounded-lg border border-yellow-200'>
        <h3 className='font-semibold text-yellow-800 mb-2'>
          ⚠️ Warning 알림 모니터링
        </h3>
        <p className='text-sm text-yellow-700'>
          최적화된 임계값(70%)으로 더 많은 Warning 알림을 표시하여 사전 예방이
          가능합니다.
        </p>
        <div className='mt-2 text-xs text-yellow-600'>
          • CPU 사용률 높음 (70% 이상)
          <br />
          • 메모리 사용률 높음 (70% 이상)
          <br />
          • 디스크 사용률 높음 (70% 이상)
          <br />• 서버 경고 상태 (warning)
        </div>
      </div>
      <SystemAlertsPage {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Warning 알림 생성 조건과 최적화된 임계값을 보여주는 뷰입니다.',
      },
    },
  },
};

/**
 * ✅ Resolved 알림 시뮬레이션
 */
export const ResolvedAlertsView: Story = {
  args: {
    className: '',
  },
  render: args => (
    <div className='space-y-4'>
      <div className='bg-green-50 p-4 rounded-lg border border-green-200'>
        <h3 className='font-semibold text-green-800 mb-2'>
          ✅ Resolved 알림 시뮬레이션
        </h3>
        <p className='text-sm text-green-700'>
          해결된 알림이 50% 확률로 표시되어 시스템 복구 상황을 시뮬레이션합니다.
        </p>
        <div className='mt-2 text-xs text-green-600'>
          • 디스크 공간 복구 (50% 확률)
          <br />
          • CPU 사용률 정상화 (30% 확률)
          <br />• 시간 기반 타임스탬프 (8-12분 전)
        </div>
      </div>
      <SystemAlertsPage {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Resolved 알림 시뮬레이션과 함께 표시되는 시스템 알림 페이지입니다.',
      },
    },
  },
};

/**
 * 📱 모바일 반응형 뷰
 */
export const MobileView: Story = {
  args: {
    className: '',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          '모바일 환경에서의 시스템 알림 표시입니다. 알림 카드가 세로로 배열되고 터치 최적화가 적용됩니다.',
      },
    },
  },
};

/**
 * 🔄 실시간 알림 생성 데모
 */
export const RealtimeAlertDemo: Story = {
  args: {
    className: '',
  },
  render: args => (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      <div>
        <h3 className='text-lg font-semibold mb-4'>🚨 실제 알림 시스템</h3>
        <SystemAlertsPage {...args} />
      </div>
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold mb-4'>🔍 알림 생성 로직</h3>
        <div className='bg-gray-100 p-4 rounded-lg text-xs'>
          <pre className='whitespace-pre-wrap'>{`
// 수정된 메트릭 접근
const cpuValue = server.metrics?.cpu || server.cpu || 0;
const memoryValue = server.metrics?.memory || server.memory || 0;
const diskValue = server.metrics?.disk || server.disk || 0;

// 최적화된 임계값 (더 많은 알림)
if (cpuValue >= 90) {
  // Critical: CPU 과부하
} else if (cpuValue >= 70) { // 80→70 낮춤
  // Warning: CPU 사용률 높음
}

// 서버 상태 매핑
if (server.status === 'error' || server.status === 'stopped') {
  // Critical: 서버 오프라인
} else if (server.status === 'warning') {
  // Warning: 서버 경고
}

// 해결된 알림 시뮬레이션
if (Math.random() > 0.5) { // 50% 확률
  // Resolved: 디스크 공간 복구
}
          `}</pre>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '실시간 알림 생성 로직과 수정된 임계값을 시각적으로 보여주는 데모입니다.',
      },
    },
  },
};
