/**
 * 📖 SimulateProgressBar Storybook Stories
 *
 * 시뮬레이션 진행바 컴포넌트의 다양한 상태와 사용 사례를 문서화
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { action } from 'storybook/actions';
import SimulateProgressBar from '../components/dashboard/SimulateProgressBar';

const meta: Meta<typeof SimulateProgressBar> = {
  title: 'Dashboard/SimulateProgressBar',
  component: SimulateProgressBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
시스템 시뮬레이션의 단계별 진행 상황을 시각적으로 표시하는 애니메이션 컴포넌트입니다.

## 주요 기능
- 🎯 12단계 시뮬레이션 진행 표시
- 🎨 Framer Motion 기반 부드러운 애니메이션
- 🔧 모듈화된 하위 컴포넌트 구조
- 📱 반응형 디자인 및 다양한 배리언트
- ⚡ 성능 최적화된 렌더링
- 🔔 기존 ToastNotification 시스템과 연동

## 사용 사례
- 시스템 초기화 과정 시각화
- 대시보드 로딩 상태 표시
- 복잡한 작업의 진행률 추적
        `,
      },
    },
  },
  argTypes: {
    currentStep: {
      control: { type: 'range', min: 0, max: 11, step: 1 },
      description: '현재 진행 중인 단계 (0-11)',
    },
    totalSteps: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
      description: '전체 단계 수',
    },
    progress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description:
        '수동 진행률 (0-100%), 설정하지 않으면 currentStep 기반으로 자동 계산',
    },
    isActive: {
      control: 'boolean',
      description: '활성 상태 여부 (애니메이션 제어)',
    },
    stepDescription: {
      control: 'text',
      description: '현재 단계 설명 텍스트',
    },
    error: {
      control: 'text',
      description: '오류 메시지 (설정시 오류 상태로 표시)',
    },
    variant: {
      control: 'select',
      options: ['default', 'compact', 'detailed'],
      description: 'UI 배리언트',
    },
    labelFormat: {
      control: 'select',
      options: ['default', 'percentage', 'step-count', 'custom'],
      description: '라벨 표시 형식',
    },
    showProgressNumber: {
      control: 'boolean',
      description: '진행률 숫자 표시 여부',
    },
    showStepDots: {
      control: 'boolean',
      description: '단계 점 표시 여부',
    },
    showDetailed: {
      control: 'boolean',
      description: '상세 정보 표시 여부',
    },
    showToastNotifications: {
      control: 'boolean',
      description:
        'ToastNotification 시스템 사용 여부 (layout.tsx의 ToastContainer 필요)',
    },
    customTitle: {
      control: 'text',
      description: '사용자 정의 제목',
    },
    onComplete: {
      action: 'completed',
      description: '완료시 호출되는 콜백',
    },
    onStepChange: {
      action: 'step-changed',
      description: '단계 변경시 호출되는 콜백',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 상태
export const Default: Story = {
  args: {
    currentStep: 3,
    totalSteps: 12,
    isActive: true,
    stepDescription: '📊 메트릭 수집기 초기화 중...',
    showDetailed: true,
    showToastNotifications: false,
    onComplete: action('onComplete'),
    onStepChange: action('onStepChange'),
  },
};

// 시작 상태 (0% 진행)
export const Starting: Story = {
  args: {
    currentStep: 0,
    totalSteps: 12,
    isActive: true,
    stepDescription: '🚀 시스템 부팅 및 초기화 시작',
    showDetailed: true,
    showToastNotifications: false,
    onComplete: action('onComplete'),
    onStepChange: action('onStepChange'),
  },
};

// 진행 중 (50% 진행)
export const InProgress: Story = {
  args: {
    currentStep: 6,
    totalSteps: 12,
    isActive: true,
    stepDescription: '🤖 AI 추론 엔진 워밍업 중...',
    showDetailed: true,
    showToastNotifications: false,
    onComplete: action('onComplete'),
    onStepChange: action('onStepChange'),
  },
};

// 거의 완료 (90% 진행)
export const NearComplete: Story = {
  args: {
    currentStep: 10,
    totalSteps: 12,
    isActive: true,
    stepDescription: '✅ 종합 헬스체크 및 검증 진행 중...',
    showDetailed: true,
    showToastNotifications: false,
    onComplete: action('onComplete'),
    onStepChange: action('onStepChange'),
  },
};

// 완료 상태 (100%)
export const Completed: Story = {
  args: {
    currentStep: 11,
    totalSteps: 12,
    isActive: false,
    stepDescription: '🎉 시뮬레이션 완료 - 서비스 준비',
    showDetailed: true,
    showToastNotifications: false,
    onComplete: action('onComplete'),
    onStepChange: action('onStepChange'),
  },
};

// 오류 상태
export const Error: Story = {
  args: {
    currentStep: 4,
    totalSteps: 12,
    isActive: false,
    stepDescription: '🌐 네트워크 인터페이스 구성',
    error: '네트워크 연결 실패: 시간 초과',
    showDetailed: true,
    showToastNotifications: false,
    onComplete: action('onComplete'),
    onStepChange: action('onStepChange'),
  },
};

// 컴팩트 배리언트
export const Compact: Story = {
  args: {
    currentStep: 5,
    totalSteps: 12,
    isActive: true,
    stepDescription: '🤖 AI 추론 엔진 워밍업',
    variant: 'compact',
    showDetailed: false,
    showToastNotifications: false,
    onComplete: action('onComplete'),
    onStepChange: action('onStepChange'),
  },
};

// 상세 배리언트
export const Detailed: Story = {
  args: {
    currentStep: 7,
    totalSteps: 12,
    isActive: true,
    stepDescription: '📈 Prometheus 스크래핑 설정 및 최적화',
    variant: 'detailed',
    showDetailed: true,
    showToastNotifications: false,
    onComplete: action('onComplete'),
    onStepChange: action('onStepChange'),
  },
};

// 퍼센트 표시 형식
export const PercentageFormat: Story = {
  args: {
    currentStep: 8,
    totalSteps: 12,
    isActive: true,
    stepDescription: '🔄 TimerManager 통합 최적화',
    labelFormat: 'percentage',
    showDetailed: true,
    showToastNotifications: false,
    onComplete: action('onComplete'),
    onStepChange: action('onStepChange'),
  },
};

// 단계 카운트 형식
export const StepCountFormat: Story = {
  args: {
    currentStep: 9,
    totalSteps: 12,
    isActive: true,
    stepDescription: '⚡ 성능 최적화 알고리즘 적용',
    labelFormat: 'step-count',
    showDetailed: true,
    showToastNotifications: false,
    onComplete: action('onComplete'),
    onStepChange: action('onStepChange'),
  },
};

// 사용자 정의 제목
export const CustomTitle: Story = {
  args: {
    currentStep: 2,
    totalSteps: 12,
    isActive: true,
    stepDescription: '🔍 전체 인프라 스캔 및 서버 검색',
    labelFormat: 'custom',
    customTitle: '🏗️ OpenManager v5 시스템 구축',
    showDetailed: true,
    showToastNotifications: false,
    onComplete: action('onComplete'),
    onStepChange: action('onStepChange'),
  },
};

// 진행률 숫자 숨김
export const NoProgressNumber: Story = {
  args: {
    currentStep: 4,
    totalSteps: 12,
    isActive: true,
    stepDescription: '🔧 데이터베이스 커넥션 풀 설정',
    showProgressNumber: false,
    showDetailed: true,
    showToastNotifications: false,
    onComplete: action('onComplete'),
    onStepChange: action('onStepChange'),
  },
};

// 단계 점 숨김
export const NoStepDots: Story = {
  args: {
    currentStep: 6,
    totalSteps: 12,
    isActive: true,
    stepDescription: '🤖 AI 추론 엔진 워밍업',
    showStepDots: false,
    showDetailed: true,
    showToastNotifications: false,
    onComplete: action('onComplete'),
    onStepChange: action('onStepChange'),
  },
};

// 수동 진행률 설정
export const ManualProgress: Story = {
  args: {
    currentStep: 5,
    totalSteps: 12,
    progress: 75, // 수동으로 75% 설정
    isActive: true,
    stepDescription: '🤖 AI 추론 엔진 고급 설정',
    showDetailed: true,
    showToastNotifications: false,
    onComplete: action('onComplete'),
    onStepChange: action('onStepChange'),
  },
};

// 비활성 상태
export const Inactive: Story = {
  args: {
    currentStep: 3,
    totalSteps: 12,
    isActive: false,
    stepDescription: '📊 메트릭 수집기 일시정지',
    showDetailed: true,
    showToastNotifications: false,
    onComplete: action('onComplete'),
    onStepChange: action('onStepChange'),
  },
};

// 토스트 알림 활성화 (실제 앱에서 사용)
export const WithToastNotifications: Story = {
  args: {
    currentStep: 5,
    totalSteps: 12,
    isActive: true,
    stepDescription: '🤖 AI 추론 엔진 워밍업',
    showDetailed: true,
    showToastNotifications: true, // 토스트 활성화
    onComplete: action('onComplete'),
    onStepChange: action('onStepChange'),
  },
  parameters: {
    docs: {
      description: {
        story:
          '실제 앱에서 사용되는 형태입니다. 토스트 알림이 활성화되어 있어 단계 변경시 알림이 표시됩니다.',
      },
    },
  },
};

// 실제 시뮬레이션 시나리오 (인터랙티브)
export const InteractiveDemo: Story = {
  args: {
    currentStep: 0,
    totalSteps: 12,
    isActive: true,
    stepDescription: '🚀 시스템 부팅 및 초기화',
    showDetailed: true,
    showToastNotifications: false,
    onComplete: action('onComplete'),
    onStepChange: action('onStepChange'),
  },
  play: async ({ canvasElement, step }) => {
    // 스토리북 인터랙션 API를 사용한 자동 진행 시뮬레이션
    // (실제 구현시 sleep 함수와 단계별 업데이트 로직 추가)
  },
};
