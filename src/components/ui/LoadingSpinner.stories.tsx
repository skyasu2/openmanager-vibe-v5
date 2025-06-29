import type { Meta, StoryObj } from '@storybook/react';

// 간단한 LoadingSpinner 컴포넌트 인라인 정의
const LoadingSpinner = ({
  size = 'medium',
  color = 'blue',
  className = '',
}: {
  size?: 'small' | 'medium' | 'large';
  color?: 'blue' | 'green' | 'red' | 'gray';
  className?: string;
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const colorClasses = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    gray: 'border-gray-500',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        border-4 border-solid border-t-transparent 
        rounded-full animate-spin 
        ${className}
      `}
      role='status'
      aria-label='로딩 중'
    />
  );
};

const meta: Meta<typeof LoadingSpinner> = {
  title: 'Components/UI/LoadingSpinner',
  component: LoadingSpinner,

  // Storybook 9.0 태그 기반 조직화
  tags: ['autodocs', 'ui', 'loading', 'accessibility'],

  parameters: {
    docs: {
      description: {
        component:
          'OpenManager v5에서 사용되는 로딩 스피너 컴포넌트입니다. 다양한 크기와 색상을 지원합니다.',
      },
    },

    // 접근성 테스트 설정
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },

  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: '스피너의 크기',
    },
    color: {
      control: 'select',
      options: ['blue', 'green', 'red', 'gray'],
      description: '스피너의 색상',
    },
    className: {
      control: 'text',
      description: '추가 CSS 클래스',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 스피너
export const Default: Story = {
  args: {
    size: 'medium',
    color: 'blue',
  },
};

// 모든 크기
export const AllSizes: Story = {
  render: () => (
    <div className='flex items-center gap-4'>
      <div className='text-center'>
        <LoadingSpinner size='small' color='blue' />
        <p className='mt-2 text-sm'>Small</p>
      </div>
      <div className='text-center'>
        <LoadingSpinner size='medium' color='blue' />
        <p className='mt-2 text-sm'>Medium</p>
      </div>
      <div className='text-center'>
        <LoadingSpinner size='large' color='blue' />
        <p className='mt-2 text-sm'>Large</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '모든 크기 변형을 보여줍니다.',
      },
    },
  },
};

// 모든 색상
export const AllColors: Story = {
  render: () => (
    <div className='flex items-center gap-4'>
      <div className='text-center'>
        <LoadingSpinner size='medium' color='blue' />
        <p className='mt-2 text-sm'>Blue</p>
      </div>
      <div className='text-center'>
        <LoadingSpinner size='medium' color='green' />
        <p className='mt-2 text-sm'>Green</p>
      </div>
      <div className='text-center'>
        <LoadingSpinner size='medium' color='red' />
        <p className='mt-2 text-sm'>Red</p>
      </div>
      <div className='text-center'>
        <LoadingSpinner size='medium' color='gray' />
        <p className='mt-2 text-sm'>Gray</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '모든 색상 변형을 보여줍니다.',
      },
    },
  },
};

// 다크 테마
export const DarkTheme: Story = {
  args: {
    size: 'medium',
    color: 'blue',
  },
  globals: {
    theme: 'dark',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
