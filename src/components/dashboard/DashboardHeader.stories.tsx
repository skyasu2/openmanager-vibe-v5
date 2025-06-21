import type { Meta, StoryObj } from '@storybook/nextjs';
import DashboardHeader from './DashboardHeader';

const meta: Meta<typeof DashboardHeader> = {
    title: 'Dashboard/DashboardHeader',
    component: DashboardHeader,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: '대시보드 상단 헤더 컴포넌트입니다. 서버 통계와 AI 어시스턴트 토글을 제공합니다.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    name: '기본 상태',
    args: {
        totalServers: 15,
        activeServers: 13,
        warningServers: 2,
        errorServers: 0,
    },
};

export const WithWarnings: Story = {
    name: '경고 상태',
    args: {
        totalServers: 15,
        activeServers: 11,
        warningServers: 3,
        errorServers: 1,
    },
};

export const AllHealthy: Story = {
    name: '모든 서버 정상',
    args: {
        totalServers: 15,
        activeServers: 15,
        warningServers: 0,
        errorServers: 0,
    },
};

export const CriticalState: Story = {
    name: '심각한 상태',
    args: {
        totalServers: 15,
        activeServers: 8,
        warningServers: 4,
        errorServers: 3,
    },
};

export const SmallScale: Story = {
    name: '소규모 환경',
    args: {
        totalServers: 5,
        activeServers: 4,
        warningServers: 1,
        errorServers: 0,
    },
};

export const LargeScale: Story = {
    name: '대규모 환경',
    args: {
        totalServers: 100,
        activeServers: 95,
        warningServers: 3,
        errorServers: 2,
    },
}; 