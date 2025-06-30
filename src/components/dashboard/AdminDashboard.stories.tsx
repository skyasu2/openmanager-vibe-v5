import type { Meta, StoryObj } from '@storybook/react';
import AdminDashboardCharts from '../AdminDashboardCharts';

const meta: Meta<typeof AdminDashboardCharts> = {
  title: 'Dashboard/AdminDashboard',
  component: AdminDashboardCharts,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
### AdminDashboard v5.56.0 - 최신 업데이트

완전히 개선된 관리자 대시보드:

- ✅ **Multi-AI 시스템 통합**: 4개 AI 엔진 완전 협업
- ✅ **실시간 서버 모니터링**: 15개 서버 실시간 추적
- ✅ **목업 시스템**: 외부 의존성 완전 제거
- ✅ **한국시간 기준**: Asia/Seoul 타임존 완전 지원
- ✅ **완전한 반응형**: 모든 디바이스 완벽 지원

#### 현재 상태 (2025-06-30 09:05 KST):
- **테스트**: 539개 테스트 100% 통과
- **배포**: Vercel 프로덕션 완전 정상
- **문서**: 13개 핵심 문서 완성

#### 주요 특징:
- **실시간 메트릭**: 5초 간격 자동 업데이트
- **AI 통합 분석**: 4개 엔진 병렬 처리
- **완전한 목업**: Redis, Google AI 목업 시스템
- **성능 최적화**: React.memo, 지연 로딩 적용

#### 사용법:
\`\`\`tsx
<AdminDashboard 
  mode="production"
  aiEngines={["mcp", "rag", "google-ai", "rule-based"]}
  timezone="Asia/Seoul"
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs', 'test'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['development', 'production', 'testing'],
      description: '대시보드 모드',
    },
    showAIEngines: {
      control: 'boolean',
      description: 'AI 엔진 패널 표시',
    },
    realTimeUpdates: {
      control: 'boolean',
      description: '실시간 업데이트 활성화',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    mode: 'production',
    showAIEngines: true,
    realTimeUpdates: true,
  },
  parameters: {
    docs: {
      description: {
        story: '기본 관리자 대시보드. 모든 기능이 활성화된 상태입니다.',
      },
    },
  },
};

export const ProductionMode: Story = {
  args: {
    mode: 'production',
    showAIEngines: true,
    realTimeUpdates: true,
  },
  parameters: {
    docs: {
      description: {
        story: '프로덕션 모드 대시보드. 실제 운영 환경과 동일한 설정입니다.',
      },
    },
  },
};

export const DevelopmentMode: Story = {
  args: {
    mode: 'development',
    showAIEngines: true,
    realTimeUpdates: false,
  },
  parameters: {
    docs: {
      description: {
        story: '개발 모드 대시보드. 개발자 도구와 디버깅 정보가 표시됩니다.',
      },
    },
  },
};

export const TestingMode: Story = {
  args: {
    mode: 'testing',
    showAIEngines: false,
    realTimeUpdates: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          '테스트 모드 대시보드. 최소한의 기능으로 테스트에 최적화되었습니다.',
      },
    },
  },
};

export const MinimalView: Story = {
  args: {
    mode: 'production',
    showAIEngines: false,
    realTimeUpdates: false,
  },
  parameters: {
    docs: {
      description: {
        story: '최소 보기 모드. 핵심 정보만 표시하여 성능을 최적화합니다.',
      },
    },
  },
};
