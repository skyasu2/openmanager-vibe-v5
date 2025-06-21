import type { Meta, StoryObj } from '@storybook/nextjs';
import { AIEngineTest } from './AIEngineTest';

const meta: Meta<typeof AIEngineTest> = {
    title: 'AI/AIEngineTest',
    component: AIEngineTest,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'AI 엔진 테스트 및 모니터링 컴포넌트입니다. 11개 AI 엔진의 상태를 실시간으로 확인할 수 있습니다.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    name: '기본 상태',
    args: {},
};

export const TestingMode: Story = {
    name: '테스트 모드',
    args: {},
    parameters: {
        docs: {
            description: {
                story: 'AI 엔진들의 응답 시간과 성능을 테스트하는 모드입니다.',
            },
        },
    },
};

export const MonitoringMode: Story = {
    name: '모니터링 모드',
    args: {},
    parameters: {
        docs: {
            description: {
                story: 'AI 엔진들의 실시간 상태를 모니터링하는 모드입니다.',
            },
        },
    },
};

export const DebugMode: Story = {
    name: '디버그 모드',
    args: {},
    parameters: {
        docs: {
            description: {
                story: 'AI 엔진들의 상세한 로그와 디버그 정보를 확인할 수 있습니다.',
            },
        },
    },
}; 