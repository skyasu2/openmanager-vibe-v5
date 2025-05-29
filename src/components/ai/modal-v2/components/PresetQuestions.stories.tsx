import type { Meta, StoryObj } from '@storybook/react';
import PresetQuestions from './PresetQuestions';

/**
 * PresetQuestions는 AI 에이전트와의 상호작용을 위한 미리 정의된 질문 버튼들을 제공합니다.
 * 
 * ## 주요 기능
 * - 8개 카테고리별 컴팩트 버튼
 * - 동적 답변 생성 및 표시
 * - 실시간 엔진 로그 분석
 * - 단계별 AI 처리 과정 시각화
 * 
 * ## 질문 카테고리
 * - 📊 서버 상태 / 🔥 장애 탐지
 * - 📈 성능 분석 / 🔍 로그 분석  
 * - ⚙️ 시스템 최적화 / 🛡️ 보안 점검
 * - 📋 리포트 생성 / 🤖 AI 도우미
 */
const meta: Meta<typeof PresetQuestions> = {
  title: 'AI/PresetQuestions',
  component: PresetQuestions,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
### PresetQuestions 컴포넌트

AI 에이전트와의 효율적인 상호작용을 위한 미리 정의된 질문 인터페이스입니다.

#### 특징
- **컴팩트 디자인**: 2x4 그리드 레이아웃
- **색상 코딩**: 카테고리별 시각적 구분
- **동적 응답**: 실시간 답변 생성
- **처리 과정 투명성**: 5단계 엔진 로그

#### 엔진 처리 단계
1. **Context Load**: 컨텍스트 로드
2. **Intent Classification**: 의도 분류 (AI 추론)
3. **MCP Analysis**: MCP 서버 분석  
4. **AI Response**: AI 응답 생성
5. **Verification**: 검증 및 완료

#### 사용 예제
\`\`\`tsx
<PresetQuestions
  onQuestionSelect={(question) => console.log('Selected:', question)}
  serverMetrics={{ cpu: 45, memory: 60, disk: 30 }}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onQuestionSelect: {
      description: '질문 선택 시 호출되는 콜백 함수',
      action: 'questionSelected',
    },
    currentServerData: {
      description: '현재 서버 데이터 (답변 생성에 사용)',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 상태
export const Default: Story = {
  args: {
    currentServerData: {
      cpu: 45,
      memory: 60,
      disk: 30,
      network: 25,
      uptime: '2일 14시간',
    },
  },
};

// 높은 서버 부하 상황
export const HighLoad: Story = {
  args: {
    currentServerData: {
      cpu: 85,
      memory: 92,
      disk: 78,
      network: 60,
      uptime: '7일 3시간',
    },
  },
};

// 서버 정상 상태
export const OptimalState: Story = {
  args: {
    currentServerData: {
      cpu: 25,
      memory: 35,
      disk: 15,
      network: 12,
      uptime: '15일 8시간',
    },
  },
};

// 메모리 부족 상황
export const MemoryPressure: Story = {
  args: {
    currentServerData: {
      cpu: 40,
      memory: 95,
      disk: 45,
      network: 20,
      uptime: '3일 12시간',
    },
  },
};

// 디스크 공간 부족
export const DiskSpaceLow: Story = {
  args: {
    currentServerData: {
      cpu: 30,
      memory: 55,
      disk: 90,
      network: 18,
      uptime: '12일 6시간',
    },
  },
};

// 네트워크 트래픽 높음
export const HighNetworkTraffic: Story = {
  args: {
    currentServerData: {
      cpu: 50,
      memory: 65,
      disk: 40,
      network: 95,
      uptime: '5일 20시간',
    },
  },
};

// 신규 설치 상태
export const FreshInstall: Story = {
  args: {
    currentServerData: {
      cpu: 5,
      memory: 15,
      disk: 8,
      network: 2,
      uptime: '2시간 30분',
    },
  },
};

// 서버 과부하 상태
export const Overloaded: Story = {
  args: {
    currentServerData: {
      cpu: 98,
      memory: 97,
      disk: 85,
      network: 88,
      uptime: '1일 4시간',
    },
  },
}; 