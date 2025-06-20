import type { Meta, StoryObj } from '@storybook/nextjs';
import DevelopmentProcessPage from './page';

const meta: Meta<typeof DevelopmentProcessPage> = {
  title: 'Pages/About (개발과정)',
  component: DevelopmentProcessPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## 개발과정 페이지 (/about)

OpenManager Vibe v5의 개발과정을 소개하는 페이지입니다.

### 주요 기능
- 프로젝트 개발 통계 표시 (20일, 603파일, 200K+ 라인, 1명)
- 3개 섹션: 핵심 기술, 주요 성과, 운영 환경
- 홈페이지로 돌아가기 네비게이션
- 다크 테마 그라데이션 배경
- 반응형 디자인 (모바일, 태블릿, 데스크톱)

### 최근 업데이트
- /vibe-coding → /about 경로 변경
- FeatureCardsGrid에서 접근 가능한 버튼 추가
- 실제 프로젝트 데이터 반영
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DevelopmentProcessPage>;

// 기본 상태
export const Default: Story = {
  name: '기본 상태',
  parameters: {
    docs: {
      description: {
        story:
          '기본적인 개발과정 페이지입니다. 프로젝트 통계와 3개 주요 섹션이 표시됩니다.',
      },
    },
  },
};

// 모바일 뷰
export const MobileView: Story = {
  name: '모바일 뷰',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          '모바일 화면에서의 개발과정 페이지입니다. 카드들이 세로로 배치됩니다.',
      },
    },
  },
};

// 태블릿 뷰
export const TabletView: Story = {
  name: '태블릿 뷰',
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: '태블릿 화면에서의 개발과정 페이지입니다.',
      },
    },
  },
};

// 다크모드 강조
export const DarkModeHighlight: Story = {
  name: '다크모드 강조',
  decorators: [
    Story => (
      <div className='bg-black'>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '다크 배경에서 더욱 강조된 개발과정 페이지입니다.',
      },
    },
  },
};

// 라이트 배경 대비
export const LightBackgroundContrast: Story = {
  name: '라이트 배경 대비',
  decorators: [
    Story => (
      <div className='bg-white'>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '라이트 배경과의 대비를 확인할 수 있는 개발과정 페이지입니다.',
      },
    },
  },
};

// 데스크톱 와이드 뷰
export const DesktopWideView: Story = {
  name: '데스크톱 와이드 뷰',
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story:
          '데스크톱 와이드 화면에서의 개발과정 페이지입니다. 모든 요소가 최적화되어 표시됩니다.',
      },
    },
  },
};

// 통계 카드 포커스
export const StatisticsCardsFocus: Story = {
  name: '통계 카드 포커스',
  decorators: [
    Story => (
      <div style={{ zoom: '1.2' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: '프로젝트 통계 카드들을 확대하여 세부사항을 확인할 수 있습니다.',
      },
    },
  },
};

// 콘텐츠 섹션 포커스
export const ContentSectionsFocus: Story = {
  name: '콘텐츠 섹션 포커스',
  decorators: [
    Story => (
      <div className='overflow-hidden'>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          '핵심 기술, 주요 성과, 운영 환경 섹션들을 포커스하여 확인할 수 있습니다.',
      },
    },
  },
};
