import type { Meta, StoryObj } from '@storybook/nextjs';
import { MultiAIThinkingViewer } from './MultiAIThinkingViewer';

const meta: Meta<typeof MultiAIThinkingViewer> = {
    title: 'AI/MultiAIThinkingViewer',
    component: MultiAIThinkingViewer,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Multi-AI 엔진의 사고 과정을 실시간으로 시각화하는 컴포넌트입니다.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 상태
export const AutoMode: Story = {
    name: 'AUTO 모드',
    args: {
        mode: 'AUTO',
        isThinking: true,
        steps: [
            {
                id: '1',
                engine: 'mcp',
                type: 'processing',
                title: 'MCP 엔진 처리 중',
                content: '서버 데이터를 분석하고 있습니다...',
                timestamp: new Date(),
            },
        ],
        currentQuery: '서버 상태 분석',
    },
};

export const LocalMode: Story = {
    name: 'LOCAL 모드',
    args: {
        mode: 'LOCAL',
        isThinking: false,
        steps: [
            {
                id: '1',
                engine: 'mcp',
                type: 'completed',
                title: 'MCP 분석 완료',
                content: 'MCP 서버에서 데이터를 수집했습니다.',
                confidence: 90,
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
        ],
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

// 처리 중 상태
export const Processing: Story = {
    name: '처리 중',
    args: {
        isVisible: true,
        currentStep: 'processing',
        progress: 75,
        aiEngines: [
            { name: 'Google AI', status: 'processing', progress: 85 },
            { name: 'Local RAG', status: 'completed', progress: 100 },
            { name: 'Unified AI', status: 'processing', progress: 40 },
        ],
    },
};

// 완료 상태
export const Completed: Story = {
    name: '완료 상태',
    args: {
        isVisible: true,
        currentStep: 'completed',
        progress: 100,
        aiEngines: [
            { name: 'Google AI', status: 'completed', progress: 100 },
            { name: 'Local RAG', status: 'completed', progress: 100 },
            { name: 'Unified AI', status: 'completed', progress: 100 },
        ],
    },
};

// 오류 상태
export const Error: Story = {
    name: '오류 상태',
    args: {
        isVisible: true,
        currentStep: 'error',
        progress: 60,
        aiEngines: [
            { name: 'Google AI', status: 'error', progress: 60 },
            { name: 'Local RAG', status: 'completed', progress: 100 },
            { name: 'Unified AI', status: 'fallback', progress: 80 },
        ],
    },
}; 