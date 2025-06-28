import type { Meta, StoryObj } from '@storybook/react';
import AITestPanel from './AITestPanel';
import KeyManagerPanel from './KeyManagerPanel';
import ServiceStatusPanel from './ServiceStatusPanel';

// 서비스 상태 패널 스토리
const ServiceMeta: Meta<typeof ServiceStatusPanel> = {
  title: 'Components/DevTools/ServiceStatusPanel',
  component: ServiceStatusPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: '시스템 서비스 상태를 실시간으로 모니터링하는 패널입니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    autoRefresh: {
      control: 'boolean',
      description: '자동 새로고침 활성화',
    },
  },
};

export default ServiceMeta;

export const ServiceDefault: StoryObj<typeof ServiceStatusPanel> = {
  args: {
    autoRefresh: false,
  },
};

export const ServiceAutoRefresh: StoryObj<typeof ServiceStatusPanel> = {
  args: {
    autoRefresh: true,
  },
  parameters: {
    docs: {
      description: {
        story: '자동 새로고침이 활성화된 서비스 상태 패널입니다.',
      },
    },
  },
};

// 키 매니저 패널 스토리
const KeyManagerMeta: Meta<typeof KeyManagerPanel> = {
  title: 'Components/DevTools/KeyManagerPanel',
  component: KeyManagerPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'API 키와 환경변수를 관리하는 패널입니다.',
      },
    },
  },
  tags: ['autodocs'],
};

export const KeyManagerDefault: StoryObj<typeof KeyManagerPanel> = {};

// AI 테스트 패널 스토리
const AITestMeta: Meta<typeof AITestPanel> = {
  title: 'Components/DevTools/AITestPanel',
  component: AITestPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'AI 엔진을 테스트하고 결과를 확인하는 패널입니다.',
      },
    },
  },
  tags: ['autodocs'],
};

export const AITestDefault: StoryObj<typeof AITestPanel> = {};

// 통합 스토리
export const DevToolsOverview = {
  render: () => (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-gray-50 min-h-screen'>
      <div className='space-y-6'>
        <ServiceStatusPanel autoRefresh={false} />
        <KeyManagerPanel />
      </div>
      <div>
        <AITestPanel />
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: '모든 개발자 도구 패널을 통합한 전체 화면입니다.',
      },
    },
  },
};
