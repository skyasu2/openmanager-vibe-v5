/**
 * 🤖 AI 어시스턴트 컴포넌트 스토리북
 * 
 * AI 사이드바와 관련 컴포넌트들의 스토리북
 */

import type { Meta, StoryObj } from '@storybook/react';
import { AISidebarV2 } from '@/domains/ai-sidebar/components/AISidebarV2';
import { UnifiedProfileButton } from '../components/unified-profile/UnifiedProfileButton';
import { AISettingsTab } from '../components/unified-profile/components/AISettingsTab';

const meta: Meta<typeof AISidebarV2> = {
  title: 'AI/AI 어시스턴트',
  component: AISidebarV2,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '🤖 AI 어시스턴트 사이드바\n\n' +
          '✅ 자연어 질의 통합\n' +
          '✅ 실시간 AI 로그\n' +
          '✅ 다중 AI 엔진 지원\n' +
          '✅ 파일 업로드\n' +
          '✅ 프리셋 질문\n' +
          '✅ 사고 과정 시각화',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: '사이드바 열림/닫힘 상태',
    },
    onClose: {
      action: 'closed',
      description: '사이드바 닫기 콜백',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 기본 AI 어시스턴트 사이드바
 */
export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: '기본 AI 어시스턴트 사이드바입니다. 자연어 질의 기능이 포함되어 있습니다.',
      },
    },
  },
};

/**
 * 자연어 질의 모드
 */
export const EnhancedChatMode: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'AI 기반의 자연어 질의 모드입니다.',
      },
    },
  },
};

/**
 * 자동 리포트 모드
 */
export const AutoReportMode: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: '자동 리포트 생성 모드입니다.',
      },
    },
  },
};

/**
 * 예측 분석 모드
 */
export const PredictionMode: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: '예측 분석 모드입니다.',
      },
    },
  },
};

// 프로필 버튼 스토리
const ProfileButtonMeta: Meta<typeof UnifiedProfileButton> = {
  title: 'AI Assistant/UnifiedProfileButton',
  component: UnifiedProfileButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '👤 통합 프로필 버튼\n\n' +
          '✅ AI 어시스턴트 모드 표시\n' +
          '✅ 관리자 모드 전환\n' +
          '✅ 시스템 상태 표시\n' +
          '✅ 설정 메뉴 접근',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    userName: {
      control: 'text',
      description: '사용자 이름',
    },
    userAvatar: {
      control: 'text',
      description: '사용자 아바타 URL',
    },
    isOpen: {
      control: 'boolean',
      description: '드롭다운 열림 상태',
    },
  },
};

type ProfileButtonStory = StoryObj<typeof UnifiedProfileButton>;

/**
 * 기본 프로필 버튼
 */
export const DefaultProfile: ProfileButtonStory = {
  args: {
    userName: '사용자',
    userAvatar: '',
    isOpen: false,
    onClick: () => console.log('Profile clicked'),
    onSettingsClick: () => console.log('Settings clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: '기본 프로필 버튼입니다. AI 어시스턴트 모드가 표시됩니다.',
      },
    },
  },
};

/**
 * 드롭다운 열린 상태
 */
export const ProfileDropdownOpen: ProfileButtonStory = {
  args: {
    userName: '관리자',
    userAvatar: '',
    isOpen: true,
    onClick: () => console.log('Profile clicked'),
    onSettingsClick: () => console.log('Settings clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: '프로필 드롭다운이 열린 상태입니다.',
      },
    },
  },
};

/**
 * 관리자 모드 활성화
 */
export const AdminModeActive: ProfileButtonStory = {
  args: {
    userName: '관리자',
    userAvatar: '',
    isOpen: true,
    onClick: () => console.log('Profile clicked'),
    onSettingsClick: () => console.log('Settings clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: '관리자 모드가 활성화된 상태입니다.',
      },
    },
  },
};

// AI 설정 탭 스토리
const AISettingsMeta: Meta<typeof AISettingsTab> = {
  title: 'AI Assistant/AISettingsTab',
  component: AISettingsTab,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '⚙️ AI 어시스턴트 설정 탭\n\n' +
          '✅ AI 어시스턴트 상태 표시\n' +
          '✅ 관리자 인증\n' +
          '✅ AI 최적화 기능\n' +
          '✅ 시스템 진단',
      },
    },
  },
  tags: ['autodocs'],
};

type AISettingsStory = StoryObj<typeof AISettingsTab>;

/**
 * 기본 AI 설정 탭
 */
export const DefaultAISettings: AISettingsStory = {
  args: {
    authState: {
      isAuthenticating: false,
      isAuthenticated: false,
      isLocked: false,
      showPassword: false,
      attempts: 0,
    },
    aiPassword: '',
    setAiPassword: (password: string) => console.log('Password set:', password),
    onAuthentication: async () => console.log('Authentication requested'),
    onAIOptimization: async () => console.log('AI optimization requested'),
    onSystemDiagnosis: async () => console.log('System diagnosis requested'),
  },
  parameters: {
    docs: {
      description: {
        story: '기본 AI 설정 탭입니다. AI 어시스턴트 상태가 표시됩니다.',
      },
    },
  },
};

/**
 * 관리자 인증 필요 상태
 */
export const AuthenticationRequired: AISettingsStory = {
  args: {
    authState: {
      isAuthenticating: false,
      isAuthenticated: false,
      isLocked: false,
      showPassword: false,
      attempts: 0,
    },
    aiPassword: '',
    setAiPassword: (password: string) => console.log('Password set:', password),
    onAuthentication: async () => console.log('Authentication requested'),
    onAIOptimization: async () => console.log('AI optimization requested'),
    onSystemDiagnosis: async () => console.log('System diagnosis requested'),
  },
  parameters: {
    docs: {
      description: {
        story: '관리자 인증이 필요한 상태입니다.',
      },
    },
  },
};

/**
 * 인증 중 상태
 */
export const Authenticating: AISettingsStory = {
  args: {
    authState: {
      isAuthenticating: true,
      isAuthenticated: false,
      isLocked: false,
      showPassword: false,
      attempts: 0,
    },
    aiPassword: '1234',
    setAiPassword: (password: string) => console.log('Password set:', password),
    onAuthentication: async () => console.log('Authentication requested'),
    onAIOptimization: async () => console.log('AI optimization requested'),
    onSystemDiagnosis: async () => console.log('System diagnosis requested'),
  },
  parameters: {
    docs: {
      description: {
        story: '관리자 인증 중인 상태입니다.',
      },
    },
  },
};

/**
 * 계정 잠금 상태
 */
export const AccountLocked: AISettingsStory = {
  args: {
    authState: {
      isAuthenticating: false,
      isAuthenticated: false,
      isLocked: true,
      showPassword: false,
      attempts: 3,
    },
    aiPassword: '',
    setAiPassword: (password: string) => console.log('Password set:', password),
    onAuthentication: async () => console.log('Authentication requested'),
    onAIOptimization: async () => console.log('AI optimization requested'),
    onSystemDiagnosis: async () => console.log('System diagnosis requested'),
  },
  parameters: {
    docs: {
      description: {
        story: '3번 틀려서 계정이 잠긴 상태입니다.',
      },
    },
  },
};
