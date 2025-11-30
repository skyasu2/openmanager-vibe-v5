import type { Meta, StoryObj } from '@storybook/react';

import { SystemStateChecker } from './SystemStateChecker';

const meta: Meta<typeof SystemStateChecker> = {
  title: 'System/SystemStateChecker',
  component: SystemStateChecker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '시스템 온오프 상태를 확인하고 제어하는 컴포넌트입니다. 크론 제거 후 온디맨드 방식으로 동작합니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showDetails: {
      control: 'boolean',
      description: '상세 정보 표시 여부',
    },
    autoRefresh: {
      control: 'boolean',
      description: '자동 새로고침 활성화',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showDetails: true,
    autoRefresh: false,
  },
};

export const SystemActive: Story = {
  args: {
    showDetails: true,
    autoRefresh: true,
  },
  parameters: {
    mockData: {
      systemState: {
        isSystemActive: true,
        powerMode: 'active',
        isDataCollecting: true,
        reason: '시스템이 정상 작동 중입니다.',
        shouldSkipOperation: false,
      },
    },
  },
};

export const SystemOff: Story = {
  args: {
    showDetails: true,
    autoRefresh: false,
  },
  parameters: {
    mockData: {
      systemState: {
        isSystemActive: false,
        powerMode: 'sleep',
        isDataCollecting: false,
        reason: '시스템이 강제로 비활성화되었습니다.',
        shouldSkipOperation: true,
      },
    },
  },
};

export const MaintenanceMode: Story = {
  args: {
    showDetails: true,
    autoRefresh: false,
  },
  parameters: {
    mockData: {
      systemState: {
        isSystemActive: false,
        powerMode: 'sleep',
        isDataCollecting: false,
        reason: '시스템이 유지보수 모드입니다.',
        shouldSkipOperation: true,
      },
    },
  },
};

export const Emergency: Story = {
  args: {
    showDetails: true,
    autoRefresh: true,
  },
  parameters: {
    mockData: {
      systemState: {
        isSystemActive: true,
        powerMode: 'emergency',
        isDataCollecting: true,
        reason: '긴급 모드로 작동 중입니다.',
        shouldSkipOperation: false,
      },
    },
  },
};
