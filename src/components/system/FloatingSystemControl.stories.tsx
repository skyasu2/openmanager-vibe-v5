import type { Meta, StoryObj } from '@storybook/react';
import FloatingSystemControl from './FloatingSystemControl';

/**
 * FloatingSystemControl은 시스템 상태에 따라 동적으로 위치가 변경되는 플로팅 제어판입니다.
 * 
 * ## 주요 기능
 * - 시스템 상태별 자동 위치 조정
 * - 실시간 헬스 모니터링
 * - 원클릭 시스템 제어
 * - 확장 가능한 상세 정보 패널
 * 
 * ## 동적 위치 시스템
 * - **정상**: 우하단 고정 (컴팩트 모드)
 * - **경고/에러**: 상단 중앙으로 자동 이동 (확장 모드)
 * - **사용자 조작**: 수동 위치 조정 가능
 */
const meta: Meta<typeof FloatingSystemControl> = {
  title: 'System/FloatingSystemControl',
  component: FloatingSystemControl,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
### FloatingSystemControl 컴포넌트

시스템 상태를 실시간으로 모니터링하고 제어할 수 있는 플로팅 UI입니다.

#### 특징
- **Framer Motion** 애니메이션
- **지능형 위치 조정**
- **5초 간격 헬스 체크**
- **색상 코딩 상태 표시**

#### 상태별 색상
- 🟢 **Healthy**: 시스템 정상
- 🟡 **Warning**: 주의 필요  
- 🔴 **Critical**: 즉시 조치 필요

#### 사용 예제
\`\`\`tsx
<FloatingSystemControl
  systemState={{
    isSystemActive: true,
    isSystemPaused: false,
    lastHealthCheck: new Date(),
  }}
  aiAgentState={{ state: 'active' }}
  isSystemActive={true}
  isSystemPaused={false}
  onStartSystem={() => console.log('Start')}
  onStopSystem={() => console.log('Stop')}
  onResumeSystem={() => console.log('Resume')}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    systemState: {
      description: '시스템 상태 객체',
      control: 'object',
    },
    aiAgentState: {
      description: 'AI 에이전트 상태',
      control: 'object',
    },
    isSystemActive: {
      description: '시스템 활성화 상태',
      control: 'boolean',
    },
    isSystemPaused: {
      description: '시스템 일시정지 상태',
      control: 'boolean',
    },
    onStartSystem: {
      description: '시스템 시작 핸들러',
      action: 'startSystem',
    },
    onStopSystem: {
      description: '시스템 중지 핸들러',
      action: 'stopSystem',
    },
    onResumeSystem: {
      description: '시스템 재개 핸들러',
      action: 'resumeSystem',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 시스템 정상 운영 상태
export const HealthySystem: Story = {
  args: {
    systemState: {
      isSystemActive: true,
      isSystemPaused: false,
      lastHealthCheck: new Date(),
      systemErrors: [],
      warnings: [],
    },
    aiAgentState: { state: 'active' },
    isSystemActive: true,
    isSystemPaused: false,
  },
};

// 시스템 경고 상태
export const WarningSystem: Story = {
  args: {
    systemState: {
      isSystemActive: true,
      isSystemPaused: false,
      lastHealthCheck: new Date(),
      systemErrors: [],
      warnings: ['높은 CPU 사용률 감지됨', '메모리 사용량 임계치 접근'],
    },
    aiAgentState: { state: 'active' },
    isSystemActive: true,
    isSystemPaused: false,
  },
};

// 시스템 에러 상태
export const CriticalSystem: Story = {
  args: {
    systemState: {
      isSystemActive: true,
      isSystemPaused: false,
      lastHealthCheck: new Date(),
      systemErrors: ['서버 연결 실패', '데이터베이스 접근 불가'],
      warnings: ['백업 프로세스 지연'],
    },
    aiAgentState: { state: 'error' },
    isSystemActive: true,
    isSystemPaused: false,
  },
};

// 시스템 일시정지 상태
export const PausedSystem: Story = {
  args: {
    systemState: {
      isSystemActive: true,
      isSystemPaused: true,
      lastHealthCheck: new Date(),
      systemErrors: [],
      warnings: [],
    },
    aiAgentState: { state: 'paused' },
    isSystemActive: true,
    isSystemPaused: true,
  },
};

// 시스템 중지 상태
export const StoppedSystem: Story = {
  args: {
    systemState: {
      isSystemActive: false,
      isSystemPaused: false,
      lastHealthCheck: new Date(Date.now() - 60000), // 1분 전
      systemErrors: [],
      warnings: [],
    },
    aiAgentState: { state: 'inactive' },
    isSystemActive: false,
    isSystemPaused: false,
  },
};

// AI 에이전트 오류 상태
export const AIAgentError: Story = {
  args: {
    systemState: {
      isSystemActive: true,
      isSystemPaused: false,
      lastHealthCheck: new Date(),
      systemErrors: [],
      warnings: ['AI 에이전트 응답 지연'],
    },
    aiAgentState: { 
      state: 'error',
      error: 'AI 모델 로딩 실패'
    },
    isSystemActive: true,
    isSystemPaused: false,
  },
};

// 다중 문제 상황
export const MultipleIssues: Story = {
  args: {
    systemState: {
      isSystemActive: true,
      isSystemPaused: false,
      lastHealthCheck: new Date(),
      systemErrors: [
        '주 데이터베이스 연결 실패',
        '백업 서버 응답 없음',
        '로그 저장소 용량 부족'
      ],
      warnings: [
        'CPU 사용률 85% 초과',
        '메모리 사용률 90% 초과',
        '네트워크 지연 감지',
        'SSL 인증서 만료 임박'
      ],
    },
    aiAgentState: { 
      state: 'error',
      error: '다중 시스템 장애 감지'
    },
    isSystemActive: true,
    isSystemPaused: false,
  },
}; 