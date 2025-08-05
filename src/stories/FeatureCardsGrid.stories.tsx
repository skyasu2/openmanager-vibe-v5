import type { Meta, StoryObj } from '@storybook/react';
import FeatureCardsGrid from '@/components/home/FeatureCardsGrid';
import { UnifiedAdminProvider } from '@/providers/UnifiedAdminProvider';

const meta = {
  title: 'Home/FeatureCardsGrid',
  component: FeatureCardsGrid,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0a0a' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  decorators: [
    (Story) => (
      <UnifiedAdminProvider>
        <div className="min-h-screen bg-black p-8">
          <Story />
        </div>
      </UnifiedAdminProvider>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof FeatureCardsGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: '기본',
};

export const WithAIEnabled: Story = {
  name: 'AI 모드 활성화',
  decorators: [
    (Story) => {
      // AI 모드 활성화 시뮬레이션
      return (
        <UnifiedAdminProvider>
          <div className="min-h-screen bg-black p-8">
            <div className="mb-4 text-center text-white">
              <p className="text-sm text-gray-400">AI 모드가 활성화된 상태</p>
            </div>
            <Story />
          </div>
        </UnifiedAdminProvider>
      );
    },
  ],
};

export const Mobile: Story = {
  name: '모바일 뷰',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Tablet: Story = {
  name: '태블릿 뷰',
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const AICardHighlight: Story = {
  name: 'AI 카드 하이라이트',
  decorators: [
    (Story) => (
      <UnifiedAdminProvider>
        <div className="min-h-screen bg-black p-8">
          <div className="mb-4 text-center text-white">
            <p className="text-sm text-gray-400">
              AI 어시스턴트 카드에서만 "AI" 글자에 그라데이션 효과가 적용됩니다
            </p>
          </div>
          <Story />
        </div>
      </UnifiedAdminProvider>
    ),
  ],
};

export const VibeCodingCard: Story = {
  name: '바이브 코딩 카드 스타일',
  decorators: [
    (Story) => (
      <UnifiedAdminProvider>
        <div className="min-h-screen bg-black p-8">
          <div className="mb-4 text-center text-white">
            <p className="text-sm text-gray-400">
              바이브 코딩 카드의 텍스트가 다른 카드들과 동일하게 흰색으로 표시됩니다
            </p>
          </div>
          <Story />
        </div>
      </UnifiedAdminProvider>
    ),
  ],
};