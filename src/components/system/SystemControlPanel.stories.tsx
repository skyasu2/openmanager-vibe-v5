import type { Meta, StoryObj } from '@storybook/nextjs';
import { SystemControlPanel } from './SystemControlPanel';

const meta: Meta<typeof SystemControlPanel> = {
    title: 'System/SystemControlPanel',
    component: SystemControlPanel,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: '시스템 제어 패널 컴포넌트입니다. 서버 시작/중지, 모니터링 설정 등을 관리합니다.',
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

export const AdminMode: Story = {
    name: '관리자 모드',
    args: {},
    parameters: {
        docs: {
            description: {
                story: '관리자 권한으로 모든 시스템 기능을 제어할 수 있습니다.',
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
                story: '시스템 상태를 모니터링하고 실시간 데이터를 확인할 수 있습니다.',
            },
        },
    },
};

export const MaintenanceMode: Story = {
    name: '유지보수 모드',
    args: {},
    parameters: {
        docs: {
            description: {
                story: '시스템 유지보수를 위한 특별 모드입니다.',
            },
        },
    },
}; 