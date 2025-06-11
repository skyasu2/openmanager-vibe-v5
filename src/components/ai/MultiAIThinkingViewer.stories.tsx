import type { Meta, StoryObj } from '@storybook/react';
import MultiAIThinkingViewer from './MultiAIThinkingViewer';

const meta: Meta<typeof MultiAIThinkingViewer> = {
  title: 'AI Components/MultiAIThinkingViewer',
  component: MultiAIThinkingViewer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '🧠 Multi-AI 사고 과정 시각화 컴포넌트 v2.0 - AI 엔진들의 협업 과정을 실시간으로 시각화합니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    sessionId: {
      control: 'text',
      description: '세션 식별자',
    },
    showMetrics: {
      control: 'boolean',
      description: '메트릭 표시 여부',
    },
    compact: {
      control: 'boolean',
      description: '컴팩트 모드',
    },
    onFeedback: {
      action: 'feedback-submitted',
      description: '피드백 제출 콜백',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 모킹 데이터
const mockThinkingProcess = {
  sessionId: 'session_123',
  timestamp: new Date().toISOString(),
  overallProgress: 75,
  aiEngines: {
    'gpt-4': {
      status: 'completed' as const,
      currentStep: '답변 생성 완료',
      progress: 100,
      thinking:
        'OpenAI GPT-4로 답변을 생성했습니다. 높은 정확도로 질문을 분석하고 체계적인 답변을 제공했습니다.',
      confidence: 0.92,
      contribution: '주요 답변 내용 생성',
      thoughts: [
        {
          engineId: 'gpt-4',
          engineName: 'GPT-4',
          step: '질문 분석',
          progress: 100,
          thinking: '사용자의 질문을 분석하여 핵심 요구사항을 파악했습니다.',
          confidence: 0.95,
          timestamp: new Date(Date.now() - 30000).toISOString(),
          status: 'completed' as const,
        },
      ],
    },
    'claude-3': {
      status: 'processing' as const,
      currentStep: '답변 검증 중',
      progress: 80,
      thinking:
        'Anthropic Claude-3로 답변을 검증하고 있습니다. GPT-4의 답변을 다각도로 분석하여 정확성을 확인합니다.',
      confidence: 0.88,
      contribution: '답변 검증 및 보완',
      thoughts: [],
    },
    'gemini-pro': {
      status: 'thinking' as const,
      currentStep: '추가 정보 검색',
      progress: 45,
      thinking:
        'Google Gemini Pro로 관련 정보를 추가 검색하고 있습니다. 최신 정보와 다양한 관점을 제공할 예정입니다.',
      confidence: 0.75,
      contribution: '추가 정보 및 다양한 관점',
      thoughts: [],
    },
  },
  fusionStatus: {
    stage: 'analyzing' as const,
    progress: 60,
    description: 'AI 엔진들의 결과를 분석하고 최적의 답변을 융합하고 있습니다.',
    consensusScore: 0.85,
  },
};

const mockCompletedProcess = {
  ...mockThinkingProcess,
  overallProgress: 100,
  aiEngines: {
    ...mockThinkingProcess.aiEngines,
    'claude-3': {
      ...mockThinkingProcess.aiEngines['claude-3'],
      status: 'completed' as const,
      progress: 100,
      thinking:
        'Claude-3로 답변 검증을 완료했습니다. GPT-4의 답변이 정확하며 추가 개선사항을 제안했습니다.',
      confidence: 0.91,
    },
    'gemini-pro': {
      ...mockThinkingProcess.aiEngines['gemini-pro'],
      status: 'completed' as const,
      progress: 100,
      thinking:
        'Gemini Pro로 추가 정보 검색을 완료했습니다. 최신 동향과 실용적인 팁을 추가로 제공합니다.',
      confidence: 0.87,
    },
  },
  fusionStatus: {
    stage: 'finalizing' as const,
    progress: 100,
    description:
      '모든 AI 엔진의 결과를 성공적으로 융합하여 최종 답변을 생성했습니다.',
    consensusScore: 0.89,
  },
};

export const Default: Story = {
  args: {
    sessionId: 'demo-session-1',
    thinkingProcess: mockThinkingProcess,
    showMetrics: true,
    compact: false,
  },
};

export const CompletedProcess: Story = {
  args: {
    sessionId: 'demo-session-2',
    thinkingProcess: mockCompletedProcess,
    showMetrics: true,
    compact: false,
  },
};

export const CompactMode: Story = {
  args: {
    sessionId: 'demo-session-3',
    thinkingProcess: mockThinkingProcess,
    showMetrics: false,
    compact: true,
  },
};

export const WithoutMetrics: Story = {
  args: {
    sessionId: 'demo-session-4',
    thinkingProcess: mockThinkingProcess,
    showMetrics: false,
    compact: false,
  },
};

export const InitialState: Story = {
  args: {
    sessionId: 'demo-session-5',
    showMetrics: true,
    compact: false,
  },
};
