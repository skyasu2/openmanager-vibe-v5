import type { Meta, StoryObj } from '@storybook/react';
import { MultiAIThinkingViewer } from './MultiAIThinkingViewer';

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
    mode: {
      control: 'select',
      options: ['AUTO', 'LOCAL', 'GOOGLE_ONLY'],
      description: 'AI 모드 선택',
    },
    isThinking: {
      control: 'boolean',
      description: '사고 중 상태',
    },
    currentQuery: {
      control: 'text',
      description: '현재 질문',
    },
    className: {
      control: 'text',
      description: 'CSS 클래스',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 모킹 데이터
const mockSteps = [
  {
    id: 'step-1',
    engine: 'mcp' as const,
    type: 'processing' as const,
    title: 'MCP 엔진으로 서버 상태 확인 중',
    content: '현재 서버 메트릭을 수집하고 분석하고 있습니다.',
    confidence: 0.85,
    responseTime: 120,
    timestamp: new Date(),
    details: ['CPU 사용률 확인', '메모리 상태 점검', '네트워크 연결 상태 확인'],
  },
  {
    id: 'step-2',
    engine: 'rag' as const,
    type: 'searching' as const,
    title: 'RAG 엔진으로 관련 정보 검색 중',
    content: '과거 서버 이슈 패턴과 해결 방법을 검색하고 있습니다.',
    confidence: 0.78,
    responseTime: 95,
    timestamp: new Date(),
  },
  {
    id: 'step-3',
    engine: 'google-ai' as const,
    type: 'analyzing' as const,
    title: 'Google AI로 종합 분석 중',
    content: '수집된 정보를 바탕으로 최적의 답변을 생성하고 있습니다.',
    confidence: 0.92,
    responseTime: 200,
    timestamp: new Date(),
  },
];

export const Default: Story = {
  args: {
    mode: 'AUTO',
    isThinking: true,
    steps: mockSteps,
    currentQuery: '현재 서버 상태가 어떤가요?',
  },
};

export const LocalMode: Story = {
  args: {
    mode: 'LOCAL',
    isThinking: false,
    steps: mockSteps.slice(0, 2), // MCP, RAG만
    currentQuery: '로컬 모드에서 서버 확인',
  },
};

export const GoogleOnlyMode: Story = {
  args: {
    mode: 'GOOGLE_ONLY',
    isThinking: false,
    steps: [mockSteps[2]], // Google AI만
    currentQuery: 'Google AI 전용 질문',
  },
};

export const CompletedProcess: Story = {
  args: {
    mode: 'AUTO',
    isThinking: false,
    steps: mockSteps.map(step => ({ ...step, type: 'completed' as const })),
    currentQuery: '완료된 처리 과정',
  },
};

export const InitialState: Story = {
  args: {
    mode: 'AUTO',
    isThinking: false,
    steps: [],
    currentQuery: '',
  },
};
