import type { Meta, StoryObj } from '@storybook/nextjs';
import {
  MultiAIThinkingStep,
  MultiAIThinkingViewer,
} from './MultiAIThinkingViewer';

const meta: Meta<typeof MultiAIThinkingViewer> = {
  title: 'AI/MultiAIThinkingViewer',
  component: MultiAIThinkingViewer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Multi-AI 엔진의 사고 과정을 실시간으로 시각화하는 컴포넌트입니다.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockSteps: MultiAIThinkingStep[] = [
  {
    id: '1',
    engine: 'mcp',
    type: 'processing',
    title: 'MCP 엔진 처리 중',
    content: '서버 데이터를 분석하고 있습니다...',
    timestamp: new Date(),
  },
  {
    id: '2',
    engine: 'rag',
    type: 'completed',
    title: 'RAG 검색 완료',
    content: '로컬 벡터 DB에서 정보를 찾았습니다.',
    confidence: 85,
    timestamp: new Date(),
  },
];

export const AutoMode: Story = {
  name: 'AUTO 모드',
  args: {
    mode: 'AUTO',
    isThinking: true,
    steps: mockSteps,
    currentQuery: '서버 상태 분석',
  },
};

export const LocalMode: Story = {
  name: 'LOCAL 모드',
  args: {
    mode: 'LOCAL',
    isThinking: false,
    steps: mockSteps,
    currentQuery: '로컬 데이터 분석',
  },
};

export const GoogleOnlyMode: Story = {
  name: 'GOOGLE_ONLY 모드',
  args: {
    mode: 'GOOGLE_ONLY',
    isThinking: true,
    steps: [
      {
        id: '1',
        engine: 'google-ai',
        type: 'processing',
        title: 'Google AI 분석 중',
        content: 'Gemini 모델이 요청을 처리 중입니다...',
        timestamp: new Date(),
      },
    ],
    currentQuery: 'AI 기반 서버 분석',
  },
};
