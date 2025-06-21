import type { Meta, StoryObj } from '@storybook/nextjs';
import { AnomalyFeed } from '../dashboard/AnomalyFeed';

const meta: Meta<typeof AnomalyFeed> = {
    title: 'Shared/AnomalyFeed',
    component: AnomalyFeed,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: '시스템 이상 징후를 실시간으로 표시하는 피드 컴포넌트입니다.',
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

export const WithAnomalies: Story = {
    name: '이상 징후 감지',
    args: {},
    parameters: {
        docs: {
            description: {
                story: '다양한 이상 징후가 감지된 상태를 보여줍니다.',
            },
        },
    },
};

export const EmptyState: Story = {
    name: '정상 상태',
    args: {},
    parameters: {
        docs: {
            description: {
                story: '이상 징후가 없는 정상 상태입니다.',
            },
        },
    },
}; 