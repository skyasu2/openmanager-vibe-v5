/**
 * 📚 SystemStatusDisplay Storybook Stories
 *
 * 시스템 상태 표시 컴포넌트 문서화
 * - 실시간 시스템 상태
 * - 다양한 상태 표시
 * - 성능 지표 시각화
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import SystemStatusDisplay from './dashboard/SystemStatusDisplay';

const meta: Meta<typeof SystemStatusDisplay> = {
  title: 'Dashboard/SystemStatusDisplay',
  component: SystemStatusDisplay,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**⚡ SystemStatusDisplay**

시스템의 실시간 상태를 표시하는 컴포넌트입니다.

### 🚀 주요 기능
- **실시간 모니터링**: 시스템 상태 실시간 업데이트
- **시각적 표시**: 직관적인 상태 색상 구분
- **성능 지표**: CPU, 메모리, 네트워크 상태
- **제어 버튼**: 시스템 제어 기능

### 🎨 상태 구분
- **🟢 활성**: 시스템 정상 동작
- **🟡 일시정지**: 일시적 중단 상태
- **🔴 비활성**: 시스템 중지 상태

### 💡 사용법
\`\`\`tsx
<SystemStatusDisplay 
  isSystemActive={true}
  isSystemPaused={false}
  isUserSession={true}
  formattedTime="15:30:45"
  pauseReason=""
  onSystemStop={() => {}}
  onSystemPause={() => {}}
  onSystemResume={() => {}}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isSystemActive: {
      control: 'boolean',
      description: '시스템 활성 상태',
      defaultValue: true,
    },
    isSystemPaused: {
      control: 'boolean',
      description: '시스템 일시정지 상태',
      defaultValue: false,
    },
    isUserSession: {
      control: 'boolean',
      description: '사용자 세션 존재 여부',
      defaultValue: true,
    },
    formattedTime: {
      control: 'text',
      description: '포맷된 시간 표시',
      defaultValue: '15:30:45',
    },
    pauseReason: {
      control: 'text',
      description: '일시정지 사유',
      defaultValue: '',
    },
    onSystemStop: {
      action: 'onSystemStop',
      description: '시스템 중지 핸들러',
    },
    onSystemPause: {
      action: 'onSystemPause',
      description: '시스템 일시정지 핸들러',
    },
    onSystemResume: {
      action: 'onSystemResume',
      description: '시스템 재개 핸들러',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 스토리
export const Default: Story = {
  args: {
    isSystemActive: true,
    isSystemPaused: false,
    isUserSession: true,
    formattedTime: '15:30:45',
    pauseReason: '',
    onSystemStop: () => console.log('시스템 중지'),
    onSystemPause: () => console.log('시스템 일시정지'),
    onSystemResume: () => console.log('시스템 재개'),
  },
  parameters: {
    docs: {
      description: {
        story: '**기본 상태**: 시스템이 정상적으로 활성화된 상태',
      },
    },
  },
};

export const SystemPaused: Story = {
  args: {
    isSystemActive: true,
    isSystemPaused: true,
    isUserSession: true,
    formattedTime: '15:30:45',
    pauseReason: '사용자 요청에 의한 일시정지',
    onSystemStop: () => console.log('시스템 중지'),
    onSystemPause: () => console.log('시스템 일시정지'),
    onSystemResume: () => console.log('시스템 재개'),
  },
  parameters: {
    docs: {
      description: {
        story: '**일시정지 상태**: 시스템이 일시적으로 중단된 상태',
      },
    },
  },
};

export const SystemStopped: Story = {
  args: {
    isSystemActive: false,
    isSystemPaused: false,
    isUserSession: false,
    formattedTime: '00:00:00',
    pauseReason: '',
    onSystemStop: () => console.log('시스템 중지'),
    onSystemPause: () => console.log('시스템 일시정지'),
    onSystemResume: () => console.log('시스템 재개'),
  },
  parameters: {
    docs: {
      description: {
        story: '**중지 상태**: 시스템이 완전히 중지된 상태',
      },
    },
  },
};

export const LongRunningSession: Story = {
  args: {
    isSystemActive: true,
    isSystemPaused: false,
    isUserSession: true,
    formattedTime: '23:59:59',
    pauseReason: '',
    onSystemStop: () => console.log('시스템 중지'),
    onSystemPause: () => console.log('시스템 일시정지'),
    onSystemResume: () => console.log('시스템 재개'),
  },
  parameters: {
    docs: {
      description: {
        story: '**장시간 실행**: 오랜 시간 동안 실행된 시스템 상태',
      },
    },
  },
};
