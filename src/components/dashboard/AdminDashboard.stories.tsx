import type { Meta, StoryObj } from '@storybook/react';
import AdminDashboardCharts from '../AdminDashboardCharts';

const meta: Meta<typeof AdminDashboardCharts> = {
  title: 'Components/Dashboard/AdminDashboard',
  component: AdminDashboardCharts,

  // Storybook 9.0 태그 기반 조직화
  tags: ['autodocs', 'dashboard', 'admin', 'charts'],

  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'OpenManager v5의 관리자 대시보드 차트 컴포넌트입니다. 실시간 서버 모니터링과 AI 분석 결과를 시각화합니다.',
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
          {
            id: 'landmark-one-main',
            enabled: false, // 대시보드는 여러 메인 영역을 가질 수 있음
          },
        ],
      },
    },
  },

  argTypes: {
    // props가 있다면 여기에 추가
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 대시보드
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: '기본 관리자 대시보드 차트 뷰입니다.',
      },
    },
  },
};

// 다크 테마
export const DarkTheme: Story = {
  args: {},
  globals: {
    theme: 'dark',
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: '다크 테마가 적용된 대시보드입니다.',
      },
    },
  },
};

// 모바일 뷰
export const Mobile: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile2',
    },
    docs: {
      description: {
        story: '모바일 화면에서의 대시보드 렌더링입니다.',
      },
    },
  },
};

// 태블릿 뷰
export const Tablet: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: '태블릿 화면에서의 대시보드 렌더링입니다.',
      },
    },
  },
};
