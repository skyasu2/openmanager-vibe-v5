/**
 * 🎛️ Infrastructure Overview Page Stories
 *
 * 인프라 전체 현황 페이지 스토리북 (v5.44.4)
 * 최근 업데이트: 실제 서버 데이터 연동, 상태 매핑 수정, NaN 방지 로직 추가
 */

import type { Meta, StoryObj } from '@storybook/react';
import InfrastructureOverviewPage from './InfrastructureOverviewPage';

const meta: Meta<typeof InfrastructureOverviewPage> = {
  title: 'Dashboard/InfrastructureOverviewPage',
  component: InfrastructureOverviewPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
🎛️ **인프라 전체 현황 페이지 (v5.44.4)**

실시간 서버 모니터링 대시보드의 핵심 컴포넌트입니다.

### ✨ 주요 기능
- **실시간 서버 통계**: 15개 서버 실시간 모니터링
- **상태별 분류**: running(온라인), warning(경고), error(오프라인)
- **리소스 사용률**: CPU, 메모리, 디스크 평균 사용률 계산
- **네트워크 대역폭**: 총 네트워크 트래픽 표시
- **자동 새로고침**: 10초 간격 실시간 업데이트

### 🔧 최근 수정사항 (v5.44.4)
- ✅ 서버 상태 매핑 로직 수정 (running → online)
- ✅ 메트릭 데이터 접근 경로 수정 (server.metrics.cpu)
- ✅ NaN 방지 및 안전한 계산 로직 추가
- ✅ 실제 API 데이터와 완전 연동
- ✅ 디버깅 로그 추가로 투명성 향상

### 📊 실시간 데이터 소스
- **API 엔드포인트**: \`/api/servers\`
- **서버 개수**: 15개 (production, staging, development)
- **업데이트 주기**: 10초 간격
- **데이터 형식**: JSON with success/servers structure
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: '추가 CSS 클래스명',
      defaultValue: '',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 🎯 기본 인프라 현황 (실제 데이터 연동)
 */
export const Default: Story = {
  args: {
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story:
          '실제 15개 서버의 실시간 데이터를 표시하는 기본 인프라 현황 페이지입니다. 수정된 상태 매핑 로직과 안전한 계산이 적용되었습니다.',
      },
    },
  },
};

/**
 * 📱 모바일 반응형 뷰
 */
export const MobileView: Story = {
  args: {
    className: '',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          '모바일 환경에서의 인프라 현황 표시입니다. 서버 통계 카드가 세로로 배열됩니다.',
      },
    },
  },
};

/**
 * 💻 태블릿 뷰
 */
export const TabletView: Story = {
  args: {
    className: '',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story:
          '태블릿 환경에서의 인프라 현황 표시입니다. 중간 크기 그리드 레이아웃이 적용됩니다.',
      },
    },
  },
};

/**
 * 🎨 커스텀 스타일 적용
 */
export const CustomStyled: Story = {
  args: {
    className: 'bg-gray-900 text-white',
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story:
          '다크 테마가 적용된 인프라 현황 페이지입니다. 커스텀 CSS 클래스를 통해 스타일을 변경할 수 있습니다.',
      },
    },
  },
};

/**
 * 🔄 실시간 업데이트 시뮬레이션
 */
export const RealtimeUpdates: Story = {
  args: {
    className: '',
  },
  render: args => (
    <div className='space-y-4'>
      <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
        <h3 className='font-semibold text-blue-800 mb-2'>
          🔄 실시간 업데이트 테스트
        </h3>
        <p className='text-sm text-blue-700'>
          이 컴포넌트는 10초마다 자동으로 서버 데이터를 새로고침합니다. 개발자
          도구 콘솔에서 API 호출과 데이터 처리 로그를 확인할 수 있습니다.
        </p>
        <div className='mt-2 text-xs text-blue-600'>
          • 🔍 인프라 현황 - 서버 데이터
          <br />
          • 📊 서버 상태 분포
          <br />• ✅ 최종 통계
        </div>
      </div>
      <InfrastructureOverviewPage {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '실시간 업데이트 기능을 강조한 버전입니다. 콘솔 로그를 통해 데이터 처리 과정을 확인할 수 있습니다.',
      },
    },
  },
};

/**
 * 📊 데이터 구조 시각화
 */
export const DataStructureDemo: Story = {
  args: {
    className: '',
  },
  render: args => (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      <div>
        <h3 className='text-lg font-semibold mb-4'>📊 실제 컴포넌트</h3>
        <InfrastructureOverviewPage {...args} />
      </div>
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold mb-4'>🔍 데이터 구조</h3>
        <div className='bg-gray-100 p-4 rounded-lg text-xs'>
          <pre className='whitespace-pre-wrap'>{`
// API 응답 구조
{
  "success": true,
  "servers": [
    {
      "id": "server-1",
      "name": "api-1", 
      "status": "running", // → online
      "metrics": {
        "cpu": 60.34,
        "memory": 78.56,
        "disk": 70.66
      }
    }
  ],
  "stats": {
    "total": 15,
    "online": 9,
    "warning": 4, 
    "offline": 2
  }
}

// 수정된 상태 매핑
running → online ✅
warning → warning ✅
error/stopped → offline ✅
          `}</pre>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '실제 API 데이터 구조와 수정된 상태 매핑 로직을 시각적으로 보여주는 데모입니다.',
      },
    },
  },
};
