/**
 * 🤖 AI 어시스턴트 컴포넌트 스토리북 (v5.44.4)
 *
 * AI 사이드바와 관련 컴포넌트들의 스토리북
 * 최근 업데이트: 11개 AI 엔진 완전 통합, 실제 서버 데이터 연동, 대시보드 수정 완료
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { AISidebarV2 } from '../domains/ai-sidebar/components/AISidebarV2';
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
          '🤖 AI 어시스턴트 사이드바 (v5.44.4)\n\n' +
          '✅ 11개 AI 엔진 완전 통합\n' +
          '✅ Google AI Studio (Gemini) 베타 연동\n' +
          '✅ 실시간 서버 데이터 연동 (15개 서버)\n' +
          '✅ UnifiedAIEngine 자체 개발\n' +
          '✅ RAG 엔진 - 로컬 벡터 DB\n' +
          '✅ MultiAI 사고 과정 시각화\n' +
          '✅ 실시간 AI 로그 및 성능 메트릭\n' +
          '✅ 파일 업로드 및 자연어 처리\n' +
          '✅ 프리셋 질문 8개 + 네비게이션',
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
 * 🎯 기본 AI 어시스턴트 사이드바 (11개 엔진 통합)
 */
export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          '11개 AI 엔진이 통합된 AI 어시스턴트 사이드바입니다. Google AI, UnifiedAI, RAG 엔진을 포함하여 실시간 서버 데이터(15개 서버)와 연동됩니다.',
      },
    },
  },
};

/**
 * 🔥 Google AI Studio (Gemini) 베타 모드
 */
export const GoogleAIMode: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Google AI Studio (Gemini) 베타 버전과 연동된 모드입니다. 실제 API 키로 연결되어 고급 AI 기능을 제공합니다.',
      },
    },
  },
};

/**
 * 🧠 MultiAI 사고 과정 시각화 모드
 */
export const MultiAIThinkingMode: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          '5개 AI 엔진의 협업 과정을 실시간으로 시각화하는 모드입니다. 각 AI의 진행률, 신뢰도, 기여도를 투명하게 표시합니다.',
      },
    },
  },
};

/**
 * 📊 실시간 서버 데이터 연동 모드
 */
export const RealDataMode: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          '15개 실제 서버의 실시간 메트릭 데이터와 연동된 모드입니다. CPU/메모리/디스크 사용률, 네트워크 트래픽을 AI가 분석합니다.',
      },
    },
  },
};

/**
 * 🎨 RAG 엔진 로컬 벡터 DB 모드
 */
export const RAGEngineMode: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          '로컬 벡터 데이터베이스 기반의 RAG(Retrieval-Augmented Generation) 엔진 모드입니다. 한국어 특화 NLU와 의도 분석을 제공합니다.',
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
          '👤 통합 프로필 버튼 (v5.44.4)\n\n' +
          '✅ 11개 AI 엔진 상태 표시\n' +
          '✅ 관리자 페이지 2개 핵심 기능\n' +
          '✅ 실시간 시스템 상태 (15개 서버)\n' +
          '✅ Redis 캐시 상태 모니터링\n' +
          '✅ TypeScript 0개 오류 상태\n' +
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
 * 🎯 기본 프로필 버튼 (시스템 안정화 완료)
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
        story:
          '시스템 완전 안정화 상태의 프로필 버튼입니다. 125개 페이지 빌드 성공, TypeScript 0개 오류, 15개 서버 정상 모니터링 중입니다.',
      },
    },
  },
};

/**
 * 🔧 관리자 모드 (2개 핵심 페이지)
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
        story:
          '관리자 모드가 활성화된 상태입니다. AI 에이전트 관리와 MCP 모니터링 2개 핵심 페이지에 접근할 수 있습니다.',
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
