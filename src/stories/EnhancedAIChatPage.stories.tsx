/**
 * 🚀 자연어 질의 페이지 스토리북
 *
 * AI 기반 대화형 인터페이스 컴포넌트들의 스토리북
 */

import type { Meta, StoryObj } from '@storybook/react';
import EnhancedAIChatPage from '@/components/ai/pages/EnhancedAIChatPage';

const meta: Meta<typeof EnhancedAIChatPage> = {
  title: 'AI/자연어 질의 페이지',
  component: EnhancedAIChatPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '🚀 자연어 질의 페이지 - AI 기반 대화형 인터페이스\n\n' +
          '✅ AI 사고 과정 표시 기능\n' +
          '✅ 모델 선택 드롭다운\n' +
          '✅ 프리셋 질문 카드\n' +
          '✅ 답변 제어 기능\n' +
          '✅ 멀티 파일 업로드\n' +
          '✅ 실시간 타이핑 효과\n' +
          '✅ 이미지 분석 기능',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 기본 자연어 질의 인터페이스
 */
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '기본 자연어 질의 페이지입니다. AI 기반의 모든 기능을 포함합니다.',
      },
    },
  },
};

/**
 * 모델 선택 드롭다운 열린 상태
 */
export const WithModelDropdownOpen: Story = {
  parameters: {
    docs: {
      description: {
        story: 'AI 모델 선택 드롭다운이 열린 상태를 보여줍니다.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    // 스토리북에서 상호작용 테스트를 위한 play 함수
    const canvas = canvasElement;
    const modelButton = canvas.querySelector('[data-testid="model-selector"]');
    if (modelButton) {
      (modelButton as HTMLElement).click();
    }
  },
};

/**
 * 프리셋 질문 카드 표시
 */
export const WithPresetQuestions: Story = {
  parameters: {
    docs: {
      description: {
        story: '6개 카테고리의 프리셋 질문 카드들을 보여줍니다.',
      },
    },
  },
};

/**
 * AI 사고 과정 표시 상태
 */
export const WithThinkingProcess: Story = {
  parameters: {
    docs: {
      description: {
        story: 'AI의 4단계 사고 과정이 표시된 상태입니다.',
      },
    },
  },
};

/**
 * 파일 업로드 상태
 */
export const WithFileUpload: Story = {
  parameters: {
    docs: {
      description: {
        story: '다양한 파일 형식이 업로드된 상태를 보여줍니다.',
      },
    },
  },
};

/**
 * 답변 생성 중 상태
 */
export const GeneratingResponse: Story = {
  parameters: {
    docs: {
      description: {
        story: 'AI가 답변을 생성하고 있는 상태입니다.',
      },
    },
  },
};

/**
 * 대화 히스토리가 있는 상태
 */
export const WithChatHistory: Story = {
  parameters: {
    docs: {
      description: {
        story: '여러 메시지가 오간 대화 히스토리가 있는 상태입니다.',
      },
    },
  },
};

/**
 * 다크 모드 (향후 지원 예정)
 */
export const DarkMode: Story = {
  parameters: {
    docs: {
      description: {
        story: '다크 모드 테마 (향후 지원 예정)',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
};

// @ts-nocheck
