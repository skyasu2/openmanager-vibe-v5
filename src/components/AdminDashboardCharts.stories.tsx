import type { Meta, StoryObj } from '@storybook/nextjs';
import AdminDashboardCharts from './AdminDashboardCharts';

const meta: Meta<typeof AdminDashboardCharts> = {
    title: 'Admin/AdminDashboardCharts',
    component: AdminDashboardCharts,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: '관리자 대시보드 차트 컴포넌트입니다. 시스템 전체의 성능 메트릭과 통계를 시각화합니다.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    name: '기본 대시보드',
    args: {},
};

export const PerformanceView: Story = {
    name: '성능 모니터링',
    args: {},
    parameters: {
        docs: {
            description: {
                story: '시스템 성능 메트릭에 집중한 차트 뷰입니다.',
            },
        },
    },
};

export const UsageAnalytics: Story = {
    name: '사용량 분석',
    args: {},
    parameters: {
        docs: {
            description: {
                story: '사용자 활동과 리소스 사용량 분석 차트입니다.',
            },
        },
    },
};

export const ErrorAnalysis: Story = {
    name: '오류 분석',
    args: {},
    parameters: {
        docs: {
            description: {
                story: '시스템 오류와 경고 상황을 분석하는 차트입니다.',
            },
        },
    },
};

export const RealTimeMonitoring: Story = {
    name: '실시간 모니터링',
    args: {},
    parameters: {
        docs: {
            description: {
                story: '실시간으로 업데이트되는 시스템 상태 모니터링 차트입니다.',
            },
        },
    },
}; 