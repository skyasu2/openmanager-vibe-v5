import type { Meta, StoryObj } from '@storybook/react';
import {
  MultiAIThinkingViewer,
  type MultiAIThinkingStep,
} from './MultiAIThinkingViewer';

const meta: Meta<typeof MultiAIThinkingViewer> = {
  title: 'AI/MultiAIThinkingViewer',
  component: MultiAIThinkingViewer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '여러 AI 엔진의 사고 과정을 실시간으로 시각화하는 컴포넌트입니다. 현재 온디맨드 시스템에서 AI 엔진들의 협업 과정을 투명하게 보여줍니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: { type: 'select' },
      options: ['LOCAL', 'GOOGLE_ONLY'],
      description: 'AI 엔진 모드',
    },
    isThinking: {
      control: 'boolean',
      description: '사고 중 상태',
    },
    steps: {
      control: 'object',
      description: 'AI 사고 과정 단계들',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleSteps: MultiAIThinkingStep[] = [
  {
    id: '1',
    engine: 'mcp',
    type: 'processing',
    title: 'MCP 엔진 분석 시작',
    content: '서버 상태 데이터를 수집하고 있습니다...',
    confidence: 85,
    timestamp: new Date(),
  },
  {
    id: '2',
    engine: 'rag',
    type: 'searching',
    title: 'RAG 벡터 검색',
    content: '관련 문서를 검색하고 있습니다...',
    confidence: 78,
    timestamp: new Date(),
  },
];

const completedSteps: MultiAIThinkingStep[] = [
  {
    id: '1',
    engine: 'mcp',
    type: 'completed',
    title: 'MCP 엔진 분석 완료',
    content: '서버 상태가 정상입니다. CPU 사용률 45%, 메모리 사용률 67%',
    confidence: 92,
    responseTime: 1200,
    timestamp: new Date(Date.now() - 5000),
    details: ['CPU: 정상 범위', '메모리: 안정적', '네트워크: 원활'],
  },
  {
    id: '2',
    engine: 'rag',
    type: 'completed',
    title: 'RAG 검색 완료',
    content: '유사한 상황의 과거 기록을 찾았습니다.',
    confidence: 88,
    responseTime: 800,
    timestamp: new Date(Date.now() - 3000),
    details: ['과거 사례 3건 발견', '모두 정상 상태로 해결'],
  },
  {
    id: '3',
    engine: 'google-ai',
    type: 'completed',
    title: 'Google AI 분석 완료',
    content: 'Advanced pattern analysis shows all systems operating normally.',
    confidence: 95,
    responseTime: 1500,
    timestamp: new Date(Date.now() - 1000),
    details: ['Pattern analysis: Normal', 'Anomaly detection: None'],
  },
];

export const Default: Story = {
  args: {
    mode: 'LOCAL',
    isThinking: false,
    steps: [],
  },
};

export const LocalModeProcessing: Story = {
  args: {
    mode: 'LOCAL',
    isThinking: true,
    steps: sampleSteps,
    currentQuery: '현재 서버 상태를 분석해주세요',
  },
};

export const LocalModeCompleted: Story = {
  args: {
    mode: 'LOCAL',
    isThinking: false,
    steps: completedSteps.slice(0, 2), // MCP + RAG만
    currentQuery: '로컬 모드로 서버 상태 분석',
  },
};

export const GoogleOnlyMode: Story = {
  args: {
    mode: 'GOOGLE_ONLY',
    isThinking: false,
    steps: [completedSteps[2]], // Google AI만
    currentQuery: 'Google AI 전용 분석',
  },
};

export const AllEnginesCompleted: Story = {
  args: {
    mode: 'LOCAL',
    isThinking: false,
    steps: completedSteps,
    currentQuery: '전체 시스템 종합 분석',
  },
};

export const WithErrors: Story = {
  args: {
    mode: 'LOCAL',
    isThinking: false,
    steps: [
      ...completedSteps.slice(0, 2),
      {
        id: '3',
        engine: 'google-ai',
        type: 'failed',
        title: 'Google AI 오류',
        content: 'API rate limit exceeded',
        confidence: 0,
        timestamp: new Date(),
        details: ['할당량 초과', '백업 엔진으로 전환 필요'],
      },
    ],
    currentQuery: '오류 상황에서의 폴백 처리',
  },
};
