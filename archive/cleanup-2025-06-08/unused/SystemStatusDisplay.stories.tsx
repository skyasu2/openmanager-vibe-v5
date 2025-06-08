import type { Meta, StoryObj } from '@storybook/react';
import SystemStatusDisplay from './SystemStatusDisplay';

/**
 * SystemStatusDisplay는 시스템의 현재 상태를 시각적으로 표시하는 컴포넌트입니다.
 * 
 * ## 주요 기능
 * - 시스템 활성화/비활성화 상태 표시
 * - 일시정지 상태 관리
 * - 사용자/AI 세션 구분
 * - 실시간 가동 시간 표시
 * - 시스템 제어 버튼 제공
 * 
 * ## 상태 유형
 * - **활성화**: 시스템이 정상 운영 중
 * - **일시정지**: 시스템이 일시적으로 중단됨
 * - **중지**: 시스템이 완전히 중지됨
 */
const meta: Meta<typeof SystemStatusDisplay> = {
  title: 'Dashboard/SystemStatusDisplay',
  component: SystemStatusDisplay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
### SystemStatusDisplay 컴포넌트

시스템 상태를 실시간으로 모니터링하고 제어할 수 있는 컴포넌트입니다.

#### 특징
- **실시간 상태 업데이트**
- **조건부 렌더링** 최적화
- **사용자 인터랙션** 지원
- **시각적 상태 구분**

#### 상태별 표시
- 🟢 **활성화**: 녹색 표시, 가동 시간 표시
- 🟡 **일시정지**: 노란색 표시, 재개 버튼
- 🔴 **중지**: 회색 표시, 시작 버튼

#### 사용 예제
\`\`\`tsx
<SystemStatusDisplay
  isSystemActive={true}
  isSystemPaused={false}
  isUserSession={true}
  formattedTime="02:45:30"
  pauseReason=""
  onSystemStop={() => console.log('System stop')}
  onSystemPause={() => console.log('System pause')}
  onSystemResume={() => console.log('System resume')}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isSystemActive: {
      description: '시스템 활성화 상태',
      control: 'boolean',
    },
    isSystemPaused: {
      description: '시스템 일시정지 상태',
      control: 'boolean',
    },
    isUserSession: {
      description: '사용자 세션 여부 (false면 AI 세션)',
      control: 'boolean',
    },
    formattedTime: {
      description: '포맷된 가동 시간 (HH:mm:ss)',
      control: 'text',
    },
    pauseReason: {
      description: '일시정지 사유',
      control: 'text',
    },
    onSystemStop: {
      description: '시스템 중지 핸들러',
      action: 'systemStop',
    },
    onSystemPause: {
      description: '시스템 일시정지 핸들러',
      action: 'systemPause',
    },
    onSystemResume: {
      description: '시스템 재개 핸들러',
      action: 'systemResume',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 사용자 세션 활성화 상태
export const UserSessionActive: Story = {
  args: {
    isSystemActive: true,
    isSystemPaused: false,
    isUserSession: true,
    formattedTime: '02:45:30',
    pauseReason: '',
  },
};

// AI 세션 활성화 상태
export const AISessionActive: Story = {
  args: {
    isSystemActive: true,
    isSystemPaused: false,
    isUserSession: false,
    formattedTime: '01:23:45',
    pauseReason: '',
  },
};

// 시스템 일시정지 상태
export const SystemPaused: Story = {
  args: {
    isSystemActive: true,
    isSystemPaused: true,
    isUserSession: true,
    formattedTime: '00:00:00',
    pauseReason: '사용자 요청',
  },
};

// 시스템 일시정지 (유지보수)
export const MaintenancePause: Story = {
  args: {
    isSystemActive: true,
    isSystemPaused: true,
    isUserSession: false,
    formattedTime: '00:00:00',
    pauseReason: '정기 유지보수',
  },
};

// 시스템 일시정지 (자동 절전)
export const AutoSleepPause: Story = {
  args: {
    isSystemActive: true,
    isSystemPaused: true,
    isUserSession: true,
    formattedTime: '00:00:00',
    pauseReason: '자동 절전 모드',
  },
};

// 시스템 중지 상태
export const SystemStopped: Story = {
  args: {
    isSystemActive: false,
    isSystemPaused: false,
    isUserSession: false,
    formattedTime: '00:00:00',
    pauseReason: '',
  },
};

// 장시간 운영 상태
export const LongRunning: Story = {
  args: {
    isSystemActive: true,
    isSystemPaused: false,
    isUserSession: true,
    formattedTime: '25:14:33',
    pauseReason: '',
  },
}; 