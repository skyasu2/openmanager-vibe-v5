import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

// Storybook 9.0 새로운 메타 설정
const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,

  // Storybook 9.0 태그 기반 조직화
  tags: ['autodocs', 'component', 'interaction', 'accessibility'],

  parameters: {
    // Storybook 9.0 향상된 문서
    docs: {
      description: {
        component: 'OpenManager v5에서 사용되는 기본 버튼 컴포넌트입니다.',
      },
    },

    // Storybook 9.0 접근성 테스트 자동 실행
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'button-name',
            enabled: true,
          },
        ],
      },
    },
  },

  // Storybook 9.0 향상된 Args 설정
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: '버튼의 시각적 변형',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: '버튼의 크기',
    },
    disabled: {
      control: 'boolean',
      description: '버튼 비활성화 상태',
    },
    loading: {
      control: 'boolean',
      description: '로딩 상태',
    },
    onClick: {
      action: 'clicked',
      description: '클릭 이벤트 핸들러',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 🎯 기본 스토리
export const Default: Story = {
  args: {
    children: '기본 버튼',
    variant: 'primary',
    size: 'medium',
  },
};

// 🎨 Storybook 9.0 Story Globals를 활용한 테마별 스토리
export const DarkTheme: Story = {
  args: {
    children: '다크 테마 버튼',
    variant: 'primary',
  },
  // Storybook 9.0 새로운 기능: Story-level globals
  globals: {
    theme: 'dark',
  },
};

// 📱 Storybook 9.0 향상된 뷰포트 설정
export const Mobile: Story = {
  args: {
    children: '모바일 버튼',
    variant: 'secondary',
    size: 'large',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// 🎪 인터랙션 테스트 (추후 Storybook Test 설치 후 활성화)
export const WithInteraction: Story = {
  args: {
    children: '클릭해보세요',
    variant: 'primary',
  },
};

// ♿ 접근성 테스트 (추후 Storybook Test 설치 후 활성화)
export const AccessibilityTest: Story = {
  args: {
    children: '접근성 테스트',
    variant: 'secondary',
  },
};

// 🚨 에러 상태 스토리
export const ErrorState: Story = {
  args: {
    children: '에러 버튼',
    variant: 'danger',
    disabled: true,
  },

  parameters: {
    docs: {
      description: {
        story: '에러 상황에서 사용되는 버튼입니다.',
      },
    },
  },
};

// ⏳ 로딩 상태 스토리
export const LoadingState: Story = {
  args: {
    children: '로딩 중...',
    variant: 'primary',
    loading: true,
    disabled: true,
  },

  // Storybook 9.0 향상된 애니메이션 문서화
  parameters: {
    docs: {
      description: {
        story: '로딩 상태를 표시하는 버튼입니다.',
      },
    },
  },
};

// 📏 모든 크기 변형
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button size='small'>Small</Button>
      <Button size='medium'>Medium</Button>
      <Button size='large'>Large</Button>
    </div>
  ),

  parameters: {
    docs: {
      description: {
        story: '모든 크기 변형을 한눈에 볼 수 있습니다.',
      },
    },
  },
};

// 🎨 모든 변형 스타일
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Button variant='primary'>Primary</Button>
        <Button variant='secondary'>Secondary</Button>
        <Button variant='danger'>Danger</Button>
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Button variant='primary' disabled>
          Primary Disabled
        </Button>
        <Button variant='secondary' disabled>
          Secondary Disabled
        </Button>
        <Button variant='danger' disabled>
          Danger Disabled
        </Button>
      </div>
    </div>
  ),

  parameters: {
    docs: {
      description: {
        story: '모든 버튼 변형과 상태를 보여줍니다.',
      },
    },
  },
};
