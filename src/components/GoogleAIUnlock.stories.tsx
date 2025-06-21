import type { Meta, StoryObj } from '@storybook/nextjs';
import GoogleAIUnlock from './GoogleAIUnlock';

const meta: Meta<typeof GoogleAIUnlock> = {
    title: 'AI/GoogleAIUnlock',
    component: GoogleAIUnlock,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Google AI 서비스 잠금 해제 및 설정 컴포넌트입니다. API 키 관리와 할당량 모니터링을 제공합니다.',
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

export const Locked: Story = {
    name: '잠금 상태',
    args: {},
    parameters: {
        docs: {
            description: {
                story: 'Google AI 서비스가 잠금된 상태입니다. API 키 입력이 필요합니다.',
            },
        },
    },
};

export const Unlocked: Story = {
    name: '잠금 해제',
    args: {},
    parameters: {
        docs: {
            description: {
                story: 'Google AI 서비스가 활성화된 상태입니다.',
            },
        },
    },
};

export const QuotaWarning: Story = {
    name: '할당량 경고',
    args: {},
    parameters: {
        docs: {
            description: {
                story: 'API 할당량이 부족한 상태의 경고를 표시합니다.',
            },
        },
    },
};

export const ConfigurationMode: Story = {
    name: '설정 모드',
    args: {},
    parameters: {
        docs: {
            description: {
                story: 'Google AI 서비스의 상세 설정을 관리하는 모드입니다.',
            },
        },
    },
}; 