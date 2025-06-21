import type { Meta, StoryObj } from '@storybook/nextjs';
import ServerCard from './ServerCard';

const meta: Meta<typeof ServerCard> = {
    title: 'Dashboard/ServerCard',
    component: ServerCard,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: '개별 서버의 상태와 메트릭을 표시하는 카드 컴포넌트입니다.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockServerData = {
    id: 'server-01',
    name: '웹서버-01',
    type: 'web',
    status: 'active' as const,
    cpu: 45,
    memory: 62,
    disk: 78,
    network: 23,
    uptime: '5d 12h 30m',
    lastUpdate: new Date(),
};

export const Active: Story = {
    name: '활성 서버',
    args: {
        server: mockServerData,
    },
};

export const Warning: Story = {
    name: '경고 상태',
    args: {
        server: {
            ...mockServerData,
            id: 'server-02',
            name: '데이터베이스-01',
            type: 'database',
            status: 'warning' as const,
            cpu: 85,
            memory: 90,
            disk: 45,
            network: 67,
        },
    },
};

export const Error: Story = {
    name: '오류 상태',
    args: {
        server: {
            ...mockServerData,
            id: 'server-03',
            name: 'API서버-01',
            type: 'api',
            status: 'error' as const,
            cpu: 95,
            memory: 98,
            disk: 12,
            network: 89,
            uptime: '0d 0h 5m',
        },
    },
};

export const Maintenance: Story = {
    name: '유지보수 중',
    args: {
        server: {
            ...mockServerData,
            id: 'server-04',
            name: '백업서버-01',
            type: 'backup',
            status: 'maintenance' as const,
            cpu: 0,
            memory: 15,
            disk: 95,
            network: 0,
            uptime: '0d 0h 0m',
        },
    },
};

export const HighPerformance: Story = {
    name: '고성능 서버',
    args: {
        server: {
            ...mockServerData,
            id: 'server-05',
            name: '게임서버-01',
            type: 'game',
            status: 'active' as const,
            cpu: 25,
            memory: 35,
            disk: 55,
            network: 95,
            uptime: '30d 5h 15m',
        },
    },
};

export const MultipleCards: Story = {
    name: '여러 서버 카드',
    render: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ServerCard server={mockServerData} />
            <ServerCard server={{
                ...mockServerData,
                id: 'server-02',
                name: '데이터베이스-01',
                status: 'warning' as const,
                cpu: 85,
                memory: 90,
            }} />
            <ServerCard server={{
                ...mockServerData,
                id: 'server-03',
                name: 'API서버-01',
                status: 'error' as const,
                cpu: 95,
                memory: 98,
            }} />
        </div>
    ),
    parameters: {
        layout: 'fullscreen',
    },
}; 