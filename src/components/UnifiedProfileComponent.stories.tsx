import type { Meta, StoryObj } from '@storybook/react';
import UnifiedProfileComponent from './UnifiedProfileComponent';

const meta: Meta<typeof UnifiedProfileComponent> = {
  title: 'Components/UnifiedProfileComponent',
  component: UnifiedProfileComponent,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '통합 프로필 컴포넌트입니다. 사용자 정보와 설정 패널을 제공합니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    userName: {
      control: { type: 'text' },
      description: '사용자 이름',
      defaultValue: '사용자',
    },
    userAvatar: {
      control: { type: 'text' },
      description: '사용자 아바타 URL (선택사항)',
    },
  },
  decorators: [
    Story => (
      <div className='bg-gray-100 p-8 min-h-screen'>
        <div className='flex justify-end'>
          <Story />
        </div>
        <div className='mt-8 p-4 bg-white rounded-lg shadow'>
          <p className='text-sm text-gray-600'>
            💡 프로필 버튼을 클릭하여 드롭다운을 확인하고, 설정 패널을
            열어보세요.
          </p>
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    userName: '관리자',
  },
};

export const WithAvatar: Story = {
  args: {
    userName: '김개발',
    userAvatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  },
};

export const LongUserName: Story = {
  args: {
    userName: '매우긴사용자이름테스트용',
    userAvatar:
      'https://images.unsplash.com/photo-1494790108755-2616b612b29c?w=150&h=150&fit=crop&crop=face',
  },
};

export const KoreanName: Story = {
  args: {
    userName: '홍길동',
    userAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  },
};

export const EnglishName: Story = {
  args: {
    userName: 'John Developer',
    userAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  },
};
